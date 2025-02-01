// ==UserScript==
// @ScriptName      Advanced YouTube AdBlocker Superior Plus
// @Match           ^https?:\/\/(www\.)?youtube\.com\/.*
// @Type            response
// @Requires        mitm
// @MITM            DOMAIN-SUFFIX,youtube.com
// @Rule            URL-REGEX,^https?:\/\/(www\.)?youtube\.com\/(get_video_info|api|watch|ad),SCRIPT,advanced_yt_adblock_superior_plus.js
// ==/UserScript==

/**
 * Advanced YouTube AdBlocker Superior Plus
 * -----------------------------------------
 * Phiên bản nâng cao can thiệp sâu vào response của YouTube nhằm loại bỏ dữ liệu quảng cáo.
 * Cải tiến gồm:
 *  - Làm sạch đệ quy nhiều vòng cho đến khi không còn thay đổi (hoặc đạt giới hạn vòng lặp).
 *  - Xử lý đặc thù cho streamingData và commands.
 *  - Sử dụng danh sách key quảng cáo (keysToRemove) và danh sách key an toàn (safeKeys) để tránh xóa nhầm.
 *
 * Lưu ý: Script này chỉ can thiệp ở cấp độ JSON response và không thể tương tác trực tiếp với DOM.
 */

(function() {
  let body = $response.body;
  let responseData = {};

  // --- 1. Parse JSON ---
  try {
    responseData = JSON.parse(body);
  } catch (e) {
    console.log("Error parsing JSON: " + e);
    $done({ body });
    return;
  }

  // --- 2. Cấu hình danh sách key cần loại bỏ và danh sách key an toàn ---
  // Danh sách key được biết là chứa dữ liệu quảng cáo
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
    "adDebugInfo",
    "adServingData",
    "adBreaks",
    "adCommands",
    "adPositions"
  ];

  // Danh sách các key an toàn, mặc dù chứa chữ "ad" nhưng không phải quảng cáo
  const safeKeys = ["adaptation", "additionalData", "address", "media", "adsConfig"];

  // --- 3. Hàm làm sạch đệ quy (deepClean) ---
  // Hàm này sẽ duyệt qua toàn bộ đối tượng, xóa bỏ các key liên quan đến quảng cáo
  function deepClean(data) {
    if (Array.isArray(data)) {
      return data
        .map(item => deepClean(item))
        .filter(item => {
          // Loại bỏ các phần tử rỗng (object hoặc mảng không có nội dung)
          if (item && typeof item === "object") {
            return Object.keys(item).length > 0;
          }
          return item !== null && item !== undefined;
        });
    } else if (data !== null && typeof data === "object") {
      for (const key in data) {
        // Nếu key nằm trong danh sách cần loại bỏ, xóa luôn
        if (keysToRemove.includes(key)) {
          delete data[key];
          continue;
        }
        // Nếu key chứa chữ "ad" (không phân biệt hoa thường) nhưng không thuộc safeKeys thì xóa
        if (/ad/i.test(key) && safeKeys.indexOf(key.toLowerCase()) === -1) {
          delete data[key];
          continue;
        }
        // Đệ quy xử lý giá trị của key
        data[key] = deepClean(data[key]);
        // Nếu sau khi làm sạch giá trị trở nên rỗng, xóa key đó
        if (
          (typeof data[key] === "object" && data[key] !== null && Object.keys(data[key]).length === 0) ||
          (Array.isArray(data[key]) && data[key].length === 0)
        ) {
          delete data[key];
        }
      }
      return data;
    }
    return data;
  }

  // --- 4. Làm sạch nhiều vòng cho đến khi không có thay đổi (hoặc đạt giới hạn vòng lặp) ---
  const maxIterations = 5;
  let iteration = 0;
  let cleanedData = responseData;
  while (iteration < maxIterations) {
    const prevData = JSON.stringify(cleanedData);
    cleanedData = deepClean(cleanedData);
    const newData = JSON.stringify(cleanedData);
    iteration++;
    if (prevData === newData) {
      console.log(`Đã đạt trạng thái ổn định sau ${iteration} vòng làm sạch.`);
      break;
    }
  }

  // --- 5. Xử lý đặc thù: Streaming Data ---
  if (cleanedData.streamingData && Array.isArray(cleanedData.streamingData.adaptiveFormats)) {
    cleanedData.streamingData.adaptiveFormats.forEach(format => {
      if (format.url) {
        // Loại bỏ các tham số quảng cáo dạng &oad=... trong URL
        format.url = format.url.replace(/&oad=[^&]*/g, "");
      }
    });
  }

  // --- 6. Xử lý đặc thù: Commands ---
  if (Array.isArray(cleanedData.commands)) {
    cleanedData.commands = cleanedData.commands.filter(cmd => {
      if (cmd.signalServiceEndpoint && cmd.signalServiceEndpoint.signal) {
        return !cmd.signalServiceEndpoint.signal.toLowerCase().includes("ad");
      }
      return true;
    });
  }

  // --- 7. Trả về JSON đã làm sạch ---
  $done({ body: JSON.stringify(cleanedData) });
})();
