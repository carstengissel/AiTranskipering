-- SQL Schema for text comparison results
CREATE TABLE SectionComparisons (
    id INT IDENTITY(1,1) PRIMARY KEY,
    referat_id INT NOT NULL,
    section_name NVARCHAR(50) NOT NULL,
    change_percentage INT NOT NULL,
    added_words NVARCHAR(MAX),
    removed_words NVARCHAR(MAX),
    ai_text NVARCHAR(MAX),
    human_text NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    
    -- Index for hurtig søgning på referat_id
    INDEX idx_referat_id (referat_id),
    
    -- Index for hurtig søgning på sektion
    INDEX idx_section_name (section_name)
);

-- View til at hente de seneste sammenligninger
CREATE VIEW vw_LatestComparisons AS
SELECT 
    sc.referat_id,
    sc.section_name,
    sc.change_percentage,
    sc.added_words,
    sc.removed_words,
    sc.created_at
FROM SectionComparisons sc
INNER JOIN (
    SELECT referat_id, section_name, MAX(created_at) as max_created_at
    FROM SectionComparisons
    GROUP BY referat_id, section_name
) latest ON 
    sc.referat_id = latest.referat_id 
    AND sc.section_name = latest.section_name
    AND sc.created_at = latest.max_created_at;

-- View til at beregne gennemsnitlige ændringer per sektion
CREATE VIEW vw_AverageChanges AS
SELECT 
    section_name,
    AVG(CAST(change_percentage AS FLOAT)) as avg_change_percentage,
    COUNT(*) as total_comparisons
FROM SectionComparisons
GROUP BY section_name;