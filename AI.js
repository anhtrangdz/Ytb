// youtube-ai.js
const aiSupport = (response) => {
  try {
    // Parse JSON từ phản hồi
    let data = JSON.parse(response.body);

    // Chặn quảng cáo thông minh
    if (data.adPlacements) {
      data.adPlacements = [];
    }

    // Tối ưu hóa trải nghiệm
    if (data.playbackContext) {
      data.playbackContext.musicConfig.isBackgroundPlaybackEnabled = true;
      data.playbackContext.videoConfig.isAutoPlayEnabled = true;
    }

    // Trả về JSON đã chỉnh sửa
    response.body = JSON.stringify(data);
  } catch (error) {
    console.error("Error applying AI support:", error);
  }

  return response;
};

// Xử lý yêu cầu
$done(aiSupport($response));
