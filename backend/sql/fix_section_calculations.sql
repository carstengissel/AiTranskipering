-- Drop den gamle funktion
DROP FUNCTION IF EXISTS [dbo].[CalculateSectionChanges];
GO

-- Opret ny funktion der matcher frontend beregningerne
CREATE FUNCTION [dbo].[CalculateSectionChanges]
(
    @text1 NVARCHAR(MAX),  -- AI text
    @text2 NVARCHAR(MAX),  -- Human text
    @sectionStart NVARCHAR(100),
    @sectionEnd NVARCHAR(100)
)
RETURNS INT
AS
BEGIN
    -- Udtræk sektioner
    DECLARE @section1 NVARCHAR(MAX) = [dbo].[ExtractSection](@text1, @sectionStart, @sectionEnd);
    DECLARE @section2 NVARCHAR(MAX) = [dbo].[ExtractSection](@text2, @sectionStart, @sectionEnd);
    
    -- Hvis en sektion mangler, returner 0
    IF @section1 = '' OR @section2 = '' RETURN 0;

    -- Split teksten i linjer (bullet points)
    DECLARE @lines1 TABLE (line NVARCHAR(500));
    DECLARE @lines2 TABLE (line NVARCHAR(500));
    
    -- Indsæt linjer i tabeller
    INSERT INTO @lines1
    SELECT LTRIM(RTRIM(value))
    FROM STRING_SPLIT(REPLACE(@section1, CHAR(13), CHAR(10)), CHAR(10))
    WHERE LTRIM(RTRIM(value)) != '' AND LEFT(LTRIM(value), 1) = '-';
    
    INSERT INTO @lines2
    SELECT LTRIM(RTRIM(value))
    FROM STRING_SPLIT(REPLACE(@section2, CHAR(13), CHAR(10)), CHAR(10))
    WHERE LTRIM(RTRIM(value)) != '' AND LEFT(LTRIM(value), 1) = '-';
    
    -- Tæl ændrede linjer
    DECLARE @changes INT = (
        -- Tæl linjer der kun findes i text1
        SELECT COUNT(*)
        FROM @lines1 l1
        WHERE NOT EXISTS (
            SELECT 1 FROM @lines2 
            WHERE line = l1.line
        )
    ) + (
        -- Tæl linjer der kun findes i text2
        SELECT COUNT(*)
        FROM @lines2 l2
        WHERE NOT EXISTS (
            SELECT 1 FROM @lines1 
            WHERE line = l2.line
        )
    );
    
    -- For at matche frontend beregningen
    RETURN @changes;
END;
GO

-- Opdater eksisterende data med nye beregninger
UPDATE TimeStats
SET 
    viHarAftalt = 
        dbo.CalculateSectionChanges(
            referat, 
            ai_referat,
            'Vi har aftalt:',
            'Vi har i dag talt om:'
        ),
    viHarIDagTaltOm = 
        dbo.CalculateSectionChanges(
            referat,
            ai_referat,
            'Vi har i dag talt om:',
            'Din jobsøgning indtil nu:'
        ),
    dinJobsogningIndtilNu = 
        dbo.CalculateSectionChanges(
            referat,
            ai_referat,
            'Din jobsøgning indtil nu:',
            'Andet'
        );

-- Verificer ændringer for testdatoerne
SELECT 
    CAST(created_at AS DATE) as date,
    COUNT(*) as interview_count,
    SUM(viHarAftalt) as viHarAftalt_sum,
    SUM(viHarIDagTaltOm) as viHarIDagTaltOm_sum,
    SUM(dinJobsogningIndtilNu) as dinJobsogningIndtilNu_sum
FROM TimeStats
WHERE CAST(created_at AS DATE) IN ('2024-12-17', '2025-02-06', '2025-02-10')
GROUP BY CAST(created_at AS DATE)
ORDER BY date;