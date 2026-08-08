// Use the local backend during development and the public API on the deployed site.
window.__ANAM_CARA_API_URL__ = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? ''
  : 'https://d3l8dfa433r6oo.cloudfront.net';
