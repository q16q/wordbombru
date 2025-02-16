import React, { useState, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import './styles/App.scss'

interface Player {
  id: string;
  name: string;
  score: number;
  isReady: boolean;
}

interface GameState {
  players: Player[];
  currentPlayer: string | null;
  currentLetters: string;
  timeLeft: number;
}

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [playerName, setPlayerName] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [input, setInput] = useState<string>('');
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('gameState', (state: GameState) => {
      setGameState(state);
      setError('');
    });

    socket.on('wordError', (message: string) => {
      setError(message);
      setInput('');
    });

    return () => {
      socket.off('gameState');
      socket.off('wordError');
    };
  }, [socket]);

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !playerName || !roomId) return;

    socket.emit('joinRoom', { roomId, playerName });
    setIsJoined(true);
  };

  const handleReady = () => {
    if (!socket) return;
    socket.emit('ready');
  };

  const handleSubmitWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !input || !gameState) return;

    if (socket.id === gameState.currentPlayer) {
      socket.emit('word', input);
      setInput('');
      setError('');
    }
  };

  if (!socket) {
    return <div className="app">Подключение к серверу...</div>;
  }

  if (!isJoined) {
    return (
      <div className="app">
        <div className="join-screen">
          <h1>WordBomb RU</h1>
          <form onSubmit={handleJoinRoom}>
            <input
              type="text"
              placeholder="Ваше имя"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="ID комнаты"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              required
            />
            <button type="submit">Присоединиться</button>
          </form>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return <div className="app">Загрузка игры...</div>;
  }

  const isCurrentPlayer = socket.id === gameState.currentPlayer;
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);

  return (
    <div className="app">
      <header>
        <h1>WordBomb RU</h1>
        <div className="players">
          {gameState.players.map(player => (
            <div key={player.id} className={`player ${player.id === gameState.currentPlayer ? 'current' : ''}`}>
              <span className="name">{player.name}</span>
              <span className="score">Очки: {player.score}</span>
              {!player.isReady && <span className="status">(Не готов)</span>}
            </div>
          ))}
        </div>
      </header>

      <main>
        {gameState.players.some(p => !p.isReady) ? (
          <div className="waiting-screen">
            <h2>Ожидание игроков</h2>
            {!gameState.players.find(p => p.id === socket.id)?.isReady && (
              <button onClick={handleReady}>Я готов!</button>
            )}
          </div>
        ) : (
          <div className="game-screen">
            <div className="current-player">
              Ход игрока: {currentPlayer?.name}
            </div>
            <div className="letters">Буквы: <span>{gameState.currentLetters}</span></div>
            <div className="timer">Время: {gameState.timeLeft}с</div>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleSubmitWord}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Введите слово..."
                disabled={!isCurrentPlayer}
              />
              <button type="submit" disabled={!isCurrentPlayer}>Отправить</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default App
