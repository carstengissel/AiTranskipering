import React from 'react';
import { ArrowLeft, Calendar, Clock, User, UserCircle, ChevronUp, ChevronDown, Info } from 'lucide-react';
import { diffWords } from 'diff';
import { formatTimeAgo } from '../utils/dateUtils';
import { parseReferat, formatReferatTitle, calculateChangePercentage, levenshteinDistance } from '../utils/referatUtils';
import FeedbackIcon from './FeedbackIcon';
import ColorLegend from './ColorLegend';

/**
 * Available sections in a report
 */
const sections = ['viHarAftalt', 'viHarIDagTaltOm', 'dinJobsogningIndtilNu', 'andet'];

/**
 * Danish titles for each section
 */
const sectionTitles = {
  viHarAftalt: 'Vi har aftalt',
  viHarIDagTaltOm: 'Vi har i dag talt om',
  dinJobsogningIndtilNu: 'Din jobsøgning indtil nu',
  andet: 'Andet'
};

/**
 * Available text view modes with their labels
 */
const viewModeButtons = [
  { mode: 'final', label: 'Endelig tekst' },
  { mode: 'removed', label: 'Fjernet tekst' },
  { mode: 'added', label: 'Tilføjet tekst' },
  { mode: 'all', label: 'Alle ændringer' }
];

/**
 * Compare two text versions and highlight differences based on view mode
 * 
 * @param {string} text1 - Original text (AI-generated)
 * @param {string} text2 - Modified text (human-edited)
 * @param {string} textViewMode - Current view mode (final, removed, added, or all)
 * @returns {JSX.Element} Formatted text with appropriate highlighting
 */
const compareTexts = (text1, text2, textViewMode) => {
  // Format text to ensure bullet points are on new lines
  const formatText = (text) => {
    return text.replace(/(?<=\S)(?=- )/g, '\n');
  };

  const formattedText1 = formatText(text1);
  const formattedText2 = formatText(text2);

  const diff = diffWords(formattedText1, formattedText2);
  
  // For final view mode, just show the final text
  if (textViewMode === 'final') {
    return <span style={{ whiteSpace: 'pre-wrap' }}>{formattedText2}</span>;
  }
  
  // For other view modes, show appropriate diff parts
  return diff.map((part, index) => {
    if (textViewMode === 'removed' && !part.removed) return null;
    if (textViewMode === 'added' && !part.added) return null;
    if (textViewMode === 'all') {
      return (
        <span key={index} className={part.added ? 'bg-green-200' : part.removed ? 'bg-red-200' : ''} style={{ whiteSpace: 'pre-wrap' }}>
          {part.value}
        </span>
      );
    }
    return (
      <span key={index} className={part.added ? 'bg-green-200' : 'bg-red-200'} style={{ whiteSpace: 'pre-wrap' }}>
        {part.value}
      </span>
    );
  });
};

/**
 * Component that displays detailed view of a selected report
 * Shows side-by-side comparison of AI-generated and human-edited text
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.report - The report object to display
 * @param {Array} props.referats - Array of all reports (needed for title formatting)
 * @param {string} props.textViewMode - Current text view mode
 * @param {boolean} props.showColorLegend - Whether to show the color legend
 * @param {Object} props.openSections - Object tracking which sections are open
 * @param {Object} props.expandedSections - Object tracking expanded additional sections
 * @param {Object} props.activeFilters - Currently active filters
 * @param {Function} props.onBack - Callback to go back to list view
 * @param {Function} props.onTextViewModeChange - Callback when text view mode changes
 * @param {Function} props.onToggleColorLegend - Callback to toggle color legend
 * @param {Function} props.onToggleSection - Callback to toggle a section
 * @param {Function} props.onToggleExpanded - Callback to toggle expanded sections
 */
const ReportDetail = ({
  report,
  referats,
  textViewMode,
  showColorLegend,
  openSections,
  expandedSections,
  activeFilters,
  onBack,
  onTextViewModeChange,
  onToggleColorLegend,
  onToggleSection,
  onToggleExpanded
}) => {
  const humanParsedReferat = parseReferat(report.referat);
  const aiParsedReferat = parseReferat(report.aiReferat);

  // Calculate section change percentage using character-level comparison
  const calculateSectionPercentage = (section) => {
    const aiText = aiParsedReferat[section].join('\n');
    const humanText = humanParsedReferat[section].join('\n');
    
    if (!humanText.trim()) return 0;
    
    // Convert texts to character arrays
    const aiChars = Array.from(aiText);
    const humanChars = Array.from(humanText);
    
    let changes = 0;
    let consecutiveChanges = 0;
    let i = 0;
    let j = 0;
    
    // Compare characters to count changes
    while (i < humanChars.length || j < aiChars.length) {
      if (i >= humanChars.length) {
        changes += aiChars.length - j;
        break;
      }
      if (j >= aiChars.length) {
        changes += humanChars.length - i;
        break;
      }
      
      if (humanChars[i] !== aiChars[j]) {
        consecutiveChanges++;
        changes++;
        i++;
        j++;
      } else {
        if (consecutiveChanges < 3) {
          changes -= consecutiveChanges;
        }
        consecutiveChanges = 0;
        i++;
        j++;
      }
    }
    
    // Calculate percentage and scale down by 0.25 to match card view
    return Math.min(100, Math.round((changes / humanChars.length) * 25));
  };

  // Calculate the average percentage for verification
  const calculateAveragePercentage = () => {
    return calculateChangePercentage(report.aiReferat, report.referat);
  };

  // Log percentages for debugging
  console.log('Average percentage:', calculateAveragePercentage());
  Object.keys(humanParsedReferat).forEach(section => {
    console.log(`${section} percentage:`, calculateSectionPercentage(section));
  });

  // Get background color class based on percentage
  const getBackgroundColorClass = (percentage) => {
    if (percentage <= 25) {
      return 'bg-green-200';  // Light green for minimal changes (0-25%)
    } else if (percentage <= 70) {
      return 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400';  // Yellow gradient for moderate changes (26-70%)
    } else {
      return 'bg-red-200';  // Light red for significant changes (71-100%)
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg border-2 border-blue-300">
      {/* Back button */}
      <button 
        onClick={onBack}
        className="mb-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 flex items-center"
        aria-label="Tilbage til liste"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Tilbage til liste
      </button>

      {/* Report header */}
          <div className="flex justify-between items-start mb-6">
              {/* skal udkommenteres igen*/}

        {/*<div>*/}
        {/*  <h2 className="text-xl font-semibold mb-2">{formatReferatTitle(report, referats)}</h2>*/}
        {/*  <div className="flex gap-4 text-sm text-gray-600">*/}
        {/*    <div className="flex items-center gap-1">*/}
        {/*      <User className="h-4 w-4" />*/}
        {/*      <span>Medlem:</span>*/}
        {/*      <span className="font-medium">{report.cpr_nr}</span>*/}
        {/*    </div>*/}
        {/*    <div className="flex items-center gap-1">*/}
        {/*      <UserCircle className="h-4 w-4" />*/}
        {/*      <span>Sagsbehandler:</span>*/}
        {/*      <span className="font-medium">{report.reg_init}</span>*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*</div>*/}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{new Date(report.reg_tid).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{formatTimeAgo(report.reg_tid)}</span>
          </div>
          <FeedbackIcon feedback={report.feedback} />
        </div>
      </div>

      {/* View mode controls */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          {viewModeButtons.map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => onTextViewModeChange(mode)}
              className={`px-3 py-1 rounded ${
                textViewMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={onToggleColorLegend}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
          aria-label="Vis farvekoder"
        >
          <Info className="h-4 w-4" />
          <span>Vis farvekoder</span>
        </button>
      </div>

      {/* Color legend */}
      {showColorLegend && <ColorLegend onClose={onToggleColorLegend} />}

      {/* Report sections */}
      <div className="space-y-4">
        {sections.map(section => (
          <div 
            key={section} 
            className={`border rounded-lg ${activeFilters.section === section ? 'bg-blue-50' : 'bg-white'}`}
          >
            {(() => {
              const percentage = calculateSectionPercentage(section);
              const bgColorClass = getBackgroundColorClass(percentage);
              const style = percentage > 25 && percentage <= 70 
                ? { background: 'linear-gradient(to right, #facc15, #eab308, #facc15)' }
                : {};
              
              return (
                <button 
                  onClick={() => onToggleSection(section)}
                  className={`flex items-center justify-between w-full text-left font-medium p-4 focus:outline-none ${bgColorClass}`}
                  style={style}
                  aria-expanded={openSections[section]}
                >
                  <div className="flex items-center gap-2">
                    <span>{sectionTitles[section]}</span>
                    <span className="text-sm">({percentage}%)</span>
                  </div>
                  {openSections[section] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
              );
            })()}
            {openSections[section] && (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg border p-4">
                    <h4 className="font-medium mb-2 text-gray-700">AI-genereret tekst:</h4>
                    <div className="pl-4 space-y-1 text-gray-600">
                      {aiParsedReferat[section].map((line, idx) => (
                        <div key={idx}>{line}</div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border p-4">
                    <h4 className="font-medium mb-2 text-gray-700">Redigeret tekst:</h4>
                    <div className="pl-4">
                      {compareTexts(
                        aiParsedReferat[section].join('\n'),
                        humanParsedReferat[section].join('\n'),
                        textViewMode
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Additional sections (original AI text and feedback) */}
      <div className="mt-8 space-y-4">
        {/* Original AI text section */}
        <div className="bg-white rounded-lg border">
          <button 
            onClick={() => onToggleExpanded('originalAI')}
            className="flex items-center justify-between w-full text-left font-medium p-4 focus:outline-none"
            aria-expanded={expandedSections.originalAI}
          >
            <span>Original AI-genereret referat</span>
            {expandedSections.originalAI ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          {expandedSections.originalAI && (
            <div className="px-4 pb-4">
              <div className="bg-gray-50 p-4 rounded whitespace-pre-wrap text-gray-600">
                {report.aiReferat}
              </div>
            </div>
          )}
        </div>

        {/* Feedback section */}
        <div className="bg-white rounded-lg border">
          <button 
            onClick={() => onToggleExpanded('feedback')}
            className="flex items-center justify-between w-full text-left font-medium p-4 focus:outline-none"
            aria-expanded={expandedSections.feedback}
          >
            <span>Feedback</span>
            {expandedSections.feedback ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          {expandedSections.feedback && (
            <div className="px-4 pb-4">
              <div className="bg-gray-50 p-4 rounded text-gray-600">
                {report.feedback_beskrivelse || 'Ingen feedback tilgængelig'}
              </div>
              <div className="mt-4 bg-gray-50 p-4 rounded text-gray-600">
                <div className="font-medium mb-2">Regenerer dato:</div>
                {report.regenerer_dato ? new Date(report.regenerer_dato).toLocaleString() : 'Ikke tilgængelig'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportDetail;
