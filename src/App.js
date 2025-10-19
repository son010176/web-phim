// src/App.js (Đã cập nhật)

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React, { useState, useEffect, useMemo } from "react";
import { performLiveSearch } from "./utils/search";
import { useMovieFilter } from "./hooks/useMovieFilter";
import {
  getAllMovies,
  getAllActors,
  getMovieCouples,
  getMoviesByStoryline,
} from "./services/api";
import { getCollection } from "./services/api"; // Thêm import
import CollectionPage from "./pages/CollectionPage"

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
import Header from "./components/Header";
import ScrollToTopButton from "./components/ScrollToTopButton"; // THÊM MỚI
import { useActorFilter } from './hooks/useActorFilter';
import useDebounce from "./hooks/useDebounce";
import { useCouplesFilter } from './hooks/useCouplesFilter';
import { useStorylineFilter } from './hooks/useStorylineFilter';
import "./App.css";

function App() {
  const [allMovies, setAllMovies] = useState([]);
  const [allActors, setAllActors] = useState([]);

  const [allCouplesData, setAllCouplesData] = useState([]);
  const [storylineData, setStorylineData] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchScope, setSearchScope] = useState("tenPhim");
  const [liveResults, setLiveResults] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [collection, setCollection] = useState([]);

  const debouncedSearchQuery = useDebounce(searchQuery, 100);

  const {
    displayMovies,
    uniqueGenres,
    selectedGenres,
    handleGenreToggle,
    sortOrder,
    handleSortChange,
  } = useMovieFilter(allMovies);

  const {
    displayActors,
    sortOrder: actorSortOrder,
    handleSortChange: handleActorSortChange,
    selectedGender,
    handleGenderToggle
  } = useActorFilter(allActors);

  const {
    displayCouples,
    sortOrder: coupleSortOrder,
    handleSortChange: handleCoupleSortChange
  } = useCouplesFilter(allCouplesData);

  const {
    displayStorylines,
    sortOrder: storylineSortOrder,
    handleSortChange: handleStorylineSortChange
  } = useStorylineFilter(storylineData);

  useEffect(() => {
    setIsLoading(true); // Bắt đầu tải, bật trạng thái loading

    // Sử dụng Promise.all để tải đồng thời nhiều nguồn dữ liệu, giúp tối ưu thời gian
    Promise.all([
      getAllMovies(),
      getAllActors(),
      getMovieCouples(),
      getMoviesByStoryline(),
      getCollection(),
    ]).then(([movies, actors, couples, storylines, collectionData]) => {
      setAllMovies(movies || []);
      setAllActors(actors || []);
      setAllCouplesData(couples || []);
      setStorylineData(storylines || []);
      setCollection(collectionData || []);
    }).catch(error => {
      console.error("❌ Lỗi nghiêm trọng khi tải dữ liệu ban đầu:", error);
      // Có lỗi vẫn set mảng rỗng để App không bị crash
      setAllMovies([]);
      setAllActors([]);
      setAllCouplesData([]);
      setStorylineData([]);
    }).finally(() => {
      setIsLoading(false); // Tải xong (dù thành công hay thất bại), tắt trạng thái loading
    });
  }, []);

    // useEffect(() => {
  //   getAllMovies().then((data) => {
  //     if (data) setAllMovies(data);
  //   });
  //   getAllActors().then((data) => {
  //     if (data) setAllActors(data);
  //   });
  //   getMovieCouples().then((data) => {
  //     if (data) setAllCouplesData(data);
  //   });
  //   getMoviesByStoryline().then((data) => {
  //     if (data) setStorylineData(data);
  //   });
  // }, []);
  
  useEffect(() => {
    if (searchQuery.length < 2) {
      setLiveResults([]);
      return;
    }
    if (debouncedSearchQuery) {
      const results = performLiveSearch(
        debouncedSearchQuery,
        searchScope,
        allMovies,
        allActors,
        allCouplesData,
        storylineData
      );
      setLiveResults(results.slice(0, 5));
    }
  }, [debouncedSearchQuery, searchScope, allMovies, allActors, allCouplesData, storylineData]);

  const homePageElement = useMemo(() => {
    return (
      <Home
        movies={displayMovies}
        genres={uniqueGenres}
        selectedGenres={selectedGenres}
        onGenreToggle={handleGenreToggle}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
      />
    );
  }, [displayMovies, uniqueGenres, selectedGenres, handleGenreToggle, sortOrder, handleSortChange]);

  return (
    <Router>
      <div className="App">
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchScope={searchScope}
          setSearchScope={setSearchScope}
          liveResults={liveResults}
        />
        <Routes>
          <Route
            path="/"
            element={
              // THAY ĐỔI: Hiển thị thông báo loading hoặc trang Home tùy vào trạng thái
              isLoading 
                ? <div className="loading-message">Đang tải toàn bộ dữ liệu...</div> 
                : homePageElement
            }
          />
          <Route
            path="/phim/:id"
            element={<MovieDetail movies={allMovies} collection={collection} setCollection={setCollection} />}
          />
          <Route
            path="/search"
            element={<SearchResultsPage allMovies={allMovies} />}
          />
          <Route path="/dien-vien/:slug" element={<ActorProfilePage />} />
          <Route path="/admin-sandbox" element={<AdminSandbox />} />
          <Route
            path="/dien-vien-couples/:coupleId"
            element={<CoupleFilmMographyPage allCouples={allCouplesData} />}
          />
          <Route
            path="/dien-vien-couples/all-couples"
            element={
              <AllCouplesPage 
                allCouples={displayCouples}
                sortOrder={coupleSortOrder}
                onSortChange={handleCoupleSortChange}
              />
            }
          />
          <Route
            path="/phim-couples/all-couples"
            element={
              <StorylinePage 
                storylines={displayStorylines}
                sortOrder={storylineSortOrder}
                onSortChange={handleStorylineSortChange}
              />
            }
          />
          <Route
            path="/phim-couples/:storylineId"
            element={
              <StorylineFilmMographyPage allStorylines={storylineData} />
            }
          />
          <Route 
            path="/dien-vien/all-actors" 
            element={
              <AllActorsPage 
                allActors={displayActors} 
                sortOrder={actorSortOrder}
                onSortChange={handleActorSortChange}
                selectedGender={selectedGender}
                onGenderToggle={handleGenderToggle}
              />
            } 
          />
          <Route
            path="/bo-suu-tap"
            element={<CollectionPage collection={collection} setCollection={setCollection} />}
          />
        </Routes>
        <ScrollToTopButton /> {/* THÊM MỚI */}
      </div>
    </Router>
  );
}

export default App;