// src/pages/MovieDetail.js (Đã nâng cấp logic)

import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom"; // Thêm useNavigate
import YouTube from "react-youtube";
import "./MovieDetail.css";
import { createSlug } from "../utils/createSlug";
import ImageWithFallback from "../components/ImageWithFallback";
import { ReactComponent as PlusIcon } from '../assets/icons/plus-solid.svg';
import { ReactComponent as CheckIcon } from '../assets/icons/check-solid.svg';
// import { useNotification } from '../context/NotificationContext'; // Không cần nữa
import { getMovieDetail_CF } from "../services/api"; // <-- IMPORT API
import { useCollection } from "../context/CollectionContext"; // <-- IMPORT CONTEXT MỚI
import { useAuth } from "../context/AuthContext"; // <-- Import useAuth

// SỬA: Xóa props collection, setCollection
function MovieDetail({ movies, isCacheReady }) {
  const { id } = useParams();
  const navigate = useNavigate(); // Dùng để chuyển trang
  
  // State nội bộ để quản lý dữ liệu phim
  const [movie, setMovie] = useState(null); // <-- Dùng state thay vì prop
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // const { addNotification } = useNotification(); // Lấy từ CollectionContext
  const [activeTab, setActiveTab] = useState("");
  
  // --- LOGIC MỚI: DÙNG COLLECTION CONTEXT ---
  const { currentUser } = useAuth(); // Lấy user hiện tại
  const { 
    isMovieInCollection, 
    addMovieToCollection 
  } = useCollection();
  
  const [isCollected, setIsCollected] = useState(false);

  // --- LOGIC TẢI DỮ LIỆU (Giữ nguyên) ---
  useEffect(() => {
    if (!id) {
      setError("Không có ID phim.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setMovie(null); // Xóa phim cũ

    // 1. Định nghĩa hàm gọi API
    const fetchMovieFromAPI = () => {
      console.log(`🌐 Gọi Cloudflare với movieId: ${id}`);
      getMovieDetail_CF(id) // Giả định hàm này gọi /api/movies/:id/profile
        .then(data => {
          // API trả về { status, data: { movie: {...} } }
          if (data && data.movie) {
             setMovie(data.movie);
          } else {
            throw new Error("Cấu trúc dữ liệu API không hợp lệ.");
          }
        })
        .catch(err => {
          console.error("Lỗi khi gọi getMovieDetail_CF:", err);
          setError(err.message || "Không tìm thấy phim (lỗi API).");
        })
        .finally(() => {
          setIsLoading(false);
        });
    };

    // 2. Kiểm tra Cache đã sẵn sàng chưa
    if (isCacheReady) {
      // 2a. Cache đã sẵn sàng, thử tìm trong cache
      const movieFromCache = movies.find((m) => m.id === id);

      if (movieFromCache) {
        // TÌM THẤY TRONG CACHE -> Dùng cache
        console.log("🚀 Dùng cache (Google Sheet) - BỎ QUA API");
        setMovie(movieFromCache);
        setIsLoading(false);
      } else {
        // 2b. KHÔNG TÌM THẤY TRONG CACHE -> Vẫn gọi API
        fetchMovieFromAPI();
      }
    } else {
      // 3. CACHE CHƯA SẴN SÀNG (isCacheReady = false)
      // Đây là trường hợp RELOAD (F5). Gọi API ngay lập tức.
      fetchMovieFromAPI();
    }

  }, [id, movies, isCacheReady]);
  // --- HẾT LOGIC TẢI DỮ LIỆU ---


  // useEffect cho "Bộ sưu tập"
  useEffect(() => {
    if (movie) {
      // Dùng hàm check từ context
      setIsCollected(isMovieInCollection(movie.id));
    }
  }, [movie, isMovieInCollection]); // Phụ thuộc vào hàm của context

  // --- HÀM MỚI: Xử lý Thêm vào Bộ sưu tập ---
  const handleAddToCollection = () => {
    if (!currentUser) {
      // Nếu chưa đăng nhập, chuyển đến trang login
      navigate('/login');
      return;
    }
    
    if (movie && !isCollected) {
      // Gọi hàm từ context
      addMovieToCollection(movie);
    }
  };

  // (Các hàm getGoogleDriveEmbedUrl, getYouTubeVideoId giữ nguyên)
  const getGoogleDriveEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(
      /drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/
    );
    if (match && match[1]) {
      const fileId = match[1];
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    return null; 
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

  // Tự động chọn tab đầu tiên
  useEffect(() => {
    if (viVideoId) setActiveTab("vi");
    else if (driveEmbedUrl) setActiveTab("drive");
    else if (subVideoId) setActiveTab("sub");
    else setActiveTab(""); // Không có video nào
  }, [viVideoId, subVideoId, driveEmbedUrl]);

  // --- Logic Render ---
  if (isLoading) {
    return (
      <div className="detail-loading">
        <p>Đang tải thông tin phim...</p>
      </div>
    );
  }
  if (error) {
    return <div className="detail-loading"><p>{error}</p></div>; 
  }
  if (!movie) {
    return (
      <div className="detail-loading">
        <p>Không tìm thấy thông tin phim.</p>
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
      {/* (Toàn bộ phần JSX còn lại giữ nguyên, nó đã đọc từ 'movie' state) */}
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
                onClick={handleAddToCollection} // <-- SỬA
                disabled={isCollected} // <-- SỬA
              >
                {isCollected ? <CheckIcon /> : <PlusIcon />}
                <span>
                  {!currentUser 
                    ? 'Đăng nhập để thêm' 
                    : (isCollected ? 'Đã có trong Bộ sưu tập' : 'Thêm vào Bộ sưu tập')
                  }
                </span>
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
            {activeTab === "vi" && viVideoId && (
              <YouTube
                videoId={viVideoId}
                opts={opts}
                className="youtube-player"
              />
            )}
            {activeTab === "sub" && subVideoId && (
              <YouTube
                videoId={subVideoId}
                opts={opts}
                className="youtube-player"
              />
            )}
            {activeTab === "drive" && driveEmbedUrl && (
              <iframe
                src={driveEmbedUrl}
                title="Google Drive Player"
                className="youtube-player"
                allow="fullscreen"
              ></iframe>
            )}
            {!viVideoId && !subVideoId && !driveEmbedUrl && (
              <p className="no-video-message">Không có video cho phim này.</p>
            )}
          </div>
          <div className="video-tabs">
            {viVideoId && (
              <button
                className={`tab-button ${activeTab === "vi" ? "active" : ""}`}
                onClick={() => setActiveTab("vi")}
              >
                [VN] Thuyết Minh
              </button>
            )}
            {subVideoId && (
              <button
                className={`tab-button ${activeTab === "sub" ? "active" : ""}`}
                onClick={() => setActiveTab("sub")}
              >
                [CN] MultiSub
              </button>
            )}
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