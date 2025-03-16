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

    console.log('Updating filters with:', newFilters);

    startTransition(() => {
      setFilters(prev => {
        // Only update if there are actual changes
        const hasChanges = Object.entries(newFilters).some(
          ([key, value]) => prev[key] !== value
        );
        
        if (hasChanges) {
          console.log('Filter changes detected, applying new filters');
          
          // Create the updated filter object
          const updatedFilters = { ...prev, ...newFilters };
          
          // Store the updated filters in localStorage for persistence
          try {
            localStorage.setItem('dashboardFilters', JSON.stringify({
              filters: updatedFilters,
              timestamp: new Date().getTime()
            }));
            console.log('Saved filters to localStorage:', updatedFilters);
          } catch (error) {
            console.error('Error saving filters to localStorage:', error);
          }
          
          // Keep current filters visible while fetching new data
          // We'll let the component handle the data fetching to avoid circular dependencies
          
          // Open the sidebar when filters are applied
          setIsSidebarOpen(true);
          return updatedFilters;
        }
        return prev;
      });
    });
  }, [filters]);

  const resetFilters = useCallback(() => {
    // Store current filters before resetting
    setPreviousFilters(filters);

    // Reset all filters except timeScale, which should be preserved
    const resetState = {
      startDate: null,
      endDate: null,
      conversationType: 'all',
      section: null,
      date: null,
      timeScale: filters.timeScale || 'weeks' // Preserve the current timeScale
    };

    // Use startTransition for the state update and data fetch
    startTransition(() => {
      // Keep current filters visible while fetching new data
      setFilters(resetState);
      // Fetch fresh data with just the timeScale preserved
      fetchDashboardData({ timeScale: resetState.timeScale }, true);
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