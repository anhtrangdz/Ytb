// ==UserScript==
// @ScriptName      Advanced YouTube AdBlocker (Shadowrocket)
// @Match           ^https?:\/\/(www\.)?youtube\.com\/.*
// @Type            response
// @Requires        mitm
// @MITM            DOMAIN-SUFFIX,youtube.com
// @Rule            URL-REGEX,^https?:\/\/(www\.)?youtube\.com\/(get_video_info|api|watch|ad),SCRIPT,advanced_yt_adblock.js
// ==/UserScript==

/**
 * Advanced YouTube AdBlocker for Shadowrocket
 * Cải tiến để xử lý tốt hơn việc loại bỏ quảng cáo ngay khi bấm vào video.
 */

(function() {
  let body = $response.body;
  let response = {};

  try {
    response = JSON.parse(body);
  } catch (e) {
    console.log("🚨 Lỗi khi parse JSON: " + e);
    $done({ body });
    return;
  }

  // 🛑 Các key liên quan đến quảng cáo cần loại bỏ
  const adKeys = [
    "adPlacements",
    "adBreaks",
    "playerAds",
    "adSignals",
    "serviceTrackingParams",
    "adServingData",
    "adInfoRenderer",
    "adRenderer",
    "adSlotLoggingData",
    "midrollAdBreak",
    "adLayoutLoggingData"
  ];

  function deepClean(obj) {
    if (Array.isArray(obj)) {
      return obj.filter(item => !isAdObject(item)).map(deepClean);
    } else if (obj !== null && typeof obj === "object") {
      for (const key in obj) {
        if (adKeys.includes(key) || key.toLowerCase().includes("ad")) {
          delete obj[key];
        } else {
          obj[key] = deepClean(obj[key]);
        }
      }
    }
    return obj;
  }

  function isAdObject(obj) {
    return obj && typeof obj === "object" && Object.keys(obj).some(key => adKeys.includes(key) || key.toLowerCase().includes("ad"));
  }

  // 🧹 Làm sạch dữ liệu quảng cáo
  response = deepClean(response);

  // 🎯 Ngăn YouTube tải lại quảng cáo giữa video
  if (response.streamingData && Array.isArray(response.streamingData.adaptiveFormats)) {
    response.streamingData.adaptiveFormats.forEach(format => {
      if (format.url) {
        format.url = format.url.replace(/&oad=[^&]*/g, ""); // Loại bỏ tham số quảng cáo trong URL video
      }
    });
  }

  $done({ body: JSON.stringify(response) });
})();
