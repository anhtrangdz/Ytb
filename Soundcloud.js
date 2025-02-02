try {
  var body = $response.body;
  var obj = JSON.parse(body);
} catch (e) {
  console.log("Lỗi khi parse JSON: " + e);
  $done({ body: $response.body });
  return;
}

// Cập nhật thông tin gói (plan)
obj.plan = {
  "vendor": "apple",
  "id": "high_tier",
  "manageable": true,
  "plan_upsells": [],
  "plan_id": "go-plus",
  "upsells": [],
  "plan_name": "SoundCloud Go+"
};

// Hàm cập nhật hoặc thêm tính năng vào mảng features
function updateFeature(features, name, enabled, plans) {
  // Tìm xem tính năng đã tồn tại chưa
  var found = false;
  for (var i = 0; i < features.length; i++) {
    if (features[i].name === name) {
      features[i].enabled = enabled;
      features[i].plans = plans;
      found = true;
      break;
    }
  }
  if (!found) {
    features.push({
      "name": name,
      "enabled": enabled,
      "plans": plans
    });
  }
}

// Nếu obj.features không tồn tại, khởi tạo mảng rỗng
if (!Array.isArray(obj.features)) {
  obj.features = [];
}

// Cập nhật các tính năng
updateFeature(obj.features, "offline_sync", true, ["mid_tier", "high_tier"]);
updateFeature(obj.features, "no_audio_ads", true, ["mid_tier", "high_tier"]);
updateFeature(obj.features, "hq_audio", true, ["high_tier"]);
updateFeature(obj.features, "system_playlist_in_library", true, []);
updateFeature(obj.features, "ads_krux", false, []);
updateFeature(obj.features, "new_home", true, []);

// (Có thể có thêm các tính năng khác theo yêu cầu)

// Trả về response đã được cập nhật
$done({ body: JSON.stringify(obj) });
