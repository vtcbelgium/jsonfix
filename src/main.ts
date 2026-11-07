import "./style.css";
import { getJsonStats, parseAndRepairJson } from "./repair";

const inputArea = document.getElementById("input-json") as HTMLTextAreaElement | null;
const outputArea = document.getElementById("output-json") as HTMLTextAreaElement | null;
const statusBadge = document.getElementById("status-badge");
const btnRepair = document.getElementById("btn-repair");
const btnClear = document.getElementById("btn-clear");
const btnCopy = document.getElementById("btn-copy");
const btnMinify = document.getElementById("btn-minify");
const btnDownload = document.getElementById("btn-download") as HTMLButtonElement | null;
const jsonStats = document.getElementById("json-stats");

function showStats(parsed: unknown, text: string): void {
  if (jsonStats) {
    const { keyCount, maxDepth, arrayItemCount, byteSize } = getJsonStats(parsed, text);
    jsonStats.textContent = [
      `Keys: ${keyCount.toLocaleString()}`,
      `Max depth: ${maxDepth.toLocaleString()}`,
      `Array items: ${arrayItemCount.toLocaleString()}`,
      `Bytes: ${byteSize.toLocaleString()}`,
    ].join(" · ");
  }
  if (btnDownload) btnDownload.disabled = false;
}

function clearStats(): void {
  if (jsonStats) jsonStats.textContent = "No valid JSON to measure yet.";
  if (btnDownload) btnDownload.disabled = true;
}

function processJson(): void {
  if (!inputArea || !outputArea || !statusBadge) return;
  const raw = inputArea.value;

  if (!raw.trim()) {
    outputArea.value = "";
    statusBadge.textContent = "Empty";
    statusBadge.className = "status-badge";
    clearStats();
    return;
  }

  const result = parseAndRepairJson(raw);
  if (result.valid) {
    outputArea.value = result.repairedText;
    statusBadge.textContent = "✓ Valid / Repaired";
    statusBadge.className = "status-badge status-valid";
    showStats(JSON.parse(result.repairedText), result.repairedText);
  } else {
    outputArea.value = `Error: ${result.error || "Unable to repair JSON"}`;
    statusBadge.textContent = "✗ Invalid Syntax";
    statusBadge.className = "status-badge status-invalid";
    clearStats();
  }
}

if (inputArea) {
  inputArea.addEventListener("input", processJson);
}

if (btnRepair) {
  btnRepair.addEventListener("click", processJson);
}

if (btnClear && inputArea) {
  btnClear.addEventListener("click", () => {
    inputArea.value = "";
    processJson();
    inputArea.focus();
  });
}

if (btnMinify && outputArea && statusBadge) {
  btnMinify.addEventListener("click", () => {
    try {
      const parsed = JSON.parse(outputArea.value);
      outputArea.value = JSON.stringify(parsed);
      showStats(parsed, outputArea.value);
    } catch {
      // Ignore if currently displaying error
    }
  });
}

if (btnDownload && outputArea) {
  btnDownload.addEventListener("click", () => {
    const blob = new Blob([outputArea.value], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "repaired.json";
    link.click();
    // Some browsers start the download asynchronously, after click() returns
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}

if (btnCopy && outputArea) {
  btnCopy.addEventListener("click", async () => {
    if (!outputArea.value) return;
    try {
      await navigator.clipboard.writeText(outputArea.value);
      const prev = btnCopy.textContent;
      btnCopy.textContent = "Copied!";
      setTimeout(() => {
        btnCopy.textContent = prev;
      }, 1500);
    } catch {
      // Fallback
    }
  });
}

// Sample initial load
if (inputArea && !inputArea.value) {
  inputArea.value = `{
  name: 'JSONFix',
  purpose: 'Repair malformed JSON',
  features: [
    'trailing commas',
    'single quotes',
    'unquoted keys',
  ],
  ready: True,
};`;
  processJson();
}
