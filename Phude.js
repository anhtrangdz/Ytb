(function () {
    function disableAutoCaptions() {
        let videoElement = document.querySelector('video');
        if (videoElement) {
            videoElement.removeAttribute('cc'); // Xóa thuộc tính phụ đề tự động
            let tracks = videoElement.textTracks;
            for (let i = 0; i < tracks.length; i++) {
                tracks[i].mode = 'disabled'; // Vô hiệu hóa tất cả phụ đề
            }
        }
    }

    // Tắt phụ đề khi trang tải xong
    window.addEventListener("load", disableAutoCaptions);

    // Tắt phụ đề khi chuyển video
    document.addEventListener("yt-navigate-finish", disableAutoCaptions);
})();
