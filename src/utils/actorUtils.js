// src/utils/actorUtils.js

/**
 * Tách tên diễn viên thành phần tiếng Việt và tiếng Hán (nếu có).
 * @param {string} fullName - Tên đầy đủ của diễn viên.
 * @returns {{vietnameseName: string, chineseName: string}} - Object chứa tên tiếng Việt và tiếng Hán.
 */
export const splitActorName = (fullName) => {
  if (!fullName) {
    return { vietnameseName: '', chineseName: '' };
  }
  // Tìm vị trí ký tự Hán đầu tiên bằng Regex (Unicode property escapes)
  const match = fullName.match(/(\p{Script=Han})/u);
  const firstHanIndex = match ? match.index : -1;

  if (firstHanIndex !== -1) {
    // Nếu tìm thấy, tách chuỗi
    const vietnameseName = fullName.substring(0, firstHanIndex).trim();
    const chineseName = fullName.substring(firstHanIndex).trim();
    return { vietnameseName, chineseName };
  } else {
    // Nếu không có ký tự Hán, trả về tên đầy đủ là tên tiếng Việt
    return { vietnameseName: fullName.trim(), chineseName: '' };
  }
};

// Bạn có thể thêm các hàm tiện ích khác liên quan đến diễn viên vào đây sau này