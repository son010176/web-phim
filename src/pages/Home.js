// src/pages/Home.js (Nâng cấp "Đồng bộ Trang" khi chuyển chế độ)

import React, { useState, useEffect, memo, useRef } from "react";
import DropdownFilter from "../components/DropdownFilter";
import SortDropdown from "../components/SortDropdown";
import MovieList from "../components/MovieList";
import Pagination from "../components/Pagination";
import "./Home.css";
import { getMoviesPage } from "../services/api";

const MOVIES_PER_PAGE = 24; 

function Home({ 
  clientMovies, 
  uniqueGenres, selectedGenres, handleGenreToggle, sortOrder, handleSortChange, 
  isCacheReady
}) {
  
  const [serverData, setServerData] = useState({
    list: [], currentPage: 1, totalPages: 1, pageTokens: { 1: null }, isLoading: false
  });
  
  const [clientCurrentPage, setClientCurrentPage] = useState(1);
  const [effectiveMode, setEffectiveMode] = useState(isCacheReady ? 'client' : 'server');

  // --- THAY ĐỔI: Thêm 1 "cổng" (ref) để quản lý việc chuyển giao ---
  // Ref này dùng để ngăn việc reset trang về 1 khi tự động chuyển chế độ
  const isTransitioning = useRef(false);

  // 1. useEffect (Mount): Tải page 1 của server (Không đổi)
  useEffect(() => {
    if (effectiveMode === 'server') {
      console.log("Home: Bắt đầu ở Chế độ Server. Tải trang 1...");
      setServerData(prev => ({ ...prev, isLoading: true }));
      getMoviesPage().then(res => {
        setServerData(prev => ({
          ...prev,
          list: res.data || [],
          totalPages: res.totalPages || 1,
          pageTokens: { ...prev.pageTokens, 2: res.pagination.nextPageToken },
          isLoading: false
        }));
      }).catch(err => {
        console.error("Lỗi tải getMoviesPage:", err);
        setServerData(prev => ({ ...prev, isLoading: false }));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // 2. useEffect (Theo dõi "công tắc" VÀ ĐỒNG BỘ TRANG)
  useEffect(() => {
    // Chỉ kích hoạt nếu "công tắc" bật và chúng ta vẫn đang ở chế độ server
    if (isCacheReady && effectiveMode === 'server') {
      
      console.log(`Home: Cache sẵn sàng. Nâng cấp lên Client Mode, đồng bộ trang ${serverData.currentPage}.`);
      
      // Mở "cổng" để báo hiệu rằng chúng ta đang chuyển giao
      isTransitioning.current = true;
      
      // THAY ĐỔI QUAN TRỌNG:
      // Đồng bộ trang server hiện tại qua trang client
      setClientCurrentPage(serverData.currentPage);
      
      // Chuyển chế độ
      setEffectiveMode('client');
    }
  }, [isCacheReady, effectiveMode, serverData.currentPage]); // Thêm serverData.currentPage
  
  // 3. useEffect (Reset Client Page KHI LỌC/SẮP XẾP)
  useEffect(() => {
    // Chỉ chạy nếu chúng ta đã ở chế độ client
    if (effectiveMode === 'client') {
      
      // KIỂM TRA "CỔNG":
      // Nếu "cổng" đang mở (tức là chúng ta vừa chuyển chế độ),
      // thì KHÔNG reset trang, và đóng "cổng" lại.
      if (isTransitioning.current) {
        console.log("Home: Bỏ qua reset trang do đang transition.");
        isTransitioning.current = false;
      } else {
        // "Cổng" đang đóng, nghĩa là người dùng vừa lọc/sắp xếp
        // -> Reset về trang 1
        console.log("Home: Client filters/sort changed. Resetting to page 1.");
        setClientCurrentPage(1);
      }
    }
  }, [clientMovies, effectiveMode]); // Phụ thuộc vào `clientMovies` (kết quả lọc)

  // Hàm xử lý phân trang server (Không đổi)
  const handleServerPageChange = async (newPage) => {
    const { currentPage, isLoading, pageTokens } = serverData;
    if (newPage === currentPage || isLoading) return;

    setServerData(prev => ({ ...prev, isLoading: true }));
    const token = pageTokens[newPage];
    const res = await getMoviesPage({ pageToken: token });
    
    setServerData(prev => ({
      ...prev,
      list: res.data || [],
      currentPage: newPage,
      pageTokens: { ...prev.pageTokens, [newPage + 1]: res.pagination.nextPageToken },
      isLoading: false
    }));
    window.scrollTo(0, 0);
  };

  // --- Logic Render (Không đổi) ---
  const isClientMode = effectiveMode === 'client'; 
  
  const clientTotalPages = Math.ceil(clientMovies.length / MOVIES_PER_PAGE);
  const currentClientMovies = clientMovies.slice(
    (clientCurrentPage - 1) * MOVIES_PER_PAGE,
    clientCurrentPage * MOVIES_PER_PAGE
  );
  
  const moviesToRender = isClientMode ? currentClientMovies : serverData.list;
  const isLoading = !isClientMode && serverData.isLoading;

  return (
    <div className="home-content">
      <main className="movie-list-section">
          <div className="controls-wrapper">
            <DropdownFilter
              genres={uniqueGenres}
              selectedGenres={selectedGenres}
              onGenreToggle={handleGenreToggle} // Sửa lại tên prop nếu cần
              isDisabled={!isClientMode} 
            />
            <SortDropdown
              currentSortOrder={sortOrder}
              onSortChange={handleSortChange}
              isDisabled={!isClientMode} 
            />
          </div>
        
        {(isLoading || (!isClientMode && moviesToRender.length === 0)) && 
          <div className="loading-overlay">Đang tải trang mới...</div>
        }
        
        <MovieList movies={moviesToRender} />

        {isClientMode ? (
          <Pagination 
            currentPage={clientCurrentPage}
            totalPages={clientTotalPages}
            onPageChange={setClientCurrentPage}
            // isDisabled={false} // Mặc định là false
          />
        ) : (
          <Pagination 
            currentPage={serverData.currentPage}
            totalPages={serverData.totalPages}
            onPageChange={handleServerPageChange}
            isDisabled={!isClientMode} 
          />
        )}
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