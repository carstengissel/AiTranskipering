import React from 'react';
import { ArrowLeft } from 'lucide-react';
import ActiveFilters from './ActiveFilters';
import { formatDateForDisplay } from '../utils/dateUtils';
import FeedbackIcon from './FeedbackIcon';

const ReportList = ({ 
  referats, 
  loading, 
  error, 
  activeFilters,
  onSelectReport,
  onNavigateBack,
  onRemoveFilter 
}) => {
  const formatDate = (dateStr) => {
    if (!dateStr) {
      return 'Ingen dato';
    }
    
    return formatDateForDisplay(dateStr);
  };

  return (
    <div>
      <button 
        onClick={onNavigateBack}
        className="mb-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 flex items-center"
        aria-label="Tilbage til statistik"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Tilbage til statistik
      </button>

      {activeFilters && Object.keys(activeFilters).length > 0 && (
        <ActiveFilters 
          filters={activeFilters} 
          onRemoveFilter={onRemoveFilter}
        />
      )}

      <div className="mt-4">
        <div className="mb-2 flex justify-between items-center">
          <h2 className="text-lg font-medium">
            {referats.length > 0
              ? `${referats.length} samtaler fundet`
              : 'Ingen samtaler fundet'}
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500 col-span-3">
              Indlæser referater...
            </div>
          ) : Array.isArray(referats) && referats.length > 0 ? (
            referats.map(referat => {
              // Calculate change percentage for card background color
              const changePercentage = calculateChangePercentage(referat);
              const colorClass = getColorClass(changePercentage);
              
              return (
                <div 
                  key={referat.id || referat.samind_lbnr || `${referat.lbnr}-${Math.random()}`}
                  className={`rounded-lg shadow hover:shadow-md cursor-pointer transition-all duration-150 overflow-hidden ${colorClass}`}
                  onClick={() => onSelectReport(referat)}
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold">
                        Referat {formatDate(referat.referat_godkendt_at)}
                        {referat.samind_lbnr ? ` #${referat.samind_lbnr}` : ''}
                      </h3>
                      <FeedbackIcon feedback={referat.feedback} />
                    </div>
                    
                    <div className="text-sm text-gray-700 mt-2">
                      <div className="flex justify-between items-center">
                        <span>Tid til godkendelse:</span>
                        <span className="font-medium">
                          {typeof referat.tid_til_godkendelse === 'number'
                            ? `${Math.round(referat.tid_til_godkendelse)} min`
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span>Tid til AI-referat:</span>
                        <span className="font-medium">
                          {typeof referat.tid_til_ai_referat === 'number'
                            ? `${Math.round(referat.tid_til_ai_referat)} min`
                            : '-'}
                        </span>
                      </div>
                    </div>
                    
                    {referat.samtyp_type && (
                      <div className="mt-3 text-sm">
                        <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                          {referat.samtyp_type}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className={`px-4 py-2 ${
                    getFooterClass(changePercentage)
                  }`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          getDotClass(changePercentage)
                        }`} />
                        <span className="text-sm font-medium">
                          {changePercentage > 0 
                            ? `${Math.round(changePercentage)}% ændret` 
                            : 'Ingen ændringer'}
                        </span>
                      </div>
                      <span className="text-sm">Vis detaljer →</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-gray-500 col-span-3">
              {error || 'Ingen referater fundet for de valgte filtre'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate change percentage
const calculateChangePercentage = (referat) => {
  if (!referat || !referat.referat || !referat.aiReferat) {
    return 0;
  }
  
  // Simple text-based comparison - count different characters
  const aiText = referat.aiReferat || '';
  const humanText = referat.referat || '';
  
  // If texts are identical, return 0
  if (aiText === humanText) {
    return 0;
  }
  
  // Calculate rough percentage based on different length
  const lengthDiff = Math.abs(humanText.length - aiText.length);
  const percentage = Math.min(100, Math.round((lengthDiff / Math.max(humanText.length, 1)) * 50));
  
  return percentage;
};

// Helper function to get color class based on percentage
const getColorClass = (percentage) => {
  if (percentage <= 25) {
    return 'bg-green-50 hover:bg-green-100';
  } else if (percentage <= 70) {
    return 'bg-yellow-50 hover:bg-yellow-100';
  } else {
    return 'bg-red-50 hover:bg-red-100';
  }
};

// Helper function to get footer class based on percentage
const getFooterClass = (percentage) => {
  if (percentage <= 25) {
    return 'bg-green-100 text-green-800 border-t border-green-200';
  } else if (percentage <= 70) {
    return 'bg-yellow-100 text-yellow-800 border-t border-yellow-200';
  } else {
    return 'bg-red-100 text-red-800 border-t border-red-200';
  }
};

// Helper function to get dot class based on percentage
const getDotClass = (percentage) => {
  if (percentage <= 25) {
    return 'bg-green-500';
  } else if (percentage <= 70) {
    return 'bg-yellow-500';
  } else {
    return 'bg-red-500';
  }
};

export default ReportList;