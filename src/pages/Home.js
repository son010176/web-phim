// src/pages/Home.js (Đã sửa lỗi logic, dùng isSearchReady làm công tắc)

import React, { useState, useEffect, memo, useRef, useCallback } from "react";
import DropdownFilter from "../components/DropdownFilter";
import SortDropdown from "../components/SortDropdown";
import MovieList from "../components/MovieList";
import Pagination from "../components/Pagination";
import "./Home.css";
import { getMoviesPage } from "../services/api";

const MOVIES_PER_PAGE = 24; 

function Home({
    clientMovies, // Data đã lọc/sắp xếp từ App.js
    uniqueGenres, selectedGenres, handleGenreToggle, sortOrder, handleSortChange,
    isSearchReady, // <-- CÔNG TẮC CHÍNH
    isFullDataReady // (File này không cần dùng cờ này nữa)
  }) {
  
  // State cho server mode (chỉ dùng khi isSearchReady = false)
  const [serverData, setServerData] = useState({
    list: [], currentPage: 1, totalPages: 1, pageTokens: { 1: null }, isLoading: false
  });

  // State cho client mode (khi isSearchReady = true)
  const [clientCurrentPage, setClientCurrentPage] = useState(1);
  
  // KHÔNG CẦN effectiveMode hay isTransitioning nữa

  // 1. useEffect (Server Mode): Tải trang 1 KHI VÀ CHỈ KHI search CHƯA sẵn sàng
  useEffect(() => {
    // Chỉ chạy nếu search CHƯA sẵn sàng, list rỗng và không đang loading
    if (!isSearchReady && serverData.list.length === 0 && !serverData.isLoading) {
      console.log("Home: Chế độ Server (chờ Search Cache). Tải trang 1 (Cloudflare)...");
      setServerData(prev => ({ ...prev, isLoading: true }));
      getMoviesPage() // Gọi API trang 1
        .then(res => {
          if (res && res.data) {
            setServerData(prev => ({
              ...prev,
              list: res.data,
              currentPage: 1,
              totalPages: res.pagination?.totalPages || 1,
              pageTokens: { ...prev.pageTokens, 2: res.pagination?.nextPageToken },
              isLoading: false
            }));
          } else {
             setServerData(prev => ({ ...prev, isLoading: false }));
          }
        })
        .catch(err => {
          console.error("Home: Lỗi tải trang 1 (Cloudflare):", err);
          setServerData(prev => ({ ...prev, isLoading: false }));
        });
    }
  }, [isSearchReady, serverData.list.length, serverData.isLoading]); // Phụ thuộc vào cờ isSearchReady

  // 2. useEffect (Reset trang Client): Khi filter/sort thay đổi
  useEffect(() => {
    // Chỉ reset nếu search ĐÃ sẵn sàng (vì đang dùng data client)
    if (isSearchReady) {
      console.log("Home (Client): Filter/Sort thay đổi, reset về trang 1.");
      setClientCurrentPage(1);
    }
  }, [selectedGenres, sortOrder, isSearchReady]); // Phụ thuộc filter và cờ isSearchReady

  // Phân trang Server (Cloudflare)
  const handleServerPageChange = useCallback(async (newPage) => {
    // Chỉ chạy khi search CHƯA sẵn sàng
    if (isSearchReady || serverData.isLoading) return;

    setServerData(prev => ({ ...prev, isLoading: true }));
    try {
      const pageToken = serverData.pageTokens[newPage];
      const res = await getMoviesPage({ pageToken });
      
      if (res && res.data) {
        setServerData(prev => ({
          ...prev,
          list: res.data,
          currentPage: newPage,
          totalPages: res.pagination?.totalPages || prev.totalPages,
          pageTokens: { ...prev.pageTokens, [newPage + 1]: res.pagination?.nextPageToken },
          isLoading: false
        }));
        window.scrollTo(0, 0);
      } else {
         setServerData(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error("Home (Server): Lỗi tải trang mới:", error);
      setServerData(prev => ({ ...prev, isLoading: false }));
    }
  }, [isSearchReady, serverData]); // Phụ thuộc cờ isSearchReady

  // Phân trang Client (IndexedDB/SearchCache)
  const handleClientPageChange = (newPage) => {
    setClientCurrentPage(newPage);
    window.scrollTo(0, 0);
  };

  // --- LOGIC RENDER ---
  const controlsDisabled = !isSearchReady;

  let moviesToRender = [];
  let currentPage = 1;
  let totalPages = 1;
  let onPageChangeHandler = () => {};
  let paginationDisabled = false;

  if (isSearchReady) {
    // --- CHẾ ĐỘ CLIENT (Dùng searchCache hoặc fullCache) ---
    // clientMovies là prop displayMovies đã được lọc bởi hook trong App.js
    const totalMovies = clientMovies.length;
    totalPages = totalMovies > 0 ? Math.ceil(totalMovies / MOVIES_PER_PAGE) : 1;
    // Đảm bảo clientCurrentPage không vượt quá totalPages
    const safeClientPage = Math.min(clientCurrentPage, totalPages);
    const startIndex = (safeClientPage - 1) * MOVIES_PER_PAGE;
    moviesToRender = clientMovies.slice(startIndex, startIndex + MOVIES_PER_PAGE);
    currentPage = safeClientPage;
    onPageChangeHandler = handleClientPageChange;
    paginationDisabled = false; // Luôn bật
  } else {
    // --- CHẾ ĐỘ SERVER (Chờ searchCache) ---
    moviesToRender = serverData.list;
    currentPage = serverData.currentPage;
    totalPages = serverData.totalPages;
    onPageChangeHandler = handleServerPageChange;
    paginationDisabled = serverData.isLoading; // Vô hiệu hóa khi đang tải
  }

  // Loading overlay chỉ hiển thị khi ở server mode và đang tải
  const showLoading = serverData.isLoading && !isSearchReady;
  
  return (
    <div className="home-content">
      <main className="movie-list-section">
        <div className="controls-wrapper">
          <DropdownFilter
            genres={uniqueGenres}
            selectedGenres={selectedGenres}
            onGenreToggle={handleGenreToggle}
            isDisabled={controlsDisabled} // <-- DÙNG CỜ SEARCH
          />
          <SortDropdown
            currentSortOrder={sortOrder}
            onSortChange={handleSortChange}
            isDisabled={controlsDisabled} // <-- DÙNG CỜ SEARCH
          />
        </div>

        {showLoading &&
          <div className="loading-overlay">Đang tải trang mới...</div>
        }

        <MovieList movies={moviesToRender} />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChangeHandler}
          isDisabled={paginationDisabled} 
        />
      </main>
      <footer className="main-footer">
        <p>
          &copy; {new Date().getFullYear()} Phim Ngắn. Mọi quyền được bảo lưu.
        </p>
      </footer>
    </div>
  );
}

export default memo(Home);