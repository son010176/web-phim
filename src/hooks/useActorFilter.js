// src/hooks/useActorFilter.js

import { useState, useMemo, useCallback } from 'react';

export function useActorFilter(allActors) {
  // THÊM MỚI: State cho việc lọc giới tính
  const [selectedGender, setSelectedGender] = useState('Tất cả');
  const [sortOrder, setSortOrder] = useState('default');

  // THÊM MỚI: Hàm để xử lý thay đổi bộ lọc giới tính
  const handleGenderToggle = useCallback((gender) => {
    // Với bộ lọc này, chúng ta chỉ cho chọn 1 giá trị tại một thời điểm
    setSelectedGender(gender);
  }, []);

  const handleSortChange = useCallback((order) => {
    setSortOrder(order);
  }, []);

  // KẾT HỢP CẢ LỌC VÀ SẮP XẾP
  const filteredAndSortedActors = useMemo(() => {
    // 1. LỌC THEO GIỚI TÍNH
    let filtered = allActors;
    if (selectedGender !== 'Tất cả') {
      // Giả sử mỗi object actor có thuộc tính `gioiTinh` là "Nam" hoặc "Nữ"
      filtered = allActors.filter(actor => actor.gioiTinh === selectedGender);
    }

    // 2. SẮP XẾP KẾT QUẢ ĐÃ LỌC
    const actorsToSort = [...filtered];
    if (sortOrder === 'az') {
      return actorsToSort.sort((a, b) => a.ten.localeCompare(b.ten, 'vi'));
    }
    if (sortOrder === 'za') {
      return actorsToSort.sort((a, b) => b.ten.localeCompare(a.ten, 'vi'));
    }
    
    return actorsToSort; // Trả về mảng đã được lọc và/hoặc sắp xếp
  }, [selectedGender, sortOrder, allActors]);

  return {
    displayActors: filteredAndSortedActors,
    sortOrder,
    handleSortChange,
    selectedGender,      // Trả về state giới tính
    handleGenderToggle   // Trả về hàm xử lý
  };
}