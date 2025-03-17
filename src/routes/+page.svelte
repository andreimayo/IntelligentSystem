<script>
  import { onMount } from 'svelte';
  
  // Define the structure of a chat message
  // Using JS comments for type definitions since we're not using TypeScript Svelte
  /**
   * @typedef {Object} ChatMessage
   * @property {'user' | 'bot'} type - The type of message (user or bot)
   * @property {string} content - The message content
   * @property {boolean} [error] - Optional flag for error messages
   */
  
  let message = '';
  let response = '';
  let loading = false;
  
  /**
   * @type {ChatMessage[]}
   */
  let chatHistory = [];
  
  // Add animation when component mounts
  onMount(() => {
    const chatCard = document.querySelector('.chat-card');
    if (chatCard) {
      chatCard.classList.add('fade-in');
    }
  });
  
  async function handleSubmit() {
    if (!message.trim()) return;
    
    const userMessage = message;
    // Explicitly define the type of the new message
    /** @type {ChatMessage} */
    const newUserMessage = { type: 'user', content: userMessage };
    chatHistory = [...chatHistory, newUserMessage];
    message = '';
    
    loading = true;
    try {
      // Send the entire chat history to the backend
      const res = await fetch('http://localhost:5173/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: userMessage,
          history: chatHistory.map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
        })
      });
      
      const data = await res.json();
      response = data.response;
      
      // Explicitly define the type of the bot response
      /** @type {ChatMessage} */
      const botResponse = { type: 'bot', content: data.response };
      chatHistory = [...chatHistory, botResponse];
    } catch (error) {
      console.error('Error sending message:', error);
      response = 'Sorry, there was an error processing your request.';
      
      // Explicitly define the type of the error message
      /** @type {ChatMessage} */
      const errorMessage = { type: 'bot', content: response, error: true };
      chatHistory = [...chatHistory, errorMessage];
    } finally {
      loading = false;
    }
  }
</script>

<div class="container">
  <div class="chat-card">
    <div class="card-header">
      <div class="header-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <h2 class="card-title">Chat with AI</h2>
    </div>
    
    <div class="card-content">
      <div class="chat-area" class:empty={chatHistory.length === 0}>
        {#if chatHistory.length === 0}
          <div class="placeholder-container">
            <div class="placeholder-icon">💬</div>
            <p class="placeholder">Ask about Myself (name, age, birth date, hobbies, or favorite foods!)</p>
          </div>
        {:else}
          {#each chatHistory as message, i}
            <div 
              class="message-bubble {message.type}" 
              class:error={message.error}
              style="animation-delay: {i * 0.1}s"
            >
              <div class="message-avatar">
                {message.type === 'user' ? '👤' : '🤖'}
              </div>
              <div class="message-content">
                {message.content}
              </div>
            </div>
          {/each}
        {/if}
        
        {#if loading}
          <div class="message-bubble bot loading">
            <div class="message-avatar">🤖</div>
            <div class="message-content">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        {/if}
      </div>
      
      <form on:submit|preventDefault={handleSubmit} class="input-form">
        <input 
          type="text" 
          bind:value={message} 
          placeholder="Type your message..." 
          class="message-input"
          disabled={loading}
        />
        <button type="submit" class="send-button" disabled={loading || !message.trim()}>
          {#if loading}
            <div class="spinner"></div>
          {:else}
            Send
          {/if}
        </button>
      </form>
    </div>
  </div>
</div>

<style>
  /* Variables for theming */
  :root {
    --primary: #636364;
    --primary-black: #050505;
    --primary-dark: #424142;
    --accent: #f0fdfa;
    --text: #1e293b;
    --text-light: #64748b;
    --background: #aaa8a8;
    --card-bg: #ffffff;
    --border: #e2e8f0;
    --error: #ef4444;
    --shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  /* Global styles */
  :global(body) {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: var(--background);
    color: var(--text);
    line-height: 1.5;
  }

  /* Container */
  .container {
    max-width: 800px;
    margin: 2rem auto;
    padding: 0 1rem;
  }
  
  /* Card */
  .chat-card {
    background: var(--card-bg);
    border-radius: 16px;
    box-shadow: var(--shadow);
    overflow: hidden;
    transform: translateY(20px);
    opacity: 0;
    transition: all 0.3s ease;
  }
  
  .chat-card.fade-in {
    transform: translateY(0);
    opacity: 1;
  }
  
  /* Card header */
  .card-header {
    padding: 1.5rem;
    background: linear-gradient(to right, var(--primary), var(--primary));
    color: white;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .header-dots {
    position: absolute;
    left: 1.5rem;
    display: flex;
    gap: 6px;
  }
  
  .header-dots span {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.5);
  }
  
  .header-dots span:nth-child(1) {
    background-color: #ff5f57;
  }
  
  .header-dots span:nth-child(2) {
    background-color: #ffbd2e;
  }
  
  .header-dots span:nth-child(3) {
    background-color: #28c840;
  }
  
  .card-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  /* Card content */
  .card-content {
    padding: 1.5rem;
  }
  
  /* Chat area */
  .chat-area {
    min-height: 300px;
    max-height: 500px;
    overflow-y: auto;
    padding: 1rem;
    border: 1px solid var(--border);
    border-radius: 12px;
    background-color: var(--accent);
    margin-bottom: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .chat-area.empty {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* Placeholder */
  .placeholder-container {
    text-align: center;
    color: var(--text-light);
  }
  
  .placeholder-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    animation: bounce 2s infinite;
  }
  
  .placeholder {
    font-size: 1.1rem;
  }
  
  /* Message bubbles */
  .message-bubble {
    display: flex;
    gap: 0.75rem;
    max-width: 85%;
    animation: fadeIn 0.3s ease forwards;
    opacity: 0;
    transform: translateY(10px);
  }
  
  .message-bubble.user {
    align-self: flex-end;
    flex-direction: row-reverse;
  }
  
  .message-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    background-color: var(--primary-black);
    color: white;
  }
  
  .user .message-avatar {
    background-color: var(--card-bg);
  }
  
  .message-content {
    background-color: white;
    padding: 0.75rem 1rem;
    border-radius: 18px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    position: relative;
  }
  
  .user .message-content {
    background-color: var(--background);
    color: black;
  }
  
  .bot .message-content::before {
    content: '';
    position: absolute;
    left: -8px;
    top: 14px;
    border-top: 8px solid transparent;
    border-right: 8px solid white;
    border-bottom: 8px solid transparent;
  }
  
  .user .message-content::before {
    content: '';
    position: absolute;
    right: -8px;
    top: 14px;
    border-top: 8px solid transparent;
    border-left: 8px solid var(--background
    );
    border-bottom: 8px solid transparent;
  }
  
  .message-bubble.error .message-content {
    background-color: var(--error);
    color: white;
  }
  
  /* Typing indicator */
  .typing-indicator {
    display: flex;
    gap: 4px;
    padding: 0.25rem 0;
  }
  
  .typing-indicator span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--text-light);
    animation: pulse 1s infinite;
  }
  
  .typing-indicator span:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  .typing-indicator span:nth-child(3) {
    animation-delay: 0.4s;
  }
  
  /* Input form */
  .input-form {
    display: flex;
    gap: 0.75rem;
  }
  
  .message-input {
    flex: 1;
    padding: 0.875rem 1.25rem;
    border: 1px solid var(--primary-black);
    border-radius: 12px;
    font-size: 1rem;
    transition: all 0.2s ease;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
  
  .message-input:focus {
    outline: none;
    border-color: var(--primary-black);
    box-shadow: 0 0 0 3px rgba(7, 7, 7, 0.2);
  }
  
  .send-button {
    padding: 0 1.5rem;
    background-color: var(--primary);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 100px;
  }
  
  .send-button:hover:not(:disabled) {
    background-color: var(--primary-dark);
    transform: translateY(-1px);
  }
  
  .send-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  /* Spinner */
  .spinner {
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s linear infinite;
  }
  
  /* Animations */
  @keyframes fadeIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(0.8);
      opacity: 0.5;
    }
    50% {
      transform: scale(1.2);
      opacity: 1;
    }
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
  
  /* Media queries for responsiveness */
  @media (max-width: 640px) {
    .card-header {
      padding: 1rem;
    }
    
    .card-content {
      padding: 1rem;
    }
    
    .chat-area {
      min-height: 250px;
    }
    
    .message-bubble {
      max-width: 95%;
    }
    
    .send-button {
      min-width: 80px;
      padding: 0 1rem;
    }
  }
</style>