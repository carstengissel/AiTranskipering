import { startOfDay, startOfWeek, startOfMonth, startOfQuarter, startOfYear, format, isValid } from 'date-fns';
import { da } from 'date-fns/locale';

/**
 * Get start of period for a given date and time scale
 * 
 * @param {Date|string} date - Date to process
 * @param {string} scale - Time scale (days, weeks, months, quarters, years)
 * @returns {Date} Start of period date
 */
const getStartOfPeriod = (date, scale) => {
  if (!date) return null;
  
  try {
    // Ensure we have a valid Date object
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Verify the date is valid
    if (!dateObj || !isValid(dateObj)) {
      console.warn('Invalid date provided to getStartOfPeriod:', date);
      return null;
    }
    
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
  } catch (err) {
    console.error('Error in getStartOfPeriod:', err);
    return null;
  }
};

/**
 * Format a date for display based on the selected time scale
 * 
 * @param {Date|string} date - Date to format
 * @param {string} scale - Time scale (days, weeks, months, quarters, years)
 * @returns {string} Formatted date string
 */
const formatPeriod = (date, scale) => {
  if (!date) return '';
  
  try {
    // Ensure we have a valid Date object
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Verify the date is valid
    if (!dateObj || !isValid(dateObj)) {
      console.warn('Invalid date provided to formatPeriod:', date);
      return '';
    }
    
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
  } catch (err) {
    console.error('Error in formatPeriod:', err);
    return '';
  }
};

/**
 * Group data by time scale (day, week, month, quarter, year)
 * 
 * @param {Array} data - Array of data objects
 * @param {string} scale - Time scale (days, weeks, months, quarters, years)
 * @param {string} dateAccessor - Property name for date in data objects
 * @returns {Array} Grouped data
 */
export const groupDataByTimeScale = (data, scale = 'weeks', dateAccessor = 'date') => {
  if (!Array.isArray(data) || data.length === 0) {
    console.warn('No data provided to groupDataByTimeScale');
    return [];
  }
  
  try {
    // Filter out any items with invalid dates
    const validData = data.filter(item => {
      const date = item[dateAccessor];
      if (!date) return false;
      
      try {
        const dateObj = new Date(date);
        return isValid(dateObj);
      } catch (err) {
        console.warn('Invalid date found in data:', date);
        return false;
      }
    });
    
    if (validData.length === 0) {
      console.warn('No valid dates found in data');
      return [];
    }
    
    // Group data by period
    const groupedData = validData.reduce((acc, item) => {
      // Get date from item
      const date = item[dateAccessor];
      if (!date) return acc;
      
      // Calculate period start
      const periodStart = getStartOfPeriod(date, scale);
      if (!periodStart) return acc;
      
      const key = periodStart.toISOString();
      
      // Initialize period if not exists
      if (!acc[key]) {
        acc[key] = {
          date: periodStart,
          displayDate: formatPeriod(periodStart, scale),
          items: []
        };
      }
      
      // Add item to period
      acc[key].items.push(item);
      return acc;
    }, {});
    
    // Convert grouped data to array and sort by date
    return Object.values(groupedData)
      .sort((a, b) => a.date - b.date)
      .map(group => ({
        ...group,
        ...aggregateGroupData(group.items)
      }));
  } catch (err) {
    console.error('Error in groupDataByTimeScale:', err);
    return [];
  }
};

/**
 * Aggregate data for a group
 * 
 * @param {Array} items - Array of items in a group
 * @returns {Object} Aggregated data
 */
const aggregateGroupData = (items) => {
  try {
    // Initialize result with zero values
    const result = {
      totalCount: 0,
      positiveFeedback: 0,
      negativeFeedback: 0,
      avgTimeToAiReport: 0,
      avgTimeToApproval: 0,
      viHarAftalt: 0,
      viHarIDagTaltOm: 0,
      dinJobsogningIndtilNu: 0,
      uaendredeSektioner: 0,
      count: 0
    };
    
    // Return early if no items
    if (!items || items.length === 0) {
      return result;
    }
    
    // Track valid time entries
    let validAiReportCount = 0;
    let validApprovalCount = 0;
    
    // Process each item
    items.forEach(item => {
      // Use the actual totalCount from the item instead of incrementing by 1
      result.totalCount += Number(item.totalCount || 0);
      result.count += Number(item.count || 1);
      
      // Handle feedback counts
      if (item.positiveFeedback) result.positiveFeedback += Number(item.positiveFeedback);
      if (item.negativeFeedback) result.negativeFeedback += Number(item.negativeFeedback);
      
      // Handle time values only if they are valid numbers
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
      if (item.viHarAftalt) result.viHarAftalt += Number(item.viHarAftalt);
      if (item.viHarIDagTaltOm) result.viHarIDagTaltOm += Number(item.viHarIDagTaltOm);
      if (item.dinJobsogningIndtilNu) result.dinJobsogningIndtilNu += Number(item.dinJobsogningIndtilNu);
      if (item.uaendredeSektioner) result.uaendredeSektioner += Number(item.uaendredeSektioner);
    });
    
    // Calculate averages
    if (validAiReportCount > 0) {
      result.avgTimeToAiReport = Math.round(result.avgTimeToAiReport / validAiReportCount);
    }
    if (validApprovalCount > 0) {
      result.avgTimeToApproval = Math.round(result.avgTimeToApproval / validApprovalCount);
    }
    
    return result;
  } catch (err) {
    console.error('Error in aggregateGroupData:', err);
    return {
      totalCount: 0,
      positiveFeedback: 0,
      negativeFeedback: 0,
      avgTimeToAiReport: 0,
      avgTimeToApproval: 0,
      viHarAftalt: 0,
      viHarIDagTaltOm: 0,
      dinJobsogningIndtilNu: 0,
      uaendredeSektioner: 0,
      count: 0
    };
  }
};

/**
 * Filter data to only include future dates
 * 
 * @param {Array} data - Array of data objects
 * @param {string} dateAccessor - Property name for date in data objects
 * @returns {Array} Filtered data
 */
export const filterFutureDates = (data, dateAccessor = 'date') => {
  if (!Array.isArray(data)) return [];
  
  const today = startOfDay(new Date());
  
  return data.filter(item => {
    try {
      if (!item[dateAccessor]) return false;
      
      const itemDate = new Date(item[dateAccessor]);
      if (!isValid(itemDate)) return false;
      
      // Only include dates up to today (no future dates)
      return itemDate <= today;
    } catch (err) {
      return false;
    }
  });
};

/**
 * Filter data to only include real dates that correspond to actual database entries
 * 
 * @param {Array} data - Array of data objects
 * @returns {Array} Filtered data
 */
export const filterRealDates = (data) => {
  if (!Array.isArray(data)) return [];
  
  return data.filter(item => {
    // Only include items with positive counts
    return item.totalCount > 0 || item.count > 0;
  });
};