// Giả mạo dữ liệu phản hồi Spotify để mở khóa tính năng
let response = JSON.parse($response.body);

// Giả mạo pre-fetch để bỏ qua giới hạn skip và mở khóa tính năng
if (response && response.features) {
    // Loại bỏ mọi giới hạn tính năng
    response.features = {
        "skip": true,
        "premium": true,
        "ads-free": true,
        "offline": true,
        "high_quality": true,
    };
}

// Giả mạo thông tin tài khoản để mở khóa đầy đủ tính năng
if (response && response.account_info) {
    response.account_info.subscription = "premium";
    response.account_info.has_ads = false;
}

// Đảm bảo trả về dữ liệu đã sửa đổi
$done({ body: JSON.stringify(response) });
