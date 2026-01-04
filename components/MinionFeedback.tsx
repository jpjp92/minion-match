
import React from 'react';

interface MinionFeedbackProps {
  message: string;
}

const MinionFeedback: React.FC<MinionFeedbackProps> = ({ message }) => {
  return (
    <div className="flex items-end space-x-4 mb-6 animate-fadeIn">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-yellow-400 rounded-full border-4 border-yellow-500 flex-shrink-0 relative floating overflow-hidden">
        {/* Simple Minion Avatar */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-blue-600"></div> {/* Overalls */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-10 h-10 bg-white border-2 border-gray-700 rounded-full flex items-center justify-center z-10">
          <div className="w-4 h-4 bg-gray-800 rounded-full"></div>
        </div>
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-700 z-0"></div>
      </div>
      <div className="relative bg-white text-gray-800 px-4 py-2 rounded-2xl rounded-bl-none shadow-xl border-2 border-yellow-400 max-w-[250px]">
        <p className="font-semibold text-sm sm:text-base italic">"{message}"</p>
        <div className="absolute bottom-0 -left-2 w-0 h-0 border-t-[8px] border-t-transparent border-r-[12px] border-r-white"></div>
      </div>
    </div>
  );
};

export default MinionFeedback;
