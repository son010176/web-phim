// File: actors.gs (Đã cập nhật để dùng sheet "PROFILE DIỄN VIÊN")

/**
 * Lấy danh sách TẤT CẢ diễn viên từ sheet "PROFILE DIỄN VIÊN" duy nhất.
 */
function getAllActors() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetActors = ss.getSheetByName("PROFILE DIỄN VIÊN"); // THAY ĐỔI 1: Lấy từ sheet mới
    const sheetPhim = ss.getSheetByName("TỔNG HỢP");

    if (!sheetActors || !sheetPhim) {
      throw new Error("Không tìm thấy một trong các sheet cần thiết: PROFILE DIỄN VIÊN, TỔNG HỢP.");
    }

    // Lấy dữ liệu phim một lần duy nhất để tối ưu
    const moviesData = sheetPhim.getDataRange().getValues();
    const movieHeaders = moviesData[0];
    const dienVienNamIndex = movieHeaders.indexOf('NAM DIỄN VIÊN');
    const dienVienNuIndex = movieHeaders.indexOf('NỮ DIỄN VIÊN');

    // THAY ĐỔI 2: Xử lý trực tiếp trên sheet diễn viên đã gộp
    const dataRows = sheetActors.getDataRange().getValues().slice(1);

    const allActors = dataRows.map(row => {
      const actor = {
        ten           : row[0],  // Cột A: TÊN DIỄN VIÊN
        namSinh       : row[1],  // Cột B: NĂM SINH
        profile       : row[2],  // Cột C: PROFILE
        albumAnh      : row[3],  // Cột D: ALBUM ẢNH
        youtube       : row[4],  // Cột E: DANH SÁCH PHÁT YOUTUBE
        blog          : row[5],  // Cột F: TỔNG HỢP CÁC BÀI VIẾT...
        id            : row[6],  // Cột G: ID
        tenBinhAm     : row[7],  // Cột H: TÊN BÍNH ÂM
        ngaySinh      : row[8],  // Cột I: NGÀY SINH
        cungHoangDao  : row[9],  // Cột J: CUNG HOÀNG ĐẠO
        queQuan       : row[10], // Cột K: QUÊ QUÁN
        hocVan        : row[11], // Cột L: HỌC VẤN
        ngheNghiep    : row[12], // Cột M: NGHỀ NGHIỆP
        weibo         : row[13], // Cột N: WEIBO
        douyin        : row[14], // Cột O: DOUYIN
        linkAnhProfile: row[15], // Cột P: LINK ẢNH PROFILE
        tag           : row[16], // Cột Q: TAG
        gioiTinh      : row[17]  // THAY ĐỔI 3: Lấy giới tính từ cột R
      };

      // Phần tìm phim của diễn viên giữ nguyên, không thay đổi
      const actorName = actor.ten;
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
      actor.movies = actorMovies;
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