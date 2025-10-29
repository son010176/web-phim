// File: Code.gs

function doGet(e) {
  try {
    const action = e.parameter.action;
    console.log(`Nhận được yêu cầu GET với action: ${action}`);

    let response;
    switch (action) {
      case 'getAllMovies':
        response = getAllMovies(e);
        break;
      case 'getPendingMovies':
        response = getPendingMovies();
        break;
      case 'getActorProfile':
        const slug = e.parameter.slug;
        if (!slug) {
          response = createJsonResponse({ status: 'error', message: 'Thiếu slug của diễn viên.' });
        } else {
          response = getActorProfile(slug);
        }
        break;
      case 'getAllActors':
        response = getAllActors();
        break;
      case 'getAllMovieCouples':
        response = getAllMovieCouples();
        break;
      case 'getMoviesByStoryline':
        response = getMoviesByStoryline();
        break;
      case 'getDataFull':
        response = getDataFull();
        break;
      case 'getDataSearch':
        response = getDataSearch();
        break;
      default:
        response = createJsonResponse({ status: 'error', message: 'Hành động GET không hợp lệ.' });
    }

    return response;

  } catch (error) {
    const errorResponse = createJsonResponse({ status: 'error', message: 'Lỗi: ' + error.toString() });
    return errorResponse;
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
    
    let response;
    switch (action) {
      case 'addToCollection':
        response = addToCollection(payload, token);
        break;
      case 'removeFromCollection':
        response = removeFromCollection(payload, token);
        break;
      default: 
        response = createJsonResponse({ status: 'error', message: `Hành động POST '${action}' không hợp lệ.` });
    }
    
    // Thêm CORS headers cho response
    return addCorsHeaders(response);
    
  } catch (error) {
    console.error(`Lỗi doPost: ${error.toString()}`);
    const errorResponse = createJsonResponse({ status: 'error', message: `Lỗi xử lý POST: ${error.message}` });
    return addCorsHeaders(errorResponse);
  }
}
