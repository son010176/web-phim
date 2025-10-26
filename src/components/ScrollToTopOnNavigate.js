// src/components/ScrollToTopOnNavigate.js
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Component này tự động cuộn cửa sổ lên đầu trang
 * mỗi khi người dùng chuyển sang một route (URL) mới.
 */
function ScrollToTopOnNavigate() {
  // Lấy thông tin về URL hiện tại
  const { pathname } = useLocation();

  // Chạy một effect mỗi khi 'pathname' (đường dẫn URL) thay đổi
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Component này không render ra bất cứ thứ gì
  return null;
}

export default ScrollToTopOnNavigate;