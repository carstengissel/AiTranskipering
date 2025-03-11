/**
 * Compare two dates to check if they represent the same calendar day
 * Ignores time component and only compares year, month, and day
 * 
 * @param {string|Date} dateStr1 - First date string to compare
 * @param {string|Date} dateStr2 - Second date string to compare
 * @returns {boolean} True if dates represent the same calendar day, false otherwise
 * 
 * @example
 * isSameDate('2024-01-01T10:00:00', '2024-01-01T15:30:00') // returns true
 * isSameDate('2024-01-01', '2024-01-02') // returns false
 */
export const isSameDate = (dateStr1, dateStr2) => {
  if (!dateStr1 || !dateStr2) return false;
  
  try {
    const d1 = new Date(dateStr1);
    const d2 = new Date(dateStr2);
    
    // Check if both dates are valid
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      return false;
    }
    
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  } catch (err) {
    console.error('Error comparing dates:', err);
    return false;
  }
};

/**
 * Format a date into a relative time string (e.g., "5 min siden", "2 timer siden")
 * Converts a date into a human-readable relative time format in Danish
 * 
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted relative time string in Danish
 * 
 * @example
 * // If current time is 10:05
 * formatTimeAgo('2024-01-01T10:00:00') // returns "5 min siden"
 * formatTimeAgo('2024-01-01T08:00:00') // returns "2 timer siden"
 * formatTimeAgo('2023-12-25T10:00:00') // returns "7 dage siden"
 */
export const formatTimeAgo = (date) => {
  if (!date) return '';
  
  try {
    const now = new Date();
    const then = new Date(date);
    
    // Check if date is valid
    if (isNaN(then.getTime())) {
      return '';
    }
    
    const diffInMinutes = Math.floor((now - then) / (1000 * 60));
    
    // Less than an hour
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min siden`;
    }
    
    // Less than a day
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} timer siden`;
    }
    
    // Less than a month
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} dage siden`;
    }
    
    // More than a month
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} måneder siden`;
  } catch (err) {
    console.error('Error formatting time ago:', err);
    return '';
  }
};

/**
 * Parse date from URL parameter (supports multiple formats)
 * Handles DD.MM.YYYY, YYYY-MM-DD and other common formats
 * 
 * @param {string} dateStr - The date string to parse
 * @returns {string|null} Formatted date string (DD.MM.YYYY) or null if invalid
 */
export const parseDateFromUrl = (dateStr) => {
  if (!dateStr) return null;

  try {
    // Try parsing DD.MM.YYYY format first
    if (dateStr.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
      const [day, month, year] = dateStr.split('.');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        return dateStr; // Already in correct format
      }
    }

    // Try parsing YYYY-MM-DD format
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        return `${day}.${month}.${year}`;
      }
    }

    // Try parsing from Date object as last resort
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    }
  } catch (err) {
    console.error('Error parsing date string:', err);
  }

  console.warn('Could not parse date:', dateStr);
  return null;
};

/**
 * Format date for URL (always DD.MM.YYYY format)
 * @param {Date|string} date - Date to format
 * @returns {string|null} Formatted date string or null if invalid
 */
export const formatDateForUrl = (date) => {
  if (!date) return null;

  try {
    // If already in DD.MM.YYYY format, validate and return
    if (typeof date === 'string' && date.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
      const [day, month, year] = date.split('.');
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(dateObj.getTime())) {
        return date;
      }
    }

    // Create Date object and format
    let d;
    if (date instanceof Date) {
      d = date;
    } else {
      d = new Date(date);
    }
    
    if (isNaN(d.getTime())) {
      console.warn('Invalid date for URL formatting:', date);
      return null;
    }
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}.${month}.${year}`;
  } catch (err) {
    console.error('Error formatting date for URL:', err);
    return null;
  }
};

/**
 * Format date for display (always DD.MM.YYYY format)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string or empty string if invalid
 */
export const formatDateForDisplay = (date) => {
  if (!date) return '';
  
  try {
    // If already in DD.MM.YYYY format, validate and return
    if (typeof date === 'string' && date.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
      const [day, month, year] = date.split('.');
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(dateObj.getTime())) {
        return date;
      }
    }

    // Create Date object and format
    let d;
    if (date instanceof Date) {
      d = date;
    } else {
      d = new Date(date);
    }
    
    if (isNaN(d.getTime())) {
      console.warn('Invalid date for display formatting:', date);
      return '';
    }
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}.${month}.${year}`;
  } catch (err) {
    console.error('Error formatting date for display:', err);
    return '';
  }
};

/**
 * Convert a string date to a Date object safely
 * @param {string|Date} dateStr - Date string to convert
 * @returns {Date|null} Date object or null if invalid
 */
export const stringToDate = (dateStr) => {
  if (!dateStr) return null;
  
  try {
    // If already a Date object
    if (dateStr instanceof Date) {
      return isNaN(dateStr.getTime()) ? null : dateStr;
    }
    
    // Try DD.MM.YYYY format first
    if (typeof dateStr === 'string' && dateStr.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
      const [day, month, year] = dateStr.split('.');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Try standard Date parsing
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch (err) {
    console.error('Error converting string to date:', err);
    return null;
  }
};