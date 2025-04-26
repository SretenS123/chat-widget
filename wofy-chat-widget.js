(async () => {
    const styles =  `
  .n8n-chat-widget {
    font-family: 'Geist Sans', sans-serif;
    font-size: 14px;
    color: var(--chat--color-font);
  }

  /* Typing dots animation */
  .chat-message.typing {
      display: flex;
      align-items: center;
      gap: 4px;
  }

  .chat-message.typing .dot {
      width: 8px;
      height: 8px;
      background-color: var(--chat--color-primary);
      border-radius: 50%;
      animation: blink 1.4s infinite both;
  }

  .chat-message.typing .dot:nth-child(2) {
      animation-delay: 0.2s;
  }

  .chat-message.typing .dot:nth-child(3) {
      animation-delay: 0.4s;
  }

  @keyframes blink {
      0% { opacity: 0.2; }
      20% { opacity: 1; }
      100% { opacity: 0.2; }
  }
`;


    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://cdn.jsdelivr.net/npm/geist@1.0.0/dist/fonts/geist-sans/style.css';
    document.head.appendChild(fontLink);

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    const config = window.ChatWidgetConfig;

    if (window.N8NChatWidgetInitialized) return;
    window.N8NChatWidgetInitialized = true;

    let currentSessionId = '';

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'n8n-chat-widget';
    widgetContainer.style.setProperty('--n8n-chat-primary-color', config.style.primaryColor);
    widgetContainer.style.setProperty('--n8n-chat-secondary-color', config.style.secondaryColor);
    widgetContainer.style.setProperty('--n8n-chat-background-color', config.style.backgroundColor);
    widgetContainer.style.setProperty('--n8n-chat-font-color', config.style.fontColor);

    const chatContainer = document.createElement('div');
    chatContainer.className = `chat-container${config.style.position === 'left' ? ' position-left' : ''}`;

    const newConversationHTML = `
      <div class="brand-header">
          <img src="${config.branding.logo}" alt="${config.branding.name}">
          <span>${config.branding.name}</span>
          <button class="close-button">×</button>
      </div>
      <div class="new-conversation">
          <h2 class="welcome-text">${config.branding.welcomeText}</h2>
          <button class="new-chat-btn">Send us a message</button>
          <p class="response-text">${config.branding.responseTimeText}</p>
      </div>
  `;

    const chatInterfaceHTML = `
      <div class="chat-interface">
          <div class="brand-header">
              <img src="${config.branding.logo}" alt="${config.branding.name}">
              <span>${config.branding.name}</span>
              <button class="close-button">×</button>
          </div>
          <div class="chat-messages"></div>
          <div class="chat-input">
              <textarea placeholder="Type your message here..." rows="1"></textarea>
              <button type="submit">Send</button>
          </div>
      </div>
  `;

    chatContainer.innerHTML = newConversationHTML + chatInterfaceHTML;

    const toggleButton = document.createElement('button');
    toggleButton.className = `chat-toggle${config.style.position === 'left' ? ' position-left' : ''}`;
    toggleButton.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5L2.5 21.5l4.5-.838A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.476 0-2.886-.313-4.156-.878l-3.156.586.586-3.156A7.962 7.962 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/>
</svg>
`;
    widgetContainer.appendChild(chatContainer);
    widgetContainer.appendChild(toggleButton);
    document.body.appendChild(widgetContainer);

    const newChatBtn = chatContainer.querySelector('.new-chat-btn');
    const chatInterface = chatContainer.querySelector('.chat-interface');
    const messagesContainer = chatContainer.querySelector('.chat-messages');
    const textarea = chatContainer.querySelector('textarea');
    const sendButton = chatContainer.querySelector('button[type="submit"]');

    function generateUUID() {
    return crypto.randomUUID();
}

    async function startNewConversation() {
    currentSessionId = generateUUID();
    const data = [{
    action: "loadPreviousSession",
    sessionId: currentSessionId,
    route: config.webhook.route,
    metadata: { userId: "" }
}];

    try {
    const response = await fetch(config.webhook.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
});

    const responseData = await response.json();
    chatContainer.querySelector('.brand-header').style.display = 'none';
    chatContainer.querySelector('.new-conversation').style.display = 'none';
    chatInterface.classList.add('active');

    // Show Typing Dots
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot typing';
    typingDiv.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    setTimeout(() => {
    messagesContainer.removeChild(typingDiv);

    const botMessageDiv = document.createElement('div');
    botMessageDiv.className = 'chat-message bot';
    botMessageDiv.innerHTML = Array.isArray(responseData) ? responseData[0].output : responseData.output;
    messagesContainer.appendChild(botMessageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}, 800); // Small fake delay for better UX

} catch (error) {
    console.error('Error:', error);
}
}

    async function sendMessage(message) {
    const messageData = {
    action: "sendMessage",
    sessionId: currentSessionId,
    route: config.webhook.route,
    chatInput: message,
    metadata: { userId: "" }
};

    const userMessageDiv = document.createElement('div');
    userMessageDiv.className = 'chat-message user';
    userMessageDiv.textContent = message;
    messagesContainer.appendChild(userMessageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Show Typing Dots
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot typing';
    typingDiv.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
    const response = await fetch(config.webhook.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messageData)
});

    const data = await response.json();

    messagesContainer.removeChild(typingDiv);

    const botMessageDiv = document.createElement('div');
    botMessageDiv.className = 'chat-message bot';
    botMessageDiv.innerHTML = Array.isArray(data) ? data[0].output : data.output;
    messagesContainer.appendChild(botMessageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
} catch (error) {
    console.error('Error:', error);
}
}

    newChatBtn.addEventListener('click', startNewConversation);

    sendButton.addEventListener('click', () => {
    const message = textarea.value.trim();
    if (message) {
    sendMessage(message);
    textarea.value = '';
}
});

    textarea.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const message = textarea.value.trim();
    if (message) {
    sendMessage(message);
    textarea.value = '';
}
}
});

    toggleButton.addEventListener('click', () => {
    chatContainer.classList.toggle('open');
});

    const closeButtons = chatContainer.querySelectorAll('.close-button');
    closeButtons.forEach(button => {
    button.addEventListener('click', () => {
    chatContainer.classList.remove('open');
});
});
})();
