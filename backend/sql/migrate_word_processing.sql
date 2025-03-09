-- Drop functions if they exist
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'FN' AND SCHEMA_NAME(schema_id) = 'dbo' AND name = 'CalculateSectionChanges')
    DROP FUNCTION [dbo].[CalculateSectionChanges];
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'FN' AND SCHEMA_NAME(schema_id) = 'dbo' AND name = 'ExtractSection')
    DROP FUNCTION [dbo].[ExtractSection];
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'IF' AND SCHEMA_NAME(schema_id) = 'dbo' AND name = 'SplitIntoWords')
    DROP FUNCTION [dbo].[SplitIntoWords];
GO

-- Create SplitIntoWords function
CREATE FUNCTION [dbo].[SplitIntoWords]
(
    @text NVARCHAR(MAX)
)
RETURNS TABLE
AS
RETURN
    SELECT 
        LTRIM(RTRIM(value)) AS word
    FROM STRING_SPLIT(REPLACE(REPLACE(@text, CHAR(13), ' '), CHAR(10), ' '), ' ')
    WHERE LTRIM(RTRIM(value)) != '';
GO

-- Create ExtractSection function
CREATE FUNCTION [dbo].[ExtractSection]
(
    @text NVARCHAR(MAX),
    @startMarker NVARCHAR(100),
    @endMarker NVARCHAR(100)
)
RETURNS NVARCHAR(MAX)
AS
BEGIN
    DECLARE @startPos INT = CHARINDEX(@startMarker, @text);
    DECLARE @endPos INT;
    
    IF @startPos = 0 
        RETURN '';
    
    SET @startPos = @startPos + LEN(@startMarker);
    SET @endPos = CHARINDEX(@endMarker, @text, @startPos);
    
    IF @endPos = 0 
        SET @endPos = LEN(@text) + 1;
    
    RETURN LTRIM(RTRIM(SUBSTRING(@text, @startPos, @endPos - @startPos)));
END;
GO

-- Create CalculateSectionChanges function
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
    
    IF @section1 = '' OR @section2 = '' 
        RETURN 0;

    -- Count words that are added or removed
    DECLARE @changes INT = (
        SELECT COUNT(*)
        FROM (
            SELECT word
            FROM dbo.SplitIntoWords(@section1)
            EXCEPT
            SELECT word
            FROM dbo.SplitIntoWords(@section2)
        ) AS diff
    ) + (
        SELECT COUNT(*)
        FROM (
            SELECT word
            FROM dbo.SplitIntoWords(@section2)
            EXCEPT
            SELECT word
            FROM dbo.SplitIntoWords(@section1)
        ) AS diff2
    );
    
    RETURN @changes;
END;
GO