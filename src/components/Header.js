// src/components/Header.js
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Header.css";
import ImageWithFallback from "./ImageWithFallback";
import { ReactComponent as SearchIcon } from '../assets/icons/magnifying-glass-solid-full.svg';
import { ReactComponent as UserIcon } from '../assets/icons/user-regular-full.svg';
import { ReactComponent as ClearIcon } from '../assets/icons/circle-xmark-solid-full.svg';
import { ReactComponent as MenuIcon } from '../assets/icons/bars-solid-full.svg';
import { ReactComponent as CloseIcon } from '../assets/icons/circle-xmark-solid-full.svg'; // Sử dụng icon X cho nút đóng sidebar
// import { ReactComponent as BackArrowIcon } from '../assets/icons/angles-left-solid-full.svg'; // Icon quay lại (cần file SVG: arrow-left-solid-full.svg)
import LogoNew from '../assets/logo/favicon-32x32.png';

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
  const searchInputRef = useRef(null); // Ref cho input để focus
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false); // State cho chế độ tìm kiếm

  const { currentUser } = useAuth();
  const { addNotification } = useNotification();

  let userAvatarLetter = null;
  if (currentUser && currentUser.email) {
    userAvatarLetter = currentUser.email[0].toUpperCase();
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      addNotification("Đăng xuất thành công!");
      setIsSidebarOpen(false);
      navigate("/");
    } catch (error) {
      addNotification("Lỗi khi đăng xuất: " + error.message, "error");
    }
  };

  // Đóng dropdown kết quả search nếu click ra ngoài form
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        searchFormRef.current &&
        !searchFormRef.current.contains(event.target)
      ) {
        setDropdownVisible(false);
      }
      // Cân nhắc: Có thể thêm logic đóng search mode nếu click ra ngoài header
      // if (isSearchMode && !event.target.closest('.main-header')) {
      //   closeSearchMode();
      // }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchFormRef, isSearchMode]); // Thêm isSearchMode

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (
      searchQuery.trim() &&
      (searchScope === "tenPhim" || searchScope === "theLoai")
    ) {
      navigate(`/search?q=${searchQuery}&scope=${searchScope}`);
      setSearchQuery("");
      setDropdownVisible(false);
      setIsSearchMode(false); // Tắt search mode sau khi submit
    }
  };

  const handleResultClick = () => {
    setSearchQuery("");
    setDropdownVisible(false);
    setIsSidebarOpen(false);
    setIsSearchMode(false); // Tắt search mode khi chọn kết quả
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    searchInputRef.current?.focus(); // Focus lại input sau khi xóa
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleNavLinkClick = () => {
    closeSidebar();
  }

  // --- HANDLERS CHO SEARCH MODE ---
  const openSearchMode = () => {
    setIsSearchMode(true);
    // Tự động focus vào input
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const closeSearchMode = () => {
    setIsSearchMode(false);
    setSearchQuery(""); // Xóa query khi đóng
    setDropdownVisible(false); // Đóng dropdown kết quả
  };
  // --- ---

  return (
    <>
      {/* Thêm class 'search-active' vào header khi isSearchMode là true */}
      <header className={`main-header ${isSearchMode ? 'search-active' : ''}`}>
        <div className="header-content">
          {/* Nút Hamburger: Ẩn khi đang search mode */}
          <button className="hamburger-btn" onClick={toggleSidebar}><MenuIcon /></button>

          {/* Logo: Ẩn khi đang search mode */}
          <div className="header-left">
            <Link to="/" className="logo-link">
              <img src={LogoNew} alt="Midrama Logo" className="logo-icon"/>
              <span className="logo-text">MiDrama</span>
            </Link>
          </div>

          {/* Form tìm kiếm */}
          <form
              className="search-form"
              onSubmit={handleSearchSubmit}
              ref={searchFormRef}
            >
              {/* Nút Back (Chỉ hiện khi search mode active trên mobile) */}
               {/* <button type="button" className="back-btn" onClick={closeSearchMode}>
                 <BackArrowIcon />
               </button> */}

              <div className="search-bar">
                <select
                  className="search-scope-select"
                  value={searchScope}
                  onChange={(e) => setSearchScope(e.target.value)}
                >
                  <option value="tenPhim">Tên phim</option>
                  <option value="dienVien">Diễn viên</option>
                  <option value="theLoai">Thể loại</option>
                  <option value="coupleDienVien">Couple DV</option>
                  <option value="couplePhim">Couple Phim</option>
                </select>
                <div className="search-input-wrapper">
                  {/* Icon search bên trong input chỉ hiện khi KHÔNG search mode */}
                  {!isSearchMode && <SearchIcon className="search-icon input-search-icon"/>}
                  <input
                    ref={searchInputRef} // Gắn Ref
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setDropdownVisible(true)}
                  />
                  {searchQuery && <ClearIcon onClick={handleClearSearch} className="clear-icon"/>}
                </div>
              </div>

              {/* Nút Đóng Search Mode (X) - Chỉ hiện khi search mode active */}
              <button type="button" className="close-search-btn" onClick={closeSearchMode}>
                <CloseIcon />
              </button>

              {/* Dropdown kết quả */}
              {isDropdownVisible && liveResults.length > 0 && (
                 <div className="search-results-dropdown">
                    {liveResults.map((result) => {
                      // TRƯỜNG HỢP DIỄN VIÊN
                      if (result.type === "actor") {
                        return (
                          <Link to={`/dien-vien/${result.id}`} key={result.id} className="result-item" onClick={handleResultClick}>
                            <ImageWithFallback src={result.linkAnhProfile} alt={result.ten} type="user" className="result-poster"/>
                            <div className="result-info">
                              <span className="result-title">{result.ten}</span>
                              <span className="result-original-title">{result.tenBinhAm}</span>
                            </div>
                          </Link>
                        );
                      }
                      // TRƯỜNG HỢP STORYLINE
                      if (result.type === "storyline") {
                        const poster = result.movies && result.movies.length > 0 ? result.movies[0].linkPoster : null;
                        return (
                          <Link to={`/phim-couples/${result.id}`} key={`storyline-${result.id}`} className="result-item" onClick={handleResultClick}>
                            <ImageWithFallback src={poster} alt={result.tenCouple} type="movie" className="result-poster"/>
                            <div className="result-info">
                              <span className="result-title">{result.tenCouple}</span>
                              <span className="result-original-title">{result.tieuThuyetGoc}</span>
                            </div>
                          </Link>
                        );
                      }
                      // TRƯỜNG HỢP COUPLE DIEN VIEN
                      if (result.type === "couple") {
                        const poster = result.movies && result.movies.length > 0 ? result.movies[0].linkPoster : null;
                        return (
                          <Link to={`/dien-vien-couples/${result.id}`} key={`couple-${result.id}`} className="result-item" onClick={handleResultClick}>
                            <ImageWithFallback src={poster} alt={result.tenCouple} type="movie" className="result-poster"/>
                            <div className="result-info">
                              <span className="result-title">{result.tenCouple}</span>
                              <span className="result-original-title">{result.tongSoPhim} phim</span>
                            </div>
                          </Link>
                        );
                      }
                      // TRƯỜNG HỢP PHIM
                      return (
                        <Link to={`/phim/${result.id}`} key={result.id} className="result-item" onClick={handleResultClick}>
                          <ImageWithFallback src={result.linkPoster} alt={result.tenViet} type="movie" className="result-poster"/>
                          <div className="result-info">
                            <span className="result-title">{result.tenViet}</span>
                            <span className="result-original-title">{result.tenGoc}</span>
                            {result.dienVienNam && (<span className="result-actors">{result.dienVienNam.split("(")[0].trim()}</span>)}
                            {result.dienVienNu && (<span className="result-actors">{result.dienVienNu.split("(")[0].trim()}</span>)}
                          </div>
                        </Link>
                      );
                    })}
                    {(searchScope === "tenPhim" || searchScope === "theLoai") && (
                      <button type="submit" className="show-all-results-btn">
                        Hiển thị toàn bộ kết quả
                      </button>
                    )}
                 </div>
              )}
            </form>

          {/* Nút Icon Search (Chỉ hiện khi KHÔNG search mode trên mobile) */}
          <button className="search-icon-btn" onClick={openSearchMode}>
            <SearchIcon />
          </button>

          {/* Nav và Auth Desktop */}
          <div className="header-right desktop-only"> {/* Thêm class desktop-only */}
            <nav className="main-nav desktop-nav">
              <ul>
                <li className="nav-item"> <Link to="/dien-vien/all-actors">Diễn viên</Link> </li>
                <li className="nav-item"> <Link to="/dien-vien-couples/all-couples">Couple Diễn viên</Link> </li>
                <li className="nav-item"> <Link to="/phim-couples/all-couples">Couple Phim</Link> </li>
                {currentUser && (<li className="nav-item"> <Link to="/bo-suu-tap">Bộ Sưu Tập</Link> </li>)}
              </ul>
            </nav>
            <div className="auth-section desktop-auth">
              {currentUser ? (
                <div className="user-info">
                  {userAvatarLetter && (<div className="user-avatar">{userAvatarLetter}</div>)}
                  <button onClick={handleLogout} className="auth-btn logout-btn">Đăng xuất</button>
                </div>
              ) : (
                <Link to="/login" className="auth-btn login-btn"> <UserIcon className="user-icon"/> <span>Đăng nhập</span> </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
      ></div>

      {/* Mobile Sidebar Menu */}
      <div className={`mobile-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
           <span className="sidebar-title">Menu</span>
           <button className="close-sidebar-btn" onClick={closeSidebar}>
             <CloseIcon /> {/* Đổi thành CloseIcon nếu có */}
           </button>
        </div>
        <nav className="main-nav mobile-nav">
          <ul>
            <li className="nav-item"> <Link to="/dien-vien/all-actors" onClick={handleNavLinkClick}>Diễn viên</Link> </li>
            <li className="nav-item"> <Link to="/dien-vien-couples/all-couples" onClick={handleNavLinkClick}> Couple Diễn viên </Link> </li>
            <li className="nav-item"> <Link to="/phim-couples/all-couples" onClick={handleNavLinkClick}>Couple Phim</Link> </li>
            {currentUser && (<li className="nav-item"> <Link to="/bo-suu-tap" onClick={handleNavLinkClick}>Bộ Sưu Tập</Link> </li>)}
          </ul>
        </nav>
        <div className="auth-section mobile-auth">
          {currentUser ? (
            <div className="user-info">
              {userAvatarLetter && (<div className="user-avatar">{userAvatarLetter}</div>)}
               <span className="user-email-sidebar">{currentUser.email}</span>
              <button onClick={handleLogout} className="auth-btn logout-btn">Đăng xuất</button>
            </div>
          ) : (
            <Link to="/login" className="auth-btn login-btn" onClick={handleNavLinkClick}> <UserIcon className="user-icon"/> <span>Đăng nhập</span> </Link>
          )}
        </div>
      </div>
    </>
  );
}

export default Header;