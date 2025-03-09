# Card Section Comparison Documentation

This document explains the section comparison functionality implemented in the ReportDetail component.

## Overview

The section comparison system compares AI-generated text with human-edited text across four main sections:
- Vi har aftalt
- Vi har i dag talt om
- Din jobsøgning indtil nu
- Andet

## Comparison Methods

### 1. Text Comparison (compareTexts function)
- Uses `diffWords` library for word-level comparison
- Supports four view modes:
  - 'final': Shows only final (human-edited) text
  - 'removed': Shows only removed text (red background)
  - 'added': Shows only added text (green background)
  - 'all': Shows all changes with color coding
- Formats text to handle bullet points correctly

### 2. Change Percentage Calculation (calculateSectionPercentage function)
- Compares text at character level
- Implements a "forgiveness" mechanism that ignores small consecutive changes (<3 characters)
- Calculates percentage of changes and scales it down by 0.25
- Returns percentage between 0 and 100

## Visual Representation

### Background Colors
- 0-25%: Light green (minimal changes)
- 26-70%: Yellow gradient (moderate changes)
- 71-100%: Light red (significant changes)

### Text Highlighting
- Added text: Green background
- Removed text: Red background
- Unchanged text: No background

## Implementation Details

### Data Flow
1. Text is parsed into sections using parseReferat function
2. Each section is compared using calculateSectionPercentage
3. Changes are visualized using compareTexts with color coding
4. Percentage determines background color of section card

### Error Handling
- Empty text returns 0% change
- Handles different text lengths
- Properly formats bullet points
- Maintains text readability with whiteSpace: 'pre-wrap'

## Usage

The comparison system is used in the ReportDetail component to:
1. Show visual differences between AI and human text
2. Indicate the degree of changes through background colors
3. Allow users to view different aspects of changes (added, removed, all)
4. Provide a clear visual hierarchy of changes across sections
