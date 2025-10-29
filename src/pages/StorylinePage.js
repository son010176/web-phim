// src/pages/StorylinePage.js (Đã sửa logic, dùng isSearchReady làm công tắc)

import React, { useState, useEffect, memo, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import "./StorylinePage.css";
import ImageWithFallback from "../components/ImageWithFallback";
import SortDropdown from "../components/SortDropdown";
import DropdownFilter from "../components/DropdownFilter";
import Pagination from "../components/Pagination";
import { getStorylinesPage } from "../services/api"; // <-- Import API server

const ITEMS_PER_PAGE = 20;

function StorylinePage({ 
  clientStorylines, // Data đã lọc/sắp xếp từ App.js
  uniqueTheLoai, selectedTheLoai, handleTheLoaiToggle, sortOrder, handleSortChange,
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
      console.log("Storyline: Chế độ Server (chờ Search Cache). Tải trang 1 (Cloudflare)...");
      setServerData(prev => ({ ...prev, isLoading: true }));
      getStorylinesPage() // Gọi API trang 1
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
          console.error("Storyline: Lỗi tải trang 1 (Cloudflare):", err);
          setServerData(prev => ({ ...prev, isLoading: false }));
        });
    }
  }, [isSearchReady, serverData.list.length, serverData.isLoading]); // Phụ thuộc vào cờ isSearchReady

  // 2. useEffect (Reset trang Client): Khi filter/sort thay đổi
  useEffect(() => {
    // Chỉ reset nếu search ĐÃ sẵn sàng (vì đang dùng data client)
    if (isSearchReady) {
      console.log("Storyline (Client): Filter/Sort thay đổi, reset về trang 1.");
      setClientCurrentPage(1);
    }
  }, [selectedTheLoai, sortOrder, isSearchReady]); // Phụ thuộc filter/sort và cờ isSearchReady

  // --- HÀM PHÂN TRANG ---

  // Phân trang Server (Cloudflare)
  const handleServerPageChange = useCallback(async (newPage) => {
    // Chỉ chạy khi search CHƯA sẵn sàng
    if (isSearchReady || serverData.isLoading) return;

    console.log(`Storyline (Server): Chuyển đến trang ${newPage}...`);
    setServerData(prev => ({ ...prev, isLoading: true }));
    try {
      const pageToken = serverData.pageTokens[newPage];
      const res = await getStorylinesPage({ pageToken }); 

      if (res && res.data) {
        setServerData(prev => ({
          ...prev,
          list: res.data,
          currentPage: newPage,
          totalPages: res.pagination?.totalPages || prev.totalPages,
          pageTokens: { ...prev.pageTokens, [newPage + 1]: res.pagination?.nextPageToken },
          isLoading: false
        }));
        // window.scrollTo(0, 0);
      } else {
         setServerData(prev => ({ ...prev, list: [], isLoading: false }));
      }
    } catch (error) {
      console.error("Storyline (Server): Lỗi tải trang mới:", error);
      setServerData(prev => ({ ...prev, isLoading: false }));
    }
  }, [isSearchReady, serverData]); // Phụ thuộc cờ isSearchReady

  // Phân trang Client (IndexedDB)
  const handleClientPageChange = (newPage) => {
    setClientCurrentPage(newPage);
    // window.scrollTo(0, 0); 
  };

  // --- LOGIC RENDER ---

  // Filter/Sort bị vô hiệu hóa khi CHƯA CÓ SEARCH DATA (isSearchReady = false)
  const controlsDisabled = !isSearchReady;

  let storylinesToRender = [];
  let currentPage = 1;
  let totalPages = 1;
  let onPageChangeHandler = () => {};
  let paginationDisabled = false;

  if (isSearchReady) {
    // --- CHẾ ĐỘ CLIENT (Dùng searchCache hoặc fullCache) ---
    // clientStorylines là prop đã được lọc bởi hook trong App.js
    const totalStorylines = clientStorylines.length;
    totalPages = totalStorylines > 0 ? Math.ceil(totalStorylines / ITEMS_PER_PAGE) : 1;
    const safeClientPage = Math.min(clientCurrentPage, totalPages);
    const startIndex = (safeClientPage - 1) * ITEMS_PER_PAGE;
    storylinesToRender = clientStorylines.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    currentPage = safeClientPage;
    onPageChangeHandler = handleClientPageChange;
    paginationDisabled = false; // Luôn bật
  } else {
    // --- CHẾ ĐỘ SERVER (Chờ searchCache) ---
    storylinesToRender = serverData.list;
    currentPage = serverData.currentPage;
    totalPages = serverData.totalPages;
    onPageChangeHandler = handleServerPageChange;
    paginationDisabled = serverData.isLoading; // Vô hiệu hóa khi đang tải
  }

  // Hiển thị loading overlay chỉ khi đang tải ở server mode
  const showLoadingOverlay = serverData.isLoading && !isSearchReady;
  
  return (
    <div className="main-content-section">
      <div className="sl-container">
          <div className="controls-wrapper">
            <DropdownFilter
              // genres={uniqueTheLoai || ["Hiện đại", "Cổ trang", "Niên đại"]}
              genres={Array.isArray(uniqueTheLoai) ? uniqueTheLoai : ["Hiện đại", "Cổ trang", "Niên đại"]} 
              selectedGenres={[selectedTheLoai]}
              onGenreToggle={handleTheLoaiToggle}
              isDisabled={controlsDisabled} // <-- DÙNG CỜ SEARCH
              panelWidth="380px"
            />
            <h1 className="sl-main-title section-title">Phim Cùng Cốt Truyện</h1>
            <SortDropdown
              currentSortOrder={sortOrder}
              onSortChange={handleSortChange}
              isDisabled={controlsDisabled} // <-- DÙNG CỜ SEARCH
            />
          </div>

        {/* {showLoadingOverlay && <div className="loading-overlay sl-loading">Đang tải trang mới...</div>} */}
        {showLoadingOverlay && <div className="loading-indicator loading-indicator--overlay">Đang tải trang mới...</div>}

        {storylinesToRender.length === 0 && !showLoadingOverlay ? (
          // <p className="sl-loading">Không có mục nào.</p>
          <div className="loading-indicator">Không có mục nào.</div> // Sử dụng div và class mới
        ) : (
          <>
            <div className="sl-list">
              {storylinesToRender.map((item) => {
                const movies = item.movies || [];
                // Lấy poster từ search-data (nếu có) hoặc từ API (nếu có)
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
                        <p className="sl-item-tags">{item.tagTheLoai || item.theLoai}</p>
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

export default memo(StorylinePage);