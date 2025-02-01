// ==UserScript==
// @ScriptName      Advanced YouTube AdBlocker v2
// @Match           ^https?:\/\/(www\.)?youtube\.com\/.*
// @Type            response
// @Requires        mitm
// @MITM            DOMAIN-SUFFIX,youtube.com
// @Rule            URL-REGEX,^https?:\/\/(www\.)?youtube\.com\/(get_video_info|api|watch|ad),SCRIPT,advanced_yt_adblock_v2.js
// ==/UserScript==

(function() {
    let body = $response.body;
    let response = {};

    try {
        response = JSON.parse(body);
    } catch (e) {
        console.log("Error parsing JSON: " + e);
        $done({ body });
        return;
    }

    // Chặn mọi request liên quan đến quảng cáo ngay từ đầu
    if ($request.url.includes("ad") || $request.url.includes("get_midroll_info") || $request.url.includes("pagead/aclk")) {
        $done({ response: { status: 204, body: "" } });
        return;
    }

    // Trả về dữ liệu giả thay vì xóa hoàn toàn (tránh lỗi tải video)
    if ($request.url.includes("get_midroll_info")) {
        let fakeResponse = { adPlacements: [], playerAds: [], adBreaks: [] };
        $done({ body: JSON.stringify(fakeResponse) });
        return;
    }

    // Xóa dữ liệu quảng cáo ngay khi video bắt đầu
    const adKeys = ["adPlacements", "adSlots", "playerAds", "adBreaks", "adSignals", "serviceTrackingParams", "adServingData"];
    
    function deepClean(obj) {
        if (Array.isArray(obj)) {
            return obj.map(deepClean).filter(item => item !== null);
        } else if (obj && typeof obj === 'object') {
            for (const key in obj) {
                if (adKeys.includes(key) || key.toLowerCase().includes("ad")) {
                    delete obj[key];
                } else {
                    obj[key] = deepClean(obj[key]);
                }
            }
            return obj;
        }
        return obj;
    }

    if (response.playerResponse) {
        response.playerResponse = deepClean(response.playerResponse);
    }

    // Loại bỏ các overlay ads (biểu ngữ trong video)
    if (response.overlay) {
        delete response.overlay;
    }

    // Bỏ qua quảng cáo nếu có xuất hiện
    setInterval(() => {
        let skipButton = document.querySelector(".ytp-ad-skip-button, .ytp-ad-overlay-close-button");
        if (skipButton) {
            skipButton.click();
            console.log("Đã tự động bỏ qua quảng cáo!");
        }
    }, 500);

    // Trả về JSON đã xử lý
    $done({ body: JSON.stringify(response) });
})();
