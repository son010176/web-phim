// File: utils.gs

/**
 * --- HELPER 1: Tạo đối tượng map từ tên header sang chỉ số cột ---
 */
function createHeaderMap(headers) {
  const map = {};
  headers.forEach((header, index) => {
    map[header.trim()] = index;
  });
  return map;
}

/**
 * --- HELPER 2: Tạo đối tượng movie từ 1 hàng dữ liệu và header map ---
 */
function createMovieObject(row, h) {
  // Lấy dữ liệu từ header map của sheet TỔNG HỢP
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

function clearCache() {
  CacheService.getScriptCache().removeAll(['all_movies_data', 'all_actors_data']);
  console.log('Đã xóa cache thành công!');
}

/**
 * Đếm số hàng có dữ liệu trong một vùng từ cột A đến S,
 * có thể trừ đi một số hàng tùy ý.
 * Nhập =countRowsSheet(Sheet1!A2:S, 2) sẽ trừ đi 2 trước khi trả về
 *
 * @param {range} input - Vùng dữ liệu từ sheet nguồn
 * @param {number} subtract - Số hàng muốn trừ đi (tùy chọn, mặc định 0)
 * @return {number} Số hàng có ít nhất 1 ô dữ liệu sau khi trừ
 * @customfunction
 */
function countRowsSheet(input, subtract) {
  if (!input) return 0;

  subtract = subtract || 0; // mặc định 0 nếu không nhập

  let count = 0;

  // Nếu input là 2D array
  if (input.map) {
    input.forEach(row => {
      if (row.some(cell => cell !== "" && cell !== null)) {
        count++;
      }
    });
  } else {
    // Trường hợp chỉ 1 ô
    if (input !== "" && input !== null) count = 1;
  }

  // Trừ đi số hàng nếu có
  count = count - subtract;

  // Không trả về số âm
  return count < 0 ? 0 : count;
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
 * Hàm tiện ích để tạo phản hồi JSON với CORS headers
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Các hàm createSlug
/** @customfunction */
function createSlug(input) {
  // Lấy danh sách ignore từ các tham số tiếp theo
  var ignoreList = [];
  if (arguments.length > 1) {
    for (var i = 1; i < arguments.length; i++) {
      var v = arguments[i];
      if (v !== undefined && v !== null && v !== "") {
        ignoreList.push(String(v).trim().toLowerCase());
      }
    }
  }

  if (!input) return "";
  if (Array.isArray(input)) {
    return input.map(row => row.map(cell => createSlugLogic(cell, ignoreList)));
  } else {
    return createSlugLogic(input, ignoreList);
  }
}

/**
 * Tạo slug URL-friendly từ việc ghép hai dải ô.
 */
function createSlug2code(input1, input2) {
  if (input1.map && input2.map) {
    return input1.map((row, i) => {
      const cell1 = row[0] || ''; 
      const cell2 = (input2[i] && input2[i][0]) ? input2[i][0] : '';
      const combinedText = (cell1 + ' ' + cell2).trim();
      return [createSlugLogic(combinedText)];
    });
  } else {
    const combinedText = (String(input1 || '') + ' ' + String(input2 || '')).trim();
    return createSlugLogic(combinedText);
  }
}

function createSlugLogic(inputText, ignoreList) {
  if (typeof inputText !== 'string' || inputText.trim() === '') return '';
  let slug = inputText.toLowerCase();
  slug = slug.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // bỏ dấu tiếng Việt
  slug = slug.replace(/đ/g, 'd');
  slug = slug.replace(/\s+/g, '-'); // thay khoảng trắng bằng dấu gạch
  slug = slug.replace(/[^a-z0-9-]/g, ''); // bỏ ký tự đặc biệt
  slug = slug.replace(/-+/g, '-'); // bỏ gạch nối thừa
  slug = slug.replace(/^-|-$/g, ''); // bỏ gạch ở đầu/cuối

  // Nếu slug thuộc danh sách bỏ qua thì trả về rỗng
  if (ignoreList && ignoreList.includes(slug)) {
    return '';
  }

  return slug;
}

// --- HÀM XÁC THỰC FIREBASE TOKEN ---
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
    
    if (payload.aud !== 'web-phim-user') { 
      throw new Error("Đối tượng token (aud) không hợp lệ. Hãy kiểm tra lại Project ID.");
    }
    
    console.log(`Yêu cầu được xác thực cho: ${payload.email}`);
    return payload.email;
    
  } catch (e) {
    throw new Error(`Xác thực token thất bại: ${e.message}`);
  }
}

/** @customfunction */
function removeCPPrefixSuffix(input) {
  if (!input) return "";
  if (Array.isArray(input)) {
    return input.map(row => row.map(cell => removeCPPrefixSuffixLogic(cell)));
  } else {
    return removeCPPrefixSuffixLogic(input);
  }
}

function removeCPPrefixSuffixLogic(text) {
  if (typeof text !== 'string') return '';
  // Xóa tiền tố "CP" ở đầu và hậu tố là số ở cuối
  return text.replace(/^CP/, '').replace(/\d+$/, '');
}

/** @customfunction */
function slugToUppercase(input) {
  // Lấy danh sách ignore từ các tham số tiếp theo
  var ignoreList = [];
  if (arguments.length > 1) {
    for (var i = 1; i < arguments.length; i++) {
      var v = arguments[i];
      if (v !== undefined && v !== null) {
        ignoreList.push(String(v).trim().toLowerCase());
      }
    }
  }

  if (input === undefined || input === null || input === '') return "";

  if (Array.isArray(input)) {
    // input là 2D array từ range: giữ cùng kích thước
    return input.map(function(row) {
      return row.map(function(cell) {
        return slugToUppercaseLogic(cell, ignoreList);
      });
    });
  } else {
    return slugToUppercaseLogic(input, ignoreList);
  }
}

function slugToUppercaseLogic(text, ignoreList) {
  if (text === undefined || text === null) return '';
  if (typeof text !== 'string') text = String(text);

  var original = text.trim();
  var lowerOriginal = original.toLowerCase();

  // Nếu khớp với danh sách ignore (so sánh bằng lower-trim) -> trả rỗng
  if (ignoreList && ignoreList.length > 0) {
    for (var i = 0; i < ignoreList.length; i++) {
      if (lowerOriginal === ignoreList[i]) {
        return '';
      }
    }
  }

  var t = original;

  // Nếu bắt đầu bằng "cp-" (không phân biệt hoa thường) thì loại bỏ phần "cp-"
  if (lowerOriginal.startsWith('cp-')) {
    t = t.slice(3); // cắt bỏ "cp-"
  }

  // Bỏ dấu gạch ngang và chuyển thành chữ hoa
  return t.replace(/-/g, '').toUpperCase();
}


/** @customfunction */
function createSlug2UpperCode(input1, input2) {
  if (input1.map && input2.map) {
    // Nếu là mảng (nhiều dòng)
    return input1.map((row, i) => {
      const cell1 = row[0] || ''; 
      const cell2 = (input2[i] && input2[i][0]) ? input2[i][0] : '';
      const combinedText = (cell1 + ' ' + cell2).trim();
      return [createSlug2UpperCodeLogic(combinedText)];
    });
  } else {
    // Nếu chỉ là 1 ô đơn
    const combinedText = (String(input1 || '') + ' ' + String(input2 || '')).trim();
    return createSlug2UpperCodeLogic(combinedText);
  }
}

function createSlug2UpperCodeLogic(text) {
  if (typeof text !== 'string' || text.trim() === '') return '';

  // Dùng lại logic bỏ dấu, chuẩn hóa
  let slug = createSlugLogic(text);

  // Bỏ gạch nối và chuyển thành chữ hoa
  return slug.replace(/-/g, '').toUpperCase();
}

/** @customfunction */
function filterByWordCount(input, maxWords) {
  maxWords = (typeof maxWords === 'number' && !isNaN(maxWords)) ? maxWords : 3;
  if (Array.isArray(input)) {
    return input.map(row => row.map(cell => filterByWordCountLogic(cell, maxWords)));
  } else {
    return filterByWordCountLogic(input, maxWords);
  }
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Build a unicode-aware regex for a sensitive phrase that allows combining marks
function buildSensitiveRegex(phrase) {
  // Normalize to NFD so diacritics are separate (helps pattern building)
  const norm = phrase.normalize('NFD');
  let pat = '';
  for (const ch of norm) {
    if (/\p{L}/u.test(ch)) {
      // letter: allow following combining marks (\p{M}*) for diacritics
      pat += escapeRegex(ch) + '\\p{M}*';
    } else if (/\s/u.test(ch)) {
      pat += '\\s+'; // any whitespace between words
    } else {
      pat += escapeRegex(ch);
    }
  }
  // Ensure not part of a longer word: use unicode-aware lookaround
  return new RegExp('(?<!\\p{L})' + pat + '(?!\\p{L})', 'giu');
}

function filterByWordCountLogic(text, maxWords) {
  if (!text || typeof text !== 'string') return '';

  // 1) Normalize (compose) for consistent handling
  let cleaned = text.normalize('NFC');

  // 2) Remove zero-width / invisible characters often used for obfuscation
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // 3) Remove punctuation inserted between letters (e.g. g.i.ế.t, c.h.ế.t, t-ự)
  //    This targets sequences like letter [./-…]+ letter and collapses them.
  // Loại bỏ mọi dấu chấm giữa các chữ cái (xử lý liên tục)
  while (/(\p{L})[.\-\/·\u2024\uFE52\u2027\u00B7]+(\p{L})/u.test(cleaned)) {
    cleaned = cleaned.replace(/(\p{L})[.\-\/·\u2024\uFE52\u2027\u00B7]+(\p{L})/gu, '$1$2');
  }


  // 4) Normalize multiple punctuation sequences (in case of repeated patterns)
  //    Repeat a few times to ensure sequences like g.i.ế.t become giết
  for (let i = 0; i < 3; i++) {
    cleaned = cleaned.replace(/(\p{L})\.?(\p{L})/gu, '$1$2');
  }

  // 5) Define sensitive phrases (bạn có thể thêm/bớt)
  const sensitiveList = [
    'tự sát',
    'tự tử',
    'giết chết',
    'chết'
  ];

  // 6) Remove sensitive phrases using unicode-aware regex.
  //    Replace bằng 1 khoảng trắng để tránh dính chữ liền nhau.
  sensitiveList.forEach(function(phrase) {
    const re = buildSensitiveRegex(phrase);
    cleaned = cleaned.replace(re, ' ');
  });

  // 7) Now split only by dot (.) which are sentence separators
  const parts = cleaned
    .split(/\./)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  // 8) Filter by word count (count words after removing punctuation except letters/numbers)
  const filtered = parts.filter(function(p) {
    // Remove punctuation except letters/numbers and spaces for accurate word count
    const normalizedForCount = p.replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = normalizedForCount.length === 0 ? 0 : normalizedForCount.split(' ').filter(Boolean).length;
    return wordCount <= maxWords;
  });

  // 9) Join results cleanly
  return filtered.join(', ');
}
