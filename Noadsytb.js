const config = {
    enableDebug: false,
    scriptEngine: "jsc",
};

const url = $request.url;

try {
    let response = JSON.parse($response.body);

    if (url.includes("youtubei.googleapis.com/")) {
        // Danh sách các key chứa quảng cáo
        const adKeys = [
            "adPlacements", "playerAds", "promotedContent", "adBreakParams",
            "adSignals", "adSurvey", "adServingData", "cards", "bumper",
            "inVideoPromotion", "promoConfig", "playerOverlay",
            "midroll", "endScreen", "overlay", "paidContentOverlay",
            "advertiser", "adSlotRenderer", "adOrder", "adInfoRenderer",
            "adPlacementConfig", "playerAdvertiser", "sponsorInfoRenderer"
        ];

        // Xóa toàn bộ dữ liệu quảng cáo
        adKeys.forEach(key => {
            if (response.hasOwnProperty(key)) {
                delete response[key];
            }
        });

        // Đảm bảo không còn dữ liệu quảng cáo nào
        response.adPlacements = [];
        response.playerAds = [];
        response.adServingData = {};
        response.adBreakParams = {};
        response.promoConfig = {};

        // Chặn quảng cáo đầu, giữa, cuối video
        if (url.includes("/v1/player") || url.includes("/v1/watch")) {
            response.adPlacements = [];
            response.playerAds = [];
            response.adBreakParams = {};
            response.adServingData = {};
        }

        // Chặn quảng cáo giữa video khi tua
        if (response.hasOwnProperty("playbackTracking")) {
            delete response.playbackTracking.adBreak;
        }

        // Chặn quảng cáo trong danh sách phát, trang chủ, đề xuất
        if (url.includes("/v1/next") || url.includes("/v1/browse")) {
            if (response.contents) {
                delete response.contents.promotedContent;
            }
        }

        // Giữ lại tracking cơ bản để tránh lỗi đề xuất
        const keepTrackingKeys = ["trackingParams", "eventId", "responseContext"];
        Object.keys(response).forEach(key => {
            if (!keepTrackingKeys.includes(key)) {
                delete response[key];
            }
        });

        // Chặn tracking quảng cáo nhưng giữ lại gợi ý
        if (response.responseContext) {
            delete response.responseContext.serviceTrackingParams;
            delete response.responseContext.webResponseContextExtensionData;
        }

        // Chặn quảng cáo ẩn trong request log_event
        if (url.includes("/v1/log_event")) {
            response = {};
        }

        // DNS Blocking (chặn quảng cáo từ DNS)
        const dnsBlockList = [
            "pagead2.googlesyndication.com",
            "googleads.g.doubleclick.net",
            "ads.youtube.com",
            "static.doubleclick.net"
        ];
        response.dnsBlock = dnsBlockList;

        // Ngăn YouTube lưu cache quảng cáo
        response.cacheControl = "no-store, no-cache, must-revalidate, proxy-revalidate";
        response.pragma = "no-cache";
        response.expires = "0";

        // Gửi phản hồi đã chỉnh sửa
        $done({ body: JSON.stringify(response) });
    } else {
        $done({});
    }
} catch (e) {
    console.log("Lỗi chặn quảng cáo YouTube:", e);
    $done({});
}
