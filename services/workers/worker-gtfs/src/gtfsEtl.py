from datetime import datetime
from io import BytesIO
import json
import requests
import zipfile
import pandas as pd
import logging
from dotenv import load_dotenv
import os
from sqlalchemy import create_engine, text
from typing import Optional
import builtins
import pytz


'''
REmove after
'''
original_print = builtins.print

def custom_print(*args, **kwargs):
  kwargs['flush'] = True
  original_print(*args, **kwargs)

builtins.print = custom_print
'''
REmove after
'''


# Set logging
logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s - %(message)s')

# Load env variables
load_dotenv()

# Connect to DB
db_host = os.getenv('DB_HOST')
db_port = os.getenv('DB_PORT')
db_database = os.getenv('DB_DATABASE')
db_username = os.getenv('DB_USERNAME')
db_password = os.getenv('DB_PASSWORD')
engine = create_engine(f'postgresql://{db_username}:{db_password}@{db_host}:{db_port}/{db_database}')

# with engine.connect() as connection:
#   result = connection.execute(text("SELECT 1"))
#   for row in result:
#     print(row)

# Get most recent gtfs metadata from DB to determine if latest gtfs download is newer.
def get_gtfs_metadata_from_db():
  return {
    'updated': datetime.fromisoformat('2024-06-14T00:20:06.581Z'.replace('Z', '+00:00'))
  }


'''
  Download metadata and compare to DB metadata to determine if it's newer. If newer, download ZIP file
  and return bytes.
'''
def download_data_if_new(url: str) -> Optional[bytes]:
    # Read the local GTFS zip file
  with open('./src/google_transit.zip', 'rb') as f:
    return f.read()

  # TODO 
  # TODO 
  # TODO GET HEAD AND CHECK FOR CHANGES
  # Get most recently loaded gtfs metadata.
  last_gtfs_metadata = get_gtfs_metadata_from_db()


  # Download GTFS metadata. 
  response_metadata = requests.get(url)
  response_metadata.raise_for_status()
  response_metadata_obj = json.loads(response_metadata.text)
  response_updated = datetime.fromisoformat(response_metadata_obj['updated'].replace('Z', '+00:00'))


  # Compare downloaded gtfs metadata to most recently ETL metadata and return if its the same or older.
  if response_updated <= last_gtfs_metadata['updated']:
    return None

  # Extract gtfs file
  logging.info('New files. Extracting.')

  response_gtfs = requests.get(response_metadata_obj['mediaLink'])
  response_gtfs.raise_for_status()

  return response_gtfs.content


''' 
  Load data, clean, and return dataframe.
'''
def transform_data(data: BytesIO, file_name: str) -> pd.DataFrame:
  hnl_time = pytz.timezone('Pacific/Honolulu')
  df = pd.read_csv(data)

  print(f'{file_name} - {df.shape}-----------')

  # Transform dates which come in as int representing YYYYMMDD to datetime and adjust to Honolulu timezone
  if 'date' in df.columns:
    df['date'] = pd.to_datetime(df['date'].astype(str), format='%Y%m%d')
    df['date'] = df['date'].dt.tz_localize(hnl_time)
  if 'start_date' in df.columns:
    df['start_date'] = pd.to_datetime(df['start_date'].astype(str), format='%Y%m%d')
    df['start_date'] = df['start_date'].dt.tz_localize(hnl_time)
  if 'end_date' in df.columns:
    df['end_date'] = pd.to_datetime(df['end_date'].astype(str), format='%Y%m%d')
    df['end_date'] = df['end_date'].dt.tz_localize(hnl_time)
  

  print(df.info())
  print('\n\nisnull sum------------')
  print(df.isnull().sum())
  print('\n\ndescribe------------')
  print(df.describe())
  duplicates = df[df.duplicated(keep=False)]
  print('Duplicates: ', len(duplicates))
  



  
  return None


def main():
  url = "https://www.thebus.org/transitdata/production/google_transit.zip"
  job_status = {
    'status': 'failed',
    'message': 'Initialing'
  }

  # Download data
  data_bytes = download_data_if_new(url)
  if data_bytes is None:
    logging.info('Same file. Ending')
    job_status['status'] = 'success'
    job_status['message'] = 'File unchanged since last ETL.'
    return job_status

  # Extract response.context into Zipfile
  with zipfile.ZipFile(BytesIO(data_bytes), 'r') as zip_ref:
    # Get list of file names
    csv_files = [f for f in zip_ref.namelist() if f.endswith('txt')]

    # Loop over each file and extract into pandas dataframe.
    for csv_file in csv_files:
      # Skip these tables.
      if csv_file == 'agency.txt' or csv_file == 'feed_info.txt': continue
      if 'calendar.txt' != csv_file: continue

      with zip_ref.open(csv_file) as file:
        df = transform_data(BytesIO(file.read()), csv_file)


print(main())