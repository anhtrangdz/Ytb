let body = JSON.parse($response.body);

// Xóa quảng cáo  
if (body.adPlacements) {
  body.adPlacements = [];
}

// Kích hoạt Premium  
if (body.responseContext) {
  body.responseContext.serviceTrackingParams = [
    {
      service: "GUIDED_HELP",
      params: [{ key: "isPremium", value: "true" }]
    }
  ];
}

// Đổi tiêu đề trang thành "YouTube Premium"
if (body.header && body.header.c4TabbedHeaderRenderer) {
  body.header.c4TabbedHeaderRenderer.title = "YouTube Premium"; 
}

$done({ body: JSON.stringify(body) });
