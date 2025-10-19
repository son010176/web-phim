// src/components/SortDropdown.js

import React, { useState, useEffect, useRef } from 'react';
import './DropdownFilter.css'; // Tái sử dụng CSS của DropdownFilter
import { ReactComponent as SortIcon } from '../assets/icons/sort-solid-full.svg'; // Cần có icon này
import { ReactComponent as ChevronIcon } from '../assets/icons/chevron-down-solid-full.svg';

const sortOptions = {
  default: 'Mặc định',
  az: 'Tên A-Z',
  za: 'Tên Z-A',
};

function SortDropdown({ currentSortOrder, onSortChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const handleOptionClick = (order) => {
    onSortChange(order);
    setIsOpen(false); // Tự động đóng dropdown sau khi chọn
  };

  return (
    <div className="dropdown-filter" ref={dropdownRef}>
      <div className="dropdown-display" onClick={toggleDropdown}>
        <SortIcon className="dropdown-icon" />
        <span className="dropdown-label">Sắp xếp:</span>
        <span className="dropdown-selected-text">{sortOptions[currentSortOrder]}</span>
        <ChevronIcon className={`dropdown-chevron ${isOpen ? 'expanded' : ''}`} />
      </div>

      {isOpen && (
        <div className="dropdown-panel">
          <div className="sort-options">
            {Object.entries(sortOptions).map(([key, value]) => (
              <button
                key={key}
                className={`sort-button ${currentSortOrder === key ? 'active' : ''}`}
                onClick={() => handleOptionClick(key)}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SortDropdown;