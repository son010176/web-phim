// src/components/Header.js
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Header.css";
import ImageWithFallback from "./ImageWithFallback";

const SearchIcon = () => (
  <svg
    className="search-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
  </svg>
);

// Icon cho nút thành viên
const UserIcon = () => (
  <svg
    className="user-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const ClearIcon = ({ onClick }) => (
  <svg
    className="clear-icon"
    onClick={onClick}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
);

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

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchFormRef.current && !searchFormRef.current.contains(event.target)) {
        setDropdownVisible(false); // Ẩn dropdown nếu click ra ngoài
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchFormRef]);

  // const handleSearchSubmit = (e) => {
  //   e.preventDefault();
  //   if (searchQuery.trim() && (searchScope === "tenPhim" || searchScope === "theLoai")) {
  //     navigate(`/search?q=${searchQuery}&scope=${searchScope}`);
  //     setSearchQuery("");
  //   }
  // };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() && (searchScope === "tenPhim" || searchScope === "theLoai")) {
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
            <span className="logo-text">My Collection</span>
          </Link>

          <form className="search-form" onSubmit={handleSearchSubmit} ref={searchFormRef}>
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
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setDropdownVisible(true)}
                />
                {searchQuery && <ClearIcon onClick={handleClearSearch} />}
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
                    const poster = (result.movies && result.movies.length > 0) ? result.movies[0].linkPoster : null;
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
                          <span className="result-title">{result.tenCouple}</span>
                           <span className="result-original-title">
                            {result.tieuThuyetGoc}
                          </span>
                        </div>
                      </Link>
                    );
                  }

                  // THÊM MỚI: TRƯỜNG HỢP COUPLE PHIM (STORYLINE)
                  if (result.type === "couple") {
                    const poster = (result.movies && result.movies.length > 0) ? result.movies[0].linkPoster : null;
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
                          <span className="result-title">{result.tenCouple}</span>
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
              {/* <li className="nav-item dropdown">
                <a href="#">Thể loại</a>
                <ul className="dropdown-menu">
                  <li>
                    <a href="#">Hiện đại</a>
                  </li>
                  <li>
                    <a href="#">Cổ trang</a>
                  </li>
                  <li>
                    <a href="#">Niên đại</a>
                  </li>
                </ul>
              </li> */}
              <li className="nav-item">
                <Link to="/dien-vien/all-actors">Diễn viên</Link>
              </li>
              <li className="nav-item">
                <Link to="/dien-vien-couples/all-couples">Couple Diễn viên</Link>
              </li>
              <li className="nav-item">
                <Link to="/phim-couples/all-couples">Couple Phim</Link>
              </li>
            </ul>
          </nav>
          <button className="user-button">
            <UserIcon />
            <span>Thành viên</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
