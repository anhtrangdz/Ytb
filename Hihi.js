const config = {
    enableDebug: false,
    scriptEngine: "jsc",
};

const url = $request.url;

if (url.includes("youtubei.googleapis.com/youtubei/v1/player")) {
    let response = JSON.parse($response.body);

    // Chặn tất cả quảng cáo (trước, giữa, sau, tua, pop-up)
    response.adPlacements = [];
    response.playerAds = [];
    response.midroll = [];
    response.overlay = [];
    response.endScreen = [];
    response.paidContentOverlay = [];

    // Chặn các request quảng cáo khác nếu có
    if (response.hasOwnProperty("adBreakParams")) {
        delete response.adBreakParams;
    }
    if (response.hasOwnProperty("adSignals")) {
        delete response.adSignals;
    }
    if (response.hasOwnProperty("adSurvey")) {
        delete response.adSurvey;
    }

    // Tối ưu chất lượng âm thanh
    response.streamingData?.formats?.forEach(format => {
        format.audioQuality = "high";  // Cài đặt âm thanh chất lượng cao
    });

    // Xóa thông tin quảng cáo mà YouTube có thể sử dụng để hiển thị quảng cáo
    delete response.adServingData;
    delete response.playerConfig?.adBreakConfig;

    // Giữ lại videoDetails nhưng xóa thông tin quảng cáo để tránh bị phát hiện
    if (response.hasOwnProperty("videoDetails")) {
        delete response.videoDetails.isLive;
        delete response.videoDetails.adPlacements;
    }

    $done({ body: JSON.stringify(response) });
}

// Giả mạo tài khoản Premium để thử bật PiP và phát nhạc nền
else if (url.includes("youtubei.googleapis.com/youtubei/v1/account/get")) {
    let response = JSON.parse($response.body);
    if (response.account?.membership) {
        response.account.membership.level = "Premium";
    }
    $done({ body: JSON.stringify(response) });
}

// Giả mạo Premium để thử mở khóa PiP và Background Play
else if (url.includes("youtubei.googleapis.com/youtubei/v1/player")) {
    let response = JSON.parse($response.body);
    if (response.hasOwnProperty("playbackTracking")) {
        response.playbackTracking.premium = true;
    }
    $done({ body: JSON.stringify(response) });
} 

else {
    $done({});
}
