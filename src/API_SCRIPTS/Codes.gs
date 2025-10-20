// // File: Code.gs

// function doOptions(e) {
//   return HtmlService.createHtmlOutput()
//     .setHeader('Access-Control-Allow-Origin', '*')
//     .setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
//     .setHeader('Access-Control-Allow-Headers', 'Content-Type');
// }

function doGet(e) {
  try {
    const action = e.parameter.action;
    console.log(`Nhận được yêu cầu GET với action: ${action}`);

    // Sử dụng switch case để code gọn gàng và dễ đọc hơn
    switch (action) {
      case 'getAllMovies':
        // THAY ĐỔI QUAN TRỌNG: Truyền "e" vào hàm getAllMovies
        return getAllMovies(e);

      case 'getPendingMovies':
        return getPendingMovies();

      case 'getActorProfile':
        const slug = e.parameter.slug;
        if (!slug) {
          return createJsonResponse({ status: 'error', message: 'Thiếu slug của diễn viên.' });
        }
        return getActorProfile(slug);

      case 'getAllActors':
        // SỬA LỖI: Hàm getAllActors không cần tham số slug
        return getAllActors();

      case 'getMovieCouples':
        return getMovieCouples();

      case 'getMoviesByStoryline':
        return getMoviesByStoryline();

      case 'getCollection': // THÊM MỚI
        return getCollection();

      default:
        return createJsonResponse({ status: 'error', message: 'Hành động GET không hợp lệ.' });
    }
  } catch (error) {
    return createJsonResponse({ status: 'error', message: 'Lỗi: ' + error.toString() });
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Yêu cầu POST không hợp lệ.");
    }
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    const token = requestData.token;
    const payload = requestData.payload;
    if (!action) throw new Error("Action không được cung cấp.");
    
    console.log(`Nhận POST action: ${action}`);
    
    switch (action) {
      case 'addToCollection':
        return addToCollection(payload, token);
      case 'removeFromCollection':
        return removeFromCollection(payload, token); // Sẽ sửa ở bước sau
      default: 
        return createJsonResponse({ status: 'error', message: `Hành động POST '${action}' không hợp lệ.` });
    }
  } catch (error) {
    console.error(`Lỗi doPost: ${error.toString()}`);
    return createJsonResponse({ status: 'error', message: `Lỗi xử lý POST: ${error.message}` });
  }
}

