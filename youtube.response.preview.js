// Build: 2025/03/20 - Optimized for Shadowrocket and cross-platform compatibility
(() => {
  // Polyfill và các định nghĩa cơ bản từ mã gốc (giữ nguyên)
  // ... (TextDecoder, TextEncoder, protobuf definitions, etc.) ...
  // Để ngắn gọn, tôi giả định các định nghĩa như m, Mt, Bt, he, v.v. đã có từ mã gốc

  // Lớp cơ sở chung
  class BaseProcessor {
    constructor(name, debug = false) {
      this.name = name || "YouTube";
      this.debugMode = debug;
      this.request = $request || {};
      this.response = $response || {};
      this.decoder = new TextDecoder("utf-8", { fatal: false, ignoreBOM: true });
      this.timers = new Map();
      this.debug(`${this.name} Start`);
    }

    debug(msg) {
      if (this.debugMode) console.log(typeof msg === "object" ? JSON.stringify(msg) : msg);
    }

    log(msg) {
      console.log(typeof msg === "object" ? JSON.stringify(msg) : msg);
    }

    timeStart(label) {
      this.timers.set(label, Date.now());
    }

    timeEnd(label) {
      const start = this.timers.get(label);
      if (start) {
        this.debug(`${label}: ${Date.now() - start}ms`);
        this.timers.delete(label);
      }
    }

    exit() {
      $done({});
    }

    async fetch(options) {
      return new Promise((resolve, reject) => {
        const task = {
          url: options.url,
          method: options.method || "GET",
          body: options.body || "",
          headers: options.headers || {}
        };
        $task.fetch(task).then(
          resp => resolve({ status: resp.statusCode, body: resp.body }),
          err => reject(err)
        );
      });
    }

    done(bodyBytes) {
      this.timeStart("toBinary");
      const result = bodyBytes || this.message.toBinary();
      this.timeEnd("toBinary");
      this.debug(`Output size: ${Math.floor(result.length / 1024)} kb`);
      $done({ bodyBytes: result });
    }
  }

  // Lớp xử lý YouTube chung
  class YouTubeProcessor extends BaseProcessor {
    constructor(msgType, name) {
      super(name, $argument?.debug === "true");
      this.msgType = msgType;
      this.message = null;
      this.needProcess = false;
      this.config = this.loadConfig();
      this.argument = this.parseArguments();
    }

    parseArguments() {
      const defaults = {
        lyricLang: "vi",
        captionLang: "vi",
        blockUpload: true,
        blockImmersive: true,
        debug: false
      };
      return $argument ? Object.assign(defaults, JSON.parse($argument)) : defaults;
    }

    loadConfig() {
      const stored = $persistentStore?.read("YouTubeAdvertiseInfo") || "{}";
      const config = JSON.parse(stored);
      return config.version === "1.0" ? config : {
        version: "1.0",
        whiteNo: [],
        blackNo: [],
        whiteEml: [],
        blackEml: ["inline_injection_entrypoint_layout.eml"]
      };
    }

    saveConfig() {
      if (this.configUpdated) {
        this.debug("Saving updated config");
        $persistentStore?.write(JSON.stringify(this.config), "YouTubeAdvertiseInfo");
      }
    }

    fromBinary(bodyBytes) {
      if (!(bodyBytes instanceof Uint8Array)) {
        this.log("Cannot process non-binary body");
        this.exit();
        return this;
      }
      this.timeStart("fromBinary");
      this.message = this.msgType.fromBinary(bodyBytes);
      this.timeEnd("fromBinary");
      this.debug(`Input size: ${Math.floor(bodyBytes.length / 1024)} kb`);
      return this;
    }

    async modify() {
      this.timeStart("modify");
      await this.pure();
      this.timeEnd("modify");
      return this;
    }

    iterate(obj, key, callback) {
      const seen = new WeakMap();
      const stack = Array.isArray(obj) ? obj : [obj];
      while (stack.length) {
        const current = stack.pop();
        if (!current || seen.has(current)) continue;
        seen.set(current, true);
        if (key in current) callback(current);
        Object.values(current).filter(v => v && typeof v === "object").forEach(v => stack.push(v));
      }
    }

    listUnknownFields(obj) {
      return obj instanceof E ? obj.getType().runtime.bin.listUnknownFields(obj) : [];
    }

    isAdvertise(obj) {
      const unknownFields = this.listUnknownFields(obj);
      return unknownFields.length ? this.checkFieldNo(unknownFields[0]) : this.checkFieldEml(obj);
    }

    checkFieldNo(field) {
      const { no, data } = field;
      if (this.config.whiteNo.includes(no)) return false;
      if (this.config.blackNo.includes(no)) return true;
      const isAd = data.length > 1000 && this.decoder.decode(data).includes("pagead");
      this.config[isAd ? "blackNo" : "whiteNo"].push(no);
      this.configUpdated = true;
      return isAd;
    }

    checkFieldEml(obj) {
      let isAd = false;
      this.iterate(obj, "renderInfo", node => {
        const eml = node.renderInfo?.layoutRender?.eml?.split("|")[0] || "";
        if (this.config.whiteEml.includes(eml)) isAd = false;
        else if (this.config.blackEml.includes(eml) || /shorts(?!_pivot_item)/.test(eml)) isAd = true;
        else {
          isAd = this.checkUnknownFields(node.videoInfo?.videoContext?.videoContent);
          this.config[isAd ? "blackEml" : "whiteEml"].push(eml);
          this.configUpdated = true;
        }
      });
      return isAd;
    }

    checkUnknownFields(obj) {
      return obj && this.listUnknownFields(obj).some(f => f.data.length > 1000 && this.decoder.decode(f.data).includes("pagead"));
    }

    isShorts(obj) {
      let isShort = false;
      this.iterate(obj, "eml", node => {
        isShort = /shorts(?!_pivot_item)/.test(node.eml);
      });
      return isShort;
    }
  }

  // Lớp Browse
  class Browse extends YouTubeProcessor {
    constructor() {
      super(Mt, "Browse");
    }

    async pure() {
      this.iterate(this.message, "sectionListSupportedRenderers", section => {
        const renderers = section.sectionListSupportedRenderers;
        for (let i = renderers.length - 1; i >= 0; i--) {
          const item = renderers[i];
          this.removeAd(item) || this.removeShorts(item) && renderers.splice(i, 1);
        }
      });
      await this.translate();
      this.removeFrameworkAds();
      return this;
    }

    removeAd(item) {
      const contents = item?.itemSectionRenderer?.richItemContent || [];
      let removed = false;
      for (let i = contents.length - 1; i >= 0; i--) {
        if (this.isAdvertise(contents[i])) {
          contents.splice(i, 1);
          this.needProcess = true;
          removed = true;
        }
      }
      return removed;
    }

    removeShorts(item) {
      return this.isShorts(item?.shelfRenderer);
    }

    async translate() {
      const lang = this.argument.lyricLang.trim();
      if (this.name !== "Browse" || !this.getBrowseId().startsWith("MPLYt") || lang === "off") return;

      let target, text = "", found = false;
      this.iterate(this.message, "timedLyricsContent", node => {
        target = node.timedLyricsContent;
        text = target.runs.map(r => r.text).join("\n");
        found = true;
      }) || this.iterate(this.message, "description", node => {
        target = node.description.runs[0];
        text = target.text;
        found = true;
      });

      if (!found) return;
      const url = Yt(text, lang); // Yt từ mã gốc
      const resp = await this.fetch({ url });
      if (resp.status === 200) {
        const data = JSON.parse(resp.body);
        const translated = data[0].map(t => t[0]).join("\n");
        if (target.text) target.text = translated;
        else target.runs.forEach((r, i) => r.text = data[0][i]?.[0] || r.text);
        this.iterate(this.message, "footer", f => f.footer.runs[0].text += " & Translated by Google");
        this.needProcess = true;
      }
    }

    removeFrameworkAds() {
      const mutations = this.message?.frameworkUpdateTransport?.entityBatchUpdate?.mutations || [];
      for (let i = mutations.length - 1; i >= 0; i--) {
        const mutation = mutations[i];
        const entity = _t.fromBinary(W.dec(decodeURIComponent(mutation.entityKey)));
        if (this.config.blackEml.includes(entity.name) || this.checkUnknownFields(mutation.payload)) {
          mutations.splice(i, 1);
          this.config.blackEml.push(entity.name);
          this.configUpdated = true;
          this.needProcess = true;
        }
      }
    }

    getBrowseId() {
      let id = "";
      this.iterate(this.message?.responseContext, "key", node => {
        if (node.key === "browse_id") id = node.value;
      });
      return id;
    }
  }

  // Lớp Next
  class Next extends Browse {
    constructor() {
      super(ke, "Next");
    }
  }

  // Lớp Player
  class Player extends YouTubeProcessor {
    constructor() {
      super(be, "Player");
    }

    pure() {
      if (this.message.adPlacements?.length) {
        this.message.adPlacements.length = 0;
        this.needProcess = true;
      }
      if (this.message.adSlots?.length) {
        this.message.adSlots.length = 0;
        this.needProcess = true;
      }
      delete this.message?.playbackTracking?.pageadViewthroughconversion;
      this.addPlayability();
      this.addTranslateCaption();
      return this;
    }

    addPlayability() {
      const mini = this.message?.playabilityStatus?.miniPlayer?.miniPlayerRender;
      if (mini) mini.active = true;
      if (this.message.playabilityStatus) {
        this.message.playabilityStatus.backgroundPlayer = new _e({ backgroundPlayerRender: { active: true } });
        this.needProcess = true;
      }
    }

    addTranslateCaption() {
      const lang = this.argument.captionLang;
      if (lang === "off") return;
      this.iterate(this.message, "captionTracks", node => {
        const tracks = node.captionTracks;
        const audio = node.audioTracks;
        const langMap = { [lang]: 2, en: 1 };
        let maxScore = -1, defaultIdx = 0;

        tracks.forEach((t, i) => {
          const score = langMap[t.languageCode] || 0;
          if (score > maxScore) {
            maxScore = score;
            defaultIdx = i;
          }
          t.isTranslatable = true;
        });

        if (maxScore < 2) {
          const newTrack = new Ge({
            baseUrl: tracks[defaultIdx].baseUrl + `&tlang=${lang}`,
            name: { runs: [{ text: `@Enhance (${lang})` }] },
            vssId: `.${lang}`,
            languageCode: lang
          });
          tracks.push(newTrack);
        }

        audio.forEach(a => {
          const idx = maxScore === 2 ? defaultIdx : tracks.length - 1;
          if (!a.captionTrackIndices.includes(idx)) a.captionTrackIndices.push(idx);
          a.defaultCaptionTrackIndex = idx;
          a.captionsInitialState = 3;
        });

        node.translationLanguages = Object.entries({
          de: "Deutsch", ru: "Русский", fr: "Français", fil: "Filipino",
          ko: "한국어", ja: "日本語", en: "English", vi: "Tiếng Việt",
          "zh-Hant": "中文（繁體）", "zh-Hans": "中文（简体）", und: "@VirgilClyne"
        }).map(([code, name]) => new Ye({ languageCode: code, languageName: { runs: [{ text: name }] } }));
        this.needProcess = true;
      });
    }
  }

  // Lớp Search
  class Search extends Browse {
    constructor() {
      super(Ct, "Search");
    }
  }

  // Lớp Shorts
  class Shorts extends YouTubeProcessor {
    constructor() {
      super(At, "Shorts");
    }

    pure() {
      const entries = this.message.entries || [];
      for (let i = entries.length - 1; i >= 0; i--) {
        if (!entries[i]?.command?.reelWatchEndpoint?.overlay) {
          entries.splice(i, 1);
          this.needProcess = true;
        }
      }
      return this;
    }
  }

  // Lớp Guide
  class Guide extends YouTubeProcessor {
    constructor() {
      super(Lt, "Guide");
    }

    pure() {
      const blockList = ["SPunlimited"];
      if (this.argument.blockUpload) blockList.push("FEuploads");
      if (this.argument.blockImmersive) blockList.push("FEmusic_immersive");

      this.iterate(this.message, "rendererItems", node => {
        const items = node.rendererItems;
        for (let i = items.length - 1; i >= 0; i--) {
          const id = items[i]?.iconRender?.browseId || items[i]?.labelRender?.browseId;
          if (blockList.includes(id)) {
            items.splice(i, 1);
            this.needProcess = true;
          }
        }
      });
      return this;
    }
  }

  // Lớp Setting
  class Setting extends YouTubeProcessor {
    constructor() {
      super($t, "Setting");
    }

    pure() {
      this.iterate(this.message.settingItems, "categoryId", node => {
        if (node.categoryId === 10135) {
          node.subSettings.push(new qe({
            settingBooleanRenderer: {
              itemId: 0,
              enableServiceEndpoint: { setClientSettingEndpoint: { settingData: { clientSettingEnum: { item: 151 }, boolValue: true } } },
              disableServiceEndpoint: { setClientSettingEndpoint: { settingData: { clientSettingEnum: { item: 151 }, boolValue: false } } }
            }
          }));
          this.needProcess = true;
        }
      });

      this.message.settingItems.push(new Te({
        backgroundPlayBackSettingRenderer: {
          backgroundPlayback: true,
          download: true,
          downloadQualitySelection: true,
          smartDownload: true,
          icon: { iconType: 1093 }
        }
      }));
      this.needProcess = true;
      return this;
    }
  }

  // Lớp Watch
  class Watch extends YouTubeProcessor {
    constructor() {
      super(Jt, "Watch");
      this.player = new Player();
      this.next = new Next();
    }

    async pure() {
      this.iterate(this.message.contents, "player", node => {
        if (node.player) {
          this.player.message = node.player;
          this.player.pure();
          this.needProcess = true;
        }
        if (node.next) {
          this.next.message = node.next;
          this.next.pure();
          this.needProcess = true;
        }
      });
      return this;
    }
  }

  // Hàm chính
  async function main() {
    const processors = new Map([
      ["browse", Browse],
      ["next", Next],
      ["player", Player],
      ["search", Search],
      ["reel_watch_sequence", Shorts],
      ["guide", Guide],
      ["get_setting", Setting],
      ["get_watch", Watch]
    ]);

    const url = $request.url;
    const Processor = Array.from(processors).find(([key]) => url.includes(key))?.[1];
    if (!Processor) {
      $notify("YouTube Enhance", "Script cần cập nhật", "Cập nhật từ nguồn bên ngoài");
      $done({});
      return;
    }

    const processor = new Processor();
    processor.fromBinary($response.bodyBytes);
    await processor.modify();
    processor.saveConfig();
    processor.done();
  }

  main().catch(err => {
    $notify("YouTube Enhance Error", "", err.message);
    $done({});
  });
})();
