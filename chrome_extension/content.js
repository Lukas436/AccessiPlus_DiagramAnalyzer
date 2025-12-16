let isActive = false;
let isSnipping = false;
let overlay, snipBox, startX, startY, endX, endY;
let sizeLabel = null;
let cancelBtn = null;

// Erweiterung aktivieren/deaktivieren
window.addEventListener("toggle-snipping-mode", (e) => {
  isActive = e.detail.active;
  if (isActive) injectFloatingButton();
  else removeFloatingButton();
});

// Button einfügen
function injectFloatingButton() {
  if (document.getElementById("snip-btn")) return;

  const btn = document.createElement("button");
  btn.id = "snip-btn";
  btn.textContent = "📸 Diagramm";
  Object.assign(btn.style, {
    position: "fixed",
    top: "50%",
    right: "20px",
    transform: "translateY(-50%)",
    zIndex: "99999",
    padding: "10px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold"
  });

  btn.onclick = () => createOverlay();
  document.body.appendChild(btn);
}

function removeFloatingButton() {
  document.getElementById("snip-btn")?.remove();
}

// Overlay anzeigen
function createOverlay() {
  if (overlay) return;

  overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.2)",
    zIndex: 99998,
    cursor: "crosshair"
  });

  overlay.addEventListener("mousedown", startSelection);
  overlay.addEventListener("mousemove", updateSelection);
  window.addEventListener("mouseup", endSelection);
  document.addEventListener("keydown", cancelSelection);

  document.body.appendChild(overlay);
}

// Auswahl starten
function startSelection(e) {
  isSnipping = true;
  startX = e.clientX;
  startY = e.clientY;

  snipBox = document.createElement("div");
  Object.assign(snipBox.style, {
    position: "fixed",
    border: "2px dashed red",
    zIndex: 99999
  });
  document.body.appendChild(snipBox);

  sizeLabel = document.createElement("div");
  Object.assign(sizeLabel.style, {
    position: "fixed",
    backgroundColor: "black",
    color: "white",
    fontSize: "12px",
    padding: "2px 6px",
    borderRadius: "4px",
    zIndex: 99999,
    pointerEvents: "none"
  });
  document.body.appendChild(sizeLabel);
}

// Auswahl aktualisieren
function updateSelection(e) {
  if (!snipBox || !isSnipping) return;
  endX = e.clientX;
  endY = e.clientY;

  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const w = Math.abs(endX - startX);
  const h = Math.abs(endY - startY);

  Object.assign(snipBox.style, {
    left: x + "px",
    top: y + "px",
    width: w + "px",
    height: h + "px"
  });

  sizeLabel.textContent = `${w}×${h}`;
  Object.assign(sizeLabel.style, {
    left: (x + 10) + "px",
    top: (y - 25) + "px"
  });
}

// Auswahl abschließen
function endSelection(e) {
  if (!isSnipping) return;
  isSnipping = false;

  endX = e.clientX;
  endY = e.clientY;

  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const w = Math.abs(endX - startX);
  const h = Math.abs(endY - startY);

  snipBox.style.left = x + "px";
  snipBox.style.top = y + "px";
  snipBox.style.width = w + "px";
  snipBox.style.height = h + "px";

  showConfirmButtons(x, y + h + 10);
}

// ESC zum Abbrechen
function cancelSelection(e) {
  if (e.key === "Escape") cleanupOverlay();
}

// Buttons anzeigen
function showConfirmButtons(x, y) {
  const confirmBtn = document.createElement("button");
  confirmBtn.textContent = "✔️ Bestätigen";
  Object.assign(confirmBtn.style, {
    position: "fixed",
    left: x + "px",
    top: y + "px",
    zIndex: 100000,
    padding: "6px 10px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold"
  });

  confirmBtn.onclick = () => {
    captureScreenshot(() => {
      cleanupOverlay();
    });
  };

  cancelBtn = document.createElement("button");
  cancelBtn.textContent = "❌ Abbrechen";
  Object.assign(cancelBtn.style, {
    position: "fixed",
    left: (x + 130) + "px",
    top: y + "px",
    zIndex: 100000,
    padding: "6px 10px",
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold"
  });

  cancelBtn.onclick = () => cleanupOverlay();

  document.body.appendChild(confirmBtn);
  document.body.appendChild(cancelBtn);
}

// Overlay bereinigen
function cleanupOverlay() {
  overlay?.remove();
  snipBox?.remove();
  sizeLabel?.remove();
  cancelBtn?.remove();
  document.querySelectorAll("button").forEach(btn => {
    if (btn.textContent.includes("✔️") || btn.textContent.includes("❌")) btn.remove();
  });

  isSnipping = false;
  overlay = snipBox = sizeLabel = cancelBtn = null;
  window.removeEventListener("mouseup", endSelection);
  document.removeEventListener("keydown", cancelSelection);
}

// Screenshot machen
function captureScreenshot(callback) {
  html2canvas(document.body).then(canvas => {
    const crop = document.createElement("canvas");
    const ctx = crop.getContext("2d");
    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const w = Math.abs(endX - startX);
    const h = Math.abs(endY - startY);
    crop.width = w;
    crop.height = h;
    ctx.drawImage(canvas, x, y, w, h, 0, 0, w, h);

    crop.toBlob(blob => {
      const reader = new FileReader();
      reader.onloadend = () => {
        sendToServer(reader.result, x, y);
        if (typeof callback === "function") callback();
      };
      reader.readAsDataURL(blob);
    });
  });
}

// Bild an Backend schicken
function sendToServer(imageData, x, y) {
  showOverlay("⏳ Analyse läuft...", x, y);

  fetch("http://localhost:5000/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageData })
  })
    .then(res => res.json())
    .then(data => {
      showOverlay(data.interpretation || "Keine Interpretation", x, y);
    })
    .catch(() => showOverlay("❌ Fehler bei der Analyse", x, y));
}

// Antwort anzeigen + Schließen-Button
function showOverlay(text, x, y) {
  const box = document.createElement("div");
  Object.assign(box.style, {
    position: "fixed",
    left: x + "px",
    top: (y - 50) + "px",
    maxWidth: "300px",
    backgroundColor: "white",
    padding: "10px 15px 10px 10px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    zIndex: 99999,
    fontSize: "14px",
    boxShadow: "0 0 10px rgba(0,0,0,0.2)"
  });

  const closeBtn = document.createElement("span");
  closeBtn.textContent = "✖";
  Object.assign(closeBtn.style, {
    position: "absolute",
    top: "5px",
    right: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    color: "#888",
    fontSize: "16px"
  });
  closeBtn.onclick = () => box.remove();

  const content = document.createElement("div");
  content.textContent = text;

  box.appendChild(closeBtn);
  box.appendChild(content);
  document.body.appendChild(box);
}
