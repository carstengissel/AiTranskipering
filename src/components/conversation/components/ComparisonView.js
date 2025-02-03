import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { compareTexts, getDiffCounts, getTotalChanges, levenshteinDistance } from '../utils/comparisonUtils';
import { sectionNames } from '../utils/parseUtils';

const ComparisonView = ({ 
  section, 
  aiText, 
  humanText, 
  isOpen, 
  onToggle,
  isHighlighted 
}) => {
  // Split texts into words and calculate word-level changes
  const aiWords = aiText.trim().split(/\s+/).filter(word => word.length > 0);
  const humanWords = humanText.trim().split(/\s+/).filter(word => word.length > 0);
  
  let changes = 0;
  let i = 0;
  let j = 0;
  
  // Use Levenshtein distance for word comparison
  const wordSimilarity = (word1, word2) => {
    const maxLength = Math.max(word1.length, word2.length);
    const distance = levenshteinDistance(word1, word2);
    return (maxLength - distance) / maxLength;
  };
  
  while (i < humanWords.length || j < aiWords.length) {
    if (i >= humanWords.length) {
      changes += aiWords.length - j;
      break;
    }
    if (j >= aiWords.length) {
      changes += humanWords.length - i;
      break;
    }
    
    // Compare words with similarity threshold
    const similarity = wordSimilarity(humanWords[i], aiWords[j]);
    if (similarity < 0.8) { // If words are less than 80% similar, count as change
      changes++;
    }
    i++;
    j++;
  }
  
  // Calculate percentage based on total words and apply scaling
  const totalWords = humanWords.length;
  const changePercentage = Math.min(100, Math.round((changes / (totalWords || 1)) * 100));

  return (
    <div className={`border rounded-lg ${isHighlighted ? 'bg-blue-50' : ''}`}>
      <button 
        onClick={onToggle}
        className={`flex items-center justify-between w-full text-left p-4 focus:outline-none ${
          !isOpen ? `${
            changePercentage <= 25 ? 'bg-green-400' :
            changePercentage <= 70 ? 'bg-yellow-400' :
            'bg-red-400'
          } text-white rounded-lg` : ''
        }`}
      >
        <div className="flex items-center gap-4">
          <span className="font-medium">{sectionNames[section]}</span>
          {!isOpen && (
            <span className="text-sm">
              {changePercentage}% ændret
            </span>
          )}
        </div>
        {isOpen ? 
          <ChevronUp className="h-5 w-5" /> : 
          <ChevronDown className={`h-5 w-5 ${!isOpen ? 'text-white' : ''}`} />}
      </button>
      {isOpen && (
        <div className="p-4">
          <h3 className="font-medium mb-2">Sammenligning:</h3>
          <div className="bg-gray-100 p-2 rounded mb-2">
            <div className="mb-2">
              <strong>AI-genereret tekst:</strong>
              <div className="pl-4">{aiText}</div>
            </div>
            <div>
              <strong>Redigeret tekst:</strong>
              <div className="pl-4">
                {compareTexts(aiText, humanText)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparisonView;
