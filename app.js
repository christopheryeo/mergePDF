/* Merge PDF — client-side PDF merging with pdf-lib.
 * No files leave the browser. */
(function () {
  "use strict";

  const { PDFDocument } = window.PDFLib;

  // In-memory list of selected files. Order here = merge order.
  /** @type {File[]} */
  let files = [];

  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("fileInput");
  const imageInput = document.getElementById("imageInput");
  const browseBtn = document.getElementById("browseBtn");
  const addPhotosBtn = document.getElementById("addPhotosBtn");
  const fileListEl = document.getElementById("fileList");
  const mergeBtn = document.getElementById("mergeBtn");
  const clearBtn = document.getElementById("clearBtn");
  const statusEl = document.getElementById("status");

  // ---- File intake -------------------------------------------------------

  // Returns "pdf", "image", or null for unsupported files.
  function kindOf(file) {
    const name = file.name.toLowerCase();
    if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
    if (file.type === "image/jpeg" || file.type === "image/png") return "image";
    if (/\.(jpe?g|png)$/.test(name)) return "image";
    return null;
  }

  function addFiles(fileArray) {
    const accepted = Array.from(fileArray).filter((f) => kindOf(f) !== null);
    const rejected = fileArray.length - accepted.length;
    files = files.concat(accepted);
    render();
    if (rejected > 0) {
      setStatus(`Skipped ${rejected} unsupported file(s). Only PDFs and JPEG/PNG photos are supported.`, "error");
    } else {
      setStatus("");
    }
  }

  browseBtn.addEventListener("click", (e) => { e.stopPropagation(); fileInput.click(); });
  addPhotosBtn.addEventListener("click", (e) => { e.stopPropagation(); imageInput.click(); });
  dropzone.addEventListener("click", (e) => {
    if (e.target === browseBtn || e.target === addPhotosBtn) return;
    fileInput.click();
  });
  dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });
  fileInput.addEventListener("change", () => {
    addFiles(fileInput.files);
    fileInput.value = ""; // allow re-selecting the same file
  });
  imageInput.addEventListener("change", () => {
    addFiles(imageInput.files);
    imageInput.value = "";
  });

  // Drag & drop
  ["dragenter", "dragover"].forEach((evt) =>
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add("dropzone--dragover");
    })
  );
  ["dragleave", "drop"].forEach((evt) =>
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove("dropzone--dragover");
    })
  );
  dropzone.addEventListener("drop", (e) => {
    if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
  });

  // ---- List management ---------------------------------------------------

  function move(index, delta) {
    const target = index + delta;
    if (target < 0 || target >= files.length) return;
    [files[index], files[target]] = [files[target], files[index]];
    render();
  }

  function remove(index) {
    files.splice(index, 1);
    render();
  }

  clearBtn.addEventListener("click", () => {
    files = [];
    render();
    setStatus("");
  });

  // ---- Merge -------------------------------------------------------------

  mergeBtn.addEventListener("click", async () => {
    if (files.length < 2) {
      setStatus("Add at least two PDFs to merge.", "error");
      return;
    }
    setBusy(true);
    setStatus("Merging…");
    try {
      const merged = await PDFDocument.create();
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        if (kindOf(file) === "image") {
          const isPng = file.type === "image/png" || /\.png$/i.test(file.name);
          const img = isPng ? await merged.embedPng(bytes) : await merged.embedJpg(bytes);
          const page = merged.addPage([img.width, img.height]);
          page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        } else {
          const doc = await PDFDocument.load(bytes);
          const pages = await merged.copyPages(doc, doc.getPageIndices());
          pages.forEach((p) => merged.addPage(p));
        }
      }
      const mergedBytes = await merged.save();
      download(mergedBytes, "merged.pdf");
      setStatus(`Merged ${files.length} files into merged.pdf.`, "success");
    } catch (err) {
      console.error(err);
      setStatus("Something went wrong while merging. Is every file a valid PDF?", "error");
    } finally {
      setBusy(false);
    }
  });

  function download(bytes, filename) {
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ---- Rendering ---------------------------------------------------------

  function render() {
    fileListEl.innerHTML = "";
    files.forEach((file, i) => {
      const li = document.createElement("li");
      li.className = "file-item";
      const tag = kindOf(file) === "image" ? "IMG" : "PDF";
      li.innerHTML = `
        <span class="file-item__index">${i + 1}</span>
        <span class="file-item__name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
        <span class="file-item__tag">${tag}</span>
        <span class="file-item__size">${formatSize(file.size)}</span>
        <span class="file-item__controls">
          <button type="button" class="btn btn--icon" data-act="up" ${i === 0 ? "disabled" : ""} aria-label="Move up">↑</button>
          <button type="button" class="btn btn--icon" data-act="down" ${i === files.length - 1 ? "disabled" : ""} aria-label="Move down">↓</button>
          <button type="button" class="btn btn--icon" data-act="remove" aria-label="Remove">✕</button>
        </span>`;
      li.querySelector('[data-act="up"]').addEventListener("click", () => move(i, -1));
      li.querySelector('[data-act="down"]').addEventListener("click", () => move(i, 1));
      li.querySelector('[data-act="remove"]').addEventListener("click", () => remove(i));
      fileListEl.appendChild(li);
    });

    mergeBtn.disabled = files.length < 2;
    clearBtn.disabled = files.length === 0;
  }

  function setBusy(busy) {
    mergeBtn.disabled = busy || files.length < 2;
    clearBtn.disabled = busy || files.length === 0;
  }

  function setStatus(msg, kind) {
    statusEl.textContent = msg;
    statusEl.className = "status" + (kind ? ` status--${kind}` : "");
  }

  // ---- Helpers -----------------------------------------------------------

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }
})();
