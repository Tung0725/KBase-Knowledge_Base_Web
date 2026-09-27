import AppRoutes from './routes/AppRoutes';
import { Toaster, ToastIcon, resolveValue } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col overflow-x-hidden">
      <AppRoutes />
      <Toaster 
        position="bottom-right" 
        containerClassName="custom-toaster-container"
        toastOptions={{ 
          duration: 3000,
        }} 
      >
        {(t) => (
          <AnimatePresence>
            {t.visible && (
              <motion.div 
                key={t.id}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{ 
                  background: 'color-mix(in srgb, var(--md-surface-container-highest) 50%, transparent)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  color: 'var(--md-on-surface)',
                  borderRadius: '12px',
                  border: '1px solid color-mix(in srgb, var(--md-outline-variant) 30%, transparent)',
                  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)'
                }}
                className="flex items-center gap-3 px-4 py-3"
              >
                <ToastIcon toast={t} />
                <p className="text-sm font-medium">
                  {resolveValue(t.message, t)}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </Toaster>
    </div>
  );
}

export default App;
