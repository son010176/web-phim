// src/components/ImageWithFallback.js

import React from 'react';

// Import các icon một lần duy nhất tại đây
import UserSolidIcon from '../assets/icons/user-solid-full.svg';
import FilmSolidIcon from '../assets/icons/film-solid-full.svg';

/**
 * Component thông minh tự động hiển thị ảnh thật hoặc icon mặc định.
 * @param {string} src - Đường link ảnh.
 * @param {string} alt - Văn bản thay thế cho ảnh.
 * @param {string} type - Loại ảnh ('movie' hoặc 'user') để chọn icon mặc định.
 * @param {string} className - Class CSS để tùy chỉnh style từ bên ngoài.
 */
function ImageWithFallback({ src, alt, type, className }) {
  // Nếu không có src, xác định icon mặc định cần dùng
  if (!src) {
    const fallbackIcon = type === 'user' ? UserSolidIcon : FilmSolidIcon;
    const fallbackAlt = type === 'user' ? 'Default user avatar' : 'Default movie poster';
    
    // Thêm một class chung 'default-icon' để dễ dàng styling
    const finalClassName = `${className} default-icon`;

    return <img src={fallbackIcon} alt={fallbackAlt} className={finalClassName} />;
  }

  // Nếu có src, hiển thị ảnh bình thường
  return <img src={src} alt={alt} className={className} />;
}

export default ImageWithFallback;