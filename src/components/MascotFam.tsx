import React from 'react';
import { FamInfo, Language } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare } from 'lucide-react';

interface MascotFamProps {
  fam: FamInfo;
  language: Language;
  message?: string;
  isCompact?: boolean;
}

export const MascotFam: React.FC<MascotFamProps> = ({ fam, language, message, isCompact = false }) => {
  const currentQuote = message || fam.quote[language];

  if (isCompact) {
    return (
      <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700 rounded-full px-3 py-1.5 shadow-md">
        <span className="text-xl" role="img" aria-label={fam.name[language]}>
          {fam.emoji}
        </span>
        <div className="text-xs">
          <span className="font-bold text-slate-100">{fam.name[language]}</span>
          <span className="text-slate-400 ml-1 text-[11px]">({fam.animal[language]})</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-3 bg-slate-800/40 border border-slate-700 rounded-2xl p-3.5 shadow-lg backdrop-blur-sm">
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner border border-amber-300 bg-amber-400 text-slate-950 shrink-0"
      >
        {fam.emoji}
      </motion.div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {fam.name[language]} ({fam.animal[language]})
          </span>
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={currentQuote}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            className="text-xs text-slate-200 mt-0.5 leading-relaxed break-keep font-medium italic"
          >
            "{currentQuote}"
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};
