export default function DemoBadge() {
  return (
    <div className="fixed bottom-4 left-4 z-40 pointer-events-none select-none">
      <div className="bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
        Demo · Powered by AMPS Technologies
      </div>
    </div>
  );
}
