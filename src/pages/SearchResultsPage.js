// src/pages/SearchResultsPage.js

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import MovieList from '../components/MovieList'; // THAY ĐỔI: Import MovieList thay vì Home

function SearchResultsPage({ allMovies }) {
  const [searchParams] = useSearchParams();
  const [filteredMovies, setFilteredMovies] = useState([]);
  
  const query = searchParams.get('q') || '';
  const scope = searchParams.get('scope') || 'tenPhim';

  useEffect(() => {
    if (query && allMovies.length > 0) {
      const lowerCaseQuery = query.toLowerCase();
      
      const results = allMovies.filter(movie => {
        if (scope === 'tenPhim') {
          return (movie.tenViet?.toLowerCase() || '').includes(lowerCaseQuery) || (movie.tenGoc?.toLowerCase() || '').includes(lowerCaseQuery);
        }
        if (scope === 'theLoai') {
          return (movie.theLoai?.toLowerCase() || '').includes(lowerCaseQuery);
        }
        return false;
      });
      setFilteredMovies(results);
    }
  }, [query, scope, allMovies]);

  return (
    <div className="main-content-section">
      <h3 className="section-title">Kết quả tìm kiếm cho "{query}"</h3>
      
      {/* THAY ĐỔI: Sử dụng trực tiếp MovieList */}
      <MovieList movies={filteredMovies} />
      
    </div>
  );
}

export default SearchResultsPage;