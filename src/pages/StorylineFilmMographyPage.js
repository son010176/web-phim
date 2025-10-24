// src/pages/StorylineFilmMographyPage.js (Đã nâng cấp logic)

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./StorylineFilmMographyPage.css";
import ImageWithFallback from "../components/ImageWithFallback";
import MovieList from "../components/MovieList";
import { getStorylineProfile_CF } from "../services/api"; // <-- IMPORT API

// Nhận props từ App.js
function StorylineFilmMographyPage({ allStorylines, isCacheReady }) {
  const { storylineId } = useParams();
  
  // State nội bộ để quản lý dữ liệu
  const [storylineData, setStorylineData] = useState(null); // { profile, movies }
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!storylineId) {
      setError("Không có storylineId.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // 1. Định nghĩa hàm gọi API
    const fetchProfileFromAPI = () => {
      console.log(`🌐 Gọi Cloudflare với storylineId: ${storylineId}`);
      getStorylineProfile_CF(storylineId) // Giả định hàm này gọi /api/storylines/:id/profile
        .then(data => {
          // API trả về { status, storyline: { ... } } }
          if (data && data.storyline) {
             setStorylineData({
               profile: data.storyline, 
               movies: data.storyline.movies || []
             });
          } else {
            throw new Error("Cấu trúc dữ liệu API không hợp lệ.");
          }
        })
        .catch(err => {
          console.error("Lỗi khi gọi getStorylineProfile_CF:", err);
          setError(err.message || "Không tìm thấy storyline (lỗi API).");
        })
        .finally(() => {
          setIsLoading(false);
        });
    };

    // 2. Kiểm tra Cache đã sẵn sàng chưa
    if (isCacheReady) {
      // 2a. Cache đã sẵn sàng, thử tìm trong cache
      const storylineFromCache = allStorylines.find((s) => s.id === storylineId);

      if (storylineFromCache) {
        // TÌM THẤY TRONG CACHE -> Dùng cache
        console.log("🚀 Dùng cache (Google Sheet) - BỎ QUA API");
        setStorylineData({
          profile: storylineFromCache,
          movies: storylineFromCache.movies || []
        });
        setIsLoading(false);
      } else {
        // 2b. KHÔNG TÌM THẤY TRONG CACHE -> Vẫn gọi API
        fetchProfileFromAPI();
      }
    } else {
      // 3. CACHE CHƯA SẴN SÀNG (isCacheReady = false)
      // Đây là trường hợp RELOAD (F5). Gọi API ngay lập tức.
      fetchProfileFromAPI();
    }

  }, [storylineId, allStorylines, isCacheReady]);

  // --- Logic Render ---
  if (isLoading) {
    return <div className="sf-loading">Đang tải dữ liệu...</div>;
  }
  if (error) {
    return <div className="sf-loading">{error}</div>; 
  }
  if (!storylineData || !storylineData.profile) {
    return <div className="sf-loading">Không tìm thấy thông tin cho cốt truyện này.</div>;
  }

  const { profile, movies } = storylineData;
  const storylinePoster = movies.find((movie) => movie.linkPoster)?.linkPoster || null;

  return (
    <div className="main-content-section">
      <div className="sf-container">
        <div className="sf-header">
          <div className="sf-poster">
            <ImageWithFallback
              src={storylinePoster}
              alt={`Poster của ${profile.tenCouple}`}
              type="movie"
            />
          </div>
          <div className="sf-info">
            <h1 className="sf-title">{profile.tenCouple}</h1>
            <p className="sf-novel-title">
              <strong>Tiểu thuyết gốc:</strong> {profile.tieuThuyetGoc || "Chưa rõ"}
            </p>
            <div className="sf-meta">
              <span className="sf-meta-item">
                <strong>Tổng số phiên bản:</strong> {profile.tongSoPhienBan}
              </span>
              <span className="sf-meta-item">
                <strong>Tình trạng:</strong> {profile.tinhTrangCapNhat}
              </span>
              {profile.linkPost && (
                <a
                  href={profile.linkPost}
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
        <MovieList movies={movies} />
        
      </div>
    </div>
  );
}

export default StorylineFilmMographyPage;