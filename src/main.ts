import "./style.css";
import { describeResult, getJsonStats, parseAndRepairJson } from "./repair";

const inputArea = document.getElementById("input-json") as HTMLTextAreaElement | null;
const outputArea = document.getElementById("output-json") as HTMLTextAreaElement | null;
const statusBadge = document.getElementById("status-badge");
const btnRepair = document.getElementById("btn-repair");
const btnClear = document.getElementById("btn-clear");
const btnCopy = document.getElementById("btn-copy");
const btnMinify = document.getElementById("btn-minify");
const btnDownload = document.getElementById("btn-download") as HTMLButtonElement | null;
const jsonStats = document.getElementById("json-stats");
const liveStatus = document.getElementById("live-status");

let announceTimer: ReturnType<typeof setTimeout> | undefined;

// Delayed so a screen reader isn't interrupted on every keystroke while typing
function announce(message: string): void {
  clearTimeout(announceTimer);
  announceTimer = setTimeout(() => {
    if (liveStatus) liveStatus.textContent = message;
  }, 400);
}

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

function processJson(): string {
  if (!inputArea || !outputArea || !statusBadge) return "";
  const raw = inputArea.value;

  if (!raw.trim()) {
    outputArea.value = "";
    statusBadge.textContent = "Empty";
    statusBadge.className = "status-badge";
    inputArea.removeAttribute("aria-invalid");
    clearStats();
    return "Input is empty.";
  }

  const result = parseAndRepairJson(raw);
  inputArea.setAttribute("aria-invalid", String(!result.valid));
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
  return describeResult(result);
}

if (inputArea) {
  inputArea.addEventListener("input", () => announce(processJson()));
}

if (btnRepair) {
  btnRepair.addEventListener("click", () => announce(processJson()));
}

if (btnClear && inputArea) {
  btnClear.addEventListener("click", () => {
    inputArea.value = "";
    announce(processJson());
    inputArea.focus();
  });
}

if (btnMinify && outputArea && statusBadge) {
  btnMinify.addEventListener("click", () => {
    try {
      const parsed = JSON.parse(outputArea.value);
      outputArea.value = JSON.stringify(parsed);
      showStats(parsed, outputArea.value);
      announce("JSON minified.");
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
      announce("Output copied to clipboard.");
      setTimeout(() => {
        btnCopy.textContent = prev;
        // Empty the region so copying again is announced again
        if (liveStatus) liveStatus.textContent = "";
      }, 1500);
    } catch {
      announce("Could not copy the output.");
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
