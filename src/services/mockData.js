// Mock data for testing chart components
export const generateMockTimelineData = (startDate = '2025-02-01', days = 10) => {
  const result = [];
  const start = new Date(startDate);
  
  for (let i = 0; i < days; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);
    
    // Generate random data for this date
    const totalCount = Math.floor(Math.random() * 10) + 1;
    const viHarAftalt = Math.floor(Math.random() * totalCount);
    const viHarIDagTaltOm = Math.floor(Math.random() * totalCount);
    const dinJobsogningIndtilNu = Math.floor(Math.random() * totalCount);
    const uaendredeSektioner = totalCount - (viHarAftalt + viHarIDagTaltOm + dinJobsogningIndtilNu);
    
    result.push({
      date: currentDate.toISOString(),
      totalCount: totalCount,
      positiveFeedback: Math.floor(Math.random() * totalCount),
      negativeFeedback: Math.floor(Math.random() * totalCount),
      avgTimeToAiReport: Math.floor(Math.random() * 60) + 10,
      avgTimeToApproval: Math.floor(Math.random() * 120) + 30,
      viHarAftalt: viHarAftalt,
      viHarIDagTaltOm: viHarIDagTaltOm,
      dinJobsogningIndtilNu: dinJobsogningIndtilNu,
      uaendredeSektioner: uaendredeSektioner >= 0 ? uaendredeSektioner : 0,
      count: totalCount
    });
  }
  
  // Add a specific entry for February 6, 2025 with the changes matching the screenshot
  const feb6 = new Date('2025-02-06');
  const feb6Index = result.findIndex(item => {
    const itemDate = new Date(item.date);
    return itemDate.getDate() === 6 && 
           itemDate.getMonth() === 1 && // February is month 1 (0-indexed)
           itemDate.getFullYear() === 2025;
  });
  
  if (feb6Index >= 0) {
    // Update the existing entry
    result[feb6Index] = {
      ...result[feb6Index],
      totalCount: 1,
      viHarAftalt: 1,
      viHarIDagTaltOm: 1,
      dinJobsogningIndtilNu: 1,
      uaendredeSektioner: 0,
      count: 1
    };
  } else {
    // Add a new entry for February 6
    result.push({
      date: feb6.toISOString(),
      totalCount: 1,
      positiveFeedback: 1,
      negativeFeedback: 0,
      avgTimeToAiReport: 60,
      avgTimeToApproval: 329,
      viHarAftalt: 1,
      viHarIDagTaltOm: 1,
      dinJobsogningIndtilNu: 1,
      uaendredeSektioner: 0,
      count: 1
    });
  }
  
  // Sort by date
  result.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  return result;
};
