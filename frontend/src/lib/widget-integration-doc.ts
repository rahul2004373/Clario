export const WIDGET_INTEGRATION_MARKDOWN = `# Clario Chatbot Widget - Integration Guide for LLMs


## Overview
Clario is an embeddable AI chatbot. It uses a single \`<script>\` tag and requires a \`data-key\` attribute.

## 1. HTML / Vanilla JS Implementation
Place this snippet at the bottom of your \`<body>\` tag:

\`\`\`html
<!-- Clario Chatbot Widget -->
<script src="http://localhost:3000/widget.js" data-key="YOUR_KEY" defer></script>
\`\`\`

## 2. React / Next.js Implementation
Create a \`ClarioWidget\` component using a standard \`useEffect\` for broad compatibility:

\`\`\`jsx
import { useEffect } from 'react';

export default function ClarioWidget({ apiKey }) {
  useEffect(() => {
    const id = 'clario-widget-script';
    if (document.getElementById(id)) return;

    const script = document.createElement('script');
    script.id = id;
    script.src = 'http://localhost:3000/widget.js';
    script.setAttribute('data-key', apiKey);
    script.defer = true;

    document.body.appendChild(script);

    return () => {
      document.getElementById(id)?.remove();
    };
  }, [apiKey]);

  return null;
}
\`\`\`
`;
