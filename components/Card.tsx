
import React, { useState, useEffect, memo } from 'react';
import { Card as CardType } from '../types.ts';

interface CardProps {
  card: CardType;
  onClick: () => void;
  disabled: boolean;
  isPreviewing: boolean;
}

const Card: React.FC<CardProps> = ({ card, onClick, disabled, isPreviewing }) => {
  // 프리뷰 중이거나 유저가 선택했거나 이미 맞춘 경우 사진면(face-back)을 노출
  const isRevealed = isPreviewing || card.isFlipped || card.isMatched;
  const isMatched = card.isMatched;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgLoaded(false);
    setHasError(false);
    if (!card.image) return;
    
    const img = new Image();
    img.src = card.image;
    img.onload = () => setImgLoaded(true);
    img.onerror = () => setHasError(true);
  }, [card.image]);

  return (
    <div 
      className={`perspective-container relative w-full aspect-square ${isRevealed ? 'card-flipped' : ''} ${isMatched || isPreviewing ? 'pointer-events-none' : 'cursor-pointer active:scale-95'}`}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled && !isRevealed) {
          onClick();
        }
      }}
    >
      {/* 3D 레이어 렌더링 실패 시를 대비한 최후의 보루 (노란색 배경) */}
      <div className="absolute inset-0 bg-yellow-400 rounded-lg sm:rounded-2xl shadow-inner -z-10"></div>

      <div className="card-inner">
        {/* 앞면 (눈알) - rotateY(0deg) */}
        <div className="face face-front bg-gradient-to-br from-yellow-300 to-yellow-500 border sm:border-2 border-white/40 shadow-lg">
          <div className="relative w-full h-full flex items-center justify-center p-2">
             <div className="relative w-full max-w-[50px] sm:max-w-[70px] aspect-square bg-white rounded-full border-[3px] sm:border-[8px] border-gray-400 flex items-center justify-center shadow-md z-20">
                <div className="w-1/2 h-1/2 bg-gray-800 rounded-full flex items-center justify-center relative">
                   <div className="w-1/3 h-1/3 bg-white rounded-full absolute top-0.5 right-0.5 opacity-90"></div>
                </div>
             </div>
             <div className="absolute top-1/2 left-0 right-0 h-[8%] bg-gray-800 -translate-y-1/2 z-10"></div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-blue-600/10 backdrop-blur-sm"></div>
        </div>

        {/* 뒷면 (미니언 사진) - rotateY(180deg) */}
        <div className="face face-back bg-yellow-400 border sm:border-4 border-white shadow-2xl">
          {(!imgLoaded || hasError) && (
            <div className="absolute inset-0 bg-yellow-400 flex flex-col items-center justify-center p-2 text-center">
               <span className="text-xl sm:text-2xl mb-1 animate-bounce">🍌</span>
               <p className="text-[8px] sm:text-[10px] text-gray-900 font-bold uppercase tracking-tight">
                 {hasError ? 'No Banana' : 'Ready'}
               </p>
            </div>
          )}
          
          <img 
            src={card.image} 
            alt="Minion" 
            className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
          
          {isMatched && (
            <div className="absolute inset-0 bg-green-500/30 backdrop-blur-[1px] flex items-center justify-center z-20 animate-fadeIn">
               <div className="bg-green-600 text-white rounded-full p-1.5 shadow-2xl border-2 border-white transform animate-scaleIn">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

export default memo(Card, (prev, next) => {
  return (
    prev.card.isFlipped === next.card.isFlipped &&
    prev.card.isMatched === next.card.isMatched &&
    prev.disabled === next.disabled &&
    prev.isPreviewing === next.isPreviewing
  );
});
