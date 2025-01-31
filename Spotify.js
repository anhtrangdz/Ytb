// 🚀 Spotify Premium Unlock Script for Shadowrocket 🚀
// 🔥 Chặn quảng cáo, Bỏ giới hạn Skip, Tua bài, Tắt Shuffle
// Created by: anhtrangdz (Optimized)

const url = $request.url;
let response = JSON.parse($response.body);

if (url.includes("api.spotify.com/v1/ads")) {
    // 🔥 Chặn quảng cáo
    $done({ body: JSON.stringify({}) });
} 
else if (url.includes("api.spotify.com/v1/me/player")) {
    // 🔥 Mở khóa tất cả tính năng Premium
    if (response.hasOwnProperty("actions")) {
        response.actions.disallows = {};  // Bỏ giới hạn skip
    }

    // 🔥 Cho phép tua bài hát (Seek Forward / Backward)
    if (response.hasOwnProperty("progress_ms")) {
        response.actions.disallows.seek = false;
    }

    // 🔥 Tắt chế độ trộn bài
    if (response.hasOwnProperty("shuffle_state")) {
        response.shuffle_state = false;
    }

    // 🔥 Bật Next / Previous Track
    response.actions.disallows["skipping_prev"] = false;
    response.actions.disallows["skipping_next"] = false;

    $done({ body: JSON.stringify(response) });
} 
else {
    $done({});
}
