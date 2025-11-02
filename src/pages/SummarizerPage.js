import React, { useState } from "react";
import { getYouTubeSummary } from "../services/api";
import { useNotification } from "../context/NotificationContext";
import "./SummarizerPage.css"; 

// ... (Hàm extractVideoId của bạn giữ nguyên, không đổi)
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

// === THÊM MỚI: HÀM HELPER ĐỂ PARSE SUMMARY ===
/**
 * Chuyển đổi chuỗi summary (có Markdown nhẹ) sang mảng các thẻ <p>
 */
const renderSummary = (summaryText) => {
  if (!summaryText) return null;

  // 1. Tách chuỗi ra thành từng dòng, lọc bỏ các dòng rỗng
  const lines = summaryText.split('\n').filter(line => line.trim() !== '');

  return lines.map((line, index) => {
    // 2. Xóa dấu * và khoảng trắng ở đầu dòng
    let processedLine = line.trim().replace(/^\*\s*/, '');
    
    // 3. Chuyển Markdown **bold** thành thẻ <strong>
    processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 4. Trả về một thẻ <p>
    // Dùng dangerouslySetInnerHTML vì chúng ta tin tưởng chuỗi (từ Gemini)
    // và muốn render thẻ <strong>
    return (
      <p 
        key={index}
        dangerouslySetInnerHTML={{ __html: processedLine }}
      />
    );
  });
};
// === KẾT THÚC THÊM MỚI ===


function SummarizerPage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null); 
  const { addNotification } = useNotification();

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
      // 2. Gọi API
      // Bây giờ, apiResult có thể chứa { status, message, data }
      const apiResponse = await getYouTubeSummary(videoId);

      // --- THAY ĐỔI: Xử lý response mới ---
      // Giả định API của bạn (getYouTubeSummary) đã được cập nhật
      // để trả về { status: 'success', data: { ... } } khi thành công
      // và ném lỗi (catch) hoặc trả về { status: 'error', message: '...', data: { ... } } khi lỗi
      
      if (apiResponse.status === 'error') {
         // Hiển thị lỗi nhưng vẫn set result để hiển thị thumbnail (nếu có)
         addNotification(apiResponse.message, "error");
         setResult(apiResponse.data || null); // apiResponse.data có thể chứa { title, thumbnail }
      } else if (apiResponse.status === 'success') {
         // Thành công, apiResponse.data chứa { summary, title, thumbnail }
         setResult(apiResponse.data);
      } else {
         // Fallback cho cấu trúc cũ (nếu có)
         setResult(apiResponse); 
      }
      // --- KẾT THÚC THAY ĐỔI ---

    } catch (error) {
      // Lỗi mạng hoặc lỗi API nghiêm trọng
      setResult(null); 
      addNotification(`Lỗi khi tóm tắt: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="main-content-section">
      <h1 className="section-title">Công Cụ Tóm Tắt Video</h1>
      
      <div className="summarizer-container">
        {/* ... (Form giữ nguyên) ... */}
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

          {result && (
            <div className="summary-results-list">
              <div className="summary-item-card">
                
                {result.thumbnail && (
                  <img 
                    src={result.thumbnail} 
                    alt="Video thumbnail" 
                    className="summary-item-thumbnail" 
                  />
                )}

                <div className="summary-item-content">
                  <h3 className="summary-item-title">
                    <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                      {result.title || videoUrl}
                    </a>
                  </h3>
                  
                  {/* === THAY ĐỔI LỚN Ở ĐÂY === */}
                  {/* Thay thế <pre> bằng <div> và gọi hàm renderSummary */}
                  <div className="summary-item-text">
                    {renderSummary(result.summary)}
                  </div>
                  {/* === KẾT THÚC THAY ĐỔI LỚN === */}

                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SummarizerPage;