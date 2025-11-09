"use client";
import { useState, useEffect, useRef } from 'react';

const useDraggable = (handleRef) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const targetRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      setPosition({
        x: e.clientX - offset.current.x,
        y: e.clientY - offset.current.y,
      });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    const handleMouseDown = (e) => {
      isDragging.current = true;
      offset.current = {
        x: e.clientX - targetRef.current.offsetLeft,
        y: e.clientY - targetRef.current.offsetTop,
      };
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    const handle = handleRef.current;
    if (handle) {
      handle.addEventListener('mousedown', handleMouseDown);
      targetRef.current = handle.closest('.draggable');
    }

    return () => {
      if (handle) {
        handle.removeEventListener('mousedown', handleMouseDown);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleRef]);

  return position;
};

export default useDraggable;
