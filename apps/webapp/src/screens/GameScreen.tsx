import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Board } from '@battleship/ui';
import { useGameStore } from '../stores/gameStore';
import { useAuth } from '../providers/AuthProvider';
import { initSfx, playSfx } from '../utils/sfx';

type FogCell = '' | 'H' | 'M' | 'S';

export const GameScreen: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentMatch, isLoading, error, makeMove, getGameState } = useGameStore();

  const [gameState, setGameState] = useState<any | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [turnTime, setTurnTime] = useState(5);
  const [initialized, setInitialized] = useState(false);
  const stateRef = useRef<any | null>(null);

  // Helpers
  const convertFog = (fog: FogCell[][]) => {
    const board: string[][] = Array.from({ length: 10 }, () => Array(10).fill('idle'));
    const safe: FogCell[][] = Array.isArray(fog) ? fog : [] as any;
    for (let y = 0; y < 10; y++) {
      const row = safe[y] || [];
      for (let x = 0; x < 10; x++) {
        const v = row[x];
        if (v === 'H') board[y][x] = 'hit';
        else if (v === 'M') board[y][x] = 'miss';
        else if (v === 'S') board[y][x] = 'sunk';
        if (v === 'H') {
          const diag = [ [-1,-1],[1,-1],[-1,1],[1,1] ];
          for (const [dx,dy] of diag) {
            const nx = x+dx, ny = y+dy;
            if (nx>=0&&ny>=0&&nx<10&&ny<10 && board[ny][nx]==='idle') board[ny][nx]='miss';
          }
        }
      }
    }
    return board as any;
  };

  const convertOwn = (board: any) => {
    const cells: string[][] = Array.from({ length: 10 }, () => Array(10).fill('idle'));
    const hits: string[] = Array.isArray(board?.hits) ? board.hits : [];
    const misses: string[] = Array.isArray(board?.misses) ? board.misses : [];
    const ships: any[] = Array.isArray(board?.ships) ? board.ships : [];
    ships.forEach((ship) => {
      for (let i = 0; i < ship.length; i++) {
        const x = ship.horizontal ? ship.bow.x + i : ship.bow.x;
        const y = ship.horizontal ? ship.bow.y : ship.bow.y + i;
        cells[y][x] = 'ship';
      }
    });
    hits.forEach(k => { const [x,y]=k.split(',').map(Number); cells[y][x]='ship-hit'; });
    misses.forEach(k => { const [x,y]=k.split(',').map(Number); cells[y][x]='miss'; });
    return cells as any;
  };

  // Init
  useEffect(() => {
    initSfx();
    if (matchId) getGameState(matchId);
  }, [matchId, getGameState]);

  useEffect(() => {
    if (currentMatch && user) {
      setIsMyTurn(currentMatch.currentTurn === 'A');
      setTurnTime(5);
    }
  }, [currentMatch, user]);

  // Polling
  useEffect(() => {
    if (!matchId) return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/game/${matchId}/state`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}`, 'Content-Type': 'application/json' }
        });
        if (!res.ok) return;
        const json = await res.json();
        if (!json?.success) return;
        const prev = stateRef.current;
        setGameState((prevState: any) => {
          const next = json.data;
          stateRef.current = next;
          return next;
        });
        setIsMyTurn(json.data.currentTurn === 'A');
        if (!initialized) setInitialized(true);
        // sfx on diff
        try {
          const prevFog = prev?.publicState?.fog || [];
          const nextFog = json.data.publicState?.fog || [];
          outer: for (let y=0;y<10;y++) for (let x=0;x<10;x++) {
            const a = prevFog[y]?.[x];
            const b = nextFog[y]?.[x];
            if (a!==b) { if (b==='S'){playSfx('sunk');break outer;} if (b==='H'){playSfx('hit');break outer;} if (b==='M'){playSfx('miss');break outer;} }
          }
        } catch {}
        if (json.data.status === 'finished') {
          const youWon = json.data.winner === 'A';
          playSfx(youWon ? 'win' : 'lose');
          alert(youWon ? 'Вы выиграли!' : 'Вы проиграли');
          setTimeout(() => navigate('/'), 800);
        }
      } catch {}
    }, 1000);
    return () => clearInterval(t);
  }, [matchId, initialized, navigate]);

  // Timer with auto shot
  useEffect(() => {
    if (!isMyTurn || !matchId) return;
    setTurnTime(5);
    let elapsed = 0;
    const t = setInterval(() => {
      setTurnTime((p)=> (p>0? p-1:0));
      elapsed += 1;
      if (elapsed>=5) {
        elapsed=0;
        try {
          const fog = stateRef.current?.publicState?.fog || [];
          const tried = new Set<string>();
          for (let y=0;y<10;y++) for (let x=0;x<10;x++){ const v=fog[y]?.[x]; if (v==='H'||v==='M'||v==='S') tried.add(`${x},${y}`);} 
          const cand: {x:number;y:number}[] = [];
          for (let y=0;y<10;y++) for (let x=0;x<10;x++){ const k=`${x},${y}`; if (!tried.has(k)) cand.push({x,y}); }
          const pick = cand.length? cand[Math.floor(Math.random()*cand.length)] : {x:0,y:0};
          makeMove(matchId, pick as any).then(()=> setTimeout(()=> getGameState(matchId), 250)).catch(()=>{});
        } catch {}
        clearInterval(t);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [isMyTurn, matchId, makeMove, getGameState]);

  if (!initialized && !gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tg-button mx-auto mb-4"></div>
          <p className="text-tg-hint">Загрузка игры...</p>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-500 mb-2">Игра не найдена</h2>
          <Button onClick={() => navigate('/')}>Вернуться на главную</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tg-bg p-4" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-tg-text mb-2">Морской бой</h1>
          <p className="text-tg-hint">{gameState.status==='finished' ? (gameState.winner==='A'?'Победа!':'Поражение') : (isMyTurn? `Ваш ход (${turnTime}s)` : 'Ход компьютера')}</p>
        </div>

        <div className="bg-tg-secondary-bg rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div><span className="text-tg-text font-medium">Вы:</span><span className="text-tg-hint ml-2">{user?.firstName || 'Игрок'}</span></div>
            <div className="text-center"><div className={`w-3 h-3 rounded-full ${isMyTurn?'bg-green-500':'bg-gray-400'}`}></div><span className="text-xs text-tg-hint ml-1">{isMyTurn?'Ваш ход':'Ожидание'}</span></div>
            <div><span className="text-tg-text font-medium">Противник:</span><span className="text-tg-hint ml-2">Компьютер</span></div>
          </div>
        </div>

        {error && (<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>)}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-tg-text mb-3 text-center">Ваше поле</h3>
            <div className="flex justify-center">
              <Board size="sm" cells={convertOwn(gameState.publicState.board) as any} disabled />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-tg-text mb-3 text-center">Поле противника</h3>
            <div className="flex justify-center">
              <Board size="sm" cells={convertFog(gameState.publicState.fog) as any} disabled={!isMyTurn || gameState.status!=='in_progress'} onCellClick={(row,col)=>{
                if (!isMyTurn||!matchId) return;
                makeMove(matchId, { x: col, y: row } as any).then(()=> setTimeout(()=> getGameState(matchId!), 250));
              }} isOpponent />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button onClick={()=> navigate('/')} variant="secondary" className="w-full">Вернуться на главную</Button>
        </div>
      </div>
    </div>
  );
};

