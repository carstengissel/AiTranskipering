import { diffWords } from 'diff';
import React from 'react';

export const compareTexts = (text1, text2) => {
  try {
    const diff = diffWords(text1 || '', text2 || '');
    return diff.map((part, index) => (
      <span key={index} className={part.added ? 'bg-green-200' : part.removed ? 'bg-red-200' : ''}>
        {part.value}
      </span>
    ));
  } catch (error) {
    console.error('Error comparing texts:', error);
    return <span>{text2 || ''}</span>;
  }
};

/**
 * Get counts of additions and deletions between two texts
 * @param {string} text1 - Original text (AI-generated)
 * @param {string} text2 - Modified text (human-edited)
 * @returns {{ additions: number, deletions: number }}
 */
export const getDiffCounts = (text1, text2) => {
  try {
    const diff = diffWords(text1 || '', text2 || '');
    return diff.reduce(
      (counts, part) => ({
        additions: counts.additions + (part.added ? part.value.trim().split(/\s+/).filter(word => word.length > 0).length : 0),
        deletions: counts.deletions + (part.removed ? part.value.trim().split(/\s+/).filter(word => word.length > 0).length : 0),
      }),
      { additions: 0, deletions: 0 }
    );
  } catch (error) {
    console.error('Error getting diff counts:', error);
    return { additions: 0, deletions: 0 };
  }
};

/**
 * Get total number of changes (additions + deletions)
 * @param {{ additions: number, deletions: number }} counts
 * @returns {number}
 */
export const getTotalChanges = (counts) => {
  return counts.additions + counts.deletions;
};
