// src/hooks/useMovieFilter.js (Đã sửa logic lọc)

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
    return Array.from(genres).sort();
  }, [allMovies]);

  // --- LOGIC LỌC ĐÃ ĐƯỢC SỬA ---
  const filteredMovies = useMemo(() => {
    // 1. Nếu chọn 'Tất cả' hoặc không chọn gì, trả về tất cả phim
    if (selectedGenres.length === 0 || selectedGenres.includes('Tất cả')) {
      return allMovies;
    }

    // 2. Nếu có lọc, bắt đầu duyệt qua từng phim
    return allMovies.filter(movie => {
      // 3. Xử lý trường hợp phim không có thể loại
      if (!movie.theLoai) {
        return false; // Không có thể loại, không thể khớp -> ẩn
      }

      // 4. Tách các thẻ của phim ra thành một mảng
      // Ví dụ: "Hiện đại, Chênh lệch tuổi tác, HE"
      //       -> ["Hiện đại", "Chênh lệch tuổi tác", "HE"]
      const movieTags = movie.theLoai.split(/[.,]/)
                             .map(tag => tag.trim())
                             .filter(tag => tag.length > 0);
      
      // 5. Kiểm tra xem CÓ BẤT KỲ (some) thẻ nào người dùng chọn (selectedGenres)
      //    có nằm trong mảng thẻ của phim (movieTags) hay không.
      //    (Đây là logic "Hoặc" - chỉ cần khớp 1 thẻ là được)
      return selectedGenres.some(selectedTag => movieTags.includes(selectedTag));
    });
  }, [selectedGenres, allMovies]);
  // --- KẾT THÚC SỬA ---

  // Sắp xếp danh sách phim đã được lọc
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