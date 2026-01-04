
import React from 'react';
import { Card as CardType } from '../types';

interface CardProps {
  card: CardType;
  onClick: () => void;
  disabled: boolean;
}

const Card: React.FC<CardProps> = ({ card, onClick, disabled }) => {
  const isFlipped = card.isFlipped || card.isMatched;

  return (
    <div 
      className={`relative w-full aspect-[3/4] cursor-pointer perspective-1000 ${isFlipped ? 'card-flipped' : ''}`}
      onClick={() => {
        if (!disabled && !isFlipped) {
          onClick();
        }
      }}
    >
      <div className="card-inner w-full h-full relative rounded-2xl shadow-xl transform-gpu transition-transform duration-300">
        
        {/* Card Front (Minion Goggle Design) */}
        <div className="card-front absolute inset-0 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-2xl flex items-center justify-center backface-hidden z-10 border-2 border-white/10">
          <div className="relative w-10 h-10 sm:w-14 sm:h-14 bg-white rounded-full border-[4px] border-gray-400 flex items-center justify-center shadow-inner overflow-hidden">
             <div className="w-5 h-5 sm:w-7 sm:h-7 bg-gray-800 rounded-full flex items-center justify-center relative">
                <div className="w-1.5 h-1.5 bg-white rounded-full absolute top-0.5 right-1.5 opacity-80"></div>
             </div>
             {/* Goggle Strap */}
             <div className="absolute top-1/2 -left-10 -right-10 h-2.5 bg-gray-700 -translate-y-1/2 -z-10"></div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1/6 bg-blue-600/20 rounded-b-2xl"></div>
        </div>

        {/* Card Back (Minion Photo) */}
        <div className="card-back absolute inset-0 bg-white rounded-2xl rotate-y-180 backface-hidden overflow-hidden border-2 border-white flex items-center justify-center">
          <img 
            src={card.image} 
            alt="Minion" 
            className="w-full h-full object-cover"
            loading="eager"
            onError={(e) => {
              // Fallback to stylized robot/minion if local image fails
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=minion-${card.pairId}&backgroundColor=facc15`;
            }}
          />
          
          {/* Match Completion Feedback */}
          {card.isMatched && (
            <div className="absolute inset-0 bg-green-500/20 backdrop-blur-[1px] flex items-center justify-center animate-pulse">
               <div className="bg-green-500 text-white rounded-full p-1.5 shadow-2xl border-2 border-white transform scale-110">
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

export default Card;
