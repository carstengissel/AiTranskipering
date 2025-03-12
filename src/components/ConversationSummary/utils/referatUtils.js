/**
 * Parse a conversation report text into structured sections
 * Splits the text into predefined sections based on specific headers
 * 
 * @param {string} referat - The raw report text to parse
 * @returns {Object} Object containing arrays of text for each section
 * @property {string[]} viHarAftalt - "Vi har aftalt" section content
 * @property {string[]} viHarIDagTaltOm - "Vi har i dag talt om" section content
 * @property {string[]} dinJobsogningIndtilNu - "Din jobsøgning indtil nu" section content
 * @property {string[]} andet - Other content not fitting in specific sections
 * 
 * @example
 * parseReferat("Vi har aftalt\n- Point 1\n- Point 2\nVi har i dag talt om\n- Topic 1")
 * // returns {
 * //   viHarAftalt: ["- Point 1", "- Point 2"],
 * //   viHarIDagTaltOm: ["- Topic 1"],
 * //   dinJobsogningIndtilNu: [],
 * //   andet: []
 * // }
 */
export const parseReferat = (referat) => {
  if (!referat) {
    return {
      viHarAftalt: [],
      viHarIDagTaltOm: [],
      dinJobsogningIndtilNu: [],
      andet: []
    };
  }

  const sections = {
    viHarAftalt: [],
    viHarIDagTaltOm: [],
    dinJobsogningIndtilNu: [],
    andet: []
  };

  const lines = referat.split('\n');
  let currentSection = 'andet';
  let currentText = '';

  // Process each line and categorize into appropriate sections
  for (const line of lines) {
    if (line.includes('Vi har aftalt')) {
      if (currentText.trim()) {
        sections[currentSection].push(currentText.trim());
      }
      currentSection = 'viHarAftalt';
      currentText = '';
    } else if (line.includes('Vi har i dag talt om')) {
      if (currentText.trim()) {
        sections[currentSection].push(currentText.trim());
      }
      currentSection = 'viHarIDagTaltOm';
      currentText = '';
    } else if (line.includes('Din jobsøgning indtil nu')) {
      if (currentText.trim()) {
        sections[currentSection].push(currentText.trim());
      }
      currentSection = 'dinJobsogningIndtilNu';
      currentText = '';
    } else if (line.trim()) {
      // Handle bullet points and regular text differently
      if (line.trim().startsWith('- ')) {
        if (currentText.trim()) {
          sections[currentSection].push(currentText.trim());
          currentText = '';
        }
        sections[currentSection].push(line.trim());
      } else {
        currentText += (currentText ? ' ' : '') + line.trim();
      }
    }
  }

  // Add any remaining text
  if (currentText.trim()) {
    sections[currentSection].push(currentText.trim());
  }

  return sections;
};

/**
 * Calculate the end time by adding minutes to a start time
 * @param {string} startTime - Start time in ISO format
 * @param {number} minutes - Minutes to add
 * @returns {Date} End time as Date object
 */
export const calculateEndTime = (startTime, minutes) => {
  if (!startTime || typeof minutes !== 'number') return null;
  const startDate = new Date(startTime);
  return new Date(startDate.getTime() + minutes * 60000);
};

/**
 * Get the sequence number for a report on a specific date
 * Used to number multiple reports from the same date
 * 
 * @param {Object} referat - The report object
 * @param {Array} allReferats - Array of all reports
 * @returns {number} Sequence number for the report on its date
 * 
 * @example
 * // If there are two reports on 2024-01-01, returns 1 for the first and 2 for the second
 */
export const getSequenceNumberForDate = (referat, allReferats) => {
  const referatDate = new Date(referat.referat_godkendt_at).toISOString().split('T')[0];
  
  // Get all reports from the same date and sort by registration time
  const sameDayReferats = allReferats
    .filter(r => new Date(r.referat_godkendt_at).toISOString().split('T')[0] === referatDate)
    .sort((a, b) => new Date(a.referat_godkendt_at) - new Date(b.referat_godkendt_at));
  
  // Find the index of the current report in the sorted list
  const sequence = sameDayReferats.findIndex(r => 
    r.medl_ident === referat.medl_ident && 
    r.samind_lbnr === referat.samind_lbnr
  ) + 1;
  
  return sequence;
};

/**
 * Format a report title including date and sequence number
 * Creates a standardized title format for reports
 * 
 * @param {Object} referat - The report object
 * @param {Array} allReferats - Array of all reports
 * @returns {string} Formatted title string
 * 
 * @example
 * formatReferatTitle(referat, allReferats)
 * // returns "Referat 11.11.2024 - #1"
 */
export const formatReferatTitle = (referat, allReferats) => {
  if (!referat.referat_godkendt_at) return 'Referat';
  const date = new Date(referat.referat_godkendt_at).toLocaleDateString();
  const sequence = getSequenceNumberForDate(referat, allReferats);
  return `Referat ${date}${sequence > 1 ? ` - #${sequence}` : ''}`;
};

/**
 * Calculate the change percentage between two reports
 * Returns the average change percentage across all sections
 * 
 * @param {string} aiReferat - AI generated report text
 * @param {string} referat - Original report text
 * @returns {number} Average change percentage across all sections
 */
export const calculateChangePercentage = (aiReferat, referat) => {
  if (!aiReferat || !referat) return 0;
  
  const aiParsed = parseReferat(aiReferat);
  const humanParsed = parseReferat(referat);
  
  // Calculate percentage for each section
  const sections = ['viHarAftalt', 'viHarIDagTaltOm', 'dinJobsogningIndtilNu', 'andet'];
  let totalSectionPercentage = 0;
  let nonEmptySections = 0;
  const sectionPercentages = {};

  sections.forEach(section => {
    // Join all lines with newlines to preserve structure
    const aiText = aiParsed[section].join('\n');
    const humanText = humanParsed[section].join('\n');
    
    // Only include sections that have content in either version
    if (aiText.trim() || humanText.trim()) {
      if (humanText.trim()) {
        // Convert texts to character arrays, including spaces and punctuation
        const aiChars = Array.from(aiText);
        const humanChars = Array.from(humanText);
        
        let changes = 0;
        let consecutiveChanges = 0;
        let i = 0;
        let j = 0;
        
        // Compare characters to count changes
        while (i < humanChars.length || j < aiChars.length) {
          if (i >= humanChars.length) {
            // Remaining AI chars are additions
            changes += aiChars.length - j;
            break;
          }
          if (j >= aiChars.length) {
            // Remaining human chars are deletions
            changes += humanChars.length - i;
            break;
          }
          
          if (humanChars[i] !== aiChars[j]) {
            // Character is different - count as a change
            consecutiveChanges++;
            changes++;
            i++;
            j++;
          } else {
            // Character matches - no change
            // Only count changes if they exceed the minimum threshold
            if (consecutiveChanges < 3) {
              changes -= consecutiveChanges;
            }
            consecutiveChanges = 0;
            i++;
            j++;
          }
        }
        
        // Calculate percentage based on changes relative to original character count
        // Multiply by 0.25 to reduce the overall percentage since we're counting every small change
        const sectionPercentage = Math.min(100, Math.round((changes / humanChars.length) * 25));
        sectionPercentages[section] = sectionPercentage;
        
        // Only include main sections in the average
        if (['viHarAftalt', 'viHarIDagTaltOm', 'dinJobsogningIndtilNu'].includes(section)) {
          totalSectionPercentage += sectionPercentage;
          nonEmptySections++;
        }

      }
    }
  });
  
  // For the card view, use average of main sections
  const displayPercentage = nonEmptySections > 0 ? Math.round(totalSectionPercentage / nonEmptySections) : 0;
  
  return displayPercentage;
};

// Helper function to diff words between two strings
function diffWords(oldText, newText) {
  if (!oldText || !newText) return [];
  
  const oldWords = oldText.split(/\s+/).filter(word => word.trim());
  const newWords = newText.split(/\s+/).filter(word => word.trim());
  const diff = [];
  
  let i = 0;
  let j = 0;
  
  while (i < oldWords.length || j < newWords.length) {
    if (i >= oldWords.length) {
      // Remaining words in new text are additions
      diff.push({ added: true, value: newWords.slice(j).join(' ') });
      break;
    }
    if (j >= newWords.length) {
      // Remaining words in old text are removals
      diff.push({ removed: true, value: oldWords.slice(i).join(' ') });
      break;
    }
    
    if (oldWords[i] === newWords[j]) {
      // Words match - unchanged
      diff.push({ value: oldWords[i] });
      i++;
      j++;
    } else {
      // Words don't match - handle as removal and addition
      diff.push({ removed: true, value: oldWords[i] });
      if (j < newWords.length) {
        diff.push({ added: true, value: newWords[j] });
      }
      i++;
      j++;
    }
  }
  
  return diff;
}

/**
 * Get the color class for a change percentage
 * 
 * @param {number} changePercentage - Change percentage
 * @returns {string} Color class
 */
export const getChangeColorClass = (changePercentage) => {
  if (changePercentage <= 25) {
    return 'bg-green-200 hover:bg-green-300';  // Green for minimal changes (0-25%)
  } else if (changePercentage <= 70) {
    return 'bg-yellow-200 hover:bg-yellow-300';  // Yellow for moderate changes (26-70%)
  } else {
    return 'bg-red-200 hover:bg-red-300';  // Red for significant changes (71-100%)
  }
};

// Helper function to calculate Levenshtein distance between two strings
export function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }

  return dp[m][n];
}
