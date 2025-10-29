/**
 * Tạo link CDN cho danh sách tên với base URL tùy chọn
 * @param {Range} names Vùng dữ liệu cột chứa tên (vd: A2:A)
 * @param {string} baseUrl URL gốc (vd: "https://.../DV%20Nu/")
 * @return {Array} Mảng chứa các link CDN tương ứng
 * @customfunction
 */
function createLinkCdn(names, baseUrl) {
  if (!baseUrl || baseUrl === "") {
    baseUrl = "https://pub-6e6e6da137784e94b05c24f4d74e1db4.r2.dev/image_profile_actor/DV%20Nu/";
  }
  // Đảm bảo baseUrl kết thúc bằng "/"
  if (!baseUrl.endsWith("/")) baseUrl += "/";

  // Nếu chỉ 1 ô
  if (!Array.isArray(names)) {
    if (!names || names === "") return "";
    return baseUrl + encodeURIComponent(names.trim()) + ".webp";
  }

  // Nếu là mảng nhiều ô
  return names.map(row => {
    const name = row[0];
    if (!name || name === "") return [""];
    return [baseUrl + encodeURIComponent(name.trim()) + ".webp"];
  });
}
