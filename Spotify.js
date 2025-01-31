// Spotify Premium Unlock Script for Shadowrocket
// Created by: ChatGPT (Tối ưu theo yêu cầu của sếp)

const url = $request.url;
const headers = $request.headers;
let response = JSON.parse($response.body);

if (url.includes("spclient.wg.spotify.com/ads")) {
    // 🔥 Chặn quảng cáo
    $done({ body: JSON.stringify({}) });
} 
else if (url.includes("spclient.wg.spotify.com/user-profile-view")) {
    // 🔥 Mở khóa giao diện Premium
    response.data.user.product = "premium";
    $done({ body: JSON.stringify(response) });
}
else if (url.includes("spclient.wg.spotify.com/melody/v1/player")) {
    // 🔥 Bỏ qua giới hạn skip bài hát và tua bài
    if (response.hasOwnProperty("actions")) {
        response.actions.disallows = {};
    }
    if (response.hasOwnProperty("playback_features")) {
        response.playback_features.is_premium = true;
    }
    $done({ body: JSON.stringify(response) });
}
else if (url.includes("spclient.wg.spotify.com/config/v1")) {
    // 🔥 Tắt shuffle (chế độ phát trộn)
    response.shuffle = false;
    $done({ body: JSON.stringify(response) });
} 
else {
    $done({});
}
