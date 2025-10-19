// src/pages/Home.js (Đã cập nhật)

import React, { useState, useEffect, memo } from "react";
import DropdownFilter from "../components/DropdownFilter";
import SortDropdown from "../components/SortDropdown";
import MovieList from "../components/MovieList";
import Pagination from "../components/Pagination"; // THÊM MỚI
import "./Home.css";

// Biến có thể tùy chỉnh số lượng phim trên mỗi trang
const MOVIES_PER_PAGE = 40;

function Home({ movies, genres, selectedGenres, onGenreToggle, sortOrder, onSortChange }) {
  const showControls = onGenreToggle && onSortChange;
  const [currentPage, setCurrentPage] = useState(1); // THAY ĐỔI: State cho trang hiện tại

  // THAY ĐỔI: Reset về trang 1 mỗi khi danh sách phim thay đổi (do lọc, sắp xếp)
  useEffect(() => {
    setCurrentPage(1);
  }, [movies]);

  // --- LOGIC PHÂN TRANG MỚI ---
  const totalPages = Math.ceil(movies.length / MOVIES_PER_PAGE);
  const currentMovies = movies.slice(
    (currentPage - 1) * MOVIES_PER_PAGE,
    currentPage * MOVIES_PER_PAGE
  );

  return (
    <div className="home-content">
      <main className="movie-list-section">
        {showControls && (
          <div className="controls-wrapper">
            <DropdownFilter
              genres={genres}
              selectedGenres={selectedGenres}
              onGenreToggle={onGenreToggle}
            />
            <SortDropdown
              currentSortOrder={sortOrder}
              onSortChange={onSortChange}
            />
          </div>
        )}
        
        {/* THAY ĐỔI: Hiển thị phim của trang hiện tại */}
        <MovieList movies={currentMovies} />

        {/* THÊM MỚI: Hiển thị thanh phân trang */}
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />

      </main>
      <footer className="main-footer">
        <p>
          &copy; {new Date().getFullYear()} Phim Ngắn. Mọi quyền được bảo lưu.
        </p>
      </footer>
    </div>
  );
}

export default memo(Home);