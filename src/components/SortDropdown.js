// src/components/SortDropdown.js (Đã thêm icon vào panel)

import React, { useState, useEffect, useRef } from 'react';
import './DropdownFilter.css'; // Tái sử dụng CSS
import { ReactComponent as SortIcon } from '../assets/icons/sort-solid-full.svg'; 
import { ReactComponent as ChevronIcon } from '../assets/icons/chevron-down-solid-full.svg';
import { ReactComponent as SortIconAZ } from '../assets/icons/arrow-down-a-z-solid-full.svg';
import { ReactComponent as SortIconZA } from '../assets/icons/arrow-down-z-a-solid-full.svg';

const sortOptions = {
  default: 'Mặc định',
  az: 'Tên A-Z',
  za: 'Tên Z-A',
};

// --- BƯỚC 1: TẠO MAP CHỨA ICON ---
// (Sử dụng các icon bạn đã import)
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
    <div className="dropdown-filter" ref={dropdownRef}>
      <div className={`dropdown-display ${isDisabled ? 'disabled' : ''}`} onClick={toggleDropdown}>
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
                {/* --- BƯỚC 2: THÊM ICON VÀO NÚT --- */}
                <span className="sort-icon-wrapper">{sortIcons[key]}</span>
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