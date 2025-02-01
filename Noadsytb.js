// ==UserScript==
// @ScriptName      Advanced YouTube AdBlocker
// @Match           ^https?:\/\/(www\.)?youtube\.com\/.*
// @Type            response
// @Requires        mitm
// @MITM            DOMAIN-SUFFIX,youtube.com
// @Rule            URL-REGEX,^https?:\/\/(www\.)?youtube\.com\/(get_video_info|api|watch|ad),SCRIPT,advanced_yt_adblock.js
// ==/UserScript==

/**
 * Advanced YouTube AdBlocker for Shadowrocket
 * Phiên bản nâng cao với xử lý đệ quy (recursive cleaning) nhằm tìm và xóa
 * các dữ liệu quảng cáo ở nhiều tầng của JSON.
 *
 * Lưu ý:
 * - Các trường bị xóa có thể bao gồm: adPlacements, adSlots, playerAds,
 *   serviceTrackingParams, webResponseContextExtensionData, cùng các object chứa
 *   "adInfoRenderer" hoặc "adRenderer".
 * - Cẩn trọng vì việc xóa quá nhiều có thể ảnh hưởng đến một số chức năng không liên quan đến quảng cáo.
 */

(function() {
  let body = $response.body;
  let response = {};

  // --- 1. Parse JSON ---
  try {
    response = JSON.parse(body);
  } catch (e) {
    console.log("Error parsing JSON: " + e);
    $done({ body });
    return;
  }

  // --- 2. Hàm kiểm tra object có dấu hiệu quảng cáo ---
  function isAdObject(obj) {
    if (obj && typeof obj === 'object') {
      // Nếu object chứa các key báo hiệu quảng cáo
      const adIndicators = ["adInfoRenderer", "adRenderer"];
      for (const indicator of adIndicators) {
        if (obj.hasOwnProperty(indicator)) return true;
      }
    }
    return false;
  }

  // --- 3. Hàm xử lý đệ quy (recursive cleaning) ---
  function deepClean(data) {
    if (Array.isArray(data)) {
      // Với mảng: lọc bỏ các phần tử được xác định là quảng cáo và đệ quy xử lý các phần tử còn lại
      return data
        .filter(item => {
          // Nếu item là object và có dấu hiệu quảng cáo => loại bỏ
          if (isAdObject(item)) return false;
          return true;
        })
        .map(item => deepClean(item));
    } else if (data !== null && typeof data === 'object') {
      // Với object: duyệt qua từng key và xóa những key được cho là quảng cáo
      const keysToRemove = [
        "adPlacements",
        "adSlots",
        "playerAds",
        "serviceTrackingParams",
        "webResponseContextExtensionData"
      ];
      for (const key in data) {
        if (keysToRemove.indexOf(key) > -1) {
          delete data[key];
        } else {
          // Nếu giá trị là object hoặc mảng thì đệ quy
          data[key] = deepClean(data[key]);
        }
      }
      return data;
    } else {
      // Với giá trị nguyên thủy, trả về như cũ
      return data;
    }
  }

  // --- 4. Xử lý đặc thù: Streaming Data ---
  // Loại bỏ các tham số quảng cáo trong URL của streamingData.adaptiveFormats
  if (response.streamingData && Array.isArray(response.streamingData.adaptiveFormats)) {
    response.streamingData.adaptiveFormats.forEach(format => {
      if (format.url) {
        // Loại bỏ các tham số có định dạng &oad=...
        format.url = format.url.replace(/&oad=[^&]*/g, "");
      }
    });
  }

  // --- 5. Xử lý đặc thù: Commands ---
  // Loại bỏ các lệnh có chứa "ad" trong signal (như các lệnh gọi quảng cáo)
  if (Array.isArray(response.commands)) {
    response.commands = response.commands.filter(cmd => {
      if (cmd.signalServiceEndpoint && cmd.signalServiceEndpoint.signal) {
        return !cmd.signalServiceEndpoint.signal.toLowerCase().includes("ad");
      }
      return true;
    });
  }

  // --- 6. Thực hiện quét đệ quy toàn bộ JSON ---
  response = deepClean(response);

  // --- 7. Trả về JSON đã xử lý ---
  $done({ body: JSON.stringify(response) });
})();
