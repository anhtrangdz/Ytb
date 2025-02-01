const url = $request.url;

function removeAdKeys(obj) {
    // Nếu obj không phải là object thì return
    if (typeof obj !== 'object' || obj === null) return;

    // Duyệt tất cả các key trong obj
    Object.keys(obj).forEach(key => {
        // Nếu key chứa "ad" (không phân biệt chữ hoa thường) hoặc nằm trong danh sách cụ thể, thì xóa nó
        if (/(adPlacements|playerAds|promotedContent|adBreakParams|adSignals|adSurvey|adServingData|cards|bumper|inVideoPromotion|promoConfig|playerOverlay|midroll|endScreen|overlay|paidContentOverlay|advertiser|adSlotRenderer|adOrder|adInfoRenderer|adPlacementConfig|playerAdvertiser|sponsorInfoRenderer)/i.test(key)) {
            delete obj[key];
        } else {
            // Nếu key không phải là key quảng cáo, kiểm tra nếu giá trị là object hoặc mảng thì đệ quy
            removeAdKeys(obj[key]);
        }
    });
}

try {
    let response = JSON.parse($response.body);

    if (url.includes("youtubei.googleapis.com/")) {
        // Xóa quảng cáo ở tất cả cấp: đệ quy toàn bộ đối tượng
        removeAdKeys(response);

        // Đảm bảo các key quảng cáo ở cấp cao bị xóa/đặt rỗng
        response.adPlacements = [];
        response.playerAds = [];
        response.adServingData = {};
        response.adBreakParams = {};
        response.promoConfig = {};

        // Chặn quảng cáo giữa video khi tua
        if (response.playbackTracking && response.playbackTracking.adBreak) {
            delete response.playbackTracking.adBreak;
        }

        // Chặn quảng cáo trong danh sách phát, trang chủ, đề xuất (xử lý trường hợp nội dung quảng cáo nằm trong contents)
        if (url.includes("/v1/next") || url.includes("/v1/browse")) {
            if (response.contents) {
                // Nếu contents là object có cấu trúc phức tạp, bạn có thể duyệt qua các tab/section
                Object.keys(response.contents).forEach(key => {
                    removeAdKeys(response.contents[key]);
                });
            }
        }

        // Chặn quảng cáo trong thanh bên
        if (url.includes("/v1/guide") && response.items) {
            response.items = response.items.filter(item => !item.hasOwnProperty("adSlotRenderer"));
        }

        // Chặn quảng cáo trong lịch sử tìm kiếm
        if (url.includes("/v1/search")) {
            response.estimatedResults = "0";
        }

        // Chặn quảng cáo ẩn trong request log_event
        if (url.includes("/v1/log_event")) {
            response = {};
        }

        // Ngăn YouTube lưu cache quảng cáo
        response.cacheControl = "no-store, no-cache, must-revalidate, proxy-revalidate";
        response.pragma = "no-cache";
        response.expires = "0";

        // Tối ưu âm thanh (chất lượng cao nhất)
        if (response.streamingData && Array.isArray(response.streamingData.formats)) {
            response.streamingData.formats.forEach(format => {
                format.audioQuality = "high";
                if (format.hasOwnProperty("drmFamilies")) {
                    delete format.drmFamilies;
                }
            });
        }

        // Giữ lại tracking cơ bản để tránh lỗi đề xuất
        ["trackingParams", "eventId"].forEach(key => {
            if (!response[key]) response[key] = "safe-placeholder";
        });

        // Xóa hoặc ẩn thông tin nhận diện có thể gây phát hiện (lưu ý: điều này có thể ảnh hưởng đến trải nghiệm người dùng)
        ["videoDetails", "playerConfig"].forEach(key => {
            if (response.hasOwnProperty(key)) {
                delete response[key];
            }
        });

        $done({ body: JSON.stringify(response) });
    } else {
        $done({});
    }
} catch (e) {
    console.log("Lỗi chặn quảng cáo YouTube:", e);
    $done({});
}
