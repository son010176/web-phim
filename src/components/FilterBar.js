// src/components/FilterBar.js (Đã sửa lỗi "not iterable")

import React from 'react';
import './FilterBar.css';

// THAY ĐỔI: Thêm `= []` để gán giá trị mặc định cho genres
function FilterBar({ genres = [], selectedGenres = [], onGenreToggle }) {
  // Dòng code này giờ đây sẽ luôn an toàn
  const allGenres = ['Tất cả', ...genres];
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <span className="filter-label">Thể loại:</span>
        <div className="filter-options">
          {allGenres.map(genre => {
            const isActive = selectedGenres.includes(genre);
            
            return (
              <button
                key={genre}
                className={`filter-button ${isActive ? 'active' : ''}`}
                onClick={() => onGenreToggle(genre)}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default FilterBar;