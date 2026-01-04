
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Difficulty, GameState, Card as CardType } from './types.ts';
import { createBoard } from './utils/gameUtils.ts';
import Card from './components/Card.tsx';
import MinionFeedback from './components/MinionFeedback.tsx';

const MINION_PHRASES = {
  GREETING: ["Bello!", "Banana?", "Tulaliloo!", "Mission ready!"],
  MATCH: ["Yay! Banana!", "Ooh-la-la!", "Poka-poka!", "Matchy-matchy!"],
  MISS: ["Bee-do! Bee-do!", "Oopsie!", "Poopaye?", "Oh nooo!"],
  WIN: ["BANANA PARTY!", "Tulaliloo! You win!", "King Bob!", "Papoy!"],
};

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

  const [aiMessage, setAiMessage] = useState("Bello! Ready for Banana?");
  const [isProcessing, setIsProcessing] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<number | null>(null);

  const triggerFeedback = useCallback((type: keyof typeof MINION_PHRASES) => {
    const phrases = MINION_PHRASES[type];
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    setAiMessage(randomPhrase);
  }, []);

  const initGame = useCallback((difficulty: Difficulty = gameState.difficulty) => {
    const newCards = createBoard(difficulty);
    const bestScore = Number(localStorage.getItem(`bestScore_${difficulty}`)) || 0;
    
    setGameState(prev => ({
      ...prev,
      cards: newCards,
      flippedIndices: [],
      moves: 0,
      matches: 0,
      status: 'PLAYING',
      difficulty,
      bestScore
    }));
    
    setTimer(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTimer(t => t + 1);
    }, 1000);

    triggerFeedback('GREETING');
  }, [gameState.difficulty, triggerFeedback]);

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
      const newMoves = moves + 1;

      if (isMatch) {
        newCards[firstIndex].isMatched = true;
        newCards[secondIndex].isMatched = true;
        const newMatches = matches + 1;
        
        let totalPairs = 6;
        if (gameState.difficulty === Difficulty.MEDIUM) totalPairs = 10;
        if (gameState.difficulty === Difficulty.HARD) totalPairs = 12;

        const hasWon = newMatches === totalPairs;

        setGameState(prev => ({
          ...prev,
          cards: newCards,
          flippedIndices: [],
          matches: newMatches,
          moves: newMoves,
          status: hasWon ? 'WON' : 'PLAYING'
        }));
        
        if (hasWon) {
          if (timerRef.current) clearInterval(timerRef.current);
          triggerFeedback('WIN');
          updateBestScore(newMoves, gameState.difficulty);
        } else {
          triggerFeedback('MATCH');
        }
        setIsProcessing(false);
      } else {
        setGameState(prev => ({ ...prev, cards: newCards, moves: newMoves }));
        triggerFeedback('MISS');
        
        setTimeout(() => {
          newCards[firstIndex].isFlipped = false;
          newCards[secondIndex].isFlipped = false;
          setGameState(prev => ({ ...prev, cards: newCards, flippedIndices: [] }));
          setIsProcessing(false);
        }, 600);
      }
    }
  };

  const updateBestScore = (score: number, difficulty: Difficulty) => {
    const key = `bestScore_${difficulty}`;
    const currentBest = Number(localStorage.getItem(key)) || Infinity;
    if (score < currentBest || currentBest === 0) {
      localStorage.setItem(key, score.toString());
      setGameState(prev => ({ ...prev, bestScore: score }));
    }
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#050a0f] text-white selection:bg-yellow-400 overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-yellow-500/10 blur-[100px] rounded-full"></div>
      </div>

      <main className="relative z-10 w-full max-w-7xl px-4 py-8 flex flex-col gap-8">
        <header className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-6xl font-fredoka font-bold text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.4)]">
              MINION MATCH
            </h1>
            <div className="flex items-center justify-center lg:justify-start gap-2 text-blue-300 font-black uppercase text-[10px] tracking-[0.25em] mt-2">
              <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
              Classic Edition
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/40 rounded-[2rem] p-2 border border-white/10 shadow-inner">
            {[
              { label: 'Moves', value: gameState.moves, color: 'text-white' },
              { label: 'Time', value: `${Math.floor(timer/60)}:${(timer%60).toString().padStart(2,'0')}`, color: 'text-blue-400' },
              { label: 'Target', value: gameState.status === 'IDLE' ? '--' : (gameState.difficulty === Difficulty.MEDIUM ? '10 Pairs' : gameState.difficulty === Difficulty.HARD ? '12 Pairs' : '6 Pairs'), color: 'text-yellow-400' },
              { label: 'Best', value: gameState.bestScore === 0 ? '--' : gameState.bestScore, color: 'text-purple-400' }
            ].map((stat, i) => (
              <div key={i} className="px-4 py-2 text-center border-r last:border-0 border-white/10 sm:min-w-[100px]">
                <p className="text-[9px] uppercase font-black text-gray-500 mb-0.5 tracking-widest">{stat.label}</p>
                <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </header>

        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_340px] gap-8">
          <section className="order-2 lg:order-1 flex flex-col min-h-[500px]">
            {gameState.status === 'IDLE' ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-10 bg-white/[0.02] rounded-[3.5rem] border-2 border-dashed border-white/10 backdrop-blur-xl">
                 <div className="text-center space-y-5 px-8">
                    <div className="w-28 h-28 bg-yellow-400 rounded-3xl flex items-center justify-center mx-auto shadow-2xl rotate-6 hover:rotate-0 transition-all duration-500">
                       <span className="text-6xl">🍌</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-fredoka font-bold text-white">Start New Mission</h2>
                    <p className="text-gray-400 font-medium italic">"Choose your difficulty and find pairs!"</p>
                 </div>
                 <div className="flex flex-wrap justify-center gap-4">
                    {(['EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map(d => (
                      <button
                        key={d}
                        onClick={() => initGame(d)}
                        className="px-10 py-4 bg-yellow-400 text-gray-900 rounded-2xl font-black text-lg hover:bg-yellow-300 transition-all hover:scale-105 shadow-xl shadow-yellow-400/20 active:scale-95"
                      >
                        {d}
                      </button>
                    ))}
                 </div>
              </div>
            ) : (
              <div className="bg-white/[0.02] p-4 sm:p-8 rounded-[3.5rem] border border-white/5 backdrop-blur-md shadow-2xl flex items-center justify-center">
                <div className={`grid gap-3 sm:gap-4 w-full mx-auto transition-all ${
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
            <div className="lg:sticky lg:top-8 flex flex-col gap-6">
              <MinionFeedback message={aiMessage} />
              
              <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/10 shadow-2xl space-y-6">
                 <div className="flex items-center gap-4">
                   <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/30">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                     </svg>
                   </div>
                   <h3 className="font-fredoka text-xl font-bold tracking-tight">Mission Control</h3>
                 </div>
                 
                 <div className="space-y-3">
                   <button onClick={() => initGame(gameState.difficulty)} className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-base transition-all shadow-xl shadow-blue-600/30 active:scale-95">Restart Mission</button>
                   <button onClick={() => setGameState(prev => ({ ...prev, status: 'IDLE' }))} className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold text-gray-400 text-sm">Quit to Menu</button>
                 </div>

                 <div className="pt-6 border-t border-white/10">
                   <p className="text-[10px] text-gray-500 uppercase font-black mb-4 text-center tracking-[0.2em]">Change Difficulty</p>
                   <div className="flex gap-2 p-1.5 bg-black/40 rounded-2xl border border-white/5">
                     {([Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD] as Difficulty[]).map(d => (
                       <button
                         key={d}
                         onClick={() => initGame(d)}
                         className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${
                           gameState.difficulty === d ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20' : 'text-gray-500 hover:text-white'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-fadeIn">
          <div className="bg-gradient-to-br from-yellow-300 to-yellow-500 p-1 rounded-[3.5rem] shadow-[0_0_100px_rgba(250,204,21,0.3)] max-w-md w-full animate-scaleIn">
            <div className="bg-[#050a0f] rounded-[3.35rem] p-10 flex flex-col items-center text-center space-y-8">
              <div className="relative">
                <span className="text-7xl md:text-8xl block animate-bounce leading-none">🍌</span>
                <div className="absolute -top-4 -right-10 bg-red-600 text-white font-black px-4 py-1 rounded-xl text-xl shadow-2xl -rotate-12 border-2 border-white animate-pulse">PARTY!</div>
              </div>
              <div className="space-y-3">
                <h2 className="text-4xl md:text-5xl font-fredoka font-bold text-yellow-400 tracking-tight">Success!</h2>
                <p className="text-gray-400 font-medium">Finished in <span className="text-white font-bold">{gameState.moves}</span> moves</p>
              </div>
              <div className="w-full space-y-3">
                <button onClick={() => initGame(gameState.difficulty)} className="w-full py-5 bg-yellow-400 text-black font-black text-2xl rounded-3xl shadow-2xl hover:scale-105 transition-transform active:scale-95">PLAY AGAIN</button>
                <button onClick={() => setGameState(prev => ({...prev, status: 'IDLE'}))} className="w-full py-4 bg-white/5 text-gray-500 font-bold rounded-2xl">Main Menu</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
