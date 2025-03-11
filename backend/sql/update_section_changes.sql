-- Function to use diffWords like comparison instead of the current word position based comparison
CREATE OR ALTER FUNCTION [dbo].[CalculateRealSectionChanges]
(
    @text1 NVARCHAR(MAX),
    @text2 NVARCHAR(MAX),
    @sectionStart NVARCHAR(100),
    @sectionEnd NVARCHAR(100)
)
RETURNS INT
AS
BEGIN
    DECLARE @section1 NVARCHAR(MAX) = [dbo].[ExtractSection](@text1, @sectionStart, @sectionEnd);
    DECLARE @section2 NVARCHAR(MAX) = [dbo].[ExtractSection](@text2, @sectionStart, @sectionEnd);
    
    IF @section1 = '' OR @section2 = '' RETURN 0;

    -- Split sections into words
    DECLARE @words1 TABLE (word NVARCHAR(100));
    DECLARE @words2 TABLE (word NVARCHAR(100));
    
    -- Insert words into tables
    INSERT INTO @words1
    SELECT value
    FROM STRING_SPLIT(REPLACE(REPLACE(@section1, CHAR(13), ' '), CHAR(10), ' '), ' ')
    WHERE LTRIM(RTRIM(value)) != '';
    
    INSERT INTO @words2
    SELECT value
    FROM STRING_SPLIT(REPLACE(REPLACE(@section2, CHAR(13), ' '), CHAR(10), ' '), ' ')
    WHERE LTRIM(RTRIM(value)) != '';
    
    -- Calculate changes
    DECLARE @changes INT = (
        -- Words that exist in text1 but not in text2 (removed words)
        SELECT COUNT(*)
        FROM @words1 w1
        WHERE NOT EXISTS (
            SELECT 1 FROM @words2 WHERE word = w1.word
        )
    ) + (
        -- Words that exist in text2 but not in text1 (added words)
        SELECT COUNT(*)
        FROM @words2 w2
        WHERE NOT EXISTS (
            SELECT 1 FROM @words1 WHERE word = w2.word
        )
    );
    
    RETURN @changes;
END;
GO

-- Update the timeline query to use new calculation
UPDATE TimeStats
SET 
    viHarAftalt = 
        dbo.CalculateRealSectionChanges(
            referat, 
            ai_referat,
            'Vi har aftalt',
            'Vi har i dag talt om'
        ),
    viHarIDagTaltOm = 
        dbo.CalculateRealSectionChanges(
            referat,
            ai_referat,
            'Vi har i dag talt om',
            'Din jobsøgning indtil nu'
        ),
    dinJobsogningIndtilNu = 
        dbo.CalculateRealSectionChanges(
            referat,
            ai_referat,
            'Din jobsøgning indtil nu',
            'Andet'
        );

-- View til at verificere ændringer for en specifik dato
CREATE OR ALTER VIEW [dbo].[SectionChangesVerification] AS
SELECT 
    CAST(created_at AS DATE) as date,
    COUNT(*) as interview_count,
    SUM(viHarAftalt) as viHarAftalt_total,
    SUM(viHarIDagTaltOm) as viHarIDagTaltOm_total,
    SUM(dinJobsogningIndtilNu) as dinJobsogningIndtilNu_total,
    CAST(SUM(CAST(viHarAftalt AS FLOAT)) / COUNT(*) AS DECIMAL(10,2)) as viHarAftalt_avg,
    CAST(SUM(CAST(viHarIDagTaltOm AS FLOAT)) / COUNT(*) AS DECIMAL(10,2)) as viHarIDagTaltOm_avg,
    CAST(SUM(CAST(dinJobsogningIndtilNu AS FLOAT)) / COUNT(*) AS DECIMAL(10,2)) as dinJobsogningIndtilNu_avg
FROM TimeStats
GROUP BY CAST(created_at AS DATE);

-- Test data verifikation
/*
SELECT * FROM SectionChangesVerification 
WHERE date IN ('2024-12-17', '2025-02-06', '2025-02-10')
ORDER BY date;

Forventede resultater:
2024-12-17: 
    interview_count = 2
    viHarAftalt_total = 4 (2+2)
    viHarIDagTaltOm_total = 12 (6+6)
    dinJobsogningIndtilNu_total = 8 (4+4)

2025-02-06:
    interview_count = 1
    viHarAftalt_total = 2
    viHarIDagTaltOm_total = 3
    dinJobsogningIndtilNu_total = 1

2025-02-10:
    interview_count = 1
    viHarAftalt_total = 5
    viHarIDagTaltOm_total = 5
    dinJobsogningIndtilNu_total = 2
*/