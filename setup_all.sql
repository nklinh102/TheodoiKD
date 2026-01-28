-- ========================================================
-- SUPABASE COMPLETE SETUP SCRIPT
-- Copy and paste this entire file into your SQL Editor
-- ========================================================

-- 1. Cleanup existing functions (to avoid return type mismatch errors)
DROP FUNCTION IF EXISTS get_dashboard_summary(TEXT);
DROP FUNCTION IF EXISTS get_team_hierarchy(TEXT);
DROP FUNCTION IF EXISTS calculate_team_performance(TEXT, TEXT);

-- 2. Create Tables
CREATE TABLE IF NOT EXISTS agents (
    agent_code TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    rank TEXT DEFAULT 'FA',
    manager_code TEXT REFERENCES agents(agent_code),
    join_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contracts (
    policy_number TEXT PRIMARY KEY,
    agent_code TEXT REFERENCES agents(agent_code),
    customer_name TEXT,
    product_code TEXT,
    submit_date DATE NOT NULL,
    issue_date DATE,
    fyp NUMERIC DEFAULT 0,
    ape NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Dashboard Summary Function
CREATE OR REPLACE FUNCTION get_dashboard_summary(report_month TEXT)
RETURNS TABLE (
  total_fyp_current NUMERIC,
  total_fyp_previous NUMERIC,
  total_cc_current INTEGER,
  total_agents_current INTEGER,
  active_agents_current INTEGER,
  new_recruitment_current INTEGER
) AS $$
DECLARE
  v_previous_month TEXT;
BEGIN
  v_previous_month := TO_CHAR((TO_DATE(report_month || '-01', 'YYYY-MM-DD') - INTERVAL '1 month'), 'YYYY-MM');

  RETURN QUERY
  SELECT 
    COALESCE((SELECT SUM(fyp) FROM contracts WHERE TO_CHAR(submit_date, 'YYYY-MM') = report_month AND status IN ('Issued', 'Ack')), 0)::NUMERIC,
    COALESCE((SELECT SUM(fyp) FROM contracts WHERE TO_CHAR(submit_date, 'YYYY-MM') = v_previous_month AND status IN ('Issued', 'Ack')), 0)::NUMERIC,
    COALESCE((SELECT COUNT(*)::INTEGER FROM contracts WHERE TO_CHAR(submit_date, 'YYYY-MM') = report_month AND status IN ('Issued', 'Ack')), 0),
    COALESCE((SELECT COUNT(*)::INTEGER FROM agents WHERE status = 'Active'), 0),
    COALESCE((SELECT COUNT(DISTINCT agent_code)::INTEGER FROM contracts WHERE TO_CHAR(submit_date, 'YYYY-MM') = report_month AND status IN ('Issued', 'Ack') AND fyp > 0), 0),
    COALESCE((SELECT COUNT(*)::INTEGER FROM agents WHERE TO_CHAR(join_date, 'YYYY-MM') = report_month), 0);
END;
$$ LANGUAGE plpgsql;

-- 3. Team Hierarchy Functions
CREATE OR REPLACE FUNCTION get_team_hierarchy(manager_agent_code TEXT)
RETURNS TABLE (
  agent_code TEXT,
  full_name TEXT,
  rank TEXT,
  manager_code TEXT,
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
      a.manager_code,
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
      a.manager_code,
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

-- 4. Sample View for Performance
CREATE OR REPLACE VIEW agent_dashboard_performance AS
SELECT 
    a.agent_code,
    a.full_name,
    a.rank,
    a.status as agent_status,
    a.manager_code,
    COALESCE(SUM(CASE WHEN c.status IN ('Issued', 'Ack') THEN c.fyp ELSE 0 END), 0) as personal_fyp,
    COUNT(CASE WHEN c.status IN ('Issued', 'Ack') THEN 1 END) as cc_count
FROM agents a
LEFT JOIN contracts c ON a.agent_code = c.agent_code
GROUP BY a.agent_code, a.full_name, a.rank, a.status, a.manager_code;
