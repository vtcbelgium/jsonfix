// Sovereign Accessible Toast Engine
export function showToast(message: string, durationMs = 3200) {
  let container = document.getElementById('sovereign-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'sovereign-toast-container';
    container.className = 'sovereign-toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'sovereign-toast';
  toast.innerHTML = `<span class="toast-indicator">●</span><span class="toast-body">${message}</span>`;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('is-visible');
  });

  setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 250);
  }, durationMs);
}

(window as unknown as { showToast?: typeof showToast }).showToast = showToast;
