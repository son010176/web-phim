// src/components/ScrollToTopButton.js

import React, { useState, useEffect } from 'react';
import './ScrollToTopButton.css';
import { ReactComponent as ArrowUpIcon } from '../assets/icons/chevron-up-solid-full.svg';

function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  // Hiển thị nút khi người dùng cuộn xuống 300px
  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Cuộn lên đầu trang một cách mượt mà
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <div className="scroll-to-top">
      {isVisible && 
        <button onClick={scrollToTop} className="scroll-button">
          <ArrowUpIcon />
        </button>
      }
    </div>
  );
}

export default ScrollToTopButton;