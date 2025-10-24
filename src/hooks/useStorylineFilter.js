// src/hooks/useStorylineFilter.js (Đã cập nhật)

import { useState, useMemo, useCallback } from 'react';

export function useStorylineFilter(allStorylines) {
  const [sortOrder, setSortOrder] = useState('default');
  // THÊM MỚI: State cho việc lọc thể loại
  const [selectedTheLoai, setSelectedTheLoai] = useState('Tất cả');

  const handleSortChange = useCallback((order) => {
    setSortOrder(order);
  }, []);

  // THÊM MỚI: Hàm để xử lý thay đổi bộ lọc thể loại
  const handleTheLoaiToggle = useCallback((theLoai) => {
    // Giống như lọc Nam/Nữ, chúng ta chỉ cho chọn 1 giá trị (hoặc 'Tất cả')
    setSelectedTheLoai(theLoai);
  }, []);

  // KẾT HỢP CẢ LỌC VÀ SẮP XẾP
  const filteredAndSortedStorylines = useMemo(() => {
    // 1. LỌC THEO THỂ LOẠI
    let filtered = allStorylines;
    if (selectedTheLoai !== 'Tất cả') {
      // Sử dụng key 'theLoai' như bạn đã chỉ định
      filtered = allStorylines.filter(storyline => storyline.theLoai === selectedTheLoai);
    }

    // 2. SẮP XẾP KẾT QUẢ ĐÃ LỌC
    const storylinesToSort = [...filtered];
    if (sortOrder === 'az') {
      return storylinesToSort.sort((a, b) => a.tenCouple.localeCompare(b.tenCouple, 'vi'));
    }
    if (sortOrder === 'za') {
      return storylinesToSort.sort((a, b) => b.tenCouple.localeCompare(a.tenCouple, 'vi'));
    }
    
    return storylinesToSort; // Trả về mảng đã được lọc và/hoặc sắp xếp
  }, [selectedTheLoai, sortOrder, allStorylines]); // Thêm selectedTheLoai vào dependencies

  return {
    displayStorylines: filteredAndSortedStorylines, // Đổi tên từ sortedStorylines
    sortOrder,
    handleSortChange,
    selectedTheLoai,    // Trả về state mới
    handleTheLoaiToggle // Trả về hàm xử lý mới
  };
}