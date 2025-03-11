-- 1. Opret den nye beregningsfunktion
DROP FUNCTION IF EXISTS [dbo].[CalculateSectionChanges];
GO

-- Kopier hele indholdet fra fix_section_calculations_v3.sql her for CalculateSectionChanges funktionen
CREATE FUNCTION [dbo].[CalculateSectionChanges]
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

    SET @section1 = REPLACE(REPLACE(@section1, CHAR(13), CHAR(10)), CHAR(10) + CHAR(10), CHAR(10));
    SET @section2 = REPLACE(REPLACE(@section2, CHAR(13), CHAR(10)), CHAR(10) + CHAR(10), CHAR(10));

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

    RETURN (@points1 - @common_points) + (@points2 - @common_points);
END;
GO

-- 2. Opdater TimeStats tabellen med nye beregninger
WITH UpdateData AS (
    SELECT 
        id,
        dbo.CalculateSectionChanges(
            ai_referat, 
            referat,
            'Vi har aftalt:',
            'Vi har i dag talt om:'
        ) as new_viHarAftalt,
        dbo.CalculateSectionChanges(
            ai_referat,
            referat,
            'Vi har i dag talt om:',
            'Din jobsøgning indtil nu:'
        ) as new_viHarIDagTaltOm,
        dbo.CalculateSectionChanges(
            ai_referat,
            referat,
            'Din jobsøgning indtil nu:',
            'Andet'
        ) as new_dinJobsogningIndtilNu
    FROM ai_statistik
)
UPDATE TimeStats
SET 
    viHarAftalt = u.new_viHarAftalt,
    viHarIDagTaltOm = u.new_viHarIDagTaltOm,
    dinJobsogningIndtilNu = u.new_dinJobsogningIndtilNu
FROM TimeStats t
INNER JOIN UpdateData u ON t.id = u.id;

-- 3. Opdater db-views med nye queries
DROP VIEW IF EXISTS vw_timeline_stats;
GO

CREATE VIEW vw_timeline_stats AS
-- Kopier hele indholdet fra update_timeline_query_v2.sql her
WITH DailyStats AS (
    SELECT
        CAST(referat_godkendt_at AS DATE) as date,
        COUNT(*) as total_count,
        ISNULL(SUM(CASE WHEN feedback = '1' THEN 1 ELSE 0 END), 0) as positive_feedback,
        ISNULL(SUM(CASE WHEN feedback = '-1' THEN 1 ELSE 0 END), 0) as negative_feedback,
        ISNULL(AVG(CASE
            WHEN transcription_recieved_at IS NOT NULL AND ai_referat_recieved_at IS NOT NULL
            AND DATEDIFF(MINUTE, transcription_recieved_at, ai_referat_recieved_at) > 0 
            AND DATEDIFF(MINUTE, transcription_recieved_at, ai_referat_recieved_at) < 1000
            THEN CAST(DATEDIFF(MINUTE, transcription_recieved_at, ai_referat_recieved_at) AS FLOAT)
            ELSE NULL
        END), 0) as avg_time_to_ai_report,
        ISNULL(AVG(CASE
            WHEN transcription_recieved_at IS NOT NULL AND referat_godkendt_at IS NOT NULL
            AND DATEDIFF(MINUTE, transcription_recieved_at, referat_godkendt_at) > 0    
            AND DATEDIFF(MINUTE, transcription_recieved_at, referat_godkendt_at) < 1000 
            THEN CAST(DATEDIFF(MINUTE, transcription_recieved_at, referat_godkendt_at) AS FLOAT)
            ELSE NULL
        END), 0) as avg_time_to_approval,
        SUM(dbo.CalculateSectionChanges(
            ai_referat,
            referat,
            'Vi har aftalt:',
            'Vi har i dag talt om:'
        )) as viHarAftalt,
        SUM(dbo.CalculateSectionChanges(
            ai_referat,
            referat,
            'Vi har i dag talt om:',
            'Din jobsøgning indtil nu:'
        )) as viHarIDagTaltOm,
        SUM(dbo.CalculateSectionChanges(
            ai_referat,
            referat,
            'Din jobsøgning indtil nu:',
            'Andet'
        )) as dinJobsogningIndtilNu
    FROM ai_statistik WITH (NOLOCK)
    WHERE referat_godkendt_at IS NOT NULL
    GROUP BY CAST(referat_godkendt_at AS DATE)
)
SELECT
    date,
    total_count as totalCount,
    positive_feedback as positiveFeedback,
    negative_feedback as negativeFeedback,
    avg_time_to_ai_report as avgTimeToAiReport,
    avg_time_to_approval as avgTimeToApproval,
    viHarAftalt,
    viHarIDagTaltOm,
    dinJobsogningIndtilNu
FROM DailyStats
ORDER BY date;
GO

-- 4. Genstart app services
EXEC sp_refresh_views;
GO