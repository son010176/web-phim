// // File: movies.gs
const MOVIE_SHEET_NAME = "TỔNG HỢP"; // Đặt tên sheet ở đây để dễ quản lý

/**
 * Lấy danh sách phim từ sheet "TỔNG HỢP".
 * Hỗ trợ tìm kiếm phía server nếu có tham số 'query' và 'scope' được truyền vào.
 * @param {object} e - Tham số sự kiện từ yêu cầu GET, chứa e.parameter.
 */
/**
 * Lấy danh sách phim từ sheet "TỔNG HỢP", sử dụng chỉ số cột cố định.
 * Hỗ trợ tìm kiếm phía server nếu có tham số 'query' và 'scope'.
 * @param {object} e - Tham số sự kiện từ yêu cầu GET.
 */
function getAllMovies(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("TỔNG HỢP");
    if (!sheet) {
      throw new Error("Không tìm thấy sheet có tên TỔNG HỢP");
    }

    // Lấy tất cả các hàng dữ liệu, bỏ qua hàng tiêu đề
    const dataRows = sheet.getDataRange().getValues().slice(1);

    const searchQuery = e && e.parameter ? e.parameter.query : null;
    const searchScope = e && e.parameter ? e.parameter.scope : 'tenPhim';
    
    let processedData = dataRows;

    // --- LỌC DỮ LIỆU NẾU CÓ TỪ KHÓA TÌM KIẾM ---
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      
      processedData = dataRows.filter(row => {
        // Luôn kiểm tra xem hàng có ID ở cột I (index 0) không
        if (!row[8] || row[8].toString().trim() === '') return false;
        
        if (searchScope === 'tenPhim') {
          // Cột B (index 2): TỰA DỊCH SANG TIẾNG VIỆT
          const tenViet = (row[1] || '').toLowerCase();
          // Cột C (index 3): TỰA GỐC TIẾNG TRUNG
          const tenGoc = (row[2] || '').toLowerCase();
          return tenViet.includes(lowerCaseQuery) || tenGoc.includes(lowerCaseQuery);
        }
        if (searchScope === 'theLoai') {
          // Cột J (index 9): THỂ LOẠI CHÍNH
          const theLoai = (row[9] || '').toLowerCase();
          return theLoai.includes(lowerCaseQuery);
        }
        return false;
      });
    }

    // --- CHUYỂN ĐỔI DỮ LIỆU SANG JSON ---
    const moviesData = processedData
      .map(row => {
        return {
          linkFbPost:         row[0],   // Cột A
          tenViet:            row[1],   // Cột B
          tenGoc:             row[2],   // Cột C
          dienVienNam:        row[3],   // Cột D
          dienVienNu:         row[4],   // Cột E
          tags:               row[5],   // Cột F
          code:               row[6],   // Cột G
          tinhTrangLuuTru:    row[7],   // Cột H

          id:                 row[8],   // Cột I
          theLoai:            row[9],   // Cột J
          linkPoster:         row[10],  // Cột K
          linkVideo:          row[11],  // Cột L
          linkVideoMultiSub:  row[12],  // Cột M
          linkFbVideo:        row[13],  // Cột N
          linkGgDrive:        row[14],  // Cột O
          linkKhac:           row[15],  // Cột P
          moTa:               row[16]   // Cột Q
        };
      })
      // Lọc bỏ các hàng không có ID (chỉ áp dụng khi không tìm kiếm)
      .filter(movie => searchQuery ? true : (movie.id && movie.id.toString().trim() !== ''));

    return createJsonResponse({ status: 'success', data: moviesData });

  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

/**
 * Lấy danh sách các cặp đôi diễn viên và phim của họ.
 * Đọc từ sheet: #PHIMTHEOCẶPDIỄNVIÊN
 */
/**
 * Lấy danh sách các cặp đôi diễn viên, kèm theo các bộ phim họ đã đóng chung.
 * Tối ưu bằng cách chỉ đọc sheet phim một lần.
 */
function getMovieCouples() {
  try {
    // --- BƯỚC 1: LẤY DỮ LIỆU TỪ CÁC SHEET CẦN THIẾT ---
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const couplesSheet = ss.getSheetByName("#PHIMTHEOCẶPDIỄNVIÊN");
    const movieSheet = ss.getSheetByName("TỔNG HỢP");

    if (!couplesSheet) {
      throw new Error("Không tìm thấy sheet có tên #PHIMTHEOCẶPDIỄNVIÊN");
    }
    if (!movieSheet) {
      throw new Error("Không tìm thấy sheet TỔNG HỢP");
    }

    // Lấy dữ liệu phim một lần duy nhất để tối ưu hiệu năng
    const moviesData = movieSheet.getDataRange().getValues();
    const movieHeaders = moviesData[0];
    // Xác định vị trí các cột Diễn viên trong sheet TỔNG HỢP
    const dienVienNamIndex = movieHeaders.indexOf('NAM DIỄN VIÊN');
    const dienVienNuIndex = movieHeaders.indexOf('NỮ DIỄN VIÊN');

    // Lấy dữ liệu các cặp đôi, bỏ qua hàng tiêu đề
    const couplesRows = couplesSheet.getDataRange().getValues().slice(1);

    // --- BƯỚC 2: XỬ LÝ TỪNG CẶP ĐÔI ---
    const couplesData = couplesRows.map(row => {
      // a. Tạo đối tượng thông tin cơ bản của cặp đôi
      const coupleInfo = {
        tenCouple:          row[0], // Cột A
        linkPost:           row[1], // Cột B
        tongSoPhim:         row[2], // Cột C
        tinhTrangCapNhat:   row[3], // Cột D
        id:                 row[4]  // Cột E
      };

      // b. Tách tên 2 diễn viên từ cột "TÊN COUPLE"
      // Ví dụ: "An Từ Dương 安字杨 & Quách Tĩnh 郭静" -> ["An Từ Dương", "Quách Tĩnh"]
      const actorNames = coupleInfo.tenCouple.split('&').map(name => 
        name.trim().split(/[\(（\u4e00-\u9fa5]/)[0].trim()
      );
      
      const [actor1Name, actor2Name] = actorNames;
      const coupleMovies = [];

      // c. Lọc qua danh sách phim để tìm phim chung
      if (actor1Name && actor2Name) {
        // Bắt đầu lặp từ hàng thứ 2 của sheet phim (bỏ qua tiêu đề)
        for (let i = 1; i < moviesData.length; i++) {
          const movieRow = moviesData[i];
          const dvNam = movieRow[dienVienNamIndex] || '';
          const dvNu = movieRow[dienVienNuIndex] || '';
          const allActorsInMovie = dvNam + ' & ' + dvNu; // Nối chuỗi để tìm kiếm

          // Kiểm tra xem phim có chứa tên của CẢ HAI diễn viên không
          if (allActorsInMovie.includes(actor1Name) && allActorsInMovie.includes(actor2Name)) {
            // Nếu có, tạo đối tượng phim và thêm vào danh sách
            const movie = {
                linkFbPost:         movieRow[0],
                tenViet:            movieRow[1],
                tenGoc:             movieRow[2],
                dienVienNam:        movieRow[3],
                dienVienNu:         movieRow[4],
                tags:               movieRow[5],
                code:               movieRow[6],
                tinhTrangLuuTru:    movieRow[7],

                id:                 movieRow[8],
                theLoai:            movieRow[9],
                linkPoster:         movieRow[10],
                linkVideo:          movieRow[11],
                linkVideoMultiSub:  movieRow[12],
                linkFbVideo:        movieRow[13],
                linkGgDrive:        movieRow[14],
                linkKhac:           movieRow[15],
                moTa:               movieRow[16]
            };
            coupleMovies.push(movie);
          }
        }
      }

      // d. Gắn danh sách phim tìm được vào đối tượng couple
      coupleInfo.movies = coupleMovies;
      return coupleInfo;

    }).filter(couple => couple.id); // Lọc bỏ các hàng không có ID

    // --- BƯỚC 3: TRẢ VỀ KẾT QUẢ ---
    return createJsonResponse({ status: 'success', data: couplesData });

  } catch (error) {
    console.error("Lỗi trong hàm getMovieCouples: ", error);
    return createJsonResponse({ status: 'error', message: error.message });
  }
}

/**
 * Lấy danh sách các phim được nhóm theo cùng cốt truyện.
 * LOGIC MỚI: Chỉ lấy những dòng có giá trị ở cột THỂ LOẠI (cột H).
 */
function getMoviesByStoryline() {
  try {
    // --- BƯỚC 1: LẤY DỮ LIỆU TỪ CÁC SHEET CẦN THIẾT ---
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const storylineSheet = ss.getSheetByName("#PHIMCÙNGCỐTTRUYỆN");
    const movieSheet = ss.getSheetByName("TỔNG HỢP");

    if (!storylineSheet) {
      throw new Error("Không tìm thấy sheet có tên #PHIMCÙNGCỐTTRUYỆN");
    }
    if (!movieSheet) {
      throw new Error("Không tìm thấy sheet TỔNG HỢP");
    }

    // Lấy dữ liệu phim một lần duy nhất để tối ưu
    const moviesData = movieSheet.getDataRange().getValues();
    const movieHeaders = moviesData[0];
    const codeIndex = movieHeaders.indexOf('CODE'); // Tìm vị trí cột CODE

    if (codeIndex === -1) {
        throw new Error("Không tìm thấy cột 'CODE' trong sheet TỔNG HỢP");
    }

    // Lấy dữ liệu các storyline, bỏ qua hàng tiêu đề
    const storylineRows = storylineSheet.getDataRange().getValues().slice(1);

    // --- BƯỚC 2: XỬ LÝ TỪNG STORYLINE ---
    const storylineData = storylineRows
      // **ĐIỀU CHỈNH QUAN TRỌNG:** Lọc những dòng có cả ID (cột G) VÀ THỂ LOẠI (cột H)
      .filter(row => 
        (row[6] && row[6].toString().trim() !== '') && // Điều kiện 1: ID không được rỗng
        (row[7] && row[7].toString().trim() !== '')    // Điều kiện 2: THỂ LOẠI không được rỗng
      )
      .map(row => {
        // a. Tạo đối tượng thông tin cơ bản của storyline
        const storylineInfo = {
          
          tenCouple:          row[0], // Cột A
          linkPost:           row[1], // Cột B
          tagTheLoai:         row[2], // Cột C
          tieuThuyetGoc:      row[3], // Cột D
          tongSoPhienBan:     row[4], // Cột E
          tinhTrangCapNhat:   row[5], // Cột F
          id:                 row[6], // Cột G
          theLoai:            row[7]  // Cột H
        };

        const storylineMovies = [];
        
        // b. Chuyển đổi ID của storyline thành định dạng để so sánh
        const storylineIdentifier = storylineInfo.id.replace(/-/g, '').toUpperCase();

        // c. Lọc qua danh sách phim để tìm các phim cùng cốt truyện
        if (storylineIdentifier) {
          for (let i = 1; i < moviesData.length; i++) {
            const movieRow = moviesData[i];
            const movieCode = (movieRow[codeIndex] || '').toUpperCase();

            if (movieCode.startsWith(storylineIdentifier)) {
              const movie = {
                  linkFbPost:         movieRow[0],
                  tenViet:            movieRow[1],
                  tenGoc:             movieRow[2],
                  dienVienNam:        movieRow[3],
                  dienVienNu:         movieRow[4],
                  tags:               movieRow[5],
                  code:               movieRow[6],
                  tinhTrangLuuTru:    movieRow[7],

                  id:                 movieRow[8],
                  theLoai:            movieRow[9],
                  linkPoster:         movieRow[10],
                  linkVideo:          movieRow[11],
                  linkVideoMultiSub:  movieRow[12],
                  linkFbVideo:        movieRow[13],
                  linkGgDrive:        movieRow[14],
                  linkKhac:           movieRow[15],
                  moTa:               movieRow[16]
              };
              storylineMovies.push(movie);
            }
          }
        }

        // d. Gắn danh sách phim tìm được vào đối tượng storyline
        storylineInfo.movies = storylineMovies;
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