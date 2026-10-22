import { useEffect, useRef } from 'react';

export default function ChatLayout({ children }) {
  const layoutRef = useRef(null);

  useEffect(() => {
    const visualViewport = window.visualViewport;
    const updateViewport = () => {
      const layout = layoutRef.current;
      if (!layout) return;

      layout.style.setProperty(
        '--chat-viewport-height',
        `${visualViewport?.height || window.innerHeight}px`
      );
      layout.style.setProperty(
        '--chat-viewport-top',
        `${visualViewport?.offsetTop || 0}px`
      );
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    visualViewport?.addEventListener('resize', updateViewport);
    visualViewport?.addEventListener('scroll', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      visualViewport?.removeEventListener('resize', updateViewport);
      visualViewport?.removeEventListener('scroll', updateViewport);
    };
  }, []);

  return (
    <div
      ref={layoutRef}
      className="fixed inset-x-0 flex bg-base-950 text-base-100 overflow-hidden"
      style={{
        top: 'var(--chat-viewport-top, 0px)',
        height: 'var(--chat-viewport-height, 100dvh)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {children}
    </div>
  );
}
