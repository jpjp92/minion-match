
import React from 'react';

interface MinionFeedbackProps {
  message: string;
}

const MinionFeedback: React.FC<MinionFeedbackProps> = ({ message }) => {
  return (
    <div className="flex items-end space-x-4 mb-6 transition-all duration-500 animate-fadeIn">
      {/* Minion Avatar */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-yellow-400 rounded-full border-4 border-yellow-500 flex-shrink-0 relative floating overflow-hidden shadow-xl shadow-yellow-400/20">
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-blue-600"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-10 h-10 bg-white border-2 border-gray-700 rounded-full flex items-center justify-center z-10">
          <div className="w-4 h-4 bg-gray-800 rounded-full"></div>
        </div>
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-700 z-0"></div>
      </div>
      
      {/* Speech Bubble */}
      <div className="relative bg-white text-gray-800 px-5 py-3 rounded-2xl rounded-bl-none shadow-2xl border-2 border-yellow-400 max-w-[280px]">
        <p className="font-fredoka font-bold text-sm sm:text-base italic leading-snug">
          "{message}"
        </p>
        <div className="absolute bottom-0 -left-2 w-0 h-0 border-t-[10px] border-t-transparent border-r-[15px] border-r-white"></div>
      </div>
    </div>
  );
};

export default MinionFeedback;
