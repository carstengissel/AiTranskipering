# Investigation of Section Changes Calculation Issues

## Problem Description
The changes for the sections "Vi har aftalt", "Vi har i dag talt om", "Din jobsøgning indtil nu", and "Andet" in the graphs "Sektionsændringer over tid" and "Gns. Sektionsændringer over tid" are not calculating correctly.

## Test Cases
### February 6, 2025
Expected changes:
- "Vi har aftalt": 2 changes
- "Vi har i dag talt om": 3 changes
- "Din jobsøgning indtil nu": 1 changes
- "Andet": 0 changes

### February 10, 2025
Expected changes:
- "Vi har aftalt": 5 changes
- "Vi har i dag talt om": 5 changes
- "Din jobsøgning indtil nu": 2 changes
- "Andet": 0 changes

## Current Implementation

### Frontend Change Calculation

#### ComparisonView.js
The frontend uses two different methods for calculating changes:

1. Word-level comparison with similarity threshold:
```javascript
// Split texts into words
const aiWords = aiText.trim().split(/\s+/).filter(word => word.length > 0);
const humanWords = humanText.trim().split(/\s+/).filter(word => word.length > 0);

// Use Levenshtein distance for word comparison
const wordSimilarity = (word1, word2) => {
  const maxLength = Math.max(word1.length, word2.length);
  const distance = levenshteinDistance(word1, word2);
  return (maxLength - distance) / maxLength;
};

// Compare words with similarity threshold
if (similarity < 0.8) { // If words are less than 80% similar, count as change
  changes++;
}
```

#### comparisonUtils.js
The frontend also uses the 'diff' library for word-level comparison:
```javascript
export const getDiffCounts = (text1, text2) => {
  const diff = diffWords(text1 || '', text2 || '');
  return diff.reduce(
    (counts, part) => ({
      additions: counts.additions + (part.added ? part.value.trim().split(/\s+/).filter(word => word.length > 0).length : 0),
      deletions: counts.deletions + (part.removed ? part.value.trim().split(/\s+/).filter(word => word.length > 0).length : 0),
    }),
    { additions: 0, deletions: 0 }
  );
};

export const getTotalChanges = (counts) => {
  return counts.additions + counts.deletions;
};
```

This implementation:
1. Uses the 'diff' library's diffWords function to identify added and removed words
2. Counts the number of words in added and removed sections
3. Calculates total changes as the sum of additions and deletions

### Backend SQL Query (server.js)
The backend calculates changes in a very different way. For each section, it:

1. Extracts the section content using SUBSTRING and CHARINDEX
2. Compares the length difference between AI and human versions
3. Divides by a factor (10 or 20) to approximate word-level changes

Here's the SQL for "Vi har aftalt" section:
```sql
CASE 
    WHEN referat LIKE '%Vi har aftalt%' AND ai_referat LIKE '%Vi har aftalt%' THEN
        CASE 
            WHEN referat = ai_referat THEN 0  -- No changes
            ELSE
                CASE
                    -- Extract the section content between headers
                    WHEN CHARINDEX('Vi har aftalt', referat) > 0 AND CHARINDEX('Vi har i dag talt om', referat) > 0 THEN
                        -- Extract the "Vi har aftalt" section from both texts and compare
                        CEILING(
                            ABS(
                                LEN(SUBSTRING(referat, 
                                    CHARINDEX('Vi har aftalt', referat), 
                                    CHARINDEX('Vi har i dag talt om', referat) - CHARINDEX('Vi har aftalt', referat)
                                )) -
                                LEN(SUBSTRING(ai_referat, 
                                    CHARINDEX('Vi har aftalt', ai_referat), 
                                    CHARINDEX('Vi har i dag talt om', ai_referat) - CHARINDEX('Vi har aftalt', ai_referat)
                                ))
                            ) / 10
                        )
                    ELSE CEILING(ABS(LEN(referat) - LEN(ai_referat)) / 20)  -- Fallback
                END
        END
    ELSE 0 
END
```

Key issues with the backend implementation:

1. Character-based vs Word-based:
   - Frontend counts changes at the word level
   - Backend uses character length differences divided by arbitrary factors (10 or 20)

2. Section Extraction Issues:
   - Relies on finding exact header text matches
   - Assumes sections always appear in the same order
   - May fail if headers appear multiple times or in different orders

3. Approximation Problems:
   - Dividing by 10 or 20 is a rough approximation of word count
   - Doesn't account for word length variations
   - Can't accurately detect word-level changes

4. Edge Cases:
   - Falls back to comparing entire text lengths if section markers aren't found
   - No handling for partial section matches
   - May miss changes if text structure varies

## Root Cause
The discrepancy between the frontend cards and the graphs is due to fundamentally different calculation methods:

1. Frontend (Cards):
   - Uses actual word-level comparison
   - Considers word similarity with Levenshtein distance
   - Also uses diff library for accurate change detection

2. Backend (Graphs):
   - Uses character length differences
   - Applies arbitrary division factors
   - Relies on exact section header matching

## Solution Proposal

1. Create SQL Functions for Word Processing:
```sql
-- Split text into words
CREATE FUNCTION dbo.SplitIntoWords (@text NVARCHAR(MAX))
RETURNS TABLE
AS
RETURN
    SELECT value AS word
    FROM STRING_SPLIT(REPLACE(REPLACE(@text, CHAR(13), ' '), CHAR(10), ' '), ' ')
    WHERE TRIM(value) != '';

-- Count words between markers
CREATE FUNCTION dbo.CountWordsBetween 
(
    @text NVARCHAR(MAX),
    @startMarker NVARCHAR(100),
    @endMarker NVARCHAR(100)
)
RETURNS INT
AS
BEGIN
    DECLARE @startPos INT = CHARINDEX(@startMarker, @text)
    DECLARE @endPos INT = CHARINDEX(@endMarker, @text, @startPos + LEN(@startMarker))
    
    IF @startPos = 0 RETURN 0
    IF @endPos = 0 SET @endPos = LEN(@text) + 1
    
    DECLARE @section NVARCHAR(MAX) = SUBSTRING(@text, 
        @startPos + LEN(@startMarker),
        @endPos - (@startPos + LEN(@startMarker))
    )
    
    RETURN (
        SELECT COUNT(*)
        FROM dbo.SplitIntoWords(@section)
    )
END
```

2. Update the Timeline Query:
```sql
-- Replace the current CASE expressions with:
SUM(
    SELECT COUNT(*)
    FROM (
        SELECT w.word
        FROM dbo.SplitIntoWords(
            dbo.ExtractSection(referat, 'Vi har aftalt', 'Vi har i dag talt om')
        ) w
        EXCEPT
        SELECT w.word
        FROM dbo.SplitIntoWords(
            dbo.ExtractSection(ai_referat, 'Vi har aftalt', 'Vi har i dag talt om')
        ) w
    ) diff
) as viHarAftalt_count
```

3. Test and Validate:
   - Compare results with frontend calculations
   - Verify against test cases
   - Add unit tests for edge cases

## Next Steps
1. Implement the SQL functions for word processing
2. Update the timeline query to use word-level comparison
3. Add error handling for section extraction
4. Add logging for debugging
5. Create test suite for validation
6. Deploy changes incrementally to minimize risk