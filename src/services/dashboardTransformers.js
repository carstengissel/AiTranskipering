import { diffWords } from 'diff';

export const parseReferat = (referat) => {
  if (!referat) {
    return {
      viHarAftalt: '',
      viHarIDagTaltOm: '',
      dinJobsogningIndtilNu: ''
    };
  }

  const sections = {
    viHarAftalt: '',
    viHarIDagTaltOm: '',
    dinJobsogningIndtilNu: ''
  };

  console.log('Type of referat in parseReferat:', typeof referat);

  const lines = referat.split('\n');
  let currentSection = null;
  let sectionText = [];

  for (const line of lines) {
    if (line.includes('Vi har aftalt')) {
      if (currentSection) {
        sections[currentSection] = sectionText.join('\n');
      }
      currentSection = 'viHarAftalt';
      sectionText = [];
    } else if (line.includes('Vi har i dag talt om')) {
      if (currentSection) {
        sections[currentSection] = sectionText.join('\n');
      }
      currentSection = 'viHarIDagTaltOm';
      sectionText = [];
    } else if (line.includes('Din jobsøgning indtil nu')) {
      if (currentSection) {
        sections[currentSection] = sectionText.join('\n');
      }
      currentSection = 'dinJobsogningIndtilNu';
      sectionText = [];
    } else if (currentSection && line.trim()) {
      sectionText.push(line.trim());
    }
  }

  if (currentSection) {
    sections[currentSection] = sectionText.join('\n');
  }

  return sections;
};

export const countChangedSections = (originalReferat, aiReferat) => {
  const originalSections = parseReferat(originalReferat);
  const aiSections = parseReferat(aiReferat);

  // If the referats are identical, return all zeros
  if (originalReferat === aiReferat) {
    return {
      viHarAftalt: 0,
      viHarIDagTaltOm: 0,
      dinJobsogningIndtilNu: 0
    };
  }

  const countDiffsInSection = (original, ai) => {
    if (!original && !ai) return 0;
    const diff = diffWords(original || '', ai || '');
    return diff.reduce((count, part) => {
      return count + (part.added || part.removed ? 1 : 0);
    }, 0);
  };

  return {
    viHarAftalt: countDiffsInSection(originalSections.viHarAftalt, aiSections.viHarAftalt),
    viHarIDagTaltOm: countDiffsInSection(originalSections.viHarIDagTaltOm, aiSections.viHarIDagTaltOm),
    dinJobsogningIndtilNu: countDiffsInSection(originalSections.dinJobsogningIndtilNu, aiSections.dinJobsogningIndtilNu)
  };
};

const parseReferatSections = (referat) => {
  if (!referat) {
    return {
      viHarAftalt: '',
      viHarIDagTaltOm: '',
      dinJobsogningIndtilNu: ''
    };
  }

  return parseReferat(referat);
};

export const calculateKPIs = (data, samtaletyper) => {
  if (!data || !data.length) {
    return {
      avgThumbsUpRate: "0.00",
      avgThumbsDownRate: "0.00",
      avgTimeToAIReport: "0.00",
      avgTimeToApproval: "0.00",
      unchangedSectionsPercentage: "0.00",
      mostFrequentType: "2. og 3. jobsamtale",
      conversationTypeCounts: { "2. og 3. jobsamtale": 0 }
    };
  }

  const totalThumbsUp = data.reduce((sum, stat) => sum + (stat.thumbsUp || 0), 0);
  const totalThumbsDown = data.reduce((sum, stat) => sum + (stat.thumbsDown || 0), 0);
  
  // Calculate total number of conversations
  const totalConversations = data.reduce((sum, stat) => sum + (stat.count || 0), 0);
  
  // Calculate thumbs up rate against total conversations
  const avgThumbsUpRate = totalConversations === 0 ? 
    "0.00" : 
    ((totalThumbsUp / totalConversations * 100) || 0).toFixed(2);

  // Calculate thumbs down rate against total conversations
  const avgThumbsDownRate = totalConversations === 0 ?
    "0.00" :
    ((totalThumbsDown / totalConversations * 100) || 0).toFixed(2);

  const avgTimeToAIReport = (data.reduce((sum, stat) => sum + (stat.tidTilAIReferat || 0), 0) / data.length).toFixed(2);
  const avgTimeToApproval = (data.reduce((sum, stat) => sum + (stat.tidTilGodkendelse || 0), 0) / data.length).toFixed(2);
  
  const totalSections = data.reduce((sum, stat) => sum + ((stat.count || 0) * 3), 0);
  const totalUnchangedSections = data.reduce((sum, stat) => {
    const unchangedCount = Object.values(stat).filter(val => 
      typeof val === 'number' && val === 0 && 
      ['viHarAftalt', 'viHarIDagTaltOm', 'dinJobsogningIndtilNu'].some(key => stat[key] === val)
    ).length;
    return sum + unchangedCount;
  }, 0);
  
  const unchangedSectionsPercentage = totalSections === 0 ? 
    "0.00" : 
    ((totalUnchangedSections / totalSections * 100) || 0).toFixed(2);

  // Count conversation types using ledetekst directly from the data
  const conversationTypeCounts = data.reduce((acc, stat) => {
    const type = stat.ledetekst || "2. og 3. jobsamtale";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Find the most frequent type
  const mostFrequentType = Object.entries(conversationTypeCounts).length > 0 ?
    Object.entries(conversationTypeCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0] :
    "2. og 3. jobsamtale";

  return {
    avgThumbsUpRate,
    avgThumbsDownRate,
    avgTimeToAIReport,
    avgTimeToApproval,
    unchangedSectionsPercentage,
    mostFrequentType,
    conversationTypeCounts
  };
};

// Process a single referat
const processReferat = (referat, aiReferat) => {
  if (!referat || !referat.reg_tid || !aiReferat) {
    console.log('Missing required data:', { referat, aiReferat });
    return null;
  }

  try {
    const date = new Date(referat.reg_tid);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', referat.reg_tid);
      return null;
    }

    console.log('Processing referat:', {
      id: `${referat.medl_ident}-${referat.samind_lbnr}`,
      aiReferat: {
        feedback: aiReferat.feedback,
        feedback_beskrivelse: aiReferat.feedback_beskrivelse,
      },
      timingValues: {
        tid_til_godkendelse: referat.tid_til_godkendelse,
        tid_til_ai_referat: referat.tid_til_ai_referat,
        raw_reg_tid: referat.reg_tid,
        raw_ai_reg_tid: aiReferat.reg_tid
      }
    });

    const sectionChanges = countChangedSections(referat.referat, aiReferat.referat);
    
    // Calculate unchanged sections based on sections with zero changes
    const unchangedSections = Object.values(sectionChanges).filter(changes => changes === 0).length;

    // Convert feedback to number and ensure it's a valid value (-1, 0, or 1)
    const feedbackValue = Number(aiReferat.feedback);
    console.log('Feedback value after conversion:', {
      original: aiReferat.feedback,
      converted: feedbackValue,
      type: typeof feedbackValue,
      isNaN: isNaN(feedbackValue),
      isNegative: feedbackValue === -1,
      isPositive: feedbackValue === 1
    });

    // Ensure feedback is a valid value (-1, 0, or 1)
    const normalizedFeedback = isNaN(feedbackValue) ? 0 : 
                             feedbackValue === -1 ? -1 : 
                             feedbackValue === 1 ? 1 : 0;

    return {
      id: `${referat.medl_ident}-${referat.samind_lbnr}`,
      date: date.toISOString().split('T')[0],
      reg_tid: referat.reg_tid,
      medl_ident: referat.medl_ident,
      samind_lbnr: referat.samind_lbnr,
      referat: referat.referat,
      aiReferat: aiReferat.referat,
      feedback_beskrivelse: aiReferat.feedback_beskrivelse,
      samtyp_type: referat.samtyp_type,
      ledetekst: referat.ledetekst,
      ...sectionChanges,
      uaendredeSektioner: unchangedSections,
      tidTilGodkendelse: referat.tid_til_godkendelse || null,
      tidTilAIReferat: referat.tid_til_ai_referat || null,
      feedback: normalizedFeedback,
      thumbsUp: normalizedFeedback === 1 ? 1 : 0,
      thumbsDown: normalizedFeedback === -1 ? 1 : 0,
      count: 1
    };
  } catch (err) {
    console.error('Error processing referat:', err);
    return null;
  }
};

export const transformReferatDataForSummary = (referatData, aiReferatData) => {
  console.log('Transforming data for summary:', { referatData, aiReferatData });
  
  if (!Array.isArray(referatData) || !Array.isArray(aiReferatData)) {
    console.warn('Invalid input data:', { referatData, aiReferatData });
    return [];
  }

  return referatData
    .map(referat => {
      const aiReferat = aiReferatData.find(ai => 
        ai && ai.medl_ident === referat.medl_ident && 
        ai.samind_lbnr === referat.samind_lbnr
      );
      return processReferat(referat, aiReferat);
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.reg_tid) - new Date(b.reg_tid));
};

export const transformReferatDataForCharts = (referatData, aiReferatData) => {
  console.log('Transforming data for charts:', { referatData, aiReferatData });
  
  if (!Array.isArray(referatData) || !Array.isArray(aiReferatData)) {
    console.warn('Invalid input data:', { referatData, aiReferatData });
    return [];
  }

  const processedReferats = referatData
    .map(referat => {
      const aiReferat = aiReferatData.find(ai => 
        ai && ai.medl_ident === referat.medl_ident && 
        ai.samind_lbnr === referat.samind_lbnr
      );
      return processReferat(referat, aiReferat);
    })
    .filter(Boolean);

  const groupedByDate = processedReferats.reduce((acc, item) => {
    if (!acc[item.date]) {
      acc[item.date] = {
        date: item.date,
        viHarAftalt: 0,
        viHarIDagTaltOm: 0,
        dinJobsogningIndtilNu: 0,
        uaendredeSektioner: 0,
        thumbsUp: 0,
        thumbsDown: 0,
        tidTilGodkendelse: [],  
        tidTilAIReferat: [],   
        count: 0,
        conversations: new Set(),
        conversationTypes: new Set()
      };
    }
    
    acc[item.date].viHarAftalt += item.viHarAftalt;
    acc[item.date].viHarIDagTaltOm += item.viHarIDagTaltOm;
    acc[item.date].dinJobsogningIndtilNu += item.dinJobsogningIndtilNu;
    acc[item.date].uaendredeSektioner += item.uaendredeSektioner;
    acc[item.date].thumbsUp += item.thumbsUp;
    acc[item.date].thumbsDown += item.thumbsDown;
    
    if (item.tidTilGodkendelse) {
      acc[item.date].tidTilGodkendelse.push(item.tidTilGodkendelse);
    }
    if (item.tidTilAIReferat) {
      acc[item.date].tidTilAIReferat.push(item.tidTilAIReferat);
    }
    
    const conversationId = `${item.medl_ident}-${item.samind_lbnr}`;
    acc[item.date].conversations.add(conversationId);
    
    const conversationType = item.ledetekst || "2. og 3. jobsamtale";
    acc[item.date].conversationTypes.add(conversationType);
    
    acc[item.date].count = acc[item.date].conversations.size; 
    
    return acc;
  }, {});

  return Object.values(groupedByDate)
    .map(({ conversations, conversationTypes, ...rest }) => ({
      ...rest,
      tidTilGodkendelse: rest.tidTilGodkendelse.length 
        ? rest.tidTilGodkendelse.reduce((a, b) => a + b, 0) / rest.tidTilGodkendelse.length 
        : 0,
      tidTilAIReferat: rest.tidTilAIReferat.length 
        ? rest.tidTilAIReferat.reduce((a, b) => a + b, 0) / rest.tidTilAIReferat.length 
        : 0,
      conversationTypes: Array.from(conversationTypes || [])
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};

export const transformReferatData = transformReferatDataForCharts;
