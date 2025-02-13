import { startOfDay, startOfWeek, startOfMonth, startOfQuarter, startOfYear, format } from 'date-fns';
import { da } from 'date-fns/locale';

const getStartOfPeriod = (date, scale) => {
  const dateObj = new Date(date);
  switch (scale) {
    case 'days':
      return startOfDay(dateObj);
    case 'weeks':
      return startOfWeek(dateObj, { weekStartsOn: 1 }); // Week starts on Monday
    case 'months':
      return startOfMonth(dateObj);
    case 'quarters':
      return startOfQuarter(dateObj);
    case 'years':
      return startOfYear(dateObj);
    default:
      return startOfWeek(dateObj, { weekStartsOn: 1 });
  }
};

const formatPeriod = (date, scale) => {
  const dateObj = new Date(date);
  switch (scale) {
    case 'days':
      return format(dateObj, 'd MMM yyyy', { locale: da });
    case 'weeks':
      return `Uge ${format(dateObj, 'w yyyy', { locale: da })}`;
    case 'months':
      return format(dateObj, 'MMM yyyy', { locale: da });
    case 'quarters':
      return `Q${Math.floor(dateObj.getMonth() / 3) + 1} ${dateObj.getFullYear()}`;
    case 'years':
      return format(dateObj, 'yyyy', { locale: da });
    default:
      return format(dateObj, 'w', { locale: da });
  }
};

export const groupDataByTimeScale = (data, scale = 'weeks', dateAccessor = 'date') => {
  const groupedData = data.reduce((acc, item) => {
    const date = getStartOfPeriod(item[dateAccessor], scale);
    const key = date.toISOString();
    
    if (!acc[key]) {
      acc[key] = {
        date: date,
        displayDate: formatPeriod(date, scale),
        items: []
      };
    }
    
    acc[key].items.push(item);
    return acc;
  }, {});

  return Object.values(groupedData)
    .sort((a, b) => a.date - b.date)
    .map(group => ({
      ...group,
      ...aggregateGroupData(group.items)
    }));
};

const aggregateGroupData = (items) => {
  const result = {
    totalCount: 0,
    positiveFeedback: 0,
    negativeFeedback: 0,
    avgTimeToAiReport: 0,
    avgTimeToApproval: 0,
    viHarAftalt: 0,
    viHarIDagTaltOm: 0,
    dinJobsogningIndtilNu: 0,
    uaendredeSektioner: 0
  };

  // Track valid time entries
  let validAiReportCount = 0;
  let validApprovalCount = 0;

  items.forEach(item => {
    result.totalCount++;

    // Handle feedback counts
    if (item.positiveFeedback) result.positiveFeedback += item.positiveFeedback;
    if (item.negativeFeedback) result.negativeFeedback += item.negativeFeedback;

    // Handle time values
    if (typeof item.avgTimeToAiReport === 'number' && 
        !isNaN(item.avgTimeToAiReport) && 
        item.avgTimeToAiReport > 0) {
      result.avgTimeToAiReport += item.avgTimeToAiReport;
      validAiReportCount++;
    }

    if (typeof item.avgTimeToApproval === 'number' && 
        !isNaN(item.avgTimeToApproval) && 
        item.avgTimeToApproval > 0) {
      result.avgTimeToApproval += item.avgTimeToApproval;
      validApprovalCount++;
    }

    // Handle section changes
    if (item.viHarAftalt) result.viHarAftalt += item.viHarAftalt;
    if (item.viHarIDagTaltOm) result.viHarIDagTaltOm += item.viHarIDagTaltOm;
    if (item.dinJobsogningIndtilNu) result.dinJobsogningIndtilNu += item.dinJobsogningIndtilNu;
    if (item.uaendredeSektioner) result.uaendredeSektioner += item.uaendredeSektioner;
  });

  // Calculate averages
  if (validAiReportCount > 0) {
    result.avgTimeToAiReport = Math.round(result.avgTimeToAiReport / validAiReportCount);
  }
  if (validApprovalCount > 0) {
    result.avgTimeToApproval = Math.round(result.avgTimeToApproval / validApprovalCount);
  }

  return result;
};
