import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReportList from '../ConversationSummary/components/ReportList';
import ReportDetail from '../ConversationSummary/components/ReportDetail';
import { parseDateFromUrl, formatDateForUrl } from './utils/dateUtils';
import { parseReferat } from '../ConversationSummary/utils/referatUtils';
import config from '../../config';

// Configure axios baseURL
axios.defaults.baseURL = config.apiBaseUrl;

const ConversationSummaryApp = () => {
  // State management
  const [selectedReport, setSelectedReport] = useState(null);
  const [referats, setReferats] = useState([]);
  const [openSections, setOpenSections] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [textViewMode, setTextViewMode] = useState('final');
  const [showColorLegend, setShowColorLegend] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    originalAI: false,
    feedback: false
  });

  // Hooks for routing and navigation
  const location = useLocation();
  const navigate = useNavigate();
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  // Track if component is mounted to prevent state updates after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Get and parse URL parameters
  const urlParams = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    console.log('URL search parameters:', Object.fromEntries(searchParams.entries()));
    
    return {
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      date: searchParams.get('date'),
      section: searchParams.get('section'),
      type: searchParams.get('type'),
      unchanged: searchParams.get('unchanged') === 'true'
    };
  }, [location.search]);

  // Parse and format dates for API
  const apiParams = useMemo(() => {
    // Helper function to convert DD.MM.YYYY to YYYY-MM-DD for API
    const convertDateFormat = (dateStr) => {
      if (!dateStr) return null;
      
      // If already in DD.MM.YYYY format, convert to YYYY-MM-DD
      if (dateStr.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
        const [day, month, year] = dateStr.split('.');
        return `${year}-${month}-${day}`;
      }
      
      // If already in YYYY-MM-DD format, return as is
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateStr;
      }
      
      // Try to parse as Date and format
      try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch (err) {
        console.error('Error parsing date:', err);
      }
      
      return null;
    };
    
    return {
      startDate: convertDateFormat(urlParams.startDate),
      endDate: convertDateFormat(urlParams.endDate),
      date: convertDateFormat(urlParams.date),
      type: urlParams.type,
      section: urlParams.section
    };
  }, [urlParams]);

  // Format active filters for display in UI
  const activeFilters = useMemo(() => {
    const filters = {};
    
    if (urlParams.startDate) {
      filters.startDate = urlParams.startDate;
    }
    
    if (urlParams.endDate) {
      filters.endDate = urlParams.endDate;
    }
    
    if (urlParams.date) {
      filters.date = urlParams.date;
    }
    
    if (urlParams.section) {
      filters.section = urlParams.section;
    }
    
    if (urlParams.type) {
      filters.type = urlParams.type;
    }
    
    if (urlParams.unchanged) {
      filters.unchanged = true;
    }
    
    return filters;
  }, [urlParams]);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    if (!isMountedRef.current) return;
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching data with API params:', apiParams);

      const params = {};
      
      // Only add parameters with values
      if (apiParams.startDate) params.startDate = apiParams.startDate;
      if (apiParams.endDate) params.endDate = apiParams.endDate;
      if (apiParams.date) params.date = apiParams.date;
      if (apiParams.type) params.type = apiParams.type;
      
      console.log('Final API request parameters:', params);
      
      const response = await axios.get('/api/samind_referat', {
        params,
        signal
      });

      // Check if component is still mounted before updating state
      if (!isMountedRef.current) return;

      console.log('API response data:', response.data);

      if (!Array.isArray(response.data)) {
        console.error('Invalid API response format:', response.data);
        throw new Error('Ugyldigt svar fra serveren');
      }

      let filteredData = response.data;

      // Apply section filter client-side if provided
      if (urlParams.section) {
        console.log('Filtering by section:', urlParams.section);
        filteredData = filteredData.filter(referat => {
          const sections = parseReferat(referat.referat);
          return sections[urlParams.section]?.length > 0;
        });
      }
      
      // Apply "unchanged" filter if set
      if (urlParams.unchanged) {
        console.log('Filtering for unchanged sections');
        filteredData = filteredData.filter(referat => {
          const aiSections = parseReferat(referat.aiReferat);
          const humanSections = parseReferat(referat.referat);
          
          // Check if any section is unchanged
          return Object.keys(aiSections).some(key => 
            JSON.stringify(aiSections[key]) === JSON.stringify(humanSections[key]) &&
            aiSections[key].length > 0
          );
        });
      }

      console.log(`Filtered data: ${filteredData.length} results`);

      // Sort by referat_godkendt_at date, newest first
      filteredData.sort((a, b) => {
        const dateA = new Date(a.referat_godkendt_at || 0);
        const dateB = new Date(b.referat_godkendt_at || 0);
        return dateB.getTime() - dateA.getTime();
      });

      // Map reg_tid to referat_godkendt_at for backwards compatibility
      filteredData = filteredData.map(item => ({
        ...item,
        reg_tid: item.referat_godkendt_at
      }));

      if (isMountedRef.current) {
        setReferats(filteredData);
        setLoading(false);
      }
    } catch (error) {
      // Only handle non-cancellation errors
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        console.log('Request was canceled:', error.message);
        return;
      }
      
      console.error('Fetch error:', error);
      
      if (isMountedRef.current) {
        setError(error.message || 'Der opstod en fejl ved hentning af referater.');
        setReferats([]);
        setLoading(false);
      }
    }
  }, [apiParams, urlParams.section, urlParams.unchanged]);

  // Fetch data when filters change
  useEffect(() => {
    console.log('Filters changed, fetching data...');
    fetchData();
    
    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  // Handler functions
  const handleRemoveFilter = useCallback((filterType) => {
    const newParams = new URLSearchParams(location.search);
    newParams.delete(filterType);
    navigate(`${location.pathname}?${newParams.toString()}`);
  }, [location.search, navigate, location.pathname]);

  const handleToggleSection = useCallback((section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const handleSelectReport = useCallback((report) => {
    setSelectedReport(report);
    setOpenSections({});
    setTextViewMode('final');
    setExpandedSections({ originalAI: false, feedback: false });
  }, []);

  return (
    <div className="w-full p-4">
      <h1 className="text-2xl font-bold mb-4">Samtalereferat Oversigt</h1>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Indlæser referater...</div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {referats.length > 0 && !selectedReport && (
            <ReportList
              referats={referats}
              activeFilters={activeFilters}
              onSelectReport={handleSelectReport}
              onRemoveFilter={handleRemoveFilter}
              onNavigateBack={() => navigate('/')}
            />
          )}

          {selectedReport && (
            <ReportDetail
              report={selectedReport}
              referats={referats}
              textViewMode={textViewMode}
              showColorLegend={showColorLegend}
              openSections={openSections}
              expandedSections={expandedSections}
              activeFilters={activeFilters}
              onBack={() => setSelectedReport(null)}
              onTextViewModeChange={setTextViewMode}
              onToggleColorLegend={() => setShowColorLegend(!showColorLegend)}
              onToggleSection={handleToggleSection}
              onToggleExpanded={(section) => setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))}
            />
          )}

          {!referats.length && !selectedReport && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              Ingen referater tilgængelige for de valgte filtre
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ConversationSummaryApp;