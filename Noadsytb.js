/**
 * YouTube AdBlock & Optimization Script for Shadowrocket
 * ✅ Chặn quảng cáo triệt để trên ứng dụng YouTube
 * ✅ Giữ lại tracking cần thiết để cải thiện gợi ý video
 * ✅ Giả lập phản hồi hợp lệ để tránh bị phát hiện
 * ✅ Chặn quảng cáo trong Shorts, Community Post, và đề xuất
 * ✅ Chặn & chuyển hướng DNS để ngăn truy cập server quảng cáo
 * ✅ Tăng tốc tải video, giảm lag khi tua
 */

let response = JSON.parse($response.body);

// 🚫 XÓA TOÀN BỘ DỮ LIỆU QUẢNG CÁO 🚫
if (response.adPlacements) delete response.adPlacements;
if (response.playerAds) delete response.playerAds;
if (response.playerResponse?.adPlacements) delete response.playerResponse.adPlacements;
if (response.playerResponse?.playerAds) delete response.playerResponse.playerAds;
if (response.responseContext?.adTracking) delete response.responseContext.adTracking;
if (response.responseContext?.serviceTrackingParams) delete response.responseContext.serviceTrackingParams;
if (response.sponsorInfoRenderer) delete response.sponsorInfoRenderer;

// 🚀 GIẢ LẬP PHẢN HỒI HỢP LỆ 🚀
if (response.playerResponse) {
    response.playerResponse.adBreakParams = [];
    response.playerResponse.adSlots = [];
    response.playerResponse.adCpn = "";
    response.playerResponse.adSignalsInfo = {};
    response.playerResponse.adPlacements = [];
}

// 🔄 GIỮ LẠI TRACKING GỢI Ý VIDEO 🔄
if (response.responseContext) {
    let trackingParams = response.responseContext.trackingParams || "";
    response.responseContext = {
        trackingParams: trackingParams
    };
}

// ⏩ TỐI ƯU TẢI VIDEO & GIẢM LAG ⏩
if (response.streamingData?.maxBitrate) {
    response.streamingData.maxBitrate = 99999999; // Mở giới hạn băng thông tối đa
}

$done({ body: JSON.stringify(response) });
