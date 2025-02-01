const url = $request.url;

try {
    let response = JSON.parse($response.body);

    if (url.includes("youtubei.googleapis.com/")) {
        // Xóa dữ liệu quảng cáo
        const adKeys = [
            "adPlacements", "playerAds", "promotedContent", "adBreakParams",
            "adSignals", "adSurvey", "adServingData", "cards", "bumper",
            "inVideoPromotion", "promoConfig", "playerOverlay",
            "midroll", "endScreen", "overlay", "paidContentOverlay",
            "advertiser", "adSlotRenderer", "adOrder", "adInfoRenderer",
            "adPlacementConfig", "playerAdvertiser", "sponsorInfoRenderer"
        ];
        adKeys.forEach(key => { if (response.hasOwnProperty(key)) delete response[key]; });

        // Chặn quảng cáo đầu, giữa, cuối video
        if (url.includes("/v1/player") || url.includes("/v1/watch")) {
            response.adPlacements = [];
            response.playerAds = [];
            response.adServingData = {};
        }

        // Chặn quảng cáo khi tua
        if (response.hasOwnProperty("playbackTracking")) {
            delete response.playbackTracking.adBreak;
        }

        // Chặn quảng cáo trong danh sách phát, trang chủ, đề xuất
        if (url.includes("/v1/next") || url.includes("/v1/browse")) {
            if (response.contents) delete response.contents.promotedContent;
        }

        // Chặn quảng cáo "Được tài trợ"
        if (response.hasOwnProperty("sponsorInfoRenderer")) {
            delete response.sponsorInfoRenderer;
        }

        // Chặn quảng cáo ẩn trong request log_event
        if (url.includes("/v1/log_event")) {
            response = {};
        }

        // Tích hợp quy tắc URL Rewrite
        const blockUrls = [
            /googlevideo\.com\/.*&oad/,
            /googlevideo\.com\/ptracking\?pltype=adhost/,
            /youtube\.com\/api\/stats\/.*adformat/,
            /youtube\.com\/api\/stats\/ads/,
            /youtube\.com\/get_midroll/,
            /youtube\.com\/pagead\//,
            /youtube\.com\/ptracking\?/,
            /m\.youtube\.com\/_get_ads/,
            /pagead2\.googlesyndication\.com\/pagead\//,
            /s\.youtube\.com\/api\/stats\/watchtime\?adformat/,
            /youtubei\.googleapis\.com\/.*ad_break/
        ];
        
        if (blockUrls.some(regex => regex.test(url))) {
            response = {};
        }

        $done({ body: JSON.stringify(response) });
    } else {
        $done({});
    }
} catch (e) {
    console.log("Lỗi chặn quảng cáo YouTube:", e);
    $done({});
}
