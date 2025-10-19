// src/pages/MovieDetail.js (Đã cập nhật để hỗ trợ Google Drive)
import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import YouTube from "react-youtube";
import "./MovieDetail.css";
import { createSlug } from "../utils/createSlug";
import ImageWithFallback from "../components/ImageWithFallback";
import { addToCollection } from '../services/api';
import { ReactComponent as PlusIcon } from '../assets/icons/plus-solid.svg';
import { ReactComponent as CheckIcon } from '../assets/icons/check-solid.svg';
import { useNotification } from '../context/NotificationContext';

function MovieDetail({ movies, collection, setCollection }) {
  const { id } = useParams();
  const movie = movies.find((m) => m.id === id);
  const { showToast } = useNotification();
  const [activeTab, setActiveTab] = useState(""); // Sẽ được đặt tự động
  const [isCollected, setIsCollected] = useState(false);

  useEffect(() => {
    if (movie && collection) {
      const alreadyExists = collection.some(item => item.id === movie.id);
      setIsCollected(alreadyExists);
    }
  }, [movie, collection]);

  const handleAddToCollection = () => {
    if (movie && !isCollected) {
      const originalCollection = [...collection]; // Lưu lại trạng thái cũ để có thể phục hồi nếu lỗi

      // ---- CẬP NHẬT GIAO DIỆN "LẠC QUAN" ----
      setIsCollected(true);
      setCollection(prev => [...prev, movie]);
      showToast('Đã thêm vào bộ sưu tập!'); // Hiển thị thông báo tùy chỉnh

      // ---- GỬI YÊU CẦU TRONG NỀN ----
      addToCollection(movie)
        .catch(error => {
          // Nếu có lỗi, phục hồi lại trạng thái giao diện và báo lỗi
          console.error("Lỗi khi thêm vào bộ sưu tập:", error);
          showToast('Lỗi: Không thể thêm phim.', 'error');
          setCollection(originalCollection); // Phục hồi
          setIsCollected(false);
        });
    }
  };

  // --- HÀM MỚI ---
  // Hàm này chuyển đổi link Google Drive thông thường thành link để nhúng (embed)
  const getGoogleDriveEmbedUrl = (url) => {
    if (!url) return null;
    // Sử dụng biểu thức chính quy (regex) để tìm ID của file
    const match = url.match(
      /drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/
    );
    if (match && match[1]) {
      const fileId = match[1];
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    return null; // Trả về null nếu không tìm thấy ID
  };

  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Lấy ID/URL cho từng loại video
  const viVideoId = movie ? getYouTubeVideoId(movie.linkVideo) : null;
  const subVideoId = movie ? getYouTubeVideoId(movie.linkVideoMultiSub) : null;
  const driveEmbedUrl = movie
    ? getGoogleDriveEmbedUrl(movie.linkGgDrive)
    : null;

  // Tự động chọn tab đầu tiên có video để hiển thị
  useEffect(() => {
    if (viVideoId) setActiveTab("vi");
    else if (driveEmbedUrl) setActiveTab("drive");
    else if (subVideoId) setActiveTab("sub");
  }, [viVideoId, subVideoId, driveEmbedUrl]);

  if (!movie) {
    return (
      <div className="detail-loading">
        <p>Đang tải thông tin phim...</p>
      </div>
    );
  }

  const opts = {
    width: "100%",
    height: "100%",
    playerVars: { autoplay: 0, rel: 0 },
  };

  return (
    <div className="movie-detail-container">
      <div className="detail-body-grid">
        <div className="poster-block">
          <div className="poster-frame">
            <ImageWithFallback
              src={movie.linkPoster}
              alt={`Poster phim ${movie.tenViet}`}
              type="movie"
              className="detail-poster"
            />
          </div>
        </div>

        <div className="info-container">
          <div className="title-block">
            <h1 className="detail-title">{movie.tenViet}</h1>
            <p className="detail-original-title">{movie.tenGoc}</p>

            <div className="actions-block">
              <button
                className={`action-button ${isCollected ? 'collected' : 'add-to-collection'}`}
                onClick={handleAddToCollection}
                disabled={isCollected}
              >
                {isCollected ? <CheckIcon /> : <PlusIcon />}
                <span>{isCollected ? 'Đã có trong Bộ sưu tập' : 'Thêm vào Bộ sưu tập'}</span>
              </button>
            </div>

            <div className="detail-meta">
              {movie.theLoai?.split(/[.,]/).map(
                (tag) =>
                  tag.trim() && (
                    <span key={tag.trim()} className="detail-genre-tag">
                      {tag.trim()}
                    </span>
                  )
              )}
            </div>
          </div>

          <div className="actors-block">
            {movie.dienVienNam || movie.dienVienNu ? (
              <div className="info-section">
                <h2 className="info-title">Diễn viên</h2>
                <div className="actor-list-detail">
                  {movie.dienVienNam &&
                    movie.dienVienNam.split("&").map((name, index) => (
                      <div className="actor-item-detail" key={`nam-${index}`}>
                        <Link
                          to={`/dien-vien/${createSlug(name.trim())}`}
                          className="actor-name-detail"
                        >
                          {name.trim()}
                        </Link>
                      </div>
                    ))}
                  {movie.dienVienNu &&
                    movie.dienVienNu.split("&").map((name, index) => (
                      <div className="actor-item-detail" key={`nu-${index}`}>
                        <Link
                          to={`/dien-vien/${createSlug(name.trim())}`}
                          className="actor-name-detail"
                        >
                          {name.trim()}
                        </Link>
                      </div>
                    ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="description-block">
            {movie.moTa && (
              <div className="info-section">
                <h2 className="info-title">Giới thiệu</h2>
                <p className="description-text">{movie.moTa}</p>
              </div>
            )}
          </div>
        </div>

        <div className="video-block">
          <div className="video-player-wrapper">
            {/* --- HIỂN THỊ VIDEO YOUTUBE (VI) --- */}
            {activeTab === "vi" && viVideoId && (
              <YouTube
                videoId={viVideoId}
                opts={opts}
                className="youtube-player"
              />
            )}

            {/* --- HIỂN THỊ VIDEO YOUTUBE (SUB) --- */}
            {activeTab === "sub" && subVideoId && (
              <YouTube
                videoId={subVideoId}
                opts={opts}
                className="youtube-player"
              />
            )}

            {/* --- HIỂN THỊ VIDEO GOOGLE DRIVE --- */}
            {activeTab === "drive" && driveEmbedUrl && (
              <iframe
                src={driveEmbedUrl}
                title="Google Drive Player"
                className="youtube-player" // Tái sử dụng class để có cùng kích thước
                allow="fullscreen"
              ></iframe>
            )}

            {/* --- THÔNG BÁO KHI KHÔNG CÓ VIDEO NÀO --- */}
            {!viVideoId && !subVideoId && !driveEmbedUrl && (
              <p className="no-video-message">Không có video cho phim này.</p>
            )}
          </div>
          <div className="video-tabs">
            {/* Nút bấm cho YouTube (VI) */}
            {viVideoId && (
              <button
                className={`tab-button ${activeTab === "vi" ? "active" : ""}`}
                onClick={() => setActiveTab("vi")}
              >
                [VN] Thuyết Minh
              </button>
            )}
            {/* Nút bấm cho YouTube (SUB) */}
            {subVideoId && (
              <button
                className={`tab-button ${activeTab === "sub" ? "active" : ""}`}
                onClick={() => setActiveTab("sub")}
              >
                [CN] MultiSub
              </button>
            )}
            {/* Nút bấm cho Google Drive */}
            {driveEmbedUrl && (
              <button
                className={`tab-button ${
                  activeTab === "drive" ? "active" : ""
                }`}
                onClick={() => setActiveTab("drive")}
              >
                [GG Drive] Thuyết Minh
              </button>
            )}
          </div>
          {(movie.linkFbPost ||
            movie.linkFbVideo ||
            movie.tags ||
            movie.linkKhac) && (
            <div className="video-footer-info">
              {(movie.linkFbPost || movie.linkFbVideo || movie.linkKhac) && (
                <div className="external-links-section">
                  {movie.linkFbPost && (
                    <div className="link-item">
                      <span className="link-title">Bài viết gốc:</span>
                      <a
                        href={movie.linkFbPost}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {movie.linkFbPost}
                      </a>
                    </div>
                  )}
                  {movie.linkFbVideo && (
                    <div className="link-item">
                      <span className="link-title">Video Facebook:</span>
                      <a
                        href={movie.linkFbVideo}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {movie.linkFbVideo}
                      </a>
                    </div>
                  )}
                  {movie.linkKhac && (
                    <div className="link-item">
                      <span className="link-title">Douban:</span>
                      <a
                        href={movie.linkKhac}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {movie.linkKhac}
                      </a>
                    </div>
                  )}
                </div>
              )}
              {movie.tags && (
                <div className="detail-tags">
                  <strong>Tags:</strong> {movie.tags}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MovieDetail;
