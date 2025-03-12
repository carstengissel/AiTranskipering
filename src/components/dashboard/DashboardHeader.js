import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFilters } from '../../context/FilterContext';
import { useDashboard } from '../../context/DashboardContext';
import { formatDateForUrl } from '../conversation/utils/dateUtils';

const DashboardHeader = () => {
  const navigate = useNavigate();
  const { filters, setIsSidebarOpen, resetFilters } = useFilters();
  const { isLoading, isPending } = useDashboard();

  const handleNavigateToDetails = () => {
    // Create a new URLSearchParams object for consistent parameter handling
    const queryParams = new URLSearchParams();
    
    console.log("Current filters for navigation:", filters);
    
    // Format the dates consistently
    let startDate = null;
    let endDate = null;
    
    try {
      // Handle the startDate
      if (filters.startDate) {
        startDate = formatDateForUrl(filters.startDate);
        if (startDate) {
          queryParams.append('startDate', startDate);
          console.log("Added startDate to params:", startDate);
        }
      }
      
      // Handle the endDate
      if (filters.endDate) {
        endDate = formatDateForUrl(filters.endDate);
        if (endDate) {
          queryParams.append('endDate', endDate);
          console.log("Added endDate to params:", endDate);
        }
      }
      
      // Single date handling (for backward compatibility or specific date filters)
      if (filters.date) {
        const formattedDate = formatDateForUrl(filters.date);
        if (formattedDate) {
          queryParams.append('date', formattedDate);
          console.log("Added date to params:", formattedDate);
        }
      }
    } catch (err) {
      console.error("Error formatting dates for navigation:", err);
    }
    
    // Handle section filter
    if (filters.section) {
      if (filters.section === 'uaendredeSektioner') {
        queryParams.append('unchanged', 'true');
      } else {
        queryParams.append('section', filters.section);
      }
      console.log("Added section to params:", filters.section);
    }
    
    // Handle conversation type filter
    if (filters.conversationType && filters.conversationType !== 'all') {
      queryParams.append('type', filters.conversationType);
      console.log("Added type to params:", filters.conversationType);
    }

    // Create the final URL
    const url = `/conversation-summary?${queryParams.toString()}`;
    console.log("Navigating to:", url);
    
    // Use navigate to go to the conversation summary view with the filters
    navigate(url);
  };

  const hasActiveFilters = Object.values(filters).some(filter => filter !== null && filter !== 'all');
  const isUpdating = isLoading || isPending;

  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center">
        <h1 className="text-xl font-bold">Samtalereferat Statistik</h1>
      </div>
      <div className="flex items-center gap-1">
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            disabled={isUpdating}
            className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            Nulstil filtre
          </button>
        )}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="px-2 text-gray-600"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3L2 21h20L12 3z" />
          </svg>
        </button>
        <button
          onClick={handleNavigateToDetails}
          disabled={isUpdating}
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
        >
          Vis samtaler
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;