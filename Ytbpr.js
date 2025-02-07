let body = JSON.parse($response.body);

// Xóa quảng cáo trên trang chính & trong video
if (body.adPlacements) body.adPlacements = [];
if (body.playerAds) body.playerAds = [];
if (body.responseContext?.mainAppWebResponseContext) {
  body.responseContext.mainAppWebResponseContext.adSlots = [];
}

// Đổi tiêu đề thành "YouTube Premium"
if (body.header?.c4TabbedHeaderRenderer) {
  body.header.c4TabbedHeaderRenderer.title = "YouTube Premium";
}
if (body.metadata?.channelMetadataRenderer) {
  body.metadata.channelMetadataRenderer.title = "YouTube Premium";
}

$done({ body: JSON.stringify(body) });
