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
    
    // Bật tính năng phát nền (background playback)
    if (response.hasOwnProperty("playbackTracking")) {
        response.playbackTracking = {};
    }

    // Thêm hỗ trợ phát âm thanh trong nền
    if (response.hasOwnProperty("playback")) {
        response.playback.audioOnly = true; // Cho phép phát âm thanh khi không có video
    }

    // Thêm hỗ trợ PIP (Picture in Picture)
    if (response.hasOwnProperty("playbackControls")) {
        response.playbackControls.enablePip = true; // Cho phép bật chế độ PIP
    }

    // Chặn quảng cáo
    if (response.hasOwnProperty("adPlacements")) {
        response.adPlacements = [];
    }

    // Chặn midroll ads (quảng cáo giữa video)
    if (response.hasOwnProperty("playerAds")) {
        response.playerAds = [];
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

    // Gửi phản hồi
    $done({ body: JSON.stringify(response) });
} else {
    $done({});
}
