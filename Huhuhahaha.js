// YouTube Ad Blocker, Audio Optimization, and Load Speed Optimization for Shadowrocket
// Created by: anhtrangdz

const url = $request.url;

if (url.includes("youtubei.googleapis.com/youtubei/v1/player")) {
    let response = JSON.parse($response.body);

    // 🔥 Chặn tất cả các quảng cáo
    if (response.hasOwnProperty("adPlacements")) {
        response.adPlacements = [];
    }

    if (response.hasOwnProperty("playerAds")) {
        response.playerAds = [];
    }

    // 🔥 Chặn các quảng cáo giữa video (midroll)
    if (response.hasOwnProperty("midroll")) {
        response.midroll = [];
    }

    // 🔥 Chặn preload ads (quảng cáo tải trước nhưng chưa hiển thị)
    if (response.hasOwnProperty("preloadAd")) {
        delete response.preloadAd;
    }

    // 🔥 Tối ưu âm thanh
    if (response.hasOwnProperty("streamingData")) {
        response.streamingData.formats.forEach(format => {
            if (format.hasOwnProperty("audioQuality")) {
                // Tối ưu âm thanh ở chất lượng cao nhất có thể
                format.audioQuality = "high"; 
            }
        });
    }

    // 🔥 Tối ưu tốc độ tải video - Giảm tải dữ liệu không cần thiết
    if (response.hasOwnProperty("videoDetails")) {
        delete response.videoDetails;
    }

    if (response.hasOwnProperty("playerConfig")) {
        delete response.playerConfig;
    }

    if (response.hasOwnProperty("adServingData")) {
        delete response.adServingData;
    }

    // 🔥 Giảm bớt dữ liệu liên quan đến đề xuất video
    if (response.hasOwnProperty("contents")) {
        delete response.contents;
    }

    // 🔥 Giảm bớt các trường không cần thiết trong phản hồi để tăng tốc độ tải video
    if (response.hasOwnProperty("responseContext")) {
        delete response.responseContext.adSignalsInfo;
    }

    // 🔥 Gửi phản hồi đã chỉnh sửa
    $done({ body: JSON.stringify(response) });
} else {
    $done({});
}
