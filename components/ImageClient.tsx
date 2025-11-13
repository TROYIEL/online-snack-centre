// components/ImageClient.tsx
'use client';

import React from 'react';

// Define the props structure for better type safety
interface ImageClientProps {
  src: string;
  alt: string;
  className: string;
}

export default function ImageClient({ src, alt, className }: ImageClientProps) {
  // Define the onError handler logic inside the client component
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null; 
    target.src = "https://via.placeholder.com/300x200?text=No+Image"; 
  };

  return (
    <img 
      src={src} 
      alt={alt} 
      className={className} 
      onError={handleError} // Event handler is now defined and used in a Client Component
    />
  );
}