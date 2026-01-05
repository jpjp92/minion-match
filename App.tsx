
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Difficulty, GameState, Card as CardType, LeaderboardEntry } from './types.ts';
import { createBoard, fetchAvailableImages, preloadImages } from './utils/gameUtils.ts';
import { getMinionFeedback } from './services/geminiService.ts';
import Card from './components/Card.tsx';
import MinionFeedback from './components/MinionFeedback.tsx';

const App: React.FC = () => {
  const [imagePool, setImagePool] = useState<string[]>([]);
  const [isLoadingPool, setIsLoadingPool] = useState(true);
  const [isGameLoading, setIsGameLoading] = useState(false);
  const [minionMsg, setMinionMsg] = useState("Bello! Ready for Banana?");
  const [isAiThinking, setIsAiThinking] = useState(false);
  
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

  // Gemini 피드백 업데이트 함수
  const updateFeedback = async (type: 'MATCH' | 'MISS' | 'WIN' | 'GREETING' | 'STUCK', moves: number) => {
    setIsAiThinking(true);
    const feedback = await getMinionFeedback(type, moves, gameState.difficulty);
    setMinionMsg(feedback);
    setIsAiThinking(false);
  };

  useEffect(() => {
    const loadAssets = async () => {
      const images = await fetchAvailableImages();
      setImagePool(images);
      setIsLoadingPool(false);
    };
    loadAssets();

    const saved = localStorage.getItem('minion_leaderboard');
    if (saved) setLeaderboard(JSON.parse(saved));
    
    // 첫 인사
    updateFeedback('GREETING', 0);
  }, []);

  const initGame = useCallback(async (difficulty: Difficulty = gameState.difficulty) => {
    if (imagePool.length === 0) return;

    setIsGameLoading(true);
    const newCards = createBoard(difficulty, imagePool);
    
    // 카드 이미지들만 추출해서 프리로딩
    const imageUrls = Array.from(new Set(newCards.map(c => c.image)));
    await preloadImages(imageUrls);

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
    setIsGameLoading(false);
    
    setMinionMsg("Tulaliloo! Go go go!");
  }, [gameState.difficulty, imagePool]);

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
          // 맞췄을 때 AI 반응 (가끔씩만 호출하여 성능 보존)
          if (Math.random() > 0.4) updateFeedback('MATCH', nextMoves);
          
          setTimeout(() => {
            setGameState(current => {
              const matchedCards = [...current.cards];
              matchedCards[firstIdx].isMatched = true;
              matchedCards[secondIdx].isMatched = true;
              const nextMatches = current.matches + 1;
              const totalPairs = current.cards.length / 2;
              const hasWon = nextMatches === totalPairs;
              if (hasWon) {
                if (timerRef.current) clearInterval(timerRef.current);
                updateFeedback('WIN', nextMoves);
              }
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
          }, 400);
        } else {
          // 틀렸을 때 AI 반응
          if (nextMoves % 5 === 0) updateFeedback('MISS', nextMoves);

          setTimeout(() => {
            setGameState(current => {
              const resetCards = [...current.cards];
              resetCards[firstIdx].isFlipped = false;
              resetCards[secondIdx].isFlipped = false;
              setIsProcessing(false);
              return { ...current, cards: resetCards, flippedIndices: [] };
            });
          }, 800);
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
    <div className="min-h-screen flex flex-col items-center bg-[#050a0f] text-white selection:bg-yellow-400 overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(30,58,138,0.1),transparent_70%)]"></div>
      </div>

      <main className="relative z-10 w-full max-w-5xl px-3 sm:px-4 py-4 sm:py-6 flex flex-col gap-4">
        {/* Gemini Feedback Section */}
        <div className="flex justify-center sm:justify-start px-2">
           <MinionFeedback message={minionMsg} isThinking={isAiThinking} />
        </div>

        <header className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] sm:rounded-[2rem] p-3 sm:p-5 shadow-2xl mt-[-1rem]">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-4xl font-fredoka font-bold text-yellow-400 leading-none tracking-tight">MINION MATCH</h1>
            <p className="text-blue-300 font-black uppercase text-[8px] sm:text-[9px] tracking-widest mt-1">Classic Edition</p>
          </div>

          <div className="grid grid-cols-4 gap-1 sm:gap-2 bg-black/40 rounded-xl sm:rounded-2xl p-1 border border-white/10 w-full sm:w-auto">
            {[
              { label: 'Moves', value: gameState.moves, color: 'text-white' },
              { label: 'Time', value: `${Math.floor(timer/60)}:${(timer%60).toString().padStart(2,'0')}`, color: 'text-blue-400' },
              { label: 'Pairs', value: `${gameState.matches}/${actualTotalPairs}`, color: 'text-yellow-400' },
              { label: 'Best', value: gameState.bestScore === 0 ? '--' : gameState.bestScore, color: 'text-purple-400' }
            ].map((stat, i) => (
              <div key={i} className="px-1.5 py-1 text-center border-r last:border-0 border-white/5 min-w-[55px] sm:min-w-[85px]">
                <p className="text-[6px] sm:text-[7px] uppercase font-black text-gray-500 tracking-tighter mb-0.5">{stat.label}</p>
                <p className={`text-[13px] sm:text-base font-black ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </header>

        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_260px] gap-4 sm:gap-5">
          <section className="order-2 lg:order-1">
            {gameState.status === 'IDLE' || isGameLoading ? (
              <div className="min-h-[400px] sm:min-h-[520px] flex flex-col items-center justify-center space-y-6 bg-white/[0.02] rounded-[2rem] sm:rounded-[2.5rem] border-2 border-dashed border-white/10 p-6">
                 {isGameLoading ? (
                   <>
                     <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                     <p className="font-fredoka text-lg font-bold text-yellow-400 animate-pulse">Preloading Bananas...</p>
                   </>
                 ) : (
                   <>
                     <span className="text-6xl sm:text-7xl animate-bounce">🍌</span>
                     <h2 className="text-lg sm:text-xl font-bold font-fredoka">Select Your Mission</h2>
                     <div className="flex flex-col sm:flex-row justify-center gap-3 w-full max-w-xs sm:max-w-md">
                        {(['EASY', 'MEDIUM'] as Difficulty[]).map(d => (
                          <button 
                            key={d} 
                            onClick={() => initGame(d)} 
                            className="flex-1 py-3.5 sm:py-4 bg-yellow-400 text-black rounded-2xl font-black text-base sm:text-lg hover:scale-105 transition-all active:scale-95 shadow-lg shadow-yellow-400/20"
                          >
                            {d}
                          </button>
                        ))}
                     </div>
                   </>
                 )}
              </div>
            ) : (
              <div className="bg-white/[0.02] p-2.5 sm:p-5 rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 backdrop-blur-md shadow-2xl flex items-center justify-center min-h-[400px] sm:min-h-[520px]">
                <div className={`grid grid-cols-4 gap-2 sm:gap-4 w-full mx-auto justify-items-center ${gameState.difficulty === Difficulty.EASY ? 'max-w-md' : 'max-w-lg'}`}>
                  {gameState.cards.map((card, idx) => (
                    <Card key={card.id} card={card} onClick={() => handleCardClick(idx)} disabled={isProcessing} />
                  ))}
                </div>
              </div>
            )}
          </section>

          <aside className="order-1 lg:order-2 flex flex-col gap-4">
             <div className="bg-white/5 backdrop-blur-3xl p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 shadow-2xl space-y-4 sm:space-y-5">
                <div className="hidden sm:flex items-center gap-2.5">
                   <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                   </div>
                   <h3 className="font-fredoka text-sm sm:text-base font-bold text-blue-400">MISSION CONTROL</h3>
                </div>

                <div className="grid grid-cols-3 sm:flex sm:flex-col gap-2">
                   <button onClick={() => initGame(gameState.difficulty)} className="py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-black text-[10px] sm:text-xs transition-all active:scale-95">Restart</button>
                   <button onClick={() => setIsLeaderboardOpen(true)} className="py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black rounded-xl font-black text-[10px] sm:text-xs transition-all active:scale-95 shadow-lg shadow-yellow-400/10">🏆 Board</button>
                   <button onClick={() => setGameState(prev => ({ ...prev, status: 'IDLE' }))} className="py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-gray-400 text-[9px] sm:text-[10px]">Menu</button>
                </div>

                <div className="pt-3 sm:pt-4 border-t border-white/10">
                   <p className="text-[7px] sm:text-[8px] text-gray-500 uppercase font-black mb-2 text-center tracking-widest">Difficulty</p>
                   <div className="grid grid-cols-2 gap-1 p-1 bg-black/40 rounded-xl">
                     {([Difficulty.EASY, Difficulty.MEDIUM] as Difficulty[]).map(d => (
                       <button key={d} onClick={() => initGame(d)} className={`py-1.5 text-[7px] sm:text-[8px] font-black rounded-lg transition-all ${gameState.difficulty === d ? 'bg-yellow-400 text-black' : 'text-gray-500 hover:text-white'}`}>{d}</button>
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
          <div className="bg-yellow-400 p-0.5 sm:p-1 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl max-w-[300px] sm:max-w-[320px] w-full animate-scaleIn">
            <div className="bg-[#050a0f] rounded-[1.85rem] sm:rounded-[2.35rem] p-5 sm:p-6 flex flex-col items-center text-center space-y-4 sm:space-y-5">
              <span className="text-4xl sm:text-5xl animate-bounce">🍌</span>
              <div>
                <h2 className="text-xl sm:text-2xl font-fredoka font-bold text-yellow-400 uppercase tracking-tight">Mission Complete!</h2>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">Moves: <span className="text-white font-bold">{gameState.moves}</span> | Time: <span className="text-white font-bold">{Math.floor(timer/60)}:{timer%60}</span></p>
              </div>
              <div className="w-full space-y-2">
                <input type="text" placeholder="Enter Agent Name..." value={playerName} onChange={(e) => setPlayerName(e.target.value)} maxLength={12} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 transition-colors text-center font-bold text-xs sm:text-sm" />
                <button onClick={saveToLeaderboard} disabled={!playerName.trim()} className="w-full py-3 bg-yellow-400 text-black font-black text-sm sm:text-base rounded-xl active:scale-95 transition-all shadow-lg shadow-yellow-400/20 disabled:opacity-50">SAVE RECORD</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LEADERBOARD MODAL */}
      {isLeaderboardOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-scaleIn flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-white">
               <h2 className="text-lg sm:text-xl font-fredoka font-bold text-blue-600 flex items-center gap-2">🏆 LEADERBOARD</h2>
               <button onClick={() => setIsLeaderboardOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-white text-gray-800">
                <div className="border border-gray-100 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[300px]">
                    <thead>
                      <tr className="bg-blue-600 text-white font-black uppercase text-[8px] sm:text-[10px] tracking-widest">
                        <th className="px-2 sm:px-4 py-3 sm:py-4 text-center">RANK</th>
                        <th className="px-2 sm:px-4 py-3 sm:py-4">PLAYER</th>
                        <th className="px-2 sm:px-4 py-3 sm:py-4 text-center">MOVES</th>
                        <th className="px-2 sm:px-4 py-3 sm:py-4 text-center">MODE</th>
                        <th className="px-2 sm:px-4 py-3 sm:py-4 text-center">TIME</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {leaderboard.length > 0 ? leaderboard.map((entry, index) => (
                        <tr key={entry.id} className={`${index < 3 ? 'bg-yellow-50/50' : 'bg-white'} hover:bg-gray-50 transition-colors text-[10px] sm:text-sm`}>
                          <td className="px-2 sm:px-4 py-3 sm:py-4 text-center font-bold text-blue-600">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                          </td>
                          <td className="px-2 sm:px-4 py-3 sm:py-4 font-bold text-gray-700 truncate max-w-[80px] sm:max-w-none">{entry.name}</td>
                          <td className="px-2 sm:px-4 py-3 sm:py-4 text-center font-black text-blue-700">{entry.moves}</td>
                          <td className="px-2 sm:px-4 py-3 sm:py-4 text-center">
                            <span className={`px-1.5 py-0.5 rounded-md text-[7px] sm:text-[9px] font-black uppercase ${entry.difficulty === Difficulty.MEDIUM ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                              {entry.difficulty.charAt(0)}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-3 sm:py-4 text-center text-gray-500 text-[9px] sm:text-xs font-semibold">{entry.time}s</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={5} className="py-12 text-center text-gray-400 font-bold text-sm">No records yet. 🍌</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
            </div>
            <div className="p-3 sm:p-4 bg-white border-t border-gray-100">
              <button onClick={() => setIsLeaderboardOpen(false)} className="w-full py-3 sm:py-3.5 bg-blue-600 text-white font-black rounded-xl active:scale-[0.98] transition-all text-xs sm:text-sm uppercase shadow-md shadow-blue-600/20">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
