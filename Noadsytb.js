/**
 * YouTube AdBlocker cho Shadowrocket (Phiên bản viết lại)
 * Tác giả: ChatGPT
 *
 * Mục đích:
 * - Xóa các trường liên quan đến quảng cáo như: adPlacements, adSlots, playerAds
 * - Lọc bỏ các mục quảng cáo trong danh sách gợi ý (secondaryResults)
 * - Loại bỏ các tham số quảng cáo trong URL của streamingData
 * - Xóa các thông tin tracking không cần thiết nhưng giữ lại dữ liệu gợi ý
 * - Xóa các lệnh (commands) liên quan đến quảng cáo
 */

let body = $response.body;
let response = {};

// Thử parse dữ liệu JSON, nếu lỗi thì trả về dữ liệu ban đầu
try {
  response = JSON.parse(body);
} catch (e) {
  console.log("Lỗi parse JSON: " + e);
  $done({ body });
}

// --- 1. Xóa các trường quảng cáo ở cấp cao ---
const adKeys = ['adPlacements', 'adSlots', 'playerAds'];
adKeys.forEach(key => {
  if (response[key]) {
    delete response[key];
  }
});

// --- 2. Xử lý các trường quảng cáo trong nested objects ---
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
    // Nếu không có trường adInfoRenderer thì giữ lại
    return !item.adInfoRenderer;
  });
}

// --- 4. Cải thiện tốc độ tải video: Loại bỏ tham số quảng cáo khỏi URL streaming ---
if (response.streamingData && Array.isArray(response.streamingData.adaptiveFormats)) {
  response.streamingData.adaptiveFormats.forEach(format => {
    if (format.url) {
      // Loại bỏ tham số "oad" khỏi URL
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

// Trả về dữ liệu JSON đã được xử lý
$done({ body: JSON.stringify(response) });
