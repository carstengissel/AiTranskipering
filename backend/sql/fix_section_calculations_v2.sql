-- Drop den eksisterende funktion
DROP FUNCTION IF EXISTS [dbo].[CalculateSectionChanges];
GO

-- Opret ny funktion med korrekt sammenligning
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
    
    IF @section1 = '' OR @section2 = '' RETURN 0;

    -- Normalisér teksten først
    SET @section1 = REPLACE(REPLACE(@section1, CHAR(13), CHAR(10)), CHAR(10) + CHAR(10), CHAR(10));
    SET @section2 = REPLACE(REPLACE(@section2, CHAR(13), CHAR(10)), CHAR(10) + CHAR(10), CHAR(10));

    -- Split i bullet points og normaliser
    DECLARE @bullets1 TABLE (line NVARCHAR(500));
    DECLARE @bullets2 TABLE (line NVARCHAR(500));
    
    -- Indsæt normaliserede bullet points
    INSERT INTO @bullets1
    SELECT LTRIM(RTRIM(SUBSTRING(value, 2, LEN(value))))  -- Fjern '-' og trim
    FROM STRING_SPLIT(@section1, CHAR(10))
    WHERE LTRIM(value) LIKE '-%' 
    AND LTRIM(RTRIM(SUBSTRING(value, 2, LEN(value)))) != '';
    
    INSERT INTO @bullets2
    SELECT LTRIM(RTRIM(SUBSTRING(value, 2, LEN(value))))  -- Fjern '-' og trim
    FROM STRING_SPLIT(@section2, CHAR(10))
    WHERE LTRIM(value) LIKE '-%'
    AND LTRIM(RTRIM(SUBSTRING(value, 2, LEN(value)))) != '';

    -- Beregn antal ændringer (tilføjet eller fjernet)
    DECLARE @total_changes INT = (
        -- Tæl bullet points der er forskellige
        SELECT COUNT(DISTINCT line)
        FROM (
            SELECT line FROM @bullets1
            EXCEPT
            SELECT line FROM @bullets2
            UNION ALL
            SELECT line FROM @bullets2
            EXCEPT
            SELECT line FROM @bullets1
        ) as differences
    );

    RETURN @total_changes;
END;
GO

-- Opdater data med nye beregninger
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

-- Test resultater for de specifikke datoer
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