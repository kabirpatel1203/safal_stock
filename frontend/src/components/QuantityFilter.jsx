import { useState, useRef, useEffect } from 'react';

const quantityRanges = [
  { label: 'All', value: '', min: null, max: null },
  { label: '0-10', value: '0-10', min: 0, max: 10 },
  { label: '10-20', value: '10-20', min: 10, max: 20 },
  { label: '20-30', value: '20-30', min: 20, max: 30 },
  { label: '30-50', value: '30-50', min: 30, max: 50 },
  { label: '50-100', value: '50-100', min: 50, max: 100 },
  { label: '100+', value: '100+', min: 100, max: null },
];

const QuantityFilter = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentRange = quantityRanges.find(r => r.value === value) || quantityRanges[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (range) => {
    onChange(range.value, range.min, range.max);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:border-gray-400 transition-colors min-w-[100px]"
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        <span className="text-sm font-medium text-gray-700">
          {currentRange.label === 'All' ? 'Qty' : currentRange.label}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[120px] overflow-hidden">
          {quantityRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => handleSelect(range)}
              className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors ${
                value === range.value ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-700'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuantityFilter;
