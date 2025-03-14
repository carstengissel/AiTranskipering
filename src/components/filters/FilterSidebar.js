import React, { useRef, useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from 'react-datepicker';
import da from 'date-fns/locale/da';
import { useFilters } from '../../context/FilterContext';
import { useDashboard } from '../../context/DashboardContext';
import { X } from 'lucide-react';
import { formatDateForUrl } from '../conversation/utils/dateUtils';

// Register Danish locale for DatePicker
registerLocale('da', da);

/**
 * Helper function to safely parse dates
 * @param {string|Date} dateValue - The date to parse
 * @returns {Date|null} - Returns a valid Date object or null
 */
const safelyParseDate = (dateValue) => {
  if (!dateValue) return null;
  
  try {
    // If it's already a Date object
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
      return dateValue;
    }
    
    // If it's a string in DD.MM.YYYY format
    if (typeof dateValue === 'string' && dateValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
      const [day, month, year] = dateValue.split('.');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return !isNaN(date.getTime()) ? date : null;
    }
    
    // Try standard Date parsing
    const date = new Date(dateValue);
    return !isNaN(date.getTime()) ? date : null;
  } catch (err) {
    console.error('Error parsing date:', err, dateValue);
    return null;
  }
};

const FilterSidebar = () => {
  const { 
    filters, 
    updateFilters, 
    resetFilters, 
    isSidebarOpen, 
    setIsSidebarOpen,
    isPending 
  } = useFilters();
  const { samtaletyper, isLoading } = useDashboard();
  const sidebarRef = useRef(null);

  // Local state for filter values - with proper date conversion
  const [localFilters, setLocalFilters] = useState({
    startDate: safelyParseDate(filters.startDate),
    endDate: safelyParseDate(filters.endDate),
    conversationType: filters.conversationType || 'all',
    timeScale: filters.timeScale || 'weeks'
  });

  // Update local filters when global filters change
  useEffect(() => {
    setLocalFilters({
      startDate: safelyParseDate(filters.startDate),
      endDate: safelyParseDate(filters.endDate),
      conversationType: filters.conversationType || 'all',
      timeScale: filters.timeScale || 'weeks'
    });
  }, [filters]);

  // Debug samtaletyper data
  useEffect(() => {
    console.log('Samtaletyper data:', samtaletyper);
  }, [samtaletyper]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsSidebarOpen(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen, setIsSidebarOpen]);

  const handleApplyFilters = () => {
    // Create a new URLSearchParams object
    const queryParams = new URLSearchParams();

    // Debug the filter application
    console.log('Applying filters:', localFilters);

    // Only add parameters if they have values and aren't default values
    if (localFilters.startDate) {
      const formattedStartDate = formatDateForUrl(localFilters.startDate);
      if (formattedStartDate) {
        queryParams.set('startDate', formattedStartDate);
      }
    }

    if (localFilters.endDate) {
      const formattedEndDate = formatDateForUrl(localFilters.endDate);
      if (formattedEndDate) {
        queryParams.set('endDate', formattedEndDate);
      }
    }

    if (localFilters.conversationType && localFilters.conversationType !== 'all') {
      queryParams.set('type', localFilters.conversationType);
    }

    // Update URL without reloading the page
    const newUrl = queryParams.toString()
      ? `${window.location.pathname}?${queryParams.toString()}`
      : window.location.pathname;
    window.history.pushState({}, '', newUrl);

    // Update global filters with the local state
    updateFilters({
      startDate: localFilters.startDate,
      endDate: localFilters.endDate,
      conversationType: localFilters.conversationType,
      timeScale: localFilters.timeScale
    });
    
    // Force a data refresh by saving to localStorage
    localStorage.setItem('dashboardFilters', JSON.stringify({
      startDate: localFilters.startDate ? formatDateForUrl(localFilters.startDate) : null,
      endDate: localFilters.endDate ? formatDateForUrl(localFilters.endDate) : null,
      conversationType: localFilters.conversationType,
      timeScale: localFilters.timeScale
    }));
    
    setIsSidebarOpen(false);
  };

  const handleResetFilters = () => {
    // Reset local state
    setLocalFilters({
      startDate: null,
      endDate: null,
      conversationType: 'all',
      timeScale: 'weeks'
    });

    // Use the resetFilters function from FilterContext
    resetFilters();
    
    setIsSidebarOpen(false);
  };

  // Determine button disabled state and loading indicator
  const isUpdating = isLoading || isPending;
  const buttonClass = isUpdating
    ? "opacity-50 cursor-not-allowed"
    : "hover:bg-blue-700 hover:bg-gray-300";

  return (
    <div
      ref={sidebarRef}
      className={`fixed top-0 right-0 h-screen bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
        isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ width: '250px' }}
    >
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg">Filters</h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1"
            disabled={isUpdating}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div>
          {/* Removed Tidsinterval dropdown as it's only needed on charts */}

          <div className="mb-4">
            <label className="block mb-1">
              Samtaletype
            </label>
            <select
              className="w-full p-1 border"
              value={localFilters.conversationType}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, conversationType: e.target.value }))}
              disabled={isUpdating}
            >
              <React.Fragment>
                <option key="all" value="all">Alle samtaletyper</option>
                {Array.isArray(samtaletyper) && samtaletyper.length > 0 ? (
                  samtaletyper.map((type) => (
                    <option key={`type-${type.samtyp_type}`} value={type.samtyp_type}>
                      {type.samtyp_type}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="job1">job1</option>
                    <option value="jobn">jobn</option>
                    <option value="tele">tele</option>
                  </>
                )}
              </React.Fragment>
            </select>
          </div>

          <div className="mb-4">
            <label className="block mb-1">
              Datointerval
            </label>
            <div className="space-y-2">
              <DatePicker
                selected={localFilters.startDate}
                onChange={(date) => setLocalFilters(prev => ({ ...prev, startDate: date }))}
                selectsStart
                startDate={localFilters.startDate}
                endDate={localFilters.endDate}
                locale="da"
                dateFormat="dd.MM.yyyy"
                placeholderText="Fra dato"
                className="w-full p-1 border"
                disabled={isUpdating}
              />
              <DatePicker
                selected={localFilters.endDate}
                onChange={(date) => setLocalFilters(prev => ({ ...prev, endDate: date }))}
                selectsEnd
                startDate={localFilters.startDate}
                endDate={localFilters.endDate}
                minDate={localFilters.startDate}
                locale="da"
                dateFormat="dd.MM.yyyy"
                placeholderText="Til dato"
                className="w-full p-1 border"
                disabled={isUpdating}
              />
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleApplyFilters}
              className="w-full bg-blue-600 text-white py-2 px-4"
              disabled={isUpdating}
            >
              {isUpdating ? 'Opdaterer...' : 'Anvend filtre'}
            </button>
            <button
              onClick={handleResetFilters}
              className="w-full bg-gray-200 text-gray-700 py-2 px-4"
              disabled={isUpdating}
            >
              {isUpdating ? 'Nulstiller...' : 'Nulstil alle filtre'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;