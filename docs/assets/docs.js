const menu = document.querySelector('.menu');
const sidebar = document.querySelector('.sidebar');

menu?.addEventListener('click', () => {
  sidebar?.classList.toggle('open');
});

sidebar?.addEventListener('click', (event) => {
  if (event.target instanceof HTMLAnchorElement && window.innerWidth <= 820) {
    sidebar.classList.remove('open');
  }
});

for (const pre of document.querySelectorAll('.prose pre')) {
  const button = document.createElement('button');
  button.className = 'copy';
  button.type = 'button';
  button.textContent = 'copy';
  button.addEventListener('click', async () => {
    const code = pre.querySelector('code');
    if (!code) return;
    await navigator.clipboard.writeText(code.innerText);
    button.textContent = 'copied';
    setTimeout(() => { button.textContent = 'copy'; }, 1200);
  });
  pre.append(button);
}
