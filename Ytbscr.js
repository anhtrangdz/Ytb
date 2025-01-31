// YouTube Premium Unlock Script for Shadowrocket
// Created by: anhtrangdz

const config = {
    hideDownloadButton: true,
    hideClipButton: true,
    subtitleLanguage: "vi",
    lyricsLanguage: "vi",
    scriptEngine: "jsc",
    enableDebug: false,
};

const url = $request.url;
const method = $request.method;

if (url.includes("youtubei.googleapis.com/youtubei/v1/player")) {
    let response = JSON.parse($response.body);
    
    // Chặn quảng cáo
    if (response.hasOwnProperty("adPlacements")) {
        response.adPlacements = [];
    }
    
    // Chặn midroll ads (quảng cáo giữa video)
    if (response.hasOwnProperty("playerAds")) {
        response.playerAds = [];
    }

    // Bật tính năng phát nền (background playback)
    if (response.hasOwnProperty("playbackTracking")) {
        response.playbackTracking = {}; // Giữ thông tin về tiến trình phát video
    }

    // Phát âm thanh trong nền (audio-only mode)
    if (response.hasOwnProperty("playback")) {
        response.playback.audioOnly = true;  // Cho phép phát âm thanh khi không có video
    }

    // Bật chế độ Picture-in-Picture (PIP)
    if (response.hasOwnProperty("playbackControls")) {
        response.playbackControls.enablePip = true;  // Cho phép bật chế độ PIP
    }

    // Tối ưu phụ đề và lời bài hát
    if (config.subtitleLanguage !== "off") {
        response.captions = {
            language: config.subtitleLanguage
        };
    }
    if (config.lyricsLanguage !== "off") {
        response.lyrics = {
            language: config.lyricsLanguage
        };
    }
    
    // Gửi phản hồi đã chỉnh sửa
    $done({ body: JSON.stringify(response) });
} else {
    $done({});
}
