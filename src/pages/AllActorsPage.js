// src/pages/AllActorsPage.js (Đã sửa lỗi logic, dùng isSearchReady làm công tắc)

import React, { useState, useEffect, memo, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import "./AllActorsPage.css"; 
import ImageWithFallback from "../components/ImageWithFallback";
import { createSlug } from "../utils/createSlug";
import { formatDate } from "../utils/formatDate";
import { splitActorName } from "../utils/actorUtils";
import SortDropdown from "../components/SortDropdown";
import DropdownFilter from "../components/DropdownFilter";
import Pagination from "../components/Pagination";
import { getActorsPage } from "../services/api"; 

const ITEMS_PER_PAGE = 20;

function AllActorsPage({
  clientActors, // Data đã lọc/sắp xếp từ App.js
  uniqueGenders, selectedGender, handleGenderToggle, sortOrder, handleSortChange,
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
      console.log("AllActors: Chế độ Server (chờ Search Cache). Tải trang 1 (Cloudflare)...");
      setServerData(prev => ({ ...prev, isLoading: true }));
      getActorsPage() // Gọi API trang 1
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
          console.error("AllActors: Lỗi tải trang 1 (Cloudflare):", err);
          setServerData(prev => ({ ...prev, isLoading: false }));
        });
    }
  }, [isSearchReady, serverData.list.length, serverData.isLoading]); // Phụ thuộc vào cờ isSearchReady

  // 2. useEffect (Reset trang Client): Khi filter/sort thay đổi
  useEffect(() => {
    // Chỉ reset nếu search ĐÃ sẵn sàng (vì đang dùng data client)
    if (isSearchReady) {
      console.log("AllActors (Client): Filter/Sort thay đổi, reset về trang 1.");
      setClientCurrentPage(1);
    }
  }, [selectedGender, sortOrder, isSearchReady]); // Phụ thuộc filter và cờ isSearchReady

  // --- HÀM PHÂN TRANG ---

  // Phân trang Server (Cloudflare)
  const handleServerPageChange = useCallback(async (newPage) => {
    // Chỉ chạy khi search CHƯA sẵn sàng
    if (isSearchReady || serverData.isLoading) return;

    console.log(`AllActors (Server): Chuyển đến trang ${newPage}...`);
    setServerData(prev => ({ ...prev, isLoading: true }));
    try {
      const pageToken = serverData.pageTokens[newPage];
      const res = await getActorsPage({ pageToken }); 

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
      console.error("AllActors (Server): Lỗi tải trang mới:", error);
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

  let actorsToRender = [];
  let currentPage = 1;
  let totalPages = 1;
  let onPageChangeHandler = () => {};
  let paginationDisabled = false;

  if (isSearchReady) {
    // --- CHẾ ĐỘ CLIENT (Dùng searchCache hoặc fullCache) ---
    // clientActors là prop đã được lọc bởi hook trong App.js
    const totalActors = clientActors.length;
    totalPages = totalActors > 0 ? Math.ceil(totalActors / ITEMS_PER_PAGE) : 1;
    const safeClientPage = Math.min(clientCurrentPage, totalPages);
    const startIndex = (safeClientPage - 1) * ITEMS_PER_PAGE;
    actorsToRender = clientActors.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    currentPage = safeClientPage;
    onPageChangeHandler = handleClientPageChange;
    paginationDisabled = false; // Luôn bật
  } else {
    // --- CHẾ ĐỘ SERVER (Chờ searchCache) ---
    actorsToRender = serverData.list;
    currentPage = serverData.currentPage;
    totalPages = serverData.totalPages;
    onPageChangeHandler = handleServerPageChange;
    paginationDisabled = serverData.isLoading; // Vô hiệu hóa khi đang tải
  }

  // Hiển thị loading overlay chỉ khi đang tải ở server mode
  const showLoadingOverlay = serverData.isLoading && !isSearchReady;

  return (
    <div className="main-content-section">
      <div className="aa-container">
        <div className="controls-wrapper">
           <DropdownFilter
            // genres={uniqueGenders || ["Nam", "Nữ"]}
            genres={Array.isArray(uniqueGenders) ? uniqueGenders : ["Nam", "Nữ"]}
            selectedGenres={selectedGender === 'Tất cả' ? ['Tất cả'] : [selectedGender].filter(Boolean)}
            onGenreToggle={handleGenderToggle} 
            isDisabled={controlsDisabled} // <-- DÙNG CỜ SEARCH
            panelWidth="240px"
          />
          <h1 className="section-title">Danh Sách Diễn Viên</h1>
          <SortDropdown
            currentSortOrder={sortOrder}
            onSortChange={handleSortChange}
            isDisabled={controlsDisabled} // <-- DÙNG CỜ SEARCH
          />
        </div>

        {/* {showLoadingOverlay && <div className="loading-overlay aa-loading">Đang tải trang mới...</div>} */}
        {showLoadingOverlay && <div className="loading-indicator loading-indicator--overlay">Đang tải trang mới...</div>}

        {actorsToRender.length === 0 && !showLoadingOverlay ? (
            // <p className="aa-loading">Không có diễn viên nào phù hợp.</p> 
            <div className="loading-indicator">Không có diễn viên nào phù hợp.</div> // Sử dụng div và class mới
        ) : (
          <div className="movie-list"> 
            {actorsToRender.map((actor) => {
              // --- VẪN SỬ DỤNG HÀM NHƯ CŨ ---
              const { vietnameseName, chineseName } = splitActorName(actor.ten);
              // --- ---
              return (
                <Link
                  to={`/dien-vien/${actor.id || createSlug(actor.ten)}`}
                  key={actor.id || actor.ten}
                  className="movie-card-link"
                >
                  <div className="movie-card">
                    <ImageWithFallback
                      src={actor.linkAnhProfile}
                      alt={`Ảnh của ${vietnameseName}`}
                      type="user"
                    />
                    <div className="movie-info">
                      <h3 className="movie-title actor-name-split" title={actor.ten}>
                        {vietnameseName}
                        {chineseName && <span className="actor-chinese-name">{chineseName}</span>}
                      </h3>
                      <div className="aa-actor-meta">
                        <p className="aa-info-item" title={actor.tenBinhAm}>
                          {actor.tenBinhAm || '...'}
                        </p>
                        <p className="aa-info-item">
                          {formatDate(actor.ngaySinh) || '...'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChangeHandler}
          isDisabled={paginationDisabled} 
        />
      </div>
    </div>
  );
}

export default memo(AllActorsPage);