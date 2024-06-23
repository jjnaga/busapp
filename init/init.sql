CREATE SCHEMA IF NOT EXISTS gtfs;
CREATE SCHEMA IF NOT EXISTS thebus;

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
  shape_id VARCHAR(17),
  trip_headsign_short VARCHAR(39),
  apc_trip_id INT,
  display_code VARCHAR(10),
  trip_serial_number INT,
  block VARCHAR(9)
);

CREATE TABLE IF NOT EXISTS gtfs.shapes (
  shape_id VARCHAR(255),
  shape_pt_lat DOUBLE PRECISION,
  shape_pt_lon DOUBLE PRECISION,
  shape_pt_sequence INT,
  PRIMARY KEY (shape_id, shape_pt_sequence)
);

CREATE TABLE IF NOT EXISTS gtfs.last_checked (
    last_modified TIMESTAMP NOT NULL
);

CREATE OR REPLACE FUNCTION gtfs.perform_gtfs_upserts()
RETURNS INTEGER
LANGUAGE plpgsql as 
$$
DECLARE
    v_table_record RECORD;
    v_column_record RECORD;
    v_table_name TEXT;
    v_staging_table_name TEXT;
    v_primary_key_cols TEXT;
    v_non_primary_key_cols TEXT;
    v_upsert_sql TEXT;
    v_total_affected_rows INTEGER DEFAULT 0;
   	v_affected_rows INTEGER;
BEGIN
    -- Loop through all tables in the gtfs schema that do not have '_staging' or 'last_checked' in the name.
    FOR v_table_record IN 
			select
				t.table_name
			from
				information_schema.tables t
			where
				t.table_schema = 'gtfs'
				and t.table_type = 'BASE TABLE'
				and t.table_name not like '%_staging%'
				and t.table_name not like '%last_checked%'
    loop

        v_table_name := v_table_record.table_name;
        v_staging_table_name := v_table_name || '_staging';
        
        -- Create 'ON CONFLICT' statement from primary keys
				select
					string_agg(kcu.column_name, ', ') 
				into 
					v_primary_key_cols
				from
					information_schema.key_column_usage kcu
				join information_schema.table_constraints tc
				  on kcu.constraint_name = tc.constraint_name
					and kcu.constraint_schema = tc.constraint_schema
				where
					kcu.table_schema = 'gtfs'
					and kcu.table_name = v_table_name
					and tc.constraint_type = 'PRIMARY KEY';

        -- Create conflict update statements from non primary key columns
				select
					string_agg(c.column_name || ' = EXCLUDED.' || c.column_name, ', ') 
				into 
					v_non_primary_key_cols
				from
					information_schema.columns c
				where
					c.table_schema = 'gtfs'
					and c.table_name = v_table_name
					and c.column_name not in (
						select
							kcu.column_name
						from
							information_schema.key_column_usage kcu
						join information_schema.table_constraints tc
							on kcu.constraint_name = tc.constraint_name
							and kcu.constraint_schema = tc.constraint_schema
						where
							kcu.table_schema = 'gtfs'
							and kcu.table_name = v_table_name
							and tc.constraint_type = 'PRIMARY KEY'
          );
        
				-- Build UPSERT SQL statement
        v_upsert_sql := format(
            'INSERT INTO gtfs.%I (%s) SELECT %s FROM gtfs.%I ON CONFLICT (%s) DO UPDATE SET %s;',
            v_table_name,
						(
							select
								string_agg(c.column_name,
								', ')
							from
								information_schema.columns c
							where
								c.table_schema = 'gtfs'
								and c.table_name = v_table_name
						),
						(
							select
								string_agg(c.column_name,
								', ')
							from
								information_schema.columns c
							where
								c.table_schema = 'gtfs'
								and c.table_name = v_table_name
						),
            v_staging_table_name,
            v_primary_key_cols,
            v_non_primary_key_cols
        );

				RAISE NOTICE 'UPSERT SQL: %', v_upsert_sql;

				-- Execute the UPSERT SQL statement
				EXECUTE v_upsert_sql;

        -- Get affected rows
        GET DIAGNOSTICS v_affected_rows = ROW_COUNT;

        v_total_affected_rows := v_total_affected_rows + v_affected_rows;

        RAISE NOTICE '%: Affected rows is %', v_table_name, v_affected_rows;
    END LOOP;
    RAISE NOTICE 'v_total_affected_rows is %', v_total_affected_rows;
    RETURN v_total_affected_rows;
END $$
;