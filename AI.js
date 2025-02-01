let blockShorts = {
    "shorts": true,
    "shortsShelf": true,
    "shortsSection": true
};

// Chặn API liên quan đến Shorts
let urlsToBlock = [
    "youtube.com/youtubei/v1/browse", 
    "youtube.com/youtubei/v1/player"
];

// Chặn Shorts trong giao diện YouTube
let hideShortsElements = () => {
    let shortsSelectors = [
        "ytd-rich-section-renderer", // Shorts trên trang chủ
        "ytd-reel-shelf-renderer",   // Shorts trong kênh
        "ytd-reel-item-renderer",    // Shorts trong danh sách video
        "ytd-video-renderer:has(a[href*='/shorts/'])" // Shorts trong tìm kiếm
    ];
    
    shortsSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => el.remove());
    });
};

// Ưu tiên server nhanh hơn
let prioritizeFastServers = () => {
    let fastCDN = [
        "r2---sn-abcdefgh.googlevideo.com", 
        "r3---sn-ijklmnop.googlevideo.com"
    ];
    
    let videoElements = document.querySelectorAll("video");
    videoElements.forEach(video => {
        if (video.src.includes("googlevideo.com")) {
            let newSrc = video.src.replace(/r\d+---sn-[a-z0-9]+\.googlevideo\.com/, fastCDN[Math.floor(Math.random() * fastCDN.length)]);
            video.src = newSrc;
            video.load();
        }
    });
};

// Chạy script khi trang load
window.addEventListener("load", () => {
    hideShortsElements();
    prioritizeFastServers();
});

// Chạy script khi giao diện thay đổi (SPA YouTube)
let observer = new MutationObserver(() => {
    hideShortsElements();
    prioritizeFastServers();
});
observer.observe(document.body, { childList: true, subtree: true });
