import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReportList from './components/ReportList';
import ReportDetail from './components/ReportDetail';
import { parseDateFromUrl, formatDateForUrl } from './utils/dateUtils';
import { fetchReferatData, fetchAIReferatData } from '../../services/dashboardAPI';
import { transformReferatDataForSummary } from '../../services/dashboardTransformers';

const ConversationSummaryApp = () => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [referats, setReferats] = useState([]);
  const [openSections, setOpenSections] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

    console.log('Raw filters from URL:', raw);

    // Parse dates and format them consistently
    const startDate = parseDateFromUrl(raw.startDate);
    const endDate = parseDateFromUrl(raw.endDate);
    const date = parseDateFromUrl(raw.date);

    console.log('Parsed dates:', { startDate, endDate, date });

    const active = {
      startDate: startDate,
      endDate: endDate,
      section: raw.section,
      conversationType: raw.type || 'all',
      date: date
    };

    console.log('Active filters:', active);
    return { rawFilters: raw, activeFilters: active };
  }, [location.search]);

  const fetchData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching data with filters:', activeFilters);
      
      // Fetch both referat and AI referat data
      const [referatResponse, aiReferatResponse] = await Promise.all([
        fetchReferatData(activeFilters),
        fetchAIReferatData(activeFilters)
      ]);

      console.log('Raw API responses:', { referatResponse, aiReferatResponse });

      if (!Array.isArray(referatResponse) || !Array.isArray(aiReferatResponse)) {
        console.error('Invalid API response format:', { referatResponse, aiReferatResponse });
        throw new Error('Ugyldigt svar fra serveren');
      }

      // Transform the data using both datasets
      const transformedData = transformReferatDataForSummary(referatResponse, aiReferatResponse);

      console.log('Transformed data:', transformedData);

      if (!Array.isArray(transformedData)) {
        console.error('Invalid transformed data:', transformedData);
        throw new Error('Fejl ved databehandling');
      }

      setReferats(transformedData);
    } catch (error) {
      if (error.name === 'CanceledError') return;
      console.error('Fetch error:', error);
      setError(error.message || 'Der opstod en fejl ved hentning af referater.');
      setReferats([]);
    } finally {
      setLoading(false);
    }
  }, [activeFilters]);

  useEffect(() => {
    fetchData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  const handleRemoveFilter = useCallback((filterType) => {
    const newParams = new URLSearchParams(location.search);
    newParams.delete(filterType);
    navigate(`${location.pathname}?${newParams.toString()}`);
  }, [location.search, navigate, location.pathname]);

  const handleToggleSection = useCallback((section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  return (
    <div className="w-full p-4">
      <h1 className="text-2xl font-bold mb-4">Samtalereferat Oversigt</h1>
      
      {loading && <div>Indlæser referater...</div>}
      {error && <div className="text-red-500">{error}</div>}
      
      {!loading && !error && (
        <>
          {referats.length > 0 && !selectedReport && (
            <ReportList
              referats={referats}
              loading={loading}
              error={error}
              activeFilters={rawFilters}
              onSelectReport={setSelectedReport}
              onNavigateBack={() => navigate('/')}
              onRemoveFilter={handleRemoveFilter}
            />
          )}
          {selectedReport && (
            <ReportDetail
              report={selectedReport}
              activeSection={activeFilters.section}
              openSections={openSections}
              onToggleSection={handleToggleSection}
              onBack={() => setSelectedReport(null)}
            />
          )}
          {!referats.length && !selectedReport && (
            <div className="mb-4">Ingen referater tilgængelige for de valgte filtre</div>
          )}
        </>
      )}
    </div>
  );
};

export default ConversationSummaryApp;
