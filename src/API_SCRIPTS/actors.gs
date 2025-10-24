// File: actors.gs (ĐÃ TỐI ƯU HOÀN TOÀN)

const ACTORS_SHEET_NAME = "PROFILE DIỄN VIÊN";
const MOVIE_SHEET_NAME_ACTORS = "TỔNG HỢP"; // Đặt tên khác để tránh xung đột

/**
 * --- HELPER 1: Tạo đối tượng map từ tên header sang chỉ số cột ---
 * (Sao chép từ movies.gs để file này hoạt động độc lập)
 */
function createHeaderMap_Actors(headers) {
  const map = {};
  headers.forEach((header, index) => {
    map[header.trim()] = index;
  });
  return map;
}

/**
 * --- HELPER 2: Tạo đối tượng movie từ 1 hàng dữ liệu và header map ---
 * (Sao chép từ movies.gs để file này hoạt động độc lập)
 */
function createMovieObject_Actors(row, h) {
  return {
    linkFbPost: row[h['LINK POST FACEBOOK']],
    tenViet: row[h['TỰA DỊCH SANG TIẾNG VIỆT']],
    tenGoc: row[h['TỰA GỐC TIẾNG TRUNG']],
    dienVienNam: row[h['NAM DIỄN VIÊN']],
    dienVienNu: row[h['NỮ DIỄN VIÊN']],
    tags: row[h['TAG THỂ LOẠI']],
    code: row[h['CODE']],
    tinhTrangLuuTru: row[h['TÌNH TRẠNG LƯU TRỮ']],
    id: row[h['ID']],
    theLoai: row[h['THỂ LOẠI CHÍNH']],
    linkPoster: row[h['LINK POSTER']],
    linkVideo: row[h['LINK YOUTUBE THUYẾT MINH']],
    linkVideoMultiSub: row[h['LINK YOUTUBE MULTISUB']],
    linkFbVideo: row[h['LINK FACEBOOK THUYẾT MINH']],
    linkGgDrive: row[h['LINK GOOGLE DRIVE']],
    linkKhac: row[h['LINK KHÁC']],
    moTa: row[h['GIỚI THIỆU']],
    idDienVienNam: row[h['ID DIỄN VIÊN NAM']],
    idDienVienNu: row[h['ID DIỄN VIÊN NỮ']],
    codeCouples: row[h['CODE COUPLES']],
    codeStorylines: row[h['CODE STORYLINES']],
  };
}


/**
 * --- ĐÃ VIẾT LẠI HOÀN TOÀN ---
 * Lấy danh sách TẤT CẢ diễn viên, kèm phim của họ.
 * Tối ưu bằng cách dùng Lookup Map (Hash Map) thay vì vòng lặp lồng nhau.
 */
function getAllActors() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetActors = ss.getSheetByName(ACTORS_SHEET_NAME);
    const sheetPhim = ss.getSheetByName(MOVIE_SHEET_NAME_ACTORS);

    if (!sheetActors || !sheetPhim) {
      throw new Error("Không tìm thấy một trong các sheet cần thiết: PROFILE DIỄN VIÊN, TỔNG HỢP.");
    }

    // --- BƯỚC 1: Xử lý sheet Phim (TỔNG HỢP) ---
    const moviesData = sheetPhim.getDataRange().getValues();
    const movieHeaders = moviesData.shift();
    const h_movies = createHeaderMap_Actors(movieHeaders);

    // Tạo "Bản đồ tra cứu"
    // Key: actorId (ví dụ: "an-tu-duong")
    // Value: [danh sách các object phim]
    const moviesByActorId = new Map();

    moviesData.forEach(row => {
      const movie = createMovieObject_Actors(row, h_movies);
      
      // Lấy 2 ID diễn viên từ phim
      const actorIdNam = row[h_movies['ID DIỄN VIÊN NAM']];
      const actorIdNu = row[h_movies['ID DIỄN VIÊN NỮ']];

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
    });

    // --- BƯỚC 2: Xử lý sheet Diễn viên (PROFILE DIỄN VIÊN) ---
    const dataRows = sheetActors.getDataRange().getValues();
    const actorHeaders = dataRows.shift();
    const h_actors = createHeaderMap_Actors(actorHeaders);
    
    const allActors = dataRows.map(row => {
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
        // Tra cứu O(1) siêu nhanh
        movies: moviesByActorId.get(actorId) || []
      };
      
      return actor;

    }).filter(actor => actor.ten && actor.id); // Lọc bỏ các hàng trống

    return createJsonResponse({ status: 'success', data: allActors });
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}


/**
 * Lấy thông tin profile của một diễn viên cụ thể và các phim họ đã tham gia.
 * @param {string} slug - ID (slug) của diễn viên cần tìm.
 */
function getActorProfile(slug) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetActors = ss.getSheetByName("PROFILE DIỄN VIÊN"); // THAY ĐỔI 1: Lấy từ sheet mới
    const sheetPhim = ss.getSheetByName("TỔNG HỢP");

    if (!sheetActors || !sheetPhim) {
      throw new Error("Không tìm thấy một trong các sheet cần thiết: PROFILE DIỄN VIÊN, TỔNG HỢP.");
    }
    
    // THAY ĐỔI 2: Tìm diễn viên trong sheet duy nhất
    const data = sheetActors.getDataRange().getValues();
    const rowData = data.slice(1).find(row => row[6] === slug); // Tìm hàng có slug ở cột G

    if (!rowData) {
      return createJsonResponse({ status: 'error', message: `Không tìm thấy diễn viên với slug: ${slug}` });
    }

    // Ánh xạ dữ liệu từ hàng tìm được
    const actorProfile = {
      ten           : rowData[0],  // Cột A
      namSinh       : rowData[1],  // Cột B
      profile       : rowData[2],  // Cột C
      albumAnh      : rowData[3],  // Cột D
      youtube       : rowData[4],  // Cột E
      blog          : rowData[5],  // Cột F
      id            : rowData[6],  // Cột G
      tenBinhAm     : rowData[7],  // Cột H
      ngaySinh      : rowData[8],  // Cột I
      cungHoangDao  : rowData[9],  // Cột J
      queQuan       : rowData[10], // Cột K
      hocVan        : rowData[11], // Cột L
      ngheNghiep    : rowData[12], // Cột M
      weibo         : rowData[13], // Cột N
      douyin        : rowData[14], // Cột O
      linkAnhProfile: rowData[15], // Cột P
      tag           : rowData[16], // Cột Q
      gioiTinh      : rowData[17]  // THAY ĐỔI 3: Lấy giới tính từ cột R
    };
    
    const actorName = actorProfile.ten;

    // Phần tìm danh sách phim giữ nguyên logic
    const moviesData = sheetPhim.getDataRange().getValues();
    const movieHeaders = moviesData[0];
    const dienVienNamIndex = movieHeaders.indexOf('NAM DIỄN VIÊN');
    const dienVienNuIndex = movieHeaders.indexOf('NỮ DIỄN VIÊN');
    const actorMovies = [];

    if (actorName) {
      for (let i = 1; i < moviesData.length; i++) {
        const movieRow = moviesData[i];
        const dvNam = movieRow[dienVienNamIndex] || '';
        const dvNu = movieRow[dienVienNuIndex] || '';

        if (dvNam.includes(actorName) || dvNu.includes(actorName)) {
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
          actorMovies.push(movie);
        }
      }
    }

    // Gộp lại và trả về
    return createJsonResponse({
      status: 'success',
      data: {
        profile: actorProfile,
        movies: actorMovies
      }
    });

  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.message });
  }
}