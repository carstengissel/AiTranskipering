import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReportList from '../ConversationSummary/components/ReportList';
import ReportDetail from '../ConversationSummary/components/ReportDetail';
import { parseDateFromUrl } from './utils/dateUtils';
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

  // Memoize URL parameters parsing
  const { rawFilters, activeFilters } = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const raw = {
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      section: searchParams.get('section'),
      type: searchParams.get('type'),
      date: searchParams.get('date')
    };

    console.log('ConversationSummaryAppCagi - useMemo - Raw filters from URL:', raw); // DEBUG

    // Parse dates and format them consistently
    const startDate = parseDateFromUrl(raw.startDate);
    const endDate = parseDateFromUrl(raw.endDate);
    const date = parseDateFromUrl(raw.date);

    console.log('ConversationSummaryAppCagi - useMemo - Parsed dates:', { startDate, endDate, date }); // DEBUG

    const active = {
      startDate: startDate,
      endDate: endDate,
      section: raw.section,
      type: raw.type || 'all',
      date: date
    };

    console.log('ConversationSummaryAppCagi - useMemo - Active filters:', active); // DEBUG
    return { rawFilters: raw, activeFilters: active };
  }, [location.search]);

  // Data fetching function
  const fetchData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      console.log('ConversationSummaryAppCagi - fetchData - Fetching data with filters:', activeFilters); // DEBUG

      // Convert dates to YYYY-MM-DD format for the backend
      const formatDateForBackend = (dateStr) => {
        if (!dateStr) return null;
        const [day, month, year] = dateStr.split('.');
        return `${year}-${month}-${day}`;
      };

      const backendParams = {
        startDate: formatDateForBackend(activeFilters.startDate),
        endDate: formatDateForBackend(activeFilters.endDate),
        date: formatDateForBackend(activeFilters.date),
        type: activeFilters.type !== 'all' ? activeFilters.type : undefined
      };
      
      console.log('ConversationSummaryAppCagi - fetchData - Backend API params:', backendParams); // DEBUG

      const response = await axios.get('/api/samind_referat', {
        params: backendParams,
        signal: abortControllerRef.current.signal
      });

      console.log('ConversationSummaryAppCagi - fetchData - API response:', response.data); // DEBUG

      if (!Array.isArray(response.data)) {
        console.error('Invalid API response format:', response.data);
        throw new Error('Ugyldigt svar fra serveren');
      }

      let filteredData = response.data;

      // Apply section filter if present
      if (activeFilters.section) {
        filteredData = filteredData.filter(referat => {
          const sections = parseReferat(referat.referat);
          return sections[activeFilters.section]?.length > 0;
        });
      }

      // Sort by referat_godkendt_at date, newest first
      filteredData.sort((a, b) => {
        const dateA = new Date(a.referat_godkendt_at);
        const dateB = new Date(b.referat_godkendt_at);
        return dateB.getTime() - dateA.getTime();
      });

      // Map reg_tid to referat_godkendt_at for backwards compatibility
      filteredData = filteredData.map(item => ({
        ...item,
        reg_tid: item.referat_godkendt_at
      }));

      console.log('ConversationSummaryAppCagi - fetchData - Final processed data:', filteredData); // DEBUG
      setReferats(filteredData);
    } catch (error) {
      if (error.name === 'CanceledError') return;
      console.error('Fetch error:', error);
      setError(error.message || 'Der opstod en fejl ved hentning af referater.');
      setReferats([]);
    } finally {
      setLoading(false);
    }
  }, [activeFilters]);

  // Fetch data when filters change
  useEffect(() => {
    console.log('ConversationSummaryAppCagi - useEffect - Active filters changed:', activeFilters); // DEBUG
    fetchData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData, activeFilters]);

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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {referats.length > 0 && !selectedReport && (
            <ReportList
              referats={referats}
              activeFilters={rawFilters}
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
              activeFilters={rawFilters}
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
