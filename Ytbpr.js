let body = JSON.parse($response.body);

// Xóa quảng cáo (siêu gọn, siêu hiệu quả)
if (body.adPlacements) body.adPlacements = [];

// Đổi tiêu đề thành "YouTube Premium"
if (body.header?.c4TabbedHeaderRenderer) {
  body.header.c4TabbedHeaderRenderer.title = "YouTube Premium";
}

$done({ body: JSON.stringify(body) });
