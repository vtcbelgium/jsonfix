// Sovereign Dialog Controllers (About & Settings)
export function initModals(): void {
  // About Dialog
  const aboutBtn = document.getElementById('nav-about-btn');
  const footerAboutLink = document.getElementById('footer-about-link');
  const aboutDialog = document.getElementById('about-dialog') as HTMLDialogElement | null;
  const aboutClose = document.getElementById('about-close');

  const openAbout = (e: Event) => {
    e.preventDefault();
    aboutDialog?.showModal();
  };

  aboutBtn?.addEventListener('click', openAbout);
  footerAboutLink?.addEventListener('click', openAbout);
  aboutClose?.addEventListener('click', () => aboutDialog?.close());
  aboutDialog?.addEventListener('click', (e) => {
    if (e.target === aboutDialog) aboutDialog.close();
  });

  // Settings Dialog
  const settingsBtn = document.getElementById('nav-settings-btn');
  const settingsDialog = document.getElementById('settings-dialog') as HTMLDialogElement | null;
  const settingsClose = document.getElementById('settings-close');

  settingsBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    settingsDialog?.showModal();
  });
  settingsClose?.addEventListener('click', () => settingsDialog?.close());
  settingsDialog?.addEventListener('click', (e) => {
    if (e.target === settingsDialog) settingsDialog.close();
  });
}
