// Connect to SSE for console output
if (typeof EventSource !== 'undefined') {
  const source = new EventSource('/events');
  source.onmessage = function(e) {
    const out = document.getElementById('consoleOutput');
    if (out) {
      out.textContent = e.data;
    }
  };
}
