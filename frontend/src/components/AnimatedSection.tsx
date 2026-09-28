import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface AnimatedSectionProps extends HTMLMotionProps<"section"> {
  children: React.ReactNode;
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({ children, className, ...props }) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6 }}
      className={className}
      {...props}
    >
      {children}
    </motion.section>
  );
};

export default AnimatedSection;
