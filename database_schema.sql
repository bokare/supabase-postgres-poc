-- Create simulation_events table (safe to run multiple times)
CREATE TABLE IF NOT EXISTS simulation_events (
  event_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  event_type TEXT NOT NULL CHECK (event_type IN ('simulation_started', 'simulation_stopped')),
  user_id TEXT NOT NULL
);

-- Create indexes for better performance (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_simulation_events_event_type ON simulation_events(event_type);
CREATE INDEX IF NOT EXISTS idx_simulation_events_user_id ON simulation_events(user_id);
CREATE INDEX IF NOT EXISTS idx_simulation_events_timestamp ON simulation_events(timestamp);

-- Enable Row Level Security (RLS) - safe to run multiple times
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class 
    WHERE relname = 'simulation_events' 
    AND relrowsecurity = true
  ) THEN
    ALTER TABLE simulation_events ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create RLS policies for simulation_events table (safe to run multiple times)
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view all simulation events" ON simulation_events;
  DROP POLICY IF EXISTS "Users can insert simulation events" ON simulation_events;
  
  -- Create policies
  CREATE POLICY "Users can view all simulation events" ON simulation_events
    FOR SELECT USING (true);

  -- Create a policy that enforces validation at the database level
  -- This prevents direct inserts that would violate business rules
  CREATE POLICY "Users can insert simulation events with validation" ON simulation_events
    FOR INSERT WITH CHECK (
      -- Only allow insert if the latest event is different from the new event type
      -- This prevents duplicate consecutive events (start->start or stop->stop)
      NOT EXISTS (
        SELECT 1 FROM (
          SELECT event_type 
          FROM simulation_events 
          ORDER BY timestamp DESC 
          LIMIT 1
        ) latest 
        WHERE latest.event_type = simulation_events.event_type
      )
    );
END $$;

-- Create a function to validate and insert simulation events (safe to run multiple times)
CREATE OR REPLACE FUNCTION insert_simulation_event(
  p_event_type TEXT,
  p_user_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  latest_event simulation_events%ROWTYPE;
  result JSON;
BEGIN
  -- Validate input parameters
  IF p_event_type NOT IN ('simulation_started', 'simulation_stopped') THEN
    result := json_build_object(
      'success', false,
      'error', 'Invalid event type. Must be simulation_started or simulation_stopped'
    );
    RETURN result;
  END IF;

  IF p_user_id IS NULL OR p_user_id = '' THEN
    result := json_build_object(
      'success', false,
      'error', 'User ID cannot be null or empty'
    );
    RETURN result;
  END IF;

  -- Get the latest event with FOR UPDATE to prevent race conditions
  SELECT * INTO latest_event
  FROM simulation_events
  ORDER BY timestamp DESC
  LIMIT 1
  FOR UPDATE;

  -- Validate event sequence with row-level locking to prevent race conditions
  IF latest_event.event_id IS NOT NULL THEN
    -- Debug: Log the validation check
    RAISE NOTICE 'Validating event: new_type=%, latest_type=%, latest_time=%', 
      p_event_type, latest_event.event_type, latest_event.timestamp;
    
    -- Check if the new event type is valid based on the previous event
    IF latest_event.event_type = p_event_type THEN
      -- Same event type as the latest event - this is invalid
      result := json_build_object(
        'success', false,
        'error', 'Invalid event sequence: Cannot ' || 
        CASE 
          WHEN p_event_type = 'simulation_started' THEN 'start simulation when it is already running'
          WHEN p_event_type = 'simulation_stopped' THEN 'stop simulation when it is already stopped'
        END,
        'current_status', latest_event.event_type,
        'last_event_time', latest_event.timestamp
      );
      RETURN result;
    END IF;
  ELSE
    RAISE NOTICE 'No previous events found, allowing new event: %', p_event_type;
  END IF;

  -- Insert the new event
  INSERT INTO simulation_events (event_type, user_id)
  VALUES (p_event_type, p_user_id);
  
  -- Debug: Log successful insertion
  RAISE NOTICE 'Event inserted successfully: type=%, user=%, time=%', 
    p_event_type, p_user_id, NOW();
  
  -- Get the inserted event for response
  SELECT * INTO latest_event
  FROM simulation_events
  WHERE event_id = (SELECT event_id FROM simulation_events ORDER BY timestamp DESC LIMIT 1);

  -- Return success response
  result := json_build_object(
    'success', true,
    'message', 'Event logged successfully',
    'event_type', p_event_type,
    'user_id', p_user_id,
    'timestamp', NOW()
  );

  RETURN result;
END;
$$;

-- Grant execute permission on the function (safe to run multiple times)
DO $$
BEGIN
  -- Grant permissions if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.routine_privileges 
    WHERE routine_name = 'insert_simulation_event' 
    AND grantee = 'authenticated'
  ) THEN
    GRANT EXECUTE ON FUNCTION insert_simulation_event(TEXT, TEXT) TO authenticated;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.routine_privileges 
    WHERE routine_name = 'insert_simulation_event' 
    AND grantee = 'anon'
  ) THEN
    GRANT EXECUTE ON FUNCTION insert_simulation_event(TEXT, TEXT) TO anon;
  END IF;
END $$;

-- =============================================
-- TEMPERATURE MONITORING SYSTEM
-- =============================================

-- Create checkup_events table for temperature monitoring (safe to run multiple times)
CREATE TABLE IF NOT EXISTS checkup_events (
  checkup_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  temperature INTEGER NOT NULL CHECK (temperature >= 0 AND temperature <= 100),
  status TEXT NOT NULL CHECK (status IN ('normal', 'critical')),
  simulation_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_checkup_events_timestamp ON checkup_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_checkup_events_status ON checkup_events(status);
CREATE INDEX IF NOT EXISTS idx_checkup_events_simulation_id ON checkup_events(simulation_id);
CREATE INDEX IF NOT EXISTS idx_checkup_events_temperature ON checkup_events(temperature);

-- Enable Row Level Security (RLS) for checkup_events table (safe to run multiple times)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class 
    WHERE relname = 'checkup_events' 
    AND relrowsecurity = true
  ) THEN
    ALTER TABLE checkup_events ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create RLS policies for checkup_events table (safe to run multiple times)
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view all checkup events" ON checkup_events;
  DROP POLICY IF EXISTS "System can insert checkup events" ON checkup_events;
  
  -- Create policies
  CREATE POLICY "Users can view all checkup events" ON checkup_events
    FOR SELECT USING (true);

  -- Allow system to insert checkup events (for Edge Functions)
  CREATE POLICY "System can insert checkup events" ON checkup_events
    FOR INSERT WITH CHECK (true);
END $$;

-- Create function to insert checkup events with validation (safe to run multiple times)
CREATE OR REPLACE FUNCTION insert_checkup_event(
  p_temperature INTEGER,
  p_simulation_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_status TEXT;
  result JSON;
BEGIN
  -- Validate input parameters
  IF p_temperature < 0 OR p_temperature > 100 THEN
    result := json_build_object(
      'success', false,
      'error', 'Temperature must be between 0 and 100'
    );
    RETURN result;
  END IF;

  IF p_simulation_id IS NULL OR p_simulation_id = '' THEN
    result := json_build_object(
      'success', false,
      'error', 'Simulation ID cannot be null or empty'
    );
    RETURN result;
  END IF;

  -- Determine status based on temperature
  IF p_temperature >= 90 THEN
    event_status := 'critical';
  ELSE
    event_status := 'normal';
  END IF;

  -- Insert the checkup event
  INSERT INTO checkup_events (temperature, status, simulation_id)
  VALUES (p_temperature, event_status, p_simulation_id);
  
  -- Debug: Log successful insertion
  RAISE NOTICE 'Checkup event inserted: temp=%, status=%, sim_id=%', 
    p_temperature, event_status, p_simulation_id;

  -- Return success response
  result := json_build_object(
    'success', true,
    'message', 'Checkup event logged successfully',
    'temperature', p_temperature,
    'status', event_status,
    'simulation_id', p_simulation_id,
    'timestamp', NOW()
  );

  RETURN result;
END;
$$;

-- Create function to get active simulation ID (safe to run multiple times)
CREATE OR REPLACE FUNCTION get_active_simulation_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  latest_event RECORD;
  active_sim_id TEXT;
BEGIN
  -- Get the latest simulation event (regardless of type)
  SELECT event_type, user_id, timestamp INTO latest_event
  FROM simulation_events
  ORDER BY timestamp DESC
  LIMIT 1;

  -- Check if there are any events at all
  IF latest_event.event_type IS NULL THEN
    RETURN NULL;
  END IF;

  -- If the latest event is a start event, simulation is running
  IF latest_event.event_type = 'simulation_started' THEN
    active_sim_id := latest_event.user_id;
  -- If the latest event is a stop event, simulation is stopped
  ELSIF latest_event.event_type = 'simulation_stopped' THEN
    active_sim_id := NULL;
  -- Fallback (shouldn't happen with our constraints)
  ELSE
    active_sim_id := NULL;
  END IF;

  RETURN active_sim_id;
END;
$$;

-- Grant execute permissions on the functions (safe to run multiple times)
DO $$
BEGIN
  -- Grant permissions for insert_checkup_event
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.routine_privileges 
    WHERE routine_name = 'insert_checkup_event' 
    AND grantee = 'authenticated'
  ) THEN
    GRANT EXECUTE ON FUNCTION insert_checkup_event(INTEGER, TEXT) TO authenticated;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.routine_privileges 
    WHERE routine_name = 'insert_checkup_event' 
    AND grantee = 'anon'
  ) THEN
    GRANT EXECUTE ON FUNCTION insert_checkup_event(INTEGER, TEXT) TO anon;
  END IF;

  -- Grant permissions for get_active_simulation_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.routine_privileges 
    WHERE routine_name = 'get_active_simulation_id' 
    AND grantee = 'authenticated'
  ) THEN
    GRANT EXECUTE ON FUNCTION get_active_simulation_id() TO authenticated;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.routine_privileges 
    WHERE routine_name = 'get_active_simulation_id' 
    AND grantee = 'anon'
  ) THEN
    GRANT EXECUTE ON FUNCTION get_active_simulation_id() TO anon;
  END IF;
END $$;
