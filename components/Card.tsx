
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

  // 이미지 경로가 바뀔 때만 에러 상태 초기화
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
      <div className="card-inner w-full h-full relative rounded-lg sm:rounded-2xl shadow-lg transform-gpu transition-transform duration-500 group-hover:scale-[1.02]">
        
        {/* 앞면: 미니언 고글 디자인 */}
        <div className="card-front absolute inset-0 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-lg sm:rounded-2xl flex items-center justify-center backface-hidden z-10 border sm:border-2 border-white/40 overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.1)]">
          <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4">
             <div className="relative w-full max-w-[55px] sm:max-w-[70px] aspect-square bg-white rounded-full border-[3px] sm:border-[8px] border-gray-400 flex items-center justify-center shadow-lg z-20 overflow-hidden">
                <div className="w-1/2 h-1/2 bg-gray-800 rounded-full flex items-center justify-center relative">
                   <div className="w-1/3 h-1/3 bg-white rounded-full absolute top-0.5 right-0.5 opacity-90"></div>
                </div>
             </div>
             <div className="absolute top-1/2 left-0 right-0 h-[10%] bg-gray-800 -translate-y-1/2 z-10 shadow-sm"></div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-blue-600/20 backdrop-blur-sm rounded-b-lg sm:rounded-b-2xl border-t border-white/10"></div>
        </div>

        {/* 뒷면: 미니언 사진 */}
        <div className="card-back absolute inset-0 bg-white rounded-lg sm:rounded-2xl rotate-y-180 backface-hidden overflow-hidden border sm:border-4 border-white shadow-2xl flex items-center justify-center">
          {!hasError ? (
            <img 
              src={card.image} 
              alt="Minion" 
              className="w-full h-full object-cover"
              loading="eager"
              onError={() => {
                console.warn(`Failed to load image: ${card.image}`);
                setHasError(true);
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-2 text-center">
               <span className="text-2xl sm:text-3xl mb-1">🍌</span>
               <p className="text-[8px] sm:text-[10px] text-gray-500 font-bold uppercase leading-tight">Banana<br/>Missing!</p>
            </div>
          )}
          
          {card.isMatched && (
            <div className="absolute inset-0 bg-green-500/20 backdrop-blur-[1px] flex items-center justify-center z-20 animate-pulse">
               <div className="bg-green-500 text-white rounded-full p-1.5 sm:p-2 shadow-2xl border border-white transform scale-100 sm:scale-110">
                 <svg xmlns="http://www.w3.org/2000/center" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
