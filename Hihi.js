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

    // 🔹 Tối ưu âm thanh
    response.streamingData?.formats?.forEach(format => {
        format.audioQuality = "high"; // Tối ưu âm thanh chất lượng cao
    });

    // 🔹 Giữ lại videoDetails nhưng loại bỏ thông tin không cần thiết
    if (response.hasOwnProperty("videoDetails")) {
        delete response.videoDetails.isLive;
        delete response.videoDetails.adPlacements;
    }

    // 🔹 Giữ lại thông tin tracking quan trọng để đề xuất video chính xác
    if (!response.hasOwnProperty("trackingParams")) {
        response.trackingParams = "safe-placeholder";
    }

    // 🔹 Giảm bớt các dữ liệu không cần thiết khác để tiết kiệm tài nguyên
    const unnecessaryKeys = ["annotations", "microformat"];
    unnecessaryKeys.forEach(key => { if (response[key]) delete response[key]; });

    $done({ body: JSON.stringify(response) });
}

// 🔹 Chặn quảng cáo trong API "next"
else if (url.includes("youtubei.googleapis.com/youtubei/v1/next")) {
    let response = JSON.parse($response.body);
    ["adPlacements", "playerAds", "promotedContent"].forEach(key => {
        if (response[key]) delete response[key];
    });

    // 🔹 Giảm tải dữ liệu không cần thiết để tăng tốc độ load
    if (response.hasOwnProperty("responseContext")) {
        delete response.responseContext.adSignalsInfo;
    }

    // Tối ưu các phần dữ liệu cần thiết
    if (response.hasOwnProperty("continuationItems")) {
        response.continuationItems = response.continuationItems.slice(0, 5); // Giảm số lượng tiếp tục video
    }

    // Tăng tốc độ tải trang bằng cách giảm các phản hồi dư thừa
    if (response.hasOwnProperty("contents")) {
        delete response.contents.ads;
        delete response.contents.shelves;
    }

    $done({ body: JSON.stringify(response) });
}

// 🔹 Chặn preload quảng cáo ẩn
else if (url.includes("youtubei.googleapis.com/youtubei/v1/watch")) {
    let response = JSON.parse($response.body);

    // Chặn quảng cáo tải trước video (preload)
    if (response.hasOwnProperty("preloadAd")) {
        delete response.preloadAd;
    }

    $done({ body: JSON.stringify(response) });
}

else {
    $done({});
}
p
