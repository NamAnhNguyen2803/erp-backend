# Hệ thống ERP Backend (Sản xuất & Kho)

Đây là phần backend cho một hệ thống Hoạch định nguồn lực doanh nghiệp (ERP) được xây dựng bằng Node.js và Express.js. Hệ thống tập trung vào các nghiệp vụ quản lý sản xuất, quản lý kho, và các dữ liệu chủ liên quan.

## Công nghệ sử dụng

*   **Nền tảng:** Node.js
*   **Framework:** Express.js
*   **ORM:** Sequelize
*   **Cơ sở dữ liệu:** Tương thích với các hệ quản trị CSDL SQL (ví dụ: PostgreSQL, MySQL, MariaDB, MSSQL)
*   **Xác thực:** JWT (JSON Web Tokens)

---

## Hướng dẫn cho Lập trình viên Frontend

Phần này cung cấp các thông tin cần thiết để bạn có thể chạy backend ở môi trường local và tích hợp với các API.

### 1. Cài đặt và Chạy dự án

**Yêu cầu:**
*   Node.js (phiên bản 16.x trở lên)
*   Một hệ quản trị CSDL SQL (ví dụ: PostgreSQL)
*   Git

**Các bước cài đặt:**

1.  **Clone repository:**
    ```bash
    git clone <your-repository-url>
    cd erp-backend
    ```

2.  **Cài đặt các gói phụ thuộc:**
    ```bash
    npm install
    ```

3.  **Cấu hình môi trường:**
    *   Tạo một file `.env` ở thư mục gốc của dự án bằng cách sao chép từ file `.env.example` (nếu có) hoặc tạo mới.
    *   Điền các thông tin cần thiết, đặc biệt là cấu hình kết nối CSDL và mã bí mật cho JWT:
    ```env
    # Cấu hình Port
    PORT=3000

    # Cấu hình Database
    DB_HOST=localhost
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_NAME=your_erp_db
    DB_DIALECT=postgres # (hoặc mysql, mariadb, mssql)

    # Cấu hình JWT
    JWT_SECRET=your_super_secret_key
    JWT_EXPIRES_IN=1d
    ```

4.  **Chạy Database Migrations:**
    Lệnh này sẽ tạo các bảng cần thiết trong CSDL của bạn dựa trên cấu hình trong thư mục `migrations`.
    ```bash
    npx sequelize-cli db:migrate
    ```

5.  **Khởi động server:**
    *   Để chạy ở chế độ production:
        ```bash
        npm start
        ```
    *   Để chạy ở chế độ development (với hot-reload):
        ```bash
        npm run dev
        ```
    Server sẽ chạy tại địa chỉ `http://localhost:3000` (hoặc port bạn đã cấu hình).

### 2. Cấu trúc API

Tất cả các API đều có tiền tố là `/api`. Cấu trúc các routes được định nghĩa trong thư mục `src/routes`.

**Ví dụ về các nhóm API chính:**

*   `/api/auth`: Xác thực người dùng (login, register).
*   `/api/products`: Quản lý sản phẩm.
*   `/api/materials`: Quản lý nguyên vật liệu.
*   `/api/boms`: Quản lý định mức nguyên vật liệu (BOM).
*   `/api/warehouses`: Quản lý kho.
*   `/api/inventory`: Các API liên quan đến tồn kho.
*   `/api/manufacturing-plans`: Quản lý kế hoạch sản xuất.
*   `/api/work-orders`: Quản lý lệnh sản xuất.

Để xem chi tiết tất cả các route, bạn có thể tham khảo các file trong `src/routes/`.

### 3. Xác thực (Authentication)

Hệ thống sử dụng JWT để bảo vệ các API.

**Luồng làm việc:**

1.  Frontend gửi yêu cầu `POST /api/auth/login` với `username` và `password`.
2.  Nếu thông tin hợp lệ, backend sẽ trả về một `accessToken`.
3.  Frontend lưu lại `accessToken` này (ví dụ: trong Local Storage hoặc Cookies).
4.  Với mỗi yêu cầu cần xác thực sau đó, frontend cần gửi `accessToken` trong header `Authorization`.
    ```
    Authorization: Bearer <your_access_token>
    ```

### 4. Các Model Dữ liệu chính

Để hiểu rõ cấu trúc dữ liệu trả về từ API, bạn nên tham khảo các model được định nghĩa trong thư mục `src/models`. Dưới đây là một vài ví dụ:

*   **Product (`Product.js`):**
    *   `id`: ID (UUID)
    *   `code`: Mã sản phẩm (string)
    *   `name`: Tên sản phẩm (string)
    *   `description`: Mô tả (text)
    *   `price`: Giá (decimal)
    *   ... và các trường khác.

*   **Material (`Material.js`):**
    *   `id`: ID (UUID)
    *   `code`: Mã nguyên vật liệu (string)
    *   `name`: Tên nguyên vật liệu (string)
    *   `unit`: Đơn vị tính (string)
    *   ... và các trường khác.

*   **ManufacturingOrder (`ManufacturingOrder.js`):**
    *   `id`: ID (UUID)
    *   `orderCode`: Mã lệnh sản xuất (string)
    *   `productId`: ID của sản phẩm cần sản xuất
    *   `quantity`: Số lượng
    *   `startDate`: Ngày bắt đầu
    *   `endDate`: Ngày kết thúc
    *   `status`: Trạng thái (e.g., 'Pending', 'In Progress', 'Completed')
    *   ... và các trường khác.

### 5. Các Script có sẵn

Các lệnh sau có thể được chạy bằng `npm run <script_name>`:

*   `start`: Chạy ứng dụng ở chế độ production.
*   `dev`: Chạy ứng dụng ở chế độ development với `nodemon`.
*   `test`: Chạy các bài test (nếu có).
