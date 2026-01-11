import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, CornerDownLeft, RotateCcw, HelpCircle } from 'lucide-react';

const Controller = ({ onCommand }) => {
  const navBtnClass = "w-14 h-14 bg-gray-700 hover:bg-gray-600 active:bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg transition-all active:scale-90";
  
  const funcBtnClass = "flex flex-col items-center justify-center space-y-1 text-xs font-bold uppercase tracking-tighter transition-all active:scale-95";

  return (
    <div className="mt-10 flex flex-col md:flex-row items-center gap-12 bg-gray-800 p-8 rounded-3xl border-b-8 border-gray-950 shadow-2xl">
      
      <div className="grid grid-cols-3 gap-2">
        <div />
        <button onClick={() => onCommand('UP')} className={navBtnClass}><ChevronUp size={32} /></button>
        <div />
        
        <button onClick={() => onCommand('LEFT')} className={navBtnClass}><ChevronLeft size={32} /></button>
        <button onClick={() => onCommand('ENTER')} className="w-14 h-14 bg-indigo-500 hover:bg-indigo-400 text-white rounded-full flex items-center justify-center shadow-inner font-black text-xs">OK</button>
        <button onClick={() => onCommand('RIGHT')} className={navBtnClass}><ChevronRight size={32} /></button>
        
        <div />
        <button onClick={() => onCommand('DOWN')} className={navBtnClass}><ChevronDown size={32} /></button>
        <div />
      </div>

      <div className="flex gap-6 border-l border-gray-600 pl-8">
        <button 
          onClick={() => onCommand('BACK')} 
          className={`${funcBtnClass} text-red-400 hover:text-red-300`}
        >
          <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center border-2 border-red-900 mb-1">
            <RotateCcw size={20} />
          </div>
          Back
        </button>

        <button 
          onClick={() => onCommand('ENTER')} 
          className={`${funcBtnClass} text-indigo-400 hover:text-indigo-300`}
        >
          <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center border-2 border-indigo-900 mb-1">
            <CornerDownLeft size={20} />
          </div>
          Enter
        </button>

        <button 
          onClick={() => onCommand('HINT')} 
          className={`${funcBtnClass} text-yellow-400 hover:text-yellow-300`}
        >
          <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center border-2 border-yellow-900 mb-1">
            <HelpCircle size={20} />
          </div>
          Hint
        </button>
      </div>

    </div>
  );
};

export default Controller;