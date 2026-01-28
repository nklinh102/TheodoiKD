-- Function to get dashboard summary metrics
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
  -- Calculate previous month
  v_previous_month := TO_CHAR((TO_DATE(report_month || '-01', 'YYYY-MM-DD') - INTERVAL '1 month'), 'YYYY-MM');

  RETURN QUERY
  SELECT 
    -- Current Month FYP
    COALESCE((SELECT SUM(fyp) FROM contracts WHERE TO_CHAR(submit_date, 'YYYY-MM') = report_month AND status IN ('Issued', 'Ack')), 0)::NUMERIC,
    -- Previous Month FYP
    COALESCE((SELECT SUM(fyp) FROM contracts WHERE TO_CHAR(submit_date, 'YYYY-MM') = v_previous_month AND status IN ('Issued', 'Ack')), 0)::NUMERIC,
    -- Current CC (Contract Count)
    COALESCE((SELECT COUNT(*)::INTEGER FROM contracts WHERE TO_CHAR(submit_date, 'YYYY-MM') = report_month AND status IN ('Issued', 'Ack')), 0),
    -- Total Active Agents in month
    COALESCE((SELECT COUNT(*)::INTEGER FROM agents WHERE status = 'Active'), 0),
    -- Agents with at least 1 contract in month
    COALESCE((SELECT COUNT(DISTINCT agent_code)::INTEGER FROM contracts WHERE TO_CHAR(submit_date, 'YYYY-MM') = report_month AND status IN ('Issued', 'Ack') AND fyp > 0), 0),
    -- New recruitments in month
    COALESCE((SELECT COUNT(*)::INTEGER FROM agents WHERE TO_CHAR(join_date, 'YYYY-MM') = report_month), 0);
END;
$$ LANGUAGE plpgsql;

-- Optimized view for agent dashboard table
CREATE OR REPLACE VIEW agent_dashboard_performance AS
SELECT 
    a.agent_code,
    a.full_name,
    a.rank,
    a.status as agent_status,
    a.manager_code,
    COALESCE(SUM(CASE WHEN c.status IN ('Issued', 'Ack') THEN c.fyp ELSE 0 END), 0) as personal_fyp,
    -- Group FYP will be handled by application logic/recursive calls if needed for each row, 
    -- or we can pre-calculate it for a specific month.
    -- For now, we return individual performance.
    COUNT(CASE WHEN c.status IN ('Issued', 'Ack') THEN 1 END) as cc_count
FROM agents a
LEFT JOIN contracts c ON a.agent_code = c.agent_code
GROUP BY a.agent_code, a.full_name, a.rank, a.status, a.manager_code;
