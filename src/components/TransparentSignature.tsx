import React, { useState, useEffect } from 'react';
import { removeWhiteBackground } from '../utils/imageCompressor';

interface TransparentSignatureProps {
  src?: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}

// Memory cache for processed transparent data URLs to prevent re-processing canvas
const transparentCache = new Map<string, string>();

export const TransparentSignature: React.FC<TransparentSignatureProps> = ({
  src,
  alt = 'Authorized Signature',
  className = 'max-w-full max-h-full object-contain mx-auto',
  style = {}
}) => {
  const [processedSrc, setProcessedSrc] = useState<string>(src || '');

  useEffect(() => {
    if (!src) {
      setProcessedSrc('');
      return;
    }

    // SVGs are already transparent vectors
    if (src.startsWith('data:image/svg+xml') || src.includes('<svg')) {
      setProcessedSrc(src);
      return;
    }

    // Check cache
    if (transparentCache.has(src)) {
      setProcessedSrc(transparentCache.get(src)!);
      return;
    }

    let isMounted = true;
    removeWhiteBackground(src, 200).then((transparentDataUrl) => {
      if (isMounted && transparentDataUrl) {
        transparentCache.set(src, transparentDataUrl);
        setProcessedSrc(transparentDataUrl);
      }
    }).catch(() => {
      if (isMounted) setProcessedSrc(src);
    });

    return () => {
      isMounted = false;
    };
  }, [src]);

  if (!src) return null;

  return (
    <img
      src={processedSrc || src}
      alt={alt}
      className={`${className} mix-blend-multiply`}
      style={{
        mixBlendMode: 'multiply',
        filter: 'contrast(1.2) brightness(0.95)',
        ...style
      }}
      referrerPolicy="no-referrer"
    />
  );
};

export default TransparentSignature;
