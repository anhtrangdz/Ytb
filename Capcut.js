// ==UserScript==
// @ScriptName      CapCut Pro Unlocker for Shadowrocket
// @Match           ^https?:\/\/.*capcut.*\/.*
// @Type            response
// @Requires        mitm
// @MITM            DOMAIN-SUFFIX,capcut.com
// @Rule            URL-REGEX,^https?:\/\/.*capcut.*\/(subscription|vip|membership|paywall),SCRIPT,capcut_pro_unlock.js
// ==/UserScript==

(function() {
  let body = $response.body;
  let response = {};

  try {
    response = JSON.parse(body);
  } catch (e) {
    console.log("JSON parsing error: " + e);
    $done({ body });
    return;
  }

  // Mở khóa CapCut Pro
  response.subscription = {
    "status": "active",
    "plan": "pro",
    "expires": "2099-12-31T23:59:59Z",
    "features": ["no_ads", "hd_export", "premium_assets", "pro_tools"]
  };

  // Xóa quảng cáo
  if (response.ads) {
    response.ads = [];
  }

  if (response.features) {
    response.features.forEach(feature => feature.enabled = true);
  }

  body = JSON.stringify(response);
  $done({ body });
})();
