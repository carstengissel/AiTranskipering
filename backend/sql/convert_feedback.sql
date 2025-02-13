-- Update the feedback values
UPDATE ai_statistik
SET feedback = 
    CASE feedback
        WHEN 'j' THEN '1'
        WHEN 'n' THEN '-1'
        ELSE feedback
    END;
