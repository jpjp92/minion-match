
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Difficulty, GameState, Card as CardType } from './types.ts';
import { createBoard } from './utils/gameUtils.ts';
import { getMinionFeedback } from './services/geminiService.ts';
import Card from './components/Card.tsx';
import MinionFeedback from './components/MinionFeedback.tsx';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    cards: [],
    flippedIndices: [],
    moves: 0,
    matches: 0,
    status: 'IDLE',
    difficulty: Difficulty.EASY,
    bestScore: Number(localStorage.getItem('bestScore')) || 0,
  });

  const [aiMessage, setAiMessage] = useState("Bello! Mission ready? Banana!");
  const [isProcessing, setIsProcessing] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<number | null>(null);

  const initGame = useCallback((difficulty: Difficulty = gameState.difficulty) => {
    const newCards = createBoard(difficulty);
    setGameState(prev => ({
      ...prev,
      cards: newCards,
      flippedIndices: [],
      moves: 0,
      matches: 0,
      status: 'PLAYING',
      difficulty
    }));
    setTimer(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTimer(t => t + 1);
    }, 1000);

    fetchFeedback('GREETING');
  }, [gameState.difficulty]);

  const fetchFeedback = async (type: 'MATCH' | 'MISS' | 'WIN' | 'GREETING' | 'STUCK') => {
    try {
      const msg = await getMinionFeedback(type);
      setAiMessage(msg);
    } catch (e) {
      // Graceful fallback if AI quota is exceeded
      setAiMessage(type === 'MATCH' ? "Yay! Banana!" : "Bee-do! Poka?");
    }
  };

  const handleCardClick = (index: number) => {
    if (isProcessing || gameState.status !== 'PLAYING') return;
    const { flippedIndices, cards, moves, matches } = gameState;
    
    if (flippedIndices.includes(index) || cards[index].isMatched || cards[index].isFlipped) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;

    if (flippedIndices.length === 0) {
      setGameState({ ...gameState, flippedIndices: [index], cards: newCards });
    } else {
      const firstIndex = flippedIndices[0];
      const secondIndex = index;
      setIsProcessing(true);

      const isMatch = cards[firstIndex].pairId === cards[secondIndex].pairId;

      if (isMatch) {
        newCards[firstIndex].isMatched = true;
        newCards[secondIndex].isMatched = true;
        const newMatches = matches + 1;
        
        let totalPairs = 6;
        if (gameState.difficulty === Difficulty.MEDIUM) totalPairs = 10;
        if (gameState.difficulty === Difficulty.HARD) totalPairs = 12;

        setGameState(prev => ({
          ...prev,
          cards: newCards,
          flippedIndices: [],
          matches: newMatches,
          moves: moves + 1,
          status: newMatches === totalPairs ? 'WON' : 'PLAYING'
        }));
        
        if (newMatches === totalPairs) {
          if (timerRef.current) clearInterval(timerRef.current);
          fetchFeedback('WIN');
          updateBestScore(moves + 1);
        } else {
          fetchFeedback('MATCH');
        }
        setIsProcessing(false);
      } else {
        setGameState(prev => ({ ...prev, cards: newCards, moves: moves + 1 }));
        fetchFeedback('MISS');
        
        setTimeout(() => {
          newCards[firstIndex].isFlipped = false;
          newCards[secondIndex].isFlipped = false;
          setGameState(prev => ({ ...prev, cards: newCards, flippedIndices: [] }));
          setIsProcessing(false);
        }, 450);
      }
    }
  };

  const updateBestScore = (score: number) => {
    const key = `bestScore_${gameState.difficulty}`;
    const currentBest = Number(localStorage.getItem(key)) || Infinity;
    if (score < currentBest) {
      localStorage.setItem(key, score.toString());
      setGameState(prev => ({ ...prev, bestScore: score }));
    }
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#0a0f18] text-white overflow-y-auto selection:bg-yellow-400 selection:text-black">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-yellow-500/5 blur-[120px] rounded-full"></div>
      </div>

      <main className="relative z-10 w-full max-w-7xl px-4 py-8 flex flex-col gap-8">
        <header className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl font-fredoka font-bold text-yellow-400 drop-shadow-lg tracking-tight">
              MINION MATCH
            </h1>
            <div className="flex items-center justify-center lg:justify-start gap-2 text-blue-300 font-bold uppercase text-[10px] tracking-widest mt-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>
              Banana Mission Active
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-black/40 rounded-[2rem] p-1.5 border border-white/5">
            {[
              { label: 'Moves', value: gameState.moves, color: 'text-white' },
              { label: 'Time', value: `${Math.floor(timer/60)}:${(timer%60).toString().padStart(2,'0')}`, color: 'text-blue-400' },
              { label: 'Target', value: gameState.status === 'IDLE' ? '--' : (gameState.difficulty === Difficulty.MEDIUM ? '10 Pairs' : gameState.difficulty === Difficulty.HARD ? '12 Pairs' : '6 Pairs'), color: 'text-yellow-400' },
              { label: 'Best', value: gameState.bestScore === 0 ? '--' : gameState.bestScore, color: 'text-purple-400' }
            ].map((stat, i) => (
              <div key={i} className="px-4 py-2 text-center border-r last:border-0 border-white/10 sm:min-w-[90px]">
                <p className="text-[9px] uppercase font-black text-gray-500 mb-0.5 tracking-tighter">{stat.label}</p>
                <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </header>

        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_320px] gap-8">
          <section className="order-2 lg:order-1 flex flex-col">
            {gameState.status === 'IDLE' ? (
              <div className="flex flex-col items-center justify-center space-y-10 min-h-[480px] bg-white/[0.02] rounded-[3.5rem] border-2 border-dashed border-white/10 backdrop-blur-md">
                 <div className="text-center space-y-4 px-8">
                    <div className="w-24 h-24 bg-yellow-400 rounded-3xl flex items-center justify-center mx-auto shadow-2xl rotate-3 hover:rotate-0 transition-transform">
                       <span className="text-5xl">🍌</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-fredoka font-bold text-white">Start New Mission</h2>
                    <p className="text-gray-400 font-medium italic">"Bello! Find all the minions!"</p>
                 </div>
                 <div className="flex flex-wrap justify-center gap-5">
                    {(['EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map(d => (
                      <button
                        key={d}
                        onClick={() => initGame(d)}
                        className="px-10 py-4 bg-yellow-400 text-gray-900 rounded-2xl font-black text-lg hover:bg-yellow-300 transition-all hover:scale-105 shadow-xl shadow-yellow-400/20"
                      >
                        {d}
                      </button>
                    ))}
                 </div>
              </div>
            ) : (
              <div className="bg-white/[0.02] p-6 rounded-[3rem] border border-white/5 backdrop-blur-sm shadow-2xl">
                <div className={`grid gap-3 sm:gap-4 mx-auto transition-all ${
                  gameState.difficulty === Difficulty.EASY ? 'grid-cols-3 sm:grid-cols-4 max-w-xl' : 
                  gameState.difficulty === Difficulty.MEDIUM ? 'grid-cols-4 sm:grid-cols-5 max-w-4xl' : 
                  'grid-cols-4 sm:grid-cols-6 max-w-5xl' 
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
            <div className="lg:sticky lg:top-10 flex flex-col gap-6">
              <MinionFeedback message={aiMessage} />
              <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-6">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-xl shadow-blue-600/20">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                     </svg>
                   </div>
                   <h3 className="font-fredoka text-xl font-bold">Mission HQ</h3>
                 </div>
                 <div className="space-y-3">
                   <button onClick={() => initGame(gameState.difficulty)} className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold transition-all shadow-xl shadow-blue-600/20">Restart Mission</button>
                   <button onClick={() => setGameState(prev => ({ ...prev, status: 'IDLE' }))} className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold text-gray-400">Quit to Menu</button>
                 </div>
                 <div className="pt-6 border-t border-white/10">
                   <p className="text-[10px] text-gray-500 uppercase font-black mb-4 text-center tracking-widest">Select Mission Level</p>
                   <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5">
                     {([Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD] as Difficulty[]).map(d => (
                       <button
                         key={d}
                         onClick={() => initGame(d)}
                         className={`flex-1 py-2.5 text-[10px] font-black rounded-xl transition-all ${
                           gameState.difficulty === d ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/10' : 'text-gray-500 hover:text-white'
                         }`}
                       >
                         {d}
                       </button>
                     ))}
                   </div>
                 </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {gameState.status === 'WON' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fadeIn">
          <div className="bg-gradient-to-br from-yellow-300 to-yellow-500 p-1 rounded-[3rem] shadow-[0_0_100px_rgba(250,204,21,0.3)] max-w-lg w-full animate-scaleIn">
            <div className="bg-[#0a0f18] rounded-[2.9rem] p-10 flex flex-col items-center text-center space-y-8">
              <div className="relative">
                <span className="text-6xl md:text-7xl block animate-bounce relative z-10 leading-none">🍌</span>
                <div className="absolute -top-4 -right-8 bg-red-600 text-white font-black px-4 py-1 rounded-xl text-lg shadow-xl -rotate-12 border-2 border-white">WIN!</div>
              </div>
              <h2 className="text-4xl md:text-5xl font-fredoka font-bold text-yellow-400">Banana Party!</h2>
              <button onClick={() => initGame(gameState.difficulty)} className="w-full py-5 bg-yellow-400 text-black font-black text-2xl rounded-3xl shadow-2xl hover:scale-105 transition-transform">GO AGAIN!</button>
              <button onClick={() => setGameState(prev => ({...prev, status: 'IDLE'}))} className="w-full py-4 bg-white/5 text-gray-400 font-bold rounded-2xl hover:bg-white/10">Main Menu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
