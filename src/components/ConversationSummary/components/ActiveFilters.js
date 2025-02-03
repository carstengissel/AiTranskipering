import React from 'react';
import { X } from 'lucide-react';

/**
 * Mapping of section keys to their display names in Danish
 */
const sectionNames = {
  viHarAftalt: 'Vi har aftalt',
  viHarIDagTaltOm: 'Vi har i dag talt om',
  dinJobsogningIndtilNu: 'Din jobsøgning indtil nu'
};

/**
 * Component that displays currently active filters as removable tags
 * Shows filters for date, section, and type with the ability to remove each
 * Returns null if no filters are active
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.activeFilters - Object containing current filter values
 * @param {string} [props.activeFilters.date] - Date filter in YYYY-MM-DD format
 * @param {string} [props.activeFilters.section] - Section filter key
 * @param {string} [props.activeFilters.type] - Conversation type filter
 * @param {Function} props.onRemoveFilter - Callback function when removing a filter
 * 
 * @example
 * const activeFilters = {
 *   date: '2024-01-01',
 *   section: 'viHarAftalt',
 *   type: 'jobsamtale'
 * };
 * 
 * <ActiveFilters
 *   activeFilters={activeFilters}
 *   onRemoveFilter={(filterType) => {
 *     // Handle filter removal
 *   }}
 * />
 */
const ActiveFilters = ({ activeFilters, onRemoveFilter }) => {
  // Don't render anything if no filters are active
  if (!Object.values(activeFilters).some(v => v)) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {Object.entries(activeFilters).map(([key, value]) => {
        if (!value) return null;
        
        // Format display value based on filter type
        let displayValue = value;
        if (key === 'section') {
          // Use friendly section names for section filters
          displayValue = sectionNames[value] || value;
        }
        if (key === 'date') {
          // Format date for display
          displayValue = new Date(value).toLocaleDateString();
        }

        return (
          <div 
            key={key}
            className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
          >
            <span>{displayValue}</span>
            <button 
              onClick={() => onRemoveFilter(key)}
              className="hover:text-blue-600"
              aria-label={`Fjern filter: ${displayValue}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ActiveFilters;
