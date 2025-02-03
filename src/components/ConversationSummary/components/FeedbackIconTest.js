import React from 'react';
import FeedbackIcon from './FeedbackIcon';

const FeedbackIconTest = () => {
  const testCases = [
    { feedback: 1, label: 'Positive Feedback (1)' },
    { feedback: -1, label: 'Negative Feedback (-1)' },
    { feedback: 0, label: 'Neutral Feedback (0)' },
    { feedback: null, label: 'No Feedback (null)' },
    { feedback: undefined, label: 'Undefined Feedback' },
    { feedback: '1', label: 'String Positive ("1")' },
    { feedback: '-1', label: 'String Negative ("-1")' },
  ];

  return (
    <div className="p-4 bg-gray-100 rounded-lg mb-4">
      <h2 className="text-xl font-bold mb-4">FeedbackIcon Test Cases</h2>
      <div className="space-y-4">
        {testCases.map(({ feedback, label }) => {
          const feedbackValue = Number(feedback);
          const isPositive = feedbackValue === 1;
          const isNegative = feedbackValue === -1;

          return (
            <div key={label} className="flex items-center gap-4 p-2 bg-white border rounded">
              <div className="w-48 font-medium">{label}:</div>
              <div className="flex items-center gap-4">
                <FeedbackIcon feedback={feedback} />
                <span className="text-sm text-gray-500">
                  (value: {JSON.stringify(feedback)}, 
                  type: {typeof feedback}, 
                  converted: {feedbackValue}, 
                  isPositive: {String(isPositive)}, 
                  isNegative: {String(isNegative)})
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FeedbackIconTest;
