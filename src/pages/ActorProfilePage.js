// src/pages/ActorProfilePage.js (ĐÃ SỬA LỖI LOGIC)

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getActorProfile_CF } from "../services/api"; // <-- SỬ DỤNG API CLOUDFLARE
import "./ActorProfilePage.css";
import ImageWithFallback from "../components/ImageWithFallback";
import { formatDate } from "../utils/formatDate";
import MovieList from "../components/MovieList";
import { createSlug } from "../utils/createSlug"; 

// props: actors (full cache), isCacheReady
function ActorProfilePage({ actors, isCacheReady }) {
  const { slug } = useParams(); // slug này có thể là ID hoặc slug
  const [actorData, setActorData] = useState(null); // { profile, movies }
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) {
      setError("Không có slug.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // 1. Định nghĩa hàm gọi API
    const fetchProfileFromAPI = () => {
      console.log(`🌐 Gọi Cloudflare với slug/id: ${slug}`);
      getActorProfile_CF(slug)
        .then(data => {
          // API trả về { status, data: { actor: { ... } } }
          if (data && data.actor) {
             setActorData({
               profile: data.actor, // profile chứa { ...profile, movies: [...] }
               movies: data.actor.movies || []
             });
          } else {
            throw new Error("Cấu trúc dữ liệu API không hợp lệ.");
          }
        })
        .catch(err => {
          console.error("Lỗi khi gọi getActorProfile_CF:", err);
          setError(err.message || "Không tìm thấy diễn viên (lỗi API).");
        })
        .finally(() => {
          setIsLoading(false);
        });
    };

    // 2. Kiểm tra Cache (từ Google Sheet) đã sẵn sàng chưa
    if (isCacheReady) {
      // 2a. Cache đã sẵn sàng, thử tìm trong cache
      const actorFromCache = actors.find(
        (a) => a.id === slug || createSlug(a.ten) === slug
      );

      if (actorFromCache) {
        // TÌM THẤY TRONG CACHE -> Dùng cache
        console.log("🚀 Dùng cache (Google Sheet) - BỎ QUA API");
        setActorData({
          profile: actorFromCache,
          movies: actorFromCache.movies || [] // Đảm bảo movies là mảng
        });
        setIsLoading(false);
      } else {
        // 2b. KHÔNG TÌM THẤY TRONG CACHE (lạ) -> Vẫn gọi API
        fetchProfileFromAPI();
      }
    } else {
      // 3. CACHE CHƯA SẴN SÀNG (isCacheReady = false)
      // Đây là trường hợp RELOAD (F5). Gọi API ngay lập tức.
      fetchProfileFromAPI();
    }

  }, [slug, actors, isCacheReady]); // Phản ứng với tất cả các thay đổi

  // Ưu tiên hiển thị trạng thái Loading
  if (isLoading) {
    return <div className="ap-loading">Đang tải...</div>;
  }

  // Nếu có lỗi, hiển thị thông báo lỗi
  if (error) {
    return <div className="ap-loading">{error}</div>; 
  }
  
  // Nếu không loading, không có lỗi, nhưng không có dữ liệu
  if (!actorData || !actorData.profile) {
    return <div className="ap-loading">Không tìm thấy thông tin diễn viên.</div>;
  }

  // Chỉ render khi chắc chắn có dữ liệu
  const { profile, movies } = actorData;

  return (
    <div className="main-content-section">
      <div className="ap-container">
        <div className="ap-header">
          <div className="ap-avatar">
            <ImageWithFallback
              src={profile.linkAnhProfile}
              alt={profile.ten}
              type="user"
              className="ap-avatar-img"
            />
          </div>
          <div className="ap-info">
            <h1 className="ap-name">{profile.ten}</h1>
            <p className="ap-pinyin-name">{profile.tenBinhAm}</p>
            <div className="ap-meta-grid">
              <p><strong>Ngày sinh:</strong> {formatDate(profile.ngaySinh)}</p>
              <p><strong>Cung HĐ:</strong> {profile.cungHoangDao}</p>
              <p><strong>Quê quán:</strong> {profile.queQuan}</p>
              <p><strong>Học vấn:</strong> {profile.hocVan}</p>
              <p><strong>Nghề nghiệp:</strong> {profile.ngheNghiep}</p>
              <p><strong>Weibo:</strong> <a href={profile.weibo} target="_blank" rel="noopener noreferrer">Link</a></p>
              <p><strong>Douyin:</strong> <a href={profile.douyin} target="_blank" rel="noopener noreferrer">Link</a></p>
            </div>
            {profile.tag && <div className="ap-tags">{profile.tag}</div>}
          </div>
        </div>
        <h2 className="section-title">Các phim đã tham gia</h2>
        <MovieList movies={movies || []} />
      </div>
    </div>
  );
}

export default ActorProfilePage;