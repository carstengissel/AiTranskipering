-- First, let's see the current distribution of feedback values
SELECT feedback, COUNT(*) as count
FROM ai_statistik
GROUP BY feedback
ORDER BY feedback;

-- Update the feedback values from 'j'/'n' to '1'/'-1'
UPDATE ai_statistik
SET feedback = 
    CASE feedback
        WHEN 'j' THEN '1'
        WHEN 'n' THEN '-1'
        ELSE feedback
    END
WHERE feedback IN ('j', 'n');

-- Verify the update was successful
SELECT feedback, COUNT(*) as count
FROM ai_statistik
GROUP BY feedback
ORDER BY feedback;

-- Optional: Add a check constraint to ensure only valid values are allowed
-- This will prevent any future insertions of 'j' or 'n'
IF NOT EXISTS (
    SELECT * 
    FROM sys.check_constraints 
    WHERE name = 'CHK_ai_statistik_feedback'
)
BEGIN
    ALTER TABLE ai_statistik
    ADD CONSTRAINT CHK_ai_statistik_feedback 
    CHECK (feedback IN ('1', '-1') OR feedback IS NULL);
END
