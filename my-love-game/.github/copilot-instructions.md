# Project Rules: Love Quest Game

## 1. Code Consistency (Đồng nhất Code)
- **Frameworks:** Chỉ sử dụng Three.js cho đồ họa 3D và GSAP cho diễn hoạt. Tránh dùng thư viện ngoài nếu không cần thiết.
- **Naming Convention:** - Biến và hàm dùng `camelCase`. 
    - Các đối tượng Three.js (mesh, scene, camera) phải có tiền tố rõ ràng (ví dụ: `mainScene`, `heartMesh`).
- **Style:** Ưu tiên viết code theo dạng Module. Tách biệt logic game (va chạm, tính điểm) khỏi logic hiển thị (render, hiệu ứng).
- **Comments:** Luôn giải thích ý nghĩa của các hằng số vật lý (tốc độ xoay, lực đẩy) để dễ tinh chỉnh cảm giác của game.

## 2. README Context Synchronization (Tự cập nhật ngữ cảnh)
- Sau mỗi thay đổi quan trọng về tính năng hoặc cấu trúc (ví dụ: thêm màn chơi mới, đổi shader), hãy nhắc người dùng cập nhật file `README.md`.
- File `README.md` cần lưu trữ:
    - Trạng thái hiện tại của game (đang ở màn nào, tính năng nào đã hoàn thiện).
    - Các ý tưởng đồ họa đang dang dở để không bị mất context sau khi tắt máy.
    - Cấu trúc các file assets (ảnh kỷ niệm, nhạc) để Copilot truy cập nhanh.

## 3. Project folder structure
  - /assets: Chứa ảnh kỷ niệm và nhạc nền.
  - /src/core: Chứa khởi tạo Three.js (Scene, Camera, Renderer).
  - /src/entities: Chứa các vật thể trong game
  - /src/utils: Chứa các hàm hỗ trợ (Tính toán va chạm, random tọa độ).

## 4. Sau mỗi lần update code hãy thêm tóm tắt note feature và file readme.md
  - Chức năng của mỗi file/module/function
  - Đã xong những feature nào
  - Cần làm tiếp những gì