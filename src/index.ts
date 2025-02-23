import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { config } from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import routes from './routes';
import { GameRoom } from './game/GameRoom';

config({ path: join(__dirname, "../.env") });

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.NODE_ENV === 'production' 
            ? false // В продакшене отключаем CORS, так как фронтенд и бэкенд на одном домене
            : "http://localhost:5173", // В разработке разрешаем localhost
        methods: ["GET", "POST"]
    }
});

const port = process.env.PORT || 3000;

// Статические файлы в продакшене
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(join(__dirname, '../dist')));
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// В продакшене все остальные запросы направляем на index.html
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(join(__dirname, '../dist/index.html'));
    });
}

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Game rooms
const rooms = new Map<string, GameRoom>();

// Socket.IO handlers
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinRoom', ({ roomId, playerName }) => {
        // Leave all other rooms
        socket.rooms.forEach(room => {
            if (room !== socket.id) {
                socket.leave(room);
            }
        });

        // Join new room
        socket.join(roomId);

        // Create room if doesn't exist
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new GameRoom(roomId));
        }

        // Add player to room
        const room = rooms.get(roomId)!;
        room.addPlayer(socket, playerName);

        console.log(`Player ${playerName} joined room ${roomId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Start server
httpServer.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});