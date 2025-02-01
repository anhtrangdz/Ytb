let response = JSON.parse($response.body);

// Loại bỏ Shorts từ API phản hồi
if (response.contents) {
    let newContents = response.contents.twoColumnBrowseResultsRenderer.tabs;
    newContents = newContents.filter(tab => !tab.tabRenderer.content?.sectionListRenderer?.contents?.some(
        content => content.reelShelfRenderer || content.reelItemRenderer
    ));
    response.contents.twoColumnBrowseResultsRenderer.tabs = newContents;
}

// Xóa Shorts trong danh sách video
if (response.onResponseReceivedActions) {
    response.onResponseReceivedActions.forEach(action => {
        if (action.appendContinuationItemsAction) {
            action.appendContinuationItemsAction.continuationItems = action.appendContinuationItemsAction.continuationItems.filter(
                item => !item.reelItemRenderer && !item.reelShelfRenderer
            );
        }
    });
}

// Xóa Shorts trong kết quả tìm kiếm
if (response.contents?.sectionListRenderer?.contents) {
    response.contents.sectionListRenderer.contents = response.contents.sectionListRenderer.contents.filter(
        content => !content.reelShelfRenderer
    );
}

// Tăng tốc tải video bằng DNS nhanh hơn
const fastDNS = [
    "8.8.8.8", // Google DNS
    "1.1.1.1", // Cloudflare DNS
    "9.9.9.9"  // Quad9 DNS
];

$done({ body: JSON.stringify(response), dns: fastDNS[Math.floor(Math.random() * fastDNS.length)] });
