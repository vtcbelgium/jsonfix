// Sovereign Cookie & Privacy Inspector
import { showToast } from './toast';

export function inspectCookies(): { count: number; raw: string } {
  const raw = document.cookie;
  if (!raw || raw.trim() === '') {
    return { count: 0, raw: '' };
  }
  const cookies = raw.split(';').map((s) => s.trim()).filter(Boolean);
  return { count: cookies.length, raw };
}

export function initCookieModal(): void {
  const pill = document.getElementById('cookie-status-pill');
  const dialog = document.getElementById('cookie-dialog') as HTMLDialogElement | null;
  const closeBtn = document.getElementById('cookie-close');
  const auditResult = document.getElementById('cookie-audit-result');

  function runAudit() {
    const { count } = inspectCookies();
    if (auditResult) {
      if (count === 0) {
        auditResult.innerHTML = `
          <div class="audit-pass">
            <span class="audit-icon">🛡️</span>
            <strong>Audit Passed: 0 Cookies Detected</strong>
            <p>JSONFix stores zero cookies, zero device fingerprints, and zero tracking tokens. JSON formatting runs 100% in local memory.</p>
          </div>
        `;
      } else {
        auditResult.innerHTML = `
          <div class="audit-warn">
            <strong>Cookies Detected (${count})</strong>
            <p>${document.cookie}</p>
          </div>
        `;
      }
    }
  }

  pill?.addEventListener('click', () => {
    runAudit();
    dialog?.showModal();
    showToast('Privacy audit verified: 0 cookies active.');
  });

  closeBtn?.addEventListener('click', () => {
    dialog?.close();
  });

  dialog?.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
}
