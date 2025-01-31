const url = $request.url;

try {
    let response = JSON.parse($response.body);

    if (url.includes("youtubei.googleapis.com/")) {
        // Danh sách các key quảng cáo cần xóa
        const adKeys = [
            "adPlacements", "playerAds", "promotedContent", "adBreakParams",
            "adSignals", "adSurvey", "adServingData", "cards", "bumper",
            "inVideoPromotion", "promoConfig", "playerOverlay",
            "midroll", "endScreen", "overlay", "paidContentOverlay",
            "advertiser", "adSlotRenderer", "adOrder", "adInfoRenderer",
            "adPlacementConfig", "playerAdvertiser"
        ];

        // Xóa tất cả các key quảng cáo
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

        // Chặn quảng cáo ngay khi mở ứng dụng
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

        // Chặn quảng cáo trong thanh bên
        if (url.includes("/v1/guide")) {
            if (response.items) {
                response.items = response.items.filter(item => !item.hasOwnProperty("adSlotRenderer"));
            }
        }

        // Ngăn YouTube hiển thị quảng cáo trong lịch sử tìm kiếm
        if (url.includes("/v1/search")) {
            response.estimatedResults = "0";
        }

        // Chặn quảng cáo ẩn trong request log_event
        if (url.includes("/v1/log_event")) {
            response = {};
        }

        // Ngăn YouTube lưu cache quảng cáo
        response.cacheControl = "no-store, no-cache, must-revalidate, proxy-revalidate";
        response.pragma = "no-cache";
        response.expires = "0";

        // Tăng chất lượng âm thanh và video
        if (response.streamingData?.formats) {
            response.streamingData.formats.forEach(format => {
                format.audioQuality = "high";
                if (format.hasOwnProperty("drmFamilies")) {
                    delete format.drmFamilies;
                }
            });
        }

        // Giữ lại tracking cơ bản để tránh lỗi đề xuất
        ["trackingParams", "eventId"].forEach(key => {
            if (!response[key]) response[key] = "safe-placeholder";
        });
    }

    $done({ body: JSON.stringify(response) });

} catch (e) {
    console.log("Lỗi chặn quảng cáo YouTube:", e);
    $done({});
}
