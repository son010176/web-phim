// File: movies.gs (ĐÃ TỐI ƯU HOÀN TOÀN - ĐÃ SỬA TÊN HEADER)

// Tên sheet
const MOVIE_SHEET_NAME = "TỔNG HỢP";
const COUPLES_SHEET_NAME = "#PHIMTHEOCẶPDIỄNVIÊN";
const STORYLINE_SHEET_NAME = "#PHIMCÙNGCỐTTRUYỆN";

/**
 * Lấy danh sách phim (Đã tối ưu để dùng Header Map)
 */
function getAllMovies(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MOVIE_SHEET_NAME);
    if (!sheet) {
      throw new Error(`Không tìm thấy sheet có tên ${MOVIE_SHEET_NAME}`);
    }

    const dataRows = sheet.getDataRange().getValues();
    const headers = dataRows.shift(); // Lấy hàng đầu tiên làm headers
    const h = createHeaderMap(headers); // Tạo map

    const searchQuery = e && e.parameter ? e.parameter.query : null;
    const searchScope = e && e.parameter ? e.parameter.scope : 'tenPhim';
    let processedData = dataRows;

    // --- LỌC DỮ LIỆU NẾU CÓ TỪ KHÓA TÌM KIẾM ---
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      processedData = dataRows.filter(row => {
        // --- ĐÃ CẬP NHẬT KEY (viết hoa) ---
        if (!row[h['ID']] || row[h['ID']].toString().trim() === '') return false;
        
        if (searchScope === 'tenPhim') {
          const tenViet = (row[h['TỰA DỊCH SANG TIẾNG VIỆT']] || '').toLowerCase();
          const tenGoc = (row[h['TỰA GỐC TIẾNG TRUNG']] || '').toLowerCase();
          return tenViet.includes(lowerCaseQuery) || tenGoc.includes(lowerCaseQuery);
        }
        if (searchScope === 'theLoai') {
          const theLoai = (row[h['THỂ LOẠI CHÍNH']] || '').toLowerCase();
          return theLoai.includes(lowerCaseQuery);
        }
        return false;
      });
    }

    // --- CHUYỂN ĐỔI DỮ LIỆU SANG JSON ---
    const moviesData = processedData
      .map(row => createMovieObject(row, h)) // Dùng helper để tạo object
      .filter(movie => searchQuery ? true : (movie.id && movie.id.toString().trim() !== ''));

    return createJsonResponse({ status: 'success', data: moviesData });
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

/**
 * --- ĐÃ VIẾT LẠI HOÀN TOÀN ---
 * Lấy danh sách các cặp đôi diễn viên, kèm theo các bộ phim họ đã đóng chung.
 * Tối ưu bằng cách dùng Lookup Map (Hash Map) thay vì vòng lặp lồng nhau.
 */
function getAllMovieCouples() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const couplesSheet = ss.getSheetByName(COUPLES_SHEET_NAME);
    const movieSheet = ss.getSheetByName(MOVIE_SHEET_NAME);

    if (!couplesSheet) throw new Error(`Không tìm thấy sheet ${COUPLES_SHEET_NAME}`);
    if (!movieSheet) throw new Error(`Không tìm thấy sheet ${MOVIE_SHEET_NAME}`);

    // --- BƯỚC 1: Xử lý sheet Phim (TỔNG HỢP) ---
    const moviesData = movieSheet.getDataRange().getValues();
    const movieHeaders = moviesData.shift();
    const h_movies = createHeaderMap(movieHeaders);
    
    const moviesByCoupleCode = new Map();

    moviesData.forEach(row => {
      // --- ĐÃ CẬP NHẬT KEY (viết hoa) ---
      const codeCouples = row[h_movies['CODE COUPLES']];
      if (codeCouples) {
        const movie = createMovieObject(row, h_movies);
        if (!moviesByCoupleCode.has(codeCouples)) {
          moviesByCoupleCode.set(codeCouples, []);
        }
        moviesByCoupleCode.get(codeCouples).push(movie);
      }
    });

    // --- BƯỚC 2: Xử lý sheet Cặp đôi (#PHIMTHEOCẶPDIỄNVIÊN) ---
    const couplesRows = couplesSheet.getDataRange().getValues();
    const coupleHeaders = couplesRows.shift();
    // Giả định header sheet này là chữ thường (vd: 'id', 'code')
    const h_couples = createHeaderMap(coupleHeaders);

    const couplesData = couplesRows.map(row => {
      const code = row[h_couples['CODE']]; // Lấy code của couple (giả định key là 'code')
      
      const coupleInfo = {
        tenCouple: row[h_couples['TÊN COUPLE']],
        linkPost: row[h_couples['LINK POST']],
        tongSoPhim: row[h_couples['TỔNG SỐ PHIM ĐÃ HỢP TÁC']],
        tinhTrangCapNhat: row[h_couples['TÌNH TRẠNG CẬP NHẬT']],
        id: row[h_couples['ID']],
        code: code,
        movies: moviesByCoupleCode.get(code) || [] 
      };
      return coupleInfo;
    }).filter(couple => couple.id && couple.code); 

    // --- BƯỚC 3: TRẢ VỀ KẾT QUẢ ---
    return createJsonResponse({ status: 'success', data: couplesData });
  } catch (error) {
    console.error("Lỗi trong hàm getAllMovieCouples: ", error);
    return createJsonResponse({ status: 'error', message: error.message });
  }
}


/**
 * --- ĐÃ VIẾT LẠI HOÀN TOÀN ---
 * Lấy danh sách các phim được nhóm theo cùng cốt truyện.
 * Tối ưu bằng cách dùng Lookup Map (Hash Map).
 */
function getMoviesByStoryline() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const storylineSheet = ss.getSheetByName(STORYLINE_SHEET_NAME);
    const movieSheet = ss.getSheetByName(MOVIE_SHEET_NAME);

    if (!storylineSheet) throw new Error(`Không tìm thấy sheet ${STORYLINE_SHEET_NAME}`);
    if (!movieSheet) throw new Error(`Không tìm thấy sheet ${MOVIE_SHEET_NAME}`);

    // --- BƯỚC 1: Xử lý sheet Phim (TỔNG HỢP) ---
    const moviesData = movieSheet.getDataRange().getValues();
    const movieHeaders = moviesData.shift();
    const h_movies = createHeaderMap(movieHeaders);

    const moviesByStorylineCode = new Map();

    moviesData.forEach(row => {
      // --- ĐÃ CẬP NHẬT KEY (viết hoa) ---
      const codeStorylines = row[h_movies['CODE STORYLINES']];
      if (codeStorylines) {
        const movie = createMovieObject(row, h_movies);
        if (!moviesByStorylineCode.has(codeStorylines)) {
          moviesByStorylineCode.set(codeStorylines, []);
        }
        moviesByStorylineCode.get(codeStorylines).push(movie);
      }
    });

    // --- BƯỚC 2: Xử lý sheet Cốt truyện (#PHIMCÙNGCỐTTRUYỆN) ---
    const storylineRows = storylineSheet.getDataRange().getValues();
    const storylineHeaders = storylineRows.shift();
    // Giả định header sheet này là chữ thường (vd: 'id', 'code', 'theLoai')
    const h_storyline = createHeaderMap(storylineHeaders);

    const storylineData = storylineRows
      .filter(row => 
        (row[h_storyline['ID']] && row[h_storyline['ID']].toString().trim() !== '') && 
        (row[h_storyline['THỂ LOẠI']] && row[h_storyline['THỂ LOẠI']].toString().trim() !== '') &&
        (row[h_storyline['CODE']] && row[h_storyline['CODE']].toString().trim() !== '')
      )
      .map(row => {
        const code = row[h_storyline['code']]; // Lấy code của storyline
        
        const storylineInfo = {
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
        return storylineInfo;
      });

    // --- BƯỚC 3: TRẢ VỀ KẾT QUẢ ---
    return createJsonResponse({ status: 'success', data: storylineData });
  } catch (error) {
    console.error("Lỗi trong hàm getMoviesByStoryline: ", error);
    return createJsonResponse({ status: 'error', message: error.message });
  }
}



// function getPendingMovies() {
//     const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MOVIE_SHEET_NAME);
//     const allData = sheet.getDataRange().getValues();
//     console.log(`✅ [getPendingMovies] Lấy dữ liệu thành công từ sheet: ${MOVIE_SHEET_NAME}`);
//     const headers = allData[0];
//     const pendingMovies = [];
//     for (let i = 1; i < allData.length; i++) {
//         const row = allData[i];
//         const movie = {};
//         movie.rowNumber = i + 1; 
//         headers.forEach((header, index) => { movie[header] = row[index]; });
//         if (!movie.TenViet && (movie.DienVienNam || movie.DienVienNu)) {
//             pendingMovies.push(movie);
//         }
//     }
//     return createJsonResponse({ status: 'success', data: pendingMovies });
// }

// function handleUpdateMovie(payload) {
//   const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MOVIE_SHEET_NAME);
//   if (payload.rowNumber) {
//     const targetRow = parseInt(payload.rowNumber, 10);
//     if (isNaN(targetRow)) { return createJsonResponse({ status: 'error', message: 'Số dòng không hợp lệ.' }); }
//     const existingRowData = sheet.getRange(targetRow, 2, 1, 14).getValues()[0];
//     const columnMap = { LinkFbPost: 0, TenViet: 1, TenGoc: 2, DienVienNam: 3, DienVienNu: 4, Tags: 5, code: 6, luutru: 7, TheLoai: 8, LinkPoster: 9, LinkVideo: 10, LinkVideoMultiSub: 11, LinkFbVideo: 12, MoTa: 13 };
//     for (const key in payload) {
//       if (columnMap.hasOwnProperty(key)) { existingRowData[columnMap[key]] = payload[key]; }
//     }
//     sheet.getRange(targetRow, 2, 1, existingRowData.length).setValues([existingRowData]);
//     return createJsonResponse({ status: 'success', message: `Hoàn thiện phim ở dòng ${targetRow} thành công!` });
//   } 
//   else if (payload.ID) {
//     const data = sheet.getDataRange().getValues();
//     const movieId = payload.ID;
//     for (let i = 1; i < data.length; i++) {
//       if (data[i][0].toString() === movieId.toString()) {
//         const existingRowData = data[i].slice(1);
//         const columnMap = { LinkFbPost: 0, TenViet: 1, TenGoc: 2, DienVienNam: 3, DienVienNu: 4, Tags: 5, code: 6, luutru: 7, TheLoai: 8, LinkPoster: 9, LinkVideo: 10, LinkVideoMultiSub: 11, LinkFbVideo: 12, MoTa: 13 };
//         for (const key in payload) {
//             if (columnMap.hasOwnProperty(key)) { existingRowData[columnMap[key]] = payload[key]; }
//         }
//         sheet.getRange(i + 1, 2, 1, existingRowData.length).setValues([existingRowData]);
//         return createJsonResponse({ status: 'success', message: `Cập nhật phim ID ${movieId} thành công!` });
//       }
//     }
//     return createJsonResponse({ status: 'error', message: `Không tìm thấy phim có ID ${movieId}.` });
//   }
//   return createJsonResponse({ status: 'error', message: 'Cần cung cấp ID hoặc Số Dòng để cập nhật.' });
// }

// function handleAddMovie(payload) {
//   const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MOVIE_SHEET_NAME);
//   const nextRow = getActualLastRow(sheet) + 1;
//   const newRowData = [ payload.LinkFbPost, payload.TenViet, payload.TenGoc, payload.DienVienNam, payload.DienVienNu, payload.Tags, payload.code, payload.luutru, payload.TheLoai, payload.LinkPoster, payload.LinkVideo, payload.LinkVideoMultiSub, payload.LinkFbVideo, payload.MoTa ];
//   sheet.getRange(nextRow, 2, 1, newRowData.length).setValues([newRowData]);
//   return createJsonResponse({ status: 'success', message: 'Thêm phim thành công! ID sẽ được tự động tạo trong sheet.' });
// }

// function handleDeleteMovie(payload) {
//   const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MOVIE_SHEET_NAME);
//   const data = sheet.getDataRange().getValues();
//   const movieId = payload.ID;
//   if (!movieId) { return createJsonResponse({ status: 'error', message: 'Cần cung cấp ID phim để xóa.' }); }
//   for (let i = data.length - 1; i > 0; i--) {
//     if (data[i][0].toString() === movieId.toString()) {
//       sheet.deleteRow(i + 1);
//       return createJsonResponse({ status: 'success', message: `Xóa phim ID ${movieId} thành công!` });
//     }
//   }
//   return createJsonResponse({ status: 'error', message: `Không tìm thấy phim có ID ${movieId}.` });
// }

// function getActualLastRow(sheet) {
//   const allData = sheet.getDataRange().getValues();
//   for (let i = allData.length - 1; i >= 0; i--) {
//     const rowString = allData[i].join('').trim();
//     if (rowString !== "") { return i + 1; }
//   }
//   return 1;
// }