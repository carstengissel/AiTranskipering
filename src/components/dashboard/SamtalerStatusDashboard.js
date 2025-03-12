import React, { useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import ConversationTypesChart from '../charts/ConversationTypesChart';
import AverageSectionChangesChart from '../charts/AverageSectionChangesChart';
import { formatDateForUrl } from '../conversation/utils/dateUtils';
import { startOfDay, endOfDay } from 'date-fns';

const SamtalerStatusDashboard = () => {
  const navigate = useNavigate();
  const {
    statistics,
    isLoading,
    isPending,
    fetchDashboardData
  } = useDashboard();

  const { updateFilters, filters, resetFilters, setIsSidebarOpen } = useFilters();
  const isInitialMount = useRef(true);
  const prevFiltersRef = useRef(filters);

  // Memoize the current filters to compare with previous
  const currentFilters = useMemo(() => {
    return JSON.stringify(filters);
  }, [filters]);

  // Combined useEffect for initial load and filter changes
  useEffect(() => {
    const fetchData = async () => {
      if (isInitialMount.current) {
        console.log('Initial dashboard data fetch...');
        isInitialMount.current = false;
        await fetchDashboardData({}, true);
      } else {
        // Compare stringified filters to detect real changes
        const prevFiltersStr = JSON.stringify(prevFiltersRef.current);
        if (currentFilters !== prevFiltersStr) {
          console.log('Filters changed, fetching new data...', {
            prev: prevFiltersRef.current,
            current: filters
          });
          await fetchDashboardData(filters);
          prevFiltersRef.current = {...filters};
        }
      }
    };

    fetchData();
  }, [currentFilters, fetchDashboardData, filters]);

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
      
      // Otherwise, calculate and format dates
      const date = new Date(data.date);
      const startDate = startOfDay(date);
      const endDate = endOfDay(date);
      
      // Format dates for URL
      const formattedStartDate = formatDateForUrl(startDate);
      const formattedEndDate = formatDateForUrl(endDate);
      
      if (!formattedStartDate || !formattedEndDate) {
        console.error("Failed to format dates:", { startDate, endDate });
        return;
      }
      
      console.log("Formatted dates for filter:", {
        formattedStartDate,
        formattedEndDate
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
  }, [updateFilters]);

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