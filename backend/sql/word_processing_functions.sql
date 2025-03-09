SET NOCOUNT ON;

-- Function to split text into words and preserve order
CREATE OR ALTER FUNCTION [dbo].[SplitIntoWords]
(
    @text NVARCHAR(MAX)
)
RETURNS TABLE
AS
RETURN
    WITH NumberedWords AS (
        SELECT 
            value AS word,
            ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS position
        FROM STRING_SPLIT(REPLACE(REPLACE(@text, CHAR(13), ' '), CHAR(10), ' '), ' ')
        WHERE LTRIM(RTRIM(value)) != ''
    )
    SELECT word, position
    FROM NumberedWords;
GO

-- Function to extract section content
CREATE OR ALTER FUNCTION [dbo].[ExtractSection]
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
    
    IF @startPos = 0 RETURN '';
    
    SET @startPos = @startPos + LEN(@startMarker);
    SET @endPos = CHARINDEX(@endMarker, @text, @startPos);
    
    IF @endPos = 0 SET @endPos = LEN(@text) + 1;
    
    RETURN LTRIM(RTRIM(SUBSTRING(@text, @startPos, @endPos - @startPos)));
END;
GO

-- Function to calculate word-level changes between sections
CREATE OR ALTER FUNCTION [dbo].[CalculateSectionChanges]
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

    -- Create temporary tables to store words and their positions
    DECLARE @words1 TABLE (word NVARCHAR(100), position INT);
    DECLARE @words2 TABLE (word NVARCHAR(100), position INT);
    
    -- Split sections into words with positions
    INSERT INTO @words1
    SELECT word, position FROM [dbo].[SplitIntoWords](@section1);
    
    INSERT INTO @words2
    SELECT word, position FROM [dbo].[SplitIntoWords](@section2);
    
    -- Calculate differences considering word order
    DECLARE @changes INT = (
        -- Count words in text1 that are different or in different positions in text2
        SELECT COUNT(*)
        FROM @words1 w1
        LEFT JOIN @words2 w2 ON w1.word = w2.word AND ABS(w1.position - w2.position) <= 2
        WHERE w2.word IS NULL
    ) + (
        -- Count words in text2 that are different or in different positions in text1
        SELECT COUNT(*)
        FROM @words2 w2
        LEFT JOIN @words1 w1 ON w2.word = w1.word AND ABS(w1.position - w2.position) <= 2
        WHERE w1.word IS NULL
    );
    
    RETURN @changes;
END;
GO