// src/pages/AllCouplesPage.js (Đã sửa logic, dùng isSearchReady làm công tắc)

import React, { useState, useEffect, memo, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import "./AllCouplesPage.css";
import ImageWithFallback from "../components/ImageWithFallback";
import SortDropdown from "../components/SortDropdown";
import Pagination from "../components/Pagination";
import { getCouplesPage } from "../services/api"; // <-- Import API server

const ITEMS_PER_PAGE = 20;

function AllCouplesPage({ 
  clientCouples, // Data đã lọc/sắp xếp từ App.js
  sortOrder, handleSortChange, 
  isSearchReady, // <-- CÔNG TẮC CHÍNH
  isFullDataReady // (File này không cần dùng cờ này nữa)
}) {

  // State cho server mode (Cloudflare)
  const [serverData, setServerData] = useState({
    list: [], currentPage: 1, totalPages: 1, pageTokens: { 1: null }, isLoading: false
  });

  // State cho client mode (IndexedDB)
  const [clientCurrentPage, setClientCurrentPage] = useState(1);

  // KHÔNG CẦN effectiveMode hay isTransitioning nữa

  // 1. useEffect (Server Mode): Tải trang 1 KHI VÀ CHỈ KHI search CHƯA sẵn sàng
  useEffect(() => {
    // Chỉ chạy nếu search CHƯA sẵn sàng, list rỗng và không đang loading
    if (!isSearchReady && serverData.list.length === 0 && !serverData.isLoading) {
      console.log("AllCouples: Chế độ Server (chờ Search Cache). Tải trang 1 (Cloudflare)...");
      setServerData(prev => ({ ...prev, isLoading: true }));
      getCouplesPage() // Gọi API trang 1
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
             setServerData(prev => ({ ...prev, list: [], isLoading: false })); 
          }
        })
        .catch(err => {
          console.error("AllCouples: Lỗi tải trang 1 (Cloudflare):", err);
          setServerData(prev => ({ ...prev, isLoading: false }));
        });
    }
  }, [isSearchReady, serverData.list.length, serverData.isLoading]); // Phụ thuộc vào cờ isSearchReady

  // 2. useEffect (Reset trang Client): Khi filter/sort thay đổi
  useEffect(() => {
    // Chỉ reset nếu search ĐÃ sẵn sàng (vì đang dùng data client)
    if (isSearchReady) {
      console.log("AllCouples (Client): Sort thay đổi, reset về trang 1.");
      setClientCurrentPage(1);
    }
  }, [sortOrder, isSearchReady]); // Phụ thuộc sort và cờ isSearchReady

  // --- HÀM PHÂN TRANG ---

  // Phân trang Server (Cloudflare)
  const handleServerPageChange = useCallback(async (newPage) => {
    // Chỉ chạy khi search CHƯA sẵn sàng
    if (isSearchReady || serverData.isLoading) return;

    console.log(`AllCouples (Server): Chuyển đến trang ${newPage}...`);
    setServerData(prev => ({ ...prev, isLoading: true }));
    try {
      const pageToken = serverData.pageTokens[newPage];
      const res = await getCouplesPage({ pageToken }); 

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
         setServerData(prev => ({ ...prev, list: [], isLoading: false }));
      }
    } catch (error) {
      console.error("AllCouples (Server): Lỗi tải trang mới:", error);
      setServerData(prev => ({ ...prev, isLoading: false }));
    }
  }, [isSearchReady, serverData]); // Phụ thuộc cờ isSearchReady

  // Phân trang Client (IndexedDB)
  const handleClientPageChange = (newPage) => {
    setClientCurrentPage(newPage);
    window.scrollTo(0, 0); 
  };

  // --- LOGIC RENDER ---

  // Sort bị vô hiệu hóa khi CHƯA CÓ SEARCH DATA (isSearchReady = false)
  const controlsDisabled = !isSearchReady;

  let couplesToRender = [];
  let currentPage = 1;
  let totalPages = 1;
  let onPageChangeHandler = () => {};
  let paginationDisabled = false;

  if (isSearchReady) {
    // --- CHẾ ĐỘ CLIENT (Dùng searchCache hoặc fullCache) ---
    // clientCouples là prop đã được lọc bởi hook trong App.js
    const totalCouples = clientCouples.length;
    totalPages = totalCouples > 0 ? Math.ceil(totalCouples / ITEMS_PER_PAGE) : 1;
    const safeClientPage = Math.min(clientCurrentPage, totalPages);
    const startIndex = (safeClientPage - 1) * ITEMS_PER_PAGE;
    couplesToRender = clientCouples.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    currentPage = safeClientPage;
    onPageChangeHandler = handleClientPageChange;
    paginationDisabled = false; // Luôn bật
  } else {
    // --- CHẾ ĐỘ SERVER (Chờ searchCache) ---
    couplesToRender = serverData.list;
    currentPage = serverData.currentPage;
    totalPages = serverData.totalPages;
    onPageChangeHandler = handleServerPageChange;
    paginationDisabled = serverData.isLoading; // Vô hiệu hóa khi đang tải
  }

  // Hiển thị loading overlay chỉ khi đang tải ở server mode
  const showLoadingOverlay = serverData.isLoading && !isSearchReady;
  
  return (
    <div className="main-content-section">
      <div className="ac-container">
        <h1 className="ac-main-title section-title">
          Tổng Hợp Phim Theo Cặp Đôi
        </h1>
        
          <div className="controls-wrapper">
            <SortDropdown
              currentSortOrder={sortOrder}
              onSortChange={handleSortChange}
              isDisabled={controlsDisabled} // <-- DÙNG CỜ SEARCH
            />
          </div>

        {showLoadingOverlay && <div className="loading-overlay ac-loading">Đang tải trang mới...</div>}

        {couplesToRender.length === 0 && !showLoadingOverlay ? (
          <p className="ac-loading">Không có cặp đôi nào.</p>
        ) : (
          <>
            <div className="movie-list">
              {couplesToRender.map((couple) => {
                // Lấy poster từ phim đầu tiên (nếu có)
                const couplePoster =
                  couple.movies && couple.movies.length > 0
                    ? couple.movies[0].linkPoster
                    : (couple.linkPost || null); // Fallback về linkPost (nếu có) từ search-data

                return (
                  <Link
                    to={`/dien-vien-couples/${couple.id}`} 
                    key={couple.id}
                    className="movie-card-link"
                  >
                    <div className="movie-card">
                      <ImageWithFallback
                        src={couplePoster}
                        alt={`Poster của ${couple.tenCouple}`}
                        type="movie"
                      />
                      <div className="movie-info">
                        <h3 className="movie-title" title={couple.tenCouple}>
                          {couple.tenCouple}
                        </h3>
                        <div className="ac-card-meta">
                          <span>{couple.tongSoPhim} phim</span>
                          <span
                            className={`ac-card-status ${couple.tinhTrangCapNhat?.toLowerCase()}`}
                          >
                            {couple.tinhTrangCapNhat}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChangeHandler}
              isDisabled={paginationDisabled} 
            />
          </>
        )}
      </div>
    </div>
  );
}

export default memo(AllCouplesPage);