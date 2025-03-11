-- Test data for verifikation
DECLARE @test_ai_text NVARCHAR(MAX) = '
Vi har aftalt:
- møde næste tirsdag kl 10
- følge op på jobansøgninger

Vi har i dag talt om:
- status på jobsøgning
- nye muligheder
- fremtidsplaner

Din jobsøgning indtil nu:
- 2 ansøgninger sendt
- 1 samtale planlagt';

DECLARE @test_human_text NVARCHAR(MAX) = '
Vi har aftalt:
- møde næste onsdag kl 11
- følge op på jobansøgninger
- lave ny handlingsplan

Vi har i dag talt om:
- status på jobsøgning
- jobmuligheder
- karriereplaner
- kompetencer
- motivation

Din jobsøgning indtil nu:
- 2 ansøgninger sendt
- 2 samtaler planlagt';

-- Test ændringer
SELECT 
    'Vi har aftalt' as Section,
    dbo.CalculateSectionChanges(
        @test_ai_text, 
        @test_human_text,
        'Vi har aftalt:',
        'Vi har i dag talt om:'
    ) as Changes
UNION ALL
SELECT 
    'Vi har i dag talt om',
    dbo.CalculateSectionChanges(
        @test_ai_text, 
        @test_human_text,
        'Vi har i dag talt om:',
        'Din jobsøgning indtil nu:'
    )
UNION ALL
SELECT 
    'Din jobsøgning indtil nu',
    dbo.CalculateSectionChanges(
        @test_ai_text, 
        @test_human_text,
        'Din jobsøgning indtil nu:',
        'Andet'
    );

-- Vis faktiske bullet points for sammenligning
SELECT 'AI Vi har aftalt' as Source,
       line
FROM STRING_SPLIT(@test_ai_text, CHAR(10))
WHERE LTRIM(value) LIKE '-%'
AND line LIKE '%møde%'
UNION ALL
SELECT 'Human Vi har aftalt',
       line
FROM STRING_SPLIT(@test_human_text, CHAR(10))
WHERE LTRIM(value) LIKE '-%'
AND line LIKE '%møde%';