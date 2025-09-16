import React, { useState, useRef, useEffect } from 'react';

const DatePicker = ({ selectedDate, onDateChange, viewType = 'month', label = 'Select Date' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const dropdownRef = useRef(null);

  // Format date based on view type
  const formatDate = (date) => {
    if (!date) return '';
    
    switch (viewType) {
      case 'month':
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      case 'quarter':
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `Q${quarter} ${date.getFullYear()}`;
      case 'year':
        return date.getFullYear().toString();
      default:
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
  };

  // Update input value when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      setInputValue(formatDate(selectedDate));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, viewType]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Generate options based on view type
  const generateOptions = () => {
    const options = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    switch (viewType) {
      case 'month':
        // Generate 24 months (12 past + current year)
        for (let yearOffset = -1; yearOffset <= 1; yearOffset++) {
          const year = currentYear + yearOffset;
          for (let month = 0; month < 12; month++) {
            const date = new Date(year, month, 1);
            options.push({
              value: date,
              label: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
              key: `${year}-${month}`
            });
          }
        }
        break;

      case 'quarter':
        // Generate 12 quarters (3 years)
        for (let yearOffset = -1; yearOffset <= 1; yearOffset++) {
          const year = currentYear + yearOffset;
          for (let quarter = 1; quarter <= 4; quarter++) {
            const monthStart = (quarter - 1) * 3;
            const date = new Date(year, monthStart, 1);
            options.push({
              value: date,
              label: `Q${quarter} ${year}`,
              key: `${year}-Q${quarter}`
            });
          }
        }
        break;

      case 'year':
        // Generate 5 years (2 past + current + 2 future)
        for (let yearOffset = -2; yearOffset <= 2; yearOffset++) {
          const year = currentYear + yearOffset;
          const date = new Date(year, 0, 1);
          options.push({
            value: date,
            label: year.toString(),
            key: year.toString()
          });
        }
        break;

      default:
        break;
    }

    return options;
  };

  const options = generateOptions();

  const handleOptionSelect = (option) => {
    onDateChange(option.value);
    setInputValue(option.label);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      // Try to parse the input value
      const parsedDate = new Date(inputValue);
      if (!isNaN(parsedDate.getTime())) {
        onDateChange(parsedDate);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setInputValue(formatDate(selectedDate));
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onClick={() => setIsOpen(!isOpen)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer bg-white"
          placeholder={`Select ${viewType}`}
          readOnly={false}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute inset-y-0 right-0 flex items-center pr-3"
        >
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map((option) => {
            const isSelected = selectedDate && 
              option.value.getFullYear() === selectedDate.getFullYear() && 
              option.value.getMonth() === selectedDate.getMonth();
            
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => handleOptionSelect(option)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors ${
                  isSelected
                    ? 'bg-blue-100 text-blue-800 font-medium'
                    : 'text-gray-700'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DatePicker;
