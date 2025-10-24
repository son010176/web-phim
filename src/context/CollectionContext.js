// src/context/CollectionContext.js
import React, { useContext, useState, useEffect, createContext } from 'react';
import { useAuth } from './AuthContext'; // Phụ thuộc vào AuthContext
import { useNotification } from './NotificationContext'; // Phụ thuộc vào NotificationContext
import { 
  getCollection, 
  addToCollection, 
  removeFromCollection 
} from '../services/api'; // Gọi API

const CollectionContext = createContext();

export function useCollection() {
  return useContext(CollectionContext);
}

export function CollectionProvider({ children }) {
  const [collection, setCollection] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { currentUser } = useAuth();
  const { addNotification } = useNotification();

  // 1. Effect để TẢI bộ sưu tập khi user thay đổi
  useEffect(() => {
    if (currentUser) {
      setIsLoading(true);
      console.log("User đăng nhập, đang tải bộ sưu tập...");
      getCollection(currentUser.email)
        .then(data => {
          setCollection(data.movies || []); // data là { movies: [...] }
        })
        .catch(err => {
          console.error("Lỗi khi tải bộ sưu tập:", err);
          addNotification("Không thể tải bộ sưu tập.", "error");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // User đăng xuất, xóa bộ sưu tập
      setCollection([]);
      setIsLoading(false);
    }
  }, [currentUser]); // Chỉ chạy lại khi currentUser thay đổi

  // 2. Hàm để THÊM phim
  const addMovieToCollection = async (movie) => {
    if (!currentUser) {
      addNotification("Vui lòng đăng nhập để thêm phim!", "error");
      return;
    }

    // Kiểm tra xem đã có trong bộ sưu tập chưa
    if (collection.some(item => item.id === movie.id)) {
      addNotification("Phim đã có trong bộ sưu tập.", "info");
      return;
    }

    // Lọc dữ liệu gửi đi (theo schema của migrate_local.js)
    const movieDataForCollection = {
      id: movie.id,
      tenViet: movie.tenViet || '',
      tenGoc: movie.tenGoc || '',
      dienVienNam: movie.dienVienNam || '',
      dienVienNu: movie.dienVienNu || '',
      theLoai: movie.theLoai || '',
      linkPoster: movie.linkPoster || '',
    };

    try {
      // Cập nhật giao diện trước (Optimistic Update)
      setCollection(prev => [...prev, movieDataForCollection]);
      addNotification("Đã thêm vào Bộ sưu tập!", "success");

      // Gọi API trong nền
      await addToCollection(currentUser.email, movieDataForCollection);
      console.log("Đồng bộ thêm phim thành công.");
    } catch (err) {
      console.error("Lỗi khi thêm phim:", err);
      addNotification("Lỗi: Không thể thêm phim.", "error");
      // Rollback nếu lỗi
      setCollection(prev => prev.filter(item => item.id !== movie.id));
    }
  };

  // 3. Hàm để XÓA phim
  const removeMovieFromCollection = async (movieId) => {
    if (!currentUser) {
      addNotification("Lỗi: Không tìm thấy người dùng.", "error");
      return;
    }

    const movieToRemove = collection.find(m => m.id === movieId);
    if (!movieToRemove) return;

    try {
      // Cập nhật giao diện trước (Optimistic Update)
      setCollection(prev => prev.filter(item => item.id !== movieId));
      addNotification("Đã xóa khỏi Bộ sưu tập.", "success");
      
      // Gọi API trong nền
      await removeFromCollection(currentUser.email, movieId);
      console.log("Đồng bộ xóa phim thành công.");
    } catch (err) {
      console.error("Lỗi khi xóa phim:", err);
      addNotification("Lỗi: Không thể xóa phim.", "error");
      // Rollback nếu lỗi
      setCollection(prev => [...prev, movieToRemove]);
    }
  };

  const value = {
    collection,
    isLoadingCollection: isLoading,
    addMovieToCollection,
    removeMovieFromCollection,
    // Hàm check nhanh
    isMovieInCollection: (movieId) => collection.some(m => m.id === movieId)
  };

  return (
    <CollectionContext.Provider value={value}>
      {children}
    </CollectionContext.Provider>
  );
}