import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useTransition, Suspense } from 'react';
import { fetchSamtaletyper, fetchReferatData, fetchAIReferatData } from '../services/dashboardAPI';
import { transformReferatData, calculateKPIs } from '../services/dashboardTransformers';

const DashboardContext = createContext();

// Default KPI structure matching calculateKPIs empty state
const defaultKPIs = {
  avgThumbsUpRate: "0.00",
  avgTimeToAIReport: "0.00",
  avgTimeToApproval: "0.00",
  unchangedSectionsPercentage: "0.00",
  mostFrequentType: "2. og 3. jobsamtale",
  conversationTypeCounts: {}
};

// Default state structure
const defaultState = {
  statistics: [],
  kpis: defaultKPIs,
  count: 0
};

export const DashboardProvider = ({ children }) => {
  const [statistics, setStatistics] = useState([]);
  const [kpis, setKpis] = useState(defaultKPIs);
  const [accurateConversationCount, setAccurateConversationCount] = useState(0);
  const [samtaletyper, setSamtaletyper] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [isPending, startTransition] = useTransition();

  // Keep previous state for smooth transitions
  const [previousState, setPreviousState] = useState(defaultState);

  const fetchSamtaletyperData = useCallback(async () => {
    try {
      const data = await fetchSamtaletyper();
      setSamtaletyper(data);
      return data;
    } catch (err) {
      console.error('Error fetching samtaletyper:', err);
      setSamtaletyper([]);
      return [];
    }
  }, []);

  const updateStateWithTransition = useCallback((newState) => {
    startTransition(() => {
      // Only update if we have new data
      if (newState.statistics?.length) {
        setStatistics(newState.statistics);
        setKpis(newState.kpis);
        setAccurateConversationCount(newState.count);
        // Update previous state after successful update
        setPreviousState({
          statistics: newState.statistics,
          kpis: newState.kpis,
          count: newState.count
        });
      }
    });
  }, []); // Remove dependencies to break the cycle

  const fetchDashboardData = useCallback(async (filters = {}, isReset = false) => {
    // Skip throttle if it's a reset operation
    if (!isReset) {
      const now = Date.now();
      if (now - lastFetchTime < 5000) {
        return;
      }
    }

    try {
      setIsLoading(true);
      setLastFetchTime(Date.now());

      // Convert conversationType to type for API
      const apiFilters = {
        ...filters,
        type: filters.conversationType,
        conversationType: undefined
      };

      console.log('Fetching dashboard data with filters:', apiFilters);

      // Fetch new data
      const [referatData, aiReferatData] = await Promise.all([
        fetchReferatData(apiFilters),
        fetchAIReferatData(apiFilters)
      ]);

      console.log('Fetched data:', { referatData, aiReferatData });

      // Transform the data
      const { data: transformedData, kpis: newKpis } = transformReferatData(referatData, aiReferatData);
      const newCount = transformedData.reduce((sum, item) => sum + (item.count || 0), 0);

      // Calculate feedback statistics including NULL values in total
      const totalFeedback = referatData.length; // Include all records
      const totalThumbsUp = referatData.filter(item => item.feedback === 1).length;
      const totalThumbsDown = referatData.filter(item => item.feedback === -1).length;

      // Update state with transition
      updateStateWithTransition({
        statistics: transformedData,
        kpis: {
          ...newKpis,
          avgThumbsUpRate: totalFeedback > 0 
            ? ((totalThumbsUp / totalFeedback) * 100).toFixed(2)
            : "0.00",
          avgThumbsDownRate: totalFeedback > 0
            ? ((totalThumbsDown / totalFeedback) * 100).toFixed(2)
            : "0.00",
          conversationTypeCounts: transformedData.reduce((acc, item) => {
            const type = item.ledetekst || "2. og 3. jobsamtale";
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {})
        },
        count: newCount
      });

      console.log('Feedback statistics:', {
        totalFeedback,
        totalThumbsUp,
        totalThumbsDown,
        avgThumbsUpRate: totalFeedback > 0 ? ((totalThumbsUp / totalFeedback) * 100).toFixed(2) : "0.00",
        avgThumbsDownRate: totalFeedback > 0 ? ((totalThumbsDown / totalFeedback) * 100).toFixed(2) : "0.00"
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // On error, keep previous state visible
      setStatistics(previousState.statistics);
      setKpis(previousState.kpis);
      setAccurateConversationCount(previousState.count);
    } finally {
      setIsLoading(false);
    }
  }, [samtaletyper, lastFetchTime, updateStateWithTransition]); // Remove previousState from dependencies

  // Initial data fetch - fetch both samtaletyper and dashboard data
  useEffect(() => {
    let mounted = true;

    const initializeData = async () => {
      setIsLoading(true);
      try {
        // First fetch samtaletyper
        const types = await fetchSamtaletyperData();
        // Then fetch dashboard data with empty filters
        if (mounted) {
          await fetchDashboardData({});
        }
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeData();

    return () => {
      mounted = false;
    };
  }, []); // Remove fetchDashboardData from dependencies

  // Listen for filter reset events
  useEffect(() => {
    const handleFilterReset = () => {
      console.log('Filter reset event received, fetching fresh data...');
      fetchDashboardData({}, true);
    };

    window.addEventListener('filtersReset', handleFilterReset);
    return () => window.removeEventListener('filtersReset', handleFilterReset);
  }, [fetchDashboardData]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    statistics,
    setStatistics,
    kpis,
    setKpis,
    accurateConversationCount,
    setAccurateConversationCount,
    samtaletyper,
    setSamtaletyper,
    isLoading: isLoading || isPending,
    setIsLoading,
    fetchSamtaletyper: fetchSamtaletyperData,
    fetchDashboardData,
    isPending
  }), [
    statistics,
    kpis,
    accurateConversationCount,
    samtaletyper,
    isLoading,
    isPending,
    fetchSamtaletyperData,
    fetchDashboardData
  ]);

  return (
    <DashboardContext.Provider value={value}>
      <Suspense fallback={null}>
        {children}
      </Suspense>
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
