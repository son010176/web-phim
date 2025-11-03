// src/pages/SummarizerPage.js

import React, { useState, useEffect } from "react"; // <-- THÊM 'useEffect'
import { getYouTubeSummary } from "../services/api";
// === THÊM MỚI: IMPORT TỪ API_CLIENT ĐỂ DÙNG INDEXEDDB ===
import {
  loadCacheFromDB,
  saveCacheToDB,
} from "../services/api_client"; 
// --------------------------------------------------------
import { useNotification } from "../context/NotificationContext";
import "./SummarizerPage.css"; 

// === THÊM MỚI: KEY CHO INDEXEDDB ===
const SUMMARY_HISTORY_KEY = "summary-history-v1";
const MAX_HISTORY_ITEMS = 50; // Giới hạn 50 video
// -----------------------------------

// ... (Hàm extractVideoId giữ nguyên)
function extractVideoId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return match[2];
  } else {
    return null;
  }
}

// ... (Hàm renderSummary giữ nguyên)
const renderSummary = (summaryText) => {
  if (!summaryText) return null;
  const lines = summaryText.split('\n').filter(line => line.trim() !== '');
  return lines.map((line, index) => {
    let processedLine = line.trim().replace(/^\*\s*/, '');
    processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return (
      <p 
        key={index}
        dangerouslySetInnerHTML={{ __html: processedLine }}
      />
    );
  });
};


function SummarizerPage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null); 
  const { addNotification } = useNotification();
  
  // === THÊM MỚI: STATE CHO LỊCH SỬ ===
  const [history, setHistory] = useState([]);
  // -----------------------------------

  // === THÊM MỚI: LOAD LỊCH SỬ TỪ INDEXEDDB KHI MỞ TRANG ===
  useEffect(() => {
    async function loadHistory() {
      try {
        const loaded = await loadCacheFromDB(SUMMARY_HISTORY_KEY);
        if (loaded && Array.isArray(loaded)) {
          setHistory(loaded);
        }
      } catch (err) {
        console.error("Lỗi khi tải lịch sử tóm tắt:", err);
      }
    }
    loadHistory();
  }, []); // [] = Chạy 1 lần duy nhất khi trang mở
  // ----------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      addNotification("Link YouTube không hợp lệ.", "error");
      return;
    }
    setIsLoading(true);
    setResult(null); 
    
    try {
      // 1. getYouTubeSummary TRẢ VỀ DATA SẠCH (hoặc ném lỗi)
      const apiResultData = await getYouTubeSummary(videoId); 

      // 2. TẠO OBJECT KẾT QUẢ ĐẦY ĐỦ (VÌ ĐÃ THÀNH CÔNG)
      const newResultData = { 
          ...apiResultData, 
          videoId: videoId,       // Thêm videoId
          videoUrl: videoUrl,     // Thêm link
          timestamp: new Date().toISOString() // Thêm mốc thời gian
      };
      
      // 3. CẬP NHẬT STATE (CHO CARD CHÍNH)
      setResult(newResultData);

      // 4. CẬP NHẬT STATE LỊCH SỬ VÀ LƯU VÀO DB
      setHistory(prevHistory => {
          // Lọc bỏ item cũ (nếu tóm tắt lại)
          const filtered = prevHistory.filter(item => item.videoId !== videoId);
          // Thêm item mới lên đầu, và giới hạn số lượng
          const updatedHistory = [newResultData, ...filtered].slice(0, MAX_HISTORY_ITEMS);
          
          // "Fire-and-forget" - Lưu vào DB, không cần await
          saveCacheToDB(SUMMARY_HISTORY_KEY, updatedHistory)
            .catch(err => console.error("Lỗi lưu lịch sử vào DB:", err));
            
          return updatedHistory;
      });

    } catch (error) { 
      // 5. BẮT LỖI TỪ getYouTubeSummary
      
      // getYouTubeSummary (api.js) sẽ ném lỗi có 'message'
      addNotification(`Lỗi khi tóm tắt: ${error.message}`, "error");
      
      // LƯU Ý: File api.js của bạn hiện tại không trả về 'data' khi lỗi,
      // nên chúng ta chỉ có thể set kết quả về null.
      setResult(null); 

      // (Nếu bạn muốn hiển thị thumbnail/title ngay cả khi lỗi,
      // bạn cần sửa cả file api.js để nó trả về 'data' trong lỗi)
      
    } finally {
      setIsLoading(false);
    }
  };

  // === THÊM MỚI: HÀM XÓA LỊCH SỬ ===
  const handleClearHistory = async () => {
    if (window.confirm("Bạn có chắc muốn xóa toàn bộ lịch sử tóm tắt?")) {
      try {
        await saveCacheToDB(SUMMARY_HISTORY_KEY, []); // Lưu mảng rỗng
        setHistory([]); // Xóa state
        addNotification("Đã xóa lịch sử tóm tắt.");
      } catch (err) {
        addNotification("Lỗi khi xóa lịch sử.", "error");
      }
    }
  };
  // ---------------------------------
  
  // === THÊM MỚI: HÀM XÓA 1 MỤC TRONG LỊCH SỬ ===
  const handleRemoveHistoryItem = async (e, videoIdToRemove) => {
    e.stopPropagation(); // Ngăn không cho sự kiện click vào card chạy
    
    setHistory(prevHistory => {
      const updatedHistory = prevHistory.filter(item => item.videoId !== videoIdToRemove);
      
      // Lưu lại vào DB
      saveCacheToDB(SUMMARY_HISTORY_KEY, updatedHistory)
        .catch(err => console.error("Lỗi lưu lịch sử (xóa item) vào DB:", err));
        
      return updatedHistory;
    });
  };
  // ---------------------------------------

  return (
    <div className="main-content-section">
      <h1 className="section-title">Công Cụ Tóm Tắt Video</h1>
      
      <div className="summarizer-container">
        {/* ... (Form) ... */}
        <form className="summarizer-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Dán link video YouTube vào đây..."
            className="summarizer-input"
            disabled={isLoading}
          />
          <button type="submit" className="summarizer-button" disabled={isLoading}>
            {isLoading ? "Đang xử lý..." : "Tóm tắt"}
          </button>
        </form>

        <div className="summary-results-container">
          {isLoading && (
            <div className="summary-status-message">Đang lấy phụ đề và tóm tắt...</div>
          )}

          {!isLoading && !result && (
             <p className="summary-status-message">Nhập link video và nhấn "Tóm tắt" để bắt đầu.</p>
          )}

          {/* Card kết quả (card chính) */}
          {result && (
            <div className="summary-results-list">
              <div className="summary-item-card">
                {result.thumbnail && (
                  <img 
                    src={result.thumbnail} 
                    alt={result.title || "Video thumbnail"} 
                    className="summary-item-thumbnail" 
                  />
                )}
                <div className="summary-item-content">
                  <h3 className="summary-item-title">
                    {/* THAY ĐỔI: Dùng result.videoUrl nếu có, fallback về videoUrl state */}
                    <a href={result.videoUrl || videoUrl} target="_blank" rel="noopener noreferrer">
                      {result.title || (result.videoUrl || videoUrl)}
                    </a>
                  </h3>
                  <div className="summary-item-text">
                    {/* Hiển thị lỗi nếu có, ngược lại render tóm tắt */}
                    {result.summary ? renderSummary(result.summary) : (
                      <p><i>{result.message || "Không có nội dung tóm tắt."}</i></p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* === THÊM MỚI: KHUNG LỊCH SỬ === */}
      <div className="history-container">
        <div className="history-header">
          <h2 className="section-title-small">Lịch sử đã tóm tắt</h2>
          {history.length > 0 && (
            <button 
              onClick={handleClearHistory} 
              className="history-clear-button"
            >
              Xóa tất cả
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <p className="history-empty-message">Chưa có video nào trong lịch sử.</p>
        ) : (
          <div className="history-list">
            {history.map(item => (
              <div 
                key={item.videoId} 
                className="history-item-card"
                // Khi click, set 'result' bằng item này
                onClick={() => setResult(item)}
                title={`Xem lại tóm tắt cho "${item.title}"`}
              >
                <img 
                  src={item.thumbnail} 
                  alt={item.title} 
                  className="history-item-thumbnail" 
                />
                <div className="history-item-content">
                  <h4 className="history-item-title">{item.title}</h4>
                  <p className="history-item-date">
                    {new Date(item.timestamp).toLocaleString('vi-VN')}
                  </p>
                </div>
                {/* Nút Xóa 1 item */}
                <button 
                  className="history-item-delete"
                  title="Xóa khỏi lịch sử"
                  onClick={(e) => handleRemoveHistoryItem(e, item.videoId)}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* === KẾT THÚC THÊM MỚI === */}

    </div>
  );
}

export default SummarizerPage;