const socket = io();  
  
const loginScreen = document.getElementById('login-screen');  
const chatScreen = document.getElementById('chat-screen');  
const usernameInput = document.getElementById('username');  
const joinBtn = document.getElementById('join-btn');  
const messageInput = document.getElementById('message-input');  
const sendBtn = document.getElementById('send-btn');  
const messagesContainer = document.getElementById('messages');  
  
joinBtn.addEventListener('click', () => {  
    const username = usernameInput.value.trim();  
    if (username) {  
        socket.emit('join', username);  
        loginScreen.classList.add('hidden');  
        chatScreen.classList.remove('hidden');  
    }  
});  
  
sendBtn.addEventListener('click', () => {  
    const message = messageInput.value.trim();  
    if (message) {  
        socket.emit('chat-message', {  
            content: message  
        });  
        messageInput.value = '';  
    }  
});  
  
socket.on('chat-message', (message) => {  
    const messageDiv = document.createElement('div');  
    messageDiv.classList.add('message');  
    messageDiv.classList.add(message.senderId === socket.id ? 'sent' : 'received');  
    messageDiv.textContent = message.content;  
    messagesContainer.appendChild(messageDiv);  
    messagesContainer.scrollTop = messagesContainer.scrollHeight;  
});
