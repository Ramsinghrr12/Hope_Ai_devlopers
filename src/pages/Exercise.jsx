import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaPause, FaRedo } from 'react-icons/fa';

const exercises = [
  {
    id: 1,
    title: "Deep Breathing",
    description: "Take slow, deep breaths to calm your mind and body",
    duration: 300, // 5 minutes
    image: "/images/breathing.gif",
    animation: {
      initial: { scale: 0.8, opacity: 0 },
      animate: { 
        scale: [0.8, 1.2, 0.8],
        opacity: [0.5, 1, 0.5],
        transition: {
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }
    }
  },
  {
    id: 2,
    title: "Mindful Meditation",
    description: "Focus on your breath and let thoughts pass by",
    duration: 600, // 10 minutes
    image: "/images/meditation.gif",
    animation: {
      initial: { y: 0 },
      animate: {
        y: [-10, 10, -10],
        transition: {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }
    }
  },
  {
    id: 3,
    title: "Sleep Exercise",
    description: "Relax your body and prepare for restful sleep",
    duration: 900, // 15 minutes
    image: "/images/sleep.gif",
    animation: {
      initial: { rotate: 0 },
      animate: {
        rotate: [0, 5, 0, -5, 0],
        transition: {
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }
    }
  },
  {
    id: 4,
    title: "Stress Relief",
    description: "Release tension and find inner peace",
    duration: 480, // 8 minutes
    image: "/images/stress-relief.gif",
    animation: {
      initial: { scale: 1 },
      animate: {
        scale: [1, 1.1, 1],
        transition: {
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }
    }
  }
];

const Exercise = () => {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
        setProgress(prev => {
          const newProgress = prev + (100 / (selectedExercise.duration));
          return newProgress > 100 ? 100 : newProgress;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 3000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, selectedExercise]);

  const startExercise = (exercise) => {
    setSelectedExercise(exercise);
    setTimeLeft(exercise.duration);
    setProgress(0);
    setIsActive(true);
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setTimeLeft(selectedExercise.duration);
    setProgress(0);
    setIsActive(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-12">
          Mindful Exercises
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {exercises.map((exercise) => (
            <motion.div
              key={exercise.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative h-48 overflow-hidden">
                <motion.img
                  src={exercise.image}
                  alt={exercise.title}
                  className="w-full h-full object-cover"
                  {...exercise.animation}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <h3 className="absolute bottom-4 left-4 text-xl font-semibold text-white">
                  {exercise.title}
                </h3>
              </div>

              <div className="p-6">
                <p className="text-gray-600 mb-4">{exercise.description}</p>
                <p className="text-sm text-gray-500 mb-4">
                  Duration: {exercise.duration / 60} minutes
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  onClick={() => startExercise(exercise)}
                >
                  Start Exercise
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {selectedExercise && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-0 left-0 right-0 bg-white shadow-lg rounded-t-2xl p-6"
            >
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      {selectedExercise.title}
                    </h3>
                    <p className="text-gray-600">{selectedExercise.description}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="text-gray-600 hover:text-gray-800"
                      onClick={toggleTimer}
                    >
                      {isActive ? <FaPause size={24} /> : <FaPlay size={24} />}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="text-gray-600 hover:text-gray-800"
                      onClick={resetTimer}
                    >
                      <FaRedo size={24} />
                    </motion.button>
                  </div>
                </div>

                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-blue-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                <div className="mt-4 text-center">
                  <span className="text-3xl font-bold text-gray-800">
                    {formatTime(timeLeft)}
                  </span>
                </div>

                {showParticles && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="text-4xl">🎉</div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Exercise; 