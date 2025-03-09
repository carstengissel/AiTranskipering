-- Update timeline query to use new word processing functions
UPDATE TimeStats SET
    viHarAftalt_count = 
        SUM(dbo.CalculateSectionChanges(
            referat, 
            ai_referat,
            'Vi har aftalt',
            'Vi har i dag talt om'
        )),
    viHarIDagTaltOm_count = 
        SUM(dbo.CalculateSectionChanges(
            referat,
            ai_referat,
            'Vi har i dag talt om',
            'Din jobsøgning indtil nu'
        )),
    dinJobsogningIndtilNu_count = 
        SUM(dbo.CalculateSectionChanges(
            referat,
            ai_referat,
            'Din jobsøgning indtil nu',
            'Andet'
        ));

-- Replace the existing CASE expressions in the timeline-stats query with:
/*
SUM(dbo.CalculateSectionChanges(
    referat,
    ai_referat,
    'Vi har aftalt',
    'Vi har i dag talt om'
)) AS viHarAftalt_count,

SUM(dbo.CalculateSectionChanges(
    referat,
    ai_referat,
    'Vi har i dag talt om',
    'Din jobsøgning indtil nu'
)) AS viHarIDagTaltOm_count,

SUM(dbo.CalculateSectionChanges(
    referat,
    ai_referat,
    'Din jobsøgning indtil nu',
    'Andet'
)) AS dinJobsogningIndtilNu_count
*/