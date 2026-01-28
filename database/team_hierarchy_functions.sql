-- Function to get all downline agents recursively
CREATE OR REPLACE FUNCTION get_team_hierarchy(manager_agent_code TEXT)
RETURNS TABLE (
  agent_code TEXT,
  full_name TEXT,
  rank TEXT,
  level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE team_tree AS (
    -- Base case: Direct reports (F1)
    SELECT 
      a.agent_code,
      a.full_name,
      a.rank,
      1 as level
    FROM agents a
    WHERE a.manager_code = manager_agent_code
      AND a.status = 'Active'
    
    UNION ALL
    
    -- Recursive case: Indirect reports (F2, F3, ...)
    SELECT 
      a.agent_code,
      a.full_name,
      a.rank,
      tt.level + 1
    FROM agents a
    INNER JOIN team_tree tt ON a.manager_code = tt.agent_code
    WHERE a.status = 'Active'
  )
  SELECT * FROM team_tree;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate team performance for a given month
CREATE OR REPLACE FUNCTION calculate_team_performance(
  manager_agent_code TEXT,
  report_month TEXT  -- Format: YYYY-MM
)
RETURNS TABLE (
  personal_fyp NUMERIC,
  team_fyp NUMERIC,
  active_agents INTEGER,
  total_team_size INTEGER
) AS $$
DECLARE
  v_personal_fyp NUMERIC;
  v_team_fyp NUMERIC;
  v_active_count INTEGER;
  v_total_count INTEGER;
BEGIN
  -- Get personal FYP (manager's own sales)
  SELECT COALESCE(SUM(c.fyp), 0)
  INTO v_personal_fyp
  FROM contracts c
  WHERE c.agent_code = manager_agent_code
    AND TO_CHAR(c.submit_date, 'YYYY-MM') = report_month
    AND c.status IN ('Issued', 'Ack');
  
  -- Get team FYP (all downline agents)
  WITH RECURSIVE team_tree AS (
    SELECT agent_code
    FROM agents
    WHERE manager_code = manager_agent_code
      AND status = 'Active'
    
    UNION ALL
    
    SELECT a.agent_code
    FROM agents a
    INNER JOIN team_tree tt ON a.manager_code = tt.agent_code
    WHERE a.status = 'Active'
  )
  SELECT 
    COALESCE(SUM(c.fyp), 0),
    COUNT(DISTINCT CASE WHEN c.fyp > 0 THEN c.agent_code END),
    COUNT(DISTINCT tt.agent_code)
  INTO v_team_fyp, v_active_count, v_total_count
  FROM team_tree tt
  LEFT JOIN contracts c ON c.agent_code = tt.agent_code
    AND TO_CHAR(c.submit_date, 'YYYY-MM') = report_month
    AND c.status IN ('Issued', 'Ack');
  
  RETURN QUERY SELECT v_personal_fyp, v_team_fyp, v_active_count, v_total_count;
END;
$$ LANGUAGE plpgsql;
