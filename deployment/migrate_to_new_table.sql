-- Migrate data from old tables to new samtale_transcription_statisics table
-- Created: 2025-02-04

-- First, ensure the new table exists
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[samtale_transcription_statisics]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[samtale_transcription_statisics](
        referat nvarchar(3000) NOT NULL,
        ai_referat nvarchar(3000) NOT NULL,
        transcription_recieved_at [datetime2](7),
        ai_referat_recieved_at [datetime2](7),
        referat_godkendt_at [datetime2](7),
        feedback nvarchar(1),
        samtyp_type nvarchar(4) NOT NULL,
        regenerated nvarchar(1) NOT NULL,
        referat_started_at [datetime2](7),
        reg_init nvarchar(12) NOT NULL,
        reg_tid [datetime2](7) NOT NULL,
        reg_vers_nr int NOT NULL
    )
END
GO

-- Clear existing data if any exists
TRUNCATE TABLE samtale_transcription_statisics
GO

-- Insert data from old tables
INSERT INTO samtale_transcription_statisics (
    referat,
    ai_referat,
    transcription_recieved_at,
    ai_referat_recieved_at,
    referat_godkendt_at,
    feedback,
    samtyp_type,
    regenerated,
    referat_started_at,
    reg_init,
    reg_tid,
    reg_vers_nr
)
SELECT 
    sr.referat,
    sar.referat as ai_referat,
    si.samtale_dato as transcription_recieved_at,
    sar.reg_tid as ai_referat_recieved_at,
    sr.reg_tid as referat_godkendt_at,
    CASE 
        WHEN sar.feedback = 1 THEN 'j  -- Thumbs Up
        WHEN sar.feedback = 0 THEN 'n'  -- Thumbs Down
        ELSE NULL 
    END as feedback,
    si.samtyp_type,
    CASE 
        WHEN sar.regenerer_dato IS NOT NULL THEN 'j'
        ELSE 'n'
    END as regenerated,
    si.samtale_dato as referat_started_at,
    sr.reg_init,
    sr.reg_tid,
    COALESCE(sr.reg_vers_nr, 1) as reg_vers_nr
FROM samind_referat sr
INNER JOIN samind_ai_referat sar 
    ON sr.medl_ident = sar.medl_ident 
    AND sr.samind_lbnr = sar.samind_lbnr
INNER JOIN samtale_indkaldelse si
    ON sr.medl_ident = si.medl_ident 
    AND sr.samind_lbnr = si.lbnr
GO

-- Verify the migration
SELECT COUNT(*) as TotalMigratedRows FROM samtale_transcription_statisics
GO

-- Show sample of migrated data
SELECT TOP 10 * FROM samtale_transcription_statisics ORDER BY reg_tid DESC
GO
