// src/services/api.js
import { auth } from '../firebase';
// Định nghĩa URL của API Google Apps Script ở một nơi duy nhất.
// const API_URL = "https://script.google.com/macros/s/AKfycbxQvRm7VwxKcjmciim8mdchDu7X-c4-ZeHpY6mKRPPLLxsPJhCkTgWoBNxPM-Pls7uV/exec";
const API_URL = "https://script.google.com/macros/s/AKfycbwof2iqWfeEnkEuAmP50MTtj4B_pO-Ks95slRXPY4B0QVZ5Dmlf2Ya5OHh81OdANKmFTg/exec";

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
    // Trả về một giá trị mặc định (ví dụ: mảng rỗng) để tránh làm sập ứng dụng
    return []; 
  }
};

/**
 * Hàm chung để xử lý các yêu cầu POST đến Apps Script.
 * @param {string} action - Tên hành động (ví dụ: 'addMovie').
 * @param {object} payload - Dữ liệu cần gửi đi.
 */
// --- HÀM POST ĐƯỢC SỬA LẠI HOÀN CHỈNH ---
const fetchPostData = async (action, payload) => {
  try {
    const user = auth.currentUser;
    let token = null;

    if (user) {
      token = await user.getIdToken(true); // Lấy "vé thông hành"
    } else {
      // Nếu không có người dùng, không gửi token và báo lỗi sớm
      throw new Error("Bạn cần đăng nhập để thực hiện hành động này.");
    }
    
    const requestBody = {
      action,
      payload,
      token // Gửi vé này trong body của yêu cầu
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      // XÓA BỎ: mode: "no-cors", 
      headers: {
        // Giữ nguyên header này
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      redirect: 'follow' // Thêm dòng này để xử lý chuyển hướng nếu có
    }); 

    // BỎ COMMENT VÀ SỬA LẠI: Xử lý response từ API
    const result = await response.json(); 
    if (result.status === 'success' || result.status === 'info') {
      // Chấp nhận cả status 'success' và 'info'
      return result; 
    } else {
      // Ném lỗi với message từ API để có thể debug
      throw new Error(result.message || 'Lỗi không xác định từ API');
    }
  } catch (error) {
    console.error(`Lỗi POST action "${action}":`, error);
    // Ném lại lỗi để component gọi nó có thể xử lý (ví dụ: hiển thị thông báo)
    throw error;
  }
};


// --- CÁC HÀM GET DỮ LIỆU ---

// Lấy danh sách tất cả phim
/**
 * Lấy danh sách phim. Có thể kèm theo query để tìm kiếm phía server.
 * @param {string} [query] - Từ khóa tìm kiếm.
 * @param {string} [scope] - Phạm vi tìm kiếm.
 * @returns {Promise<any>}
 */
export const getAllMovies = (query = '', scope = 'tenPhim') => {
  if (query) {
    // Nếu có query, gửi nó lên server
    return fetchGetData(`?action=getAllMovies&query=${encodeURIComponent(query)}&scope=${scope}`);
  }
  // Nếu không, chỉ lấy tất cả phim như cũ
  return fetchGetData('?action=getAllMovies');
};

// Lấy danh sách tất cả diễn viên
export const getAllActors = () => fetchGetData('?action=getAllActors');

// Lấy danh sách các phim đang chờ xử lý
export const getPendingMovies = () => fetchGetData('?action=getPendingMovies');

// Lấy thông tin profile chi tiết của một diễn viên
export const getActorProfile = (slug) => fetchGetData(`?action=getActorProfile&slug=${slug}`);

// Lấy danh sách tất cả phim theo các cặp đôi diễn viên
export const getMovieCouples = () => fetchGetData('?action=getMovieCouples');

// Lấy danh sách TẤT CẢ các cặp đôi (không kèm phim)
export const getAllMovieCouples = () => fetchGetData('?action=getAllMovieCouples');

// Lấy danh sách phim cùng cốt truyện
export const getMoviesByStoryline = () => fetchGetData('?action=getMoviesByStoryline');

// Lấy bộ sưu tập phim của người dùng
export const getCollection = () => fetchGetData('?action=getCollection');

// Thêm phim vào bộ sưu tập
export const addToCollection = (movieData) => fetchPostData('addToCollection', movieData);

// Xóa phim khỏi bộ sưu tập
export const removeFromCollection = (movieId) => fetchPostData('removeFromCollection', { id: movieId });


// --- CÁC HÀM POST DỮ LIỆU (CHO TRANG ADMIN) ---

// Thêm một phim mới
export const addMovie = (movieData) => fetchPostData('addMovie', movieData);

// Cập nhật thông tin một phim
export const updateMovie = (movieData) => fetchPostData('updateMovie', movieData);

// Xóa một phim dựa trên ID
export const deleteMovie = (movieId) => fetchPostData('deleteMovie', { ID: movieId });