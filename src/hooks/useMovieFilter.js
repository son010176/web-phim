// src/hooks/useMovieFilter.js (Đã nâng cấp thêm Sắp xếp)

import { useState, useMemo, useCallback } from 'react';

export function useMovieFilter(allMovies) {
  const [selectedGenres, setSelectedGenres] = useState(['Tất cả']);
  // THÊM MỚI: State cho thứ tự sắp xếp (mặc định, a-z, z-a)
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

  // THÊM MỚI: Hàm để thay đổi trạng thái sắp xếp
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
    return Array.from(genres).sort();
  }, [allMovies]);

  const filteredMovies = useMemo(() => {
    if (selectedGenres.includes('Tất cả')) {
      return allMovies;
    }
    return allMovies.filter(movie => 
      selectedGenres.some(selectedGenre => 
        movie.theLoai && movie.theLoai.includes(selectedGenre)
      )
    );
  }, [selectedGenres, allMovies]);

  // THÊM MỚI: Sắp xếp danh sách phim đã được lọc
  const sortedAndFilteredMovies = useMemo(() => {
    // Tạo một bản sao để không thay đổi mảng gốc
    const moviesToSort = [...filteredMovies];

    if (sortOrder === 'az') {
      // Sắp xếp A-Z theo tên Việt, localeCompare xử lý tiếng Việt rất tốt
      return moviesToSort.sort((a, b) => a.tenViet.localeCompare(b.tenViet, 'vi'));
    }
    if (sortOrder === 'za') {
      // Sắp xếp Z-A
      return moviesToSort.sort((a, b) => b.tenViet.localeCompare(a.tenViet, 'vi'));
    }
    // Mặc định, trả về danh sách đã lọc
    return filteredMovies;
  }, [sortOrder, filteredMovies]);


  // Trả về tất cả những gì component khác cần dùng
  return {
    displayMovies: sortedAndFilteredMovies, // Đổi tên để rõ ràng hơn
    uniqueGenres,
    selectedGenres,
    handleGenreToggle,
    sortOrder,         // Trả về state sắp xếp
    handleSortChange   // Trả về hàm xử lý sắp xếp
  };
}