// src/AdminSandbox.js (phiên bản cuối cùng đã sửa)
import React, { useState, useEffect } from "react";
import "./AdminSandbox.css";

function AdminSandbox() {

  const API_URL = "https://script.google.com/macros/s/AKfycbxQvRm7VwxKcjmciim8mdchDu7X-c4-ZeHpY6mKRPPLLxsPJhCkTgWoBNxPM-Pls7uV/exec";
  const [responseMsg, setResponseMsg] = useState("Chờ yêu cầu...");
  const [isLoading, setIsLoading] = useState(false);
  const [addForm, setAddForm] = useState({ TenViet: "", TenGoc: "", DienVienNam: "", DienVienNu: "" });
  const [updateForm, setUpdateForm] = useState({ ID: "", TenViet: "", TenGoc: "", DienVienNam: "", DienVienNu: "" });
  const [deleteId, setDeleteId] = useState("");
  const [pendingMovies, setPendingMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);

  const fetchPendingMovies = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}?action=getPendingMovies`);
      const result = await response.json();
      if (result.status === "success") {
        setPendingMovies(result.data);
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách phim chờ:", error);
      setResponseMsg("Lỗi: Không thể tải danh sách phim đang chờ.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingMovies();
  }, []);

  const callApi = async (action, payload) => {
    setIsLoading(true);
    setResponseMsg(`Đang gửi yêu cầu "${action}"...`);
    try {
      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
      });
      setResponseMsg( `✅ Đã gửi yêu cầu "${action}" thành công!\n\nPayload:\n${JSON.stringify( payload, null, 2 )}` );
    } catch (error) {
      setResponseMsg(`❌ Lỗi khi gửi yêu cầu: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const payload = { TenViet: addForm.TenViet, TenGoc: addForm.TenGoc, DienVienNam: addForm.DienVienNam, DienVienNu: addForm.DienVienNu, LinkFbPost: "", Tags: "", code: "", luutru: "", TheLoai: "", LinkPoster: "", LinkVideo: "", LinkVideoMultiSub: "", LinkFbVideo: "", MoTa: "" };
    await callApi("addMovie", payload);
  };

//   const handleUpdate = async (e) => {
//     e.preventDefault();
//     await callApi("updateMovie", updateForm);
//     setUpdateForm({ ID: "", TenViet: "", TenGoc: "", DienVienNam: "", DienVienNu: "" });

//     setSelectedMovie(null);
//     fetchPendingMovies();
//   };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    let payload = { ...updateForm };
    
    // Nếu đang sửa một phim được chọn từ danh sách chờ, hãy đính kèm số dòng
    if (selectedMovie) {
      payload.rowNumber = selectedMovie.rowNumber;
    }

    await callApi("updateMovie", payload);
    
    setUpdateForm({ ID: "", TenViet: "", TenGoc: "", DienVienNam: "", DienVienNu: "" });
    setSelectedMovie(null);
    fetchPendingMovies();
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    await callApi("deleteMovie", { ID: deleteId });
    fetchPendingMovies();
  };

  const handleCompleteClick = (movie) => {
    setUpdateForm({
      ID: movie.ID,
      TenViet: movie.TenViet || "",
      TenGoc: movie.TenGoc || "",
      DienVienNam: movie.DienVienNam || "",
      DienVienNu: movie.DienVienNu || "",
    });
    // Lưu lại thông tin phim đang được chọn (bao gồm cả rowNumber)
    setSelectedMovie(movie);
    window.scrollTo({
      top: document.getElementById("update-form").offsetTop,
      behavior: "smooth",
    });
  };

  const handleAddChange = (e) => setAddForm({ ...addForm, [e.target.name]: e.target.value });
  const handleUpdateChange = (e) => setUpdateForm({ ...updateForm, [e.target.name]: e.target.value });

  return (
    <div className="sandbox-container">
      <h1>🛠️ Admin Sandbox - Quản lý Phim</h1>
      
      <fieldset className="pending-section">
        <legend>🎬 Phim Đang Chờ Hoàn Thiện ({pendingMovies.length})</legend>
        <button onClick={fetchPendingMovies} disabled={isLoading}>Tải lại danh sách</button>
        <div className="pending-list">
            {pendingMovies.map((movie) => (
                // [SỬA LẠI] Class 'selected' được gán khi phim được chọn
                <div key={movie.ID || movie.rowNumber} className={`pending-item ${selectedMovie && movie.ID === selectedMovie.ID ? "selected" : ""}`}>
                    <span>Row: <strong>{movie.rowNumber}</strong></span>
                    <span>DV Nam: {movie.DienVienNam}</span>
                    <span>DV Nữ: {movie.DienVienNu}</span>
                    <button onClick={() => handleCompleteClick(movie)}>Hoàn Thiện</button>
                </div>
            ))}
            {pendingMovies.length === 0 && <p>Không có phim nào đang chờ.</p>}
        </div>
      </fieldset>

      <div className="forms-grid">
        <fieldset id="update-form">
          {/* [SỬA LẠI] Tiêu đề form hiển thị ROW của phim được chọn */}
          <legend>
            {selectedMovie ? `📝 Hoàn Thiện Phim (Row: ${selectedMovie.rowNumber})` : "Sửa Phim"}
          </legend>
          <form onSubmit={handleUpdate}>
            {/* [SỬA LẠI] Đổi placeholder và giữ ID ở chế độ chỉ đọc */}
            <input name="ID" value={updateForm.ID} onChange={handleUpdateChange} placeholder="ID sẽ được tự động điền" required readOnly />
            <input name="TenViet" value={updateForm.TenViet} onChange={handleUpdateChange} placeholder="Tên tiếng Việt MỚI" required />
            <input name="TenGoc" value={updateForm.TenGoc} onChange={handleUpdateChange} placeholder="Tên gốc MỚI" />
            <input name="DienVienNam" value={updateForm.DienVienNam} onChange={handleUpdateChange} placeholder="Diễn viên nam" />
            <input name="DienVienNu" value={updateForm.DienVienNu} onChange={handleUpdateChange} placeholder="Diễn viên nữ" />
            <button type="submit" disabled={isLoading}>Cập Nhật Phim</button>
          </form>
        </fieldset>

        {/* Các form còn lại không thay đổi */}
        <fieldset>
          <legend>Thêm Phim Mới Hoàn Chỉnh</legend>
          <form onSubmit={handleAdd}>
            <input name="TenViet" value={addForm.TenViet} onChange={handleAddChange} placeholder="Tên tiếng Việt (bắt buộc)" required />
            <input name="TenGoc" value={addForm.TenGoc} onChange={handleAddChange} placeholder="Tên gốc" />
            <input name="DienVienNam" value={addForm.DienVienNam} onChange={handleAddChange} placeholder="Diễn viên nam" />
            <input name="DienVienNu" value={addForm.DienVienNu} onChange={handleAddChange} placeholder="Diễn viên nữ" />
            <button type="submit" disabled={isLoading}>Thêm Phim</button>
          </form>
        </fieldset>
        <fieldset>
          <legend>Xóa Phim</legend>
          <form onSubmit={handleDelete}>
            <input value={deleteId} onChange={(e) => setDeleteId(e.target.value)} placeholder="ID của phim cần xóa" required />
            <button type="submit" disabled={isLoading}>Xóa Phim</button>
          </form>
        </fieldset>
      </div>

      <div className="response-area">
        <h2>Kết quả từ API</h2>
        <pre>{responseMsg}</pre>
      </div>
    </div>
  );
}
export default AdminSandbox;