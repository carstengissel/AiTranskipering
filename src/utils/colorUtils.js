// Color utilities for consistent colors across the application

// Section colors for charts
export const sectionColors = {
  viHarAftalt: '#8884d8',         // Purple
  viHarIDagTaltOm: '#82ca9d',     // Green
  dinJobsogningIndtilNu: '#ffc658', // Yellow
  uaendredeSektioner: '#ff7300'   // Orange
};

// Status colors
export const statusColors = {
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
  neutral: '#9e9e9e'
};

// Chart colors for different metrics
export const chartColors = {
  positiveFeedback: '#4caf50',
  negativeFeedback: '#f44336',
  avgTimeToAiReport: '#2196f3',
  avgTimeToApproval: '#ff9800',
  totalCount: '#9c27b0'
};

// Generate a color based on a string (useful for dynamically generated items)
export const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  
  return color;
};

// Get a contrasting text color (black or white) based on background color
export const getContrastTextColor = (hexColor) => {
  // Remove the hash if it exists
  hexColor = hexColor.replace('#', '');
  
  // Parse the color
  const r = parseInt(hexColor.substr(0, 2), 16);
  const g = parseInt(hexColor.substr(2, 2), 16);
  const b = parseInt(hexColor.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black for bright colors, white for dark colors
  return luminance > 0.5 ? '#000000' : '#ffffff';
};
