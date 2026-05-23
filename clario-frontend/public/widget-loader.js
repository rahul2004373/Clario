(function() {
  // Prevent duplicate script execution
  if (window.__ClairoWidgetLoaded) return;
  window.__ClairoWidgetLoaded = true;

  // 1. Resolve Script Tag and Attributes
  const currentScript = document.currentScript || (function() {
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  const token = currentScript.getAttribute('data-widget-token');
  if (!token) {
    console.error('[Clairo Widget] Missing required data-widget-token attribute.');
    return;
  }

  // Default Bases mapping (fall back to localhost for local testing)
  const apiBase = currentScript.getAttribute('data-api-base') || 'http://localhost:3000/api/v1';
  
  let frameBase = currentScript.getAttribute('data-frame-base');
  if (!frameBase) {
    frameBase = (window.location.origin && window.location.origin !== 'null' && window.location.origin.startsWith('http'))
      ? window.location.origin
      : 'http://localhost:5173';
  }

  // Custom Override Attributes
  const themeColor = currentScript.getAttribute('data-theme-color') || '#3b82f6';
  const title = currentScript.getAttribute('data-title') || 'Support Chat';
  const launcherText = currentScript.getAttribute('data-launcher-text') || 'Chat with us';
  const welcomeMessage = currentScript.getAttribute('data-welcome-message') || 'Hello! How can I help you today?';
  const position = currentScript.getAttribute('data-position') || 'bottom-right'; // bottom-right | bottom-left
  const borderRadius = currentScript.getAttribute('data-border-radius') || '12px';

  // 2. Inject CSS Reset for isolated elements
  const style = document.createElement('style');
  style.innerHTML = `
    .clairo-widget-container {
      position: fixed;
      bottom: 20px;
      z-index: 2147483647;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: ${position === 'bottom-right' ? 'flex-end' : 'flex-start'};
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .clairo-widget-container.pos-right { right: 20px; }
    .clairo-widget-container.pos-left { left: 20px; }

    /* Launcher Button Styling */
    .clairo-launcher {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 18px;
      border-radius: 9999px;
      border: none;
      color: white;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: transform 0.2s ease, opacity 0.2s ease;
    }
    .clairo-launcher:hover { transform: scale(1.03); opacity: 0.95; }
    .clairo-launcher:active { transform: scale(0.97); }

    /* Iframe Wrapper Styling */
    .clairo-iframe-wrapper {
      width: 350px;
      height: 0px;
      max-height: 520px;
      opacity: 0;
      visibility: hidden;
      border-radius: ${borderRadius};
      overflow: hidden;
      box-shadow: 0 12px 36px rgba(0,0,0,0.15);
      border: 1px border-border;
      margin-bottom: 16px;
      background: white;
      transition: opacity 0.25s ease, visibility 0.25s ease, height 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .clairo-iframe-wrapper.open {
      height: 520px;
      opacity: 1;
      visibility: visible;
    }
    .clairo-iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    }
  `;
  document.head.appendChild(style);

  // 3. Create Container
  const container = document.createElement('div');
  container.className = `clairo-widget-container ${position === 'bottom-right' ? 'pos-right' : 'pos-left'}`;
  document.body.appendChild(container);

  // 4. Create iframe Wrapper & iframe
  const frameWrapper = document.createElement('div');
  frameWrapper.className = 'clairo-iframe-wrapper';
  
  const iframe = document.createElement('iframe');
  iframe.className = 'clairo-iframe';
  iframe.src = `${frameBase}/widget/${token}`;
  iframe.allow = "clipboard-write";
  
  frameWrapper.appendChild(iframe);
  container.appendChild(frameWrapper);

  // 5. Create Launcher
  const launcher = document.createElement('button');
  launcher.className = 'clairo-launcher';
  launcher.style.backgroundColor = themeColor;
  launcher.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
    <span>${launcherText}</span>
  `;
  container.appendChild(launcher);

  // 6. State management
  let isOpen = false;

  function toggleWidget() {
    isOpen = !isOpen;
    if (isOpen) {
      frameWrapper.classList.add('open');
      launcher.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        <span>Close</span>
      `;
      // Notify iframe that it was opened (for active scrolls, focuses)
      iframe.contentWindow.postMessage({ type: 'CLAIRO_WIDGET_OPEN' }, '*');
    } else {
      frameWrapper.classList.remove('open');
      launcher.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>${launcherText}</span>
      `;
    }
  }

  launcher.addEventListener('click', toggleWidget);

  // 7. PostMessage Handler for sync & control
  window.addEventListener('message', function(event) {
    if (event.origin !== frameBase) return;

    const data = event.data;
    if (!data || typeof data !== 'object') return;

    switch(data.type) {
      case 'CLAIRO_IFRAME_READY':
        // Once the iframe is mounted, sync overrides
        iframe.contentWindow.postMessage({
          type: 'CLAIRO_SYNC_CONFIG',
          config: {
            themeColor,
            title,
            welcomeMessage,
            apiBase,
            borderRadius
          }
        }, '*');
        break;
      case 'CLAIRO_IFRAME_CLOSE':
        if (isOpen) toggleWidget();
        break;
    }
  });

})();
