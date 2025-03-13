const mapping = {
  '%E8%BD%A6%E7%A5%A8%E7%A5%A8': ['vip+watch_vip'],
  'Locket': ['Gold']
};

var ua = $request.headers["User-Agent"] || $request.headers["user-agent"];
var obj = JSON.parse($response.body);

// ⚡ Thông báo cá nhân hóa khi mở app
obj.Attention = "Chúc mừng bạn! Locket Gold đã được kích hoạt vĩnh viễn. Không chia sẻ!";

// 🏆 Định nghĩa Premium
var locket02 = {
    is_sandbox: false,
    ownership_type: "PURCHASED",
    billing_issues_detected_at: null,
    period_type: "normal",
    expires_date: "2099-12-31T23:59:59Z", // Gia hạn vĩnh viễn
    grace_period_expires_date: null,
    unsubscribe_detected_at: null,
    original_purchase_date: "2024-01-01T00:00:00Z",
    purchase_date: "2024-01-01T00:00:00Z",
    store: "app_store"
};

var locket01 = {
    grace_period_expires_date: null,
    purchase_date: "2024-01-01T00:00:00Z",
    product_identifier: "com.locket02.premium.yearly",
    expires_date: "2099-12-31T23:59:59Z"
};

// 🔄 Kiểm tra User-Agent để đảm bảo Premium được kích hoạt liên tục
const match = Object.keys(mapping).find(e => ua.includes(e));

if (match) {
    let [entitlement, product] = mapping[match];
    if (product) {
        locket01.product_identifier = product;
        obj.subscriber.subscriptions[product] = locket02;
    } else {
        obj.subscriber.subscriptions["com.locket02.premium.yearly"] = locket02;
    }
    obj.subscriber.entitlements[entitlement] = locket01;
} else {
    obj.subscriber.subscriptions["com.locket02.premium.yearly"] = locket02;
    obj.subscriber.entitlements.pro = locket01;
}

// 🏅 Giữ nguyên Huy Hiệu Locket Gold mỗi lần app mở lại
obj.subscriber.attributes = obj.subscriber.attributes || {};
if (!obj.subscriber.attributes.gold_badge || obj.subscriber.attributes.gold_badge.value !== "gold_member") {
    obj.subscriber.attributes.gold_badge = {
        "value": "gold_member",
        "updated_at_ms": Date.now()
    };
}

$done({ body: JSON.stringify(obj) });
