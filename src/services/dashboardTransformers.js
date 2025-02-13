import { diffWords } from 'diff';

export const parseReferat = (referat) => {
  if (!referat) {
    return {
      viHarAftalt: '',
      viHarIDagTaltOm: '',
      dinJobsogningIndtilNu: ''
    };
  }

  try {
    const text = typeof referat === 'string' ? referat : '';
    const sections = {
      viHarAftalt: '',
      viHarIDagTaltOm: '',
      dinJobsogningIndtilNu: ''
    };

    // Extract sections using regex
    const viHarAftaltMatch = text.match(/Vi har aftalt[^]*?([\s\S]*?)(?=Vi har i dag talt om|Din jobsøgning indtil nu|$)/i);
    const viHarTaltOmMatch = text.match(/Vi har i dag talt om[^]*?([\s\S]*?)(?=Vi har aftalt|Din jobsøgning indtil nu|$)/i);
    const jobsogningMatch = text.match(/Din jobsøgning indtil nu[^]*?([\s\S]*?)(?=Vi har aftalt|Vi har i dag talt om|$)/i);

    if (viHarAftaltMatch) sections.viHarAftalt = viHarAftaltMatch[1].trim();
    if (viHarTaltOmMatch) sections.viHarIDagTaltOm = viHarTaltOmMatch[1].trim();
    if (jobsogningMatch) sections.dinJobsogningIndtilNu = jobsogningMatch[1].trim();

    return sections;
  } catch (err) {
    console.error('Error parsing referat:', err);
    return {
      viHarAftalt: '',
      viHarIDagTaltOm: '',
      dinJobsogningIndtilNu: ''
    };
  }
};

export const countChangedSections = (originalReferat, aiReferat) => {
  const originalSections = parseReferat(originalReferat);
  const aiSections = parseReferat(aiReferat);

  const changes = {
    viHarAftalt: 0,
    viHarIDagTaltOm: 0,
    dinJobsogningIndtilNu: 0
  };

  // Calculate changes for each section using diffWords
  if (originalSections.viHarAftalt !== aiSections.viHarAftalt) {
    const diff = diffWords(aiSections.viHarAftalt, originalSections.viHarAftalt);
    changes.viHarAftalt = diff.filter(part => part.added || part.removed).length;
  }

  if (originalSections.viHarIDagTaltOm !== aiSections.viHarIDagTaltOm) {
    const diff = diffWords(aiSections.viHarIDagTaltOm, originalSections.viHarIDagTaltOm);
    changes.viHarIDagTaltOm = diff.filter(part => part.added || part.removed).length;
  }

  if (originalSections.dinJobsogningIndtilNu !== aiSections.dinJobsogningIndtilNu) {
    const diff = diffWords(aiSections.dinJobsogningIndtilNu, originalSections.dinJobsogningIndtilNu);
    changes.dinJobsogningIndtilNu = diff.filter(part => part.added || part.removed).length;
  }

  return changes;
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

  // Calculate feedback statistics including NULL values in total
  const totalRecords = data.length; // Include all records
  const totalThumbsUp = data.filter(stat => stat.feedback === 1).length;
  const totalThumbsDown = data.filter(stat => stat.feedback === -1).length;
  
  // Calculate rates based on total records (including NULL)
  const avgThumbsUpRate = totalRecords === 0 ? 
    "0.00" : 
    ((totalThumbsUp / totalRecords * 100)).toFixed(2);

  const avgThumbsDownRate = totalRecords === 0 ?
    "0.00" :
    ((totalThumbsDown / totalRecords * 100)).toFixed(2);

  // Calculate time statistics with proper validation
  const validTimeToAIReports = data.filter(stat => 
    typeof stat.tidTilAIReferat === 'number' && 
    !isNaN(stat.tidTilAIReferat) && 
    stat.tidTilAIReferat > 0
  );
  
  const validTimeToApproval = data.filter(stat => 
    typeof stat.tidTilGodkendelse === 'number' && 
    !isNaN(stat.tidTilGodkendelse) && 
    stat.tidTilGodkendelse > 0
  );

  const avgTimeToAIReport = validTimeToAIReports.length === 0 ? 
    "0.00" : 
    (validTimeToAIReports.reduce((sum, stat) => sum + stat.tidTilAIReferat, 0) / validTimeToAIReports.length).toFixed(2);

  const avgTimeToApproval = validTimeToApproval.length === 0 ?
    "0.00" :
    (validTimeToApproval.reduce((sum, stat) => sum + stat.tidTilGodkendelse, 0) / validTimeToApproval.length).toFixed(2);
  
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

    // Process feedback value from database
    const feedbackValue = aiReferat.feedback;
    console.log('Processing feedback:', {
      original: aiReferat.feedback,
      type: typeof feedbackValue,
      value: feedbackValue
    });

    // The feedback value should already be 1, -1, or null from the SQL CASE statement
    const normalizedFeedback = typeof feedbackValue === 'number' && (feedbackValue === 1 || feedbackValue === -1)
      ? feedbackValue
      : 0;

    // Process time values - they come as minutes from DATEDIFF in SQL
    const tidTilAIReferat = typeof referat.tid_fra_transskription_til_ai_referat === 'number' && 
                           !isNaN(referat.tid_fra_transskription_til_ai_referat)
                           ? Math.max(0, Math.min(referat.tid_fra_transskription_til_ai_referat, 1000)) // Cap at 1000 minutes
                           : null;

    const tidTilGodkendelse = typeof referat.tid_til_godkendelse === 'number' && 
                             !isNaN(referat.tid_til_godkendelse)
                             ? Math.max(0, Math.min(referat.tid_til_godkendelse, 1440)) // Cap at 24 hours
                             : null;

    console.log('Processing time values:', {
      original: {
        tidTilAIReferat: referat.tid_fra_transskription_til_ai_referat,
        tidTilGodkendelse: referat.tid_til_godkendelse
      },
      normalized: {
        tidTilAIReferat,
        tidTilGodkendelse
      }
    });

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
      tidTilGodkendelse: tidTilGodkendelse,
      tidTilAIReferat: tidTilAIReferat,
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

  // First, log the processed referats to check the data
  console.log('Processed referats before grouping:', 
    processedReferats.map(item => ({
      date: item.date,
      feedback: item.feedback,
      thumbsUp: item.thumbsUp,
      thumbsDown: item.thumbsDown,
      tidTilAIReferat: item.tidTilAIReferat,
      tidTilGodkendelse: item.tidTilGodkendelse
    }))
  );

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
        feedback: [],
        tidTilGodkendelse: [],  
        tidTilAIReferat: [],   
        count: 0,
        conversations: new Set(),
        conversationTypes: new Set()
      };
    }
    
    // Update section changes
    acc[item.date].viHarAftalt += item.viHarAftalt || 0;
    acc[item.date].viHarIDagTaltOm += item.viHarIDagTaltOm || 0;
    acc[item.date].dinJobsogningIndtilNu += item.dinJobsogningIndtilNu || 0;
    acc[item.date].uaendredeSektioner += item.uaendredeSektioner || 0;
    
    // Track feedback values
    if (item.feedback === 1 || item.feedback === -1) {
      acc[item.date].feedback.push(item.feedback);
      if (item.feedback === 1) acc[item.date].thumbsUp++;
      if (item.feedback === -1) acc[item.date].thumbsDown++;
    }
    
    // Track time values only if they are valid numbers
    if (typeof item.tidTilGodkendelse === 'number' && 
        !isNaN(item.tidTilGodkendelse) && 
        item.tidTilGodkendelse > 0) {
      acc[item.date].tidTilGodkendelse.push(item.tidTilGodkendelse);
    }
    
    if (typeof item.tidTilAIReferat === 'number' && 
        !isNaN(item.tidTilAIReferat) && 
        item.tidTilAIReferat > 0) {
      acc[item.date].tidTilAIReferat.push(item.tidTilAIReferat);
    }
    
    const conversationId = `${item.medl_ident}-${item.samind_lbnr}`;
    acc[item.date].conversations.add(conversationId);
    
    const conversationType = item.ledetekst || "2. og 3. jobsamtale";
    acc[item.date].conversationTypes.add(conversationType);
    
    acc[item.date].count = acc[item.date].conversations.size; 
    
    return acc;
  }, {});

  // Log the grouped data before final transformation
  console.log('Grouped data before final transform:', groupedByDate);

  // Calculate feedback statistics including NULL values in total
  const totalRecords = processedReferats.length; // Include all records
  const totalThumbsUp = processedReferats.filter(item => item.feedback === 1).length;
  const totalThumbsDown = processedReferats.filter(item => item.feedback === -1).length;

  // Calculate time statistics from processed referats directly
  const validTimeToAIReport = processedReferats
    .filter(item => typeof item.tidTilAIReferat === 'number' && 
                    !isNaN(item.tidTilAIReferat) && 
                    item.tidTilAIReferat > 0);

  const validTimeToApproval = processedReferats
    .filter(item => typeof item.tidTilGodkendelse === 'number' && 
                    !isNaN(item.tidTilGodkendelse) && 
                    item.tidTilGodkendelse > 0);

  const avgTimeToAIReport = validTimeToAIReport.length > 0
    ? (validTimeToAIReport.reduce((sum, item) => sum + item.tidTilAIReferat, 0) / validTimeToAIReport.length).toFixed(2)
    : "0.00";

  const avgTimeToApproval = validTimeToApproval.length > 0
    ? (validTimeToApproval.reduce((sum, item) => sum + item.tidTilGodkendelse, 0) / validTimeToApproval.length).toFixed(2)
    : "0.00";

  console.log('Feedback statistics:', {
    totalRecords,
    totalThumbsUp,
    totalThumbsDown,
    avgThumbsUpRate: totalRecords > 0 ? ((totalThumbsUp / totalRecords) * 100).toFixed(2) : "0.00",
    avgThumbsDownRate: totalRecords > 0 ? ((totalThumbsDown / totalRecords) * 100).toFixed(2) : "0.00"
  });

  console.log('Time statistics:', {
    validTimeToAIReport: validTimeToAIReport.length,
    validTimeToApproval: validTimeToApproval.length,
    avgTimeToAIReport,
    avgTimeToApproval
  });

  // Transform grouped data
  const transformedData = Object.values(groupedByDate)
    .map(({ conversations, conversationTypes, feedback, tidTilGodkendelse, tidTilAIReferat, ...rest }) => {
      // Calculate average time values for each period
      const avgTidTilGodkendelse = tidTilGodkendelse.length > 0
        ? tidTilGodkendelse.reduce((a, b) => a + b, 0) / tidTilGodkendelse.length
        : 0;

      const avgTidTilAIReferat = tidTilAIReferat.length > 0
        ? tidTilAIReferat.reduce((a, b) => a + b, 0) / tidTilAIReferat.length
        : 0;

      return {
        ...rest,
        feedback: feedback.length,
        thumbsUp: feedback.filter(f => f === 1).length,
        thumbsDown: feedback.filter(f => f === -1).length,
        tidTilGodkendelse: avgTidTilGodkendelse,
        tidTilAIReferat: avgTidTilAIReferat,
        conversationTypes: Array.from(conversationTypes || [])
      };
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Return both the transformed data and KPI values
  return {
    data: transformedData,
    kpis: {
      avgThumbsUpRate: totalRecords > 0 
        ? ((totalThumbsUp / totalRecords) * 100).toFixed(2)
        : "0.00",
      avgThumbsDownRate: totalRecords > 0
        ? ((totalThumbsDown / totalRecords) * 100).toFixed(2)
        : "0.00",
      avgTimeToAIReport: avgTimeToAIReport,
      avgTimeToApproval: avgTimeToApproval,
      unchangedSectionsPercentage: (processedReferats.reduce((sum, item) => sum + item.uaendredeSektioner, 0) / (processedReferats.length * 3) * 100).toFixed(2),
      mostFrequentType: "2. og 3. jobsamtale"
    }
  };
};

export const transformReferatData = transformReferatDataForCharts;
