import { Socket } from 'socket.io';
import { dictionaryService } from '../services/dictionary';

interface Player {
    id: string;
    name: string;
    score: number;
    isReady: boolean;
    socket: Socket;
}

export class GameRoom {
    private players: Map<string, Player> = new Map();
    private currentLetters: string = '';
    private timer: NodeJS.Timeout | null = null;
    private timeLeft: number = 10;
    private currentPlayer: string | null = null;
    private readonly roomId: string;
    private usedWords: string[] = [];

    constructor(roomId: string) {
        this.roomId = roomId;
    }

    public addPlayer(socket: Socket, name: string) {
        const player: Player = {
            id: socket.id,
            name,
            score: 0,
            isReady: false,
            socket
        };
        this.players.set(socket.id, player);
        this.broadcastGameState();

        // Установка обработчиков событий для игрока
        socket.on('ready', () => this.handlePlayerReady(socket.id));
        socket.on('word', (word: string) => this.handleWord(socket.id, word));
        socket.on('disconnect', () => this.removePlayer(socket.id));
    }

    public removePlayer(playerId: string) {
        this.players.delete(playerId);
        if (this.currentPlayer === playerId) {
            this.nextTurn();
        }
        this.broadcastGameState();
    }

    private handlePlayerReady(playerId: string) {
        const player = this.players.get(playerId);
        if (player) {
            player.isReady = true;
            this.broadcastGameState();
            this.checkGameStart();
        }
    }

    private checkGameStart() {
        const allPlayers = Array.from(this.players.values());
        if (allPlayers.length >= 2 && allPlayers.every(p => p.isReady)) {
            this.startGame();
        }
    }

    private startGame() {
        const players = Array.from(this.players.values());
        this.currentPlayer = players[0].id;
        this.nextTurn();
    }

    private generateLetters(): string {
        const consonants = 'бвгджзклмнпрстфхцчшщ';
        const vowels = 'аеёиоуыюя';
        const firstLetter = consonants[Math.floor(Math.random() * consonants.length)];
        const secondLetter = vowels[Math.floor(Math.random() * vowels.length)];
        return firstLetter + secondLetter;
    }

    private nextTurn(generateLetters: boolean = true) {
        if (this.timer) {
            clearInterval(this.timer);
        }

        const players = Array.from(this.players.values());
        if (players.length < 2) return;

        const currentIndex = players.findIndex(p => p.id === this.currentPlayer);
        this.currentPlayer = players[(currentIndex + 1) % players.length].id;
        if(generateLetters) this.currentLetters = this.generateLetters();
        this.timeLeft = 10;

        this.broadcastGameState();

        this.timer = setInterval(() => {
            this.timeLeft--;
            if (this.timeLeft <= 0) {
                this.handleTimeout();
            } else {
                this.broadcastGameState();
            }
        }, 1000);
    }

    private handleTimeout() {
        const currentPlayer = this.players.get(this.currentPlayer!);
        if (currentPlayer) {
            currentPlayer.score = Math.max(0, currentPlayer.score - 1);
            currentPlayer.socket.emit('wordError', 'Время вышло!');
        }
        this.nextTurn(false);
    }

    private handleWord(playerId: string, word: string) {
        if (playerId !== this.currentPlayer) return;

        const player = this.players.get(playerId);
        if (!player) return;

        console.log(`Player ${player.name} submitted word: "${word}"`);

        const normalizedWord = word.toLowerCase().trim();

        if(this.usedWords.includes(normalizedWord)) {
            player.socket.emit('wordError', 'Это слово уже использовали!');
            return;
        }

        if(!this.checkWord(normalizedWord)) {
            player.socket.emit('wordError', 'Неверное слово!');
            return;
        } 

        console.log(`Word "${normalizedWord}" is valid! Adding ${normalizedWord.length} points`);
        this.usedWords.push(normalizedWord);
        player.score += normalizedWord.length;
        this.broadcastGameState();
        this.nextTurn();
    }

    private checkWord(word: string): boolean {
        if (word.length < 2) return false;
        if (!word.toLowerCase().includes(this.currentLetters.toLowerCase())) return false;
        const alternateWords = [
            word,
            word.replaceAll('э', 'е'),
            word.replaceAll('е', 'э'),
            word.replaceAll('ё', 'е'),
            word.replaceAll('е', 'ё')
        ];
        return alternateWords.some(altWord => dictionaryService.isValidWord(altWord));
    }

    private broadcastGameState() {
        const gameState = {
            players: Array.from(this.players.values()).map(p => ({
                id: p.id,
                name: p.name,
                score: p.score,
                isReady: p.isReady
            })),
            currentPlayer: this.currentPlayer,
            currentLetters: this.currentLetters,
            timeLeft: this.timeLeft
        };

        for (const player of this.players.values()) {
            player.socket.emit('gameState', gameState);
        }
    }
}
