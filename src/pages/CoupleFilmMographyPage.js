// src/pages/CoupleFilmMographyPage.js (Đã tái cấu trúc)

import React from "react";
import { useParams } from "react-router-dom";
import "./CoupleFilmMographyPage.css";
import ImageWithFallback from "../components/ImageWithFallback";
import MovieList from "../components/MovieList"; // Import component MovieList

function CoupleFilmMographyPage({ allCouples }) {
  const { coupleId } = useParams();
  const coupleInfo = allCouples.find((c) => c.id === coupleId);

  if (!allCouples || allCouples.length === 0) {
    return <div className="cf-loading">Đang tải dữ liệu...</div>;
  }

  if (!coupleInfo) {
    return <div className="cf-loading">Không tìm thấy thông tin cho cặp đôi này.</div>;
  }

  const movies = coupleInfo.movies || [];
  const couplePoster = movies.find((movie) => movie.linkPoster)?.linkPoster || null;

  return (
    <div className="main-content-section">
      <div className="cf-container">
        <div className="cf-header">
          <div className="cf-poster">
            <ImageWithFallback
              src={couplePoster}
              alt={`Poster của cặp đôi ${coupleInfo.tenCouple}`}
              type="movie"
            />
          </div>
          <div className="cf-info">
            <h1 className="cf-title">{coupleInfo.tenCouple}</h1>
            <div className="cf-meta">
              <span className="cf-meta-item">
                <strong>Tổng số phim hợp tác:</strong> {movies.length}
              </span>
              <span className="cf-meta-item">
                <strong>Tình trạng:</strong> {coupleInfo.tinhTrangCapNhat}
              </span>
              {coupleInfo.linkPost && (
                <a
                  href={coupleInfo.linkPost}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cf-meta-button"
                >
                  Xem bài viết tổng hợp
                </a>
              )}
            </div>
          </div>
        </div>

        <h2 className="section-title">Các phim đã hợp tác</h2>
        
        {/* Thay thế bằng component MovieList */}
        <MovieList movies={movies} />

      </div>
    </div>
  );
}

export default CoupleFilmMographyPage;