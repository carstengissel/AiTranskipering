import React from 'react';

const TimeScaleSelector = ({ value, onChange }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="ml-2 p-1 text-sm border rounded-md bg-white"
    >
      <option value="days">Dage</option>
      <option value="weeks">Uger</option>
      <option value="months">Måneder</option>
      <option value="quarters">Kvartaler</option>
      <option value="years">År</option>
    </select>
  );
};

export default TimeScaleSelector;
