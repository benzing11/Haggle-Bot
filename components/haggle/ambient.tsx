export function Ambient() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden"
    >
      <div
        className="ambient-blob animate-aurora absolute -left-[24%] -top-[26%] h-[64vw] w-[64vw] min-h-[420px] min-w-[420px] rounded-full blur-[120px]"
        style={{
          background: "radial-gradient(circle, rgba(245,185,74,0.20), transparent 66%)",
        }}
      />
      <div
        className="ambient-blob animate-aurora absolute -right-[18%] top-[6%] h-[52vw] w-[52vw] min-h-[360px] min-w-[360px] rounded-full blur-[130px]"
        style={{
          background: "radial-gradient(circle, rgba(255,122,69,0.14), transparent 68%)",
          animationDelay: "-9s",
        }}
      />
      <div
        className="ambient-blob animate-aurora absolute bottom-[-30%] left-[26%] h-[58vw] w-[58vw] min-h-[380px] min-w-[380px] rounded-full blur-[140px]"
        style={{
          background: "radial-gradient(circle, rgba(126,101,255,0.10), transparent 68%)",
          animationDelay: "-16s",
        }}
      />

      <div className="noise-overlay absolute inset-0 opacity-[0.04] mix-blend-overlay" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,transparent_30%,rgba(7,7,10,0.85)_100%)]" />
    </div>
  );
}
