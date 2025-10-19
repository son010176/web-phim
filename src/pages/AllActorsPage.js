// src/pages/AllActorsPage.js (Đã thêm Infinite Scroll)

import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import "./AllActorsPage.css";
import ImageWithFallback from "../components/ImageWithFallback";
import { createSlug } from "../utils/createSlug";
import { formatDate } from "../utils/formatDate";
import SortDropdown from "../components/SortDropdown";
import DropdownFilter from "../components/DropdownFilter";
import Pagination from "../components/Pagination";

const ITEMS_PER_PAGE = 40; // Tùy chỉnh số lượng diễn viên trên mỗi trang

function AllActorsPage({ allActors, sortOrder, onSortChange, selectedGender, onGenderToggle }) {
  const [currentPage, setCurrentPage] = useState(1);

  // THAY ĐỔI: Reset về trang 1 khi danh sách diễn viên thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [allActors]);

  if (!allActors) {
    return <div className="aa-loading">Đang tải danh sách diễn viên...</div>;
  }

  const GenderFilter = () => {
    const handleSelect = (gender) => {
      onGenderToggle(gender);
    };
    return (
      <DropdownFilter
        genres={['Nam', 'Nữ']}
        selectedGenres={[selectedGender]}
        onGenreToggle={handleSelect}
      />
    );
  };

  // --- LOGIC PHÂN TRANG MỚI ---
  const totalPages = Math.ceil(allActors.length / ITEMS_PER_PAGE);
  const currentActors = allActors.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

return (
    <div className="main-content-section">
      <div className="aa-container">
        <h1 className="section-title">Danh Sách Diễn Viên</h1>
        <div className="controls-wrapper">
          <GenderFilter />
          <SortDropdown
            currentSortOrder={sortOrder}
            onSortChange={onSortChange}
          />
        </div>

        {allActors.length === 0 ? (
            <p>Không có diễn viên nào.</p>
        ) : (
            <>
              <div className="movie-list">
                {/* THAY ĐỔI: Sử dụng currentActors */}
                {currentActors.map((actor) => (
                  <Link
                    to={`/dien-vien/${createSlug(actor.ten)}`}
                    key={actor.id}
                    className="movie-card-link"
                  >
                    <div className="movie-card">
                      <ImageWithFallback
                        src={actor.linkAnhProfile}
                        alt={`Ảnh của ${actor.ten}`}
                        type="user"
                      />
                      <div className="movie-info">
                        <h3 className="movie-title" title={actor.ten}>
                          {actor.ten}
                        </h3>
                        <div className="aa-actor-meta">
                          <p className="aa-info-item" title={actor.tenBinhAm}>
                            {actor.tenBinhAm}
                          </p>
                          <p className="aa-info-item">{formatDate(actor.ngaySinh)}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
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

export default AllActorsPage;