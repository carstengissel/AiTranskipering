import React, { createContext, useContext, useState, useCallback, useMemo, useTransition } from 'react';
import { useDashboard } from './DashboardContext';
import { formatDateForUrl } from '../components/conversation/utils/dateUtils';

const FilterContext = createContext();

const defaultFilters = {
  startDate: null,
  endDate: null,
  conversationType: 'all',
  section: null,
  date: null,
  timeScale: 'weeks'
};

export const FilterProvider = ({ children }) => {
  const [filters, setFilters] = useState(defaultFilters);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { fetchDashboardData } = useDashboard();
  const [isPending, startTransition] = useTransition();

  // Keep track of previous filters for smooth transitions
  const [previousFilters, setPreviousFilters] = useState(defaultFilters);

  // Memoize the update function to prevent unnecessary re-renders
  const updateFilters = useCallback((newFilters) => {
    setPreviousFilters(filters); // Store current filters before updating

    startTransition(() => {
      setFilters(prev => {
        // Only update if there are actual changes
        const hasChanges = Object.entries(newFilters).some(
          ([key, value]) => prev[key] !== value
        );
        
        if (hasChanges) {
          // Keep current filters visible while fetching new data
          fetchDashboardData(newFilters);
          // Open the sidebar when filters are applied
          setIsSidebarOpen(true);
          return { ...prev, ...newFilters };
        }
        return prev;
      });
    });
  }, [filters, fetchDashboardData]);

  const resetFilters = useCallback(() => {
    // Store current filters before resetting
    setPreviousFilters(filters);

    // Reset all filters including any additional ones that might have been added
    const resetState = {
      startDate: null,
      endDate: null,
      conversationType: 'all',
      section: null,
      date: null,
      timeScale: 'weeks'
    };

    // Use startTransition for the state update and data fetch
    startTransition(() => {
      // Keep current filters visible while fetching new data
      setFilters(resetState);
      // Fetch fresh data with no filters
      fetchDashboardData({}, true);
    });

    // Clear URL parameters
    const newUrl = window.location.pathname;
    window.history.pushState({}, '', newUrl);
  }, [filters, fetchDashboardData]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  // Handle date string conversions
  const processDateFilter = useCallback((dateString) => {
    if (!dateString) return null;
    
    try {
      // Try to parse as Date object first
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return formatDateForUrl(date);
      }
      
      // Already in correct format
      return dateString;
    } catch (err) {
      console.error('Error processing date filter:', err);
      return null;
    }
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    filters,
    previousFilters, // Expose previous filters for transitions
    updateFilters,
    resetFilters,
    isSidebarOpen,
    setIsSidebarOpen,
    toggleSidebar,
    isPending
  }), [
    filters,
    previousFilters,
    updateFilters,
    resetFilters,
    isSidebarOpen,
    toggleSidebar,
    isPending
  ]);

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};