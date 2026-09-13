# Merge PDF

A minimal, fully client-side web app to combine multiple PDF files into one. Files never leave the browser — all merging happens locally using [pdf-lib](https://pdflib.js.org/).

## Features (skeleton)

- Drag & drop or browse to add PDFs
- **Take a photo** — use an in-page live camera preview to capture a new JPEG image; it becomes a full page in the merged PDF
- Reorder files (↑ / ↓) and remove individual files
- Merge PDFs and photos together in the chosen order and download `merged.pdf`
- No server, no upload, no build step

> On phones/tablets, **Take a photo** requests the rear camera and asks permission before showing a live preview. This cannot browse existing iOS albums. Captures are saved as JPEGs; selected PDF pages and PNG images remain supported.

## Run locally

It's a static site — just open `index.html`, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000

> The pdf-lib library loads from a CDN, so an internet connection is needed on first load.

## Structure

| File | Purpose |
|---|---|
| `index.html` | Markup and layout |
| `styles.css` | Styling (Carbon Amber accent) |
| `app.js` | File intake, reordering, and merge logic |

## Ideas / next steps

- Page-level selection (merge specific page ranges)
- Drag-to-reorder the file list
- Custom output filename
- Bundle pdf-lib locally for offline use
- Progress indicator for large files
