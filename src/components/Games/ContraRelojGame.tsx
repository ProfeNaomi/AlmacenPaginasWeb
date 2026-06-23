import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Star, CheckCircle2, XCircle } from 'lucide-react';

export interface Question {
  question: string;
  options: number[];
  correct: number;
}

interface ContraRelojGameProps {
  questions?: Question[];
  onFinish?: (stars: number, score: number) => void;
  onWin?: () => void;
  onClose?: () => void;
}

// Función para generar preguntas dinámicas
const generateProgressiveQuestions = (): Question[] => {
  const qs: Question[] = [];
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const ranges = [
    { count: 3, min: 1, max: 20 },
    { count: 3, min: 15, max: 40 },
    { count: 3, min: 30, max: 70 },
    { count: 1, min: 50, max: 100 },
  ];

  ranges.forEach(({ count, min, max }) => {
    for (let i = 0; i < count; i++) {
      const a = rand(min, max);
      const b = rand(min, max);
      const correct = a + b;
      
      const optionsSet = new Set<number>([correct]);
      while (optionsSet.size < 4) {
        const offset = rand(-10, 10);
        if (offset !== 0 && correct + offset > 0) {
          optionsSet.add(correct + offset);
        }
      }
      
      const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);
      qs.push({ question: `${a} + ${b}`, options, correct });
    }
  });
  return qs;
};

export default function ContraRelojGame({ questions, onFinish, onWin, onClose }: ContraRelojGameProps) {
  const [gameQuestions, setGameQuestions] = useState<Question[]>(questions || []);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  useEffect(() => {
    if (!questions || questions.length === 0) {
      setGameQuestions(generateProgressiveQuestions());
    }
  }, [questions]);

  useEffect(() => {
    if (isFinished) return;

    if (timeLeft <= 0 || (gameQuestions.length > 0 && currentQuestionIndex >= gameQuestions.length)) {
      handleFinish();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isFinished, currentQuestionIndex, gameQuestions.length]);

  const handleFinish = () => {
    setIsFinished(true);
    let stars = 1;
    const ratio = score / gameQuestions.length;
    if (ratio >= 0.8) stars = 3;
    else if (ratio >= 0.5) stars = 2;
    else stars = 1;
    
    if (onFinish) onFinish(stars, score);
  };

  const handleOptionClick = (option: number) => {
    if (selectedOption !== null || isFinished) return;
    
    setSelectedOption(option);
    
    const isCorrect = option === gameQuestions[currentQuestionIndex].correct;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setTimeout(() => {
      setSelectedOption(null);
      if (currentQuestionIndex + 1 < gameQuestions.length) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        handleFinish();
      }
    }, 800);
  };

  if (isFinished) {
    const ratio = score / gameQuestions.length;
    const stars = ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1;

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center p-8 bg-slate-800 rounded-3xl shadow-2xl w-full h-full mx-auto text-center"
      >
        <h2 className="text-3xl font-bold text-white mb-6">¡Tiempo Agotado!</h2>
        <div className="flex space-x-4 mb-8 justify-center">
          {[1, 2, 3].map((star) => (
            <motion.div
              key={star}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: star * 0.2 }}
            >
              <Star
                size={48}
                className={star <= stars ? "text-yellow-400 fill-yellow-400" : "text-slate-600"}
              />
            </motion.div>
          ))}
        </div>
        <p className="text-xl text-slate-300 mb-8">
          Puntuación: <span className="font-bold text-white">{score} / {gameQuestions.length}</span>
        </p>
        <div className="flex gap-4">
          {onClose && (
            <button onClick={onClose} className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-colors">
              Volver
            </button>
          )}
          {onWin && ratio >= 0.5 && (
            <button onClick={onWin} className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-xl font-bold transition-colors shadow-lg shadow-cyan-500/50">
              Continuar
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  const currentQuestion = gameQuestions[currentQuestionIndex];
  if (!currentQuestion) return null; // Avoid render before generation

  return (
    <div className="flex flex-col items-center p-6 bg-slate-900 h-full w-full mx-auto rounded-3xl shadow-2xl relative overflow-hidden">
      {/* Header Info */}
      <div className="w-full flex justify-between items-center mb-8 px-4">
        <div className="flex items-center space-x-2 bg-slate-800 px-4 py-2 rounded-full">
          <Timer className={timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-cyan-400"} />
          <span className={`font-mono font-bold text-xl ${timeLeft <= 10 ? "text-red-400" : "text-cyan-400"}`}>
            00:{timeLeft.toString().padStart(2, '0')}
          </span>
        </div>
        <div className="text-slate-400 font-medium">
          Pregunta {currentQuestionIndex + 1}/{gameQuestions.length}
        </div>
        <div className="bg-slate-800 px-4 py-2 rounded-full font-bold text-emerald-400">
          Pts: {score}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-2 absolute top-0 left-0">
        <motion.div 
          className="h-full bg-cyan-500"
          initial={{ width: '100%' }}
          animate={{ width: `${(timeLeft / 60) * 100}%` }}
          transition={{ ease: "linear", duration: 1 }}
        />
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex-1 w-full flex flex-col justify-center items-center"
        >
          <div className="bg-slate-800/50 p-8 rounded-2xl w-full text-center mb-8 border border-slate-700/50 max-w-2xl">
            <h3 className="text-5xl md:text-6xl font-black text-white tracking-wider">
              {currentQuestion.question}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOption === option;
              const isCorrect = option === currentQuestion.correct;
              
              let buttonStateClass = "bg-slate-800 hover:bg-slate-700 text-white border-slate-600";
              if (selectedOption !== null) {
                if (isCorrect) {
                  buttonStateClass = "bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]";
                } else if (isSelected) {
                  buttonStateClass = "bg-red-500 border-red-400 text-white";
                } else {
                  buttonStateClass = "bg-slate-800 text-slate-500 border-slate-700 opacity-50";
                }
              }

              return (
                <motion.button
                  key={idx}
                  whileHover={selectedOption === null ? { scale: 1.05 } : {}}
                  whileTap={selectedOption === null ? { scale: 0.95 } : {}}
                  onClick={() => handleOptionClick(option)}
                  disabled={selectedOption !== null}
                  className={`
                    relative p-6 rounded-2xl text-3xl font-bold border-2 transition-all duration-300
                    flex justify-center items-center overflow-hidden
                    ${buttonStateClass}
                  `}
                >
                  {option}
                  
                  {/* Icons for correct/incorrect feedback */}
                  {selectedOption !== null && isCorrect && (
                    <motion.div 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      className="absolute top-2 right-2 text-white"
                    >
                      <CheckCircle2 size={24} />
                    </motion.div>
                  )}
                  {selectedOption !== null && isSelected && !isCorrect && (
                    <motion.div 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      className="absolute top-2 right-2 text-white"
                    >
                      <XCircle size={24} />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
