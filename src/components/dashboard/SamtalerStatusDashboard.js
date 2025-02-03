import React, { useCallback } from 'react';
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
import { 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfQuarter, 
  endOfQuarter, 
  startOfYear, 
  endOfYear 
} from 'date-fns';

const SamtalerStatusDashboard = () => {
  const { 
    statistics,
    isLoading,
    isPending,
    fetchDashboardData
  } = useDashboard();

  const { updateFilters } = useFilters();

  const getDateRange = (date, timeScale) => {
    const dateObj = new Date(date);
    switch (timeScale) {
      case 'days':
        return {
          start: startOfDay(dateObj),
          end: endOfDay(dateObj)
        };
      case 'weeks':
        return {
          start: startOfWeek(dateObj, { weekStartsOn: 1 }),
          end: endOfWeek(dateObj, { weekStartsOn: 1 })
        };
      case 'months':
        return {
          start: startOfMonth(dateObj),
          end: endOfMonth(dateObj)
        };
      case 'quarters':
        return {
          start: startOfQuarter(dateObj),
          end: endOfQuarter(dateObj)
        };
      case 'years':
        return {
          start: startOfYear(dateObj),
          end: endOfYear(dateObj)
        };
      default:
        return {
          start: startOfDay(dateObj),
          end: endOfDay(dateObj)
        };
    }
  };

  const handleChartClick = useCallback(async (data, section = null) => {
    if (!data || !data.date) return;
    
    try {
      // Parse the date string to ensure it's valid
      const date = new Date(data.date);
      if (isNaN(date.getTime())) return; // Skip if date is invalid

      // Get the time scale from the chart's data
      const timeScale = data.timeScale || 'days';
      
      // Get the date range based on the time scale
      const { start, end } = getDateRange(date, timeScale);
      
      // Update filters with the date range
      updateFilters({
        startDate: start,
        endDate: end,
        section: section || null,
        date: data.date
      });
    } catch (error) {
      console.error('Error handling chart click:', error);
    }
  }, [updateFilters]);

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
