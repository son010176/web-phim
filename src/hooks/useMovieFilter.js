// src/hooks/useMovieFilter.js (Đã sửa logic sắp xếp genres)

import { useState, useMemo, useCallback } from 'react';

export function useMovieFilter(allMovies) {
  const [selectedGenres, setSelectedGenres] = useState(['Tất cả']);
  const [sortOrder, setSortOrder] = useState('default');

  const handleGenreToggle = useCallback((genre) => {
    setSelectedGenres(prevSelected => {
      if (genre === 'Tất cả') return ['Tất cả'];
      
      let newSelection = prevSelected.filter(g => g !== 'Tất cả');

      if (newSelection.includes(genre)) {
        newSelection = newSelection.filter(g => g !== genre);
      } else {
        newSelection.push(genre);
      }

      if (newSelection.length === 0) return ['Tất cả'];
      
      return newSelection;
    });
  }, []);

  const handleSortChange = useCallback((order) => {
    setSortOrder(order);
  }, []);

  const uniqueGenres = useMemo(() => {
    const genres = new Set();
    allMovies.forEach(movie => {
      if (movie.theLoai) {
        movie.theLoai.split(/[.,]/).forEach(g => {
          const trimmed = g.trim();
          if (trimmed) genres.add(trimmed);
        });
      }
    });
    
    // --- SỬA Ở ĐÂY ---
    // Sắp xếp mảng theo chuẩn tiếng Việt ('vi')
    // Điều này đảm bảo 'Đ' đứng sau 'D', và số '1v4' đứng trước 'A'
    // (Lưu ý: Logic ở DropdownFilter sẽ tách số/ký tự đặc biệt ra sau)
    return Array.from(genres).sort((a, b) => a.localeCompare(b, 'vi'));
    // --- KẾT THÚC SỬA ---

  }, [allMovies]);

  // --- LOGIC LỌC (Giữ nguyên) ---
  const filteredMovies = useMemo(() => {
    if (selectedGenres.length === 0 || selectedGenres.includes('Tất cả')) {
      return allMovies;
    }
    return allMovies.filter(movie => {
      if (!movie.theLoai) {
        return false; 
      }
      const movieTags = movie.theLoai.split(/[.,]/)
                             .map(tag => tag.trim())
                             .filter(tag => tag.length > 0);
      return selectedGenres.some(selectedTag => movieTags.includes(selectedTag));
    });
  }, [selectedGenres, allMovies]);

  // --- LOGIC SẮP XẾP (Giữ nguyên) ---
  const sortedAndFilteredMovies = useMemo(() => {
    const moviesToSort = [...filteredMovies];
    if (sortOrder === 'az') {
      return moviesToSort.sort((a, b) => a.tenViet.localeCompare(b.tenViet, 'vi'));
    }
    if (sortOrder === 'za') {
      return moviesToSort.sort((a, b) => b.tenViet.localeCompare(a.tenViet, 'vi'));
    }
    return filteredMovies;
  }, [sortOrder, filteredMovies]);


  // Trả về tất cả những gì component khác cần dùng
  return {
    displayMovies: sortedAndFilteredMovies, 
    uniqueGenres,
    selectedGenres,
    handleGenreToggle,
    sortOrder,         
    handleSortChange   
  };
}