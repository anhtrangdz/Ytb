// ==UserScript==
// @ScriptName      Advanced YouTube AdBlocker Improved
// @Match           ^https?:\/\/(www\.)?youtube\.com\/.*
// @Type            response
// @Requires        mitm
// @MITM            DOMAIN-SUFFIX,youtube.com
// @Rule            URL-REGEX,^https?:\/\/(www\.)?youtube\.com\/(get_video_info|api|watch|ad),SCRIPT,advanced_yt_adblock_improved.js
// ==/UserScript==

/**
 * Advanced YouTube AdBlocker Improved
 * ----------------------------------
 * Phiên bản cải tiến dựa trên script cũ, bổ sung thêm một số xử lý nhằm tăng hiệu quả loại bỏ quảng cáo,
 * đặc biệt là quảng cáo hiển thị ngay khi bấm đầu video.
 *
 * Các thay đổi:
 * 1. Bổ sung thêm danh sách các key có khả năng chứa dữ liệu quảng cáo.
 * 2. Xử lý riêng phần playerResponse (nếu có) ngay sau khi parse JSON.
 * 3. Tăng cường đệ quy với khả năng loại bỏ object có key chứa "ad" (có điều kiện tránh xóa nhầm các key hợp lệ).
 * 4. Xử lý thêm trường hợp các mảng chứa các object quảng cáo lồng sâu.
 *
 * Lưu ý: Nếu có lỗi hoặc một số chức năng không hoạt động (ví dụ: chất lượng video, phụ đề, …),
 * bạn có thể cần phải tinh chỉnh lại danh sách các key bị xóa.
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

  // --- 2. Danh sách các key cần loại bỏ hoàn toàn ---
  const keysToRemove = [
    "adPlacements",
    "adSlots",
    "playerAds",
    "serviceTrackingParams",
    "webResponseContextExtensionData",
    "ad3pTrackingParams",
    "adIsRewarded",
    "adCueParams",
    "adSignals",
    "adDebugInfo",          // Một số phiên bản mới có thể dùng key này
    "adServingData",        // Dữ liệu phục vụ quảng cáo
    "adBreaks",
    "adCommands",
    "adPositions"
  ];

  // --- 3. Hàm kiểm tra object có dấu hiệu quảng cáo theo key ---
  // Điều kiện: Nếu object chứa trực tiếp key "adInfoRenderer" hoặc "adRenderer"
  function isAdObject(obj) {
    if (obj && typeof obj === 'object') {
      const adIndicators = ["adInfoRenderer", "adRenderer"];
      for (const indicator of adIndicators) {
        if (obj.hasOwnProperty(indicator)) return true;
      }
    }
    return false;
  }

  // --- 4. Hàm xử lý đệ quy: deepClean ---
  // Ngoài việc loại bỏ key cố định, hàm còn xử lý các object có key chứa chuỗi "ad" nếu
  // không phải là những key an toàn (ví dụ: "adaptation" hay "additionalData")
  function deepClean(data) {
    if (Array.isArray(data)) {
      // Với mảng: Lọc các phần tử rõ ràng chứa quảng cáo và đệ quy xử lý các phần tử còn lại
      return data
        .filter(item => {
          if (isAdObject(item)) return false;
          return true;
        })
        .map(item => deepClean(item));
    } else if (data !== null && typeof data === 'object') {
      for (const key in data) {
        // Nếu key nằm trong danh sách cần loại bỏ thì xóa
        if (keysToRemove.indexOf(key) > -1) {
          delete data[key];
        }
        // Nếu key chứa "ad" (theo dạng viết thường) và không nằm trong danh sách loại trừ an toàn,
        // có thể là dữ liệu quảng cáo – tuy nhiên, cần tránh xóa các key như "adaptation"...
        else if (/ad/i.test(key) &&
                 // Danh sách key an toàn không nên xóa
                 ["adaptation", "additionalData", "address"].indexOf(key.toLowerCase()) === -1) {
          // Nếu giá trị của key này là object hoặc mảng thì đệ quy xử lý
          data[key] = deepClean(data[key]);
          // Nếu sau khi đệ quy, object rỗng hoặc mảng rỗng thì có thể xóa key luôn
          if (
            (typeof data[key] === 'object' && data[key] !== null && Object.keys(data[key]).length === 0) ||
            (Array.isArray(data[key]) && data[key].length === 0)
          ) {
            delete data[key];
          }
        } else {
          // Nếu không phải các trường đặc biệt thì tiếp tục đệ quy
          data[key] = deepClean(data[key]);
        }
      }
      return data;
    } else {
      // Với giá trị nguyên thủy, trả về như cũ
      return data;
    }
  }

  // --- 5. Xử lý đặc thù: playerResponse ---
  // Một số phản hồi ban đầu chứa dữ liệu quảng cáo trong playerResponse
  if (response.playerResponse) {
    response.playerResponse = deepClean(response.playerResponse);
  }

  // --- 6. Xử lý đặc thù: Streaming Data ---
  // Loại bỏ các tham số quảng cáo trong URL của streamingData.adaptiveFormats nếu có
  if (response.streamingData && Array.isArray(response.streamingData.adaptiveFormats)) {
    response.streamingData.adaptiveFormats.forEach(format => {
      if (format.url) {
        // Loại bỏ các tham số quảng cáo dạng &oad=...
        format.url = format.url.replace(/&oad=[^&]*/g, "");
      }
    });
  }

  // --- 7. Xử lý đặc thù: Commands ---
  // Loại bỏ các lệnh chứa "ad" trong signal (các lệnh quảng cáo)
  if (Array.isArray(response.commands)) {
    response.commands = response.commands.filter(cmd => {
      if (cmd.signalServiceEndpoint && cmd.signalServiceEndpoint.signal) {
        return !cmd.signalServiceEndpoint.signal.toLowerCase().includes("ad");
      }
      return true;
    });
  }

  // --- 8. Thực hiện quét đệ quy toàn bộ JSON ---
  response = deepClean(response);

  // --- 9. Trả về JSON đã xử lý ---
  $done({ body: JSON.stringify(response) });
})();
