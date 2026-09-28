import React from 'react';
import { motion } from 'framer-motion';

interface FloatingIconProps {
  icon: string;
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
  size?: number;
  color?: string;
}

const FloatingIcon: React.FC<FloatingIconProps> = ({ 
  icon, 
  className = "", 
  delay = 0,
  duration = 4,
  yOffset = 15,
  size = 28,
  color = "text-primary"
}) => {
  return (
    <motion.div
      className={`absolute hidden md:flex items-center justify-center rounded-2xl shadow-xl backdrop-blur-md bg-surface-container-lowest/80 border border-outline-variant/50 ${color} ${className}`}
      style={{ width: size * 2.2, height: size * 2.2 }}
      initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        y: [0, -yOffset, 0],
        rotate: [-10, 0, -10]
      }}
      transition={{
        opacity: { duration: 0.8, delay },
        scale: { duration: 0.8, delay, type: "spring" },
        y: {
          duration: duration,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay
        },
        rotate: {
          duration: duration * 1.2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay
        }
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: size }}>{icon}</span>
    </motion.div>
  );
};

export default FloatingIcon;
