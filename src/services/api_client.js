// src/services/api_client.js (Cập nhật 2 Key Cache)

import { auth } from '../firebase';
import { openDB } from 'idb';

const API_URL = "https://script.google.com/macros/s/AKfycbyU2ieJmUVhvXK7TuVoHs_CM3QoA6_fstXtfnvOIt_JgYRYnZMKkfNvQ2Y-YIjB5o3pZg/exec";

// --- CẤU HÌNH INDEXEDDB (2 KEYS) ---
const DB_NAME = 'WebAppCacheDB';
const DB_VERSION = 2;
const STORE_NAME = 'appCache'; // Tên chung cho store
const CACHE_KEY_FULL = 'fullCacheData'; // Key cho dữ liệu đầy đủ
const CACHE_KEY_SEARCH = 'searchCacheData'; // Key cho dữ liệu search

// --- HÀM HELPER CHO INDEXEDDB (CẬP NHẬT) ---
async function openCacheDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
        console.log(`IndexedDB: Đã tạo object store '${STORE_NAME}'.`);
      }
    },
  });
}

/**
 * --- HÀM 1 (SỬA): TẢI CACHE TỪ INDEXEDDB (THEO KEY) ---
 * @param {string} cacheKey - Key cần tải (CACHE_KEY_FULL hoặc CACHE_KEY_SEARCH).
 * @param {number} maxAgeInHours - Thời gian cache tối đa (giờ).
 * @returns {Promise<object|null>}
 */
export const loadCacheFromDB = async (cacheKey, maxAgeInHours = 24) => {
  try {
    const db = await openCacheDB();
    const storedData = await db.get(STORE_NAME, cacheKey);

    if (!storedData) {
      console.log(`🔍 IndexedDB: Không tìm thấy cache cho key '${cacheKey}'.`);
      return null;
    }

    const { timestamp, data } = storedData;
    const now = new Date().getTime();
    const maxAgeInMs = maxAgeInHours * 60 * 60 * 1000;

    if (now - timestamp < maxAgeInMs) {
      console.log(`👍 IndexedDB: Tải cache '${cacheKey}' thành công.`);
      return data;
    } else {
      console.log(`⌛ IndexedDB: Cache '${cacheKey}' đã hết hạn.`);
      await db.delete(STORE_NAME, cacheKey);
      return null;
    }
  } catch (error) {
    console.warn(`⚠️ IndexedDB: Lỗi khi đọc cache '${cacheKey}':`, error);
    try {
      const db = await openCacheDB();
      await db.delete(STORE_NAME, cacheKey);
    } catch (deleteError) {
      // Bỏ qua lỗi xóa
    }
    return null;
  }
};

/**
 * --- HÀM 2 (SỬA): LƯU CACHE VÀO INDEXEDDB (THEO KEY) ---
 * @param {string} cacheKey - Key cần lưu (CACHE_KEY_FULL hoặc CACHE_KEY_SEARCH).
 * @param {object} cacheData - Dữ liệu cần lưu.
 */
export const saveCacheToDB = async (cacheKey, cacheData) => {
  if (!cacheData) {
    console.warn(`⚠️ Dữ liệu cache '${cacheKey}' rỗng, không lưu.`);
    return;
  }

  try {
    const db = await openCacheDB();
    const dataToStore = {
      timestamp: new Date().getTime(),
      data: cacheData,
    };
    await db.put(STORE_NAME, dataToStore, cacheKey);
    console.log(`💾 IndexedDB: Đã lưu cache '${cacheKey}'.`);
  } catch (error) {
    console.warn(`⚠️ IndexedDB: Không thể lưu cache '${cacheKey}':`, error);
  }
};

// --- CÁC HÀM API HIỆN TẠI (Giữ nguyên) ---

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

// --- HÀM API APPS SCRIPT (CẬP NHẬT TÊN VÀ THÊM MỚI) ---

/**
 * --- HÀM MỚI: TẢI DỮ LIỆU NHẸ CHO TÌM KIẾM ---
 */
export const getDataSearch = async () => {
  console.log("⏳ Gọi API getDataSearch (Apps Script)...");
  try {
    // Giả sử file cache.gs của bạn đã có action='getDataSearch'
    const searchData = await fetchGetData('?action=getDataSearch'); 
    if (!searchData || typeof searchData !== 'object') {
        throw new Error("API getDataSearch không trả về object hợp lệ.");
    }
    if (!searchData.movies || !searchData.actors) {
        console.warn("⚠️ Dữ liệu trả về từ getDataSearch thiếu key movies/actors.");
    }
    console.log("✅ API getDataSearch thành công.");
    return searchData;
  } catch (error) {
    console.error("❌ Lỗi khi gọi getDataSearch:", error);
    // Ném lỗi để App.js biết
    throw error;
  }
};


/**
 * --- HÀM 3: TẢI DỮ LIỆU TỪ APPS SCRIPT ---
 * (Giữ nguyên, không thay đổi)
 */
export const getDataFull = async () => { // Đổi tên từ fetchAllDataForSearchCache
  console.log("⏳ Gọi API getDataFull (Apps Script - dữ liệu đầy đủ)...");
  try {
    // Giả sử file cache.gs của bạn đã đổi tên hàm nhưng action vẫn là 'fetchAllDataForSearchCache'
    const fullData = await fetchGetData('?action=getDataFull'); 

    // --- LOG LỖI CHI TIẾT (Giữ nguyên) ---
    if (!fullData) throw new Error("API getDataFull không trả về dữ liệu.");
    let hasCriticalError = false;

    if (!fullData.movies || !Array.isArray(fullData.movies)) {
      console.error("❌ Lỗi Dữ Liệu: 'movies' bị thiếu hoặc không phải là mảng.");
      hasCriticalError = true;
    } else if (fullData.movies.length === 0) {
      console.warn("⚠️ Cảnh báo Dữ Liệu: 'movies' là mảng rỗng.");
    } else {
      console.log(`✅ Tải xong ${fullData.movies.length} phim.`);
    }

    if (!fullData.actors || !Array.isArray(fullData.actors)) {
      console.warn("⚠️ Cảnh báo Dữ Liệu: 'actors' bị thiếu hoặc không phải là mảng.");
    } else {
      console.log(`✅ Tải xong ${fullData.actors.length} diễn viên.`);
    }

    if (!fullData.couples || !Array.isArray(fullData.couples)) {
      console.warn("⚠️ Cảnh báo Dữ Liệu: 'couples' bị thiếu hoặc không phải là mảng.");
    } else {
      console.log(`✅ Tải xong ${fullData.couples.length} couples.`);
    }

    if (!fullData.storylines || !Array.isArray(fullData.storylines)) {
      console.warn("⚠️ Cảnh báo Dữ Liệu: 'storylines' bị thiếu hoặc không phải là mảng.");
    } else {
      console.log(`✅ Tải xong ${fullData.storylines.length} storylines.`);
    }

    if (hasCriticalError) {
      throw new Error("Dữ liệu 'movies' không hợp lệ, hủy bỏ quá trình cache.");
    }

    console.log("✅ API getDataFull thành công.");
    return fullData;

  } catch (error) {
    console.error("❌ Lỗi nghiêm trọng khi tải getDataFull:", error);
    return { movies: [], actors: [], couples: [], storylines: [] };
  }
};

// --- XUẤT CÁC KEY ---
export { CACHE_KEY_FULL, CACHE_KEY_SEARCH };

// --- CÁC HÀM API KHÁC (Giữ nguyên) ---
export const getAllMovies_AppScript = () => fetchGetData('?action=getAllMovies');
export const getAllActors_AppScript = () => fetchGetData('?action=getAllActors');
export const getPendingMovies_AppScript = () => fetchGetData('?action=getPendingMovies');
export const getActorProfile_AppScript = (slug) => fetchGetData(`?action=getActorProfile&slug=${slug}`);
export const getMovieCouples_AppScript = () => fetchGetData('?action=getMovieCouples');
export const getAllMovieCouples_AppScript = () => fetchGetData('?action=getAllMovieCouples');
export const getMoviesByStoryline_AppScript = () => fetchGetData('?action=getMoviesByStoryline');
export const getCollection_AppScript = () => fetchGetData('?action=getCollection');
export const addToCollection_AppScript = (movieData) => fetchPostData('addToCollection', movieData);
export const removeFromCollection_AppScript = (movieId) => fetchPostData('removeFromCollection', { id: movieId });
export const addMovie_AppScript = (movieData) => fetchPostData('addMovie', movieData);
export const updateMovie_AppScript = (movieData) => fetchPostData('updateMovie', movieData);
export const deleteMovie_AppScript = (movieId) => fetchPostData('deleteMovie', { ID: movieId });

// --- XÓA CÁC HÀM LOCALSTORAGE CŨ ---
// export const loadCacheFromStorage = ... (đã xóa)
// export const saveCacheToStorage = ... (đã xóa)