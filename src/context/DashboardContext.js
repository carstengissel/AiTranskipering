import React, { createContext, useContext, useState, useCallback, useMemo, useTransition } from 'react';
import { 
  fetchSamtaletyper, 
  fetchReferatData, 
  fetchAIReferatData, 
  fetchKPIStats,
  fetchTimelineStats 
} from '../services/dashboardAPI';
import { transformReferatData } from '../services/dashboardTransformers';

const DashboardContext = createContext();

// Default KPI structure
const defaultKPIs = {
  positiveFeedback: 0,
  negativeFeedback: 0,
  avgTimeToAiReport: 0,
  avgTimeToApproval: 0,
  totalCount: 0,
  mostFrequentType: 'N/A'
};

// Default state structure
const defaultState = {
  statistics: [],
  kpis: defaultKPIs,
  timelineData: [],
  count: 0
};

export const DashboardProvider = ({ children }) => {
  const [statistics, setStatistics] = useState([]);
  const [kpis, setKpis] = useState(defaultKPIs);
  const [timelineData, setTimelineData] = useState([]);
  const [accurateConversationCount, setAccurateConversationCount] = useState(0);
  const [samtaletyper, setSamtaletyper] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [isThrottled, setIsThrottled] = useState(false);

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
      if (newState.kpis) {
        setKpis(newState.kpis);
      }
      if (newState.timelineData?.length) {
        setTimelineData(newState.timelineData);
      }
      if (newState.statistics?.length) {
        setStatistics(newState.statistics);
      }
      setAccurateConversationCount(newState.kpis?.totalCount || 0);
      // Update previous state after successful update
      setPreviousState(newState);
    });
  }, []);

  const fetchDashboardData = useCallback(async (filters = {}, isReset = false) => {
    // Skip if throttled and not a reset operation
    if (!isReset && isThrottled) {
      console.log('Throttling dashboard data fetch');
      return;
    }

    try {
      setIsLoading(true);
      setIsThrottled(true);

      // Convert conversationType to type for API
      const apiFilters = {
        ...filters,
        type: filters.conversationType,
        conversationType: undefined
      };

      console.log('Fetching dashboard data with filters:', apiFilters);

      // Fetch all required data
      console.log('Starting API calls...');
      const [kpiStats, timelineStats] = await Promise.all([
        fetchKPIStats(apiFilters),
        fetchTimelineStats(apiFilters)
      ]);

      console.log('API responses:', {
        kpiStats,
        timelineStats: {
          length: timelineStats.length,
          firstPoint: timelineStats[0],
          lastPoint: timelineStats[timelineStats.length - 1]
        }
      });

      if (!timelineStats || timelineStats.length === 0) {
        console.warn('No timeline stats received');
      }

      // Update state with new data
      updateStateWithTransition({
        kpis: kpiStats,
        timelineData: timelineStats,
        statistics: timelineStats
      });

      // Reset throttle after 1 second
      setTimeout(() => {
        setIsThrottled(false);
      }, 1000);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // On error, revert to previous state
      updateStateWithTransition(previousState);
    } finally {
      setIsLoading(false);
    }
  }, [isThrottled, previousState, updateStateWithTransition]);

  // Expose the state and functions through context
  const value = useMemo(() => ({
    statistics,
    kpis,
    timelineData,
    count: accurateConversationCount,
    samtaletyper,
    isLoading,
    isPending,
    fetchDashboardData,
    fetchSamtaletyperData
  }), [
    statistics,
    kpis,
    timelineData,
    accurateConversationCount,
    samtaletyper,
    isLoading,
    isPending,
    fetchDashboardData,
    fetchSamtaletyperData
  ]);

  return (
    <DashboardContext.Provider value={value}>
      {children}
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
