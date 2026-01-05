
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Difficulty, GameState, Card as CardType } from './types.ts';
import { createBoard } from './utils/gameUtils.ts';
import Card from './components/Card.tsx';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    cards: [],
    flippedIndices: [],
    moves: 0,
    matches: 0,
    status: 'IDLE',
    difficulty: Difficulty.EASY,
    bestScore: Number(localStorage.getItem(`bestScore_${Difficulty.EASY}`)) || 0,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<number | null>(null);

  const initGame = useCallback((difficulty: Difficulty = gameState.difficulty) => {
    const newCards = createBoard(difficulty);
    const bestScore = Number(localStorage.getItem(`bestScore_${difficulty}`)) || 0;
    
    setGameState({
      cards: newCards,
      flippedIndices: [],
      moves: 0,
      matches: 0,
      status: 'PLAYING',
      difficulty,
      bestScore
    });
    
    setTimer(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTimer(t => t + 1);
    }, 1000);
  }, [gameState.difficulty]);

  const handleCardClick = (index: number) => {
    // 이미 처리 중이거나 뒤집힌 카드면 무시
    if (isProcessing || gameState.status !== 'PLAYING') return;
    if (gameState.cards[index].isFlipped || gameState.cards[index].isMatched) return;

    // 1. 클릭한 카드 즉시 뒤집기 표시
    setGameState(prev => {
      const updatedCards = [...prev.cards];
      updatedCards[index] = { ...updatedCards[index], isFlipped: true };
      const newFlipped = [...prev.flippedIndices, index];

      // 2. 두 번째 카드를 뒤집었을 때
      if (newFlipped.length === 2) {
        setIsProcessing(true); // 추가 클릭 방지
        const [firstIdx, secondIdx] = newFlipped;
        const isMatch = updatedCards[firstIdx].pairId === updatedCards[secondIdx].pairId;
        const nextMoves = prev.moves + 1;

        if (isMatch) {
          // 맞았을 때: 약간의 딜레이 후 매칭 상태로 고정
          setTimeout(() => {
            setGameState(current => {
              const matchedCards = [...current.cards];
              matchedCards[firstIdx].isMatched = true;
              matchedCards[secondIdx].isMatched = true;
              const nextMatches = current.matches + 1;
              
              let totalPairs = 6;
              if (current.difficulty === Difficulty.MEDIUM) totalPairs = 10;
              if (current.difficulty === Difficulty.HARD) totalPairs = 12;

              const hasWon = nextMatches === totalPairs;
              if (hasWon && timerRef.current) clearInterval(timerRef.current);

              setIsProcessing(false);
              return {
                ...current,
                cards: matchedCards,
                flippedIndices: [],
                matches: nextMatches,
                status: hasWon ? 'WON' : 'PLAYING',
                bestScore: hasWon ? updateBestScore(nextMoves, current.difficulty) : current.bestScore
              };
            });
          }, 500);
        } else {
          // 틀렸을 때: 1초 동안 보여준 후 다시 뒤집기
          setTimeout(() => {
            setGameState(current => {
              const resetCards = [...current.cards];
              resetCards[firstIdx].isFlipped = false;
              resetCards[secondIdx].isFlipped = false;
              setIsProcessing(false);
              return { ...current, cards: resetCards, flippedIndices: [] };
            });
          }, 1000);
        }

        return { ...prev, cards: updatedCards, flippedIndices: newFlipped, moves: nextMoves };
      }

      // 첫 번째 카드인 경우
      return { ...prev, cards: updatedCards, flippedIndices: newFlipped };
    });
  };

  const updateBestScore = (score: number, difficulty: Difficulty): number => {
    const key = `bestScore_${difficulty}`;
    const currentBest = Number(localStorage.getItem(key)) || 0;
    if (score < currentBest || currentBest === 0) {
      localStorage.setItem(key, score.toString());
      return score;
    }
    return currentBest;
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#050a0f] text-white overflow-x-hidden selection:bg-yellow-400">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(30,58,138,0.1),transparent_70%)]"></div>
      </div>

      <main className="relative z-10 w-full max-w-7xl px-4 py-8 flex flex-col gap-6">
        <header className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl font-fredoka font-bold text-yellow-400">
              MINION MATCH
            </h1>
            <p className="text-blue-300 font-black uppercase text-[10px] tracking-widest mt-1">Classic Edition</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-black/40 rounded-3xl p-2 border border-white/10">
            {[
              { label: 'Moves', value: gameState.moves, color: 'text-white' },
              { label: 'Time', value: `${Math.floor(timer/60)}:${(timer%60).toString().padStart(2,'0')}`, color: 'text-blue-400' },
              { label: 'Pairs', value: `${gameState.matches} / ${gameState.difficulty === Difficulty.HARD ? 12 : gameState.difficulty === Difficulty.MEDIUM ? 10 : 6}`, color: 'text-yellow-400' },
              { label: 'Best', value: gameState.bestScore === 0 ? '--' : gameState.bestScore, color: 'text-purple-400' }
            ].map((stat, i) => (
              <div key={i} className="px-4 py-1 text-center border-r last:border-0 border-white/10 sm:min-w-[90px]">
                <p className="text-[8px] uppercase font-black text-gray-500 tracking-tighter">{stat.label}</p>
                <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </header>

        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_300px] gap-6">
          <section className="order-2 lg:order-1">
            {gameState.status === 'IDLE' ? (
              <div className="h-[500px] flex flex-col items-center justify-center space-y-8 bg-white/[0.02] rounded-[3rem] border-2 border-dashed border-white/10">
                 <span className="text-7xl animate-bounce">🍌</span>
                 <h2 className="text-2xl font-bold">Ready for Mission?</h2>
                 <div className="flex gap-4">
                    {(['EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map(d => (
                      <button key={d} onClick={() => initGame(d)} className="px-8 py-3 bg-yellow-400 text-black rounded-xl font-black hover:scale-105 transition-transform active:scale-95">{d}</button>
                    ))}
                 </div>
              </div>
            ) : (
              <div className="bg-white/[0.02] p-4 sm:p-6 rounded-[3rem] border border-white/5 backdrop-blur-md shadow-2xl flex items-center justify-center min-h-[500px]">
                <div className={`grid gap-3 w-full mx-auto ${
                  gameState.difficulty === Difficulty.EASY ? 'grid-cols-3 sm:grid-cols-4 max-w-xl' : 
                  gameState.difficulty === Difficulty.MEDIUM ? 'grid-cols-4 sm:grid-cols-5 max-w-3xl' : 
                  'grid-cols-4 sm:grid-cols-6 max-w-4xl' 
                }`}>
                  {gameState.cards.map((card, idx) => (
                    <Card 
                      key={card.id} 
                      card={card} 
                      onClick={() => handleCardClick(idx)}
                      disabled={isProcessing}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>

          <aside className="order-1 lg:order-2 flex flex-col gap-6">
             <div className="bg-white/5 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-6">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                   </div>
                   <h3 className="font-fredoka text-lg font-bold">Mission Control</h3>
                </div>

                <div className="space-y-2">
                   <button onClick={() => initGame(gameState.difficulty)} className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-black text-sm transition-all active:scale-95">Restart Mission</button>
                   <button onClick={() => setGameState(prev => ({ ...prev, status: 'IDLE' }))} className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-gray-400 text-xs">Menu</button>
                </div>

                <div className="pt-4 border-t border-white/10">
                   <p className="text-[9px] text-gray-500 uppercase font-black mb-3 text-center tracking-widest">Difficulty</p>
                   <div className="grid grid-cols-3 gap-1 p-1 bg-black/40 rounded-xl">
                     {([Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD] as Difficulty[]).map(d => (
                       <button
                         key={d}
                         onClick={() => initGame(d)}
                         className={`py-2 text-[9px] font-black rounded-lg transition-all ${
                           gameState.difficulty === d ? 'bg-yellow-400 text-black' : 'text-gray-500 hover:text-white'
                         }`}
                       >
                         {d}
                       </button>
                     ))}
                   </div>
                </div>
             </div>
          </aside>
        </div>
      </main>

      {gameState.status === 'WON' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-yellow-400 p-1 rounded-[3rem] shadow-2xl max-w-sm w-full animate-scaleIn">
            <div className="bg-[#050a0f] rounded-[2.85rem] p-8 flex flex-col items-center text-center space-y-6">
              <span className="text-6xl animate-bounce">🍌</span>
              <div>
                <h2 className="text-3xl font-fredoka font-bold text-yellow-400">MISSION COMPLETE!</h2>
                <p className="text-gray-400 mt-2">Finished in <span className="text-white font-bold">{gameState.moves}</span> moves</p>
              </div>
              <button onClick={() => initGame(gameState.difficulty)} className="w-full py-4 bg-yellow-400 text-black font-black text-xl rounded-2xl active:scale-95 transition-transform">PLAY AGAIN</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
