// src/components/DropdownFilter.js (Add panelWidth prop)

import React, { useState, useEffect, useRef, useMemo } from 'react';
import './DropdownFilter.css'; // Import file CSS riêng
import { ReactComponent as ChevronIcon } from '../assets/icons/chevron-down-solid-full.svg';
import { ReactComponent as FilterIcon } from '../assets/icons/filter-solid-full.svg';

// SỬA: Thêm prop panelWidth, default là 'auto'
function DropdownFilter({ genres, selectedGenres, onGenreToggle, isDisabled, groupByLetter = false, panelWidth = 'auto' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // --- Các hook useEffect và hàm toggleDropdown, displaySelected, groupedGenres (Giữ nguyên) ---
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  useEffect(() => {
    if (isDisabled) {
      setIsOpen(false);
    }
  }, [isDisabled]);

  const groupedGenres = useMemo(() => {
    // ... (logic tính toán groupedGenres giữ nguyên) ...
        const safeGenres = Array.isArray(genres) ? genres : [];

    const groups = {};
    const otherGroup = [];
    const latinAZRegex = /^[A-Z]$/;

    safeGenres.forEach(genre => {
      const firstChar = genre.charAt(0);
      const normalized = firstChar
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace('Đ', 'D')
        .replace('đ', 'd');

      const baseChar = normalized.charAt(0).toUpperCase();

      if (latinAZRegex.test(baseChar)) {
        if (!groups[baseChar]) {
          groups[baseChar] = [];
        }
        groups[baseChar].push(genre);
      } else {
        otherGroup.push(genre);
      }
    });

    const sortedKeys = Object.keys(groups).sort();

    return {
      sortedKeys,
      groups,
      otherGroup
    };
  }, [genres]);

  const { sortedKeys, groups, otherGroup } = groupedGenres;

  const displaySelected = () => {
    // ... (logic không đổi) ...
        if (!selectedGenres || selectedGenres.includes('Tất cả') || selectedGenres.length === 0) {
      return 'Tất cả';
    }
    if (selectedGenres.length === 1) {
      return selectedGenres[0];
    }
    return `${selectedGenres.length} thể loại`;
  };

  const allOptions = useMemo(() => ['Tất cả', ...(Array.isArray(genres) ? genres : [])], [genres]);

  return (
    <div className="filter-dropdown" ref={dropdownRef}>
      <div
        className={`filter-dropdown-display ${isDisabled ? 'disabled' : ''}`}
        onClick={toggleDropdown}
      >
        <FilterIcon className="filter-dropdown-icon" />
        <span className="filter-dropdown-label">Lọc theo</span>
        <span className="filter-dropdown-selected-text">{displaySelected()}</span>
        <ChevronIcon className={`filter-dropdown-chevron ${isOpen ? 'expanded' : ''}`} />
      </div>

      {isOpen && (
        // SỬA: Thêm style inline cho width
        <div
          className="filter-dropdown-panel"
          style={{ width: panelWidth }} // <-- Áp dụng width từ prop
        >
          {groupByLetter ? (
            // --- Render theo nhóm chữ cái (Giữ nguyên) ---
            <>
              {/* Nút "Tất cả" */}
              <div className="filter-dropdown-options-group">
                <div className="filter-dropdown-options">
                    <button
                      key="Tất cả"
                      className={`filter-dropdown-button ${selectedGenres.includes('Tất cả') ? 'active' : ''}`}
                      onClick={() => onGenreToggle('Tất cả')}
                    >
                      Tất cả
                    </button>
                </div>
              </div>
              {/* Các nhóm A-Z */}
              {sortedKeys.map(key => (
                  <div key={key} className="filter-dropdown-options-group">
                    <h4 className="filter-dropdown-group-heading">{key}</h4>
                    <div className="filter-dropdown-options">
                      {groups[key].map(genre => {
                        const isActive = selectedGenres.includes(genre);
                        return (
                          <button
                            key={genre}
                            className={`filter-dropdown-button ${isActive ? 'active' : ''}`}
                            onClick={() => onGenreToggle(genre)}
                          >
                            {genre}
                          </button>
                        );
                      })}
                    </div>
                  </div>
              ))}
              {/* Nhóm "Khác" */}
              {otherGroup.length > 0 && (
                  <div key="other" className="filter-dropdown-options-group">
                    <h4 className="filter-dropdown-group-heading">Khác</h4>
                    <div className="filter-dropdown-options">
                      {otherGroup.map(genre => {
                        const isActive = selectedGenres.includes(genre);
                        return (
                          <button
                            key={genre}
                            className={`filter-dropdown-button ${isActive ? 'active' : ''}`}
                            onClick={() => onGenreToggle(genre)}
                          >
                            {genre}
                          </button>
                        );
                      })}
                    </div>
                  </div>
              )}
            </>
          ) : (
            // --- Render danh sách đơn giản (Giữ nguyên) ---
            <div className="filter-dropdown-options">
              {allOptions.map(option => {
                const isActive = selectedGenres.includes(option);
                return (
                  <button
                    key={option}
                    className={`filter-dropdown-button ${isActive ? 'active' : ''}`}
                    onClick={() => onGenreToggle(option)}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DropdownFilter;