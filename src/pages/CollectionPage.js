// src/pages/CollectionPage.js
import React, { useState } from "react";
import MovieList from "../components/MovieList";
import { removeFromCollection } from "../services/api";
import ConfirmModal from "../components/ConfirmModal";

import "./CollectionPage.css";

function CollectionPage({ collection, setCollection }) {
  // State để quản lý trạng thái của modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State để lưu ID của phim sắp bị xóa
  const [movieToDelete, setMovieToDelete] = useState(null);
  /**
   * Mở modal xác nhận và lưu ID phim khi người dùng bấm nút X.
   * @param {string} movieId - ID của phim cần xóa.
   */
  // 1. Hàm này sẽ được gọi khi người dùng bấm nút X
  const handleRemoveClick = (movieId) => {
    setMovieToDelete(movieId); // Lưu lại ID phim cần xóa
    setIsModalOpen(true); // Mở modal xác nhận
  };

  // 2. Hàm này sẽ được gọi khi người dùng bấm nút "Xác nhận" trên modal
  const handleConfirmRemove = () => {
    if (movieToDelete) {
      const movieToRemoveId = movieToDelete;

      // ---- BƯỚC 1: CẬP NHẬT GIAO DIỆN NGAY LẬP TỨC (OPTIMISTIC UPDATE) ----
      // Xóa phim khỏi state để giao diện cập nhật ngay, không cần chờ server.
      setCollection((prevCollection) =>
        prevCollection.filter((movie) => movie.id !== movieToRemoveId)
      );
      // Đóng modal ngay lập tức.
      handleCloseModal();

      // ---- BƯỚC 2: GỬI YÊU CẦU TỚI SERVER TRONG NỀN ----
      // Gọi API nhưng không dùng `await` để nó không làm giao diện bị trễ.
      // Chúng ta chỉ bắt lỗi nếu có sự cố về mạng.
      removeFromCollection(movieToRemoveId).catch((error) => {
        console.error("Lỗi mạng khi xóa phim:", error);
        // Trong trường hợp lỗi, bạn có thể cân nhắc việc thêm phim trở lại danh sách
        // và thông báo cho người dùng, nhưng điều này hiếm khi xảy ra.
        alert(
          "Lỗi: Không thể đồng bộ hóa việc xóa với máy chủ. Vui lòng kiểm tra lại sau."
        );
      });
    }
  };

  // 3. Hàm này được gọi khi người dùng bấm "Hủy" hoặc click ra ngoài
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setMovieToDelete(null);
  };

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
