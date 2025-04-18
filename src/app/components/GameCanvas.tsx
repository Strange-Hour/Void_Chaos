"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from 'next/dynamic';

// Create a dynamic import wrapper for the game
const GameWrapper = dynamic(
  () => import('./GameWrapper').then((mod) => mod.default),
  { ssr: false }
);

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Add resize handler
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    // Initial size calculation
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className='relative w-screen h-screen overflow-hidden'>
      <div
        ref={containerRef}
        className='w-full h-full'
      >
        {dimensions.width > 0 && dimensions.height > 0 && (
          <div id="game-canvas-container" className="w-full h-full">
            <GameWrapper dimensions={dimensions} containerId="game-canvas-container" />
          </div>
        )}
      </div>
    </div>
  );
}
