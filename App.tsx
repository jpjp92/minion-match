
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Difficulty, GameState, Card as CardType, LeaderboardEntry } from './types.ts';
import { createBoard, fetchAvailableImages } from './utils/gameUtils.ts';
import Card from './components/Card.tsx';

const App: React.FC = () => {
  const [imagePool, setImagePool] = useState<string[]>([]);
  const [isLoadingPool, setIsLoadingPool] = useState(true);
  const [gameState, setGameState] = useState<GameState>({
    cards: [],
    flippedIndices: [],
    moves: 0,
    matches: 0,
    status: 'IDLE',
    difficulty: Difficulty.EASY,
    bestScore: Number(localStorage.getItem(`bestScore_${Difficulty.EASY}`)) || 0,
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const loadAssets = async () => {
      const images = await fetchAvailableImages();
      setImagePool(images);
      setIsLoadingPool(false);
    };
    loadAssets();

    const saved = localStorage.getItem('minion_leaderboard');
    if (saved) setLeaderboard(JSON.parse(saved));
  }, []);

  const initGame = useCallback((difficulty: Difficulty = gameState.difficulty) => {
    if (imagePool.length === 0) return;

    const newCards = createBoard(difficulty, imagePool);
    newCards.forEach(c => { const img = new Image(); img.src = c.image; });

    setGameState({
      cards: newCards,
      flippedIndices: [],
      moves: 0,
      matches: 0,
      status: 'PLAYING',
      difficulty,
      bestScore: Number(localStorage.getItem(`bestScore_${difficulty}`)) || 0
    });
    
    setTimer(0);
    setPlayerName('');
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => setTimer(t => t + 1), 1000);
  }, [gameState.difficulty, imagePool]);

  const saveToLeaderboard = () => {
    if (!playerName.trim()) return;
    const newEntry: LeaderboardEntry = {
      id: Date.now().toString(),
      name: playerName.trim(),
      moves: gameState.moves,
      time: timer,
      difficulty: gameState.difficulty,
      date: new Date().toLocaleDateString()
    };
    const updated = [...leaderboard, newEntry]
      .sort((a, b) => a.moves !== b.moves ? a.moves - b.moves : a.time - b.time)
      .slice(0, 10);
    setLeaderboard(updated);
    localStorage.setItem('minion_leaderboard', JSON.stringify(updated));
    setGameState(prev => ({ ...prev, status: 'IDLE' }));
    setIsLeaderboardOpen(true);
  };

  const handleCardClick = (index: number) => {
    if (isProcessing || gameState.status !== 'PLAYING') return;
    const card = gameState.cards[index];
    if (card.isFlipped || card.isMatched) return;

    setGameState(prev => {
      const updatedCards = [...prev.cards];
      updatedCards[index] = { ...updatedCards[index], isFlipped: true };
      const newFlipped = [...prev.flippedIndices, index];

      if (newFlipped.length === 2) {
        setIsProcessing(true);
        const [firstIdx, secondIdx] = newFlipped;
        const isMatch = updatedCards[firstIdx].pairId === updatedCards[secondIdx].pairId;
        const nextMoves = prev.moves + 1;

        if (isMatch) {
          setTimeout(() => {
            setGameState(current => {
              const matchedCards = [...current.cards];
              matchedCards[firstIdx].isMatched = true;
              matchedCards[secondIdx].isMatched = true;
              const nextMatches = current.matches + 1;
              const totalPairs = current.cards.length / 2;
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
          }, 200);
        } else {
          setTimeout(() => {
            setGameState(current => {
              const resetCards = [...current.cards];
              resetCards[firstIdx].isFlipped = false;
              resetCards[secondIdx].isFlipped = false;
              setIsProcessing(false);
              return { ...current, cards: resetCards, flippedIndices: [] };
            });
          }, 600);
        }
        return { ...prev, cards: updatedCards, flippedIndices: newFlipped, moves: nextMoves };
      }
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

  if (isLoadingPool) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050a0f] text-white">
        <div className="text-6xl animate-bounce mb-4">🍌</div>
        <p className="font-fredoka text-xl font-bold text-yellow-400 animate-pulse">Checking Assets...</p>
      </div>
    );
  }

  const actualTotalPairs = gameState.cards.length / 2;

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#050a0f] text-white selection:bg-yellow-400">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(30,58,138,0.1),transparent_70%)]"></div>
      </div>

      <main className="relative z-10 w-full max-w-5xl px-4 py-6 flex flex-col gap-5">
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-4 sm:p-5 shadow-2xl">
          <div className="text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl font-fredoka font-bold text-yellow-400 leading-none">MINION MATCH</h1>
            <p className="text-blue-300 font-black uppercase text-[9px] tracking-widest mt-1">Classic Edition</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-black/40 rounded-2xl p-1.5 border border-white/10">
            {[
              { label: 'Moves', value: gameState.moves, color: 'text-white' },
              { label: 'Time', value: `${Math.floor(timer/60)}:${(timer%60).toString().padStart(2,'0')}`, color: 'text-blue-400' },
              { label: 'Pairs', value: `${gameState.matches}/${actualTotalPairs}`, color: 'text-yellow-400' },
              { label: 'Best', value: gameState.bestScore === 0 ? '--' : gameState.bestScore, color: 'text-purple-400' }
            ].map((stat, i) => (
              <div key={i} className="px-3 py-0.5 text-center border-r last:border-0 border-white/10 min-w-[70px] sm:min-w-[85px]">
                <p className="text-[7px] uppercase font-black text-gray-500 tracking-tighter">{stat.label}</p>
                <p className={`text-base font-black ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </header>

        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_260px] gap-5">
          <section className="order-2 lg:order-1">
            {gameState.status === 'IDLE' ? (
              <div className="h-[480px] sm:h-[520px] flex flex-col items-center justify-center space-y-6 bg-white/[0.02] rounded-[2.5rem] border-2 border-dashed border-white/10">
                 <span className="text-7xl animate-bounce">🍌</span>
                 <h2 className="text-xl font-bold font-fredoka">Select Your Mission</h2>
                 <div className="flex flex-col sm:flex-row justify-center gap-4 px-6 w-full max-w-md">
                    {(['EASY', 'MEDIUM'] as Difficulty[]).map(d => (
                      <button 
                        key={d} 
                        onClick={() => initGame(d)} 
                        className="flex-1 py-4 bg-yellow-400 text-black rounded-2xl font-black text-lg hover:scale-105 transition-all active:scale-95 shadow-lg shadow-yellow-400/20"
                      >
                        {d}
                      </button>
                    ))}
                 </div>
              </div>
            ) : (
              <div className="bg-white/[0.02] p-4 sm:p-5 rounded-[2.5rem] border border-white/5 backdrop-blur-md shadow-2xl flex items-center justify-center min-h-[480px] sm:min-h-[520px]">
                <div className="grid grid-cols-4 gap-2.5 sm:gap-4 w-full mx-auto justify-items-center max-w-lg">
                  {gameState.cards.map((card, idx) => (
                    <Card key={card.id} card={card} onClick={() => handleCardClick(idx)} disabled={isProcessing} />
                  ))}
                </div>
              </div>
            )}
          </section>

          <aside className="order-1 lg:order-2 flex flex-col gap-5">
             <div className="bg-white/5 backdrop-blur-3xl p-5 rounded-[2rem] border border-white/10 shadow-2xl space-y-5">
                <div className="flex items-center gap-2.5">
                   <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                   </div>
                   <h3 className="font-fredoka text-base font-bold">Mission Control</h3>
                </div>

                <div className="space-y-2">
                   <button onClick={() => initGame(gameState.difficulty)} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-black text-xs transition-all active:scale-95">Restart Mission</button>
                   <button onClick={() => setIsLeaderboardOpen(true)} className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black rounded-xl font-black text-xs transition-all active:scale-95 shadow-lg shadow-yellow-400/20 flex items-center justify-center gap-1.5">🏆 Leaderboard</button>
                   <button onClick={() => setGameState(prev => ({ ...prev, status: 'IDLE' }))} className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-gray-400 text-[10px] transition-colors">Main Menu</button>
                </div>

                <div className="pt-4 border-t border-white/10">
                   <p className="text-[8px] text-gray-500 uppercase font-black mb-2.5 text-center tracking-widest">Difficulty</p>
                   <div className="grid grid-cols-2 gap-1 p-1 bg-black/40 rounded-xl">
                     {([Difficulty.EASY, Difficulty.MEDIUM] as Difficulty[]).map(d => (
                       <button key={d} onClick={() => initGame(d)} className={`py-1.5 text-[8px] font-black rounded-lg transition-all ${gameState.difficulty === d ? 'bg-yellow-400 text-black' : 'text-gray-500 hover:text-white'}`}>{d}</button>
                     ))}
                   </div>
                </div>
             </div>
          </aside>
        </div>
      </main>

      {/* WIN MODAL */}
      {gameState.status === 'WON' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-yellow-400 p-1 rounded-[2.5rem] shadow-2xl max-w-[320px] w-full animate-scaleIn">
            <div className="bg-[#050a0f] rounded-[2.35rem] p-6 flex flex-col items-center text-center space-y-5">
              <span className="text-5xl animate-bounce">🍌</span>
              <div>
                <h2 className="text-2xl font-fredoka font-bold text-yellow-400 uppercase tracking-tight">Mission Complete!</h2>
                <p className="text-gray-400 text-sm mt-1">Moves: <span className="text-white font-bold">{gameState.moves}</span> | Time: <span className="text-white font-bold">{Math.floor(timer/60)}:{timer%60}</span></p>
              </div>
              <div className="w-full space-y-2">
                <input type="text" placeholder="Enter Agent Name..." value={playerName} onChange={(e) => setPlayerName(e.target.value)} maxLength={12} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 transition-colors text-center font-bold text-sm" />
                <button onClick={saveToLeaderboard} disabled={!playerName.trim()} className="w-full py-3 bg-yellow-400 text-black font-black text-base rounded-xl active:scale-95 transition-all shadow-lg shadow-yellow-400/20 disabled:opacity-50">SAVE RECORD</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LEADERBOARD MODAL */}
      {isLeaderboardOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-scaleIn flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
               <h2 className="text-xl font-fredoka font-bold text-blue-600 flex items-center gap-2">🏆 LEADERBOARD</h2>
               <button onClick={() => setIsLeaderboardOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white text-gray-800">
                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-blue-600 text-white font-black uppercase text-[10px] sm:text-xs tracking-widest">
                        <th className="px-4 py-4 text-center">RANK</th>
                        <th className="px-4 py-4">PLAYER</th>
                        <th className="px-4 py-4 text-center">MOVES</th>
                        <th className="px-4 py-4 text-center">DIFFICULTY</th>
                        <th className="px-4 py-4 text-center">TIME</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {leaderboard.length > 0 ? leaderboard.map((entry, index) => (
                        <tr key={entry.id} className={`${index < 3 ? 'bg-yellow-50/50' : 'bg-white'} hover:bg-gray-50 transition-colors text-sm`}>
                          <td className="px-4 py-4 text-center font-bold text-blue-600">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                          </td>
                          <td className="px-4 py-4 font-bold text-gray-700">{entry.name}</td>
                          <td className="px-4 py-4 text-center font-black text-blue-700">{entry.moves}</td>
                          <td className="px-4 py-4 text-center">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${entry.difficulty === Difficulty.MEDIUM ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                              {entry.difficulty}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center text-gray-500 text-xs font-semibold">{entry.time}s</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={5} className="py-16 text-center text-gray-400 font-bold">No records yet. 🍌</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
            </div>
            <div className="p-4 bg-white border-t border-gray-100">
              <button onClick={() => setIsLeaderboardOpen(false)} className="w-full py-3.5 bg-blue-600 text-white font-black rounded-xl active:scale-[0.98] transition-all text-sm uppercase shadow-md shadow-blue-600/20">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
