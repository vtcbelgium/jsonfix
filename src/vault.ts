// Sovereign Client-Side Vault — Local Account & Data Boundary
import { showToast } from './toast';

export function calculateStorageUsage(): { bytes: number; formatted: string } {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const val = localStorage.getItem(key) || '';
      total += (key.length + val.length) * 2;
    }
  }
  const formatted = total < 1024 ? `${total} bytes` : `${(total / 1024).toFixed(1)} KB`;
  return { bytes: total, formatted };
}

export function exportVaultData(): void {
  const data: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('othrys-')) {
      data[key] = localStorage.getItem(key) || '';
    }
  }

  const exportPayload = {
    app: 'JSONFix',
    sovereignFleet: 'OTHRYS',
    exportedAt: new Date().toISOString(),
    data
  };

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `jsonfix-vault-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  showToast('Vault backup exported successfully.');
}

export function importVaultData(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed.data !== 'object') {
      showToast('Invalid vault backup file.');
      return false;
    }
    for (const [key, val] of Object.entries(parsed.data)) {
      if (typeof val === 'string' && key.startsWith('othrys-')) {
        localStorage.setItem(key, val);
      }
    }
    showToast('Vault restored. Reloading settings…');
    setTimeout(() => window.location.reload(), 800);
    return true;
  } catch {
    showToast('Failed to parse backup JSON.');
    return false;
  }
}

export function wipeVault(): void {
  const count = localStorage.length;
  localStorage.clear();
  sessionStorage.clear();
  showToast(`Local Vault wiped (${count} keys cleared). Privacy preserved.`);
  setTimeout(() => window.location.reload(), 1000);
}

export function initVaultDrawer(): void {
  const vaultBtn = document.getElementById('vault-pill');
  const modal = document.getElementById('vault-dialog') as HTMLDialogElement | null;
  const closeBtn = document.getElementById('vault-close');
  const exportBtn = document.getElementById('vault-export-btn');
  const wipeBtn = document.getElementById('vault-wipe-btn');
  const importInput = document.getElementById('vault-import-input') as HTMLInputElement | null;
  const usageDisplay = document.getElementById('vault-usage-stat');

  function updateUsage() {
    if (usageDisplay) {
      const { formatted } = calculateStorageUsage();
      usageDisplay.textContent = formatted;
    }
  }

  vaultBtn?.addEventListener('click', () => {
    updateUsage();
    modal?.showModal();
  });

  closeBtn?.addEventListener('click', () => modal?.close());
  exportBtn?.addEventListener('click', exportVaultData);
  wipeBtn?.addEventListener('click', wipeVault);

  importInput?.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) importVaultData(content);
      };
      reader.readAsText(file);
    }
  });

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.close();
  });
}
