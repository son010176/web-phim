// src/services/api.js

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
const fetchPostData = async (action, payload) => {
    try {
        // Apps Script Web App khi nhận POST thường cần được gọi với mode 'no-cors'
        // và không thể đọc response trực tiếp, nhưng request vẫn được xử lý.
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, payload }),
        });
        // Vì mode là 'no-cors', chúng ta không thể đọc response,
        // nên chỉ có thể giả định là thành công nếu không có lỗi mạng.
        return { status: 'success', message: `Yêu cầu "${action}" đã được gửi.` };
    } catch (error) {
        console.error(`Lỗi khi thực hiện yêu cầu POST (${action}):`, error);
        return { status: 'error', message: error.message };
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


// --- CÁC HÀM POST DỮ LIỆU (CHO TRANG ADMIN) ---

// Thêm một phim mới
export const addMovie = (movieData) => fetchPostData('addMovie', movieData);

// Cập nhật thông tin một phim
export const updateMovie = (movieData) => fetchPostData('updateMovie', movieData);

// Xóa một phim dựa trên ID
export const deleteMovie = (movieId) => fetchPostData('deleteMovie', { ID: movieId });