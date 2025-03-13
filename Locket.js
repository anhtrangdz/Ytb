const mapping = {
  '%E8%BD%A6%E7%A5%A8%E7%A5%A8': ['vip+watch_vip'],
  'Locket': ['Gold']
};

var ua = $request.headers["User-Agent"] || $request.headers["user-agent"];
var obj = JSON.parse($response.body);

// Thêm thông báo xác nhận Premium
obj.Attention = "Chúc mừng bạn! Vui lòng không bán hoặc chia sẻ cho người khác!";

// Cấu hình quyền lợi Premium
var locket02 = {
  is_sandbox: false,
  ownership_type: "PURCHASED",
  billing_issues_detected_at: null,
  period_type: "normal",
  expires_date: "2099-12-18T01:04:17Z",
  grace_period_expires_date: null,
  unsubscribe_detected_at: null,
  original_purchase_date: "2024-09-12T01:04:18Z",
  purchase_date: "2024-09-12T01:04:17Z",
  store: "app_store"
};

var locket01 = {
  grace_period_expires_date: null,
  purchase_date: "2024-09-12T01:04:17Z",
  product_identifier: "com.locket02.premium.yearly",
  expires_date: "2099-12-18T01:04:17Z"
};

// Kiểm tra User-Agent và áp dụng Premium
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

// Giữ Huy Hiệu Gold Badge
obj.subscriber.attributes = obj.subscriber.attributes || {};
obj.subscriber.attributes.gold_badge = {
  "value": "gold_member",
  "updated_at_ms": Date.now()
};

// Fake vị trí địa lý sang Mỹ để mở khóa tính năng full
obj.subscriber.attributes.geo_location = {
  "value": "US",
  "updated_at_ms": Date.now()
};

// Bật quay video 15 giây
obj.video_recording_limit = 15;

$done({ body: JSON.stringify(obj) });
