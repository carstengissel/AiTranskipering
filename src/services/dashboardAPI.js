import axios from 'axios';
import { formatDateForUrl } from '../components/conversation/utils/dateUtils';
import config from '../config';

// Configure axios baseURL
axios.defaults.baseURL = config.apiBaseUrl;

export const fetchSamtaletyper = async () => {
  try {
    console.log('Fetching samtaletyper...');
    const response = await axios.get('/api/samtaletyper');
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
      params: formattedFilters,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
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
      params: formattedFilters,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
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
