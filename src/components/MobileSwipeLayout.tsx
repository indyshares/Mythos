import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

interface MobileSwipeLayoutProps {
  children: [React.ReactNode, React.ReactNode, React.ReactNode];
}

export interface MobileSwipeLayoutHandle {
  scrollToIndex: (index: number) => void;
}

export const MobileSwipeLayout = forwardRef<MobileSwipeLayoutHandle, MobileSwipeLayoutProps>(
  ({ children }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      scrollToIndex: (index: number) => {
        if (containerRef.current) {
          const width = containerRef.current.clientWidth;
          containerRef.current.scrollTo({
            left: index * width,
            behavior: 'smooth',
          });
        }
      },
    }));

    useEffect(() => {
      // Scroll to the middle panel (Editor) on mount
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        containerRef.current.scrollLeft = width;
      }
    }, []);

    return (
      <div
        ref={containerRef}
        className="flex w-screen h-[100dvh] overflow-x-auto snap-x snap-mandatory no-scrollbar"
        style={{ scrollBehavior: 'smooth' }}
      >
        {children.map((child, index) => (
          <div key={index} className="w-screen h-full flex-shrink-0 snap-center">
            {child}
          </div>
        ))}
      </div>
    );
  }
);
MobileSwipeLayout.displayName = 'MobileSwipeLayout';
