// src/pages/StorylineFilmMographyPage.js (Đã sửa logic, dựa trên ActorProfilePage)

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./StorylineFilmMographyPage.css";
import ImageWithFallback from "../components/ImageWithFallback";
import MovieList from "../components/MovieList";
import { getStorylineProfile_CF } from "../services/api"; // <-- IMPORT API

// Nhận props từ App.js (giống ActorProfilePage)
function StorylineFilmMographyPage({ fullCache, isFullDataReady }) {
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
    setStorylineData(null); // Xóa data cũ

    let foundInCache = false;

    // --- BƯỚC 1: Ưu tiên kiểm tra Full Cache ---
    // Chỉ kiểm tra nếu cờ isFullDataReady là true và fullCache có dữ liệu storylines
    if (isFullDataReady && fullCache?.storylines) {
      console.log(`StorylineProfile: Kiểm tra Full Cache (IndexedDB) cho ID: ${storylineId}`);
      // Tìm storyline trong cache bằng ID
      const storylineFromCache = fullCache.storylines.find((s) => s.id === storylineId);

      // Kiểm tra xem dữ liệu cache có đủ chi tiết không
      // (Giả định full cache luôn có 'movies')
      if (storylineFromCache && storylineFromCache.movies !== undefined) {
        // TÌM THẤY TRONG CACHE -> Dùng cache
        console.log("🚀 StorylineProfile: Tìm thấy dữ liệu đầy đủ trong Full Cache.");
        setStorylineData({
          profile: storylineFromCache,
          movies: storylineFromCache.movies || [] // Đảm bảo movies là mảng
        });
        foundInCache = true; // Đánh dấu đã tìm thấy
        setIsLoading(false); // Ngừng loading
      } else {
         console.log("ℹ️ StorylineProfile: Không tìm thấy trong Full Cache (hoặc cache không đủ chi tiết).");
      }
    } else {
       console.log("ℹ️ StorylineProfile: Full Cache chưa sẵn sàng hoặc không có dữ liệu storylines.");
    }


    // --- BƯỚC 2: Gọi API Cloudflare nếu không tìm thấy trong cache ---
    // Chỉ gọi API nếu chưa tìm thấy trong cache (foundInCache === false)
    if (!foundInCache) {
      console.log(`☁️ StorylineProfile: Gọi Cloudflare API cho ID: ${storylineId}`);
      getStorylineProfile_CF(storylineId) // Giả định hàm này gọi /api/storylines/:id/profile
        .then(data => {
          // API Cloudflare trả về { status, data: { storyline: { ... } } }
          if (data && data.storyline) {
             console.log("✅ StorylineProfile: API Cloudflare thành công.");
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
    }

  }, [storylineId, fullCache, isFullDataReady]); // <-- Phản ứng với cờ FullData

  // --- Logic Render ---
  if (isLoading) {
    // return <div className="sf-loading">Đang tải dữ liệu...</div>;
    return <div className="loading-indicator">Đang tải dữ liệu...</div>;
  }
  if (error) {
    // return <div className="sf-loading">{error}</div>; 
    return <div className="loading-indicator">{error}</div>;
  }
  if (!storylineData || !storylineData.profile) {
    // return <div className="sf-loading">Không tìm thấy thông tin cho cốt truyện này.</div>;
    return <div className="loading-indicator">Không tìm thấy thông tin cho cốt truyện này.</div>;
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
            <h1 className="sf-title">
              {(() => {
                // SỬA DÒNG NÀY: Thêm ký tự ＆ full-width vào Regex
                const parts = profile.tenCouple.split(/\s*[&＆]\s*/); 
                
                if (parts.length > 1) { 
                  return (
                    <>
                      <span className="sf-title-part">
                        {/* Thêm lại ký tự & chuẩn để hiển thị cho đẹp */}
                        {parts[0]} &
                      </span>
                      <span className="sf-title-part">
                        {parts[1]}
                      </span>
                    </>
                  );
                }
                return profile.tenCouple; // Hiển thị bình thường nếu không có "&"
              })()}
            </h1>
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