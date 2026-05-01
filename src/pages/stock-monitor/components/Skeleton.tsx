export function SkeletonDashboard() {
  return (
    <div className="space-y-2 sm:space-y-3 animate-pulse">
      <SkBlock h="h-20 sm:h-24" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3">
        <div className="lg:col-span-7"><SkBlock h="h-[280px] sm:h-[320px]" /></div>
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
          <SkBlock h="h-32" /><SkBlock h="h-32" />
        </div>
        <div className="lg:col-span-2"><SkBlock h="h-32" /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        <SkBlock h="h-32" /><SkBlock h="h-32" /><SkBlock h="h-32" />
        <SkBlock h="h-32" /><SkBlock h="h-32" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <SkBlock h="h-40" /><SkBlock h="h-40" /><SkBlock h="h-40" /><SkBlock h="h-40" />
      </div>
    </div>
  );
}

function SkBlock({ h }: { h: string }) {
  return <div className={`${h} rounded-md border border-cyan-500/20 bg-slate-900/40`} />;
}
