// src/pages/StorylineFilmMographyPage.js (Đã tái cấu trúc)

import React from "react";
import { useParams } from "react-router-dom";
import "./StorylineFilmMographyPage.css";
import ImageWithFallback from "../components/ImageWithFallback";
import MovieList from "../components/MovieList"; // Import component MovieList

function StorylineFilmMographyPage({ allStorylines }) {
  const { storylineId } = useParams();
  const storylineInfo = allStorylines.find((s) => s.id === storylineId);

  if (!allStorylines || allStorylines.length === 0) {
    return <div className="sf-loading">Đang tải dữ liệu...</div>;
  }

  if (!storylineInfo) {
    return <div className="sf-loading">Không tìm thấy thông tin cho cốt truyện này.</div>;
  }

  const movies = storylineInfo.movies || [];
  const storylinePoster = movies.find((movie) => movie.linkPoster)?.linkPoster || null;

  return (
    <div className="main-content-section">
      <div className="sf-container">
        <div className="sf-header">
          <div className="sf-poster">
            <ImageWithFallback
              src={storylinePoster}
              alt={`Poster của ${storylineInfo.tenCouple}`}
              type="movie"
            />
          </div>
          <div className="sf-info">
            <h1 className="sf-title">{storylineInfo.tenCouple}</h1>
            <p className="sf-novel-title">
              <strong>Tiểu thuyết gốc:</strong> {storylineInfo.tieuThuyetGoc || "Chưa rõ"}
            </p>
            <div className="sf-meta">
              <span className="sf-meta-item">
                <strong>Tổng số phiên bản:</strong> {storylineInfo.tongSoPhienBan}
              </span>
              <span className="sf-meta-item">
                <strong>Tình trạng:</strong> {storylineInfo.tinhTrangCapNhat}
              </span>
              {storylineInfo.linkPost && (
                <a
                  href={storylineInfo.linkPost}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sf-meta-button"
                >
                  Xem bài viết tổng hợp
                </a>
              )}
            </div>
          </div>
        </div>

        <h2 className="section-title">Các phiên bản phim</h2>

        {/* Thay thế bằng component MovieList */}
        <MovieList movies={movies} />
        
      </div>
    </div>
  );
}

export default StorylineFilmMographyPage;