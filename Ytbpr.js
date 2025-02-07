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

$done({ body: JSON.stringify(body) });
