window.addEventListener('DOMContentLoaded', () => {
  if (!window.location.href.startsWith('http://')) {
    const base = document.createElement('base');
    const pathParts = window.location.pathname.split('/');
    pathParts.pop();
    base.href = `file://${pathParts.join('/')}/`;
    document.head.prepend(base);
  }
});
