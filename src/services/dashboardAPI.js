import axios from 'axios';
import { formatDateForUrl } from '../components/conversation/utils/dateUtils';
import config from '../config';

// Configure axios baseURL
axios.defaults.baseURL = config.apiBaseUrl;

// Add retry interceptor
axios.interceptors.response.use(undefined, async (err) => {
  const { config, message } = err;
  if (!config || !config.retry) {
    return Promise.reject(err);
  }

  config.retry -= 1;
  if (config.retry === 0) {
    return Promise.reject(err);
  }

  // Delay before retrying
  const backoff = new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, config.retryDelay || 1000);
  });

  await backoff;
  return axios(config);
});

// Default config for API calls
const defaultConfig = {
  retry: 3,
  retryDelay: 1000,
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
};

export const fetchSamtaletyper = async () => {
  try {
    console.log('Fetching samtaletyper...');
    const response = await axios.get('/api/samtaletyper', defaultConfig);
    console.log('Samtaletyper response:', response);

    if (!response.data) {
      console.warn('No data received from samtaletyper endpoint');
      return [];
    }

    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching samtaletyper:', error);
    return [];
  }
};

export const fetchReferatData = async (filters = {}) => {
  try {
    // Format dates for API
    const formattedFilters = {
      startDate: filters.startDate ? formatDateForUrl(filters.startDate) : null,
      endDate: filters.endDate ? formatDateForUrl(filters.endDate) : null,
      type: filters.conversationType !== 'all' ? filters.conversationType : null,
      section: filters.section
    };

    // Remove null/undefined values
    Object.keys(formattedFilters).forEach(key => {
      if (formattedFilters[key] === null || formattedFilters[key] === undefined) {
        delete formattedFilters[key];
      }
    });

    console.log('Fetching referat data with filters:', formattedFilters);
    const response = await axios.get('/api/samind_referat', { 
      ...defaultConfig,
      params: formattedFilters
    });

    console.log('Referat response:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    });

    if (!response.data) {
      console.warn('No data received from referat endpoint');
      return [];
    }

    const data = Array.isArray(response.data) ? response.data : [];
    console.log(`Processed ${data.length} referats`);
    return data;
  } catch (error) {
    console.error('Error fetching referat data:', error.response || error);
    return [];
  }
};

export const fetchAIReferatData = async (filters = {}) => {
  try {
    // Format dates for API
    const formattedFilters = {
      startDate: filters.startDate ? formatDateForUrl(filters.startDate) : null,
      endDate: filters.endDate ? formatDateForUrl(filters.endDate) : null,
      type: filters.conversationType !== 'all' ? filters.conversationType : null,
      section: filters.section
    };

    // Remove null/undefined values
    Object.keys(formattedFilters).forEach(key => {
      if (formattedFilters[key] === null || formattedFilters[key] === undefined) {
        delete formattedFilters[key];
      }
    });

    console.log('Fetching AI referat data with filters:', formattedFilters);
    const response = await axios.get('/api/samind_ai_referat', { 
      ...defaultConfig,
      params: formattedFilters
    });

    console.log('AI Referat response:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    });

    if (!response.data) {
      console.warn('No data received from AI referat endpoint');
      return [];
    }

    const data = Array.isArray(response.data) ? response.data : [];
    console.log(`Processed ${data.length} AI referats`);
    return data;
  } catch (error) {
    console.error('Error fetching AI referat data:', error.response || error);
    return [];
  }
};

export const fetchConversationCount = async (date, type) => {
  try {
    const formattedDate = date ? formatDateForUrl(date) : null;
    const response = await axios.get('/api/conversation-count', {
      ...defaultConfig,
      params: {
        date: formattedDate,
        type: type !== 'all' ? type : null
      }
    });
    return response.data?.count || 0;
  } catch (error) {
    console.error('Error fetching conversation count:', error);
    return 0;
  }
};

export const fetchKPIStats = async (filters = {}) => {
  try {
    const formattedFilters = {
      startDate: filters.startDate ? formatDateForUrl(filters.startDate) : null,
      endDate: filters.endDate ? formatDateForUrl(filters.endDate) : null
    };

    // Remove null/undefined values
    Object.keys(formattedFilters).forEach(key => {
      if (formattedFilters[key] === null || formattedFilters[key] === undefined) {
        delete formattedFilters[key];
      }
    });

    console.log('Fetching KPI stats with filters:', formattedFilters);
    const response = await axios.get('/api/kpi-stats', { 
      ...defaultConfig,
      params: formattedFilters
    });

    if (!response.data) {
      console.warn('No data received from KPI stats endpoint');
      throw new Error('No data received');
    }

    // Validate response data
    const requiredFields = ['positiveFeedback', 'negativeFeedback', 'avgTimeToAiReport', 'avgTimeToApproval', 'totalCount', 'mostFrequentType'];
    const missingFields = requiredFields.filter(field => response.data[field] === undefined);
    
    if (missingFields.length > 0) {
      console.error('Missing required fields in KPI stats response:', missingFields);
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    console.log('KPI stats response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching KPI stats:', error);
    return {
      positiveFeedback: 0,
      negativeFeedback: 0,
      avgTimeToAiReport: 0,
      avgTimeToApproval: 0,
      totalCount: 0,
      mostFrequentType: "N/A"
    };
  }
};

export const fetchTimelineStats = async (filters = {}) => {
  try {
    const formattedFilters = {
      startDate: filters.startDate ? formatDateForUrl(filters.startDate) : null,
      endDate: filters.endDate ? formatDateForUrl(filters.endDate) : null,
      interval: filters.interval || 'day'
    };

    // Remove null/undefined values
    Object.keys(formattedFilters).forEach(key => {
      if (formattedFilters[key] === null || formattedFilters[key] === undefined) {
        delete formattedFilters[key];
      }
    });

    console.log('Fetching timeline stats with filters:', formattedFilters);
    const response = await axios.get('/api/timeline-stats', { 
      ...defaultConfig,
      params: formattedFilters
    });

    if (!response.data) {
      console.warn('No data received from timeline stats endpoint');
      throw new Error('No data received');
    }

    // Validate response data
    if (!Array.isArray(response.data)) {
      console.error('Timeline stats response is not an array');
      throw new Error('Invalid response format');
    }

    // Transform and validate each data point
    const transformedData = response.data.map(item => {
      // Ensure all required fields are present with correct types
      const dataPoint = {
        date: new Date(item.date).toISOString(),
        totalCount: Number(item.totalCount) || 0,
        positiveFeedback: Number(item.positiveFeedback) || 0,
        negativeFeedback: Number(item.negativeFeedback) || 0,
        avgTimeToAiReport: Number(item.avgTimeToAiReport) || 0,
        avgTimeToApproval: Number(item.avgTimeToApproval) || 0,
        viHarAftalt: Number(item.viHarAftalt) || 0,
        viHarIDagTaltOm: Number(item.viHarIDagTaltOm) || 0,
        dinJobsogningIndtilNu: Number(item.dinJobsogningIndtilNu) || 0,
        uaendredeSektioner: Number(item.uaendredeSektioner) || 0,
        count: Number(item.totalCount) || 0
      };

      // Log any missing or invalid data
      const expectedFields = ['date', 'totalCount', 'avgTimeToAiReport', 'avgTimeToApproval'];
      expectedFields.forEach(field => {
        if (!(field in item)) {
          console.warn(`Missing field ${field} in timeline data point:`, item);
        }
      });

      return dataPoint;
    });

    // Sort data by date
    transformedData.sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log('Transformed timeline stats:', {
      dataPoints: transformedData.length,
      firstPoint: transformedData[0],
      lastPoint: transformedData[transformedData.length - 1],
      samplePoint: transformedData[Math.floor(transformedData.length / 2)]
    });

    return transformedData;
  } catch (error) {
    console.error('Error fetching timeline stats:', error);
    return [];
  }
};
