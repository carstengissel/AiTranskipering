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

  for (const line of lines) {
    const trimmedLine = line.trim().toLowerCase();
    
    // More flexible section matching using includes and lowercase
    if (trimmedLine.includes('vi har aftalt')) {
      currentSection = 'viHarAftalt';
      continue; // Skip the header line
    } else if (trimmedLine.includes('vi har i dag talt om')) {
      currentSection = 'viHarIDagTaltOm';
      continue; // Skip the header line
    } else if (trimmedLine.includes('din jobsøgning indtil nu')) {
      currentSection = 'dinJobsogningIndtilNu';
      continue; // Skip the header line
    }
    
    // Only add non-empty lines
    if (line.trim()) {
      sections[currentSection].push(line.trim());
    }
  }

  return sections;
};

export const sectionNames = {
  viHarAftalt: 'Vi har aftalt',
  viHarIDagTaltOm: 'Vi har i dag talt om',
  dinJobsogningIndtilNu: 'Din jobsøgning indtil nu',
  andet: 'Andet'
};
