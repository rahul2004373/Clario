(function () {
  var KEY = document.currentScript && document.currentScript.getAttribute("data-key");
  if (!KEY) {
    console.error("[Clairo Widget] Missing data-key attribute.");
    return;
  }

  var API_BASE = "http://localhost:4000/api";

  var state = {
    open: false,
    config: null,
    sessionId: null,
    messages: [],
    sending: false,
    creatingSession: false,
  };

  /* ---------- API helpers ---------- */
  function fetchJSON(url, opts) {
    return fetch(url, opts || {}).then(function (r) {
      if (!r.ok) return r.json().then(function (b) { throw new Error(b.error || "Request failed"); });
      return r.json();
    });
  }

  function getConfig() {
    return fetchJSON(API_BASE + "/public/widget-config/" + encodeURIComponent(KEY));
  }

  function createSession() {
    return fetchJSON(API_BASE + "/public/session", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": KEY },
    });
  }

  function endSession(sid) {
    return fetch(API_BASE + "/public/session/" + encodeURIComponent(sid), {
      method: "DELETE",
      headers: { "x-api-key": KEY },
    }).catch(function () {});
  }

  function sendMessage(sid, text, onChunk, onDone, onError) {
    return fetch(API_BASE + "/public/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": KEY },
      body: JSON.stringify({ sessionId: sid, message: text }),
    }).then(function (res) {
      if (!res.ok) {
        return res.json().then(function (b) { throw new Error(b.error || "Chat failed"); });
      }
      if (!res.body) {
        onError("ReadableStream not supported");
        return;
      }
      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var buffer = "";

      function read() {
        reader.read().then(function (result) {
          if (result.done) {
            if (buffer) parseLine(buffer);
            onDone();
            return;
          }
          buffer += decoder.decode(result.value, { stream: true });
          var parts = buffer.split("\n");
          buffer = parts.pop() || "";
          for (var i = 0; i < parts.length; i++) {
            parseLine(parts[i]);
          }
          read();
        }).catch(onError);
      }

      function parseLine(line) {
        var trimmed = line.trim();
        if (!trimmed) return;
        if (trimmed.startsWith("data: ")) {
          processData(trimmed.slice(6));
        } else if (trimmed.startsWith("data:")) {
          processData(trimmed.slice(5));
        }
      }

      function processData(data) {
        if (data === "[DONE]") return;
        try {
          var parsed = JSON.parse(data);
          var chunk = parsed.content || parsed.text;
          if (chunk) onChunk(chunk);
          else if (parsed.error) onError(parsed.error);
        } catch (e) {}
      }

      read();
    }).catch(onError);
  }

  /* ---------- DOM Builder ---------- */
  var host = document.createElement("div");
  host.id = "clairo-widget-host";
  var root = host.attachShadow({ mode: "open" });
  document.body.appendChild(host);

  var styles = document.createElement("style");
  styles.textContent = `
    .cw * { box-sizing: border-box; margin: 0; padding: 0; }
    .cw { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .cw-container { position: fixed; bottom: 24px; right: 24px; z-index: 2147483647; }

    /* Bubble */
    .cw-bubble {
      width: 56px; height: 56px; border-radius: 50%;
      border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2); transition: opacity 0.25s, transform 0.25s;
      position: relative; z-index: 2; background: #000000;
    }
    .cw-bubble svg { width: 24px; height: 24px; fill: none; stroke: #fff; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    /* Popup */
    .cw-popup {
      position: absolute; right: 0; bottom: calc(100% + 16px);
      width: 380px; height: 580px; max-height: calc(100vh - 112px);
      border-radius: 18px; overflow: hidden; display: flex; flex-direction: column;
      box-shadow: 0 8px 40px rgba(0,0,0,0.25);
      opacity: 0; transform: scale(0.92) translateY(8px); pointer-events: none;
      transition: opacity 0.25s, transform 0.25s;
      transform-origin: bottom right; background: #ffffff;
    }
    .cw-popup-open { opacity: 1; transform: scale(1) translateY(0); pointer-events: auto; }

    /* Header */
    .cw-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; color: #fff; flex-shrink: 0; }
    .cw-header-left { display: flex; align-items: center; gap: 8px; }
    .cw-avatar { width: 24px; height: 24px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 12px; }
    .cw-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
    .cw-avatar svg { width: 12px; height: 12px; stroke: #fff; fill: none; stroke-width: 2; }
    .cw-name { font-size: 13px; font-weight: 600; letter-spacing: -0.01em; }
    .cw-header-actions { display: flex; gap: 2px; }
    .cw-header-btn {
      width: 24px; height: 24px; border-radius: 6px; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      background: transparent; color: rgba(255,255,255,0.7); transition: background 0.15s;
    }
    .cw-header-btn:hover { background: rgba(255,255,255,0.1); }
    .cw-header-btn svg { width: 12px; height: 12px; stroke: currentColor; fill: none; stroke-width: 2; }

    /* Messages */
    .cw-messages { flex: 1; overflow-y: auto; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
    .cw-message { max-width: 85%; border-radius: 16px; padding: 10px 14px; font-size: 13px; line-height: 1.5; }
    .cw-message-user { align-self: flex-end; color: #fff; }
    .cw-message-assistant { align-self: flex-start; }
    .cw-message-assistant-light { background: #F4F4F5; color: #0A0A0A; }
    .cw-message-assistant-dark { background: #27272A; color: #E4E4E7; }
    .cw-message-assistant p { margin-bottom: 6px; }
    .cw-message-assistant p:last-child { margin-bottom: 0; }
    .cw-message-assistant ul, .cw-message-assistant ol { margin: 4px 0; padding-left: 16px; }
    .cw-message-assistant li { margin-bottom: 2px; }
    .cw-message-assistant code { background: rgba(0,0,0,0.15); padding: 1px 4px; border-radius: 3px; font-size: 12px; font-family: monospace; }
    .cw-message-assistant pre { background: rgba(0,0,0,0.15); padding: 10px; border-radius: 8px; overflow-x: auto; font-size: 12px; margin: 6px 0; }

    /* Typing */
    .cw-typing { display: flex; align-items: center; gap: 4px; padding: 10px 14px; }
    .cw-typing span { width: 6px; height: 6px; border-radius: 50%; background: currentColor; opacity: 0.5; animation: cwBounce 1.2s infinite; }
    .cw-typing span:nth-child(2) { animation-delay: 0.2s; }
    .cw-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes cwBounce { 0%,80%,100% { transform: translateY(0); } 40% { transform: translateY(-4px); } }

    /* Input */
    .cw-input-wrap { flex-shrink: 0; padding: 0 12px 12px; }
    .cw-input-row {
      display: flex; align-items: center; gap: 8px; border-radius: 14px;
      padding: 8px 12px;
    }
    .cw-input-row-light { background: #F4F4F5; }
    .cw-input-row-dark { background: #27272A; }
    .cw-input { flex: 1; border: none; outline: none; background: transparent; font-size: 13px; }
    .cw-input-light { color: #0A0A0A; }
    .cw-input-dark { color: #E4E4E7; }
    .cw-input::placeholder { color: #A1A1AA; }
    .cw-send-btn {
      width: 28px; height: 28px; border-radius: 50%; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      transition: transform 0.15s;
    }
    .cw-send-btn:hover { transform: scale(1.1); }
    .cw-send-btn:active { transform: scale(0.95); }
    .cw-send-btn svg { width: 11px; height: 11px; stroke: #fff; fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }

    /* Footer */
    .cw-footer { flex-shrink: 0; text-align: center; font-size: 10px; color: #52525B; padding: 0 16px 12px; }

    /* Welcome */
    .cw-welcome { text-align: center; padding: 2px 16px 0; font-size: 10px; color: #52525B; }
  `;
  root.appendChild(styles);

  var container = document.createElement("div");
  container.className = "cw cw-container";
  root.appendChild(container);

  /* ---------- Bubble ---------- */
  var bubble = document.createElement("button");
  bubble.className = "cw-bubble";
  bubble.innerHTML = '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  container.appendChild(bubble);

  /* ---------- Popup ---------- */
  var popup = document.createElement("div");
  popup.className = "cw-popup";
  container.appendChild(popup);

  var header = document.createElement("div");
  header.className = "cw-header";
  popup.appendChild(header);

  var headerLeft = document.createElement("div");
  headerLeft.className = "cw-header-left";
  header.appendChild(headerLeft);

  var avatar = document.createElement("div");
  avatar.className = "cw-avatar";
  avatar.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>';
  headerLeft.appendChild(avatar);

  var nameEl = document.createElement("span");
  nameEl.className = "cw-name";
  nameEl.textContent = "Chatbot";
  headerLeft.appendChild(nameEl);

  var headerActions = document.createElement("div");
  headerActions.className = "cw-header-actions";
  header.appendChild(headerActions);

  var resetBtn = document.createElement("button");
  resetBtn.className = "cw-header-btn";
  resetBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>';
  resetBtn.title = "New chat";
  headerActions.appendChild(resetBtn);

  var closeBtn = document.createElement("button");
  closeBtn.className = "cw-header-btn";
  closeBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
  closeBtn.title = "Close";
  headerActions.appendChild(closeBtn);

  var messagesEl = document.createElement("div");
  messagesEl.className = "cw-messages";
  popup.appendChild(messagesEl);

  var inputWrap = document.createElement("div");
  inputWrap.className = "cw-input-wrap";
  popup.appendChild(inputWrap);

  var inputRow = document.createElement("div");
  inputRow.className = "cw-input-row";
  inputWrap.appendChild(inputRow);

  var inputEl = document.createElement("input");
  inputEl.className = "cw-input";
  inputEl.type = "text";
  inputEl.placeholder = "Type a message...";
  inputRow.appendChild(inputEl);

  var sendBtn = document.createElement("button");
  sendBtn.className = "cw-send-btn";
  sendBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="m22 2-11 20-4-9-9-4Z"/></svg>';
  inputRow.appendChild(sendBtn);

  var footerEl = document.createElement("div");
  footerEl.className = "cw-footer";
  footerEl.textContent = "Powered by Clairo";
  popup.appendChild(footerEl);

  var welcomeEl = document.createElement("div");
  welcomeEl.className = "cw-welcome";
  welcomeEl.textContent = "Ask me anything!";
  popup.appendChild(welcomeEl);

  /* ---------- State & render ---------- */
  function applyConfig(cfg) {
    state.config = cfg;
    var isDark = cfg.theme === "DARK";
    var accent = cfg.primaryColor || "#000000";
    var bubbleColor = cfg.bubbleColor || "#000000";

    bubble.style.backgroundColor = bubbleColor;

    header.style.backgroundColor = accent;
    header.style.color = "#fff";

    inputRow.className = "cw-input-row " + (isDark ? "cw-input-row-dark" : "cw-input-row-light");
    inputEl.className = "cw-input " + (isDark ? "cw-input-dark" : "cw-input-light");

    sendBtn.style.backgroundColor = accent;

    if (isDark) {
      popup.style.backgroundColor = "#18181B";
      messagesEl.style.backgroundColor = "transparent";
    } else {
      popup.style.backgroundColor = "#fff";
      messagesEl.style.backgroundColor = "transparent";
    }

    if (cfg.displayName) nameEl.textContent = cfg.displayName;
    if (cfg.profilePictureUrl) {
      avatar.innerHTML = '<img src="' + cfg.profilePictureUrl.replace(/"/g, "&quot;") + '" alt="" onerror="this.style.display=\'none\';this.parentNode.innerHTML=\'<svg viewBox=&quot;0 0 24 24&quot;><path d=&quot;M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z&quot;/><path d=&quot;M20 21a8 8 0 1 0-16 0&quot;/></svg>\'">';
    }
    if (cfg.footerText) footerEl.textContent = cfg.footerText;
    if (cfg.messagePlaceholder) inputEl.placeholder = cfg.messagePlaceholder;

    /* Show welcome messages */
    renderMessages();
  }

  function renderMessages() {
    var frag = document.createDocumentFragment();
    var msgs = state.messages;
    var cfg = state.config;
    var isDark = cfg && cfg.theme === "DARK";

    if (msgs.length === 0 && cfg && cfg.initialMessages) {
      cfg.initialMessages.forEach(function (msg) {
        var div = document.createElement("div");
        div.className = "cw-message " + (isDark ? "cw-message-assistant-dark" : "cw-message-assistant-light");
        div.textContent = msg;
        frag.appendChild(div);
      });
    }

    for (var i = 0; i < msgs.length; i++) {
      var msg = msgs[i];
      var div = document.createElement("div");
      if (msg.role === "USER") {
        div.className = "cw-message cw-message-user";
        div.style.backgroundColor = (cfg && cfg.primaryColor) || "#000000";
        div.textContent = msg.content;
      } else {
        var showTyping = !msg.content && state.sending && i === msgs.length - 1;
        div.className = "cw-message " + (isDark ? "cw-message-assistant-dark" : "cw-message-assistant-light");
        if (showTyping) {
          var typing = '<div class="cw-typing"><span></span><span></span><span></span></div>';
          div.innerHTML = typing;
        } else if (msg.content) {
          div.innerHTML = simpleMarkdown(msg.content);
        } else {
          div.textContent = "\u2026";
        }
      }
      frag.appendChild(div);
    }

    messagesEl.innerHTML = "";
    messagesEl.appendChild(frag);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function simpleMarkdown(text) {
    return text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/^### (.+)$/gm, '<h3 style="font-size:13px;font-weight:600;margin:6px 0 4px">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 style="font-size:14px;font-weight:700;margin:8px 0 4px">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 style="font-size:15px;font-weight:700;margin:10px 0 4px">$1</h1>')
      .replace(/\n/g, '<br>');
  }

  function toggleOpen() {
    state.open = !state.open;
    if (state.open) {
      popup.classList.add("cw-popup-open");
      welcomeEl.style.display = state.messages.length === 0 ? "block" : "none";
    } else {
      popup.classList.remove("cw-popup-open");
    }
  }

  function getOrCreateSession() {
    if (state.sessionId) return Promise.resolve(state.sessionId);
    if (state.sessionPromise) return state.sessionPromise;
    state.sessionPromise = createSession().then(function (res) {
      state.sessionId = res.sessionId;
      state.sessionPromise = null;
      return state.sessionId;
    }).catch(function (err) {
      state.sessionPromise = null;
      throw err;
    });
    return state.sessionPromise;
  }

  function handleSend(text) {
    if (!text.trim() || state.sending) return;
    state.sending = true;

    state.messages.push({ role: "USER", content: text });
    state.messages.push({ role: "ASSISTANT", content: "" });
    renderMessages();

    getOrCreateSession().then(function (sid) {
      var streamText = "";
      sendMessage(sid, text,
        function (chunk) {
          streamText += chunk;
          var msgs = state.messages;
          var last = msgs[msgs.length - 1];
          if (last && last.role === "ASSISTANT") {
            last.content = streamText;
            renderMessages();
          }
        },
        function () {
          state.sending = false;
          if (!streamText) {
            state.messages.pop();
          }
          renderMessages();
        },
        function () {
          state.sending = false;
          var msgs = state.messages;
          var last = msgs[msgs.length - 1];
          if (last && last.role === "ASSISTANT" && !last.content) {
            msgs.pop();
          }
          renderMessages();
        }
      );
    }).catch(function () {
      state.sending = false;
      var msgs = state.messages;
      var last = msgs[msgs.length - 1];
      if (last && last.role === "ASSISTANT" && !last.content) {
        msgs.pop();
      }
      renderMessages();
    });
  }

  function resetChat() {
    if (state.sessionId) {
      endSession(state.sessionId);
    }
    state.sessionId = null;
    state.messages = [];
    state.sending = false;
    state.sessionPromise = null;
    renderMessages();
  }

  /* ---------- Events ---------- */
  bubble.addEventListener("click", toggleOpen);
  closeBtn.addEventListener("click", toggleOpen);
  resetBtn.addEventListener("click", resetChat);

  sendBtn.addEventListener("click", function () {
    handleSend(inputEl.value);
    inputEl.value = "";
  });
  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputEl.value);
      inputEl.value = "";
    }
  });

  /* ---------- Init ---------- */
  getConfig().then(function (cfg) {
    if (!cfg.isActive) return;
    applyConfig(cfg);
  }).catch(function () {});
})();
