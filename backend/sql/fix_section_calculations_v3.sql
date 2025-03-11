-- Drop den eksisterende funktion
DROP FUNCTION IF EXISTS [dbo].[CalculateSectionChanges];
GO

-- Opret ny funktion der matcher frontend diffWords
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

    -- Normalisér teksten
    SET @section1 = REPLACE(REPLACE(@section1, CHAR(13), CHAR(10)), CHAR(10) + CHAR(10), CHAR(10));
    SET @section2 = REPLACE(REPLACE(@section2, CHAR(13), CHAR(10)), CHAR(10) + CHAR(10), CHAR(10));

    -- Tæl bullet points
    DECLARE @points1 INT = (
        SELECT COUNT(*)
        FROM STRING_SPLIT(@section1, CHAR(10))
        WHERE LTRIM(value) LIKE '-%'
    );

    DECLARE @points2 INT = (
        SELECT COUNT(*)
        FROM STRING_SPLIT(@section2, CHAR(10))
        WHERE LTRIM(value) LIKE '-%'
    );

    -- Tæl identiske bullet points
    DECLARE @common_points INT = (
        SELECT COUNT(*)
        FROM (
            SELECT LTRIM(RTRIM(SUBSTRING(value, 2, LEN(value)))) as point
            FROM STRING_SPLIT(@section1, CHAR(10))
            WHERE LTRIM(value) LIKE '-%'
            INTERSECT
            SELECT LTRIM(RTRIM(SUBSTRING(value, 2, LEN(value)))) as point
            FROM STRING_SPLIT(@section2, CHAR(10))
            WHERE LTRIM(value) LIKE '-%'
        ) as common
    );

    -- Beregn antal ændringer som i frontend
    -- Ændringer = tilføjede + fjernede bullet points
    RETURN (@points1 - @common_points) + (@points2 - @common_points);
END;
GO

-- Opdater data med nye beregninger
UPDATE TimeStats
SET 
    viHarAftalt = 
        dbo.CalculateSectionChanges(
            ai_referat, 
            referat,
            'Vi har aftalt:',
            'Vi har i dag talt om:'
        ),
    viHarIDagTaltOm = 
        dbo.CalculateSectionChanges(
            ai_referat,
            referat,
            'Vi har i dag talt om:',
            'Din jobsøgning indtil nu:'
        ),
    dinJobsogningIndtilNu = 
        dbo.CalculateSectionChanges(
            ai_referat,
            referat,
            'Din jobsøgning indtil nu:',
            'Andet'
        );

-- Verificer resultater for de specificerede datoer
SELECT 
    CAST(created_at AS DATE) as date,
    COUNT(*) as interview_count,
    SUM(viHarAftalt) as viHarAftalt_changes,
    SUM(viHarIDagTaltOm) as viHarIDagTaltOm_changes,
    SUM(dinJobsogningIndtilNu) as dinJobsogningIndtilNu_changes
FROM TimeStats
WHERE CAST(created_at AS DATE) IN ('2024-12-17', '2025-02-06', '2025-02-10')
GROUP BY CAST(created_at AS DATE)
ORDER BY date;

-- Test et specifikt eksempel
DECLARE @test_ai_text NVARCHAR(MAX) = '
Vi har aftalt:
- møde tirsdag
- følge op

Vi har i dag talt om:
- status
- fremtid

Din jobsøgning indtil nu:
- 2 ansøgninger
';

DECLARE @test_human_text NVARCHAR(MAX) = '
Vi har aftalt:
- møde onsdag
- følge op
- ny plan

Vi har i dag talt om:
- status
- muligheder
- udvikling

Din jobsøgning indtil nu:
- 2 ansøgninger
- nyt job
';

-- Vis ændringer for test eksempel
SELECT 
    'Vi har aftalt' as Section,
    dbo.CalculateSectionChanges(@test_ai_text, @test_human_text, 'Vi har aftalt:', 'Vi har i dag talt om:') as Changes
UNION ALL
SELECT 
    'Vi har i dag talt om',
    dbo.CalculateSectionChanges(@test_ai_text, @test_human_text, 'Vi har i dag talt om:', 'Din jobsøgning indtil nu:')
UNION ALL
SELECT 
    'Din jobsøgning indtil nu',
    dbo.CalculateSectionChanges(@test_ai_text, @test_human_text, 'Din jobsøgning indtil nu:', 'Andet');