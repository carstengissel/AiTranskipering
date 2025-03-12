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

-- Function to calculate Levenshtein distance between two strings
CREATE OR ALTER FUNCTION [dbo].[LevenshteinDistance]
(
    @s1 NVARCHAR(MAX),
    @s2 NVARCHAR(MAX)
)
RETURNS INT
AS
BEGIN
    DECLARE @len1 INT = LEN(@s1);
    DECLARE @len2 INT = LEN(@s2);
    
    -- Create a table to store distances
    DECLARE @d TABLE (
        i INT,
        j INT,
        dist INT,
        PRIMARY KEY (i, j)
    );
    
    -- Initialize first row and column
    DECLARE @i INT = 0;
    DECLARE @j INT = 0;
    
    WHILE @i <= @len1
    BEGIN
        INSERT INTO @d (i, j, dist) VALUES (@i, 0, @i);
        SET @i = @i + 1;
    END;
    
    WHILE @j <= @len2
    BEGIN
        INSERT INTO @d (i, j, dist) VALUES (0, @j, @j);
        SET @j = @j + 1;
    END;
    
    -- Calculate distances
    SET @i = 1;
    WHILE @i <= @len1
    BEGIN
        SET @j = 1;
        WHILE @j <= @len2
        BEGIN
            IF SUBSTRING(@s1, @i, 1) = SUBSTRING(@s2, @j, 1)
                INSERT INTO @d (i, j, dist)
                SELECT @i, @j, MIN(dist)
                FROM (
                    SELECT d.dist
                    FROM @d d
                    WHERE d.i = @i - 1 AND d.j = @j - 1
                    UNION ALL
                    SELECT d.dist + 1
                    FROM @d d
                    WHERE d.i = @i - 1 AND d.j = @j
                    UNION ALL
                    SELECT d.dist + 1
                    FROM @d d
                    WHERE d.i = @i AND d.j = @j - 1
                ) AS distances;
            ELSE
                INSERT INTO @d (i, j, dist)
                SELECT @i, @j, MIN(dist) + 1
                FROM (
                    SELECT d.dist
                    FROM @d d
                    WHERE d.i = @i - 1 AND d.j = @j - 1
                    UNION ALL
                    SELECT d.dist
                    FROM @d d
                    WHERE d.i = @i - 1 AND d.j = @j
                    UNION ALL
                    SELECT d.dist
                    FROM @d d
                    WHERE d.i = @i AND d.j = @j - 1
                ) AS distances;
            
            SET @j = @j + 1;
        END;
        SET @i = @i + 1;
    END;
    
    RETURN (SELECT dist FROM @d WHERE i = @len1 AND j = @len2);
END;
GO

-- Function to extract sections and let frontend handle diff calculation
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
    
    -- Return 0 if either section is empty
    IF @section1 = '' OR @section2 = '' RETURN 0;
    
    -- Return 1 if sections are different, letting frontend handle actual diff calculation
    IF @section1 <> @section2 RETURN 1;
    
    RETURN 0;
END;
GO