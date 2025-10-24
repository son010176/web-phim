// src/pages/StorylinePage.js (Nâng cấp "Đồng bộ Trang" khi chuyển chế độ)

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./StorylinePage.css";
import ImageWithFallback from "../components/ImageWithFallback";
import SortDropdown from "../components/SortDropdown";
import DropdownFilter from "../components/DropdownFilter";
import Pagination from "../components/Pagination";
import { getStorylinesPage } from "../services/api";

const ITEMS_PER_PAGE = 20;

function StorylinePage({ 
  clientStorylines,
  sortOrder, handleSortChange, selectedTheLoai, handleTheLoaiToggle,
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
      console.log("Storyline: Bắt đầu ở Chế độ Server. Tải trang 1...");
      setServerData(prev => ({ ...prev, isLoading: true }));
      getStorylinesPage().then(res => {
        setServerData(prev => ({
          ...prev,
          list: res.data || [],
          totalPages: res.totalPages || 1,
          pageTokens: { ...prev.pageTokens, 2: res.pagination.nextPageToken },
          isLoading: false
        }));
      }).catch(err => {
        console.error("Lỗi tải getStorylinesPage:", err);
        setServerData(prev => ({ ...prev, isLoading: false }));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // 2. useEffect (Theo dõi "công tắc" VÀ ĐỒNG BỘ TRANG)
  useEffect(() => {
    if (isCacheReady && effectiveMode === 'server') {
      console.log(`Storyline: Cache sẵn sàng. Nâng cấp lên Client Mode, đồng bộ trang ${serverData.currentPage}.`);
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
        console.log("Storyline: Client filters/sort changed. Resetting to page 1.");
        setClientCurrentPage(1);
      }
    }
  }, [clientStorylines, effectiveMode]); // Phụ thuộc vào `clientStorylines` (kết quả lọc)

  // Hàm xử lý phân trang server
  const handleServerPageChange = async (newPage) => {
    const { currentPage, isLoading, pageTokens } = serverData;
    if (newPage === currentPage || isLoading) return;

    setServerData(prev => ({ ...prev, isLoading: true }));
    const token = pageTokens[newPage];
    const res = await getStorylinesPage({ pageToken: token });
    
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
  
  const clientTotalPages = Math.ceil(clientStorylines.length / ITEMS_PER_PAGE);
  const currentClientStorylines = clientStorylines.slice(
    (clientCurrentPage - 1) * ITEMS_PER_PAGE,
    clientCurrentPage * ITEMS_PER_PAGE
  );
  
  const storylinesToRender = isClientMode ? currentClientStorylines : serverData.list;
  const isLoading = !isClientMode && serverData.isLoading;

  if (!storylinesToRender && !isLoading) {
    return <div className="sl-loading">Đang tải danh sách...</div>;
  }

  return (
    <div className="main-content-section">
      <div className="sl-container">
        <h1 className="sl-main-title section-title">
          Tổng Hợp Phim Cùng Cốt Truyện
        </h1>
        
          <div className="controls-wrapper">
            <DropdownFilter
              genres={["Hiện đại", "Cổ trang", "Niên đại"]} 
              selectedGenres={[selectedTheLoai]}
              onGenreToggle={handleTheLoaiToggle}
              isDisabled={!isClientMode} // <-- Disable
            />
            <SortDropdown
              currentSortOrder={sortOrder}
              onSortChange={handleSortChange}
              isDisabled={!isClientMode} // <-- Disable
            />
          </div>

        {storylinesToRender.length === 0 && !isLoading ? (
          <p>Không có mục nào.</p>
        ) : (
          <>
            {(isLoading || (!isClientMode && storylinesToRender.length === 0)) && 
              <div className="loading-overlay">Đang tải trang mới...</div>
            }

            <div className="sl-list">
              {storylinesToRender.map((item) => {
                const movies = item.movies || [];
                const storylinePoster = movies.find(movie => movie.linkPoster)?.linkPoster || null;

                return (
                  <Link
                    to={`/phim-couples/${item.id}`} 
                    key={item.id}
                    className="sl-item-link"
                  >
                    <div className="sl-item-card">
                      <div className="sl-item-poster">
                        <ImageWithFallback
                          src={storylinePoster}
                          alt={`Poster của ${item.tenCouple}`}
                          type="movie"
                        />
                      </div>
                      <div className="sl-item-info">
                        <h3 className="sl-item-title">{item.tenCouple}</h3>
                        <p className="sl-item-novel">{item.tieuThuyetGoc}</p>
                        <p className="sl-item-tags">{item.tagTheLoai}</p>
                        <div className="sl-item-meta">
                          <span>{item.tongSoPhienBan} phiên bản</span>
                          <span
                            className={`sl-item-status ${item.tinhTrangCapNhat?.toLowerCase()}`}
                          >
                            {item.tinhTrangCapNhat}
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

export default StorylinePage;