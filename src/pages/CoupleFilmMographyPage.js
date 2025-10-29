// src/pages/CoupleFilmMographyPage.js (Đã sửa logic, dựa trên ActorProfilePage)

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./CoupleFilmMographyPage.css";
import ImageWithFallback from "../components/ImageWithFallback";
import MovieList from "../components/MovieList";
import { getCoupleProfile_CF } from "../services/api"; // <-- IMPORT API

// Nhận props từ App.js (giống ActorProfilePage)
function CoupleFilmMographyPage({ fullCache, isFullDataReady }) {
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
    setCoupleData(null); // Xóa data cũ

    let foundInCache = false;

    // --- BƯỚC 1: Ưu tiên kiểm tra Full Cache ---
    // Chỉ kiểm tra nếu cờ isFullDataReady là true và fullCache có dữ liệu couples
    if (isFullDataReady && fullCache?.couples) {
      console.log(`CoupleProfile: Kiểm tra Full Cache (IndexedDB) cho ID: ${coupleId}`);
      // Tìm couple trong cache bằng ID
      const coupleFromCache = fullCache.couples.find((c) => c.id === coupleId);

      // Kiểm tra xem dữ liệu cache có đủ chi tiết không
      // (Giả định full cache luôn có 'movies')
      if (coupleFromCache && coupleFromCache.movies !== undefined) {
        console.log("🚀 CoupleProfile: Tìm thấy dữ liệu đầy đủ trong Full Cache.");
        // Gán dữ liệu từ cache vào state
        setCoupleData({
          profile: coupleFromCache,
          movies: coupleFromCache.movies || [] // Đảm bảo movies là mảng
        });
        foundInCache = true; // Đánh dấu đã tìm thấy
        setIsLoading(false); // Ngừng loading
      } else {
         console.log("ℹ️ CoupleProfile: Không tìm thấy trong Full Cache (hoặc cache không đủ chi tiết).");
      }
    } else {
       console.log("ℹ️ CoupleProfile: Full Cache chưa sẵn sàng hoặc không có dữ liệu couples.");
    }

    // --- BƯỚC 2: Gọi API Cloudflare nếu không tìm thấy trong cache ---
    // Chỉ gọi API nếu chưa tìm thấy trong cache (foundInCache === false)
    if (!foundInCache) {
      console.log(`☁️ CoupleProfile: Gọi Cloudflare API cho ID: ${coupleId}`);
      getCoupleProfile_CF(coupleId) // Giả định hàm này gọi /api/couples/:id/profile
        .then(data => {
          // API Cloudflare trả về { status, data: { couple: { ... } } }
          if (data && data.couple) {
             console.log("✅ CoupleProfile: API Cloudflare thành công.");
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
    }

  }, [coupleId, fullCache, isFullDataReady]); // <-- Phản ứng với cờ FullData

  // --- Logic Render ---
  if (isLoading) {
    // return <div className="cf-loading">Đang tải dữ liệu...</div>;
    return <div className="loading-indicator">Đang tải dữ liệu...</div>;
  }
  if (error) {
    // return <div className="cf-loading">{error}</div>; 
    return <div className="loading-indicator">{error}</div>;

  }
  if (!coupleData || !coupleData.profile) {
    // return <div className="cf-loading">Không tìm thấy thông tin cho cặp đôi này.</div>;
    return <div className="loading-indicator">Không tìm thấy thông tin cho cặp đôi này.</div>;
  }

  const { profile, movies } = coupleData;
  // Lấy poster từ phim đầu tiên trong danh sách (nếu có)
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