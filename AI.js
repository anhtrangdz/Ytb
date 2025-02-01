let response = JSON.parse($response.body);

// ⚡ ƯU TIÊN SERVER NHANH NHẤT ⚡
const fastServers = [
    "r1---sn-ab5l6n76.googlevideo.com",
    "r2---sn-ab5szn7l.googlevideo.com",
    "r3---sn-ab5szn7e.googlevideo.com"
];

// Thay thế server video bằng server nhanh nhất
if (response.streamingData?.adaptiveFormats) {
    response.streamingData.adaptiveFormats.forEach(format => {
        if (format.url.includes("googlevideo.com")) {
            let newServer = fastServers[Math.floor(Math.random() * fastServers.length)];
            format.url = format.url.replace(/r\d+---sn-[a-z0-9]+\.googlevideo\.com/, newServer);
        }
    });
}

// ⏩ BỎ GIỚI HẠN BUFFERING (TẢI VIDEO NHANH HƠN) ⏩
if (response.streamingData?.maxBitrate) {
    response.streamingData.maxBitrate = 99999999; // Mở giới hạn băng thông tối đa
}

// 🔄 TĂNG ĐỘ ƯU TIÊN PREFETCH 🔄
if (response.playerConfig) {
    response.playerConfig.streaming?.bufferHealthMode = "aggressive"; // Giảm lag khi tua video
}

// 🔒 CHẶN TRACKING, TĂNG QUYỀN RIÊNG TƯ 🔒
if (response.responseContext) {
    delete response.responseContext.serviceTrackingParams;
    delete response.responseContext.webResponseContextExtensionData;
}

$done({ body: JSON.stringify(response) });
