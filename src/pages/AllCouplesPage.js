// src/pages/AllCouplesPage.js (Nâng cấp "Đồng bộ Trang" khi chuyển chế độ)

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./AllCouplesPage.css";
import ImageWithFallback from "../components/ImageWithFallback";
import SortDropdown from "../components/SortDropdown";
import Pagination from "../components/Pagination";
import { getCouplesPage } from "../services/api";

const ITEMS_PER_PAGE = 20;

function AllCouplesPage({ 
  clientCouples, 
  sortOrder, handleSortChange, 
  isCacheReady 
}) {

  const [serverData, setServerData] = useState({
    list: [], currentPage: 1, totalPages: 1, pageTokens: { 1: null }, isLoading: false
  });
  
  const [clientCurrentPage, setClientCurrentPage] = useState(1);
  const [effectiveMode, setEffectiveMode] = useState(isCacheReady ? 'client' : 'server');

  // Ref để quản lý việc chuyển giao
  const isTransitioning = useRef(false);

  // 1. useEffect (Mount): Tải page 1 của server
  useEffect(() => {
    if (effectiveMode === 'server') {
      console.log("AllCouples: Bắt đầu ở Chế độ Server. Tải trang 1...");
      setServerData(prev => ({ ...prev, isLoading: true }));
      getCouplesPage().then(res => {
        setServerData(prev => ({
          ...prev,
          list: res.data || [],
          totalPages: res.totalPages || 1,
          pageTokens: { ...prev.pageTokens, 2: res.pagination.nextPageToken },
          isLoading: false
        }));
      }).catch(err => {
        console.error("Lỗi tải getCouplesPage:", err);
        setServerData(prev => ({ ...prev, isLoading: false }));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // 2. useEffect (Theo dõi "công tắc" VÀ ĐỒNG BỘ TRANG)
  useEffect(() => {
    if (isCacheReady && effectiveMode === 'server') {
      console.log(`AllCouples: Cache sẵn sàng. Nâng cấp lên Client Mode, đồng bộ trang ${serverData.currentPage}.`);
      isTransitioning.current = true;
      setClientCurrentPage(serverData.currentPage);
      setEffectiveMode('client');
    }
  }, [isCacheReady, effectiveMode, serverData.currentPage]);
  
  // 3. useEffect (Reset Client Page KHI LỌC/SẮP XẾP)
  useEffect(() => {
    if (effectiveMode === 'client') {
      if (isTransitioning.current) {
        isTransitioning.current = false;
      } else {
        console.log("AllCouples: Client filters/sort changed. Resetting to page 1.");
        setClientCurrentPage(1);
      }
    }
  }, [clientCouples, effectiveMode]); // Phụ thuộc vào `clientCouples` (kết quả lọc)

  // Hàm xử lý phân trang server
  const handleServerPageChange = async (newPage) => {
    const { currentPage, isLoading, pageTokens } = serverData;
    if (newPage === currentPage || isLoading) return;

    setServerData(prev => ({ ...prev, isLoading: true }));
    const token = pageTokens[newPage];
    const res = await getCouplesPage({ pageToken: token });
    
    setServerData(prev => ({
      ...prev,
      list: res.data || [],
      currentPage: newPage,
      pageTokens: { ...prev.pageTokens, [newPage + 1]: res.pagination.nextPageToken },
      isLoading: false
    }));
    window.scrollTo(0, 0);
  };

  // --- Logic Render ---
  const isClientMode = effectiveMode === 'client'; 
  
  const clientTotalPages = Math.ceil(clientCouples.length / ITEMS_PER_PAGE);
  const currentClientCouples = clientCouples.slice(
    (clientCurrentPage - 1) * ITEMS_PER_PAGE,
    clientCurrentPage * ITEMS_PER_PAGE
  );
  
  const couplesToRender = isClientMode ? currentClientCouples : serverData.list;
  const isLoading = !isClientMode && serverData.isLoading;

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
              isDisabled={!isClientMode} // <-- Disable
            />
          </div>

        {couplesToRender.length === 0 && !isLoading ? (
          <p>Không có cặp đôi nào.</p>
        ) : (
          <>
            {(isLoading || (!isClientMode && couplesToRender.length === 0)) && 
              <div className="loading-overlay">Đang tải trang mới...</div>
            }

            <div className="movie-list">
              {couplesToRender.map((couple) => {
                const couplePoster =
                  couple.movies && couple.movies.length > 0
                    ? couple.movies[0].linkPoster
                    : null;

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
            
            {isClientMode ? (
              <Pagination
                currentPage={clientCurrentPage}
                totalPages={clientTotalPages}
                onPageChange={setClientCurrentPage}
              />
            ) : (
              <Pagination
                currentPage={serverData.currentPage}
                totalPages={serverData.totalPages}
                onPageChange={handleServerPageChange}
                isDisabled={!isClientMode} // <-- Vô hiệu hóa
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AllCouplesPage;