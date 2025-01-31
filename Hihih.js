// YouTube Ad Blocker & Performance Optimization Script for Shadowrocket
// Created by: anhtrangdz

const config = {
    enableDebug: false,
    scriptEngine: "jsc",
};

const url = $request.url;

if (url.includes("youtubei.googleapis.com/youtubei/v1/player")) {
    let response = JSON.parse($response.body);

    // 🔥 Chặn tất cả các loại quảng cáo (video, banner, overlay, midroll, preload ads, pop-up)
    const adKeys = [
        "adPlacements", "playerAds", "midroll", "overlay", "endScreen",
        "paidContentOverlay", "adServingData", "promotedContent", "adSlots",
        "adCues", "bumper", "preloadAd", "cards", "adBreakParams", "adSignals",
        "adSurvey", "annotations", "microformat", "paidContent", "adPreview"
    ];
    adKeys.forEach(key => { if (response[key]) delete response[key]; });

    // 🔹 Tối ưu chất lượng âm thanh lên mức cao nhất
    if (response.streamingData?.formats) {
        response.streamingData.formats.forEach(format => {
            format.audioQuality = "high";
        });
    }

    // 🔹 Giảm tải dữ liệu không cần thiết để tăng tốc độ load video
    delete response.streamingData?.dash;
    delete response.streamingData?.hls;

    // 🔥 Xóa các thông tin nhận diện để bảo mật và tránh bị phát hiện
    ["videoDetails", "playerConfig", "adServingData", "trackingParams"].forEach(key => {
        delete response[key];
    });

    $done({ body: JSON.stringify(response) });
}

// Chặn quảng cáo trên API "next" (video tiếp theo)
else if (url.includes("youtubei.googleapis.com/youtubei/v1/next")) {
    let response = JSON.parse($response.body);

    // 🔥 Chặn quảng cáo trong video tiếp theo
    ["adPlacements", "playerAds", "promotedContent"].forEach(key => {
        if (response[key]) delete response[key];
    });

    // 🔥 Giảm tải dữ liệu không cần thiết để tăng tốc độ load video
    delete response.responseContext?.adSignalsInfo;

    $done({ body: JSON.stringify(response) });
}

// Chặn quảng cáo trên giao diện duyệt video
else if (url.includes("youtubei.googleapis.com/youtubei/v1/browse")) {
    let response = JSON.parse($response.body);

    // 🔥 Chặn quảng cáo xuất hiện trên giao diện duyệt video
    if (response.contents) {
        delete response.contents.promotedContent;
    }

    $done({ body: JSON.stringify(response) });
}

else {
    $done({});
}
