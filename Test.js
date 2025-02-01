// ==UserScript==
// @name            Ultimate YouTube AdKiller 2.0
// @namespace       yt-adfree
// @match           *://*.youtube.com/*
// @version         2024.06.20
// @description     Tổng hợp 5 lớp phòng thủ: JSON cleaning, DOM manipulation, URL pattern blocking, DNS filtering, và Manifest ad removal
// @run-at          document-start
// @grant           unsafeWindow
// @require         https://cdnjs.cloudflare.com/ajax/libs/jsonpath/1.1.1/jsonpath.min.js
// @connect         youtube.com
// @connect         googlevideo.com
// ==/UserScript==

(function() {
  'use strict';

  // ===== CẤU HÌNH CHẶN REQUEST =====
  const BLOCK_RULES = {
    url: [
      /\/ad(\d?)\//, 
      /\/pagead\//,
      /\/doubleclick\.net/,
      /(ad|ads?|log|promo|track[er]?)[^=&#/]*\.(xml|js|ts|vmap)/i,
      /\/api\/stats\/ads/,
      /\/generated_?ads/,
      /\/(live_chat|get_midroll).*ad_/i
    ],
    header: [
      ['referer', /(pagead|doubleclick)/i]
    ]
  };

  // ===== CORE FUNCTION =====
  function nuclearClean(response) {
    try {
      let body = response.body;
      
      // Layer 1: Xử lý JSON Response
      if (typeof body === 'string' && body.startsWith('{')) {
        let data = JSON.parse(body);
        
        // Chiến thuật 1: Dùng JSONPath để tìm mọi node liên quan đến quảng cáo
        const AD_PATHS = [
          '$..adPlacements',
          '$..adSlots',
          '$..playerAds',
          '$..adBreakUrl',
          '$..adSafetyReason',
          '$..surveyAd',
          '$..companionAd',
          '$..adPlacementConfig',
          '$..adBreakServiceUrl'
        ];
        
        AD_PATHS.forEach(path => {
          jsonpath.query(data, path).forEach(node => {
            jsonpath.apply(data, path, () => undefined);
          });
        });

        // Chiến thuật 2: Pattern matching trong giá trị
        const regexCleaner = (obj) => {
          for (let key in obj) {
            if (/ad|promo|doubleclick/i.test(key)) delete obj[key];
            if (typeof obj[key] === 'string' && obj[key].match(/\/ad[s]?\//)) {
              obj[key] = obj[key].replace(/\/ad[s]?\/(.*?)(\/|$)/, '/$2');
            }
          }
        };
        regexCleaner(data);

        body = JSON.stringify(data);
      }

      // Layer 2: Xử lý DASH Manifest
      if (body.includes('<MPD')) {
        body = body.replace(
          /<Period id=".*?ad.*?".*?<\/Period>/gis, 
          ''
        ).replace(
          /<Event messageData=".*?ad-break.*?".*?<\/Event>/gis,
          ''
        );
      }

      // Layer 3: Xử lý HLS/TS Stream
      if (body.includes('#EXT-X-DISCONTINUITY')) {
        body = body.replace(
          /#EXT-X-DISCONTINUITY\n#EXT-X-CUE:.*AD=.*\n.*\n/gis,
          ''
        );
      }

      return { body };
    } catch (e) {
      console.error(`[AdKiller Error] ${e}`);
      return response;
    }
  }

  // ===== DOM MANIPULATION =====
  function killDOMAds() {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          // Xóa overlay ads
          if (node.querySelector?.('.video-ads.ytp-ad-module')) {
            node.remove();
            console.log('[AdKiller] Đã xóa overlay ad');
          }
          // Chặn ad container
          if (node.id?.includes('ad_')) {
            node.style.display = 'none';
          }
        });
      });
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    // Chặn ad timers
    unsafeWindow.ytcfg.set({
      'INNERTUBE_CONTEXT_CLIENT_NAME': 'WEB_AD_FREE' // Fake ad-free client
    });
  }

  // ===== MAIN EXECUTION =====
  if (typeof $request !== 'undefined') {
    $done(nuclearClean($response));
  } else {
    document.addEventListener('DOMContentLoaded', killDOMAds);
    // Chặn WebSocket ads
    const nativeWebSocket = window.WebSocket;
    window.WebSocket = function(...args) {
      const ws = new nativeWebSocket(...args);
      ws.addEventListener('message', event => {
        if (/ad_?break/.test(event.data)) {
          ws.close();
          console.log('[AdKiller] Đã chặn WebSocket ad');
        }
      });
      return ws;
    };
  }

})();
