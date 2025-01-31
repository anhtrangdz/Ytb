const url = $request.url;

if (url.includes("youtubei.googleapis.com/youtubei/v1/player")) {
    let response = JSON.parse($response.body);

    // 🔹 Xóa toàn bộ quảng cáo (trước, giữa, sau, tua, pop-up, banner, overlay)
    const adKeys = [
        "adPlacements", "playerAds", "midroll", "overlay", "endScreen", 
        "paidContentOverlay", "adBreakParams", "adSignals", "adSurvey", 
        "adServingData", "promotedContent"
    ];
    adKeys.forEach(key => { if (response[key]) delete response[key]; });

    // 🔹 Xóa tracking & theo dõi người dùng (tránh bị phát hiện)
    const trackingKeys = ["playbackTracking", "annotations", "trackingParams", "eventId"];
    trackingKeys.forEach(key => { if (response[key]) delete response[key]; });

    // 🔹 Chặn quảng cáo trong UI (các banner đề xuất)
    if (response.hasOwnProperty("playerConfig")) {
        delete response.playerConfig.adBreakConfig;
    }

    // 🔹 Tối ưu chất lượng âm thanh
    response.streamingData?.formats?.forEach(format => {
        format.audioQuality = "high";
    });

    // 🔹 Giữ lại videoDetails nhưng loại bỏ thông tin không cần thiết
    if (response.hasOwnProperty("videoDetails")) {
        delete response.videoDetails.isLive;
        delete response.videoDetails.adPlacements;
        delete response.videoDetails.microformat;
    }

    // 🔹 Tăng tốc độ phát mặc định (tự động phát nhanh hơn)
    if (response.hasOwnProperty("playbackRate")) {
        response.playbackRate = 1.25; // Mặc định tăng tốc 1.25x
    }

    $done({ body: JSON.stringify(response) });
}

// 🔹 Chặn API quảng cáo khác từ YouTube
else if (url.includes("youtubei.googleapis.com/youtubei/v1/next")) {
    let response = JSON.parse($response.body);
    ["adPlacements", "playerAds", "promotedContent"].forEach(key => {
        if (response[key]) delete response[key];
    });
    $done({ body: JSON.stringify(response) });
}

// 🔹 Chặn API gợi ý quảng cáo trong Home & Search
else if (url.includes("youtubei.googleapis.com/youtubei/v1/browse")) {
    let response = JSON.parse($response.body);
    if (response.hasOwnProperty("contents")) {
        delete response.contents.promotedContent;
    }
    $done({ body: JSON.stringify(response) });
} 

else {
    $done({});
}

