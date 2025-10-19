
export const createSlug = (text) => {
  if (!text) return '';
  // Luôn chỉ lấy phần tên trước dấu ngoặc đơn
  const namePart = text.split('(')[0].trim();

  return namePart
    .toString()
    .toLowerCase()
    .normalize('NFD') // Tách các ký tự có dấu thành ký tự cơ bản và dấu
    .replace(/[\u0300-\u036f]/g, '') // Xóa tất cả các dấu đã được tách ra
    .replace(/đ/g, 'd') // Thay chữ 'đ'
    .replace(/\s+/g, '-') // Thay khoảng trắng bằng dấu gạch ngang
    .replace(/[^\w\-]+/g, '') // Xóa tất cả các ký tự không phải là chữ, số, hoặc gạch ngang
    .replace(/\-\-+/g, '-') // Thay thế nhiều dấu gạch ngang liền nhau bằng một
    .replace(/^-+/, '') // Xóa gạch ngang ở đầu
    .replace(/-+$/, ''); // Xóa gạch ngang ở cuối
};