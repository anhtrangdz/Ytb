const url = $request.url;

if (url.includes("youtubei.googleapis.com/youtubei/v1/player")) {
    let response = JSON.parse($response.body);

    // 🔹 Chặn quảng cáo (trước, giữa, sau video, khi tua, banner, overlay)
    const adKeys = [
        "adPlacements", "playerAds", "midroll", "overlay", "endScreen",
        "paidContentOverlay", "adBreakParams", "adSignals", "adSurvey",
        "adServingData", "promotedContent"
    ];
    adKeys.forEach(key => { if (response[key]) delete response[key]; });

    // 🔹 Giữ lại tracking cơ bản để tránh hiển thị đề xuất vớ vẩn
    const safeTrackingKeys = ["trackingParams", "eventId"];
    safeTrackingKeys.forEach(key => { if (!response[key]) response[key] = "safe-placeholder"; });

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
    }

    // 🔹 KHÔNG xóa `microformat` để tránh YouTube hiển thị đề xuất lung tung
    $done({ body: JSON.stringify(response) });
}

// 🔹 Chặn quảng cáo nhưng giữ lại đề xuất trong API "next"
else if (url.includes("youtubei.googleapis.com/youtubei/v1/next")) {
    let response = JSON.parse($response.body);
    ["adPlacements", "playerAds", "promotedContent"].forEach(key => {
        if (response[key]) delete response[key];
    });

    // 🔹 Giữ lại nội dung video được đề xuất để không hiển thị bừa bãi
    if (!response.hasOwnProperty("contents")) {
        response.contents = { "safe-placeholder": true };
    }
    
    $done({ body: JSON.stringify(response) });
}

// 🔹 Chặn quảng cáo nhưng giữ lại trang chủ YouTube không bị lỗi
else if (url.includes("youtubei.googleapis.com/youtubei/v1/browse")) {
    let response = JSON.parse($response.body);
    
    // 🔹 Xóa quảng cáo nhưng giữ lại nội dung đề xuất
    if (response.hasOwnProperty("contents")) {
        delete response.contents.promotedContent;
    }

    $done({ body: JSON.stringify(response) });
} 

else {
    $done({});
}
