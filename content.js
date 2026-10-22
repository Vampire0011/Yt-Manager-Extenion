(() => {
  if (window.__ytToolboxLoaded) return;
  window.__ytToolboxLoaded = true;

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  let lastRecordedVideo = "";
  let watchTimer = null;

  async function applySettings() {
    const {hideShorts = true, studyMode = false} =
      await chrome.storage.local.get({hideShorts: true, studyMode: false});
    document.documentElement.classList.toggle("yt-toolbox-hide-shorts", hideShorts);
    document.documentElement.classList.toggle("yt-toolbox-study", studyMode);
  }

  function videoIdFromUrl(url = location.href) {
    try {
      const parsed = new URL(url);
      if (parsed.pathname === "/watch") return parsed.searchParams.get("v");
      const shorts = parsed.pathname.match(/^\/shorts\/([^/?]+)/);
      return shorts?.[1] || null;
    } catch {
      return null;
    }
  }

  function currentVideoDetails() {
    const id = videoIdFromUrl();
    if (!id) return null;
    const title = document.querySelector("h1.ytd-watch-metadata yt-formatted-string")?.textContent?.trim()
      || document.title.replace(/\s*-\s*YouTube$/, "").trim()
      || "YouTube video";
    const channel = document.querySelector("#owner #channel-name a")?.textContent?.trim() || "";
    return {id, title, channel, url: `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`};
  }

  async function recordWatchedVideo() {
    const details = currentVideoDetails();
    if (!details) return;
    const {watchedVideos = []} = await chrome.storage.local.get({watchedVideos: []});
    const existing = watchedVideos.filter(v => v.id !== details.id);
    existing.unshift({...details, seenAt: Date.now()});
    await chrome.storage.local.set({watchedVideos: existing.slice(0, 500)});
    lastRecordedVideo = details.id;
  }

  function trackWatchTime() {
    if (watchTimer) clearInterval(watchTimer);
    watchTimer = setInterval(() => {
      const id = videoIdFromUrl();
      const player = document.querySelector("video");
      if (!id || !player || player.paused || player.currentTime < 30 || id === lastRecordedVideo) return;
      recordWatchedVideo();
    }, 5000);
  }

  function pageType() {
    if (location.pathname === "/feed/channels") return "subscriptions";
    if (location.pathname === "/playlist" || location.pathname === "/feed/playlist") {
      const list = new URL(location.href).searchParams.get("list");
      if (list === "WL") return "watch-later";
      if (list === "LL") return "liked-videos";
      return "playlist";
    }
    return "unsupported";
  }

  function getRows(type) {
    if (type === "subscriptions") return [...document.querySelectorAll("ytd-channel-renderer")];
    if (["watch-later", "liked-videos", "playlist"].includes(type)) {
      return [...document.querySelectorAll("ytd-playlist-video-renderer")];
    }
    return [];
  }

  function rowTitle(row) {
    return row.querySelector("#video-title, #channel-title, a#video-title")?.textContent?.trim()
      || row.querySelector("a[title]")?.getAttribute("title")
      || "Untitled item";
  }

  function rowDetails(row, type) {
    const link = type === "subscriptions"
      ? row.querySelector("a[href^='/@'], a[href^='/channel/'], a[href^='/c/'], a[href^='/user/']")
      : row.querySelector("a#video-title, a[href*='/watch']");
    const href = link?.getAttribute("href") || "";
    const key = href ? `${type}:${href}` : `${type}:${rowTitle(row)}`;
    const subtitle = type === "subscriptions" ? "Channel subscription" : "Video in playlist";
    return {key, title: rowTitle(row), subtitle, type};
  }

  async function scan() {
    const type = pageType();
    if (type === "unsupported") return {type: "Unsupported page", count: 0, items: []};
    const rows = getRows(type);
    const items = rows.map(row => rowDetails(row, type));
    return {type, count: items.length, items};
  }

  async function removeSelected(keys) {
    const type = pageType();
    if (type === "unsupported") return {message: "Open Manage subscriptions, Watch Later, or a playlist first."};
    if (!Array.isArray(keys) || !keys.length) return {message: "Select at least one item first."};

    let done = 0;
    let skipped = 0;
    for (const key of keys) {
      const row = getRows(type).find(candidate => rowDetails(candidate, type).key === key);
      if (!row) { skipped++; continue; }
      try {
        const menuButton = row.querySelector("ytd-menu-renderer button, ytd-menu-renderer yt-icon-button, #menu button");
        if (!menuButton) { skipped++; continue; }
        menuButton.click();
        await wait(500);
        const menuItems = [...document.querySelectorAll("ytd-menu-service-item-renderer, tp-yt-paper-item, ytd-menu-navigation-item-renderer")];
        const pattern = type === "subscriptions" ? /unsubscribe/i : /remove from (watch later|playlist|liked videos)/i;
        const target = menuItems.find(el => pattern.test((el.innerText || el.textContent || "").trim()));
        if (!target) {
          document.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape", bubbles: true}));
          skipped++;
          continue;
        }
        target.click();
        await wait(500);
        if (type === "subscriptions") {
          const dialogButtons = [...document.querySelectorAll("ytd-confirm-dialog-renderer button, yt-confirm-dialog-renderer button, tp-yt-paper-dialog button")];
          const confirmButton = dialogButtons.find(el => /unsubscribe/i.test((el.innerText || el.textContent || "").trim()));
          if (!confirmButton) { skipped++; continue; }
          confirmButton.click();
          await wait(900);
        } else {
          await wait(300);
        }
        done++;
      } catch {
        skipped++;
      }
    }
    return {message: `Finished selected items: ${done} processed, ${skipped} skipped. Check YouTube to verify.`};
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "settingsChanged") {
      applySettings();
      sendResponse({ok: true});
      return;
    }
    if (message?.type === "scan") {
      scan().then(sendResponse);
      return true;
    }
    if (message?.type === "removeSelected") {
      removeSelected(message.keys).then(sendResponse);
      return true;
    }
  });

  chrome.storage.onChanged.addListener(applySettings);
  applySettings();
  trackWatchTime();

  // YouTube is a single-page app, so reapply settings and watch tracking on navigation.
  let previousUrl = location.href;
  setInterval(() => {
    if (location.href !== previousUrl) {
      previousUrl = location.href;
      applySettings();
      trackWatchTime();
    }
  }, 1000);
})();