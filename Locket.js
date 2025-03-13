// Locket Gold Premium + Gold Badge Unlocker for Shadowrocket
let obj = JSON.parse($response.body);

if (obj.subscriber) {
    // Kích hoạt Premium
    obj.subscriber.entitlements = {
        "gold": {
            "expires_date": "2099-12-31T23:59:59Z",
            "product_identifier": "locket_gold_yearly",
            "purchase_date": "2024-01-01T00:00:00Z"
        }
    };
    obj.subscriber.subscriptions = {
        "locket_gold_yearly": {
            "billing_issues_detected_at": null,
            "expires_date": "2099-12-31T23:59:59Z",
            "is_sandbox": false,
            "original_purchase_date": "2024-01-01T00:00:00Z",
            "ownership_type": "PURCHASED",
            "period_type": "normal",
            "store": "app_store",
            "unsubscribe_detected_at": null
        }
    };

    // Thêm Huy Hiệu Locket Gold
    obj.subscriber.attributes = obj.subscriber.attributes || {};
    obj.subscriber.attributes.gold_badge = {
        "value": "gold_member",
        "updated_at_ms": Date.now()
    };
}

$done({ body: JSON.stringify(obj) });
