// YouTube Ad Blocker, Audio Optimization, Privacy, PiP & Background Audio Script for Shadowrocket
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

    // Giả lập PiP và Phát Nhạc Nền
    if (response.hasOwnProperty("videoDetails")) {
        // Giả lập PiP: Kích hoạt PiP khi video có thể được phát trong chế độ PiP
        response.videoDetails.player_response = {
            ...response.videoDetails.player_response,
            playerAds: [],  // Xóa quảng cáo có thể làm gián đoạn PiP
            playInBackground: true,  // Giả lập chức năng phát nhạc nền
        };
    }

    // Gửi phản hồi đã chỉnh sửa mà không chứa thông tin nhận diện
    $done({ body: JSON.stringify(response) });
} else {
    $done({});
}
