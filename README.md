# YouTube Toolbox

A lightweight Chrome extension for making YouTube easier to manage and less distracting. YouTube Toolbox runs in your browser and is designed for personal use, with no backend server or account sign-in inside the extension.

> **Status: Experimental.** YouTube frequently changes its page layout. The cleanup tools rely on the visible YouTube interface and may need updates when that happens. Review every selection and verify changes on YouTube.

## Features

- **Hide Shorts** — hides supported Shorts links and shelves to reduce distractions.
- **Study Mode** — hides supported recommendation areas for a cleaner viewing experience.
- **Watched Video Finder** — keeps a local list of videos the extension observes you watching for at least 30 seconds, then lets you search that list.
- **Selective subscription cleanup** — scan a supported YouTube page, select individual channels, and request removal only for the selected items.
- **Watch Later / playlist cleanup** — scan supported, currently loaded playlist items and select the ones you want to remove.
- **Local settings** — preferences and the watched-video list use Chrome's local extension storage.

### Important limitations

- The watched-video finder starts recording after the extension is installed. It does **not** import your existing YouTube watch history.
- Cleanup scans only items currently loaded on the page. You may need to scroll to load more items and scan again.
- YouTube's interface can change, and a scan or removal may fail. Always verify the result on YouTube.
- Selective cleanup is intended to operate only on items you select; inspect the displayed names before confirming.
- This extension does not block advertisements, bypass YouTube restrictions, or provide access to private account data.

## Requirements

- Google Chrome or another Chromium-based browser that supports Manifest V3 extensions.
- A signed-in YouTube session for actions that change your subscriptions or playlists.
- No Node.js, Python, build process, API key, or backend server is required to run the extension locally.

## Run locally (Load unpacked)

### 1. Get the source code

Clone the repository:

```bash
git clone <YOUR_GIT_REPOSITORY_URL>
```

Replace `<YOUR_GIT_REPOSITORY_URL>` with the clone URL from your Git hosting page. Or download the repository as a ZIP and extract it.

### 2. Open the extension folder

The folder you load must contain `manifest.json` directly. The project structure should look like this:

```text
youtube-toolbox-extension/
├── manifest.json
├── popup.html
├── popup.css
├── popup.js
├── content.js
└── styles.css
```

If your repository has these files inside a nested folder, select that inner folder in Chrome.

### 3. Load it in Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select the `youtube-toolbox-extension` folder — the one containing `manifest.json`.
5. Open YouTube and refresh the page.

### 4. Use the tools

**Hide Shorts / Study Mode**
1. Open YouTube.
2. Click the YouTube Toolbox extension icon.
3. Turn the feature on or off.
4. Refresh YouTube if a page element does not update immediately.

**Find watched videos**
1. Leave the extension installed and open a YouTube video.
2. Watch for at least 30 seconds.
3. Open the extension and search the Watched Video Finder.
4. Use **Clear local watch list** to clear the extension's saved list. This does not delete YouTube watch history.

**Select subscriptions or playlist items to remove**
1. Open [Manage subscriptions](https://www.youtube.com/feed/channels) to review channels, or open Watch Later / the playlist you want to clean.
2. Scroll as needed so the items you want are loaded on the page.
3. Open the extension and click **Scan current YouTube page**.
4. Review the results carefully and tick only the channels or videos you want to remove.
5. Use **Select all** or **Select none** if useful, then click **Remove selected**.
6. Verify the result on YouTube before repeating the process.

If no items appear, make sure you are on a supported YouTube page, the items are loaded, and the page has finished loading. Refresh YouTube and scan again.

## Update after pulling new code

1. Pull or download the latest repository files.
2. Open `chrome://extensions`.
3. Find YouTube Toolbox and click the **Reload** icon.
4. Refresh the YouTube tab.

If you moved the project folder, use **Remove** on the extension page and then **Load unpacked** again, selecting the new folder.

## Publish to the Chrome Web Store

You can publish a public listing, but publishing is optional for personal use. For personal use, **Load unpacked** is enough.

### Before submitting

1. **Test the extension** in a clean Chrome profile and on the YouTube pages it supports.
2. Confirm that all buttons and toggles behave as described, and that selected cleanup items—not unselected items—are processed.
3. Check the `manifest.json` permissions. Request only permissions the extension genuinely needs.
4. Add a clear privacy policy that describes local storage, what information is observed, how it is used, and whether anything is transmitted. Do not claim that no data is collected unless you have verified the code and all dependencies.
5. Add screenshots, a clear description, support contact details, and any other information requested by the Chrome Web Store dashboard.
6. Choose and include a license file if you intend to grant others permission to reuse or modify the code. Do not imply a license has been granted if none is included.

### Package the extension

The ZIP should contain the extension files at the archive root, not an extra enclosing project directory:

```text
manifest.json
popup.html
popup.css
popup.js
content.js
styles.css
```

From inside the `youtube-toolbox-extension` directory, create a ZIP containing those files. Do **not** include `.git`, repository metadata, development notes, or unrelated files.

### Submit

1. Create a developer account in the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/). Google may require a one-time registration fee and account verification; check the current dashboard instructions.
2. Create a new item and upload the packaged ZIP.
3. Complete the product listing, privacy disclosures, permission justifications, screenshots, and any other required fields.
4. Submit it for review and address any review feedback.

Approval is not guaranteed. Because this extension interacts with YouTube pages and changes subscriptions or playlists, review the current Chrome Web Store policies and Google's user-data requirements before submitting. Do not describe it as an official YouTube or Google product.

## Permissions and privacy

The current manifest requests:

- `storage` — stores settings and the extension's watched-video list in Chrome local extension storage.
- `activeTab` — allows interaction with the active tab after the relevant user action.
- Host access to `https://www.youtube.com/*` — lets the content script run on YouTube pages to apply display changes, inspect loaded items, and perform requested cleanup actions.

The extension is designed to run without a separate backend. Chrome local storage is not the same as encrypted vault storage, and browser profile data may be accessible to someone who can access that profile. Review the source code before using or distributing the extension.

## Troubleshooting

### “Manifest file is missing or unreadable”
Use **Load unpacked** and select the folder that contains `manifest.json` directly. Do not select the ZIP file or its parent folder.

### The extension icon appears, but scanning finds nothing
- Navigate to a supported YouTube page, such as `/feed/channels` or the playlist you want to clean.
- Wait for the page to finish loading.
- Scroll to load the relevant items, then scan again.
- Reload the extension from `chrome://extensions` and refresh YouTube.
- YouTube may have changed its interface; the selectors in `content.js` may need maintenance.

### A selected channel or video was not removed
Confirm that the correct item was selected and inspect YouTube's page afterward. The extension can only interact with controls that are present and recognizable in the current interface. Do not assume an action succeeded just because a scan or click completed.

### Watched Video Finder is empty
It records videos observed after installation once they meet the watch-time threshold. It does not import prior watch history. Check that the extension is enabled and refresh the YouTube tab.

### Changes to the code do not appear
Click **Reload** on `chrome://extensions`, then refresh the YouTube tab. Content scripts already running in an open tab may not use updated code until the page is refreshed.

## Project files

| File | Purpose |
| --- | --- |
| `manifest.json` | Manifest V3 metadata, permissions, popup, and content-script registration |
| `popup.html` | Extension popup layout |
| `popup.css` | Popup styling |
| `popup.js` | Popup controls, settings, watched list, and selection UI |
| `content.js` | YouTube page interaction, scanning, and cleanup logic |
| `styles.css` | Page styles used by Hide Shorts and Study Mode |

## Contributing

Issues and pull requests are welcome. When reporting a bug, include:
- Browser name and version.
- YouTube page where it occurred.
- Steps to reproduce the issue.
- Whether the scan found items and what happened after selecting one.
- Console errors, if available (remove personal information before sharing).

Please do not include passwords, cookies, session tokens, or private account information in bug reports.

## Disclaimer

YouTube Toolbox is an independent, experimental community project and is not affiliated with, endorsed by, or sponsored by YouTube or Google. YouTube's interface and policies may change at any time. Use cleanup features carefully and verify account changes yourself.
