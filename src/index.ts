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
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use(routes);

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