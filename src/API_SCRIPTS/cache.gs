// File: cache.gs (Gộp 4 hàm làm 1 + Giữ lại Search)

// Tên các sheet
const MOVIE_SHEET_NAME_CACHE = "TỔNG HỢP";
const ACTORS_SHEET_NAME_CACHE = "PROFILE DIỄN VIÊN";
const COUPLES_SHEET_NAME_CACHE = "#PHIMTHEOCẶPDIỄNVIÊN";
const STORYLINE_SHEET_NAME_CACHE = "#PHIMCÙNGCỐTTRUYỆN";

/**
 * --- HÀM GỘP TẤT CẢ ---
 * Lấy toàn bộ dữ liệu Movies, Actors, Couples, và Storylines (đã bao gồm phim)
 * chỉ trong 1 cuộc gọi API.
 */
function fetchAllDataForSearchCache() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Lấy tất cả các sheet cần thiết
    const movieSheet = ss.getSheetByName(MOVIE_SHEET_NAME_CACHE);
    const actorSheet = ss.getSheetByName(ACTORS_SHEET_NAME_CACHE);
    const couplesSheet = ss.getSheetByName(COUPLES_SHEET_NAME);
    const storylineSheet = ss.getSheetByName(STORYLINE_SHEET_NAME);

    // 2. Kiểm tra lỗi
    if (!movieSheet || !actorSheet || !couplesSheet || !storylineSheet) {
      throw new Error("Không tìm thấy một trong các sheet: TỔNG HỢP, PROFILE DIỄN VIÊN, #PHIMTHEOCẶPDIỄNVIÊN, #PHIMCÙNGCỐTTRUYỆN");
    }

    // --- BƯỚC 1: Xử lý Sheet Phim (TỔNG HỢP) 1 LẦN DUY NHẤT ---
    const moviesData = movieSheet.getDataRange().getValues();
    const movieHeaders = moviesData.shift();
    const h_movies = createHeaderMap(movieHeaders);

    // Tạo 3 BẢN ĐỒ TRA CỨU + 1 DANH SÁCH PHIM
    const allMoviesList = []; // <-- THÊM MỚI
    const moviesByActorId = new Map();
    const moviesByCoupleCode = new Map();
    const moviesByStorylineCode = new Map();

    moviesData.forEach(row => {
      // Chỉ tạo object movie 1 lần
      const movie = createMovieObject(row, h_movies);
      
      // THÊM MỚI: Thêm phim vào danh sách tổng
      if (movie.id && movie.id.toString().trim() !== '') {
         allMoviesList.push(movie);
      }
      
      // 1.1 Lấy ID diễn viên
      const actorIdNam = row[h_movies['ID DIỄN VIÊN NAM']];
      const actorIdNu = row[h_movies['ID DIỄN VIÊN NỮ']];
      
      // 1.2 Lấy Code Couple
      const codeCouples = row[h_movies['CODE COUPLES']];

      // 1.3 Lấy Code Storyline
      const codeStorylines = row[h_movies['CODE STORYLINES']];

      // Thêm phim vào bản đồ cho diễn viên nam
      if (actorIdNam) {
        if (!moviesByActorId.has(actorIdNam)) {
          moviesByActorId.set(actorIdNam, []);
        }
        moviesByActorId.get(actorIdNam).push(movie);
      }
      
      // Thêm phim vào bản đồ cho diễn viên nữ
      if (actorIdNu) {
        if (!moviesByActorId.has(actorIdNu)) {
          moviesByActorId.set(actorIdNu, []);
        }
        moviesByActorId.get(actorIdNu).push(movie);
      }

      // Thêm phim vào bản đồ Couple
      if (codeCouples) {
        if (!moviesByCoupleCode.has(codeCouples)) {
          moviesByCoupleCode.set(codeCouples, []);
        }
        moviesByCoupleCode.get(codeCouples).push(movie);
      }
      
      // Thêm phim vào bản đồ Storyline
      if (codeStorylines) {
        if (!moviesByStorylineCode.has(codeStorylines)) {
          moviesByStorylineCode.set(codeStorylines, []);
        }
        moviesByStorylineCode.get(codeStorylines).push(movie);
      }
    });

    // --- BƯỚC 2: Xử lý sheet Diễn viên (PROFILE DIỄN VIÊN) ---
    const actorRows = actorSheet.getDataRange().getValues();
    const actorHeaders = actorRows.shift();
    const h_actors = createHeaderMap(actorHeaders);
    
    const allActors = actorRows.map(row => {
      const actorId = row[h_actors['ID']]; // Lấy ID của diễn viên
      const actor = {
        ten           : row[h_actors['TÊN DIỄN VIÊN']],
        namSinh       : row[h_actors['NĂM SINH']],
        profile       : row[h_actors['PROFILE']],
        albumAnh      : row[h_actors['ALBUM ẢNH']],
        youtube       : row[h_actors['DANH SÁCH PHÁT YOUTUBE']],
        blog          : row[h_actors['TỔNG HỢP CÁC BÀI VIẾT LIÊN QUAN TẠI BLOG']],
        id            : actorId,
        tenBinhAm     : row[h_actors['TÊN BÍNH ÂM']],
        ngaySinh      : row[h_actors['NGÀY SINH']],
        cungHoangDao  : row[h_actors['CUNG HOÀNG ĐẠO']],
        queQuan       : row[h_actors['QUÊ QUÁN']],
        hocVan        : row[h_actors['HỌC VẤN']],
        ngheNghiep    : row[h_actors['NGHỀ NGHIỆP']],
        weibo         : row[h_actors['WEIBO']],
        douyin        : row[h_actors['DOUYIN']],
        linkAnhProfile: row[h_actors['LINK ẢNH PROFILE']],
        tag           : row[h_actors['TAG']],
        gioiTinh      : row[h_actors['GENDER']],
        movies: moviesByActorId.get(actorId) || [] // Tra cứu O(1)
      };
      return actor;
    }).filter(actor => actor.ten && actor.id);

    // --- BƯỚC 3: Xử lý sheet Cặp đôi (#PHIMTHEOCẶPDIỄNVIÊN) ---
    const couplesRows = couplesSheet.getDataRange().getValues();
    const coupleHeaders = couplesRows.shift();
    const h_couples = createHeaderMap(coupleHeaders);

    const allCouples = couplesRows.map(row => {
      const code = row[h_couples['CODE']];
      const coupleInfo = {
        tenCouple: row[h_couples['TÊN COUPLE']],
        linkPost: row[h_couples['LINK POST']],
        tongSoPhim: row[h_couples['TỔNG SỐ PHIM ĐÃ HỢP TÁC']],
        tinhTrangCapNhat: row[h_couples['TÌNH TRẠNG CẬP NHẬT']],
        id: row[h_couples['ID']],
        code: code,
        movies: moviesByCoupleCode.get(code) || [] // Tra cứu O(1)
      };
      return coupleInfo;
    }).filter(couple => couple.id && couple.code);

    // --- BƯỚC 4: Xử lý sheet Cốt truyện (#PHIMCÙNGCỐTTRUYỆN) ---
    const storylineRows = storylineSheet.getDataRange().getValues();
    const storylineHeaders = storylineRows.shift();
    const h_storyline = createHeaderMap(storylineHeaders);

    const allStorylines = storylineRows
      .filter(row => 
        (row[h_storyline['ID']] && row[h_storyline['ID']].toString().trim() !== '') && 
        (row[h_storyline['THỂ LOẠI']] && row[h_storyline['THỂ LOẠI']].toString().trim() !== '') &&
        (row[h_storyline['CODE']] && row[h_storyline['CODE']].toString().trim() !== '')
      )
      .map(row => {
        const code = row[h_storyline['CODE']];
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
          movies: moviesByStorylineCode.get(code) || [] // Tra cứu O(1)
        };
        return storylineInfo;
      });

    // --- BƯỚC 5: Gộp tất cả dữ liệu và trả về ---
    const allData = {
      movies: allMoviesList, // <-- THÊM MỚI
      actors: allActors,
      couples: allCouples,
      storylines: allStorylines
    };

    return createJsonResponse({ status: 'success', data: allData });
    
  } catch (error) {
    console.error("Lỗi nghiêm trọng trong fetchAllDataForSearchCache: ", error);
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

/**
 * --- VẪN GIỮ LẠI HÀM NÀY ---
 * Chỉ dùng cho chức năng TÌM KIẾM (Search Bar)
 * Hàm này lấy tham số 'e' từ 'google.script.run'
 */
function getAllMovies(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MOVIE_SHEET_NAME_CACHE);
    if (!sheet) {
      throw new Error(`Không tìm thấy sheet có tên ${MOVIE_SHEET_NAME_CACHE}`);
    }

    const dataRows = sheet.getDataRange().getValues();
    const headers = dataRows.shift();
    const h = createHeaderMap(headers); 

    const searchQuery = e && e.parameter ? e.parameter.query : null;
    const searchScope = e && e.parameter ? e.parameter.scope : 'tenPhim';
    let processedData = dataRows;

    // --- LỌC DỮ LIỆU NẾU CÓ TỪ KHÓA TÌM KIẾM ---
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      processedData = dataRows.filter(row => {
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
      .map(row => createMovieObject(row, h))
      .filter(movie => searchQuery ? true : (movie.id && movie.id.toString().trim() !== ''));

    return createJsonResponse({ status: 'success', data: moviesData });
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}