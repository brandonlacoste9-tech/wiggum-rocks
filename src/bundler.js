export function bundleVFS(vfs) {
  const code = vfs['App.jsx'] || '';
  return `
    <html>
      <body>
        <script>
          window.onerror = (msg, url, line) => {
            window.parent.postMessage({ type: 'error', error: { message: msg, line } }, '*');
          };
        </script>
        <script type="module">${code}</script>
      </body>
    </html>
  `;
}

export function createSandbox(html) {
  const iframe = document.createElement('iframe');
  iframe.src = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  return iframe;
}
