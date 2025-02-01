// ==UserScript==
// @ScriptName      Ultimate YouTube AdBlocker
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
        console.log("Error parsing JSON: " + e);
        $done({ body });
        return;
    }

    // Chặn request có chứa quảng cáo ngay từ đầu
    if ($request.url.includes("ad") || $request.url.includes("get_midroll_info")) {
        $done({ response: { status: 204, body: "" } });
        return;
    }

    // Nếu là phản hồi mid-roll ads, trả về dữ liệu giả
    if ($request.url.includes("get_midroll_info")) {
        let fakeResponse = { adPlacements: [], playerAds: [], adBreaks: [] };
        $done({ body: JSON.stringify(fakeResponse) });
        return;
    }

    // Xóa các key chứa quảng cáo
    const keysToRemove = ["adPlacements", "adSlots", "playerAds", "serviceTrackingParams", "ad3pTrackingParams", "adIsRewarded", "adCueParams", "adSignals", "adDebugInfo", "adServingData", "adBreaks", "adCommands", "adPositions"];
    function deepClean(data) {
        if (Array.isArray(data)) {
            return data.filter(item => !isAdObject(item)).map(item => deepClean(item));
        } else if (typeof data === 'object' && data !== null) {
            for (const key in data) {
                if (keysToRemove.includes(key) || /ad/i.test(key)) {
                    delete data[key];
                } else {
                    data[key] = deepClean(data[key]);
                }
            }
            return data;
        }
        return data;
    }

    if (response.playerResponse) {
        response.playerResponse = deepClean(response.playerResponse);
    }

    // Xóa overlay ads (biểu ngữ quảng cáo trên video)
    if (response.overlay) {
        delete response.overlay;
    }

    // Tự động skip quảng cáo nếu bị load (phòng trường hợp lọt lưới)
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
