import React, { useState } from 'react';

const ProgressBar = ({ progress = 0, onChange, disabled = false }) => {
  const [value, setValue] = useState(progress);
  const [isDragging, setIsDragging] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // If this is just a display component with no onChange handler
  const isInteractive = !!onChange;

  const handleChange = (e) => {
    const newValue = parseInt(e.target.value, 10);
    setValue(newValue);
  };

  const handleMouseUp = () => {
    if (isDragging && isInteractive && !disabled) {
      onChange(value);
      setIsDragging(false);
    }
  };

  const handleMouseDown = () => {
    if (isInteractive && !disabled) {
      setIsDragging(true);
    }
  };

  // Handle tooltip display
  const handleMouseEnter = () => setShowTooltip(true);
  const handleMouseLeave = () => setShowTooltip(false);

  // Calculate progress bar color based on value
  const getProgressColor = () => {
    if (value < 30) return 'bg-red-500';
    if (value < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="w-full">
      {isInteractive ? (
        <div className="relative">
          <div className="flex items-center mb-2">
            <span className="text-sm font-medium mr-2">Progress:</span>
            <span 
              className={`text-sm font-bold px-2 py-0.5 rounded ${
                value < 30 ? 'bg-red-100 text-red-800' : 
                value < 70 ? 'bg-yellow-100 text-yellow-800' : 
                'bg-green-100 text-green-800'
              }`}
            >
              {value}%
            </span>
          </div>
          
          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              value={value}
              onChange={handleChange}
              onMouseUp={handleMouseUp}
              onMouseDown={handleMouseDown}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              disabled={disabled}
              className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${
                disabled ? 'opacity-60 cursor-not-allowed' : ''
              }`}
              style={{
                background: `linear-gradient(to right, ${
                  value < 30 ? '#ef4444' : value < 70 ? '#eab308' : '#22c55e'
                } 0%, ${
                  value < 30 ? '#ef4444' : value < 70 ? '#eab308' : '#22c55e'
                } ${value}%, #e5e7eb ${value}%, #e5e7eb 100%)`
              }}
            />
            
            {showTooltip && isInteractive && !disabled && (
              <div 
                className="absolute -top-10 px-2 py-1 bg-gray-800 text-white text-xs rounded transform -translate-x-1/2 pointer-events-none"
                style={{ left: `${value}%` }}
              >
                {value}%
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs font-medium text-gray-700">Progress: {progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full ${getProgressColor()}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {isInteractive && !disabled && (
        <div className="flex justify-between mt-1.5 text-xs text-gray-500">
          <span>Not Started</span>
          <span>In Progress</span>
          <span>Complete</span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;