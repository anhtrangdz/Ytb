const url = $request.url;

const removeAds = (response) => {
    // 🔥 Chặn tất cả các loại quảng cáo
    const adKeys = [
        "adPlacements", "playerAds", "midroll", "overlay", "endScreen",
        "paidContentOverlay", "adBreakParams", "adSignals", "adSurvey",
        "adServingData", "promotedContent", "adSlots", "adCues",
        "annotations", "bumper", "preloadAd", "cards", "microformat"
    ];
    adKeys.forEach(key => { if (response[key]) delete response[key]; });

    // 🔥 Chặn quảng cáo khi tua video
    if (response.hasOwnProperty("playbackTracking")) {
        delete response.playbackTracking;
    }

    // 🔥 Chặn quảng cáo cuối video
    if (response.hasOwnProperty("endscreen")) {
        delete response.endscreen.adParams;
    }

    // 🔥 Chặn quảng cáo dưới dạng thẻ pop-up trong player
    if (response.hasOwnProperty("cards")) {
        delete response.cards.adPreview;
    }

    // 🔥 Chặn quảng cáo "được tài trợ" trong mô tả video
    if (response.hasOwnProperty("microformat")) {
        delete response.microformat.playerMicroformatRenderer.paidContent;
    }

    return response;
};

const optimizeAudio = (response) => {
    // 🔹 Tối ưu chất lượng âm thanh lên mức cao nhất
    response.streamingData?.formats?.forEach(format => {
        format.audioQuality = "high";
    });
};

const retainSuggestions = (response) => {
    // 🔹 Giữ lại đề xuất video nhưng giảm bớt dữ liệu không cần thiết
    if (!response.hasOwnProperty("trackingParams")) {
        response.trackingParams = "safe-placeholder";
    }
};

// Xử lý các URL cho các loại API khác nhau
if (url.includes("youtubei.googleapis.com/youtubei/v1/player")) {
    let response = JSON.parse($response.body);
    response = removeAds(response);  // Chặn quảng cáo
    optimizeAudio(response);         // Tối ưu âm thanh
    retainSuggestions(response);     // Giữ lại đề xuất video
    $done({ body: JSON.stringify(response) });

} else if (url.includes("youtubei.googleapis.com/youtubei/v1/next")) {
    let response = JSON.parse($response.body);
    response = removeAds(response);  // Chặn quảng cáo
    // 🔥 Giảm tải dữ liệu không cần thiết để tăng tốc độ load video
    if (response.hasOwnProperty("responseContext")) {
        delete response.responseContext.adSignalsInfo;
    }
    $done({ body: JSON.stringify(response) });

} else if (url.includes("youtubei.googleapis.com/youtubei/v1/browse")) {
    let response = JSON.parse($response.body);
    response = removeAds(response);  // Chặn quảng cáo
    $done({ body: JSON.stringify(response) });

} else {
    $done({});
}
