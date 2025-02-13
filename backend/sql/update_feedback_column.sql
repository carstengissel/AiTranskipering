-- First alter the column to nvarchar(2) to accommodate '-1'
ALTER TABLE ai_statistik
ALTER COLUMN feedback nvarchar(2);

-- Then update the values
UPDATE ai_statistik
SET feedback = 
    CASE feedback
        WHEN 'j' THEN '1'
        WHEN 'n' THEN '-1'
        ELSE feedback
    END;

-- Verify the changes
SELECT feedback, COUNT(*) as count
FROM ai_statistik
GROUP BY feedback
ORDER BY feedback;
