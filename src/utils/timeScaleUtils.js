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
    thumbsUp: 0,
    thumbsDown: 0,
    tidTilGodkendelse: 0,
    tidTilAIReferat: 0,
    viHarAftalt: 0,
    viHarIDagTaltOm: 0,
    dinJobsogningIndtilNu: 0,
    uaendredeSektioner: 0,
    count: items.length
  };

  // Track valid time entries
  let validGodkendelseCount = 0;
  let validAIReferatCount = 0;

  items.forEach(item => {
    // Handle feedback counts
    if (item.feedback === 1) result.thumbsUp++;
    if (item.feedback === -1) result.thumbsDown++;

    // Handle time values
    if (typeof item.tidTilGodkendelse === 'number' && 
        !isNaN(item.tidTilGodkendelse) && 
        item.tidTilGodkendelse > 0) {
      result.tidTilGodkendelse += item.tidTilGodkendelse;
      validGodkendelseCount++;
    }

    if (typeof item.tidTilAIReferat === 'number' && 
        !isNaN(item.tidTilAIReferat) && 
        item.tidTilAIReferat > 0) {
      result.tidTilAIReferat += item.tidTilAIReferat;
      validAIReferatCount++;
    }

    // Handle section changes
    if (typeof item.viHarAftalt === 'number') result.viHarAftalt += item.viHarAftalt;
    if (typeof item.viHarIDagTaltOm === 'number') result.viHarIDagTaltOm += item.viHarIDagTaltOm;
    if (typeof item.dinJobsogningIndtilNu === 'number') result.dinJobsogningIndtilNu += item.dinJobsogningIndtilNu;
    if (typeof item.uaendredeSektioner === 'number') result.uaendredeSektioner += item.uaendredeSektioner;
  });

  // Calculate averages for time values
  result.tidTilGodkendelse = validGodkendelseCount > 0
    ? result.tidTilGodkendelse / validGodkendelseCount
    : 0;

  result.tidTilAIReferat = validAIReferatCount > 0
    ? result.tidTilAIReferat / validAIReferatCount
    : 0;

  // Calculate section averages
  const totalItems = items.length;
  if (totalItems > 0) {
    result.viHarAftalt = result.viHarAftalt / totalItems;
    result.viHarIDagTaltOm = result.viHarIDagTaltOm / totalItems;
    result.dinJobsogningIndtilNu = result.dinJobsogningIndtilNu / totalItems;
    result.uaendredeSektioner = result.uaendredeSektioner / totalItems;
  }

  console.log('Aggregated data for period:', {
    items: items.length,
    validGodkendelseCount,
    validAIReferatCount,
    tidTilGodkendelse: result.tidTilGodkendelse,
    tidTilAIReferat: result.tidTilAIReferat
  });

  return result;
};
