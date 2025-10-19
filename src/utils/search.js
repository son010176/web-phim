// src/utils/search.js (Đã nâng cấp)

/**
 * Hàm điều phối chính cho việc tìm kiếm trực tiếp.
 * @param {string} query - Từ khóa tìm kiếm.
 * @param {string} scope - Phạm vi tìm kiếm.
 * @param {Array} allMovies - Mảng tất cả phim.
 * @param {Array} allActors - Mảng tất cả diễn viên.
 * @param {Array} allCouples - Mảng tất cả couple diễn viên.
 * @param {Array} allStorylines - Mảng tất cả couple phim (cốt truyện).
 * @returns {Array} - Mảng kết quả đã được lọc và thêm 'type'.
 */
export const performLiveSearch = (query, scope, allMovies, allActors, allCouples, allStorylines) => {
  const lowerCaseQuery = query.toLowerCase();
  
  if (scope === 'dienVien') {
    return filterActors(allActors, lowerCaseQuery).map(actor => ({ 
      ...actor, 
      type: 'actor' 
    }));
  }

  // THÊM MỚI: Logic tìm kiếm Couple Diễn viên
  if (scope === 'coupleDienVien') {
    return filterGeneric(allCouples, lowerCaseQuery, 'tenCouple').map(couple => ({
      ...couple,
      type: 'couple'
    }));
  }

  // THÊM MỚI: Logic tìm kiếm Couple Phim
  if (scope === 'couplePhim') {
    return filterGeneric(allStorylines, lowerCaseQuery, 'tenCouple').map(storyline => ({
      ...storyline,
      type: 'storyline'
    }));
  }

  // Mặc định là tìm phim (không cần thay đổi)
  return filterMovies(allMovies, lowerCaseQuery, scope).map(movie => ({ 
    ...movie, 
    type: 'movie' 
  }));
};

/**
 * Lọc danh sách diễn viên.
 */
const filterActors = (actors, query) => {
  if (!actors) return [];
  return actors.filter(actor => 
    actor.ten?.toLowerCase().includes(query) || 
    actor.tenBinhAm?.toLowerCase().includes(query)
  );
};

/**
 * Lọc danh sách phim.
 */
const filterMovies = (movies, query, scope) => {
  if (!movies) return [];
  // ... (logic hàm này giữ nguyên)
  return movies.filter(movie => {
    if (scope === 'tenPhim') {
      const tenViet = movie.tenViet?.toLowerCase() || '';
      const tenGoc = movie.tenGoc?.toLowerCase() || '';
      return tenViet.includes(query) || tenGoc.includes(query);
    }
    if (scope === 'theLoai') {
      const theLoai = movie.theLoai?.toLowerCase() || '';
      return theLoai.includes(query);
    }
    return false;
  });
};

/**
 * THÊM MỚI: Hàm lọc chung cho Couple và Storyline
 * @param {Array} items - Mảng cần lọc (couples hoặc storylines).
 * @param {string} query - Từ khóa tìm kiếm.
 * @param {string} property - Tên thuộc tính cần tìm (ví dụ: 'tenCouple').
 * @returns {Array} - Mảng kết quả.
 */
const filterGeneric = (items, query, property) => {
  if (!items) return [];
  return items.filter(item => 
    item[property]?.toLowerCase().includes(query)
  );
};