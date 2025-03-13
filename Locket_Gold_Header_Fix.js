const version = 'V1.0.3';

// Hàm chỉnh sửa header request
function setHeaderValue(headers, key, value) {
    var lowerKey = key.toLowerCase();
    headers[lowerKey] = value;
}

// Lấy headers từ request
var modifiedHeaders = $request.headers;

// Xóa ETag để tránh cache dữ liệu cũ của RevenueCat
setHeaderValue(modifiedHeaders, "X-RevenueCat-ETag", "");

// Chặn request kiểm tra trạng thái Premium của RevenueCat
setHeaderValue(modifiedHeaders, "If-None-Match", "");

// Xóa thông tin xác thực (tránh app tự kiểm tra lại trạng thái mua hàng)
delete modifiedHeaders["Authorization"];

$done({ headers: modifiedHeaders });
