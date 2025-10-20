// File: utils.gs

function clearCache() {
  CacheService.getScriptCache().removeAll(['all_movies_data', 'all_actors_data']);
  console.log('Đã xóa cache thành công!');
}

function getActualLastRow(sheet) {
  const allData = sheet.getDataRange().getValues();
  for (let i = allData.length - 1; i >= 0; i--) {
    const rowString = allData[i].join('').trim();
    if (rowString !== "") { return i + 1; }
  }
  return 1;
}

/**
 * Hàm tiện ích để tạo phản hồi JSON.
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}


// Các hàm createSlug
/** @customfunction */
function createSlug(input) {
  if (!input) return "";
  if (input.map) {
    return input.map(row => row.map(cell => createSlugLogic(cell)));
  } else {
    return createSlugLogic(input);
  }
}

/**
 * Tạo slug URL-friendly từ việc ghép hai dải ô.
 * Ví dụ: =createSlug(C2:C, H2:H)
 * @param {any[][]} input1 Dải ô thứ nhất (ví dụ: C2:C).
 * @param {any[][]} input2 Dải ô thứ hai (ví dụ: H2:H).
 * @return Giá trị slug hoặc một mảng các giá trị slug.
 * @customfunction
 */
function createSlug2code(input1, input2) {
  // Trường hợp xử lý cho dải ô (Array Formula)
  if (input1.map && input2.map) {
    return input1.map((row, i) => {
      // Lấy giá trị từ ô tương ứng của mỗi dải ô
      const cell1 = row[0] || ''; 
      const cell2 = (input2[i] && input2[i][0]) ? input2[i][0] : '';

      // Ghép hai giá trị lại, có một khoảng trắng ở giữa và loại bỏ khoảng trắng thừa
      const combinedText = (cell1 + ' ' + cell2).trim();

      // Trả về một mảng chứa kết quả, để Google Sheets tự động "tràn" dữ liệu
      return [createSlugLogic(combinedText)];
    });
  } 
  // Trường hợp xử lý cho ô đơn lẻ
  else {
    const combinedText = (String(input1 || '') + ' ' + String(input2 || '')).trim();
    return createSlugLogic(combinedText);
  }
}

function createSlugLogic(inputText) {
  if (typeof inputText !== 'string' || inputText.trim() === '') return '';
  let slug = inputText.toLowerCase();
  slug = slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  slug = slug.replace(/đ/g, 'd');
  slug = slug.replace(/\s+/g, '-');
  slug = slug.replace(/[^a-z0-9-]/g, '');
  slug = slug.replace(/-+/g, '-');
  slug = slug.replace(/^-|-$/g, '');
  return slug;
}

// --- HÀM MỚI ĐỂ XÁC THỰC FIREBASE TOKEN ---
function getGooglePublicKeys() {
  const cache = CacheService.getScriptCache();
  const cachedKeys = cache.get('google_public_keys');
  if (cachedKeys) return JSON.parse(cachedKeys);
  const response = UrlFetchApp.fetch("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com");
  const keys = JSON.parse(response.getContentText());
  cache.put('google_public_keys', JSON.stringify(keys), 21600);
  return keys;
}

function getVerifiedUserEmail(idToken) {
  if (!idToken) {
    throw new Error("Người dùng chưa đăng nhập. Yêu cầu bị từ chối.");
  }
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) throw new Error("Token không hợp lệ.");
    const header = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString());
    const payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[1])).getDataAsString());
    const signature = Utilities.base64DecodeWebSafe(parts[2]);
    const dataToVerify = Utilities.newBlob(parts[0] + '.' + parts[1]).getBytes();
    const keys = getGooglePublicKeys();
    const publicKey = keys[header.kid];
    if (!publicKey) throw new Error("Không tìm thấy khóa công khai phù hợp.");
    const isValidSignature = Utilities.verifyRsaSha256Signature(dataToVerify, signature, publicKey);
    if (!isValidSignature) throw new Error("Chữ ký token không hợp lệ.");
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) throw new Error("Token đã hết hạn.");
    // THAY THẾ 'web-phim-user' BẰNG PROJECT ID FIREBASE CỦA BẠN
    if (payload.aud !== 'web-phim-user') { 
      throw new Error("Đối tượng token (aud) không hợp lệ. Hãy kiểm tra lại Project ID.");
    }
    console.log(`Yêu cầu được xác thực cho: ${payload.email}`);
    return payload.email;
  } catch (e) {
    throw new Error(`Xác thực token thất bại: ${e.message}`);
  }
}


