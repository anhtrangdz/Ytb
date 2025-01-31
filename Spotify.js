// Spotify Ultimate Script for Shadowrocket
// Tích hợp bỏ giới hạn, tua bài, chặn quảng cáo, tắt shuffle, bật chất lượng cao
// Created by: anhtrangdz (Dựa trên script gốc nhưng mạnh hơn)

const url = $request.url;
const headers = $request.headers;
let response = JSON.parse($response.body);

if (url.includes("api.spotify.com/v1/ads")) {
    // 🔥 Chặn quảng cáo Spotify
    $done({ body: JSON.stringify({}) });
} 
else if (url.includes("api.spotify.com/v1/me/player")) {
    // 🔥 Bỏ giới hạn skip bài và tua bài
    if (response.hasOwnProperty("actions")) {
        response.actions.disallows = {};
    }
    // 🔥 Bật chất lượng âm thanh cao nhất
    if (response.hasOwnProperty("playback_features")) {
        response.playback_features.audio_quality = "HIGH";
    }
    $done({ body: JSON.stringify(response) });
} 
else if (url.includes("spclient.wg.spotify.com")) {
    // 🔥 Fake Premium bằng cách chỉnh quyền user
    if (response.hasOwnProperty("user")) {
        response.user.premium = true;
        response.user.product = "premium";
    }
    if (response.hasOwnProperty("account")) {
        response.account.type = "premium";
    }
    $done({ body: JSON.stringify(response) });
}
else {
    $done({});
}
