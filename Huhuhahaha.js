const url = $request.url;

try {
    let response = JSON.parse($response.body);

    if (url.includes("youtubei.googleapis.com/")) {
        // 🔹 Xóa tất cả các quảng cáo xuất hiện trên YouTube
        const adKeys = [
            "adPlacements", "playerAds", "midroll", "overlay", "endScreen",
            "paidContentOverlay", "adBreakParams", "adSignals", "adSurvey",
            "adServingData", "promotedContent", "cards", "bumper", "adSlots",
            "inVideoPromotion", "promoConfig", "playerOverlay"
        ];
        adKeys.forEach(key => delete response[key]);

        // 🔹 Đảm bảo xóa quảng cáo ngay từ gốc
        response.adPlacements = [];
        response.playerAds = [];
        response.adBreakParams = {};
        response.adSignals = {};
        response.adServingData = {};
        response.promoConfig = {};

        // 🔹 Ngăn quảng cáo xuất hiện khi mở app
        if (url.includes("/v1/player") || url.includes("/v1/watch")) {
            response.adPlacements = [];
            response.playerAds = [];
            response.adBreakParams = {};
            response.adSignals = {};
        }

        // 🔹 Chặn quảng cáo trong danh sách phát & trang chủ
        if (url.includes("/v1/next") || url.includes("/v1/browse")) {
            ["adPlacements", "playerAds", "promotedContent"].forEach(key => delete response[key]);
            if (response.contents) {
                delete response.contents.promotedContent;
            }
        }

        // 🔹 Chặn quảng cáo trong thanh bên & đề xuất
        if (url.includes("/v1/guide")) {
            if (response.items) {
                response.items = response.items.filter(item => !item.hasOwnProperty("adSlotRenderer"));
            }
        }

        // 🔹 Giữ lại đề xuất hợp lý, tránh YouTube hiển thị nội dung sai lệch
        if (!response.contents) {
            response.contents = { "safe-placeholder": true };
        }

        // 🔹 Tăng chất lượng âm thanh & video tối đa
        if (response.streamingData?.formats) {
            response.streamingData.formats.forEach(format => {
                format.audioQuality = "high";
                if (format.hasOwnProperty("drmFamilies")) {
                    delete format.drmFamilies; // Tránh hạn chế DRM
                }
            });
        }

        // 🔹 Giữ lại tracking cơ bản để tránh lỗi đề xuất
        const safeTrackingKeys = ["trackingParams", "eventId"];
        safeTrackingKeys.forEach(key => {
            if (!response[key]) response[key] = "safe-placeholder";
        });
    }

    $done({ body: JSON.stringify(response) });

} catch (e) {
    console.log("🔥 Lỗi chặn quảng cáo YouTube:", e);
    $done({});
}
