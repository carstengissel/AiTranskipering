import React, { createContext, useContext, useState, useCallback, useMemo, useTransition, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatDateForUrl, parseDateFromUrl } from '../components/conversation/utils/dateUtils';

const FilterContext = createContext();

const defaultFilters = {
  startDate: null,
  endDate: null,
  conversationType: 'all',
  section: null,
  date: null
};

export const FilterProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [filters, setFilters] = useState(defaultFilters);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Parse URL parameters on initial load
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlFilters = {
      startDate: parseDateFromUrl(searchParams.get('startDate')),
      endDate: parseDateFromUrl(searchParams.get('endDate')),
      date: parseDateFromUrl(searchParams.get('date')),
      section: searchParams.get('section'),
      conversationType: searchParams.get('type') || 'all'
    };

    // Only update state if we have actual filters in the URL
    if (Object.values(urlFilters).some(val => val)) {
      console.log('Setting initial filters from URL:', urlFilters);
      setFilters(current => ({
        ...current,
        ...Object.fromEntries(
          Object.entries(urlFilters).filter(([_, v]) => v !== null)
        )
      }));
    }
  }, [location.search]);

  // Keep track of previous filters for smooth transitions
  const [previousFilters, setPreviousFilters] = useState(defaultFilters);

  // Update URL when filters change
  const updateURL = useCallback((newFilters) => {
    const params = new URLSearchParams();
    
    if (newFilters.startDate) {
      params.set('startDate', newFilters.startDate);
    }
    
    if (newFilters.endDate) {
      params.set('endDate', newFilters.endDate);
    }
    
    if (newFilters.date) {
      params.set('date', newFilters.date);
    }
    
    if (newFilters.section) {
      params.set('section', newFilters.section);
    }
    
    if (newFilters.conversationType && newFilters.conversationType !== 'all') {
      params.set('type', newFilters.conversationType);
    }
    
    // Build new URL
    const queryString = params.toString();
    const newURL = queryString 
      ? `${location.pathname}?${queryString}`
      : location.pathname;
    
    // Update URL without full page reload
    window.history.pushState({}, '', newURL);
  }, [location.pathname]);

  // Memoize the update function to prevent unnecessary re-renders
  const updateFilters = useCallback((newFilters) => {
    console.log('Updating filters to:', newFilters);
    
    setPreviousFilters(current => ({...current})); // Store current filters before updating

    // Update URL
    updateURL(newFilters);

    startTransition(() => {
      setFilters(prev => {
        // Check if there are actual changes
        const hasChanges = Object.entries(newFilters).some(
          ([key, value]) => {
            // Special handling for date objects
            if (key.includes('Date') && prev[key] && value) {
              const prevDate = new Date(prev[key]).getTime();
              const newDate = new Date(value).getTime();
              return prevDate !== newDate;
            }
            return prev[key] !== value;
          }
        );

        if (hasChanges) {
          return { ...prev, ...newFilters };
        }
        return prev;
      });
    });
  }, [updateURL]);

  const resetFilters = useCallback(() => {
    console.log('Resetting all filters');
    
    // Store current filters before resetting
    setPreviousFilters(current => ({...current}));

    // Reset all filters in state
    startTransition(() => {
      setFilters(defaultFilters);
    });

    // Clear URL parameters
    navigate(location.pathname, { replace: true });
  }, [navigate, location.pathname]);

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
    previousFilters,
    updateFilters,
    resetFilters,
    isSidebarOpen,
    setIsSidebarOpen,
    toggleSidebar,
    isPending,
    processDateFilter
  }), [
    filters,
    previousFilters,
    updateFilters,
    resetFilters,
    isSidebarOpen,
    toggleSidebar,
    isPending,
    processDateFilter
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