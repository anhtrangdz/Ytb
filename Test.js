// ==UserScript==
// @ScriptName      Advanced YouTube AdBlocker Plus
// @Match           ^https?:\/\/(www\.)?youtube\.com\/.*
// @Type            response
// @Requires        mitm
// @MITM            DOMAIN-SUFFIX,youtube.com
// @Rule            URL-REGEX,^https?:\/\/(www\.)?youtube\.com\/(get_video_info|api|watch|ad),SCRIPT,advanced_yt_adblock_plus.js
// ==/UserScript==

/**
 * Advanced YouTube AdBlocker Plus
 * Phiên bản cải tiến nhằm xử lý nhanh hơn và toàn diện hơn các trường quảng cáo,
 * đặc biệt là ngay khi video mới bắt đầu (click đầu video).
 *
 * Các trường đã được bổ sung để loại bỏ:
 * - adPlacements, adSlots, playerAds, serviceTrackingParams, webResponseContextExtensionData
 * - ad3pTrackingParams, adIsRewarded, adCueParams, adSignals
 * - Các object có chứa "adInfoRenderer" hoặc "adRenderer"
 *
 * Lưu ý: Việc xóa quá nhiều trường có thể ảnh hưởng đến một số chức năng khác, nên hãy kiểm tra kỹ nếu có vấn đề.
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
          if (isAdObject(item)) return false;
          return true;
        })
        .map(item => deepClean(item));
    } else if (data !== null && typeof data === 'object') {
      // Các key cần xóa hoàn toàn nếu chúng tồn tại
      const keysToRemove = [
        "adPlacements",
        "adSlots",
        "playerAds",
        "serviceTrackingParams",
        "webResponseContextExtensionData",
        "ad3pTrackingParams",
        "adIsRewarded",
        "adCueParams",
        "adSignals"
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

  // --- 6. Xử lý đặc thù: Player Response ---
  // Một số phản hồi video (ytInitialPlayerResponse) chứa thêm các dữ liệu quảng cáo.
  if (response.playerResponse) {
    response.playerResponse = deepClean(response.playerResponse);
  }

  // --- 7. Thực hiện quét đệ quy toàn bộ JSON ---
  response = deepClean(response);

  // --- 8. Trả về JSON đã xử lý ---
  $done({ body: JSON.stringify(response) });
})();
