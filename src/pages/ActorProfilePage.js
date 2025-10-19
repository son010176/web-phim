// src/pages/ActorProfilePage.js (Đã sửa lỗi hiển thị)

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getActorProfile } from '../services/api';
import "./ActorProfilePage.css";
import ImageWithFallback from "../components/ImageWithFallback";
import { formatDate } from "../utils/formatDate";
import MovieList from "../components/MovieList";

function ActorProfilePage() {
  const { slug } = useParams();
  const [actorData, setActorData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); // State mới để lưu lỗi

  useEffect(() => {
    const fetchProfile = async () => {
      if (!slug) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      setActorData(null);

      try {
        const data = await getActorProfile(slug);
        setActorData(data);
      } catch (err) {
        setError(err.message); // Lưu thông báo lỗi từ API
        setActorData(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [slug]);

  // Ưu tiên hiển thị trạng thái Loading
  if (isLoading) {
    return <div className="ap-loading">Đang tải...</div>;
  }

  // Nếu có lỗi, hiển thị thông báo lỗi
  if (error) {
    return <div className="ap-loading">{error}</div>; // Hiển thị chính xác lỗi từ API
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
        <MovieList movies={movies} />
      </div>
    </div>
  );
}

export default ActorProfilePage;