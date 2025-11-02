// src/services/api.js (Đã dọn dẹp và bổ sung)

// URL của API Cloudflare Worker

const API_URL_MOVIES = 'https://phim-ngan-web-api.phimngan.workers.dev/api/movies';
const API_URL_ACTORS = 'https://phim-ngan-web-api.phimngan.workers.dev/api/actors';
const API_URL_COUPLES = 'https://phim-ngan-web-api.phimngan.workers.dev/api/couples';
const API_URL_STORYLINES = 'https://phim-ngan-web-api.phimngan.workers.dev/api/storylines';
const API_URL_USERS = 'https://phim-ngan-web-api.phimngan.workers.dev/api/users';

// --- THÊM MỘT BIẾN BASE URL ---
const API_URL_BASE = 'https://phim-ngan-web-api.phimngan.workers.dev/api';

// --- HÀM HELPER CHUNG (MỚI) ---
/**
 * Xử lý phản hồi API chung
 * @param {Response} response - Phản hồi từ fetch
 * @param {string} context - Tên hàm (để log lỗi)
 * @returns {Promise<any>} - Dữ liệu data
 */
const handleResponse = async (response, context) => {
  if (!response.ok) {
    console.log(response);
    if (context === 'ActorProfile') {
      throw new Error(`Không tìm thấy thông tin diễn viên`);
    } else {
      throw new Error(`Lỗi mạng từ API Worker (${context}): ${response.status}`);
    }
  }
  const result = await response.json();
  if (result.status === 'success') {
    console.log(`✅ API Worker (${context}) phản hồi thành công.`, result.data);
    return result.data; // Trả về { ...data }
  } else {
    throw new Error(`Lỗi logic từ API Worker (${context}): ${result.message}`);
  }
};

/**
 * Xử lý lỗi API chung
 * @param {Error} error - Lỗi
 * @param {string} context - Tên hàm (để log lỗi)
 */
const handleError = (error, context) => {
  // if(context === 'ActorProfile')
  console.error(`❌ Lỗi nghiêm trọng khi gọi API Worker (${context}):`, error);
  throw error;
};

// --- CÁC HÀM GET PAGE (Giữ nguyên) ---
export const getMoviesPage = async ({ pageToken = null } = {}) => {
  const apiUrl = pageToken ? `${API_URL_MOVIES}?pageToken=${pageToken}` : API_URL_MOVIES;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Lỗi mạng: ${response.statusText}`);
    const result = await response.json();
    if (result.status === 'success') return result;
    throw new Error(`Lỗi logic: ${result.message}`);
  } catch (error) {
    console.error('❌ Lỗi khi gọi getMoviesPage:', error);
    throw error;
  }
};

export const getActorsPage = async ({ pageToken = null } = {}) => {
  const apiUrl = pageToken ? `${API_URL_ACTORS}?pageToken=${pageToken}` : API_URL_ACTORS;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Lỗi mạng: ${response.statusText}`);
    const result = await response.json();
    if (result.status === 'success') return result;
    throw new Error(`Lỗi logic: ${result.message}`);
  } catch (error) {
    console.error('❌ Lỗi khi gọi getActorsPage:', error);
    throw error;
  }
};

export const getCouplesPage = async ({ pageToken = null } = {}) => {
  const apiUrl = pageToken ? `${API_URL_COUPLES}?pageToken=${pageToken}` : API_URL_COUPLES;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Lỗi mạng: ${response.statusText}`);
    const result = await response.json();
    if (result.status === 'success') return result;
    throw new Error(`Lỗi logic: ${result.message}`);
  } catch (error) {
    console.error('❌ Lỗi khi gọi getCouplesPage:', error);
    throw error;
  }
};

export const getStorylinesPage = async ({ pageToken = null } = {}) => {
  const apiUrl = pageToken ? `${API_URL_STORYLINES}?pageToken=${pageToken}` : API_URL_STORYLINES;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Lỗi mạng: ${response.statusText}`);
    const result = await response.json();
    if (result.status === 'success') return result;
    throw new Error(`Lỗi logic: ${result.message}`);
  } catch (error) {
    console.error('❌ Lỗi khi gọi getStorylinesPage:', error);
    throw error;
  }
};

// --- CÁC HÀM GET PROFILE / DETAIL (Cập nhật) ---

export const getMovieDetail_CF = async (movieId) => {
  const context = "MovieDetail";
  const apiUrl = `${API_URL_MOVIES}/${movieId}/profile`;
  console.log(`✅ Gọi API (CF Worker): ${apiUrl}`);
  try {
    const response = await fetch(apiUrl);
    return await handleResponse(response, context); // Trả về { movie: ... }
  } catch (error) {
    handleError(error, context);
  }
};

export const getActorProfile_CF = async (actorId) => {
  const context = "ActorProfile";
  const apiUrl = `${API_URL_ACTORS}/${actorId}/profile`;
  console.log(`✅ Gọi API (CF Worker): ${apiUrl}`);
  try {
    const response = await fetch(apiUrl);
    return await handleResponse(response, context); // Trả về { actor: ... }
  } catch (error) {
    handleError(error, context);
  }
};

export const getCoupleProfile_CF = async (coupleId) => {
  const context = "CoupleProfile";
  const apiUrl = `${API_URL_COUPLES}/${coupleId}/profile`;
  console.log(`✅ Gọi API (CF Worker): ${apiUrl}`);
  try {
    const response = await fetch(apiUrl);
    return await handleResponse(response, context); // Trả về { couple: ... }
  } catch (error) {
    handleError(error, context);
  }
};

export const getStorylineProfile_CF = async (storylineId) => {
  const context = "StorylineProfile";
  const apiUrl = `${API_URL_STORYLINES}/${storylineId}/profile`;
  console.log(`✅ Gọi API (CF Worker): ${apiUrl}`);
  try {
    const response = await fetch(apiUrl);
    return await handleResponse(response, context); // Trả về { storyline: ... }
  } catch (error) {
    handleError(error, context);
  }
};

// --- HÀM MỚI ĐỂ LẤY SEARCH DATA TỪ R2 ---
export const getSearchData_CF = async () => {
  const context = "SearchData";
  const apiUrl = `${API_URL_BASE}/search-data`; // <--- GỌI ENDPOINT MỚI
  console.log(`✅ Gọi API (CF Worker / R2): ${apiUrl}`);
  try {
    const response = await fetch(apiUrl);
    // handleResponse trả về {movies, actors, ...}
    const result = await handleResponse(response, context); 
    return result; 
  } catch (error) {
    handleError(error, context);
  }
};

// --- HÀM MỚI ĐỂ LẤY SEARCH DATA TỪ R2 ---
export const getFullData_CF = async () => {
  const context = "FullData";
  const apiUrl = `${API_URL_BASE}/full-data`; // <--- GỌI ENDPOINT MỚI
  console.log(`✅ Gọi API (CF Worker / R2): ${apiUrl}`);
  try {
    const response = await fetch(apiUrl);
    // handleResponse trả về {movies, actors, ...}
    const result = await handleResponse(response, context); 
    return result; 
  } catch (error) {
    handleError(error, context);
  }
};

// --- CÁC HÀM MỚI CHO BỘ SƯU TẬP ---

/**
 * Lấy bộ sưu tập phim của người dùng
 * @param {string} userId - (Email của user)
 * @returns {Promise<any>} - { movies: [...] }
 */
export const getCollection = async (userId) => {
  const context = "GetCollection";
  const apiUrl = `${API_URL_USERS}/${encodeURIComponent(userId)}/collection`;
  console.log(`✅ Gọi API (CF Worker): ${apiUrl}`);
  try {
    const response = await fetch(apiUrl);
    return await handleResponse(response, context); // Trả về { movies: [...] }
  } catch (error) {
    handleError(error, context);
  }
};

/**
 * Thêm phim vào bộ sưu tập
 * @param {string} userId - (Email của user)
 * @param {object} movieData - Dữ liệu phim (chỉ các trường cần thiết)
 * @returns {Promise<any>}
 */
export const addToCollection = async (userId, movieData) => {
  const context = "AddToCollection";
  const apiUrl = `${API_URL_USERS}/${encodeURIComponent(userId)}/collection`;
  console.log(`✅ Gọi API (CF Worker): POST ${apiUrl}`);
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movieData),
    });
    return await handleResponse(response, context);
  } catch (error) {
    handleError(error, context);
  }
};

/**
 * Xóa phim khỏi bộ sưu tập
 * @param {string} userId - (Email của user)
 * @param {string} movieId - ID của phim
 * @returns {Promise<any>}
 */
export const removeFromCollection = async (userId, movieId) => {
  const context = "RemoveFromCollection";
  const apiUrl = `${API_URL_USERS}/${encodeURIComponent(userId)}/collection/${movieId}`;
  console.log(`✅ Gọi API (CF Worker): DELETE ${apiUrl}`);
  try {
    const response = await fetch(apiUrl, {
      method: 'DELETE',
    });
    // Xử lý riêng cho DELETE (có thể không trả về body)
    if (!response.ok) {
      throw new Error(`Lỗi mạng từ API Worker (${context}): ${response.statusText}`);
    }
    const result = await response.json(); // Worker trả về { status: 'success' }
    if (result.status === 'success') {
      console.log(`✅ API Worker (${context}) phản hồi thành công.`);
      return result;
    } else {
      throw new Error(`Lỗi logic từ API Worker (${context}): ${result.message}`);
    }
  } catch (error) {
    handleError(error, context);
  }
};

/**
 * Lấy RSS feed của kênh YouTube (qua một proxy JSON).
 * @param {string} channelId - ID của kênh YouTube
 * @returns {Promise<any>} - Dữ liệu feed
 */
export const getChannelFeed = async (channelId) => {
  const context = "GetChannelFeed";
  // Chúng ta dùng rss2json làm proxy để parse XML và tránh lỗi CORS
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
  
  console.log(`✅ Gọi API (rss2json): ${apiUrl}`);
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Lỗi mạng từ rss2json: ${response.status}`);
    }
    const result = await response.json();
    if (result.status === 'ok') {
      console.log(`✅ API (rss2json) phản hồi thành công.`);
      return result.items; // Trả về mảng các video
    } else {
      throw new Error(`Lỗi logic từ rss2json: ${result.message}`);
    }
  } catch (error) {
    handleError(error, context);
  }
};

/**
 * Lấy tóm tắt video từ Cloudflare Worker
 * @param {string} videoId - ID của video YouTube
 * @returns {Promise<any>} - { summary: "..." }
 */
export const getYouTubeSummary = async (videoId) => {
  const context = "GetYouTubeSummary";
  // Đây là endpoint MỚI bạn sẽ cần tạo trên worker của mình
  const apiUrl = `${API_URL_BASE}/summarize-video?id=${videoId}`;
  
  console.log(`✅ Gọi API (CF Worker / Summarize): ${apiUrl}`);
  try {
    const response = await fetch(apiUrl);
    // handleResponse sẽ trả về { summary: "..." }
    return await handleResponse(response, context); 
  } catch (error) {
    handleError(error, context);
  }
};