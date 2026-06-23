import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, XCircle, RotateCcw } from 'lucide-react';
import { useAudio } from '../../context/AudioContext';

interface ParejasGameProps {
  onWin?: () => void;
  onClose?: () => void;
}

// 6 pares = 12 cartas
const generatePairs = () => {
  const pairs = [];
  const operators = ['+', '-', '×', '/'];
  for (let i = 1; i <= 6; i++) {
    const op = operators[Math.floor(Math.random() * operators.length)];
    let text1 = '';
    let text2 = '';
    
    if (op === '+') {
      const a = Math.floor(Math.random() * 20) + 1;
      const b = Math.floor(Math.random() * 20) + 1;
      text1 = `${a} + ${b}`;
      text2 = `${a + b}`;
    } else if (op === '-') {
      const a = Math.floor(Math.random() * 20) + 10;
      const b = Math.floor(Math.random() * a);
      text1 = `${a} - ${b}`;
      text2 = `${a - b}`;
    } else if (op === '×') {
      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * 10) + 1;
      text1 = `${a} × ${b}`;
      text2 = `${a * b}`;
    } else {
      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * 10) + 1;
      text1 = `${a * b} / ${a}`;
      text2 = `${b}`;
    }
    
    pairs.push({ id: i * 2 - 1, text: text1, pairId: i });
    pairs.push({ id: i * 2, text: text2, pairId: i });
  }
  return pairs.sort(() => Math.random() - 0.5);
};

export default function ParejasGame({ onWin, onClose }: ParejasGameProps) {
  const { playCorrect, playIncorrect, playLevelComplete } = useAudio();
  const [cards, setCards] = useState(() => generatePairs());
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const MAX_MOVES = 17;

  useEffect(() => {
    if (flippedIds.length === 2) {
      const [firstId, secondId] = flippedIds;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);

      if (firstCard?.pairId === secondCard?.pairId) {
        playCorrect();
        setMatchedPairs(prev => [...prev, firstCard!.pairId]);
        setFlippedIds([]);
      } else {
        playIncorrect();
        setTimeout(() => setFlippedIds([]), 1000);
      }
      setMoves(m => m + 1);
    }
  }, [flippedIds, cards, playCorrect, playIncorrect]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    if (matchedPairs.length === 6) {
      setGameState('won');
      playLevelComplete();
    } else if (moves >= MAX_MOVES) {
      setGameState('lost');
    }
  }, [matchedPairs, moves, gameState, playLevelComplete]);

  const handleCardClick = (id: number) => {
    if (flippedIds.length >= 2 || flippedIds.includes(id) || matchedPairs.includes(cards.find(c => c.id === id)!.pairId)) {
      return;
    }
    setFlippedIds(prev => [...prev, id]);
  };

  if (gameState === 'won' || gameState === 'lost') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white p-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
          {gameState === 'won' ? (
            <Trophy className="w-32 h-32 text-yellow-400 mx-auto mb-4" />
          ) : (
            <XCircle className="w-32 h-32 text-red-500 mx-auto mb-4" />
          )}
          <h2 className="text-4xl font-bold mb-6">{gameState === 'won' ? '¡Nivel Superado!' : '¡Límite de Movimientos!'}</h2>
          <p className="text-xl text-slate-300 mb-8">Movimientos: {moves} / {MAX_MOVES}</p>

          <div className="flex gap-4 justify-center">
            <button onClick={onClose} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition-colors">
              Volver al Mapa
            </button>
            {gameState === 'won' && onWin && (
              <button onClick={onWin} className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-xl font-bold transition-colors shadow-lg shadow-cyan-500/50">
                Continuar
              </button>
            )}
            {gameState === 'lost' && (
              <button onClick={() => { setGameState('playing'); setMoves(0); setMatchedPairs([]); setFlippedIds([]); setCards(generatePairs()); }} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl font-bold transition-colors">
                Reintentar
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 p-6 sm:p-10 text-white font-sans overflow-y-auto">
      <div className="flex justify-between items-center mb-8 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="bg-slate-800 px-4 py-2 rounded-lg font-bold text-lg">
            <span className="text-slate-400">Parejas</span> <span className="text-cyan-400">{matchedPairs.length}/6</span>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-lg font-bold text-lg ${moves >= MAX_MOVES - 2 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-slate-800 text-slate-300'}`}>
          Movimientos: {moves} / {MAX_MOVES}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold mb-8 text-center text-indigo-100">
          Encuentra los Pares
        </h2>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 max-w-3xl w-full">
          {cards.map(card => {
            const isFlipped = flippedIds.includes(card.id) || matchedPairs.includes(card.pairId);
            return (
              <div 
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className="perspective-1000 w-full aspect-square cursor-pointer"
              >
                <motion.div
                  initial={false}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.4, style: { transformStyle: 'preserve-3d' } }}
                  className="relative w-full h-full"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Front (Back of card) */}
                  <div 
                    className="absolute w-full h-full bg-slate-800 border-2 border-slate-700 rounded-2xl flex items-center justify-center text-slate-500 hover:border-cyan-500/50 transition-colors"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <Trophy className="w-8 h-8 opacity-20" />
                  </div>
                  
                  {/* Back (Front of card) */}
                  <div 
                    className={`absolute w-full h-full rounded-2xl flex items-center justify-center text-2xl font-bold border-2 ${
                      matchedPairs.includes(card.pairId) ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-indigo-900/60 border-indigo-400 text-white'
                    }`}
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                    {card.text}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
