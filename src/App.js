// src/App.js (Đã refactor - Tách API và dùng Context)

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { performLiveSearch } from "./utils/search";

// --- IMPORT API ---
import { 
  fetchAllDataForSearchCache, loadCacheFromStorage, saveCacheToStorage
} from "./services/api_client"; // <-- api_client.js (App Script)

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
  const [isLoading, setIsLoading] = useState(true); 

  const [searchCache, setSearchCache] = useState({ movies: [], actors: [], couples: [], storylines: [] });
  const [isCacheReady, setIsCacheReady] = useState(false); // "Công tắc"

  // (Các state cho filter/search giữ nguyên)
  const { displayMovies, ...movieControls } = useMovieFilter(searchCache.movies);
  const { displayActors, ...actorControls } = useActorFilter(searchCache.actors);
  const { displayCouples, ...coupleControls } = useCouplesFilter(searchCache.couples);
  const { displayStorylines, ...storylineControls } = useStorylineFilter(searchCache.storylines);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchScope, setSearchScope] = useState("tenPhim");
  const [liveResults, setLiveResults] = useState([]);
  const debouncedSearchQuery = useDebounce(searchQuery, 100);

  // --- useEffect TẢI DỮ LIỆU (LOGIC MỚI - Giữ nguyên) ---
  useEffect(() => {
    setIsLoading(true);
    
    // 1. Import thêm saveCacheToStorage
    // (Hãy đảm bảo bạn đã import { loadCacheFromStorage, fetchAllDataForSearchCache, saveCacheToStorage } ở đầu file App.js)
    
    // 2. Thử tải từ cache trước
    const cachedData = loadCacheFromStorage(6); // Cache 1 giờ

    if (cachedData) {
      // --- CHẾ ĐỘ 1: CLIENT (CÓ CACHE) ---
      console.log("🚀 Sử dụng cache từ localStorage. Kích hoạt Chế độ Client.");
      setSearchCache(cachedData);
      setIsCacheReady(true);
      setIsLoading(false);
      return; // Dừng lại, không làm gì nữa
    }

    // --- CHẾ ĐỘ 2: SERVER (KHÔNG CÓ CACHE) ---
    // (Logic này của bạn là đúng để API Cloudflare chạy được)
    console.log("🌐 Không có cache localStorage, hiển thị trang ở Chế độ Server.");
    setIsLoading(false); // Cho phép các trang con render và gọi API server (Cloudflare)
    
    // 3. Chạy ngầm để TẢI VÀ KÍCH HOẠT cache (từ Apps Script)
    fetchAllDataForSearchCache().then(cacheData => {
      console.log("✅ Cache (Apps Script) đã tải xong. BẬT CÔNG TẮC.");
      setSearchCache(cacheData); 

      // saveCacheToStorage(cacheData); //NƠI KÍCH HOẠT LƯU VÀO LOCALSTORAGE
      
      setIsCacheReady(true); // <-- KÍCH HOẠT CÔNG TẮC
      
    }).catch(error => {
      console.error("❌ Lỗi khi tải cache nền:", error);
      // Nếu tải cache lỗi, vẫn bật công tắc để app chạy ở chế độ server
      setIsCacheReady(true); 
    });
    
  }, []); // Chỉ chạy 1 lần

  // --- useEffect CHO LIVE SEARCH (giữ nguyên) ---
  useEffect(() => {
    if (searchQuery.length < 2 || !isCacheReady) {
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
  }, [debouncedSearchQuery, searchScope, searchCache, isCacheReady]);

  if (isLoading) {
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
          isSearchReady={isCacheReady}
        />
        <Routes>
          <Route
            path="/"
            element={
              <Home
                clientMovies={displayMovies} 
                {...movieControls}
                isCacheReady={isCacheReady} // Pass "công tắc"
              />
            }
          />
          <Route 
            path="/dien-vien/all-actors" 
            element={
              <AllActorsPage 
                clientActors={displayActors} 
                {...actorControls}
                isCacheReady={isCacheReady} 
              />
            } 
          />
          <Route
            path="/dien-vien-couples/all-couples"
            element={
              <AllCouplesPage 
                clientCouples={displayCouples}
                {...coupleControls}
                isCacheReady={isCacheReady}
              />
            }
          />
          <Route
            path="/phim-couples/all-couples"
            element={
              <StorylinePage
                clientStorylines={displayStorylines}
                {...storylineControls}
                isCacheReady={isCacheReady}
              />
            }
          />
          {/* --- CÁC ROUTE CHI TIẾT --- */}
          <Route
            path="/phim/:id"
            // SỬA: Xóa props collection và setCollection
            element={<MovieDetail movies={searchCache.movies} isCacheReady={isCacheReady} />}
          />
          <Route
            path="/search"
            element={<SearchResultsPage allMovies={searchCache.movies} />}
          />
          <Route 
            path="/dien-vien/:slug" 
            element={
              <ActorProfilePage 
                actors={searchCache.actors} // Luôn truyền full cache
                isCacheReady={isCacheReady} 
              />
            } 
          />
          <Route path="/admin-sandbox" element={<AdminSandbox />} />
          <Route
            path="/dien-vien-couples/:coupleId"
            element={
              <CoupleFilmMographyPage 
                allCouples={searchCache.couples} // Luôn truyền full cache
                isCacheReady={isCacheReady} 
              />
            }
          />
          <Route
            path="/phim-couples/:storylineId"
            element={
              <StorylineFilmMographyPage 
                allStorylines={searchCache.storylines} // Luôn truyền full cache
                isCacheReady={isCacheReady} 
              />
            }
          />
          <Route path="/login" element={<LoginPage />} />
          
          {/* --- ROUTE MỚI CHO BỘ SƯU TẬP --- */}
          <Route 
            path="/bo-suu-tap" 
            // SỬA: Không cần truyền props
            element={<CollectionPage />} 
          />

        </Routes>
        <ScrollToTopButton />
      </div>
    </Router>
  );
}

export default App;