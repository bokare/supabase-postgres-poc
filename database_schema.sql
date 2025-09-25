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

  CREATE POLICY "Users can insert simulation events" ON simulation_events
    FOR INSERT WITH CHECK (true);
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

  -- Get the latest event
  SELECT * INTO latest_event
  FROM simulation_events
  ORDER BY timestamp DESC
  LIMIT 1;

  -- Validate event sequence
  IF latest_event.event_id IS NOT NULL THEN
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
  END IF;

  -- Insert the new event
  INSERT INTO simulation_events (event_type, user_id)
  VALUES (p_event_type, p_user_id);

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
