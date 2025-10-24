// src/pages/CollectionPage.js
import React, { useState } from "react";
import MovieList from "../components/MovieList";
// import { removeFromCollection } from "../services/api"; // Không cần nữa
import ConfirmModal from "../components/ConfirmModal";
import { useCollection } from "../context/CollectionContext"; // <-- IMPORT CONTEXT
import { useAuth } from "../context/AuthContext"; // Import để kiểm tra login
import { Link } from "react-router-dom"; // Import Link

import "./CollectionPage.css";

// SỬA: Xóa props collection, setCollection
function CollectionPage() {
  // Lấy state từ Context
  const { 
    collection, 
    removeMovieFromCollection, 
    isLoadingCollection 
  } = useCollection();
  
  const { currentUser } = useAuth(); // Kiểm tra user

  // State để quản lý trạng thái của modal (giữ nguyên)
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State để lưu ID của phim sắp bị xóa
  const [movieToDelete, setMovieToDelete] = useState(null);

  /**
   * Mở modal xác nhận và lưu ID phim khi người dùng bấm nút X.
   * @param {string} movieId - ID của phim cần xóa.
   */
  // 1. Hàm này sẽ được gọi khi người dùng bấm nút X (giữ nguyên)
  const handleRemoveClick = (movieId) => {
    setMovieToDelete(movieId); // Lưu lại ID phim cần xóa
    setIsModalOpen(true); // Mở modal xác nhận
  };

  // 2. Hàm này sẽ được gọi khi người dùng bấm nút "Xác nhận" trên modal
  const handleConfirmRemove = () => {
    if (movieToDelete) {
      // Gọi hàm xóa từ context
      // Toàn bộ logic (optimistic update, gọi API, rollback)
      // đã được xử lý bên trong context.
      removeMovieFromCollection(movieToDelete);
      
      // Đóng modal
      handleCloseModal();
    }
  };

  // 3. Hàm này được gọi khi người dùng bấm "Hủy" hoặc click ra ngoài (giữ nguyên)
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setMovieToDelete(null);
  };

  // --- LOGIC RENDER MỚI ---

  if (!currentUser) {
    return (
      <div className="main-content-section">
        <p className="empty-collection-message">
          Vui lòng <Link to="/login">đăng nhập</Link> để xem bộ sưu tập của bạn.
        </p>
      </div>
    );
  }

  if (isLoadingCollection) {
     return (
      <div className="main-content-section">
        <h1 className="section-title">
          Bộ Sưu Tập Của Tôi
        </h1>
        <p className="empty-collection-message">
          Đang tải bộ sưu tập...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="main-content-section">
        <h1 className="section-title">
          Bộ Sưu Tập Của Tôi ({collection.length})
        </h1>
        {collection.length > 0 ? (
          // SỬA ĐỔI: Truyền `handleRemoveClick` xuống
          <MovieList movies={collection} onRemoveMovie={handleRemoveClick} />
        ) : (
          <p className="empty-collection-message">
            Bộ sưu tập của bạn đang trống. Hãy thêm những bộ phim bạn yêu thích!
          </p>
        )}
      </div>
      <ConfirmModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmRemove}
        title="Xóa Phim"
      >
        <p>Bạn có chắc chắn muốn xóa phim này khỏi bộ sưu tập?</p>
      </ConfirmModal>
    </>
  );
}

export default CollectionPage;