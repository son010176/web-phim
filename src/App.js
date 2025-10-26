// src/App.js (Đã refactor - Tách API và dùng Context)

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { performLiveSearch } from "./utils/search";

// --- IMPORT API ---
import {
  getDataFull,
  loadCacheFromDB,
  saveCacheToDB,
  CACHE_KEY_FULL, // Lấy key từ api_client
  CACHE_KEY_SEARCH, // Lấy key từ api_client
} from "./services/api_client";

// --- THÊM IMPORT MỚI TỪ api.js ---
import { getSearchData_CF } from "./services/api";

// --- IMPORT CÁC TRANG ---
import LoginPage from "./pages/LoginPage";
import Home from "./pages/Home";
import CoupleFilmMographyPage from "./pages/CoupleFilmMographyPage";
import StorylineFilmMographyPage from "./pages/StorylineFilmMographyPage";
import StorylinePage from "./pages/StorylinePage";
import AllCouplesPage from "./pages/AllCouplesPage";
import MovieDetail from "./pages/MovieDetail";
import AllActorsPage from "./pages/AllActorsPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import ActorProfilePage from "./pages/ActorProfilePage";
import AdminSandbox from "./pages/AdminSandbox";
import CollectionPage from "./pages/CollectionPage"; // <-- THÊM TRANG COLLECTION

// --- IMPORT CÁC COMPONENT ---
import Header from "./components/Header";
import ScrollToTopButton from "./components/ScrollToTopButton";
import ScrollToTopOnNavigate from "./components/ScrollToTopOnNavigate";
import useDebounce from "./hooks/useDebounce";
import "./App.css";

// --- IMPORT CÁC HOOK LỌC/SẮP XẾP ---
import { useMovieFilter } from "./hooks/useMovieFilter";
import { useActorFilter } from "./hooks/useActorFilter";
import { useCouplesFilter } from "./hooks/useCouplesFilter";
import { useStorylineFilter } from "./hooks/useStorylineFilter";

// LƯU Ý: App KHÔNG cần import useAuth hay getCollection nữa
// Vì CollectionContext sẽ tự quản lý

function App() {
  // State loading ban đầu (chỉ để kiểm tra IndexedDB)
  const [isLoading, setIsLoading] = useState(true);

  // --- State cho 3 luồng dữ liệu ---
  // Data nhẹ (chỉ dùng cho search/filter)
  const [searchCache, setSearchCache] = useState(null);
  // Data đầy đủ (dùng cho toàn bộ app)
  const [fullCache, setFullCache] = useState(null);

  // --- State điều phối (CÁC CỜ QUAN TRỌNG) ---
  // Cờ 1: Báo hiệu Search/Filter sẵn sàng
  const [isSearchReady, setIsSearchReady] = useState(false);
  // Cờ 2: Báo hiệu Chế độ Client (dùng data đầy đủ) sẵn sàng
  const [isFullDataReady, setIsFullDataReady] = useState(false);

  // --- HOOKS LỌC/SẮP XẾP (LUÔN DÙNG DỮ LIỆU MẠNH NHẤT HIỆN CÓ) ---
  // Ưu tiên fullCache, nếu chưa có thì dùng searchCache
  const effectiveCache = isFullDataReady ? fullCache : searchCache;

  // Cần kiểm tra effectiveCache tồn tại trước khi truy cập
  const moviesForFilter = effectiveCache?.movies || [];
  const actorsForFilter = effectiveCache?.actors || [];
  const couplesForFilter = effectiveCache?.couples || [];
  const storylinesForFilter = effectiveCache?.storylines || [];

  // Các hook này giờ sẽ nhận mảng rỗng lúc đầu,
  // và tự cập nhật khi effectiveCache thay đổi
  const { displayMovies, ...movieControls } = useMovieFilter(moviesForFilter);
  const { displayActors, ...actorControls } = useActorFilter(actorsForFilter);
  const { displayCouples, ...coupleControls } =
    useCouplesFilter(couplesForFilter);
  const { displayStorylines, ...storylineControls } =
    useStorylineFilter(storylinesForFilter);

  // --- STATE CHO SEARCH BAR (Giữ nguyên) ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchScope, setSearchScope] = useState("tenPhim");
  const [liveResults, setLiveResults] = useState([]);
  const debouncedSearchQuery = useDebounce(searchQuery, 100);

  // --- useEffect TẢI DỮ LIỆU (LOGIC 3 API MỚI) ---
  // src/App.js
  useEffect(() => {
    async function loadApplicationData() {
      console.log("🚀 Bắt đầu quá trình tải dữ liệu ứng dụng...");

      let shouldLoadFullInBackground = false; // ← Cờ để quyết định có load Full không

      // --- BƯỚC 1: KIỂM TRA CACHE ĐẦY ĐỦ (FULL) ---
      const dbFull = await loadCacheFromDB(CACHE_KEY_FULL, 6);
      if (dbFull) {
        console.log("✅ Chế độ CLIENT (Full): Tải từ IndexedDB (Full).");
        // ✅ SỬA: Gộp tất cả setState vào 1 batch (React tự động batch từ v18)
        setFullCache(dbFull);
        setSearchCache(dbFull);
        setIsSearchReady(true);
        setIsFullDataReady(true);
        setIsLoading(false);
        return; // Dừng hoàn toàn
      }

      // Nếu không có Full Cache, đánh dấu cần load Full ở background
      shouldLoadFullInBackground = true;

      // --- BƯỚC 2: KIỂM TRA CACHE NHẸ (SEARCH) ---
      const dbSearch = await loadCacheFromDB(CACHE_KEY_SEARCH, 6);
      if (dbSearch) {
        console.log("✅ Chế độ CLIENT (Search): Tải từ IndexedDB (Search).");
        setSearchCache(dbSearch);
        setIsSearchReady(true);
        setIsLoading(false); // ← Chỉ gọi 1 lần duy nhất ở đây
        // KHÔNG return, tiếp tục load Full ở background
      } else {
        // --- BƯỚC 3: TẢI API SEARCH (BẮT BUỘC) ---
        console.log("🔄 Đang tải API getSearchData_CF (Cloudflare R2)...");
        try {
          const searchData = await getSearchData_CF();
          if (searchData?.movies?.length > 0) {
            // ← Dùng optional chaining
            console.log("🔍 API getSearchData_CF hoàn tất.");
            setSearchCache(searchData);
            setIsSearchReady(true);
            saveCacheToDB(CACHE_KEY_SEARCH, searchData);
          } else {
            console.warn("⚠️ API getSearchData_CF không trả về dữ liệu.");
          }
        } catch (err) {
          console.error("❌ Lỗi API getSearchData_CF:", err);
        }

        setIsLoading(false); // ← Chỉ gọi 1 lần duy nhất ở đây
      }

      // --- BƯỚC 4: TẢI NGẦM DỮ LIỆU ĐẦY ĐỦ (FULL) ---
      if (shouldLoadFullInBackground) {
        console.log("🔄 Gọi API getDataFull (ngầm)...");
        try {
          const fullData = await getDataFull();
          if (fullData?.movies?.length > 0) {
            console.log("💾 API getDataFull hoàn tất.");

            // ✅ SỬA: Chỉ set những state cần thiết
            setFullCache(fullData);
            setIsFullDataReady(true);

            // ✅ SỬA: Chỉ nâng cấp searchCache nếu nó chưa có dữ liệu đầy đủ
            // (Tránh re-render không cần thiết nếu searchCache đã tốt)
            setSearchCache((prev) => {
              // Nếu prev đã có đủ movies, không cần cập nhật
              if (prev?.movies?.length >= fullData.movies.length) {
                console.log("ℹ️ SearchCache đã đầy đủ, không cập nhật.");
                return prev;
              }
              console.log("🔄 Nâng cấp SearchCache lên dữ liệu Full.");
              return fullData;
            });

            saveCacheToDB(CACHE_KEY_FULL, fullData);
            console.log("🚀 Đã nâng cấp ứng dụng lên dữ liệu đầy đủ.");
          } else {
            console.warn("⚠️ API getDataFull trả về rỗng, không nâng cấp.");
          }
        } catch (err) {
          console.error("❌ Lỗi API getDataFull:", err);
        }
      }
    }

    loadApplicationData();
  }, []); // ← Đảm bảo dependencies rỗng // Chỉ chạy 1 lần khi mount

  // --- useEffect CHO LIVE SEARCH (CẬP NHẬT) ---
  useEffect(() => {
    // Chỉ chạy search khi isSearchReady và có cache
    if (!isSearchReady || !searchCache || searchQuery.length < 2) {
      setLiveResults([]);
      return;
    }
    if (debouncedSearchQuery) {
      const results = performLiveSearch(
        debouncedSearchQuery,
        searchScope,
        searchCache.movies,
        searchCache.actors,
        searchCache.couples,
        searchCache.storylines
      );
      setLiveResults(results.slice(0, 5));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, searchScope, searchCache, isSearchReady]);

  if (isLoading) {
    // Chỉ hiển thị loading toàn trang khi đang kiểm tra IndexedDB
    return <div className="loading-message">Đang khởi động ứng dụng...</div>;
  }

  return (
    <Router>
      <ScrollToTopOnNavigate />
      <div className="App">
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchScope={searchScope}
          setSearchScope={setSearchScope}
          liveResults={liveResults}
          isSearchReady={isSearchReady} // <-- Truyền cờ search
        />
        <Routes>
          {/* --- TRANG HOME --- */}
          <Route
            path="/"
            element={
              <Home
                // Data đã lọc/sắp xếp từ hook
                clientMovies={displayMovies}
                // Các control từ hook lọc/sắp xếp
                {...movieControls}
                // Các cờ trạng thái
                isSearchReady={isSearchReady} // Cho filter/sort
                isFullDataReady={isFullDataReady} // Cho effectiveMode
              />
            }
          />
          {/* --- TRANG ALL ACTORS --- */}
          <Route
            path="/dien-vien/all-actors"
            element={
              <AllActorsPage
                clientActors={displayActors}
                {...actorControls}
                isSearchReady={isSearchReady}
                isFullDataReady={isFullDataReady}
              />
            }
          />
          {/* --- TRANG CHI TIẾT DIỄN VIÊN --- */}
          <Route
            path="/dien-vien/:slug"
            element={
              <ActorProfilePage
                // Chỉ truyền fullCache và cờ isFullDataReady
                fullCache={fullCache}
                isFullDataReady={isFullDataReady}
              />
            }
          />

          {/* --- CÁC ROUTE KHÁC --- */}
          <Route
            path="/phim/:id"
            element={
              <MovieDetail
                fullCache={fullCache}
                isFullDataReady={isFullDataReady}
              />
            }
          />
          <Route
            path="/search"
            element={
              <SearchResultsPage
                allMovies={searchCache?.movies || []} // Dùng search cache
              />
            }
          />
          <Route path="/admin-sandbox" element={<AdminSandbox />} />
          <Route
            path="/dien-vien-couples/all-couples"
            element={
              <AllCouplesPage
                clientCouples={displayCouples}
                {...coupleControls}
                isSearchReady={isSearchReady}
                isFullDataReady={isFullDataReady}
              />
            }
          />
          <Route
            path="/phim-couples/all-couples" // (Tên route của bạn)
            element={
              <StorylinePage
                clientStorylines={displayStorylines}
                {...storylineControls}
                isSearchReady={isSearchReady}
                isFullDataReady={isFullDataReady}
              />
            }
          />
          <Route
            path="/dien-vien-couples/:coupleId"
            element={
              <CoupleFilmMographyPage
                fullCache={fullCache}
                isFullDataReady={isFullDataReady}
              />
            }
          />
          <Route
            path="/phim-couples/:storylineId"
            element={
              <StorylineFilmMographyPage
                fullCache={fullCache}
                isFullDataReady={isFullDataReady}
              />
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/bo-suu-tap" element={<CollectionPage />} />
        </Routes>
        <ScrollToTopButton />
      </div>
    </Router>
  );
}

export default App;
