import React from 'react';
import { ArrowLeft, Calendar, Clock, User, UserCircle } from 'lucide-react';
import { formatTimeAgo } from '../utils/dateUtils';
import { 
  parseReferat, 
  formatReferatTitle, 
  calculateEndTime, 
  calculateChangePercentage,
  getChangeColorClass
} from '../utils/referatUtils';
import FeedbackIcon from './FeedbackIcon';
import ActiveFilters from '../../conversation/components/ActiveFilters';

const ReportList = ({ 
  referats, 
  activeFilters, 
  onSelectReport, 
  onRemoveFilter, 
  onNavigateBack 
}) => {
  return (
    <div>
      {/* Back button */}
      <button 
        onClick={onNavigateBack}
        className="mb-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 flex items-center"
        aria-label="Tilbage til statistik"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Tilbage til statistik
      </button>

      {/* Active filters display */}
      <ActiveFilters 
        filters={activeFilters} 
        onRemoveFilter={onRemoveFilter} 
      />

      {/* Grid of report cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[calc(100vh-200px)] overflow-y-auto mt-4">
        {referats.map(referat => {
          // Check if the report has been modified after AI generation
          const hasChanges = Object.keys(parseReferat(referat.referat)).some(key => 
            JSON.stringify(parseReferat(referat.referat)[key]) !== JSON.stringify(parseReferat(referat.aiReferat)[key])
          );

          // Calculate change percentage
          const changePercentage = calculateChangePercentage(referat.aiReferat, referat.referat);
          const colorClass = getChangeColorClass(changePercentage);

          // Get timing values directly from the referat object
          const tidTilGodkendelse = referat.tid_til_godkendelse;
          const tidTilAIReferat = referat.tid_til_ai_referat || referat.tid_fra_transskription_til_ai_referat;

          // Calculate end times using referat_godkendt_at as the base time
          const baseTime = referat.referat_godkendt_at;
          const godkendelseEndTime = baseTime ? new Date(baseTime) : null;
          const aiReferatEndTime = referat.ai_referat_recieved_at ? new Date(referat.ai_referat_recieved_at) : null;

          // Format options for datetime display
          const dateTimeOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          };

          return (
            <div 
              key={referat.samind_lbnr} 
              className={`rounded-lg cursor-pointer overflow-hidden transition-all duration-150 hover:opacity-90 ${
                changePercentage > 25 && changePercentage <= 75 
                  ? '!bg-gradient-to-r !from-yellow-400 !via-yellow-500 !to-yellow-400' 
                  : `${colorClass}`
              }`}
              style={{
                ...(changePercentage > 25 && changePercentage <= 75 && {
                  background: 'linear-gradient(to right, #facc15, #eab308, #facc15)'
                })
              }}
              onClick={() => onSelectReport(referat)}
            >
              <div className="p-4">
                {/* Card header with title and feedback status */}
                <div className="flex justify-between items-start mb-2 p-2 rounded">
                  <h3 className="text-lg font-semibold">{formatReferatTitle(referat, referats)}</h3>
                  <div className="flex gap-2">
                    <FeedbackIcon feedback={referat.feedback} />
                  </div>
                </div>

                {/* Date and time ago */}
                <div key={`date-${referat.samind_lbnr}`} className="flex items-center gap-2 text-sm mb-3 p-2 rounded">
                  <Calendar className="h-4 w-4" />
                  <span>{referat.referat_godkendt_at ? new Date(referat.referat_godkendt_at).toLocaleDateString() : '-'}</span>
                  <span className="text-gray-400">•</span>
                  <span>{referat.referat_godkendt_at ? formatTimeAgo(referat.referat_godkendt_at) : '-'}</span>
                </div>

                {/* Time information */}
                <div className="space-y-2 p-2 rounded">
                  <div key={`godkendelse-${referat.samind_lbnr}`} className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>Tid til godkendelse:</span>
                      <span>
                        {typeof tidTilGodkendelse === 'number'
                          ? `${Math.round(tidTilGodkendelse)} min`
                          : '-'}
                      </span>
                    </div>
                    {tidTilGodkendelse && godkendelseEndTime && referat.transcription_recieved_at && (
                      <div className="ml-2 text-xs text-gray-500">
                        ({new Date(referat.transcription_recieved_at).toLocaleString(undefined, dateTimeOptions)} → {godkendelseEndTime.toLocaleString(undefined, dateTimeOptions)})
                      </div>
                    )}
                  </div>

                  <div key={`ai-referat-${referat.samind_lbnr}`} className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>Tid til AI-referat:</span>
                      <span>
                        {typeof tidTilAIReferat === 'number'
                          ? `${Math.round(tidTilAIReferat)} min`
                          : '-'}
                      </span>
                    </div>
                    {tidTilAIReferat && aiReferatEndTime && referat.transcription_recieved_at && (
                      <div className="ml-2 text-xs text-gray-500">
                        ({new Date(referat.transcription_recieved_at).toLocaleString(undefined, dateTimeOptions)} → {aiReferatEndTime.toLocaleString(undefined, dateTimeOptions)})
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card footer showing change status */}
              <div className={`px-4 py-3 text-sm border-t ${
                changePercentage <= 25
                  ? 'border-green-400 bg-green-100'
                  : changePercentage <= 70
                  ? 'border-yellow-400 bg-yellow-100'
                  : 'border-red-400 bg-red-100'
              }`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${
                      changePercentage <= 25
                        ? 'bg-green-500'
                        : changePercentage <= 70
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`} />
                    <span className={`font-semibold ${
                      changePercentage <= 25
                        ? 'text-green-500'
                        : changePercentage <= 70
                        ? 'text-yellow-500'
                        : 'text-red-500'
                    }`}>
                      {changePercentage > 0 
                        ? `${Math.round(changePercentage)}% ændret` 
                        : 'Ingen ændringer'}
                    </span>
                  </div>
                  <span className={`font-medium ${
                    changePercentage <= 25
                      ? 'text-green-600 hover:text-green-700'
                      : changePercentage <= 70
                      ? 'text-yellow-600 hover:text-yellow-700'
                      : 'text-red-600 hover:text-red-700'
                  }`}>Vis detaljer →</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReportList;
