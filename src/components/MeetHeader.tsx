import { ComponentChildren } from "preact";

export default function MeetHeader({
  rightSide,
}: {
  rightSide?: ComponentChildren;
}) {
  return (
    <header className="sticky top-0 w-full">
      <nav className="h-16 container mx-auto max-w-3xl px-4 flex flex-wrap items-stretch bg-white border-b border-slate-100">
        <div className="flex-1" />
        <div className="flex items-center">
          <span className="text-xl font-semibold text-slate-800">Meeper</span>
        </div>
        <div className="flex-1 flex items-center justify-end">{rightSide}</div>
      </nav>
    </header>
  );
}
