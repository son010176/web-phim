// src/components/Header.js
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Header.css";
import ImageWithFallback from "./ImageWithFallback";
import { ReactComponent as SearchIcon } from '../assets/icons/magnifying-glass-solid-full.svg';
import { ReactComponent as UserIcon } from '../assets/icons/user-regular-full.svg';
import { ReactComponent as ClearIcon } from '../assets/icons/circle-xmark-solid-full.svg';

import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";

function Header({
  searchQuery,
  setSearchQuery,
  searchScope,
  setSearchScope,
  liveResults,
}) {
  const navigate = useNavigate();
  const searchFormRef = useRef(null);
  const [isDropdownVisible, setDropdownVisible] = useState(true); // State quản lý hiển thị dropdown

  const { currentUser } = useAuth();
  const { addNotification } = useNotification();

  // --- THÊM LOGIC LẤY CHỮ CÁI ĐẦU ---
  let userAvatarLetter = null;
  if (currentUser && currentUser.email) {
    userAvatarLetter = currentUser.email[0].toUpperCase();
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      addNotification("Đăng xuất thành công!");
      navigate("/");
    } catch (error) {
      addNotification("Lỗi khi đăng xuất: " + error.message, "error");
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        searchFormRef.current &&
        !searchFormRef.current.contains(event.target)
      ) {
        setDropdownVisible(false); // Ẩn dropdown nếu click ra ngoài
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchFormRef]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (
      searchQuery.trim() &&
      (searchScope === "tenPhim" || searchScope === "theLoai")
    ) {
      navigate(`/search?q=${searchQuery}&scope=${searchScope}`);
      setSearchQuery("");
      setDropdownVisible(false); // Ẩn dropdown sau khi submit
    }
  };

  const handleResultClick = () => {
    setSearchQuery("");
    setDropdownVisible(false); // Ẩn dropdown khi click vào một kết quả
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  return (
    <header className="main-header">
      <div className="header-content">
        <div className="header-left">
          <Link to="/" className="logo-link">
            <span className="logo-icon">🎬</span>
            <span className="logo-text">MiDrama</span>
          </Link>

          <form
            className="search-form"
            onSubmit={handleSearchSubmit}
            ref={searchFormRef}
          >
            <div className="search-bar">
              <select
                className="search-scope-select"
                value={searchScope}
                onChange={(e) => setSearchScope(e.target.value)}
              >
                <option value="tenPhim">Tên phim</option>
                <option value="dienVien">Diễn viên</option>
                <option value="theLoai">Thể loại</option>
                <option value="coupleDienVien">Couple Diễn viên</option>
                <option value="couplePhim">Couple Phim</option>
              </select>
              <div className="search-input-wrapper">
                <SearchIcon className="search-icon"/>
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setDropdownVisible(true)}
                />
                {searchQuery && <ClearIcon onClick={handleClearSearch} className="clear-icon"/>}
              </div>
            </div>

            {/* {liveResults.length > 0 && ( */}
            {isDropdownVisible && liveResults.length > 0 && (
              <div className="search-results-dropdown">
                {liveResults.map((result) => {
                  // TRƯỜNG HỢP 1: NẾU KẾT QUẢ LÀ DIỄN VIÊN
                  if (result.type === "actor") {
                    return (
                      <Link
                        to={`/dien-vien/${result.id}`}
                        key={result.id}
                        className="result-item"
                        onClick={handleResultClick}
                      >
                        <ImageWithFallback
                          src={result.linkAnhProfile}
                          alt={result.ten}
                          type="user"
                          className="result-poster"
                        />
                        <div className="result-info">
                          <span className="result-title">{result.ten}</span>
                          <span className="result-original-title">
                            {result.tenBinhAm}
                          </span>
                        </div>
                      </Link>
                    );
                  }

                  // THÊM MỚI: TRƯỜNG HỢP COUPLE PHIM (STORYLINE)
                  if (result.type === "storyline") {
                    const poster =
                      result.movies && result.movies.length > 0
                        ? result.movies[0].linkPoster
                        : null;
                    return (
                      <Link
                        to={`/phim-couples/${result.id}`}
                        key={`storyline-${result.id}`}
                        className="result-item"
                        onClick={handleResultClick}
                      >
                        <ImageWithFallback
                          src={poster}
                          alt={result.tenCouple}
                          type="movie"
                          className="result-poster"
                        />
                        <div className="result-info">
                          <span className="result-title">
                            {result.tenCouple}
                          </span>
                          <span className="result-original-title">
                            {result.tieuThuyetGoc}
                          </span>
                        </div>
                      </Link>
                    );
                  }

                  // THÊM MỚI: TRƯỜNG HỢP COUPLE PHIM (STORYLINE)
                  if (result.type === "couple") {
                    const poster =
                      result.movies && result.movies.length > 0
                        ? result.movies[0].linkPoster
                        : null;
                    return (
                      <Link
                        to={`/dien-vien-couples/${result.id}`}
                        key={`couple-${result.id}`}
                        className="result-item"
                        onClick={handleResultClick}
                      >
                        <ImageWithFallback
                          src={poster}
                          alt={result.tenCouple}
                          type="movie"
                          className="result-poster"
                        />
                        <div className="result-info">
                          <span className="result-title">
                            {result.tenCouple}
                          </span>
                          <span className="result-original-title">
                            {result.tongSoPhim} phim
                          </span>
                        </div>
                      </Link>
                    );
                  }

                  // TRƯỜNG HỢP 2: NẾU KẾT QUẢ LÀ PHIM
                  return (
                    <Link
                      to={`/phim/${result.id}`}
                      key={result.id}
                      className="result-item"
                      onClick={handleResultClick}
                    >
                      <ImageWithFallback
                        src={result.linkPoster}
                        alt={result.tenViet}
                        type="movie"
                        className="result-poster"
                      />
                      <div className="result-info">
                        <span className="result-title">{result.tenViet}</span>
                        <span className="result-original-title">
                          {result.tenGoc}
                        </span>
                        {result.dienVienNam && (
                          <span className="result-actors">
                            {result.dienVienNam.split("(")[0].trim()}
                          </span>
                        )}
                        {result.dienVienNu && (
                          <span className="result-actors">
                            {result.dienVienNu.split("(")[0].trim()}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}

                {/* Chỉ hiện nút 'Xem tất cả' khi tìm phim/thể loại */}
                {(searchScope === "tenPhim" || searchScope === "theLoai") && (
                  <button type="submit" className="show-all-results-btn">
                    Hiển thị toàn bộ kết quả
                  </button>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Phần bên phải: Menu và Nút thành viên */}
        <div className="header-right">
          <nav className="main-nav">
            <ul>
              <li className="nav-item">
                <Link to="/dien-vien/all-actors">Diễn viên</Link>
              </li>
              <li className="nav-item">
                <Link to="/dien-vien-couples/all-couples">
                  Couple Diễn viên
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/phim-couples/all-couples">Couple Phim</Link>
              </li>
              {currentUser && (
                <li className="nav-item">
                  <Link to="/bo-suu-tap">Bộ Sưu Tập</Link>
                </li>
              )}
            </ul>
          </nav>
          <div className="auth-section">
            {currentUser ? (
              <div className="user-info">
                {/* <span className="user-email">{currentUser.email}</span> */}
                {userAvatarLetter && (
                  <div className="user-avatar">{userAvatarLetter}</div>
                )}
                <button onClick={handleLogout} className="auth-btn logout-btn">
                  Đăng xuất
                </button>
              </div>
            ) : (
              <Link to="/login" className="auth-btn login-btn">
                <UserIcon className="user-icon"/>
                <span>Đăng nhập</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
