/**
 * Định dạng ngày tháng về dạng DD/MM/YYYY.
 * Hỗ trợ:
 *  - Firestore timestamp ("2000-05-10T00:00:00Z")
 *  - Chuỗi ngày kiểu "18.08.1998" hoặc "18/08/1998"
 *  - Đối tượng Firestore Timestamp (nếu dùng SDK)
 * @param {any} inputDate - Chuỗi, số, hoặc object ngày tháng.
 * @returns {string} - Chuỗi ngày DD/MM/YYYY hoặc "Chưa rõ" / "Ngày không hợp lệ".
 */
export const formatDate = (inputDate) => {
  if (!inputDate) return 'Chưa rõ';

  try {
    let dateObj = null;

    // 🧩 1. Nếu là đối tượng Firestore Timestamp (có .seconds)
    if (typeof inputDate === 'object' && inputDate.seconds) {
      dateObj = new Date(inputDate.seconds * 1000);
    }
    // 🧩 2. Nếu là chuỗi ISO hoặc timestampValue
    else if (typeof inputDate === 'string' && inputDate.includes('T')) {
      dateObj = new Date(inputDate);
    }
    // 🧩 3. Nếu là chuỗi ngày kiểu "18.08.1998" hoặc "18/08/1998"
    else if (typeof inputDate === 'string') {
      const normalized = inputDate.replace(/\./g, '/'); // thay "." bằng "/"
      const parts = normalized.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts.map(p => parseInt(p, 10));
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          dateObj = new Date(year, month - 1, day);
        }
      }
    }

    // 🧩 4. Nếu vẫn chưa xác định được
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      return 'Ngày không hợp lệ';
    }

    // ✅ Trả về dạng DD/MM/YYYY theo chuẩn Việt Nam
    return dateObj.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Lỗi định dạng ngày:', error);
    return 'Ngày không hợp lệ';
  }
};
