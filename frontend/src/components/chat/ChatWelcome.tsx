import React from 'react';

/**
 * ChatWelcome Component
 * Displays empty state hero graphic and friendly initial greeting
 * when starting a brand new conversation thread.
 */
export const ChatWelcome: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
      {/* Sparkle Icon */}
      <img
        src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg"
        className="w-[72px] h-[72px] mb-6 opacity-90 select-none pointer-events-none"
        alt="Sparkle"
      />

      {/* Greeting Title */}
      <h2 className="text-[36px] font-medium mb-1 tracking-tight bg-gradient-to-r from-[#4285f4] via-[#9b72cb] to-[#d96570] bg-clip-text text-transparent">
        Xin chào
      </h2>

      {/* Subtitle */}
      <p className="text-on-surface-variant text-[24px] font-medium opacity-60">
        Tôi có thể giúp gì cho bạn hôm nay?
      </p>
    </div>
  );
};
