import React, { useEffect, useRef } from 'react';

interface InfiniteScrollProps {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
}

export function InfiniteScroll({ onLoadMore, hasMore, isLoading, children }: InfiniteScrollProps) {
  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [onLoadMore, hasMore, isLoading]);

  return (
    <div>
      {children}
      {(hasMore || isLoading) && (
        <div
          ref={observerTarget}
          className="w-full py-4 flex items-center justify-center"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              Carregando mais códigos...
            </div>
          )}
        </div>
      )}
    </div>
  );
}