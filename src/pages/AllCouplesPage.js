// src/pages/AllCouplesPage.js (Đã thêm Infinite Scroll)

import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import "./AllCouplesPage.css";
import ImageWithFallback from "../components/ImageWithFallback";
import SortDropdown from "../components/SortDropdown";
import Pagination from "../components/Pagination";

const ITEMS_PER_PAGE = 40; // Tùy chỉnh số lượng cặp đôi trên mỗi trang

function AllCouplesPage({ allCouples, sortOrder, onSortChange }) {
  const [currentPage, setCurrentPage] = useState(1);

// THAY ĐỔI: Reset về trang 1
  useEffect(() => {
    setCurrentPage(1);
  }, [allCouples]);

  if (!allCouples || allCouples.length === 0) {
    return <div className="ac-loading">Đang tải danh sách...</div>;
  }

  // --- LOGIC PHÂN TRANG MỚI ---
  const totalPages = Math.ceil(allCouples.length / ITEMS_PER_PAGE);
  const currentCouples = allCouples.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

return (
    <div className="main-content-section">
      <div className="ac-container">
        <h1 className="ac-main-title section-title">
          Tổng Hợp Phim Theo Cặp Đôi
        </h1>
        <div className="controls-wrapper">
          <SortDropdown
            currentSortOrder={sortOrder}
            onSortChange={onSortChange}
          />
        </div>
        {allCouples.length === 0 ? (
          <p>Không có cặp đôi nào.</p>
        ) : (
          <>
            <div className="movie-list">
              {/* THAY ĐỔI: Sử dụng currentCouples */}
              {currentCouples.map((couple) => {
                const couplePoster =
                  couple.movies && couple.movies.length > 0
                    ? couple.movies[0].linkPoster
                    : null;

                return (
                  <Link
                    to={`/dien-vien-couples/${couple.id}`}
                    key={couple.id}
                    className="movie-card-link"
                  >
                    <div className="movie-card">
                      <ImageWithFallback
                        src={couplePoster}
                        alt={`Poster của ${couple.tenCouple}`}
                        type="movie"
                      />
                      <div className="movie-info">
                        <h3 className="movie-title" title={couple.tenCouple}>
                          {couple.tenCouple}
                        </h3>
                        <div className="ac-card-meta">
                          <span>{couple.tongSoPhim} phim</span>
                          <span
                            className={`ac-card-status ${couple.tinhTrangCapNhat?.toLowerCase()}`}
                          >
                            {couple.tinhTrangCapNhat}
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

export default AllCouplesPage;