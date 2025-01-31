// Spotify Ad Blocker, Unlimited Skip, Disable Shuffle & Seek Unlock for Shadowrocket
// Created by: anhtrangdz (Modified)

const url = $request.url;
const headers = $request.headers;
let response = JSON.parse($response.body);

if (url.includes("api.spotify.com/v1/ads")) {
    // 🔥 Chặn quảng cáo
    $done({ body: JSON.stringify({}) });
} 
else if (url.includes("api.spotify.com/v1/me/player")) {
    // 🔥 Bỏ qua giới hạn skip bài
    if (response.hasOwnProperty("actions")) {
        response.actions.disallows = {};
    }

    // 🔥 Bật tua bài hát (seek forward/backward)
    if (response.hasOwnProperty("progress_ms")) {
        response.actions.disallows.seek = false;
    }

    // 🔥 Tắt chế độ trộn bài
    if (response.hasOwnProperty("shuffle_state")) {
        response.shuffle_state = false;
    }

    $done({ body: JSON.stringify(response) });
} 
else {
    $done({});
}
