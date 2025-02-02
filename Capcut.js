var body = $response.body;
var obj = JSON.parse(body);

// Chặn quảng cáo bằng cách loại bỏ các key liên quan đến ads
const adKeys = ["ad", "ads", "advertisement", "ad_data", "ad_info"];
adKeys.forEach(key => {
    if (obj.hasOwnProperty(key)) delete obj[key];
});

// Xóa quảng cáo trong danh sách dữ liệu
if (obj.data && Array.isArray(obj.data)) {
    obj.data = obj.data.filter(item => !item.hasOwnProperty("ad"));
}

// Mở khóa CapCut Pro
if (obj.hasOwnProperty("subscription")) {
    obj.subscription = {
        "plan": "pro",
        "status": "active",
        "expires_at": "2099-12-31T23:59:59Z"
    };
}

// Mở khóa tính năng CapCut Pro
const proFeatures = [
    "no_watermark", "export_hd", "premium_effects",
    "premium_transitions", "premium_fonts", "premium_music"
];

if (!obj.features) obj.features = [];
proFeatures.forEach(feature => {
    obj.features.push({ "name": feature, "enabled": true });
});

// Trả về dữ liệu đã chỉnh sửa
body = JSON.stringify(obj);
$done({body});
