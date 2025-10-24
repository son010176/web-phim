// src/pages/AllActorsPage.js (Nâng cấp "Đồng bộ Trang" khi chuyển chế độ)

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./AllActorsPage.css";
import ImageWithFallback from "../components/ImageWithFallback";
import { createSlug } from "../utils/createSlug";
import { formatDate } from "../utils/formatDate";
import SortDropdown from "../components/SortDropdown";
import DropdownFilter from "../components/DropdownFilter";
import Pagination from "../components/Pagination";
import { getActorsPage } from "../services/api";

const ITEMS_PER_PAGE = 20; 

function AllActorsPage({
  clientActors, 
  sortOrder, handleSortChange, selectedGender, handleGenderToggle, 
  isCacheReady, 
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
      console.log("AllActors: Bắt đầu ở Chế độ Server. Tải trang 1...");
      setServerData(prev => ({ ...prev, isLoading: true }));
      getActorsPage().then(res => {
        setServerData(prev => ({
          ...prev,
          list: res.data || [],
          totalPages: res.totalPages || 1,
          pageTokens: { ...prev.pageTokens, 2: res.pagination.nextPageToken },
          isLoading: false
        }));
      }).catch(err => {
        console.error("Lỗi tải getActorsPage:", err);
        setServerData(prev => ({ ...prev, isLoading: false }));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // 2. useEffect (Theo dõi "công tắc" VÀ ĐỒNG BỘ TRANG)
  useEffect(() => {
    if (isCacheReady && effectiveMode === 'server') {
      console.log(`AllActors: Cache sẵn sàng. Nâng cấp lên Client Mode, đồng bộ trang ${serverData.currentPage}.`);
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
        console.log("AllActors: Client filters/sort changed. Resetting to page 1.");
        setClientCurrentPage(1);
      }
    }
  }, [clientActors, effectiveMode]); // Phụ thuộc vào `clientActors` (kết quả lọc)

  // Hàm xử lý phân trang server
  const handleServerPageChange = async (newPage) => {
    const { currentPage, isLoading, pageTokens } = serverData;
    if (newPage === currentPage || isLoading) return;

    setServerData(prev => ({ ...prev, isLoading: true }));
    const token = pageTokens[newPage];
    const res = await getActorsPage({ pageToken: token });
    
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
  
  const clientTotalPages = Math.ceil(clientActors.length / ITEMS_PER_PAGE);
  const currentClientActors = clientActors.slice(
    (clientCurrentPage - 1) * ITEMS_PER_PAGE,
    clientCurrentPage * ITEMS_PER_PAGE
  );
  
  const actorsToRender = isClientMode ? currentClientActors : serverData.list;
  const isLoading = !isClientMode && serverData.isLoading;

  return (
    <div className="main-content-section">
      <div className="aa-container">
        <h1 className="section-title">Danh Sách Diễn Viên</h1>

          <div className="controls-wrapper">
            <DropdownFilter
              genres={["Nam", "Nữ"]}
              selectedGenres={[selectedGender]}
              onGenreToggle={handleGenderToggle}
              isDisabled={!isClientMode} // <-- Disable
            />
            <SortDropdown
              currentSortOrder={sortOrder}
              onSortChange={handleSortChange}
              isDisabled={!isClientMode} // <-- Disable
            />
          </div>

        {actorsToRender.length === 0 && !isLoading ? (
          <p>Không có diễn viên nào.</p>
        ) : (
          <>
            {(isLoading || (!isClientMode && actorsToRender.length === 0)) && 
              <div className="loading-overlay">Đang tải trang mới...</div>
            }

            <div className="movie-list">
              {actorsToRender.map((actor) => (
                <Link
                  to={`/dien-vien/${actor.id || createSlug(actor.ten)}`}
                  key={actor.id}
                  className="movie-card-link"
                >
                  <div className="movie-card">
                    <ImageWithFallback
                      src={actor.linkAnhProfile}
                      alt={`Ảnh của ${actor.ten}`}
                      type="user"
                    />
                    <div className="movie-info">
                      <h3 className="movie-title" title={actor.ten}>
                        {actor.ten}
                      </h3>
                      <div className="aa-actor-meta">
                        <p className="aa-info-item" title={actor.tenBinhAm}>
                          {actor.tenBinhAm}
                        </p>
                        <p className="aa-info-item">
                          {formatDate(actor.ngaySinh)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
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

export default AllActorsPage;