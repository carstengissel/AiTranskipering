// Validate date string format and values
const isValidDate = (day, month, year) => {
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  
  if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > 2100) {
    return false;
  }
  
  // Check for valid day in month
  const date = new Date(y, m - 1, d);
  return date.getDate() === d && date.getMonth() === m - 1 && date.getFullYear() === y;
};

// Parse date from URL parameter (supports multiple formats)
export const parseDateFromUrl = (dateStr) => {
  if (!dateStr) return null;

  // Try parsing DD.MM.YYYY format first
  if (dateStr.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
    const [day, month, year] = dateStr.split('.');
    if (isValidDate(day, month, year)) {
      return dateStr; // Already in correct format
    }
  }

  // Try parsing YYYY-MM-DD format
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateStr.split('-');
    if (isValidDate(day, month, year)) {
      return `${day}.${month}.${year}`;
    }
  }

  // Try parsing from Date object as last resort
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      if (isValidDate(day, month, year)) {
        return `${day}.${month}.${year}`;
      }
    }
  } catch (err) {
    console.error('Error parsing date string:', err);
  }

  console.warn('Could not parse date:', dateStr);
  return null;
};

// Format date for URL (always DD.MM.YYYY format)
export const formatDateForUrl = (date) => {
  if (!date) return null;

  // If already in DD.MM.YYYY format, validate and return
  if (typeof date === 'string' && date.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
    const [day, month, year] = date.split('.');
    if (isValidDate(day, month, year)) {
      return date;
    }
  }

  // Try to create Date object and format
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    if (isValidDate(day, month, year)) {
      return `${day}.${month}.${year}`;
    }
    return null;
  } catch (err) {
    console.error('Error formatting date for URL:', err);
    return null;
  }
};

// Format date for display (always DD.MM.YYYY format)
export const formatDateForDisplay = (date) => {
  if (!date) return '';
  
  // If already in DD.MM.YYYY format, validate and return
  if (typeof date === 'string' && date.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
    const [day, month, year] = date.split('.');
    if (isValidDate(day, month, year)) {
      return date;
    }
  }

  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    if (isValidDate(day, month, year)) {
      return `${day}.${month}.${year}`;
    }
    return '';
  } catch (err) {
    console.error('Error formatting date for display:', err);
    return '';
  }
};
