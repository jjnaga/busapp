from datetime import datetime
from io import BytesIO
import requests
import zipfile
import pandas as pd
import logging
from dotenv import load_dotenv
import os
import argparse  # Add this import
from sqlalchemy import Engine, create_engine, text, exc
from typing import Optional
import pytz

# Set logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

# Load env variables
load_dotenv()

def load_shape_id_mapping(engine: Engine) -> dict:
    """Load existing shape_id mappings from the database"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text(
                "SELECT original_shape_id, numeric_shape_id FROM gtfs.shape_id_mapping"
            ))
            mappings = {row[0]: row[1] for row in result}
            logging.info(f"Loaded {len(mappings)} existing shape_id mappings from database")
            return mappings
    except Exception as e:
        logging.warning(f"Could not load shape_id mapping: {e}")
        return {}

def store_shape_id_mapping(engine: Engine, mappings: dict) -> None:
    """Store new shape_id mappings in the database"""
    if not mappings:
        return
        
    try:
        # Convert mappings to DataFrame for easier insertion
        df = pd.DataFrame([
            {'original_shape_id': orig, 'numeric_shape_id': num_id} 
            for orig, num_id in mappings.items()
        ])
        
        # Insert into database
        df.to_sql('shape_id_mapping', engine, 
                  schema='gtfs', 
                  if_exists='append', 
                  index=False)
            
        logging.info(f"Stored {len(mappings)} shape_id mappings in database")
    except Exception as e:
        logging.error(f"Failed to store shape_id mappings: {e}")


""" 
    Call upsert procedure set in init.sql for the Postgres docker instance which runs an upsert on each staging table.
"""


def run_upsert_procedure(engine: Engine) -> int:
    try:
        with engine.begin() as connection:
            logging.info("Calling procedure perform_gtfs_upserts")
            result = connection.execute(text("SELECT gtfs.perform_gtfs_upserts()"))

            total_affected_rows = result.scalar()

            logging.info("Calling procedure perform_gtfs_upserts: OK")
            return total_affected_rows
    except exc.DBAPIError as e:
        logging.error(
            f"Calling procedure perform_gtfs_upserts() threw an error: {e.orig}"
        )
        raise
    except Exception as e:
        logging.error(f"run_upsert_procedure() error: {e}")
        raise


"""
    Get most recent gtfs metadata from DB to determine if latest gtfs download is newer.
"""


def get_gtfs_metadata_from_db(engine: Engine) -> str:
    with engine.connect() as connection:
        # SQL query with COALESCE to handle NULL and return epoch time if needed
        result = connection.execute(
            text(
                """
                SELECT 
                    COALESCE(MAX(last_modified), TIMESTAMP '1970-01-01 00:00:00') 
                FROM 
                    gtfs.last_checked 
                """
            )
        )
        last_modified_timestamp = (
            result.scalar()
        )  # Fetches the first column of the first row

        return last_modified_timestamp


"""
    Upsert gtfs.last_checked with current timestamp so in future jobs, if thebus GTFS file is unmodified, we skip 
    processing.
"""


def update_gtfs_last_checked(engine: Engine) -> None:
    try:
        with engine.connect() as connection:
            # Begin a transaction
            with connection.begin():
                # SQL command to update the last_checked table
                sql = text(
                    """
                    UPDATE 
                    gtfs.last_checked
                    SET 
                    last_modified = CURRENT_TIMESTAMP;
                    
                    -- If no rows were updated, insert a new row
                    INSERT INTO 
                    gtfs.last_checked (last_modified)
                    SELECT 
                    CURRENT_TIMESTAMP
                    WHERE 
                    NOT EXISTS (SELECT 1 FROM gtfs.last_checked);
                    """
                )

                connection.execute(sql)

                logging.info("Updated gtfs.last_checked with current timestamp")
    except Exception as e:
        logging.error(f"Error updating gtfs.last_checked: {e}")
        raise


"""
  Download metadata and compare to DB metadata to determine if it's newer. If newer, download ZIP file and return bytes.
"""


def download_data_if_new(engine: Engine, url: str) -> Optional[bytes]:
    logging.info("Downloading data")

    # Get most recently loaded gtfs metadata.
    last_gtfs_metadata = get_gtfs_metadata_from_db(engine)

    # Download GTFS metadata.
    response = requests.head(url)
    response.raise_for_status()

    last_modified_header = response.headers.get("Last-Modified")
    last_modified_timestamp = datetime.strptime(
        last_modified_header, "%a, %d %b %Y %H:%M:%S GMT"
    )

    if last_modified_timestamp <= last_gtfs_metadata:
        logging.info(
            "Downloading data: GTFS file is same or newer as previous ETL. Returning None"
        )
        return None

    # Extract gtfs file
    logging.info("Downloading data: File is new. Extracting.")

    response_gtfs = requests.get(url)
    response_gtfs.raise_for_status()

    logging.info("Downloading data: OK")
    return response_gtfs.content


""" 
  Load data, clean, and return dataframe.
"""


def transform_data(data: BytesIO, file_name: str, engine: Engine) -> pd.DataFrame:
    logging.info("Transforming data")
    hnl_time = pytz.timezone("Pacific/Honolulu")
    df = pd.read_csv(data)

    logging.info(f"Transforming data: {file_name} - {df.shape}")

    # Transform dates which come in as int representing YYYYMMDD to datetime and adjust to Honolulu timezone
    if "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"].astype(str), format="%Y%m%d")
        df["date"] = df["date"].dt.tz_localize(hnl_time)
    if "start_date" in df.columns:
        df["start_date"] = pd.to_datetime(df["start_date"].astype(str), format="%Y%m%d")
        df["start_date"] = df["start_date"].dt.tz_localize(hnl_time)
    if "end_date" in df.columns:
        df["end_date"] = pd.to_datetime(df["end_date"].astype(str), format="%Y%m%d")
        df["end_date"] = df["end_date"].dt.tz_localize(hnl_time)
        
    # Handle shape_id conversion for shapes.txt and trips.txt files
    if "shape_id" in df.columns :
    #and (file_name == "shapes.txt" or file_name == "trips.txt"):
        # First check for NaN values before any processing
        if df["shape_id"].isna().any():
            logging.warning(f"Found {df['shape_id'].isna().sum()} NaN shape_ids in {file_name}, filling with placeholder")
            df["shape_id"] = df["shape_id"].fillna("MISSING_ID")
        
        logging.info(f"Processing shape_ids in {file_name} - keeping original numeric IDs")
        
        # Identify which IDs are numeric vs non-numeric
        numeric_mask = df["shape_id"].astype(str).str.match(r'^\d+$')
        non_numeric_ids = df.loc[~numeric_mask, "shape_id"].unique()
        
        logging.info(f"Found {sum(numeric_mask)} numeric shape_ids to keep as-is")
        logging.info(f"Found {len(non_numeric_ids)} non-numeric shape_ids that need mapping")
        
        # Load existing mappings
        id_mapping = load_shape_id_mapping(engine)
        
        # Find highest existing numeric ID to continue from there
        next_id = 808000000 # default for first load
        if id_mapping and len(id_mapping) > 0:
            next_id = max(id_mapping.values()) + 1
            logging.info(f"Starting with next_id: {next_id} based on existing mappings")
        
        # Create new mappings for any new non-numeric shape_ids
        new_mappings = {}
        for original_id in non_numeric_ids:
            str_id = str(original_id)
            if str_id not in id_mapping:
                id_mapping[str_id] = next_id
                new_mappings[str_id] = next_id
                next_id += 1
        
        # Store new mappings if any
        if new_mappings:
            store_shape_id_mapping(engine, new_mappings)
            logging.info(f"Created {len(new_mappings)} new shape_id mappings")
        
        # Apply mappings only for non-numeric IDs, keeping numeric ones as-is
        mapped_values = []
        id_counts = {}
        
        for shape_id in df["shape_id"]:
            str_id = str(shape_id)
            
            # If it's numeric, keep the original value (converting to int)
            if str_id.isdigit():
                numeric_id = int(str_id)
                mapped_values.append(numeric_id)
                id_counts[numeric_id] = id_counts.get(numeric_id, 0) + 1
                
            # If non-numeric, use mapping
            elif str_id in id_mapping:
                numeric_id = id_mapping[str_id]
                mapped_values.append(numeric_id)
                id_counts[numeric_id] = id_counts.get(numeric_id, 0) + 1
                
            # Fallback - should never happen?
            else:
                fallback_id = next_id + int(hash(str_id)) % 1000
                mapped_values.append(fallback_id)
                logging.warning(f"Using fallback ID {fallback_id} for unmapped shape_id: {str_id}")
        
        # Replace the shape_id column with our mapped values
        df["shape_id"] = mapped_values
        
        if file_name == "shapes.txt":
            # Count records before deduplication
            df_size_before = len(df)
            df = df.drop_duplicates(subset=['shape_id', 'shape_pt_sequence'])
            df_size_after = len(df)
            
            if df_size_before != df_size_after:
                logging.warning(f"Removed {df_size_before - df_size_after} duplicate rows through deduplication. THIS SHOULD HAPPEN??")
        
        # Ensure shape_ids are integers
        df["shape_id"] = df["shape_id"].astype(int)
    
    if file_name == "stop_times.txt":
        # Transform times which come in as string representing hh24:mm:ss to datetime and extract time
        df["stop_id"] = df["stop_id"].astype(str)
        df["arrival_time"] = (
            pd.to_timedelta(df["arrival_time"]).dt.total_seconds().astype(int)
        )
        df["departure_time"] = (
            pd.to_timedelta(df["departure_time"]).dt.total_seconds().astype(int)
        )
        # Drop unused columns
        df = df.drop("stop_headsign", axis=1)
        df = df.drop("timepoint", axis=1)

    # Drop unused columns in routes.
    if file_name == "routes.txt":
        df = df.drop("route_desc", axis=1)
        df = df.drop("route_color", axis=1)
        df = df.drop("route_text_color", axis=1)

    if file_name == "stops.txt":
        df["stop_id"] = df["stop_id"].astype(str)
        df = df.drop("stop_desc", axis=1)
        df = df.drop("zone_id", axis=1)
        df = df.drop("location_type", axis=1)
        df = df.drop("parent_station", axis=1)

    logging.info("Transforming data: OK")
    return df


def main():
    # Connect to DB
    db_host = os.getenv("DB_HOST")
    db_port = os.getenv("DB_PORT")
    db_database = os.getenv("DB_DATABASE")
    db_username = os.getenv("DB_USERNAME")
    db_password = os.getenv("DB_PASSWORD")
    gtfs_url = os.getenv("GTFS_URL")

    pg_sqlalchemy_engine = create_engine(
        f"postgresql://{db_username}:{db_password}@{db_host}:{db_port}/{db_database}"
    )

    job_status = {"status": "failed", "message": "Initializing"}

    # Download data with force parameter
    try:
        data_bytes = download_data_if_new(pg_sqlalchemy_engine, gtfs_url)
    except Exception as e:
        logging.error("GTFS fetch failed.")
        job_status["message"] = f"Unable to fetch GTFS file. Error: {str(e)}"
        return job_status

    # download_data_if_new returns None if the file is the same.
    if data_bytes is None:
        logging.info("Same file. Ending")
        job_status["status"] = "success"
        job_status["message"] = "File unchanged since last ETL."
        return job_status

    # Extract response.context into Zipfile
    with zipfile.ZipFile(BytesIO(data_bytes), "r") as zip_ref:
        # Get list of file names
        csv_files = [f for f in zip_ref.namelist() if f.endswith("txt")]

        # Loop over each file, extract into pandas dataframe, and load into staging tables.
        for csv_file in csv_files:
            # Skip these files.
            if csv_file == "agency.txt" or csv_file == "feed_info.txt":
                continue

            # Load data into staging tables.
            with zip_ref.open(csv_file) as file:
                try:
                    # Transform data
                    df = transform_data(BytesIO(file.read()), csv_file, pg_sqlalchemy_engine)

                    # Table name is the name of the GTFS file minus the file extension
                    table_name = csv_file[: csv_file.rfind(".")]

                    # Load into staging table
                    logging.info(f"{table_name}: Inserting into staging")
                    df.to_sql(
                        f"{table_name}_staging",
                        con=pg_sqlalchemy_engine,
                        schema="gtfs",
                        index=False,
                        if_exists="replace",
                    )

                    logging.info(f"{table_name}: Inserting into staging: OK")
                except Exception as e:
                    job_status["message"] = (
                        f"Unable to load {csv_file}. Error: {str(e)}"
                    )
                    return job_status

    # Upsert from staging into real tables via procedure
    try:
        logging.info("Running upsert procedure")
        total_affected_rows = run_upsert_procedure(pg_sqlalchemy_engine)
        logging.info(
            f"Running upsert procedure: OK. {total_affected_rows} rows upserted."
        )
    except Exception as e:
        job_status["message"] = f"Unable to run upsert procedure: {e}"
        return job_status

    # ETL complete. Update gtfs.last_checked with the current time so job won't run until next GTFS update
    try:
        logging.info("Updating last checked timestamp")
        update_gtfs_last_checked(pg_sqlalchemy_engine)
        logging.info("Updating last checked timestamp: OK")
    except Exception as e:
        job_status["message"] = (
            f"Unable to update last_checked timestamp in gtfs.last_checked: {e}"
        )
        return job_status

    job_status["status"] = "success"
    job_status["message"] = f"GTFS updated. Rows affected is {total_affected_rows}"
    return job_status


# Export main function that preserves the original signature for compatibility
run_gtfs_etl = main

if __name__ == "__main__":
    job_status = main()
    logging.info(f"Job status is: {job_status}")
