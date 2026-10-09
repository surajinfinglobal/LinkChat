export default function ChatLayout({ children }) {
  return (
    <div
      className="h-screen w-screen flex bg-base-950 text-base-100 overflow-hidden"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {children}
    </div>
  );
}
