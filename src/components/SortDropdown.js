// src/components/SortDropdown.js (Đã đổi tên class)

import React, { useState, useEffect, useRef } from 'react';
import './SortDropdown.css'; // SỬA: Import file CSS riêng
import { ReactComponent as SortIcon } from '../assets/icons/sort-solid-full.svg'; 
import { ReactComponent as ChevronIcon } from '../assets/icons/chevron-down-solid-full.svg';
import { ReactComponent as SortIconAZ } from '../assets/icons/arrow-down-a-z-solid-full.svg';
import { ReactComponent as SortIconZA } from '../assets/icons/arrow-down-z-a-solid-full.svg';

const sortOptions = {
  default: 'Mặc định',
  az: 'Tên A-Z',
  za: 'Tên Z-A',
};

const sortIcons = {
  default: <SortIcon />,
  az: <SortIconAZ />,
  za: <SortIconZA />,
};

function SortDropdown({ currentSortOrder, onSortChange, isDisabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    if (isDisabled) return;
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  useEffect(() => {
    if (isDisabled) {
      setIsOpen(false);
    }
  }, [isDisabled]);

  const handleOptionClick = (order) => {
    onSortChange(order);
    setIsOpen(false); 
  };

  return (
    // SỬA TÊN CLASS
    <div className="sort-dropdown" ref={dropdownRef}>
      <div 
        className={`sort-dropdown-display ${isDisabled ? 'disabled' : ''}`} 
        onClick={toggleDropdown}
      >
        <SortIcon className="sort-dropdown-icon" />
        <span className="sort-dropdown-label">Sắp xếp</span>
        <span className="sort-dropdown-selected-text">{sortOptions[currentSortOrder]}</span>
        <ChevronIcon className={`sort-dropdown-chevron ${isOpen ? 'expanded' : ''}`} />
      </div>

      {isOpen && (
        <div className="sort-dropdown-panel">
          <div className="sort-dropdown-options">
            {Object.entries(sortOptions).map(([key, value]) => (
              <button
                key={key}
                className={`sort-dropdown-button ${currentSortOrder === key ? 'active' : ''}`}
                onClick={() => handleOptionClick(key)}
              >
                <span className="sort-dropdown-icon-wrapper">{sortIcons[key]}</span>
                <span>{value}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SortDropdown;