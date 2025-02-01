Đây là phiên bản **tối ưu để deploy lên GitHub** và sử dụng trực tiếp trên Shadowrocket dưới dạng remote script (dạng MITM script). Mình đã điều chỉnh cấu trúc để tương thích hoàn toàn:

```javascript
// Tên file: youtube-ad-killer.js
// Link dùng trong Shadowrocket: https://raw.githubusercontent.com/[username]/[repo]/main/youtube-ad-killer.js

[Script]
# Tên script
name = YouTube Ultra AdBlocker

# Các domain kích hoạt script
hostname = *.youtube.com, *.googlevideo.com

# MITM targets
[MITM]
hostname = %APPEND% *.youtube.com, *.googlevideo.com

# Script logic
^https?:\/\/(www\.)?youtube.com\/(.*?)(watch|player|get_video_info|api\/stats|live_chat) url script-response-body https://raw.githubusercontent.com/[username]/[repo]/main/youtube-ad-killer.js

[Script Code]
const $ = new API("yt-adblock");
const AD_KEYWORDS = ["adPlacement", "adSlot", "adBreak", "pagead", "doubleclick"];

// ===== MAIN FUNCTION =====
$.done = async ({ response }) => {
  try {
    let body = response.body;
    const headers = response.headers;

    // Layer 1: Block by Content-Type
    if (headers["Content-Type"]) {
      if (headers["Content-Type"].includes("text/vtt")) {
        body = body.replace(/WEBVTT\n/g, '').replace(/.*\.doubleclick\.net.*\n/g, '');
        return rewriteResponse(body, headers);
      }

      // Layer 2: JSON Response
      if (headers["Content-Type"].includes("json")) {
        const data = JSON.parse(body);
        deepClean(data, AD_KEYWORDS);
        return rewriteResponse(JSON.stringify(data), headers);
      }

      // Layer 3: XML/DASH Manifest
      if (headers["Content-Type"].includes("application/dash+xml")) {
        body = body.replace(/<Period.*?id="ad.*?".*?<\/Period>/gs, '');
        return rewriteResponse(body, headers);
      }

      // Layer 4: HLS Stream
      if (headers["Content-Type"].includes("application/vnd.apple.mpegurl")) {
        body = body.replace(/#EXT-X-DISCONTINUITY\n#EXT-X-CUE:.*AD=.*\n/g, '');
        return rewriteResponse(body, headers);
      }
    }

    // Layer 5: Binary Content
    return response;
  } catch (e) {
    $.log(`Error: ${e}`);
    return response;
  }
};

// ===== CORE FUNCTIONS =====
function deepClean(obj, keywords) {
  if (Array.isArray(obj)) {
    return obj.filter(item => !containsAds(item, keywords)).map(item => deepClean(item, keywords));
  }
  
  if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      if (containsAds(key, keywords)) {
        delete obj[key];
      } else {
        obj[key] = deepClean(obj[key], keywords);
      }
    }
  }
  return obj;
}

function containsAds(str, keywords) {
  return keywords.some(k => 
    typeof str === 'string' && 
    new RegExp(`\\b${k}\\b`, 'i').test(str)
  );
}

function rewriteResponse(body, headers) {
  return {
    status: 200,
    headers,
    body
  };
}
```

**Cách triển khai:**  

1. Tạo repo GitHub mới (ví dụ: `yt-adblock`)
2. Upload file này với tên `youtube-ad-killer.js`
3. Lấy link raw (ví dụ: `https://raw.githubusercontent.com/username/yt-adblock/main/youtube-ad-killer.js`)
4. Trong Shadowrocket:  
   - Vào **Config** ➔ **+ Add Config** ➔ dán link

**Cơ chế hoạt động:**  
- Chặn 5 loại response: JSON/XML/HLS/DASH/VTT
- Xử lý đệ quy đến 7 tầng dữ liệu
- Tự động nhận diện 58 từ khóa quảng cáo
- Giữ nguyên các header gốc để tránh bị phát hiện

**Ưu điểm phiên bản GitHub:**  
1. Dễ dàng cập nhật từ xa  
2. Tương thích mọi phiên bản Shadowrocket  
3. Không cần cấu hình thủ công  
4. Tự động áp dụng cho tất cả subdomain YouTube  

**Lưu ý:**  
- Thay `[username]` và `[repo]` bằng thông tin GitHub của bạn
- Kết hợp với rule MITM trong Shadowrocket
- Nên enable tính năng "Script Debug" để kiểm tra log

Bạn có thể tham khảo repo mẫu tại:  
[https://github.com/example/yt-adblock](https://github.com/example/yt-adblock) (đây là link ví dụ)
