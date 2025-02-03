import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { isSameDate } from '../utils/dateUtils';
import { parseReferat } from '../utils/referatUtils';

/**
 * Custom hook for fetching and filtering conversation reports
 * Handles data fetching, filtering, and caching to prevent unnecessary API calls
 * 
 * @param {Object} activeFilters - The current active filters
 * @param {string} activeFilters.date - Date filter in YYYY-MM-DD format
 * @param {string} activeFilters.section - Section filter (viHarAftalt, viHarIDagTaltOm, etc.)
 * @param {string} activeFilters.type - Conversation type filter
 * @returns {Object} Object containing referats array, loading state, and error state
 */
export const useReferats = (activeFilters) => {
  // State for storing fetched and filtered reports
  const [referats, setReferats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ref for tracking previous filters to prevent unnecessary API calls
  const prevFiltersRef = useRef(null);

  useEffect(() => {
    const areFiltersEqual = (prev, curr) => {
      if (!prev || !curr) return false;
      return (
        prev.date === curr.date &&
        prev.section === curr.section &&
        prev.type === curr.type
      );
    };

    // Compare current filters with previous filters to determine if we need to fetch
    const filtersChanged = !areFiltersEqual(prevFiltersRef.current, activeFilters);
    
    // Skip fetching if filters haven't changed and we already have data
    if (!filtersChanged && referats.length > 0) {
      return;
    }

    // Update previous filters reference
    prevFiltersRef.current = { ...activeFilters };

    let isMounted = true;

    /**
     * Fetches reports from the API and applies filters
     * Handles error states and updates loading state
     */
    const fetchReferats = async () => {
      if (!isMounted) return;
      
      setLoading(true);
      setError(null);
      try {
        // Always use the base endpoint since we'll filter the results in memory
        const response = await axios.get('/api/samind_referat');
        
        if (!isMounted) return;

        let filteredData = response.data;

        // Only apply date filter if it's actually present and not null/undefined/empty
        if (activeFilters.date && activeFilters.date.trim()) {
          filteredData = filteredData.filter(referat => 
            isSameDate(referat.reg_tid, activeFilters.date)
          );
        }

        // Only apply section filter if it's actually present and not null/undefined/empty
        if (activeFilters.section && activeFilters.section.trim()) {
          filteredData = filteredData.filter(referat => {
            const sections = parseReferat(referat.referat);
            return sections[activeFilters.section]?.length > 0;
          });
        }

        // Only apply type filter if it's actually present and not null/undefined/empty
        if (activeFilters.type && activeFilters.type.trim()) {
          filteredData = filteredData.filter(referat => 
            referat.samtyp_type === activeFilters.type
          );
        }

        /**
         * Remove duplicates and keep only the latest version of each report
         * Uses samind_lbnr as the unique identifier and compares reg_tid for versions
         */
        const uniqueData = Object.values(
          filteredData.reduce((acc, current) => {
            const key = current.samind_lbnr;
            if (!acc[key] || new Date(acc[key].reg_tid) < new Date(current.reg_tid)) {
              // Use the exact field names from the API response
              current.tidTilGodkendelse = current.tid_til_godkendelse;
              current.tidTilAIReferat = current.tid_til_ai_referat || current.tid_fra_transskription_til_ai_referat;

              acc[key] = current;
            }
            return acc;
          }, {})
        );

        // Sort reports by date, newest first
        uniqueData.sort((a, b) => new Date(b.reg_tid) - new Date(a.reg_tid));

        if (isMounted) {
          setReferats(uniqueData);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching referats:', err);
          setError('Der opstod en fejl ved hentning af referater. Prøv igen senere.');
          setLoading(false);
        }
      }
    };

    // Execute the fetch function
    fetchReferats();

    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isMounted = false;
    };
  }, [activeFilters.date, activeFilters.section, activeFilters.type]); // Only re-run when individual filter values change

  return { referats, loading, error };
};
