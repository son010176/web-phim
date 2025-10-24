// src/pages/CoupleFilmMographyPage.js (Đã nâng cấp logic)

import React, { useState, useEffect } from "react";
import { data, useParams } from "react-router-dom";
import "./CoupleFilmMographyPage.css";
import ImageWithFallback from "../components/ImageWithFallback";
import MovieList from "../components/MovieList";
import { getCoupleProfile_CF } from "../services/api"; // <-- IMPORT API

// Nhận props từ App.js
function CoupleFilmMographyPage({ allCouples, isCacheReady }) {
  const { coupleId } = useParams();
  
  // State nội bộ để quản lý dữ liệu
  const [coupleData, setCoupleData] = useState(null); // { profile, movies }
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!coupleId) {
      setError("Không có coupleId.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // 1. Định nghĩa hàm gọi API
    const fetchProfileFromAPI = () => {
      console.log(`🌐 Gọi Cloudflare với coupleId: ${coupleId}`);
      getCoupleProfile_CF(coupleId) // Giả định hàm này gọi /api/couples/:id/profile
        .then(data => {
          // API trả về { status, couple: { ... } } }
          if (data && data.couple) {
             setCoupleData({
               profile: data.couple, // profile chứa { ...profile, movies: [...] }
               movies: data.couple.movies || []
             });
          } else {
            throw new Error("Cấu trúc dữ liệu API không hợp lệ.");
          }
        })
        .catch(err => {
          console.error("Lỗi khi gọi getCoupleProfile_CF:", err);
          setError(err.message || "Không tìm thấy couple (lỗi API).");
        })
        .finally(() => {
          setIsLoading(false);
        });
    };

    // 2. Kiểm tra Cache đã sẵn sàng chưa
    if (isCacheReady) {
      // 2a. Cache đã sẵn sàng, thử tìm trong cache
      const coupleFromCache = allCouples.find((c) => c.id === coupleId);

      if (coupleFromCache) {
        // TÌM THẤY TRONG CACHE -> Dùng cache
        console.log("🚀 Dùng cache (Google Sheet) - BỎ QUA API");
        setCoupleData({
          profile: coupleFromCache,
          movies: coupleFromCache.movies || []
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

  }, [coupleId, allCouples, isCacheReady]);

  // --- Logic Render ---
  if (isLoading) {
    return <div className="cf-loading">Đang tải dữ liệu...</div>;
  }
  if (error) {
    return <div className="cf-loading">{error}</div>; 
  }
  if (!coupleData || !coupleData.profile) {
    return <div className="cf-loading">Không tìm thấy thông tin cho cặp đôi này.</div>;
  }

  const { profile, movies } = coupleData;
  const couplePoster = movies.find((movie) => movie.linkPoster)?.linkPoster || null;

  return (
    <div className="main-content-section">
      <div className="cf-container">
        <div className="cf-header">
          <div className="cf-poster">
            <ImageWithFallback
              src={couplePoster}
              alt={`Poster của cặp đôi ${profile.tenCouple}`}
              type="movie"
            />
          </div>
          <div className="cf-info">
            <h1 className="cf-title">{profile.tenCouple}</h1>
            <div className="cf-meta">
              <span className="cf-meta-item">
                <strong>Tổng số phim hợp tác:</strong> {movies.length}
              </span>
              <span className="cf-meta-item">
                <strong>Tình trạng:</strong> {profile.tinhTrangCapNhat}
              </span>
              {profile.linkPost && (
                <a
                  href={profile.linkPost}
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
        
        <MovieList movies={movies} />

      </div>
    </div>
  );
}

export default CoupleFilmMographyPage;