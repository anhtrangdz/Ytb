/**
 * yt_speed.js
 * Mục đích: Tối ưu tốc độ tải video YouTube bằng cách thay thế server video
 *            với danh sách server "nhanh" và cấu hình các tham số khác.
 *
 * Lưu ý:
 * - Đảm bảo file này được lưu trên GitHub và link raw chính xác.
 * - Script này được áp dụng cho endpoint có URL chứa "youtubei.googleapis.com/youtubei/v1/player".
 */

let response = JSON.parse($response.body);

// Danh sách các server ưu tiên (có thể điều chỉnh nếu cần)
const fastServers = [
  "r1---sn-ab5l6n76.googlevideo.com",
  "r2---sn-ab5szn7l.googlevideo.com",
  "r3---sn-ab5szn7e.googlevideo.com"
];

// Thay thế hostname trong URL của adaptiveFormats với một server nhanh được chọn ngẫu nhiên.
if (response.streamingData && Array.isArray(response.streamingData.adaptiveFormats)) {
  response.streamingData.adaptiveFormats.forEach(format => {
    if (format.url && format.url.includes("googlevideo.com")) {
      let newServer = fastServers[Math.floor(Math.random() * fastServers.length)];
      // Regex thay thế phần hostname dạng: r<number>---sn-<text>.googlevideo.com
      format.url = format.url.replace(/r\d+---sn-[a-z0-9]+\.googlevideo\.com/, newServer);
    }
  });
}

// Bỏ giới hạn bitrate để tăng tốc độ tải video (giá trị có thể điều chỉnh nếu cần)
if (response.streamingData && response.streamingData.maxBitrate) {
  response.streamingData.maxBitrate = 99999999;
}

// Tăng độ ưu tiên prefetch: giảm lag khi tua video
if (response.playerConfig && response.playerConfig.streaming) {
  response.playerConfig.streaming.bufferHealthMode = "aggressive";
}

// Xóa một số thông tin tracking để tăng quyền riêng tư (cẩn thận vì có thể ảnh hưởng đến đề xuất)
if (response.responseContext) {
  delete response.responseContext.serviceTrackingParams;
  delete response.responseContext.webResponseContextExtensionData;
}

// Hoàn thành và trả về phản hồi đã chỉnh sửa
$done({ body: JSON.stringify(response) });
