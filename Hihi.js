const url = $request.url;

if (url.includes("youtubei.googleapis.com/youtubei/v1/player")) {
    let response = JSON.parse($response.body);

    // 🔥 Chặn mọi loại quảng cáo (video, banner, overlay, midroll, pop-up, preload ads)
    const adKeys = [
        "adPlacements", "playerAds", "midroll", "overlay", "endScreen",
        "paidContentOverlay", "adBreakParams", "adSignals", "adSurvey",
        "adServingData", "promotedContent", "adSlots", "adCues",
        "annotations", "bumper", "preloadAd"
    ];
    adKeys.forEach(key => { if (response[key]) delete response[key]; });

    // 🔥 Chặn quảng cáo xuất hiện khi tua video
    delete response?.playbackTracking;

    // 🔥 Chặn quảng cáo màn hình kết thúc video
    delete response?.endscreen?.adParams;

    // 🔥 Chặn quảng cáo pop-up trong player
    delete response?.cards?.adPreview;

    // 🔥 Chặn quảng cáo tài trợ trong mô tả video
    delete response?.microformat?.playerMicroformatRenderer?.paidContent;

    // 🔥 Xử lý quảng cáo khi vừa bấm vào video (chặn tức thì)
    if (response.hasOwnProperty("playbackContext")) {
        delete response.playbackContext;
    }

    // 🔥 Tối ưu âm thanh (chọn chất lượng cao nhất)
    response?.streamingData?.formats?.forEach(format => {
        format.audioQuality = "high";
    });

    // 🔥 Giữ lại tính năng gợi ý video, giảm tải dữ liệu không cần thiết
    response.trackingParams = response.trackingParams || "safe-placeholder";

    // 🔥 Giảm thiểu rủi ro bị phát hiện
    if (response.hasOwnProperty("playerConfig")) {
        delete response.playerConfig;
    }
    if (response.hasOwnProperty("adServingData")) {
        delete response.adServingData;
    }

    // 🔥 Tối ưu lại phản hồi (xóa bớt dữ liệu không cần thiết)
    response = JSON.parse(JSON.stringify(response));

    // 🔥 Cập nhật phản hồi để thích nghi với thay đổi trong tương lai
    if (response.hasOwnProperty("playerAds")) {
        delete response.playerAds; // Đảm bảo luôn chặn quảng cáo liên tục
    }

    $done({ body: JSON.stringify(response) });
}

// 🔥 Chặn quảng cáo trong API "next" (video tiếp theo)
else if (url.includes("youtubei.googleapis.com/youtubei/v1/next")) {
    let response = JSON.parse($response.body);
    ["adPlacements", "playerAds", "promotedContent"].forEach(key => delete response[key]);

    // 🔥 Chặn banner quảng cáo trên trang chủ & kết quả tìm kiếm
    delete response?.contents?.promotedContent;

    // 🔥 Giảm tải dữ liệu phản hồi để tăng tốc độ load video
    delete response?.responseContext?.adSignalsInfo;

    // 🔥 Giảm thiểu khả năng bị phát hiện
    if (response.hasOwnProperty("playerConfig")) {
        delete response.playerConfig;
    }

    $done({ body: JSON.stringify(response) });
}

// 🔥 Chặn quảng cáo trên giao diện duyệt video
else if (url.includes("youtubei.googleapis.com/youtubei/v1/browse")) {
    let response = JSON.parse($response.body);
    delete response?.contents?.promotedContent;
    $done({ body: JSON.stringify(response) });
}

else {
    $done({});
}
