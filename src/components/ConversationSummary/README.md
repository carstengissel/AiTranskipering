# ConversationSummary Component Documentation

## Overview
This documentation explains the architecture and functionality of the ConversationSummary component system.

## Main Application Flow (ConversationSummaryApp.js)
- Acts as the main container and router
- Manages global state (selected report, view modes, sections)
- Uses URL parameters to handle filters (date, section, type)
- Renders either the list view or detail view based on state

## Data Fetching (useReferats.js)
Custom hook that handles all data operations:
- Fetches data from two possible endpoints:
  * `/api/samind_referat` (all reports)
  * `/api/referats/:date` (reports for specific date)
- Implements filtering logic:
  * Date filtering: Matches exact dates
  * Section filtering: Checks if section contains content
  * Type filtering: Matches conversation types
- Uses useRef to prevent infinite loops by comparing previous and current filters
- Returns `{ referats, loading, error }` for component use

## Utility Functions

### dateUtils.js
- `isSameDate()`: Compares two dates ignoring time
- `formatTimeAgo()`: Converts timestamps to readable format (e.g., "5 min siden")

### referatUtils.js
- `parseReferat()`: Splits report text into sections:
  * "Vi har aftalt"
  * "Vi har i dag talt om"
  * "Din jobsøgning indtil nu"
  * "Andet"
- `getSequenceNumberForDate()`: Numbers reports on same date
- `formatReferatTitle()`: Creates titles like "Referat 11.11.2024 - #1"

## Component Hierarchy

### ReportList.js
- Displays grid of report cards
- Each card shows:
  * Report title and date
  * Member and case worker info
  * Feedback status
  * Change indicator
- Handles navigation back to statistics

### ReportDetail.js
- Shows full report with sections
- Implements text comparison modes:
  * Final text
  * Removed text
  * Added text
  * All changes
- Uses diffWords to highlight changes
- Provides expandable sections for each part

### Supporting Components
- `FeedbackIcon.js`: Shows approval status (approved/rejected/pending)
- `ColorLegend.js`: Explains the color coding for text changes
- `ActiveFilters.js`: Displays and manages active filters

## Data Flow Example

### When opening the page:
1. ConversationSummaryApp checks URL for filters
2. useReferats hook fetches data based on filters
3. ReportList renders cards with fetched data

### When selecting a report:
1. handleSelectReport updates selectedReport state
2. ConversationSummaryApp switches to detail view
3. ReportDetail shows comparison between AI and edited versions

## Text Comparison
- Original AI text shown on left
- Edited text shown on right
- Changes highlighted using colors:
  * Green: Added text
  * Red: Removed text
  * No color: Unchanged text

## State Management
- URL parameters for filters (persistent across refreshes)
- React state for UI elements (sections, view modes)
- Axios for API communication
- Custom hook for data management

## Architecture Benefits
- Clear separation of concerns
- Efficient data fetching
- Maintainable code structure
- Smooth user experience
- Easy debugging with console logs

## Directory Structure
```
src/components/ConversationSummary/
├── components/
│   ├── ActiveFilters.js
│   ├── ColorLegend.js
│   ├── FeedbackIcon.js
│   ├── ReportDetail.js
│   └── ReportList.js
├── hooks/
│   └── useReferats.js
├── utils/
│   ├── dateUtils.js
│   └── referatUtils.js
└── README.md
