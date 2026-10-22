const $ = id => document.getElementById(id);
let scannedItems = [];

async function getSettings() {
  const settings = await chrome.storage.local.get({hideShorts: true, studyMode: false, watchedVideos: []});
  $("hideShorts").checked = settings.hideShorts;
  $("studyMode").checked = settings.studyMode;
  renderWatched(settings.watchedVideos);
}
async function setSetting(key, value) { await chrome.storage.local.set({[key]: value}); }
$("hideShorts").addEventListener("change", async e => { await setSetting("hideShorts", e.target.checked); sendToTab({type: "settingsChanged"}); });
$("studyMode").addEventListener("change", async e => { await setSetting("studyMode", e.target.checked); sendToTab({type: "settingsChanged"}); });

async function sendToTab(message) {
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  if (!tab?.id || !tab.url?.startsWith("https://www.youtube.com/")) { $("scanStatus").textContent = "Open a YouTube page first."; return null; }
  try { return await chrome.tabs.sendMessage(tab.id, message); }
  catch { $("scanStatus").textContent = "Refresh YouTube and try again."; return null; }
}
function renderCleanup(items) {
  const container = $("cleanupResults"); container.replaceChildren();
  if (!items.length) { const empty = document.createElement("div"); empty.className = "empty"; empty.textContent = "No items found. Open Manage subscriptions or a playlist and scan again."; container.appendChild(empty); }
  items.forEach(item => {
    const label = document.createElement("label"); label.className = "cleanup-item";
    const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.checked = false; checkbox.dataset.key = item.key;
    checkbox.addEventListener("change", updateSelectedCount);
    const text = document.createElement("span");
    const title = document.createElement("strong"); title.textContent = item.title || "Untitled item";
    const detail = document.createElement("small"); detail.textContent = item.subtitle || item.type;
    text.append(title, detail); label.append(checkbox, text); container.appendChild(label);
  });
  updateSelectedCount();
}
function updateSelectedCount() { const count = document.querySelectorAll("#cleanupResults input[type=checkbox]:checked").length; $("removeSelected").textContent = `Remove selected (${count})`; }
function selectedKeys() { return [...document.querySelectorAll("#cleanupResults input[type=checkbox]:checked")].map(el => el.dataset.key); }
$("scanPage").addEventListener("click", async () => {
  $("scanStatus").textContent = "Scanning currently loaded items…";
  const result = await sendToTab({type: "scan"});
  if (!result) return;
  scannedItems = result.items || [];
  renderCleanup(scannedItems);
  $("scanStatus").textContent = `${result.type}: found ${scannedItems.length} item(s). Select only what you want removed.`;
});
$("selectAll").addEventListener("click", () => { document.querySelectorAll("#cleanupResults input[type=checkbox]").forEach(el => el.checked = true); updateSelectedCount(); });
$("selectNone").addEventListener("click", () => { document.querySelectorAll("#cleanupResults input[type=checkbox]").forEach(el => el.checked = false); updateSelectedCount(); });
$("removeSelected").addEventListener("click", async () => {
  const keys = selectedKeys();
  if (!keys.length) { $("scanStatus").textContent = "Select at least one item first."; return; }
  const chosen = scannedItems.filter(item => keys.includes(item.key));
  const preview = chosen.slice(0, 5).map(item => `• ${item.title}`).join("\n");
  const more = chosen.length > 5 ? `\n…and ${chosen.length - 5} more` : "";
  if (!confirm(`Remove only these ${chosen.length} selected item(s)?\n\n${preview}${more}\n\nThis action may be difficult to undo.`)) return;
  $("scanStatus").textContent = "Processing selected items…";
  const result = await sendToTab({type: "removeSelected", keys});
  if (result?.message) $("scanStatus").textContent = result.message;
  const refreshed = await sendToTab({type: "scan"});
  if (refreshed?.items) { scannedItems = refreshed.items; renderCleanup(scannedItems); }
});
$("watchedSearch").addEventListener("input", async () => { const {watchedVideos = []} = await chrome.storage.local.get({watchedVideos: []}); renderWatched(watchedVideos); });
$("clearWatched").addEventListener("click", async () => { if (!confirm("Clear the extension's local watched-video list? This does not change YouTube watch history.")) return; await chrome.storage.local.set({watchedVideos: []}); renderWatched([]); });
function renderWatched(videos) {
  const query = $("watchedSearch").value.trim().toLowerCase();
  const filtered = videos.filter(v => `${v.title} ${v.channel}`.toLowerCase().includes(query));
  $("watchedCount").textContent = `${filtered.length} saved video(s)`;
  const container = $("watchedResults"); container.replaceChildren();
  if (!filtered.length) { const empty = document.createElement("div"); empty.className = "empty"; empty.textContent = videos.length ? "No matches." : "No saved videos yet. Watch a video for at least 30 seconds."; container.appendChild(empty); return; }
  filtered.slice(0, 30).forEach(video => { const item = document.createElement("div"); item.className = "result"; const link = document.createElement("a"); link.href = video.url; link.target = "_blank"; link.rel = "noreferrer"; link.textContent = video.title || "Untitled video"; const small = document.createElement("small"); small.textContent = `${video.channel || "YouTube"} · Last recorded ${new Date(video.seenAt).toLocaleDateString()}`; item.append(link, small); container.appendChild(item); });
}
getSettings();
