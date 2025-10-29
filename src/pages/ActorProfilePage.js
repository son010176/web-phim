// src/pages/ActorProfilePage.js (Ưu tiên Full Cache, fallback về Cloudflare)

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getActorProfile_CF } from "../services/api"; // <-- SỬ DỤNG API CLOUDFLARE (api.js)
import "./ActorProfilePage.css";
import ImageWithFallback from "../components/ImageWithFallback";
import { formatDate } from "../utils/formatDate";
import MovieList from "../components/MovieList";
import { createSlug } from "../utils/createSlug";

// props: fullCache, isFullDataReady (thay cho actors, isCacheReady cũ)
function ActorProfilePage({ fullCache, isFullDataReady }) {
  const { slug } = useParams(); // slug này có thể là ID hoặc slug từ URL
  const [actorData, setActorData] = useState(null); // { profile, movies }
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Kiểm tra slug hợp lệ
    if (!slug) {
      setError("Không có slug (ID hoặc tên) của diễn viên.");
      setIsLoading(false);
      return;
    }

    // Reset trạng thái khi slug thay đổi
    setIsLoading(true);
    setError(null);
    setActorData(null);

    let foundInCache = false;

    // --- BƯỚC 1: Ưu tiên kiểm tra Full Cache ---
    // Chỉ kiểm tra nếu cờ isFullDataReady là true và fullCache có dữ liệu actors
    if (isFullDataReady && fullCache?.actors) {
      console.log(`ActorProfile: Kiểm tra Full Cache (IndexedDB) cho slug: ${slug}`);
      // Tìm diễn viên trong cache bằng ID hoặc slug được tạo từ tên
      const actorFromCache = fullCache.actors.find(
        (a) => a.id === slug || createSlug(a.ten) === slug
      );

      // Kiểm tra xem dữ liệu cache có đủ chi tiết không
      // (Giả định full cache luôn có 'profile' và 'movies' nếu diễn viên tồn tại)
      if (actorFromCache && actorFromCache.profile !== undefined && actorFromCache.movies) {
        console.log("🚀 ActorProfile: Tìm thấy dữ liệu đầy đủ trong Full Cache.");
        // Gán dữ liệu từ cache vào state
        setActorData({
          profile: actorFromCache,
          movies: actorFromCache.movies || [] // Đảm bảo movies là mảng
        });
        foundInCache = true; // Đánh dấu đã tìm thấy
        setIsLoading(false); // Ngừng loading
      } else {
         console.log("ℹ️ ActorProfile: Không tìm thấy trong Full Cache (hoặc cache không đủ chi tiết).");
      }
    } else {
       console.log("ℹ️ ActorProfile: Full Cache chưa sẵn sàng hoặc không có dữ liệu actors.");
    }


    // --- BƯỚC 2: Gọi API Cloudflare nếu không tìm thấy trong cache ---
    // Chỉ gọi API nếu chưa tìm thấy trong cache (foundInCache === false)
    if (!foundInCache) {
      console.log(`☁️ ActorProfile: Gọi Cloudflare API cho slug/id: ${slug}`);
      // Gọi hàm getActorProfile_CF từ file api.js
      getActorProfile_CF(slug)
        .then(data => {
          // API Cloudflare trả về { status, data: { actor: { ... } } }
          // Kiểm tra cấu trúc data trả về từ API
          if (data && data.actor) {
            console.log("✅ ActorProfile: API Cloudflare thành công.");
            // Gán dữ liệu từ API vào state
            setActorData({
              profile: data.actor, // profile chứa { ...profile, movies: [...] }
              movies: data.actor.movies || [] // Đảm bảo movies là mảng
            });
          } else {
            // Nếu API trả về cấu trúc không đúng hoặc không có data.actor
            throw new Error(`Không tìm thấy dữ liệu chi tiết cho diễn viên "${slug}" từ API Cloudflare.`);
          }
        })
        .catch(err => {
          // Xử lý lỗi từ API
          console.error("❌ Lỗi khi gọi getActorProfile_CF:", err);
          setError(err.message || "Không thể tải thông tin diễn viên (lỗi API).");
        })
        .finally(() => {
          // Dù thành công hay lỗi, cũng ngừng loading
          setIsLoading(false);
        });
    }

  // Phản ứng với sự thay đổi của slug, fullCache, hoặc isFullDataReady
  }, [slug, fullCache, isFullDataReady]);


  // --- Logic Render (Giữ nguyên phần lớn) ---
  if (isLoading) {
    // return <div className="ap-loading">Đang tải thông tin diễn viên...</div>;
    return <div className="loading-indicator">Đang tải thông tin diễn viên...</div>;
  }
  if (error) {
    // Hiển thị lỗi nếu có
    // return <div className="ap-loading error-message">{error}</div>; // Thêm class error-message nếu cần style riêng
    return <div className="loading-indicator error-message">{error}</div>;
  }
  // Kiểm tra nếu không loading, không lỗi, nhưng không có dữ liệu profile
  if (!actorData || !actorData.profile) {
    // return <div className="ap-loading">Không tìm thấy thông tin diễn viên.</div>;
    return <div className="loading-indicator">Không tìm thấy thông tin diễn viên.</div>;
  }

  // Nếu đã có dữ liệu, tiến hành render
  const { profile, movies } = actorData;

  return (
    <div className="main-content-section">
      <div className="ap-container">
        {/* Phần Header thông tin diễn viên */}
        <div className="ap-header">
          <div className="ap-avatar">
            <ImageWithFallback
              src={profile.linkAnhProfile}
              alt={profile.ten}
              type="user" // Quan trọng
              className="ap-avatar-img"
            />
          </div>
          <div className="ap-info">
            <h1 className="ap-name">{profile.ten}</h1>
            <p className="ap-pinyin-name">{profile.tenBinhAm}</p>
            {/* Lưới thông tin meta */}
            <div className="ap-meta-grid">
              <p><strong>Ngày sinh:</strong> {formatDate(profile.ngaySinh) || 'Chưa rõ'}</p>
              <p><strong>Cung HĐ:</strong> {profile.cungHoangDao || 'Chưa rõ'}</p>
              <p><strong>Quê quán:</strong> {profile.queQuan || 'Chưa rõ'}</p>
              <p><strong>Học vấn:</strong> {profile.hocVan || 'Chưa rõ'}</p>
              <p><strong>Nghề nghiệp:</strong> {profile.ngheNghiep || 'Chưa rõ'}</p>
              <p><strong>Weibo:</strong> {profile.weibo ? <a href={profile.weibo} target="_blank" rel="noopener noreferrer">Link</a> : 'Chưa rõ'}</p>
              <p><strong>Douyin:</strong> {profile.douyin ? <a href={profile.douyin} target="_blank" rel="noopener noreferrer">Link</a> : 'Chưa rõ'}</p>
              <p><strong>Profile Facebook:</strong> {profile.profile ? <a href={profile.profile} target="_blank" rel="noopener noreferrer">Link</a> : 'Chưa rõ'}</p>
              {/* Thêm các thông tin khác nếu cần */}
            </div>
            {/* Hiển thị tags nếu có */}
            {profile.tag && <div className="ap-tags">{profile.tag}</div>}
          </div>
        </div>

        {/* Phần Bio/Profile nếu có */}
        {/* {profile.profile && (
             <div className="info-section">
                <h2 className="info-title">Profile Facebook</h2>
                <div className="description-text ap-bio" dangerouslySetInnerHTML={{ __html: profile.profile }} />
            </div>
        )} */}

        {/* Phần danh sách phim */}
        <h2 className="section-title">Các phim đã tham gia</h2>
        {/* Đảm bảo movies là một mảng trước khi truyền vào MovieList */}
        <MovieList movies={Array.isArray(movies) ? movies : []} />

        {/* Có thể thêm các section khác ở đây (Album ảnh, Blog, Youtube...) */}

      </div>
    </div>
  );
}

export default ActorProfilePage;