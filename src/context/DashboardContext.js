import React, { createContext, useContext, useState, useCallback, useMemo, useTransition, useEffect } from 'react';
import { 
  fetchSamtaletyper, 
  fetchKPIStats,
  fetchTimelineStats 
} from '../services/dashboardAPI';
import { formatDateForUrl } from '../components/conversation/utils/dateUtils';

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

  // Fetch conversation types on initial load
  useEffect(() => {
    fetchSamtaletyperData();
  }, []);

  const fetchSamtaletyperData = useCallback(async () => {
    try {
      const data = await fetchSamtaletyper();
      setSamtaletyper(data);
      return data;
    } catch (err) {
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
        // Process timestamps to ensure valid Date objects
        const processedStats = newState.statistics.map(stat => ({
          ...stat,
          date: typeof stat.date === 'string' ? stat.date : new Date().toISOString() // Ensure date is a string
        }));
        setStatistics(processedStats);
      }
      setAccurateConversationCount(newState.kpis?.totalCount || 0);
      // Update previous state after successful update
      setPreviousState(newState);
    });
  }, []);

  const fetchDashboardData = useCallback(async (filters = {}, isReset = false) => {
    // Skip if throttled and not a reset operation
    if (!isReset && isThrottled) {
      return;
    }

    try {
      setIsLoading(true);
      setIsThrottled(true);

      // Format dates and timeScale for API
      const formattedFilters = {
        ...filters,
        timeScale: filters.timeScale || 'weeks' // Include timeScale with default
      };

      // Convert startDate and endDate to proper format if they exist
      if (filters.startDate) {
        formattedFilters.startDate = formatDateForUrl(filters.startDate);
      }
      if (filters.endDate) {
        formattedFilters.endDate = formatDateForUrl(filters.endDate);
      }

      // Convert conversationType to type for API
      formattedFilters.type = filters.conversationType;
      formattedFilters.conversationType = undefined;

      // Fetch all required data
      const [kpiStats, timelineStats] = await Promise.all([
        fetchKPIStats(formattedFilters),
        fetchTimelineStats(formattedFilters)
      ]);

      // Process timelineStats to ensure valid dates
      const processedTimelineStats = Array.isArray(timelineStats) 
        ? timelineStats.map(item => {
            try {
              // Convert and validate dates
              const dateStr = item.date || new Date().toISOString();
              const validDate = new Date(dateStr);
              
              // If invalid date, use current date
              const date = !isNaN(validDate.getTime()) 
                ? dateStr 
                : new Date().toISOString();
              
              return {
                ...item,
                date: date
              };
            } catch (err) {
              return {
                ...item,
                date: new Date().toISOString()
              };
            }
          })
        : [];

      // Update state with new data
      updateStateWithTransition({
        kpis: kpiStats,
        timelineData: processedTimelineStats,
        statistics: processedTimelineStats
      });

      // Reset throttle after 1 second
      setTimeout(() => {
        setIsThrottled(false);
      }, 1000);

    } catch (error) {
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