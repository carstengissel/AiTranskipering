import React, { useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDashboard } from '../../context/DashboardContext';
import { useFilters } from '../../context/FilterContext';
import DashboardHeader from './DashboardHeader';
import DashboardKPIs from './DashboardKPIs';
import FilterSidebar from '../filters/FilterSidebar';
import ChangesStatisticsChart from '../charts/ChangesStatisticsChart';
import TimeStatisticsChart from '../charts/TimeStatisticsChart';
import MonthlyTimeStatisticsChart from '../charts/MonthlyTimeStatisticsChart';
import FeedbackChart from '../charts/FeedbackChart';
import SectionChangesChart from '../charts/SectionChangesChart';
import SectionChangesBarChart from '../charts/SectionChangesBarChart';
import ConversationTypesChart from '../charts/ConversationTypesChart';
import AverageSectionChangesChart from '../charts/AverageSectionChangesChart';
import { formatDateForUrl } from '../conversation/utils/dateUtils';

const SamtalerStatusDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    statistics,
    isLoading,
    isPending,
    fetchDashboardData
  } = useDashboard();

  const { updateFilters, filters, resetFilters, setIsSidebarOpen } = useFilters();
  const isInitialMount = useRef(true);
  const prevFiltersRef = useRef(filters);
  const hasRestoredFilters = useRef(false);

  // Memoize the current filters to compare with previous
  const currentFilters = useMemo(() => {
    return JSON.stringify(filters);
  }, [filters]);

  // Track if filters have changed
  const filtersChanged = useRef(false);

  // Combined useEffect for initial load and filter changes
  useEffect(() => {
    const fetchData = async () => {
      if (isInitialMount.current) {
        console.log('Initial dashboard data fetch...');
        isInitialMount.current = false;
        
        // Check if we have stored filters in localStorage
        try {
          const storedFiltersData = localStorage.getItem('dashboardFilters');
          if (storedFiltersData) {
            const { filters: storedFilters, timestamp } = JSON.parse(storedFiltersData);
            
            // Check if filters are still valid (not older than 30 minutes)
            const currentTime = new Date().getTime();
            const timeDifference = currentTime - timestamp;
            const maxAge = 30 * 60 * 1000; // 30 minutes
            
            if (timeDifference < maxAge && storedFilters) {
              console.log('Restoring filters from localStorage:', storedFilters);
              // Update filters without triggering a fetch
              updateFilters(storedFilters);
              // Fetch data with the restored filters
              await fetchDashboardData(storedFilters, true);
              prevFiltersRef.current = {...storedFilters};
              return;
            }
          }
        } catch (error) {
          console.error('Error restoring filters from localStorage:', error);
        }
        
        // If no stored filters or they're invalid, fetch with default filters
        await fetchDashboardData({}, true);
      } else {
        // Compare stringified filters to detect real changes
        const prevFiltersStr = JSON.stringify(prevFiltersRef.current);
        const currentFiltersStr = JSON.stringify(filters);
        
        if (currentFiltersStr !== prevFiltersStr) {
          console.log('Filters changed, fetching new data...', {
            prev: prevFiltersRef.current,
            current: filters
          });
          filtersChanged.current = true;
          await fetchDashboardData(filters);
          prevFiltersRef.current = {...filters};
          
          // Force a re-render after data is loaded
          setTimeout(() => {
            filtersChanged.current = false;
          }, 100);
        }
      }
    };

    fetchData();
  }, [currentFilters, fetchDashboardData, filters, updateFilters]);

  // Check if we're returning from the conversation summary page
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const returnToStats = searchParams.get('returnToStats') === 'true';
    
    console.log('Checking for return to stats:', { 
      returnToStats, 
      hasRestoredFilters: hasRestoredFilters.current,
      searchParams: Object.fromEntries(searchParams.entries())
    });
    
    if (returnToStats && !hasRestoredFilters.current) {
      try {
        // Get the stored column data from localStorage
        const storedColumnData = localStorage.getItem('selectedChartColumn');
        console.log('Retrieved stored column data:', storedColumnData);
        
        if (storedColumnData) {
          const columnData = JSON.parse(storedColumnData);
          console.log('Parsed column data:', columnData);
          
          // Check if the data is still valid (not older than 30 minutes)
          const currentTime = new Date().getTime();
          const storedTime = columnData.timestamp || 0;
          const timeDifference = currentTime - storedTime;
          const maxAge = 30 * 60 * 1000; // 30 minutes in milliseconds
          
          if (timeDifference < maxAge) {
            console.log('Restoring filters from previous session:', columnData);
            
            // Create the filter object
            const restoredFilters = {
              startDate: columnData.formattedStartDate,
              endDate: columnData.formattedEndDate,
              section: null,
              conversationType: 'all',
              timeScale: columnData.timeScale || 'weeks'
            };
            
            console.log('Applying restored filters:', restoredFilters);
            
            // Update filters in context
            updateFilters(restoredFilters);
            
            // Open the sidebar to show the filters
            setIsSidebarOpen(true);
            
            // Fetch dashboard data with the restored filters
            // This is crucial to actually apply the filters to the chart
            setTimeout(() => {
              console.log('Fetching dashboard data with restored filters');
              fetchDashboardData(restoredFilters);
              
              // Store these filters in localStorage for persistence
              localStorage.setItem('dashboardFilters', JSON.stringify({
                filters: restoredFilters,
                timestamp: new Date().getTime()
              }));
            }, 100);
            
            // Set the selected date in the chart component
            if (columnData.date) {
              localStorage.setItem('selectedDate', columnData.date);
            }
          } else {
            console.log('Stored column data is too old, not restoring filters');
          }
        } else {
          console.log('No stored column data found in localStorage');
        }
        
        // Clean up the URL by removing the returnToStats parameter
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      } catch (error) {
        console.error('Error restoring filters:', error);
      }
      
      hasRestoredFilters.current = true;
    }
  }, [location.search, updateFilters, setIsSidebarOpen, fetchDashboardData]);

  const handleChartClick = useCallback((data) => {
    if (!data || !data.date) {
      console.error("Invalid chart click data:", data);
      return;
    }

    try {
      console.log("Chart clicked with data:", data);
      
      // If data already contains formatted dates, use them directly
      if (data.formattedStartDate && data.formattedEndDate) {
        console.log("Using pre-formatted dates:", {
          start: data.formattedStartDate,
          end: data.formattedEndDate
        });
        
        // Update filters in context and open sidebar
        updateFilters({
          startDate: data.formattedStartDate,
          endDate: data.formattedEndDate,
          section: null,
          conversationType: 'all',
          timeScale: data.timeScale // Set the timeScale from the chart
        });
        setIsSidebarOpen(true);
        
        return;
      }
      
      // Use period start and end dates from the data
      const startDate = data.payload.periodStart;
      const endDate = data.payload.periodEnd;

      // Format dates for URL
      const formattedStartDate = formatDateForUrl(startDate);
      const formattedEndDate = formatDateForUrl(endDate);

      if (!formattedStartDate || !formattedEndDate) {
        console.error("Failed to format dates:", { startDate, endDate });
        return;
      }

      console.log("Formatted dates for filter:", {
        formattedStartDate,
        formattedEndDate,
        timeScale: data.timeScale
      });

      // Update filters in context with the formatted dates and timeScale
      updateFilters({
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        section: null,
        conversationType: 'all',
        timeScale: data.timeScale
      });
    } catch (error) {
      console.error('Error handling chart click:', error);
    }
  }, [updateFilters, setIsSidebarOpen]);

  const handleNavigateToDetails = useCallback(() => {
    // Format the current filters for URL parameters
    const queryParams = new URLSearchParams();
    
    if (filters.startDate) {
      queryParams.set('startDate', filters.startDate);
    }
    
    if (filters.endDate) {
      queryParams.set('endDate', filters.endDate);
    }
    
    if (filters.section) {
      if (filters.section === 'uaendredeSektioner') {
        queryParams.set('unchanged', 'true');
      } else {
        queryParams.set('section', filters.section);
      }
    }
    
    if (filters.conversationType && filters.conversationType !== 'all') {
      queryParams.set('type', filters.conversationType);
    }
    
    const url = `/conversation-summary?${queryParams.toString()}`;
    console.log("Navigating to details with URL:", url);
    navigate(url);
  }, [filters, navigate]);

  // Use combined loading state for smoother transitions
  const isUpdating = isLoading || isPending;

  return (
    <div className="container mx-auto p-1 pt-0">
      <div className={`transition-opacity duration-300 ${isUpdating ? 'opacity-50' : 'opacity-100'}`}>
        <DashboardHeader />
        
        <DashboardKPIs />

        <div className="grid grid-cols-1 gap-2">
          <ChangesStatisticsChart
            data={statistics || []}
            onChartClick={handleChartClick}
          />
          <TimeStatisticsChart
            data={statistics || []}
          />
          <SectionChangesChart
            data={statistics || []}
            onChartClick={handleChartClick}
          />
          <SectionChangesBarChart />
          <FeedbackChart
            data={statistics || []}
          />
          <AverageSectionChangesChart
            data={statistics || []}
          />
          <ConversationTypesChart
            data={statistics || []}
          />
        </div>
      </div>

      <FilterSidebar />
    </div>
  );
};

export default SamtalerStatusDashboard;