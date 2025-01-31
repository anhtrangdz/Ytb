const url = $request.url;

try {
    let response = JSON.parse($response.body);

    if (url.includes("youtubei.googleapis.com/youtubei/v1/player")) {
        // 🔹 Loại bỏ tất cả quảng cáo trong video
        const adKeys = [
            "adPlacements", "playerAds", "midroll", "overlay", "endScreen",
            "paidContentOverlay", "adBreakParams", "adSignals", "adSurvey",
            "adServingData", "promotedContent", "cards", "bumper"
        ];
        adKeys.forEach(key => delete response[key]);

        // 🔹 Xóa các đoạn quảng cáo trong video
        if (response.adPlacements) response.adPlacements = [];
        if (response.playerAds) response.playerAds = [];

        // 🔹 Ngăn YouTube tải thêm quảng cáo
        response.adPlacements = [];
        response.playerAds = [];
        response.adBreakParams = {};
        response.adSignals = {};

        // 🔹 Tăng chất lượng video & âm thanh
        if (response.streamingData?.formats) {
            response.streamingData.formats.forEach(format => {
                format.audioQuality = "high";
            });
        }

        // 🔹 Giữ lại tracking cơ bản để tránh lỗi đề xuất
        const safeTrackingKeys = ["trackingParams", "eventId"];
        safeTrackingKeys.forEach(key => {
            if (!response[key]) response[key] = "safe-placeholder";
        });

        // 🔹 Xóa thông tin quảng cáo trong videoDetails
        if (response.videoDetails) {
            delete response.videoDetails.adPlacements;
            delete response.videoDetails.isLive;
        }

    } else if (url.includes("youtubei.googleapis.com/youtubei/v1/next")) {
        // 🔹 Xóa quảng cáo trong danh sách video kế tiếp
        ["adPlacements", "playerAds", "promotedContent"].forEach(key => delete response[key]);

        // 🔹 Tránh đề xuất nội dung bừa bãi
        if (!response.contents) {
            response.contents = { "safe-placeholder": true };
        }

    } else if (url.includes("youtubei.googleapis.com/youtubei/v1/browse")) {
        // 🔹 Xóa quảng cáo nhưng giữ lại nội dung trang chủ YouTube
        if (response.contents) {
            delete response.contents.promotedContent;
        }

    } else if (url.includes("youtubei.googleapis.com/youtubei/v1/guide")) {
        // 🔹 Xóa quảng cáo trong thanh bên YouTube
        if (response.items) {
            response.items = response.items.filter(item => !item.hasOwnProperty("adSlotRenderer"));
        }
    }

    $done({ body: JSON.stringify(response) });

} catch (e) {
    console.log("🔥 Lỗi chặn quảng cáo YouTube:", e);
    $done({});
}
