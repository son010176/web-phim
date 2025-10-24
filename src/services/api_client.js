// src/services/api_client.js (File mới)

import { auth } from '../firebase';

// URL của API Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbyU2ieJmUVhvXK7TuVoHs_CM3QoA6_fstXtfnvOIt_JgYRYnZMKkfNvQ2Y-YIjB5o3pZg/exec";
const APP_CACHE_KEY = 'myAppSearchCache';

/**
 * Hàm chung để xử lý các yêu cầu POST đến Apps Script.
 * @param {string} action - Tên hành động (ví dụ: 'addMovie').
 * @param {object} payload - Dữ liệu cần gửi đi.
 */
const fetchPostData = async (action, payload) => {
  try {
    const user = auth.currentUser;
    let token = null;

    if (user) {
      token = await user.getIdToken(true);
    } else {
      throw new Error("Bạn cần đăng nhập để thực hiện hành động này.");
    }
    
    const requestBody = { action, payload, token };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      redirect: 'follow'
    }); 

    const result = await response.json(); 
    if (result.status === 'success' || result.status === 'info') {
      return result; 
    } else {
      throw new Error(result.message || 'Lỗi không xác định từ API');
    }
  } catch (error) {
    console.error(`Lỗi POST action "${action}":`, error);
    throw error;
  }
};

/**
 * Hàm chung để xử lý các yêu cầu GET và trả về dữ liệu JSON.
 * @param {string} queryString - Chuỗi truy vấn cho URL (ví dụ: '?action=getAllMovies').
 * @returns {Promise<any>} - Dữ liệu JSON từ API.
 */
const fetchGetData = async (queryString) => {
  try {
    const response = await fetch(`${API_URL}${queryString}`);
    if (!response.ok) {
      throw new Error(`Lỗi mạng: ${response.statusText}`);
    }
    const result = await response.json();
    if (result.status === 'success') {
      return result.data;
    } else {
      throw new Error(`Lỗi từ API: ${result.message}`);
    }
  } catch (error) {
    console.error(`Lỗi khi thực hiện yêu cầu GET (${queryString}):`, error);
    return []; 
  }
};

/**
 * --- HÀM 1: TẢI CACHE TỪ LOCALSTORAGE ---
 * (Giữ nguyên logic của bạn)
 */
export const loadCacheFromStorage = (maxAgeInHours = 24) => {
  try {
    const storedCache = localStorage.getItem(APP_CACHE_KEY);
    if (!storedCache) {
      console.log("🔍 Không tìm thấy cache trong localStorage.");
      return null;
    }

    const { timestamp, data } = JSON.parse(storedCache);
    const now = new Date().getTime();
    const maxAgeInMs = maxAgeInHours * 60 * 60 * 1000;

    if (now - timestamp < maxAgeInMs) {
      // Cache hợp lệ
      console.log("👍 Tải cache thành công từ localStorage.");
      return data;
    } else {
      // Cache hết hạn
      console.log("⌛ Cache đã hết hạn. Cần tải lại.");
      localStorage.removeItem(APP_CACHE_KEY); // Xóa cache cũ
      return null;
    }
  } catch (error) {
    console.warn("⚠️ Lỗi khi đọc localStorage (dữ liệu có thể bị hỏng):", error);
    localStorage.removeItem(APP_CACHE_KEY); // Xóa nếu bị lỗi
    return null;
  }
};

/**
 * --- HÀM 2: HÀM MỚI ĐỂ LƯU CACHE ---
 * (Đã được tách ra theo yêu cầu của bạn)
 */
export const saveCacheToStorage = (cacheData) => {
  if (!cacheData || !cacheData.movies || cacheData.movies.length === 0) {
    console.warn("⚠️ Dữ liệu cache rỗng (hoặc không có phim), không lưu vào localStorage.");
    return;
  }
  
  try {
    const dataToStore = {
      timestamp: new Date().getTime(), // Thêm dấu thời gian
      data: cacheData // Lưu toàn bộ object { movies, actors, ... }
    };
    localStorage.setItem(APP_CACHE_KEY, JSON.stringify(dataToStore));
    console.log("💾 Đã lưu cache vào localStorage.");
  } catch (storageError) {
    console.warn("⚠️ Không thể lưu vào localStorage (có thể do đầy):", storageError);
  }
};


/**
 * --- HÀM 3: TẢI DỮ LIỆU TỪ APPS SCRIPT ---
 * (Đã thêm log chi tiết và xóa logic tự lưu)
 */
export const fetchAllDataForSearchCache = async () => {
  console.log("⏳ Bắt đầu tải dữ liệu (App Script) cho bộ đệm tìm kiếm...");
  
  try {
    // 1. Gọi hàm gộp của bạn
    const cacheData = await fetchGetData('?action=fetchAllDataForSearchCache');
    
    // --- LOG LỖI CHI TIẾT ---
    if (!cacheData) {
      throw new Error("Apps Script không trả về dữ liệu (null hoặc undefined).");
    }

    let hasCriticalError = false;

    // Kiểm tra Movies (quan trọng nhất)
    if (!cacheData.movies || !Array.isArray(cacheData.movies)) {
      console.error("❌ Lỗi Dữ Liệu: 'movies' bị thiếu hoặc không phải là mảng.");
      hasCriticalError = true;
    } else if (cacheData.movies.length === 0) {
      console.warn("⚠️ Cảnh báo Dữ Liệu: 'movies' là mảng rỗng.");
    } else {
      console.log(`✅ Tải xong ${cacheData.movies.length} phim.`);
    }

    // Kiểm tra Actors
    if (!cacheData.actors || !Array.isArray(cacheData.actors)) {
      console.warn("⚠️ Cảnh báo Dữ Liệu: 'actors' bị thiếu hoặc không phải là mảng.");
    } else {
      console.log(`✅ Tải xong ${cacheData.actors.length} diễn viên.`);
    }

    // Kiểm tra Couples
    if (!cacheData.couples || !Array.isArray(cacheData.couples)) {
      console.warn("⚠️ Cảnh báo Dữ Liệu: 'couples' bị thiếu hoặc không phải là mảng.");
    } else {
      console.log(`✅ Tải xong ${cacheData.couples.length} couples.`);
    }

    // Kiểm tra Storylines
    if (!cacheData.storylines || !Array.isArray(cacheData.storylines)) {
      console.warn("⚠️ Cảnh báo Dữ Liệu: 'storylines' bị thiếu hoặc không phải là mảng.");
    } else {
      console.log(`✅ Tải xong ${cacheData.storylines.length} storylines.`);
    }
    
    if (hasCriticalError) {
      throw new Error("Dữ liệu 'movies' không hợp lệ, hủy bỏ quá trình cache.");
    }
    // -------------------------

    console.log("✅ Dữ liệu (App Script) đã tải xong và có cấu trúc hợp lệ.");
    // 2. Chỉ trả về dữ liệu, KHÔNG TỰ LƯU
    return cacheData;

  } catch (error) {
    console.error("❌ Lỗi nghiêm trọng khi tải dữ liệu (App Script):", error);
    // Trả về cấu trúc rỗng để ứng dụng không bị crash
    return { movies: [], actors: [], couples: [], storylines: [] };
  }
};

/**
 * [FALLBACK] Lấy TẤT CẢ phim từ App Script.
 */
export const getAllMovies_AppScript = () => fetchGetData('?action=getAllMovies');

// Lấy danh sách tất cả diễn viên
export const getAllActors_AppScript = () => fetchGetData('?action=getAllActors');

// Lấy danh sách các phim đang chờ xử lý
export const getPendingMovies_AppScript = () => fetchGetData('?action=getPendingMovies');

// Lấy thông tin profile chi tiết của một diễn viên
export const getActorProfile_AppScript = (slug) => fetchGetData(`?action=getActorProfile&slug=${slug}`);

// Lấy danh sách tất cả phim theo các cặp đôi diễn viên
export const getMovieCouples_AppScript = () => fetchGetData('?action=getMovieCouples');

// Lấy danh sách TẤT CẢ các cặp đôi (kèm phim)
export const getAllMovieCouples_AppScript = () => fetchGetData('?action=getAllMovieCouples');

// Lấy danh sách phim cùng cốt truyện
export const getMoviesByStoryline_AppScript = () => fetchGetData('?action=getMoviesByStoryline');

// Lấy bộ sưu tập phim của người dùng
export const getCollection_AppScript = () => fetchGetData('?action=getCollection');

// Thêm phim vào bộ sưu tập
export const addToCollection_AppScript = (movieData) => fetchPostData('addToCollection', movieData);

// Xóa phim khỏi bộ sưu tập
export const removeFromCollection_AppScript = (movieId) => fetchPostData('removeFromCollection', { id: movieId });

// --- CÁC HÀM POST DỮ LIỆU (CHO TRANG ADMIN) ---
export const addMovie_AppScript = (movieData) => fetchPostData('addMovie', movieData);
export const updateMovie_AppScript = (movieData) => fetchPostData('updateMovie', movieData);
export const deleteMovie_AppScript = (movieId) => fetchPostData('deleteMovie', { ID: movieId });