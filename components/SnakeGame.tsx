"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

interface SnakeGameProps {
  onExit: () => void;
}

type Direction = 'up' | 'down' | 'left' | 'right';

interface Position {
  x: number;
  y: number;
}

const BOARD_WIDTH = 100;
const BOARD_HEIGHT = 30;
const INITIAL_SPEED = 300; // ms
const MIN_SPEED = 80; // ms

export default function SnakeGame({ onExit }: SnakeGameProps) {
  // Generate initial food position
  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position;
    let attempts = 0;
    do {
      newFood = {
        x: Math.floor(Math.random() * (BOARD_WIDTH - 2)) + 1,  // 1 to BOARD_WIDTH-2
        y: Math.floor(Math.random() * (BOARD_HEIGHT - 2)) + 1  // 1 to BOARD_HEIGHT-2
      };
      attempts++;
      if (attempts > 100) break; // Prevent infinite loop
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [direction, setDirection] = useState<Direction>('right');
  const [nextDirection, setNextDirection] = useState<Direction>('right');
  const [food, setFood] = useState<Position>(() => generateFood([{ x: 10, y: 10 }]));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // Check collision with walls or self
  const checkCollision = useCallback((head: Position, body: Position[]): boolean => {
    // Wall collision (borders are at edges 0 and BOARD_WIDTH-1, so playable area is 1 to BOARD_WIDTH-2)
    if (head.x < 1 || head.x > BOARD_WIDTH - 2 || head.y < 1 || head.y > BOARD_HEIGHT - 2) {
      return true;
    }
    // Self collision (exclude head from body check)
    return body.some(segment => segment.x === head.x && segment.y === head.y);
  }, []);

  // Reset game function
  const resetGame = useCallback(() => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection('right');
    setNextDirection('right');
    setFood(generateFood([{ x: 10, y: 10 }]));
    setScore(0);
    setGameOver(false);
    setGameStarted(false);
  }, [generateFood]);

  // Move snake
  const moveSnake = useCallback(() => {
    if (gameOver || !gameStarted) return;

    setSnake(currentSnake => {
      const newSnake = [...currentSnake];
      const head = { ...newSnake[0] };

      // Use next direction for this move
      const currentDirection = nextDirection;
      setDirection(currentDirection);

      // Move head based on direction
      switch (currentDirection) {
        case 'up':
          head.y -= 1;
          break;
        case 'down':
          head.y += 1;
          break;
        case 'left':
          head.x -= 1;
          break;
        case 'right':
          head.x += 1;
          break;
      }

      // Check collision (exclude head from body check)
      const bodyWithoutHead = newSnake.slice(1);
      if (checkCollision(head, bodyWithoutHead)) {
        setGameOver(true);
        return currentSnake;
      }

      newSnake.unshift(head);

      // Check if food eaten
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => prev + 10);
        setFood(generateFood(newSnake));
        // Snake grows automatically by not removing tail
      } else {
        // Remove tail
        newSnake.pop();
      }

      return newSnake;
    });
  }, [nextDirection, food, gameOver, gameStarted, checkCollision, generateFood]);

  // Handle keyboard input
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!gameStarted && !gameOver) {
      setGameStarted(true);
    }

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (nextDirection !== 'down') setNextDirection('up');
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (nextDirection !== 'up') setNextDirection('down');
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (nextDirection !== 'right') setNextDirection('left');
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (nextDirection !== 'left') setNextDirection('right');
        break;
      case 'r':
      case 'R':
        if (gameOver) {
          resetGame();
        }
        break;
      case 'q':
      case 'Escape':
        onExit();
        break;
    }
  }, [nextDirection, gameStarted, gameOver, onExit, resetGame]);

  // Game loop
  useEffect(() => {
    if (gameStarted && !gameOver) {
      const speed = Math.max(MIN_SPEED, INITIAL_SPEED - (score * 2));
      gameLoopRef.current = setInterval(moveSnake, speed);
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [moveSnake, score, gameStarted, gameOver]);

  // Keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Render board
  const renderBoard = () => {
    const board: string[][] = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill('·'));

    // Draw borders
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (y === 0 || y === BOARD_HEIGHT - 1 || x === 0 || x === BOARD_WIDTH - 1) {
          board[y][x] = '#';
        }
      }
    }

    // Draw snake
    snake.forEach((segment, index) => {
      if (index === 0) {
        board[segment.y][segment.x] = '●'; // Head
      } else {
        board[segment.y][segment.x] = '○'; // Body
      }
    });

    // Draw food
    board[food.y][food.x] = '@';

    return board.map(row => row.join('')).join('\n');
  };

  return (
    <div className="snake-game bg-black text-green-400 p-4 font-mono min-h-screen flex flex-col items-center">
      <div className="mb-4 text-center">
        <h1 className="text-xl font-bold mb-2">Snake Game</h1>
        <div className="mb-2">Score: {score}</div>
        <div className="mb-2 text-sm">
          Use arrow keys to move • Eat @ to grow • Avoid # borders and ○ body • Press Q or ESC to quit
        </div>
        {!gameStarted && !gameOver && (
          <div className="mb-2 text-yellow-400">Press any arrow key to start!</div>
        )}
        {gameOver && (
          <div className="mb-2 text-red-400 text-center">
            Game Over! Final Score: {score} • Press R to restart or Q/ESC to exit
          </div>
        )}
      </div>

      <pre className="border border-green-400 p-4 whitespace-pre overflow-x-auto font-mono text-sm leading-tight max-w-fit mx-auto">
{renderBoard()}
      </pre>
    </div>
  );
}