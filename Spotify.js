// Spotify Premium Unlock Script for Shadowrocket
// Kết hợp từ spotify-json.js và spotify-proto.js
// Tính năng: Bỏ quảng cáo, mở khóa tua bài, bỏ shuffle, skip không giới hạn

const url = $request.url;
let response = JSON.parse($response.body);

if (url.includes("spclient.wg.spotify.com/artistview/v1/artist") || url.includes("album-entity-view/v2/album")) {
    // Giả lập thiết bị iPad
    let modifiedUrl = url.replace(/platform=iphone/, 'platform=ipad');
    $done({ url: modifiedUrl });
}

else if (url.includes("spclient.wg.spotify.com/bootstrap/v1/bootstrap") || url.includes("user-customization-service/v1/customize")) {
    // Can thiệp vào giao thức để bật tính năng Premium
    if (response.hasOwnProperty("actions")) {
        response.actions.disallows = {};
    }
    if (response.hasOwnProperty("account") && response.account.hasOwnProperty("type")) {
        response.account.type = "premium";
    }
    if (response.hasOwnProperty("user")) {
        response.user.premium = true;
    }
    $done({ body: JSON.stringify(response) });
}

else {
    $done({});
}
p
