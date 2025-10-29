// // File: collection.gs (Đã nâng cấp để dùng file DB riêng)

// // DÁN ID CỦA FILE GOOGLE SHEET MỚI VÀO ĐÂY
// const COLLECTION_DB_ID = "1vidUVpqs9_6Lj0v5Xrgjed0bdR24Q4_3rBw3hp_9ft0"; 
// const COLLECTION_SHEET_NAME = "BỘ SƯU TẬP";

// /**
//  * Mở file Spreadsheet của bộ sưu tập bằng ID.
//  * @returns {GoogleAppsScript.Spreadsheet.Sheet}
//  */
// function getCollectionSheet() {
//   try {
//     const db = SpreadsheetApp.openById(COLLECTION_DB_ID);
//     const sheet = db.getSheetByName(COLLECTION_SHEET_NAME);
//     if (!sheet) {
//       throw new Error(`Trong file DB mới, không tìm thấy sheet có tên "${COLLECTION_SHEET_NAME}"`);
//     }
//     return sheet;
//   } catch (e) {
//     throw new Error(`Không thể mở file DB của bộ sưu tập. Hãy kiểm tra lại COLLECTION_DB_ID. Lỗi gốc: ${e.message}`);
//   }
// }

// /**
//  * Thêm một bộ phim vào sheet Collection, có kiểm tra trùng lặp.
//  * @param {object} movieData - Dữ liệu của bộ phim cần thêm.
//  */
// function addToCollection(movieData, token) {
//   try {
//     const userEmail = getVerifiedUserEmail(token); // Xác thực người dùng
//     const sheet = getCollectionSheet();
//     const data = sheet.getDataRange().getValues();
//     const idColumnIndex = 8; // Cột I là ID
//     const emailColumnIndex = 17; // Cột R là USER EMAIL

//     const isExisting = data.some(row => row[idColumnIndex] === movieData.id && row[emailColumnIndex] === userEmail);
//     if (isExisting) {
//       // Trả về status 'info' để frontend biết phim đã tồn tại
//       return createJsonResponse({ status: 'info', message: `Phim đã có trong bộ sưu tập của bạn.` });
//     }
    
//     // Tạo một mảng 18 phần tử để khớp với số cột (A đến R)
//     const newRow = new Array(18).fill(''); 
//     newRow[0] = movieData.linkFbPost || '';
//     newRow[1] = movieData.tenViet || '';
//     newRow[2] = movieData.tenGoc || '';
//     newRow[3] = movieData.dienVienNam || '';
//     newRow[4] = movieData.dienVienNu || '';
//     newRow[5] = movieData.tags || '';
//     newRow[6] = movieData.code || '';
//     newRow[7] = movieData.tinhTrangLuuTru || '';
//     newRow[8] = movieData.id || '';
//     newRow[9] = movieData.theLoai || '';
//     newRow[10] = movieData.linkPoster || '';
//     newRow[11] = movieData.linkVideo || '';
//     newRow[12] = movieData.linkVideoMultiSub || '';
//     newRow[13] = movieData.linkFbVideo || '';
//     newRow[14] = movieData.linkGgDrive || '';
//     newRow[15] = movieData.linkKhac || '';
//     newRow[16] = movieData.moTa || '';
//     newRow[17] = userEmail; // Ghi email vào cột R
    
//     sheet.appendRow(newRow);
//     return createJsonResponse({ status: 'success', data: movieData, message: `Đã thêm phim vào bộ sưu tập.` });
//   } catch (error) {
//     return createJsonResponse({ status: 'error', message: error.toString() });
//   }
// }

// /**
//  * Lấy tất cả các phim từ sheet Collection với cấu trúc JSON chuẩn.
//  */
// function getCollection() {
//   try {
//     const sheet = getCollectionSheet();
//     const dataRows = sheet.getDataRange().getValues().slice(1);
//     const keys = [
//       'linkFbPost', 'tenViet', 'tenGoc', 'dienVienNam', 'dienVienNu', 'tags',
//       'code', 'tinhTrangLuuTru', 'id', 'theLoai', 'linkPoster', 'linkVideo',
//       'linkVideoMultiSub', 'linkFbVideo', 'linkGgDrive', 'linkKhac', 'moTa'
//     ];

//     const collectionData = dataRows.map(row => {
//       const movie = {};
//       keys.forEach((key, index) => {
//         movie[key] = row[index];
//       });
//       return movie;
//     }).filter(movie => movie.id);

//     return createJsonResponse({ status: 'success', data: collectionData });
//   } catch (error) {
//     return createJsonResponse({ status: 'error', message: error.toString() });
//   }
// }

// /**
//  * Xóa một bộ phim khỏi sheet Collection dựa trên ID.
//  * @param {object} payload - Đối tượng chứa ID của phim cần xóa.
//  */
// function removeFromCollection(payload) {
//   try {
//     const sheet = getCollectionSheet();
//     const movieIdToRemove = payload.id;
//     if (!movieIdToRemove) throw new Error("Cần cung cấp ID của phim để xóa.");

//     const data = sheet.getDataRange().getValues();
//     const idColumnIndex = 8;

//     for (let i = data.length - 1; i > 0; i--) {
//       if (data[i][idColumnIndex] === movieIdToRemove) {
//         sheet.deleteRow(i + 1);
//         return createJsonResponse({ status: 'success', message: `Đã xóa phim khỏi bộ sưu tập.` });
//       }
//     }
//     return createJsonResponse({ status: 'error', message: `Không tìm thấy phim có ID: ${movieIdToRemove} trong bộ sưu tập.` });
//   } catch (error) {
//     return createJsonResponse({ status: 'error', message: error.toString() });
//   }
// }