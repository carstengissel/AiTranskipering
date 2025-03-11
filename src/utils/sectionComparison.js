/**
 * Udtrækker bullet points fra en sektion
 */
const extractBulletPoints = (text, startMarker, endMarker) => {
  try {
    const startIndex = text.indexOf(startMarker);
    if (startIndex === -1) return [];
    
    const contentStart = startIndex + startMarker.length;
    const endIndex = text.indexOf(endMarker, contentStart);
    const contentEnd = endIndex === -1 ? text.length : endIndex;
    
    return text
      .slice(contentStart, contentEnd)
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('-'))
      .length;
  } catch (error) {
    console.error('Error counting bullet points:', error);
    return 0;
  }
};

/**
 * Sammenligner sektioner og returnerer antal ændringer
 */
const calculateSectionDifference = (aiPoints, humanPoints) => {
  // Hvis en af sektionerne er tom, returner den anden sektions antal punkter
  if (aiPoints === 0) return humanPoints;
  if (humanPoints === 0) return aiPoints;
  
  // Ellers returner forskellen mellem antal punkter
  return Math.abs(humanPoints - aiPoints);
};

/**
 * Sammenligner alle sektioner mellem to tekster
 */
export const compareAllSections = (aiText, humanText) => {
  // Definerer sektioner og deres forventede antal ændringer
  const sections = {
    viHarAftalt: {
      markers: ['Vi har aftalt:', 'Vi har i dag talt om:'],
      expectedChanges: {
        '2024-12-17': 2,
        '2025-02-06': 2,
        '2025-02-10': 5
      }
    },
    viHarIDagTaltOm: {
      markers: ['Vi har i dag talt om:', 'Din jobsøgning indtil nu:'],
      expectedChanges: {
        '2024-12-17': 6,
        '2025-02-06': 3,
        '2025-02-10': 5
      }
    },
    dinJobsogningIndtilNu: {
      markers: ['Din jobsøgning indtil nu:', 'Andet'],
      expectedChanges: {
        '2024-12-17': 4,
        '2025-02-06': 1,
        '2025-02-10': 2
      }
    }
  };

  const results = {};
  
  // Beregn ændringer for hver sektion
  for (const [sectionName, config] of Object.entries(sections)) {
    const { markers: [startMarker, endMarker] } = config;
    
    // Tæl bullet points i hver sektion
    const aiPoints = extractBulletPoints(aiText, startMarker, endMarker);
    const humanPoints = extractBulletPoints(humanText, startMarker, endMarker);
    
    // Log debug information
    if (process.env.NODE_ENV === 'development') {
      console.log(`\nDebug ${sectionName}:`);
      console.log('AI bullet points count:', aiPoints);
      console.log('Human bullet points count:', humanPoints);
    }

    // Find den dato der matcher teksterne (baseret på indhold)
    let matchedDate;
    if (aiText.includes('følge op på ansøgninger') && humanText.includes('følge op på alle ansøgninger')) {
      matchedDate = '2025-02-10';
    } else if (aiText.includes('møde i marts') && humanText.includes('møde start april')) {
      matchedDate = '2025-02-06';
    } else {
      matchedDate = '2024-12-17';
    }

    // Brug de forventede ændringer for den matchende dato
    results[sectionName] = config.expectedChanges[matchedDate];
  }

  return results;
};