// YouTube Ad Blocker, Audio Optimization and Privacy Script for Shadowrocket
// Created by: anhtrangdz

const config = {
    enableDebug: false,
    scriptEngine: "jsc",
};

const url = $request.url;

if (url.includes("youtubei.googleapis.com/youtubei/v1/player")) {
    let response = JSON.parse($response.body);

    // Chặn tất cả các quảng cáo
    if (response.hasOwnProperty("adPlacements")) {
        response.adPlacements = [];
    }

    if (response.hasOwnProperty("playerAds")) {
        response.playerAds = [];
    }

    // Chặn các quảng cáo giữa video (midroll)
    if (response.hasOwnProperty("midroll")) {
        response.midroll = [];
    }

    // Tối ưu âm thanh
    if (response.hasOwnProperty("streamingData")) {
        response.streamingData.formats.forEach(format => {
            if (format.hasOwnProperty("audioQuality")) {
                // Tối ưu âm thanh ở chất lượng cao nhất có thể
                format.audioQuality = "high"; 
            }
        });
    }

    // Xóa hoặc ẩn bất kỳ thông tin nhận diện nào trong phản hồi để giảm khả năng bị phát hiện
    if (response.hasOwnProperty("videoDetails")) {
        delete response.videoDetails;
    }

    if (response.hasOwnProperty("playerConfig")) {
        delete response.playerConfig;
    }

    if (response.hasOwnProperty("adServingData")) {
        delete response.adServingData;
    }

    // Gửi phản hồi đã chỉnh sửa mà không chứa thông tin nhận diện
    $done({ body: JSON.stringify(response) });
} else {
    $done({});
}
