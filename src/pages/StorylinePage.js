// src/pages/StorylinePage.js (Đã thêm Infinite Scroll)

import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import "./StorylinePage.css";
import ImageWithFallback from "../components/ImageWithFallback";
import SortDropdown from "../components/SortDropdown";
import Pagination from "../components/Pagination";

const ITEMS_PER_PAGE = 20; // Trang này item cao hơn nên tải ít hơn mỗi lần

function StorylinePage({ storylines, sortOrder, onSortChange }) {
  const [currentPage, setCurrentPage] = useState(1);

// THAY ĐỔI: Reset về trang 1
  useEffect(() => {
    setCurrentPage(1);
  }, [storylines]);

  if (!storylines || storylines.length === 0) {
    return <div className="sl-loading">Đang tải danh sách...</div>;
  }

  // --- LOGIC PHÂN TRANG MỚI ---
  const totalPages = Math.ceil(storylines.length / ITEMS_PER_PAGE);
  const currentStorylines = storylines.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

return (
    <div className="main-content-section">
      <div className="sl-container">
        <h1 className="sl-main-title section-title">
          Tổng Hợp Phim Cùng Cốt Truyện
        </h1>
        <div className="controls-wrapper">
          <SortDropdown
            currentSortOrder={sortOrder}
            onSortChange={onSortChange}
          />
        </div>

        {storylines.length === 0 ? (
          <p>Không có mục nào.</p>
        ) : (
          <>
            <div className="sl-list">
              {/* THAY ĐỔI: Sử dụng currentStorylines */}
              {currentStorylines.map((item) => {
                const movies = item.movies || [];
                const storylinePoster = movies.find(movie => movie.linkPoster)?.linkPoster || null;

                return (
                  <Link
                    to={`/phim-couples/${item.id}`}
                    key={item.id}
                    className="sl-item-link"
                  >
                    <div className="sl-item-card">
                      <div className="sl-item-poster">
                        <ImageWithFallback
                          src={storylinePoster}
                          alt={`Poster của ${item.tenCouple}`}
                          type="movie"
                        />
                      </div>
                      <div className="sl-item-info">
                        <h3 className="sl-item-title">{item.tenCouple}</h3>
                        <p className="sl-item-novel">{item.tieuThuyetGoc}</p>
                        <p className="sl-item-tags">{item.tagTheLoai}</p>
                        <div className="sl-item-meta">
                          <span>{item.tongSoPhienBan} phiên bản</span>
                          <span
                            className={`sl-item-status ${item.tinhTrangCapNhat?.toLowerCase()}`}
                          >
                            {item.tinhTrangCapNhat}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            {/* THÊM MỚI: Thanh phân trang */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default StorylinePage;