import React from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

/**
 * Component for displaying feedback status with thumbs up/down icons
 * - 1: Green thumbs up, gray thumbs down
 * - -1: Gray thumbs up, red thumbs down
 * - 0 or undefined: Both gray
 * 
 * @component
 * @param {Object} props
 * @param {number|string} props.feedback - The feedback value (1, -1, or 0)
 */
const FeedbackIcon = ({ feedback }) => {
  // Convert feedback to number and handle edge cases
  const feedbackValue = Number(feedback);
  const isPositive = feedbackValue === 1;
  const isNegative = feedbackValue === -1;

  console.log('FeedbackIcon render:', { feedback, feedbackValue, isPositive, isNegative });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <ThumbsUp 
        style={{ 
          width: '16px', 
          height: '16px',
          color: isPositive ? '#16a34a' : '#9ca3af',  // green-600 or gray-400
          fill: isPositive ? '#16a34a' : '#9ca3af'
        }}
      />
      <ThumbsDown 
        style={{ 
          width: '16px', 
          height: '16px',
          color: isNegative ? '#dc2626' : '#9ca3af',  // red-600 or gray-400
          fill: isNegative ? '#dc2626' : '#9ca3af'
        }}
      />
    </div>
  );
};

export default FeedbackIcon;
