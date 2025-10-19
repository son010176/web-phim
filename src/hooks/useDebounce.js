// src/hooks/useDebounce.js

import { useState, useEffect } from 'react';

/**
 * Custom hook để trì hoãn việc cập nhật một giá trị.
 * @param {any} value - Giá trị cần trì hoãn (ví dụ: searchQuery).
 * @param {number} delay - Thời gian trì hoãn (tính bằng mili giây).
 * @returns {any} - Giá trị đã được trì hoãn.
 */
function useDebounce(value, delay) {
  // State để lưu trữ giá trị đã bị trì hoãn
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Thiết lập một bộ đếm thời gian (timer)
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Dọn dẹp timer mỗi khi value hoặc delay thay đổi
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Chỉ chạy lại effect nếu value hoặc delay thay đổi

  return debouncedValue;
}

export default useDebounce;