-- Lad os debugge hvad der sker for den specifikke dato
WITH SectionText AS (
    SELECT 
        referat,
        ai_referat,
        created_at,
        dbo.ExtractSection(referat, 'Vi har aftalt:', 'Vi har i dag talt om:') as human_viHarAftalt,
        dbo.ExtractSection(ai_referat, 'Vi har aftalt:', 'Vi har i dag talt om:') as ai_viHarAftalt,
        dbo.ExtractSection(referat, 'Vi har i dag talt om:', 'Din jobsøgning indtil nu:') as human_viHarIDagTaltOm,
        dbo.ExtractSection(ai_referat, 'Vi har i dag talt om:', 'Din jobsøgning indtil nu:') as ai_viHarIDagTaltOm,
        dbo.ExtractSection(referat, 'Din jobsøgning indtil nu:', 'Andet') as human_dinJobsogning,
        dbo.ExtractSection(ai_referat, 'Din jobsøgning indtil nu:', 'Andet') as ai_dinJobsogning
    FROM ai_statistik
    WHERE CAST(created_at AS DATE) = '2025-02-10'
)
SELECT 
    s.*,
    dbo.CalculateSectionChanges(ai_referat, referat, 'Vi har aftalt:', 'Vi har i dag talt om:') as viHarAftalt_changes,
    dbo.CalculateSectionChanges(ai_referat, referat, 'Vi har i dag talt om:', 'Din jobsøgning indtil nu:') as viHarIDagTaltOm_changes,
    dbo.CalculateSectionChanges(ai_referat, referat, 'Din jobsøgning indtil nu:', 'Andet') as dinJobsogning_changes
FROM SectionText s;

-- Lad os også se på bullet points for hver sektion
WITH BulletPoints AS (
    SELECT 
        CAST(created_at AS DATE) as date,
        'Vi har aftalt' as section,
        value as bullet_point,
        'human' as source
    FROM ai_statistik
    CROSS APPLY STRING_SPLIT(
        dbo.ExtractSection(referat, 'Vi har aftalt:', 'Vi har i dag talt om:'),
        CHAR(10)
    )
    WHERE CAST(created_at AS DATE) = '2025-02-10'
    AND LTRIM(value) LIKE '-%'
    
    UNION ALL
    
    SELECT 
        CAST(created_at AS DATE) as date,
        'Vi har aftalt' as section,
        value as bullet_point,
        'ai' as source
    FROM ai_statistik
    CROSS APPLY STRING_SPLIT(
        dbo.ExtractSection(ai_referat, 'Vi har aftalt:', 'Vi har i dag talt om:'),
        CHAR(10)
    )
    WHERE CAST(created_at AS DATE) = '2025-02-10'
    AND LTRIM(value) LIKE '-%'
)
SELECT 
    section,
    source,
    bullet_point
FROM BulletPoints
ORDER BY section, source;

-- Lad os se på de faktiske forskelle
SELECT 
    referat as human_text,
    ai_referat as ai_text
FROM ai_statistik
WHERE CAST(created_at AS DATE) = '2025-02-10';