
import React, { useState, useEffect } from 'react';
import { Card as CardType } from '../types.ts';

interface CardProps {
  card: CardType;
  onClick: () => void;
  disabled: boolean;
}

const Card: React.FC<CardProps> = ({ card, onClick, disabled }) => {
  const isFlipped = card.isFlipped || card.isMatched;
  const [hasError, setHasError] = useState(false);

  // utils/gameUtils.ts에서 이미 public/images/... 경로를 가지고 있으므로 그대로 사용합니다.
  const imageSrc = card.image;

  useEffect(() => {
    setHasError(false);
  }, [card.image]);

  return (
    <div 
      className={`relative w-full aspect-square cursor-pointer perspective-1000 ${isFlipped ? 'card-flipped' : ''} group`}
      onClick={() => {
        if (!disabled && !isFlipped) {
          onClick();
        }
      }}
    >
      <div className="card-inner w-full h-full relative rounded-2xl sm:rounded-3xl shadow-lg transform-gpu transition-transform duration-500 group-hover:scale-[1.02]">
        
        {/* 앞면: 미니언 고글 디자인 */}
        <div className="card-front absolute inset-0 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-2xl sm:rounded-3xl flex items-center justify-center backface-hidden z-10 border-2 border-white/40 overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.1)]">
          <div className="relative w-full h-full flex items-center justify-center p-3 sm:p-5">
             <div className="relative w-full max-w-[85px] aspect-square bg-white rounded-full border-[6px] sm:border-[10px] border-gray-400 flex items-center justify-center shadow-xl z-20 overflow-hidden">
                <div className="w-1/2 h-1/2 bg-gray-800 rounded-full flex items-center justify-center relative">
                   <div className="w-1/3 h-1/3 bg-white rounded-full absolute top-1 right-1 opacity-90"></div>
                </div>
             </div>
             <div className="absolute top-1/2 left-0 right-0 h-[15%] bg-gray-800 -translate-y-1/2 z-10 shadow-md"></div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-blue-600/20 backdrop-blur-sm rounded-b-2xl sm:rounded-b-3xl border-t border-white/10"></div>
        </div>

        {/* 뒷면: 미니언 사진 */}
        <div className="card-back absolute inset-0 bg-white rounded-2xl sm:rounded-3xl rotate-y-180 backface-hidden overflow-hidden border-4 border-white shadow-2xl flex items-center justify-center">
          {!hasError ? (
            <img 
              src={imageSrc} 
              alt="Minion" 
              className="w-full h-full object-cover"
              onError={() => {
                console.warn(`Image Load Failed: ${imageSrc}`);
                setHasError(true);
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-yellow-50 p-2 text-center">
               <span className="text-4xl mb-1 animate-bounce">🍌</span>
               <div className="px-2 leading-tight">
                 <p className="text-[10px] text-yellow-700 font-bold uppercase">Not Found</p>
                 <span className="text-[8px] text-yellow-600/60 font-mono mt-1 block break-all">{imageSrc}</span>
               </div>
            </div>
          )}
          
          {card.isMatched && (
            <div className="absolute inset-0 bg-green-500/20 backdrop-blur-[1px] flex items-center justify-center z-20 animate-pulse">
               <div className="bg-green-500 text-white rounded-full p-2.5 shadow-2xl border-4 border-white transform scale-125">
                 <svg xmlns="http://www.w3.org/2000/center" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M5 13l4 4L19 7" />
                 </svg>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Card;
