// ==UserScript==
// @ScriptName      Ultimate YouTube AdBlocker for Shadowrocket
// @Match           ^https?:\/\/(www\.)?youtube\.com\/.*
// @Type            response
// @Requires        mitm
// @MITM            DOMAIN-SUFFIX,youtube.com
// @Rule            URL-REGEX,^https?:\/\/(www\.)?youtube\.com\/(get_video_info|api|watch|ad),SCRIPT,ultimate_yt_adblock.js
// ==/UserScript==

(function() {
  let body = $response.body;
  let response = {};

  try {
    response = JSON.parse(body);
  } catch (e) {
    console.log("JSON parsing error: " + e);
    $done({ body });
    return;
  }

  // Danh sách key chứa quảng cáo cần loại bỏ
  const adKeys = [
    "adPlacements", "adSlots", "playerAds", "adBreaks",
    "adSignals", "ad3pTrackingParams", "adIsRewarded", "adCueParams",
    "adServingData", "adDebugInfo", "adPositions", "serviceTrackingParams",
    "webResponseContextExtensionData", "promotedContent"
  ];

  // Hàm kiểm tra object có phải quảng cáo không
  function isAdObject(obj) {
    if (obj && typeof obj === 'object') {
      return Object.keys(obj).some(key => key.toLowerCase().includes("ad"));
    }
    return false;
  }

  // Hàm xóa quảng cáo đệ quy
  function deepClean(data) {
    if (Array.isArray(data)) {
      return data.filter(item => !isAdObject(item)).map(item => deepClean(item));
    } else if (data !== null && typeof data === 'object') {
      for (const key of Object.keys(data)) {
        if (adKeys.includes(key) || isAdObject(data[key])) {
          delete data[key];
        } else {
          data[key] = deepClean(data[key]);
        }
      }
      return data;
    }
    return data;
  }

  // Xử lý đặc thù playerResponse
  if (response.playerResponse) {
    response.playerResponse = deepClean(response.playerResponse);
  }

  // Loại bỏ quảng cáo trong streamingData
  if (response.streamingData && Array.isArray(response.streamingData.adaptiveFormats)) {
    response.streamingData.adaptiveFormats.forEach(format => {
      if (format.url) {
        format.url = format.url.replace(/&oad=[^&]*/g, "");
      }
    });
  }

  // Xử lý commands chứa quảng cáo
  if (Array.isArray(response.commands)) {
    response.commands = response.commands.filter(cmd => {
      return !(cmd.signalServiceEndpoint && cmd.signalServiceEndpoint.signal.toLowerCase().includes("ad"));
    });
  }

  // Chặn quảng cáo đầu video ngay lập tức
  if (response.adPlacements) {
    delete response.adPlacements;
  }
  
  // Loại bỏ quảng cáo trong video queue
  if (response.queue && response.queue.items) {
    response.queue.items = response.queue.items.filter(item => !isAdObject(item));
  }
  
  // Áp dụng deepClean toàn bộ response
  response = deepClean(response);

  $done({ body: JSON.stringify(response) });
})();
