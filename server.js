const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const moment = require('moment-timezone');

const PORT = process.env.PORT || 3000;
const CHAT_VERSION = '1.0.0';

app.use(express.static(path.join(__dirname, 'public')));

let ownerSocketId = null;
let connectedUsers = new Map(); // Store connected users

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('set-owner', () => {
        if (!ownerSocketId) {
            ownerSocketId = socket.id;
            socket.emit('owner-status', true);
            io.emit('system-message', {
                text: 'Training session started. The instructor has joined.',
                timestamp: moment().tz('America/Port-au-Prince').format('HH:mm')
            });
        } else {
            socket.emit('error', 'A training session is already in progress');
        }
        updateOnlineUsers();
    });

    socket.on('join', (username) => {
        socket.username = username;
        connectedUsers.set(socket.id, {
            username,
            isInstructor: socket.id === ownerSocketId
        });
        
        io.emit('system-message', {
            text: `${username} ${socket.id === ownerSocketId ? '(Instructor)' : '(Student)'} has joined the training`,
            timestamp: moment().tz('America/Port-au-Prince').format('HH:mm')
        });
        
        updateOnlineUsers();
    });

    socket.on('chat-message', (message) => {
        if (socket.id !== ownerSocketId) {
            socket.emit('error', 'Only the instructor can send messages');
            return;
        }

        const messageData = {
            id: Date.now().toString(),
            username: socket.username,
            content: message.content,
            type: message.type,
            timestamp: moment().tz('America/Port-au-Prince').format('HH:mm'),
            senderId: socket.id,
            reactions: {}
        };
        
        io.emit('chat-message', messageData);
    });

    socket.on('voice-message', (audioBlob) => {
        if (socket.id !== ownerSocketId) {
            socket.emit('error', 'Only the instructor can send messages');
            return;
        }

        const messageData = {
            id: Date.now().toString(),
            username: socket.username,
            content: audioBlob,
            type: 'voice',
            timestamp: moment().tz('America/Port-au-Prince').format('HH:mm'),
            senderId: socket.id,
            reactions: {}
        };
        
        io.emit('chat-message', messageData);
    });

    socket.on('image-message', (imageData) => {
        if (socket.id !== ownerSocketId) {
            socket.emit('error', 'Only the instructor can send messages');
            return;
        }

        const messageData = {
            id: Date.now().toString(),
            username: socket.username,
            content: imageData,
            type: 'image',
            timestamp: moment().tz('America/Port-au-Prince').format('HH:mm'),
            senderId: socket.id,
            reactions: {}
        };
        
        io.emit('chat-message', messageData);
    });

    socket.on('file-message', (fileData) => {
        if (socket.id !== ownerSocketId) {
            socket.emit('error', 'Only the instructor can send messages');
            return;
        }

        const messageData = {
            id: Date.now().toString(),
            username: socket.username,
            content: fileData,
            type: 'file',
            timestamp: moment().tz('America/Port-au-Prince').format('HH:mm'),
            senderId: socket.id,
            reactions: {}
        };
        
        io.emit('chat-message', messageData);
    });

    socket.on('add-reaction', (data) => {
        io.emit('reaction-added', {
            messageId: data.messageId,
            reaction: data.reaction,
            username: socket.username
        });
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            io.emit('system-message', {
                text: `${socket.username} ${socket.id === ownerSocketId ? '(Instructor)' : '(Student)'} has left the training`,
                timestamp: moment().tz('America/Port-au-Prince').format('HH:mm')
            });
        }
        if (socket.id === ownerSocketId) {
            ownerSocketId = null;
            io.emit('system-message', {
                text: 'The instructor has left. Waiting for a new training session.',
                timestamp: moment().tz('America/Port-au-Prince').format('HH:mm')
            });
        }
        connectedUsers.delete(socket.id);
        updateOnlineUsers();
    });

    socket.on('close-chat', () => {
        if (socket.id === ownerSocketId) {
            io.emit('chat-closed');
            ownerSocketId = null;
            connectedUsers.clear();
            updateOnlineUsers();
        }
    });

    // Function to update online users count
    function updateOnlineUsers() {
        const users = Array.from(connectedUsers.values());
        io.emit('online-users', {
            total: connectedUsers.size,
            instructor: users.find(user => user.isInstructor)?.username || null,
            students: users.filter(user => !user.isInstructor).map(user => user.username)
        });
    }
});

http.listen(PORT, () => {
    console.log(`Training chat server running on port ${PORT}`);
});