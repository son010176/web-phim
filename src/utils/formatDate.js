/**
 * Chuyển đổi một chuỗi ngày tháng ISO thành định dạng DD/MM/YYYY.
 * @param {string} isoString - Chuỗi ngày tháng theo định dạng ISO (ví dụ: "1995-02-05T08:00:00.000Z").
 * @returns {string} - Chuỗi ngày tháng đã được định dạng hoặc "Chưa rõ" nếu đầu vào không hợp lệ.
 */
export const formatDate = (isoString) => {
  // Trả về "Chưa rõ" nếu không có dữ liệu đầu vào
  if (!isoString) {
    return 'Chưa rõ';
  }

  try {
    const date = new Date(isoString);
    
    // Kiểm tra xem date có phải là một ngày hợp lệ không
    if (isNaN(date.getTime())) {
        return 'Ngày không hợp lệ';
    }

    // Sử dụng toLocaleDateString để định dạng theo chuẩn Việt Nam (DD/MM/YYYY)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error("Lỗi định dạng ngày:", error);
    return 'Ngày không hợp lệ';
  }
};