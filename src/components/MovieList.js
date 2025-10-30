// src/components/MovieList.js

import React from 'react';
import { Link } from 'react-router-dom';
import ImageWithFallback from './ImageWithFallback';
import './MovieList.css'; // Sẽ tạo ở bước tiếp theo

function MovieList({ movies, onRemoveMovie }) {
  if (!movies || movies.length === 0) {
    return <p className="no-results-message">Không có phim nào để hiển thị.</p>;
  }

  return (
    <div className="movie-list">
      {movies.map((movie) => (
        <Link
          to={`/phim/${movie.id}`}
          key={movie.id}
          className="movie-card-link"
        >
          <div className="movie-card">
            {/* THÊM NÚT XÓA MỚI */}
            {onRemoveMovie && (
              <button
                className="remove-button"
                title="Xóa khỏi bộ sưu tập"
                onClick={(e) => {
                  e.preventDefault(); // Ngăn không cho chuyển trang khi bấm nút X
                  e.stopPropagation();
                  onRemoveMovie(movie.id);
                }}
              >
                &times;
              </button>
            )}
            
            <ImageWithFallback
              src={movie.linkPoster}
              alt={`Poster phim ${movie.tenViet}`}
              type="movie"
            />
            <div className="movie-info">
              <h3 className="movie-title" title={movie.tenViet}>
                {movie.tenViet}
              </h3>
              <p className="movie-original-title" title={movie.tenGoc}>
                {movie.tenGoc}
              </p>
              <div className="movie-actors">
                <div className="actors-list">
                  {movie.dienVienNam && movie.dienVienNam.split('&').map((name, index) => (
                    <div className="actor-item" key={`nam-${index}`}>
                      <span className="actor-name">
                        {name.trim().split('(')[0].trim()}
                      </span>
                    </div>
                  ))}
                  {movie.dienVienNu && movie.dienVienNu.split('&').map((name, index) => (
                    <div className="actor-item" key={`nu-${index}`}>
                      <span className="actor-name">
                        {name.trim().split('(')[0].trim()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Chỉ hiển thị thể loại nếu có */}
              {/* {movie.theLoai && (
                <span className="movie-genre" title={movie.theLoai}>
                  {movie.theLoai.split(/[.,]/)[0].trim()}
                </span>
              )} */}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default MovieList;