// File: cache.gs (Đã sửa đổi cho R2)

// Tên các sheet (Giữ nguyên)
const MOVIE_SHEET_NAME_CACHE = "TỔNG HỢP";
const ACTORS_SHEET_NAME_CACHE = "PROFILE DIỄN VIÊN";
const COUPLES_SHEET_NAME_CACHE = "#PHIMTHEOCẶPDIỄNVIÊN";
const STORYLINE_SHEET_NAME_CACHE = "#PHIMCÙNGCỐTTRUYỆN";

/**
 * --- HÀM MỚI (CHẠY BẰNG TRIGGER): Đồng bộ TẤT CẢ dữ liệu (Search và Full) lên R2 ---
 * (Đã đổi tên từ syncSearchDataToR2)
 */
function syncAllDataToR2() {
  // --- CÁC BIẾN NÀY BẠN CẦN THIẾT LẬP ---
  const R2_BUCKET_NAME = 'phim-ngan-cache'; // <--- SỬA LẠI TÊN BUCKET
  const CF_ACCOUNT_ID = '16f9a00bb8a0caa5327f9c2e669c9a59'; // <--- SỬA LẠI ACCOUNT ID
  const SEARCH_FILE_NAME = 'search-data.json'; // File nhỏ
  const FULL_FILE_NAME = 'full-data.json';     // File đầy đủ
  // --- HẾT PHẦN THIẾT LẬP ---

  // Lấy token 1 lần
  const R2_API_TOKEN = PropertiesService.getScriptProperties().getProperty('R2_API_TOKEN');
  if (!R2_API_TOKEN) {
    console.error("Lỗi: Chưa thiết lập 'R2_API_TOKEN' trong Script Properties.");
    return;
  }

  // --- PHẦN 1: SYNC SEARCH DATA ---
  console.log(`[1/2] Bắt đầu đồng bộ ${SEARCH_FILE_NAME}...`);
  const searchData = _internal_getDataSearch();
  if (searchData) {
    _putFileToR2(CF_ACCOUNT_ID, R2_BUCKET_NAME, SEARCH_FILE_NAME, R2_API_TOKEN, searchData);
  } else {
    console.error(`[1/2] Đồng bộ ${SEARCH_FILE_NAME} thất bại: Không thể lấy dữ liệu từ _internal_getDataSearch.`);
  }

  // Thêm khoảng nghỉ ngắn để tránh lỗi rate limit
  Utilities.sleep(1500); 

  // --- PHẦN 2: SYNC FULL DATA ---
  console.log(`[2/2] Bắt đầu đồng bộ ${FULL_FILE_NAME}...`);
  const fullData = _internal_getDataFull(); // Gọi hàm mới
  if (fullData) {
    _putFileToR2(CF_ACCOUNT_ID, R2_BUCKET_NAME, FULL_FILE_NAME, R2_API_TOKEN, fullData);
  } else {
    console.error(`[2/2] Đồng bộ ${FULL_FILE_NAME} thất bại: Không thể lấy dữ liệu từ _internal_getDataFull.`);
  }

  console.log("Hoàn tất quá trình đồng bộ 2 file.");
}

/**
 * --- HÀM HELPER (MỚI): PUT 1 file JSON lên R2 ---
 * (Tách ra từ hàm sync cũ để tái sử dụng)
 */
function _putFileToR2(accountId, bucketName, fileName, apiToken, dataObject) {
  const r2Url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/${fileName}`;
  
  const payload = JSON.stringify(dataObject);
  
  // Tính toán ContentLength một cách chính xác
  const contentLength = Utilities.newBlob(payload).getBytes().length.toString();

  const options = {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      // 'Content-Length': contentLength // UrlFetchApp thường tự xử lý
    },
    payload: payload,
    muteHttpExceptions: true 
  };

  // Thực hiện PUT request
  try {
    const response = UrlFetchApp.fetch(r2Url, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();
    
    if (responseCode === 200) {
      console.log(`✅ THÀNH CÔNG: Đã PUT ${payload.length} bytes lên R2 (${fileName}).`);
    } else {
      console.error(`❌ THẤT BẠI (Code: ${responseCode}): Không thể PUT file ${fileName}. Phản hồi: ${responseBody}`);
    }
  } catch (e) {
    console.error(`❌ Lỗi nghiêm trọng khi gọi R2 API cho file ${fileName}: ${e.toString()}`);
  }
}

/**
 * --- HÀM NỘI BỘ (ĐỔI TÊN TỪ getDataSearch) ---
 * Lấy các trường cần thiết cho tìm kiếm/lọc từ các sheet.
*/
function _internal_getDataSearch() { // <--- ĐÃ ĐỔI TÊN
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    // 1. Lấy tất cả các sheet cần thiết
    const movieSheet = ss.getSheetByName(MOVIE_SHEET_NAME_CACHE);
    const actorSheet = ss.getSheetByName(ACTORS_SHEET_NAME_CACHE);
    const couplesSheet = ss.getSheetByName(COUPLES_SHEET_NAME_CACHE);
    const storylineSheet = ss.getSheetByName(STORYLINE_SHEET_NAME_CACHE);

    // 2. Kiểm tra lỗi
    if (!movieSheet || !actorSheet || !couplesSheet || !storylineSheet) {
      throw new Error("getDataSearch: Không tìm thấy một trong các sheet cần thiết.");
    }

    // --- Xử lý Sheet Phim (TỔNG HỢP) ---
    const moviesData = movieSheet.getDataRange().getValues();
    const movieHeaders = moviesData.shift();
    const h_movies = createHeaderMap(movieHeaders);
    const searchMovies = moviesData.map(row => ({
      id: row[h_movies['ID']],
      dienVienNam: row[h_movies['NAM DIỄN VIÊN']],
      dienVienNu: row[h_movies['NỮ DIỄN VIÊN']],
      tenViet: row[h_movies['TỰA DỊCH SANG TIẾNG VIỆT']],
      tenGoc: row[h_movies['TỰA GỐC TIẾNG TRUNG']],
      linkPoster: row[h_movies['LINK POSTER']],
      theLoai: row[h_movies['THỂ LOẠI CHÍNH']]

    })).filter(movie => movie.id && movie.id.toString().trim() !== '');
    // --- Xử lý sheet Diễn viên (PROFILE DIỄN VIÊN) ---
    const actorRows = actorSheet.getDataRange().getValues();
    const actorHeaders = actorRows.shift();
    const h_actors = createHeaderMap(actorHeaders);
    const searchActors = actorRows.map(row => ({
      id: row[h_actors['ID']],
      linkAnhProfile: row[h_actors['LINK ẢNH PROFILE']],
      ten: row[h_actors['TÊN DIỄN VIÊN']],
      tenBinhAm: row[h_actors['TÊN BÍNH ÂM']],
      gioiTinh: row[h_actors['GENDER']],
      ngaySinh: row[h_actors['NGÀY SINH']]
    })).filter(actor => actor.id && actor.ten);
    // --- Xử lý sheet Cặp đôi (#PHIMTHEOCẶPDIỄNVIÊN) ---
    const couplesRows = couplesSheet.getDataRange().getValues();
    const coupleHeaders = couplesRows.shift();
    const h_couples = createHeaderMap(coupleHeaders);
    const searchCouples = couplesRows.map(row => ({
      id: row[h_couples['ID']],
      tenCouple: row[h_couples['TÊN COUPLE']],
      tinhTrangCapNhat: row[h_couples['TÌNH TRẠNG CẬP NHẬT']],
      tongSoPhim: row[h_couples['TỔNG SỐ PHIM ĐÃ HỢP TÁC']]
    })).filter(couple => couple.id && couple.tenCouple);
    // --- Xử lý sheet Cốt truyện (#PHIMCÙNGCỐTTRUYỆN) ---
    const storylineRows = storylineSheet.getDataRange().getValues();
    const storylineHeaders = storylineRows.shift();
    const h_storyline = createHeaderMap(storylineHeaders);
    const searchStorylines = storylineRows
      .filter(row =>
        (row[h_storyline['ID']] && row[h_storyline['ID']].toString().trim() !== '') &&
        (row[h_storyline['CODE']] && row[h_storyline['CODE']].toString().trim() !== '')
      )
      .map(row => ({
        id: row[h_storyline['ID']],
        tenCouple: row[h_storyline['TÊN COUPLE']],
        tieuThuyetGoc: row[h_storyline['TIỂU THUYẾT GỐC']],
        tagTheLoai: row[h_storyline['TAG THỂ LOẠI']],
        tongSoPhienBan: row[h_storyline['TỔNG SỐ PHIÊN BẢN']],
        tinhTrangCapNhat: row[h_storyline['TÌNH TRẠNG CẬP NHẬT']],
        theLoai: row[h_storyline['THỂ LOẠI']]
      }));
    // --- Gộp dữ liệu Search và trả về ---
    const searchData = {
      movies: searchMovies,
      actors: searchActors,
      couples: searchCouples,
      storylines: searchStorylines
    };
    console.log("✅ _internal_getDataSearch: Đã tạo dữ liệu search thành công.");
    return searchData; // <--- SỬA LẠI: Trả về object
  } catch (error) {
    console.error("❌ Lỗi nghiêm trọng trong _internal_getDataSearch: ", error);
    return null; // <--- SỬA LẠI: Trả về null nếu lỗi
  }
}

/**
 * --- HÀM CŨ (VÔ HIỆU HÓA) ---
 * Giờ chỉ trả về lỗi để client biết không dùng endpoint này nữa.
 */
function getDataSearch() {
  return createJsonResponse({ status: 'error', message: 'Endpoint này đã bị vô hiệu hóa. Sử dụng API Cloudflare.' });
}


/**
 * --- HÀM NỘI BỘ (MỚI) ---
 * Lấy toàn bộ dữ liệu Movies, Actors, Couples, và Storylines (đã bao gồm phim)
 * Logic được copy từ getDataFull cũ.
 */
function _internal_getDataFull() { 
  console.log("⏳ Bắt đầu tải _internal_getDataFull (dữ liệu đầy đủ)...");
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    // 1. Lấy tất cả các sheet cần thiết
    const movieSheet = ss.getSheetByName(MOVIE_SHEET_NAME_CACHE);
    const actorSheet = ss.getSheetByName(ACTORS_SHEET_NAME_CACHE);
    const couplesSheet = ss.getSheetByName(COUPLES_SHEET_NAME_CACHE);
    const storylineSheet = ss.getSheetByName(STORYLINE_SHEET_NAME_CACHE);
    // 2. Kiểm tra lỗi
    if (!movieSheet || !actorSheet || !couplesSheet || !storylineSheet) {
      throw new Error("getDataFull: Không tìm thấy một trong các sheet cần thiết.");
    }

    // --- BƯỚC 1: Xử lý Sheet Phim (TỔNG HỢP) 1 LẦN DUY NHẤT ---
    const moviesData = movieSheet.getDataRange().getValues();
    const movieHeaders = moviesData.shift();
    const h_movies = createHeaderMap(movieHeaders);

    const allMoviesList = [];
    const moviesByActorId = new Map();
    const moviesByCoupleCode = new Map();
    const moviesByStorylineCode = new Map();
    
    moviesData.forEach(row => {
      const movie = createMovieObject(row, h_movies); // Hàm này lấy đủ trường

      if (movie.id && movie.id.toString().trim() !== '') {
        allMoviesList.push(movie);
      }

      const actorIdNam = row[h_movies['ID DIỄN VIÊN NAM']];
      const actorIdNu = row[h_movies['ID DIỄN VIÊN NỮ']];
      const codeCouples = row[h_movies['CODE COUPLES']];
      const codeStorylines = row[h_movies['CODE STORYLINES']];

      if (actorIdNam) {
        if (!moviesByActorId.has(actorIdNam)) moviesByActorId.set(actorIdNam, []);
        moviesByActorId.get(actorIdNam).push(movie);
      }
      if (actorIdNu) {
        if (!moviesByActorId.has(actorIdNu)) moviesByActorId.set(actorIdNu, []);
        moviesByActorId.get(actorIdNu).push(movie);
      }
      if (codeCouples) {
        if (!moviesByCoupleCode.has(codeCouples)) moviesByCoupleCode.set(codeCouples, []);
        moviesByCoupleCode.get(codeCouples).push(movie);
      }
      if (codeStorylines) {
        if (!moviesByStorylineCode.has(codeStorylines)) moviesByStorylineCode.set(codeStorylines, []);
        moviesByStorylineCode.get(codeStorylines).push(movie);
      }
    });
    // --- BƯỚC 2: Xử lý sheet Diễn viên (PROFILE DIỄN VIÊN) ---
    const actorRows = actorSheet.getDataRange().getValues();
    const actorHeaders = actorRows.shift();
    const h_actors = createHeaderMap(actorHeaders);
    const allActors = actorRows.map(row => {
      const actorId = row[h_actors['ID']];
      return { // Lấy đủ trường
        ten: row[h_actors['TÊN DIỄN VIÊN']],
        namSinh: row[h_actors['NĂM SINH']],
        profile: row[h_actors['PROFILE']],
        albumAnh: row[h_actors['ALBUM ẢNH']],
        youtube: row[h_actors['DANH SÁCH PHÁT YOUTUBE']],
        blog: row[h_actors['TỔNG HỢP CÁC BÀI VIẾT LIÊN QUAN TẠI BLOG']],
        id: actorId,
        tenBinhAm: row[h_actors['TÊN BÍNH ÂM']],
        ngaySinh: row[h_actors['NGÀY SINH']],
        cungHoangDao: row[h_actors['CUNG HOÀNG ĐẠO']],
        queQuan: row[h_actors['QUÊ QUÁN']],
        hocVan: row[h_actors['HỌC VẤN']],
        ngheNghiep: row[h_actors['NGHỀ NGHIỆP']],
        weibo: row[h_actors['WEIBO']],
        douyin: row[h_actors['DOUYIN']],
        linkAnhProfile: row[h_actors['LINK ẢNH PROFILE']],
        tag: row[h_actors['TAG']],
        gioiTinh: row[h_actors['GENDER']],
        movies: moviesByActorId.get(actorId) || []
      };
    }).filter(actor => actor.ten && actor.id);
    // --- BƯỚC 3: Xử lý sheet Cặp đôi (#PHIMTHEOCẶPDIỄNVIÊN) ---
    const couplesRows = couplesSheet.getDataRange().getValues();
    const coupleHeaders = couplesRows.shift();
    const h_couples = createHeaderMap(coupleHeaders);
    const allCouples = couplesRows.map(row => {
      const code = row[h_couples['CODE']];
      return { // Lấy đủ trường
        tenCouple: row[h_couples['TÊN COUPLE']],
        linkPost: row[h_couples['LINK POST']],
        tongSoPhim: row[h_couples['TỔNG SỐ PHIM ĐÃ HỢP TÁC']],
        tinhTrangCapNhat: row[h_couples['TÌNH TRẠNG CẬP NHẬT']],
        id: row[h_couples['ID']],
        code: code,
        movies: moviesByCoupleCode.get(code) || []
      };
    }).filter(couple => couple.id && couple.code);
    // --- BƯỚC 4: Xử lý sheet Cốt truyện (#PHIMCÙNGCỐTTRUYỆN) ---
    const storylineRows = storylineSheet.getDataRange().getValues();
    const storylineHeaders = storylineRows.shift();
    const h_storyline = createHeaderMap(storylineHeaders);
    const allStorylines = storylineRows
      .filter(row =>
        (row[h_storyline['ID']] && row[h_storyline['ID']].toString().trim() !== '') &&
        (row[h_storyline['CODE']] && row[h_storyline['CODE']].toString().trim() !== '')
      )
      .map(row => {
        const code = row[h_storyline['CODE']];
        return { // Lấy đủ trường
          tenCouple: row[h_storyline['TÊN COUPLE']],
          linkPost: row[h_storyline['LINK POST']],
          tagTheLoai: row[h_storyline['TAG THỂ LOẠI']],
          tieuThuyetGoc: row[h_storyline['TIỂU THUYẾT GỐC']],
          tongSoPhienBan: row[h_storyline['TỔNG SỐ PHIÊN BẢN']],
          tinhTrangCapNhat: row[h_storyline['TÌNH TRẠNG CẬP NHẬT']],
          id: row[h_storyline['ID']],
          theLoai: row[h_storyline['THỂ LOẠI']],
          code: code,
          movies: moviesByStorylineCode.get(code) || []
        };
      });
    // --- BƯỚC 5: Gộp tất cả dữ liệu và trả về ---
    const allData = {
      movies: allMoviesList,
      actors: allActors,
      couples: allCouples,
      storylines: allStorylines
    };

    console.log("✅ _internal_getDataFull: Tải dữ liệu đầy đủ thành công.");
    return allData; // <-- THAY ĐỔI QUAN TRỌNG: Trả về object
    
  } catch (error) {
    console.error("❌ Lỗi nghiêm trọng trong _internal_getDataFull: ", error);
    return null; // <-- THAY ĐỔI QUAN TRỌNG: Trả về null nếu lỗi
  }
}

/**
 * --- HÀM CŨ (ĐÃ VÔ HIỆU HÓA) ---
 * Bị thay thế bởi _internal_getDataFull và syncAllDataToR2.
 */
function getDataFull() {
  return createJsonResponse({ status: 'error', message: 'Endpoint này đã bị vô hiệu hóa. Sử dụng API Cloudflare.' });
}


// ... (Tất cả các hàm helper còn lại như createHeaderMap, createMovieObject, createJsonResponse, v.v... GIỮ NGUYÊN) ...


/**
 * --- HÀM TÌM KIẾM (KHÔNG ĐỔI) ---
 * Chỉ dùng cho chức năng TÌM KIẾM (Search Bar) cũ nếu cần.
 * Hàm này lấy tham số 'e' từ 'google.script.run'
 */
// function getAllMovies(e) {
//   // ... (Giữ nguyên code của hàm getAllMovies)
//   try {
//     const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MOVIE_SHEET_NAME_CACHE);
//     if (!sheet) {
//       throw new Error(`Không tìm thấy sheet có tên ${MOVIE_SHEET_NAME_CACHE}`);
//     }

//     const dataRows = sheet.getDataRange().getValues();
//     const headers = dataRows.shift();
//     const h = createHeaderMap(headers);
//     const searchQuery = e && e.parameter ? e.parameter.query : null;
//     const searchScope = e && e.parameter ? e.parameter.scope : 'tenPhim';
//     let processedData = dataRows;

//     // --- LỌC DỮ LIỆU NẾU CÓ TỪ KHÓA TÌM KIẾM ---
//     if (searchQuery) {
//       const lowerCaseQuery = searchQuery.toLowerCase();
//       processedData = dataRows.filter(row => {
//         if (!row[h['ID']] || row[h['ID']].toString().trim() === '') return false;

//         if (searchScope === 'tenPhim') {
//           const tenViet = (row[h['TỰA DỊCH SANG TIẾNG VIỆT']] || '').toLowerCase();
//           const tenGoc = (row[h['TỰA GỐC TIẾNG TRUNG']] || '').toLowerCase();
//           return tenViet.includes(lowerCaseQuery) || tenGoc.includes(lowerCaseQuery);
//         }

//         if (searchScope === 'theLoai') {
//           const theLoai = (row[h['THỂ LOẠI CHÍNH']] || '').toLowerCase();
//           return theLoai.includes(lowerCaseQuery);
//         }
//         return false;
//       });
//     }

//     // --- CHUYỂN ĐỔI DỮ LIỆU SANG JSON ---
//     const moviesData = processedData
//       .map(row => createMovieObject(row, h))
//       .filter(movie => searchQuery ? true : (movie.id && movie.id.toString().trim() !== ''));
//     return createJsonResponse({ status: 'success', data: moviesData });
//   } catch (error) {
//     return createJsonResponse({ status: 'error', message: error.toString() });
//   }
// }