-- Drop functions hvis de eksisterer
DROP FUNCTION IF EXISTS [dbo].[CalculateSectionChanges];
DROP FUNCTION IF EXISTS [dbo].[ExtractSection];
DROP FUNCTION IF EXISTS [dbo].[SplitIntoWords];

-- Drop views hvis de eksisterer
DROP VIEW IF EXISTS vw_timeline_stats;
DROP VIEW IF EXISTS vw_LatestComparisons;
DROP VIEW IF EXISTS vw_AverageChanges;
DROP VIEW IF EXISTS SectionChangesVerification;

-- Note: TimeStats tabellen eksisterer ikke længere, så vi springer over den del