const url = $request.url;

if (url.includes("youtubei.googleapis.com/youtubei/v1/player")) {
    let response = JSON.parse($response.body);

    // 🔥 Chặn tất cả các loại quảng cáo (video, banner, overlay, midroll, pop-up, preload ads)
    const adKeys = [
        "adPlacements", "playerAds", "midroll", "overlay", "endScreen",
        "paidContentOverlay", "adBreakParams", "adSignals", "adSurvey",
        "adServingData", "promotedContent", "adSlots", "adCues",
        "annotations", "bumper"
    ];
    adKeys.forEach(key => { if (response[key]) delete response[key]; });

    // 🔥 Chặn quảng cáo xuất hiện khi tua video
    if (response.hasOwnProperty("playbackTracking")) {
        delete response.playbackTracking;
    }

    // 🔥 Chặn quảng cáo trong màn hình kết thúc video
    if (response.hasOwnProperty("endscreen")) {
        delete response.endscreen.adParams;
    }

    // 🔥 Chặn quảng cáo tải trước nhưng chưa hiển thị (preload ads)
    if (response.hasOwnProperty("preloadAd")) {
        delete response.preloadAd;
    }

    // 🔥 Chặn quảng cáo xuất hiện dưới dạng thẻ pop-up trong player
    if (response.hasOwnProperty("cards")) {
        delete response.cards.adPreview;
    }

    // 🔥 Chặn quảng cáo "được tài trợ" xuất hiện trong mô tả video
    if (response.hasOwnProperty("microformat")) {
        delete response.microformat.playerMicroformatRenderer.paidContent;
    }

    // 🔹 Tối ưu chất lượng âm thanh lên mức cao nhất
    response.streamingData?.formats?.forEach(format => {
        format.audioQuality = "high";
    });

    // 🔹 Giữ lại đề xuất video nhưng giảm bớt dữ liệu không cần thiết
    if (!response.hasOwnProperty("trackingParams")) {
        response.trackingParams = "safe-placeholder";
    }

    $done({ body: JSON.stringify(response) });
}

// 🔥 Chặn quảng cáo trong API "next" (video tiếp theo)
else if (url.includes("youtubei.googleapis.com/youtubei/v1/next")) {
    let response = JSON.parse($response.body);
    ["adPlacements", "playerAds", "promotedContent"].forEach(key => {
        if (response[key]) delete response[key];
    });

    // 🔥 Chặn quảng cáo dạng banner xuất hiện trên trang chủ & kết quả tìm kiếm
    if (response.hasOwnProperty("contents")) {
        delete response.contents.promotedContent;
    }

    // 🔹 Giảm tải dữ liệu không cần thiết để tăng tốc độ load video
    if (response.hasOwnProperty("responseContext")) {
        delete response.responseContext.adSignalsInfo;
    }

    $done({ body: JSON.stringify(response) });
}

// 🔥 Chặn quảng cáo xuất hiện trên giao diện duyệt video
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

