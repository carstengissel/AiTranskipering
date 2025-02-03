/**
 * Compare two dates to check if they represent the same calendar day
 * Ignores time component and only compares year, month, and day
 * 
 * @param {string} dateStr1 - First date string to compare
 * @param {string} dateStr2 - Second date string to compare
 * @returns {boolean} True if dates represent the same calendar day, false otherwise
 * 
 * @example
 * isSameDate('2024-01-01T10:00:00', '2024-01-01T15:30:00') // returns true
 * isSameDate('2024-01-01', '2024-01-02') // returns false
 */
export const isSameDate = (dateStr1, dateStr2) => {
  if (!dateStr1 || !dateStr2) return false;
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  return d1.getDate() === d2.getDate() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getFullYear() === d2.getFullYear();
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
  const now = new Date();
  const then = new Date(date);
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
};
