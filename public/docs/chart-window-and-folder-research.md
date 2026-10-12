# Research: one folder, a detachable chart window, chart beside the folder

Research only, 2026-10-08. Nothing here is built yet.

Goals:
1. Bring all tabs into one folder.
2. Let the chart live in its own window, so it can be moved to an extended screen.
3. By default, show the chart window beside the folder structure.

## How it is laid out now

- **Two separate tab folders** (`.tabwrap`), each with drag-to-reorder, a saved order and a "Side rail" toggle:
  - Folder 1: Birth Details, Planets, Vargas, Houses, Strength, Relationships.
  - Folder 2: Dashas, Influence Engine, Influence Framework, Research.
- **A third mini-folder inside the chart card:** Facts, Yogas formed, Influences (`initSideTabs()`, beside the South Indian chart).
- **The chart band** (South and North charts plus that side panel) is pinned across the top, with the folders scrolling underneath it.

## 1. One folder for all tabs

**A. One merged tab strip.** Combine both folders into one tab list of 10 tabs and keep drag-to-reorder.
- Fine as a horizontal strip on a wide screen, but it overflows on smaller ones. It then needs scrolling with arrow buttons or a "More ▾" menu.
- Each folder's saved order needs merging once, so nobody loses their custom order.

**B. A vertical rail (recommended).** The existing "Side rail" mode already stacks tabs down one side. Make it the default for the merged folder.
- A vertical list holds 10+ tabs without overflowing.
- It suits the chart-beside-folder layout: a tall, narrow rail next to a wide content area.

**C. A true folder tree**, like a file explorer, with collapsible groups:
- Chart: Birth Details, Planets, Vargas, Houses, Relationships
- Strength: Strength (Shadbala, Bhava Bala)
- Timing: Dashas
- Interpretation: Influence Engine, Influence Framework, Research

This reads most literally as a folder structure and scales as tabs are added. Drag-to-reorder within a group, and optionally between groups. Most work of the three.

**To decide:** should Facts, Yogas formed and Influences move into the folder (as tabs, or a "Quick read" group), or stay with the chart? If the chart moves to its own window, keeping them with it makes the pop-out window self-contained.

## 2. The chart in its own movable window

**A. Document Picture-in-Picture (best fit where available)**
- `documentPictureInPicture.requestWindow()` opens a real floating window that can hold any page content. The existing chart element is *moved* into it.
- Same page and same code, so hover tooltips, the Dasha overlay, the network overlay and chart updates keep working with no syncing code.
- Can be dragged to a second monitor and resized.
- Limits:
  - Chrome and Edge only (not Firefox or Safari).
  - One such window at a time, and it always stays on top.
  - Needs a button click to open.
  - Needs a secure page (`https://` or `localhost`); likely won't work when `index.html` is opened from disk (`file://`).
  - Closes when the main tab closes.

**B. A normal popup window holding the moved chart (works in most browsers)**
- `window.open()` on a click opens a blank window. Copy the styles in and move the chart element into it. Event handlers travel with the element, and the code still runs from the main page.
- A normal window: movable to another screen, can be maximised or full-screened, not always on top.
- **Catch:** the chart code looks elements up in the main page (`document.getElementById(...)` in the renderers, overlays and tooltips). These lookups must go through one helper that knows which window the chart is in.
- Popup blockers allow it because it opens from a click. `file://` behaviour varies by browser and needs testing.

**C. A second copy of the app in "chart only" mode**
- Open `index.html?view=chart` in a new window and keep the two in step by messaging (`BroadcastChannel` or `postMessage`). The main window sends chart data, dasha selection and overlay toggles; the chart window can send clicks back.
- Most flexible (could survive the main window reloading), but two copies of the state and a message protocol to maintain. Most code, and the most likely to drift out of sync given how much state the overlays share.

**Extras for any of the three**
- **Open on the second screen automatically:** the Window Management API (`getScreenDetails()`, Chrome/Edge, asks permission once) can place the window on the extended monitor, or full-screen it there.
- **Docking back:** when the chart window closes, move the chart back into the main page automatically.
  - Remember whether it was popped out.
  - Browsers don't let a page open windows on load, so after a reload show a one-click "Pop chart out again" button rather than reopening it.
- **Buttons on the chart header:** "Pop out ⧉" / "Dock ⇤", and possibly "Send to second screen".

**Recommendation:** use A where supported (Chrome or Edge on a served page) and fall back to B elsewhere. Both move the same live chart element, so the code that reads and draws the chart is shared and there's no syncing to build.

## 3. Default: chart beside the folder

- **Two-column page:** chart on the left, folder on the right (or the reverse, as a setting).
  - The chart column stays in view while scrolling, replacing today's band across the top and freeing about 350px of vertical space on wide screens.
- **Draggable divider** between the columns, with the split ratio remembered.
- **One chart at a time** in the narrower column (South or North, via the existing toggle). Facts, Yogas and Influences stack under the chart instead of beside it.
- **Below roughly 1000px wide:** stack chart over folder; on phones keep today's layout.

How it fits with the pop-out:
- Docked (default): chart column | folder.
- Popped out: the folder takes the full width of the main window; the chart is on the other screen.
- Docked again: the chart column returns beside the folder.

## Suggested order of work

1. **One folder:** merge the two tab sets into a vertical rail, migrating saved tab orders. Optional: tree groups.
2. **Side-by-side layout:** chart column that stays in view, divider, responsive fallback.
3. **Pop-out:** route the chart's element lookups through one helper, then add PiP with the popup fallback, docking back, and optionally second-screen placement.

## Open questions

- How is the app opened: directly from disk (`file://`), a local server, or the website? Decides whether Picture-in-Picture is usable.
- Which browser is used mainly? Chrome or Edge gets the best pop-out option.
- Flat rail or grouped tree for the folder?
- Should Facts, Yogas and Influences travel with the chart window, or move into the folder?
