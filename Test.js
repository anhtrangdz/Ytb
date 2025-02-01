// ==UserScript==
// @ScriptName      Ultimate YouTube AdBlocker (Shadowrocket Optimized)
// @Match           ^https?:\/\/(www\.)?youtube\.com\/.*
// @Type            response
// @Requires        mitm
// @MITM            DOMAIN-SUFFIX,youtube.com
// @Rule            URL-REGEX,^https?:\/\/(www\.)?youtube\.com\/(get_video_info|api|watch|ad),SCRIPT,ultimate_yt_adblock.js
// ==/UserScript==

/**
 * Ultimate YouTube AdBlocker for Shadowrocket (Optimized)
 * 🚀 Chặn quảng cáo hoàn toàn ở cấp độ mạng.
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

    // 📌 Danh sách các key liên quan đến quảng cáo
    const blockedAds = [
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

    // 🛑 Hàm kiểm tra và xóa quảng cáo
    function detectAndBlockAds(obj) {
        if (Array.isArray(obj)) {
            return obj.filter(item => !isAd(item)).map(detectAndBlockAds);
        } else if (obj !== null && typeof obj === "object") {
            for (const key in obj) {
                if (isAdKey(key)) {
                    delete obj[key];
                } else {
                    obj[key] = detectAndBlockAds(obj[key]);
                }
            }
        }
        return obj;
    }

    // 🛑 Kiểm tra xem key có phải quảng cáo không
    function isAdKey(key) {
        return blockedAds.includes(key) || key.toLowerCase().includes("ad");
    }

    function isAd(obj) {
        return obj && typeof obj === "object" && Object.keys(obj).some(isAdKey);
    }

    // 📌 Xử lý JSON: Chặn quảng cáo dựa trên danh sách
    response = detectAndBlockAds(response);

    // 🔄 Xóa quảng cáo trong URL video (tránh pre-roll ads)
    if (response.streamingData && Array.isArray(response.streamingData.adaptiveFormats)) {
        response.streamingData.adaptiveFormats.forEach(format => {
            if (format.url) {
                format.url = format.url.replace(/&oad=[^&]*/g, ""); // Xóa tham số quảng cáo
            }
        });
    }

    console.log("✅ Ultimate YouTube AdBlocker đã xử lý xong!");
    $done({ body: JSON.stringify(response) });
})();
