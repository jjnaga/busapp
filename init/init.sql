CREATE SCHEMA IF NOT EXISTS gtfs;
CREATE SCHEMA IF NOT EXISTS thebus;

CREATE TABLE IF NOT EXISTS thebus.subscription (
  id SERIAL PRIMARY KEY,
  subscription JSON NOT NULL
);

CREATE TYPE thebus.day_of_week AS ENUM ('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday');


CREATE TABLE IF NOT EXISTS thebus.notification (
  id SERIAL PRIMARY KEY,
  subscription JSON NOT NULL,
  frequency thebus.day_of_week[],
  notification_sent TIMESTAMPTZ,
  notification_data json NOT NULL,
  notification_date TIMESTAMPTZ NOT NULL
);



CREATE TABLE thebus.vehicle (
    bus_number TEXT PRIMARY KEY,
    trip_id TEXT,
    driver TEXT,
    latitude FLOAT,
    longitude FLOAT,
    adherence INTEGER,
    heartbeat TIMESTAMPTZ,
    route_name TEXT,
    headsign TEXT
);


CREATE TABLE IF NOT EXISTS gtfs.calendar (
    service_id         INTEGER NOT NULL PRIMARY KEY,
    monday             INTEGER NOT NULL,
    tuesday            INTEGER NOT NULL,
    wednesday          INTEGER NOT NULL,
    thursday           INTEGER NOT NULL,
    friday             INTEGER NOT NULL,
    saturday           INTEGER NOT NULL,
    sunday             INTEGER NOT NULL,
    start_date         TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date           TIMESTAMP WITH TIME ZONE NOT NULL,
    events_and_status  VARCHAR(15),
    operating_days     VARCHAR(21) NOT NULL,
    duty               VARCHAR(24)
);

CREATE TABLE IF NOT EXISTS gtfs.calendar_dates (
  service_id           INTEGER NOT NULL,
  date                 TIMESTAMP WITH TIME ZONE NOT NULL,
  exception_type       INTEGER NOT NULL,
  PRIMARY KEY (service_id, date)
);

CREATE TABLE IF NOT EXISTS gtfs.routes (
  route_id             VARCHAR(15) PRIMARY KEY,
  route_short_name     VARCHAR(5),
  route_long_name      VARCHAR(75),
  route_type           SMALLINT,
  agency_id            VARCHAR(15)
);

CREATE TABLE IF NOT EXISTS gtfs.stop_times (
  trip_id BIGINT,
  arrival_time INT, -- Arrival time is expressed in integer format denoting seconds since 12:00 AM
  departure_time INT, -- Departure time is expressed in integer format denoting seconds since 12:00 AM
  stop_id VARCHAR(15),
  stop_sequence INT,
  pickup_type INT,
  drop_off_type INT,
  shape_dist_traveled FLOAT,
  stop_code INT,
  PRIMARY KEY (trip_id, stop_sequence)
);

CREATE TABLE IF NOT EXISTS gtfs.stops (
  stop_id VARCHAR(13) PRIMARY KEY,
  stop_code BIGINT,
  stop_name VARCHAR(63),
  stop_lat DOUBLE PRECISION,
  stop_lon DOUBLE PRECISION,
  stop_url VARCHAR(52),
  stop_serial_number DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS gtfs.trips (
  route_id INT,
  service_id INT,
  trip_id INT PRIMARY KEY,
  trip_headsign VARCHAR(50),
  direction_id INT,
  block_id INT,
  shape_id int,
  trip_headsign_short VARCHAR(39),
  apc_trip_id INT,
  display_code VARCHAR(10),
  trip_serial_number INT,
  block VARCHAR(9)
);

CREATE INDEX IF NOT EXISTS idx_trips_shape_id ON gtfs.trips(shape_id);

CREATE TABLE IF NOT EXISTS gtfs.shapes (
  shape_id int,
  shape_pt_lat DOUBLE PRECISION,
  shape_pt_lon DOUBLE PRECISION,
  shape_pt_sequence INT,
  PRIMARY KEY (shape_id, shape_pt_sequence)
);

CREATE TABLE IF NOT EXISTS gtfs.shape_id_mapping (
  original_shape_id VARCHAR(15) PRIMARY KEY,
  numeric_shape_id INT
);

CREATE TABLE IF NOT EXISTS gtfs.last_checked (
    last_modified TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS thebus.vehicle_history (
    history_id SERIAL PRIMARY KEY,
    bus_number TEXT,
    trip_id TEXT,
    driver TEXT,
    latitude FLOAT,
    longitude FLOAT,
    adherence INTEGER,
    heartbeat TIMESTAMPTZ,
    route_name TEXT,
    headsign TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION gtfs.perform_gtfs_upserts()
RETURNS INTEGER
LANGUAGE plpgsql AS
$$
DECLARE
  v_table_record RECORD;
  v_column_record RECORD;
  v_table_name TEXT;
  v_staging_table_name TEXT;
  v_primary_key_cols TEXT;
  v_non_primary_key_cols TEXT;
  v_upsert_sql TEXT;
  v_dedupe_sql TEXT;
  v_total_affected_rows INTEGER DEFAULT 0;
  v_affected_rows INTEGER;
BEGIN
  -- Loop through all tables in the gtfs schema that do not have '_staging' or 'last_checked' in the name.
  FOR v_table_record IN 
    SELECT t.table_name
    FROM information_schema.tables t
    WHERE t.table_schema = 'gtfs'
      AND t.table_type = 'BASE TABLE'
      AND t.table_name NOT LIKE '%_staging%'
      AND t.table_name NOT LIKE '%last_checked%'
  LOOP
    v_table_name := v_table_record.table_name;
    v_staging_table_name := v_table_name || '_staging';
    
    -- Get primary key columns
    SELECT string_agg(kcu.column_name, ', ') 
    INTO v_primary_key_cols
    FROM information_schema.key_column_usage kcu
    JOIN information_schema.table_constraints tc
      ON kcu.constraint_name = tc.constraint_name
      AND kcu.constraint_schema = tc.constraint_schema
    WHERE kcu.table_schema = 'gtfs'
      AND kcu.table_name = v_table_name
      AND tc.constraint_type = 'PRIMARY KEY';

    -- SAFETY: First deduplicate the staging table to avoid "affect row a second time" error
    v_dedupe_sql := format(
      'CREATE TEMPORARY TABLE temp_%s AS 
       SELECT DISTINCT ON (%s) * FROM gtfs.%I;
       
       TRUNCATE gtfs.%I;
       INSERT INTO gtfs.%I SELECT * FROM temp_%s;
       DROP TABLE temp_%s;',
      v_staging_table_name,
      v_primary_key_cols,
      v_staging_table_name,
      v_staging_table_name,
      v_staging_table_name,
      v_staging_table_name,
      v_staging_table_name
    );
    
    -- Execute deduplication
    EXECUTE v_dedupe_sql;
    
    -- Get non-primary key columns for update statement
    SELECT string_agg(c.column_name || ' = EXCLUDED.' || c.column_name, ', ') 
    INTO v_non_primary_key_cols
    FROM information_schema.columns c
    WHERE c.table_schema = 'gtfs'
      AND c.table_name = v_table_name
      AND c.column_name NOT IN (
        SELECT kcu.column_name
        FROM information_schema.key_column_usage kcu
        JOIN information_schema.table_constraints tc
          ON kcu.constraint_name = tc.constraint_name
          AND kcu.constraint_schema = tc.constraint_schema
        WHERE kcu.table_schema = 'gtfs'
          AND kcu.table_name = v_table_name
          AND tc.constraint_type = 'PRIMARY KEY'
      );
    
    -- Build UPSERT SQL statement with columns list explicitly
    v_upsert_sql := format(
      'INSERT INTO gtfs.%I (%s) SELECT %s FROM gtfs.%I ON CONFLICT (%s) DO UPDATE SET %s;',
      v_table_name,
      (
        SELECT string_agg(c.column_name, ', ')
        FROM information_schema.columns c
        WHERE c.table_schema = 'gtfs'
          AND c.table_name = v_table_name
      ),
      (
        SELECT string_agg(c.column_name, ', ')
        FROM information_schema.columns c
        WHERE c.table_schema = 'gtfs'
          AND c.table_name = v_table_name
      ),
      v_staging_table_name,
      v_primary_key_cols,
      v_non_primary_key_cols
    );

    -- Execute the UPSERT SQL statement
    EXECUTE v_upsert_sql;

    -- Get affected rows
    GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
    v_total_affected_rows := v_total_affected_rows + v_affected_rows;
  END LOOP;
  
  RETURN v_total_affected_rows;
END
$$;

-- Create the trigger function to log changes.
CREATE OR REPLACE FUNCTION thebus.vehicle_audit_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
  -- For updates, log the old state before applying new values.
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO thebus.vehicle_history(
      bus_number, trip_id, driver, latitude, longitude, adherence, heartbeat, route_name, headsign, recorded_at
    )
    VALUES (
      OLD.bus_number, OLD.trip_id, OLD.driver, OLD.latitude, OLD.longitude, OLD.adherence, OLD.heartbeat, OLD.route_name, OLD.headsign, NOW()
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- For deletes, also log the old state.
    INSERT INTO thebus.vehicle_history(
      bus_number, trip_id, driver, latitude, longitude, adherence, heartbeat, route_name, headsign, recorded_at
    )
    VALUES (
      OLD.bus_number, OLD.trip_id, OLD.driver, OLD.latitude, OLD.longitude, OLD.adherence, OLD.heartbeat, OLD.route_name, OLD.headsign, NOW()
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on the current vehicle table.
DROP TRIGGER IF EXISTS vehicle_audit_trigger ON thebus.vehicle;
CREATE TRIGGER vehicle_audit_trigger
AFTER UPDATE OR DELETE ON thebus.vehicle
FOR EACH ROW EXECUTE FUNCTION thebus.vehicle_audit_trigger_fn();