// ==UserScript==
// @ScriptName      YouTube AdBlocker
// @Match           ^https?:\/\/(www\.)?youtube\.com\/.*
// @Type            response
// @Requires        mitm
// @MITM            DOMAIN-SUFFIX,youtube.com
// @Rule            URL-REGEX,^https?:\/\/(www\.)?youtube\.com\/(get_video_info|api|watch|ad),SCRIPT,yt_adblock.js
// ==/UserScript==

/**
 * YouTube AdBlocker for Shadowrocket (Integrated Version)
 * Author: ChatGPT
 *
 * Mục đích:
 * - Chặn quảng cáo trên YouTube bằng cách xử lý JSON trả về và loại bỏ các dữ liệu quảng cáo.
 * - Kết hợp metadata và rule để Shadowrocket tự động áp dụng script cho các URL mục tiêu.
 */

let body = $response.body;
let response = {};

// Cố gắng parse JSON, nếu lỗi thì trả về dữ liệu ban đầu
try {
  response = JSON.parse(body);
} catch (e) {
  console.log("Lỗi parse JSON: " + e);
  $done({ body });
}

// --- 1. Xóa các trường quảng cáo cấp cao ---
const adKeys = ['adPlacements', 'adSlots', 'playerAds'];
adKeys.forEach(key => {
  if (response[key]) {
    delete response[key];
  }
});

// --- 2. Xử lý nested objects chứa quảng cáo ---
if (response.responseContext && response.responseContext.mainAppWebResponseContext) {
  if (response.responseContext.mainAppWebResponseContext.adSlots) {
    delete response.responseContext.mainAppWebResponseContext.adSlots;
  }
}

// --- 3. Lọc bỏ các mục quảng cáo trong danh sách gợi ý ---
if (
  response.contents &&
  response.contents.twoColumnWatchNextResults &&
  response.contents.twoColumnWatchNextResults.secondaryResults &&
  response.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults &&
  Array.isArray(response.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults.results)
) {
  response.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults.results = response.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults.results.filter(item => {
    return !item.adInfoRenderer;
  });
}

// --- 4. Cải thiện tốc độ tải video: Loại bỏ tham số quảng cáo khỏi URL ---
if (response.streamingData && Array.isArray(response.streamingData.adaptiveFormats)) {
  response.streamingData.adaptiveFormats.forEach(format => {
    if (format.url) {
      format.url = format.url.replace(/&oad=[^&]*/g, "");
    }
  });
}

// --- 5. Xóa các thông tin tracking không cần thiết ---
if (response.responseContext) {
  if (response.responseContext.serviceTrackingParams) {
    delete response.responseContext.serviceTrackingParams;
  }
  if (response.responseContext.webResponseContextExtensionData) {
    delete response.responseContext.webResponseContextExtensionData;
  }
}

// --- 6. Xóa các lệnh (commands) liên quan đến quảng cáo ---
if (Array.isArray(response.commands)) {
  response.commands = response.commands.filter(cmd => {
    if (cmd.signalServiceEndpoint && cmd.signalServiceEndpoint.signal) {
      return !cmd.signalServiceEndpoint.signal.toLowerCase().includes("ad");
    }
    return true;
  });
}

$done({ body: JSON.stringify(response) });
