-- Opdater timeline query til at bruge den nye beregningsmetode
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
        -- Brug den nye CalculateSectionChanges funktion
        SUM(dbo.CalculateSectionChanges(
            ai_referat, -- Byt om på rækkefølgen
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
        )) as dinJobsogningIndtilNu,
        SUM(CASE
            WHEN (referat LIKE '%Vi har aftalt%' AND ai_referat LIKE '%Vi har aftalt%' AND referat = ai_referat)
            OR (referat LIKE '%Vi har i dag talt om%' AND ai_referat LIKE '%Vi har i dag talt om%' AND referat = ai_referat)
            OR (referat LIKE '%Din jobsøgning indtil nu%' AND ai_referat LIKE '%Din jobsøgning indtil nu%' AND referat = ai_referat)
            THEN 1 ELSE 0
        END) as uaendredeSektioner
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
    dinJobsogningIndtilNu,
    uaendredeSektioner
FROM DailyStats
ORDER BY date;

-- Opdater også KPI beregningerne
WITH TimeStats AS (
    SELECT
        ISNULL(SUM(CASE WHEN feedback = '1' THEN 1 ELSE 0 END), 0) as thumbs_up,        
        ISNULL(SUM(CASE WHEN feedback = '-1' THEN 1 ELSE 0 END), 0) as thumbs_down,     
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
        COUNT(*) as total_conversations,
        AVG(CASE
            WHEN dbo.CalculateSectionChanges(ai_referat, referat, 'Vi har aftalt:', 'Vi har i dag talt om:') > 0
            THEN 1 ELSE 0
        END) * 100 as vi_har_aftalt_change_rate,
        AVG(CASE
            WHEN dbo.CalculateSectionChanges(ai_referat, referat, 'Vi har i dag talt om:', 'Din jobsøgning indtil nu:') > 0
            THEN 1 ELSE 0
        END) * 100 as vi_har_talt_om_change_rate,
        AVG(CASE
            WHEN dbo.CalculateSectionChanges(ai_referat, referat, 'Din jobsøgning indtil nu:', 'Andet') > 0
            THEN 1 ELSE 0
        END) * 100 as jobsogning_change_rate
    FROM ai_statistik WITH (NOLOCK)
)
SELECT
    t.*,
    ISNULL(j.json_data, '[]') as top_conversation_types
FROM TimeStats t
CROSS APPLY (
    SELECT TOP 5 *
    FROM ai_statistik
    FOR JSON PATH
) as j(json_data);