
SELECT rank, COUNT(*) as count FROM agents GROUP BY rank;
SELECT agent_code, full_name, rank, group_code FROM agents WHERE rank IN ('UM', 'SUM', 'DM', 'SDM', 'BM', 'AM') LIMIT 10;
