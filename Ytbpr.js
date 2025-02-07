let body = JSON.parse($response.body);

// Xóa quảng cáo (trong trang chủ + trong video)
if (body.adPlacements) body.adPlacements = [];
if (body.playerAds) body.playerAds = [];
if (body.responseContext?.mainAppWebResponseContext) {
  body.responseContext.mainAppWebResponseContext.adSlots = [];
}

// Đổi tiêu đề thành "YouTube Premium" (cái này cho vui thôi 🤣)
if (body.header?.c4TabbedHeaderRenderer) {
  body.header.c4TabbedHeaderRenderer.title = "YouTube Premium";
}

// Ép YouTube bật tính năng phát nhạc nền
if (body.streamingData?.adaptiveFormats) {
  body.streamingData.adaptiveFormats.forEach(format => {
    if (format.audioQuality) {
      format.audioOnly = true;  // Ép thành chế độ chỉ có âm thanh
    }
  });
}

$done({ body: JSON.stringify(body) });
