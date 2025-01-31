// Đọc dữ liệu phản hồi từ Spotify API
let response = JSON.parse($response.body);

// Kiểm tra nếu có trường "restrictions" và loại bỏ mọi giới hạn
if (response && response.restrictions) {
    response.restrictions = {};  // Xóa mọi giới hạn skip
}

// Giả mạo pre-fetch để mở khóa tính năng
if (response && response.feature_restrictions) {
    response.feature_restrictions = {};  // Xóa mọi giới hạn tính năng
}

// Giả mạo quyền truy cập toàn bộ
if (response && response.available_features) {
    response.available_features = ["skip", "premium", "ads-free", "offline", "high_quality"];  // Thêm quyền truy cập đầy đủ
}

// Đảm bảo trả về dữ liệu đã được sửa
$done({ body: JSON.stringify(response) });
