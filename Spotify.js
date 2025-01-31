// Spotify Ad Blocker & Unlimited Skip Script for Shadowrocket
// Created by: anhtrangdz

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
    $done({ body: JSON.stringify(response) });
} 
else {
    $done({});
}
