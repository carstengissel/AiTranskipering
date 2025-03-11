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

  const { updateFilters, filters } = useFilters();
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
          prevFiltersRef.current = filters;
        }
      }
    };

    fetchData();
  }, [currentFilters, fetchDashboardData, filters]);

  const handleChartClick = useCallback((data) => {
    if (!data || !data.date) return;

    try {
      // Get start and end of the day
      const date = new Date(data.date);
      const startDate = startOfDay(date);
      const endDate = endOfDay(date);

      // Format dates for URL
      const formattedStartDate = formatDateForUrl(startDate);
      const formattedEndDate = formatDateForUrl(endDate);

      if (!formattedStartDate || !formattedEndDate) return;

      console.log("SamtalerStatusDashboard - handleChartClick - data.date:", data.date, "formattedStartDate:", formattedStartDate, "formattedEndDate:", formattedEndDate); // DEBUG

      // Create URL parameters
      const searchParams = new URLSearchParams();
      searchParams.set('startDate', formattedStartDate);
      searchParams.set('endDate', formattedEndDate);

      // Navigate to conversation summary with date filter
      // const url = `/conversation-summary?${searchParams.toString()}`;
      // console.log("SamtalerStatusDashboard - handleChartClick - Navigating to URL:", url); // DEBUG
      // navigate(url);

      // Update filters in context
      const newFilters = {
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        section: null, // Reset section when selecting new date
        conversationType: 'all' // Reset conversation type when selecting new date
      };
      console.log("SamtalerStatusDashboard - handleChartClick - updateFilters:", newFilters); // DEBUG
      updateFilters(newFilters);
    } catch (error) {
      console.error('Error handling chart click:', error);
    }
  }, [updateFilters, navigate]);
  const handleVisSamtalerClick = useCallback(() => {
    const { filters } = useFilters();
    const { startDate, endDate, section, conversationType } = filters;
    
    // Format dates for URL
    const formattedStartDate = formatDateForUrl(startDate);
    const formattedEndDate = formatDateForUrl(endDate);

    // Create URL parameters
    const searchParams = new URLSearchParams();
    if (formattedStartDate) searchParams.set('startDate', formattedStartDate);
    if (formattedEndDate) searchParams.set('endDate', formattedEndDate);
    if (section) searchParams.set('section', section);
    if (conversationType && conversationType !== 'all') searchParams.set('type', conversationType);

    // Navigate to conversation summary with filters
    const url = `/conversation-summary?${searchParams.toString()}`;
    console.log("SamtalerStatusDashboard - handleVisSamtalerClick - Navigating to URL:", url); // DEBUG
    navigate(url);
  }, [filters, navigate, formatDateForUrl]);

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
            onChartClick={handleChartClick}
          />
          <MonthlyTimeStatisticsChart
            data={statistics || []}
          />
          <FeedbackChart
            data={statistics || []}
            onChartClick={handleChartClick}
          />
          <SectionChangesChart
            data={statistics || []}
            onChartClick={handleChartClick}
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
