import React, { useRef, useState, useCallback } from 'react';

/**
 * TiltCard3D
 * Provides smooth, high-performance 3D perspective tilt and dynamic specular
 * lighting reflection for any card element without any paid dependencies.
 */
export default function TiltCard3D({ 
  children, 
  className = '', 
  maxTilt = 10, 
  scale = 1.02, 
  glare = true,
  onClick
}) {
  const cardRef = useRef(null);
  const [style, setStyle] = useState({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
    transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
  });
  const [glareStyle, setGlareStyle] = useState({ opacity: 0, x: 50, y: 50 });

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPct = (x / rect.width - 0.5) * 2; // -1 to +1
    const yPct = (y / rect.height - 0.5) * 2; // -1 to +1

    const rotX = -yPct * maxTilt;
    const rotY = xPct * maxTilt;

    setStyle({
      transform: `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`,
      transition: 'transform 0.08s ease-out',
    });

    if (glare) {
      setGlareStyle({
        opacity: 0.25,
        x: (x / rect.width) * 100,
        y: (y / rect.height) * 100,
      });
    }
  }, [maxTilt, scale, glare]);

  const handleMouseLeave = useCallback(() => {
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
    });
    if (glare) {
      setGlareStyle(prev => ({ ...prev, opacity: 0 }));
    }
  }, [glare]);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        ...style,
        transformStyle: 'preserve-3d',
      }}
      className={`relative will-change-transform ${className}`}
    >
      {children}

      {/* Dynamic Specular 3D Lighting Sheen */}
      {glare && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden transition-opacity duration-300"
          style={{ opacity: glareStyle.opacity }}
        >
          <div
            className="w-full h-full"
            style={{
              background: `radial-gradient(circle 350px at ${glareStyle.x}% ${glareStyle.y}%, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0) 70%)`,
            }}
          />
        </div>
      )}
    </div>
  );
}
