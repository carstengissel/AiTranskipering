-- First create the new table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ai_statistik]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ai_statistik](
        [lbnr] [int] IDENTITY(1,1) NOT NULL,
        [referat] [nvarchar](3000) NOT NULL,
        [ai_referat] [nvarchar](3000) NOT NULL,
        [feedback] [nvarchar](1) NULL,
        [feedback_tekst] [nvarchar](512) NULL,
        [transcription_recieved_at] [datetime2](7) NOT NULL,
        [ai_referat_recieved_at] [datetime2](7) NOT NULL,
        [referat_started_at] [datetime2](7) NOT NULL,
        [referat_godkendt_at] [datetime2](7) NOT NULL,
        [samtyp_type] [nvarchar](4) NULL,
        [regenerated] [nvarchar](1) NULL,
        CONSTRAINT [PK_ai_statistik] PRIMARY KEY CLUSTERED 
        (
            [lbnr] ASC
        )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY]
END
GO

-- Migrate data from old table to new table
INSERT INTO [dbo].[ai_statistik]
(
    [referat],
    [ai_referat],
    [feedback],
    [feedback_tekst],
    [transcription_recieved_at],
    [ai_referat_recieved_at],
    [referat_started_at],
    [referat_godkendt_at],
    [samtyp_type],
    [regenerated]
)
SELECT 
    [referat],
    [ai_referat],
    CASE feedback
        WHEN 'j' THEN '1'
        WHEN 'n' THEN '-1'
        ELSE NULL
    END as feedback,
    NULL as feedback_tekst, -- New column, setting to NULL for existing data
    ISNULL([transcription_recieved_at], GETDATE()) as transcription_recieved_at,
    ISNULL([ai_referat_recieved_at], GETDATE()) as ai_referat_recieved_at,
    ISNULL([referat_started_at], GETDATE()) as referat_started_at,
    ISNULL([referat_godkendt_at], GETDATE()) as referat_godkendt_at,
    [samtyp_type],
    [regenerated]
FROM [dbo].[samtale_transcription_statisics]
GO

-- Optional: If you want to verify the data migration
SELECT 
    COUNT(*) as OldTableCount 
FROM [dbo].[samtale_transcription_statisics]
GO

SELECT 
    COUNT(*) as NewTableCount 
FROM [dbo].[ai_statistik]
GO

-- Optional: If you want to drop the old table after verifying the migration
-- DROP TABLE [dbo].[samtale_transcription_statisics]
-- GO
