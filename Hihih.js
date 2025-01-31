// YouTube Ad Blocker - Enhanced Version

const url = $request.url;

if (url.includes("youtubei.googleapis.com/youtubei/v1/player")) {
    let response = JSON.parse($response.body);

    // 🔥 Chặn tất cả các loại quảng cáo (video, banner, overlay, midroll, preload ads, pop-up)
    const adKeys = [
        "adPlacements", "playerAds", "midroll", "overlay", "endScreen",
        "paidContentOverlay", "adServingData", "promotedContent", "adSlots",
        "adCues", "bumper", "preloadAd", "cards", "adBreakParams", "adSignals",
        "adSurvey", "annotations", "microformat", "paidContent", "adPreview",
        "adDetails", "sponsorAds"
    ];
    adKeys.forEach(key => { if (response[key]) delete response[key]; });

    // 🔥 Chặn các quảng cáo ẩn mà chưa hiển thị (preload)
    if (response.hasOwnProperty("preloadAd")) {
        delete response.preloadAd;
    }

    // 🔹 Tối ưu âm thanh và video
    response.streamingData?.formats?.forEach(format => {
        if (format.audioQuality !== "high") {
            format.audioQuality = "high";  // Tăng chất lượng âm thanh
        }
    });

    // 🔥 Xóa các thông tin không cần thiết
    ["videoDetails", "playerConfig", "adServingData", "trackingParams", "microformat"].forEach(key => {
        delete response[key];
    });

    $done({ body: JSON.stringify(response) });
}

// Chặn quảng cáo video tiếp theo
else if (url.includes("youtubei.googleapis.com/youtubei/v1/next")) {
    let response = JSON.parse($response.body);

    // 🔥 Chặn quảng cáo trong video tiếp theo
    ["adPlacements", "playerAds", "promotedContent"].forEach(key => {
        if (response[key]) delete response[key];
    });

    // 🔥 Giảm tải dữ liệu không cần thiết
    delete response.responseContext?.adSignalsInfo;

    $done({ body: JSON.stringify(response) });
}

// Chặn quảng cáo khi duyệt video
else if (url.includes("youtubei.googleapis.com/youtubei/v1/browse")) {
    let response = JSON.parse($response.body);

    // 🔥 Chặn quảng cáo trong giao diện duyệt video
    if (response.contents) {
        delete response.contents.promotedContent;
    }

    $done({ body: JSON.stringify(response) });
}

else {
    $done({});
}
