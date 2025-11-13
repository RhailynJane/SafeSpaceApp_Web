"use client";
import { useState, useEffect, useCallback, useRef } from 'react';

export default function useDraggable(handleRef) {
  const [position, setPosition] = useState({ x: undefined, y: undefined });
  const positionRef = useRef(position);
  positionRef.current = position;

  const onMouseDown = useCallback((e) => {
    if (handleRef.current && handleRef.current.contains(e.target)) {
      const target = handleRef.current.closest('.draggable');
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      if (positionRef.current.x === undefined) {
        setPosition({ x: rect.left, y: rect.top });
      }

      const onMouseMove = (e) => {
        setPosition({
          x: e.clientX - offsetX,
          y: e.clientY - offsetY,
        });
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }
  }, [handleRef]);

  useEffect(() => {
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [onMouseDown]);

  return position;
}
