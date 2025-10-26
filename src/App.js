// src/App.js (Đã refactor - Tách API và dùng Context)

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { performLiveSearch } from "./utils/search";

// // --- IMPORT API ---
// import { 
//   fetchAllDataForSearchCache, loadCacheFromStorage, saveCacheToStorage
// } from "./services/api_client"; // <-- api_client.js (App Script)

// --- IMPORT API ---
import {
  getDataFull,
  // getDataSearch,
  loadCacheFromDB,
  saveCacheToDB,
  CACHE_KEY_FULL, // Lấy key từ api_client
  CACHE_KEY_SEARCH // Lấy key từ api_client
} from "./services/api_client";

// --- THÊM IMPORT MỚI TỪ api.js ---
import { getSearchData_CF } from "./services/api";

// --- IMPORT CÁC TRANG ---
import LoginPage from './pages/LoginPage';
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
import useDebounce from "./hooks/useDebounce";
import "./App.css";

// --- IMPORT CÁC HOOK LỌC/SẮP XẾP ---
import { useMovieFilter } from './hooks/useMovieFilter';
import { useActorFilter } from './hooks/useActorFilter';
import { useCouplesFilter } from './hooks/useCouplesFilter';
import { useStorylineFilter } from './hooks/useStorylineFilter';

// LƯU Ý: App KHÔNG cần import useAuth hay getCollection nữa
// Vì CollectionContext sẽ tự quản lý

function App() {
  // State loading ban đầu (chỉ để kiểm tra IndexedDB)
  const [isLoading, setIsLoading] = useState(true);

  // const [searchCache, setSearchCache] = useState({ movies: [], actors: [], couples: [], storylines: [] });
  // const [isCacheReady, setIsCacheReady] = useState(false); // "Công tắc"
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

  // (Các state cho filter/search giữ nguyên)
  // const { displayMovies, ...movieControls } = useMovieFilter(searchCache.movies);
  // const { displayActors, ...actorControls } = useActorFilter(searchCache.actors);
  // const { displayCouples, ...coupleControls } = useCouplesFilter(searchCache.couples);
  // const { displayStorylines, ...storylineControls } = useStorylineFilter(searchCache.storylines);
  // Các hook này giờ sẽ nhận mảng rỗng lúc đầu,
  // và tự cập nhật khi effectiveCache thay đổi
  const { displayMovies, ...movieControls } = useMovieFilter(moviesForFilter);
  const { displayActors, ...actorControls } = useActorFilter(actorsForFilter);
  const { displayCouples, ...coupleControls } = useCouplesFilter(couplesForFilter);
  const { displayStorylines, ...storylineControls } = useStorylineFilter(storylinesForFilter);

  // --- STATE CHO SEARCH BAR (Giữ nguyên) ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchScope, setSearchScope] = useState("tenPhim");
  const [liveResults, setLiveResults] = useState([]);
  const debouncedSearchQuery = useDebounce(searchQuery, 100);

  // --- useEffect TẢI DỮ LIỆU (LOGIC MỚI - Giữ nguyên) ---
  // useEffect(() => {
  //   setIsLoading(true);
    
  //   // 1. Import thêm saveCacheToStorage
  //   // (Hãy đảm bảo bạn đã import { loadCacheFromStorage, fetchAllDataForSearchCache, saveCacheToStorage } ở đầu file App.js)
    
  //   // 2. Thử tải từ cache trước
  //   const cachedData = loadCacheFromStorage(6); // Cache 1 giờ

  //   if (cachedData) {
  //     // --- CHẾ ĐỘ 1: CLIENT (CÓ CACHE) ---
  //     console.log("🚀 Sử dụng cache từ localStorage. Kích hoạt Chế độ Client.");
  //     setSearchCache(cachedData);
  //     setIsCacheReady(true);
  //     setIsLoading(false);
  //     return; // Dừng lại, không làm gì nữa
  //   }

  //   // --- CHẾ ĐỘ 2: SERVER (KHÔNG CÓ CACHE) ---
  //   // (Logic này của bạn là đúng để API Cloudflare chạy được)
  //   console.log("🌐 Không có cache localStorage, hiển thị trang ở Chế độ Server.");
  //   setIsLoading(false); // Cho phép các trang con render và gọi API server (Cloudflare)
    
  //   // 3. Chạy ngầm để TẢI VÀ KÍCH HOẠT cache (từ Apps Script)
  //   fetchAllDataForSearchCache().then(cacheData => {
  //     console.log("✅ Cache (Apps Script) đã tải xong. BẬT CÔNG TẮC.");
  //     setSearchCache(cacheData); 

  //     // saveCacheToStorage(cacheData); //NƠI KÍCH HOẠT LƯU VÀO LOCALSTORAGE
      
  //     setIsCacheReady(true); // <-- KÍCH HOẠT CÔNG TẮC
      
  //   }).catch(error => {
  //     console.error("❌ Lỗi khi tải cache nền:", error);
  //     // Nếu tải cache lỗi, vẫn bật công tắc để app chạy ở chế độ server
  //     setIsCacheReady(true); 
  //   });
    
  // }, []); // Chỉ chạy 1 lần
  // --- useEffect TẢI DỮ LIỆU (LOGIC 3 API MỚI) ---
  useEffect(() => {
    async function loadApplicationData() {
      console.log("🚀 Bắt đầu quá trình tải dữ liệu ứng dụng...");
      
      // --- BƯỚC 1: KIỂM TRA CACHE INDEXEDDB ---
      let loadedFromFullCache = false;
      let loadedFromSearchCache = false;

      // Ưu tiên 1: Có cache đầy đủ
      const dbFull = await loadCacheFromDB(CACHE_KEY_FULL, 6); // Cache 6 giờ
      if (dbFull) {
        console.log("✅ Chế độ CLIENT (Full): Tải từ IndexedDB (Full).");
        setFullCache(dbFull);
        setSearchCache(dbFull); // Dùng data full cho search luôn
        setIsSearchReady(true);
        setIsFullDataReady(true); // <-- BẬT CỜ FULL
        loadedFromFullCache = true;
      } else {
        // Ưu tiên 2: Chỉ có cache search
        const dbSearch = await loadCacheFromDB(CACHE_KEY_SEARCH, 6);
        if (dbSearch) {
          console.log("✅ Chế độ CLIENT (Search): Tải từ IndexedDB (Search).");
          setSearchCache(dbSearch);
          setIsSearchReady(true); // <-- BẬT CỜ SEARCH
          loadedFromSearchCache = true;
        }
      }

      // TẮT LOADING BAN ĐẦU
      // App sẽ render. Các trang con (Home) sẽ tự quyết định
      // gọi Cloudflare (server mode) hay không dựa vào cờ isFullDataReady
      setIsLoading(false); 
      console.log(`ℹ️ Tắt Loading ban đầu. (isFullDataReady: ${loadedFromFullCache})`);


      // --- BƯỚC 2: TẢI NGẦM CÁC API CÒN THIẾU ---

      // Chỉ gọi API Search nếu chưa có cache Search (và cũng chưa có cache Full)
      if (!loadedFromSearchCache && !loadedFromFullCache) {
        // console.log("🔄 Gọi API getDataSearch (ngầm)...");

        console.log("🔄 Gọi API getSearchData_CF (Cloudflare R2)...");

        // THAY THẾ getDataSearch() BẰNG getSearchData_CF()
        getSearchData_CF().then(data => {
          console.log("🔍 API getSearchData_CF hoàn tất.");
          setSearchCache(data);
            if (data) { // // <-- BẬT CỜ SEARCH. Chỉ bật cờ và lưu nếu data hợp lệ
			        setIsSearchReady(true); // <-- BẬT CỜ SEARCH
			        saveCacheToDB(CACHE_KEY_SEARCH, data);
		        }

          // setIsSearchReady(true); 
          // saveCacheToDB(CACHE_KEY_SEARCH, data);
        }).catch(err => {
          console.error("❌ Lỗi API getSearchData_CF:", err);
          // Có thể set 1 cờ lỗi
        });
      }

      // Chỉ gọi API Full nếu chưa có cache Full
      if (!loadedFromFullCache) {
        console.log("🔄 Gọi API getDataFull (ngầm)...");
        getDataFull().then(data => {
          console.log("💾 API getDataFull hoàn tất.");
          if (data && data.movies && data.movies.length > 0) {
            setFullCache(data);
            setSearchCache(data); // Nâng cấp search cache lên bản full
            setIsFullDataReady(true); // <-- BẬT CỜ FULL
            setIsSearchReady(true); // Đảm bảo cờ search cũng bật
            saveCacheToDB(CACHE_KEY_FULL, data);
            console.log("🚀 Đã nâng cấp ứng dụng lên dữ liệu đầy đủ.");
          } else {
            console.warn("⚠️ API getDataFull trả về rỗng, không nâng cấp.");
          }
        }).catch(err => {
          console.error("❌ Lỗi API getDataFull:", err);
        });
      }
    }

    loadApplicationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy 1 lần khi mount

  // --- useEffect CHO LIVE SEARCH (giữ nguyên) ---
  // useEffect(() => {
  //   if (searchQuery.length < 2 || !isCacheReady) {
  //     setLiveResults([]);
  //     return;
  //   }
  //   if (debouncedSearchQuery) {
  //     const results = performLiveSearch(
  //       debouncedSearchQuery, searchScope,
  //       searchCache.movies, searchCache.actors, searchCache.couples, searchCache.storylines
  //     );
  //     setLiveResults(results.slice(0, 5));
  //   }
  // }, [debouncedSearchQuery, searchScope, searchCache, isCacheReady]);
  // --- useEffect CHO LIVE SEARCH (CẬP NHẬT) ---
  useEffect(() => {
    // Chỉ chạy search khi isSearchReady và có cache
    if (!isSearchReady || !searchCache || searchQuery.length < 2) {
      setLiveResults([]);
      return;
    }
    if (debouncedSearchQuery) {
      const results = performLiveSearch(
        debouncedSearchQuery, searchScope,
        searchCache.movies, searchCache.actors, searchCache.couples, searchCache.storylines
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
            element={<MovieDetail 
              fullCache={fullCache} 
              isFullDataReady={isFullDataReady} 
            />}
          />
          <Route
            path="/search"
            element={<SearchResultsPage 
              allMovies={searchCache?.movies || []} // Dùng search cache
            />}
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