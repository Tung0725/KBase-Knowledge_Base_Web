import React from 'react';
import { motion } from 'framer-motion';

interface TypewriterTextProps {
  text: string;
  className?: string;
  delayOffset?: number;
  speed?: number;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({ 
  text, 
  className = "", 
  delayOffset = 0, 
  speed = 0.03 
}) => {
  return (
    <span className={className}>
      {text.split("").map((char, index) => (
        <motion.span
          key={`${char}-${index}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ 
            duration: 0.1, 
            delay: delayOffset + index * speed 
          }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
};

export default TypewriterText;
