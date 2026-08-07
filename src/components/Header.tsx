import { Compass, Download, Heart, Menu, Search, X } from 'lucide-react';
import { useState } from 'react';
import { navigate, type Route } from '@/lib/router';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

export function Header({ route }: { route: Route }) {
  const [open, setOpen] = useState(false);
  const { canInstall, promptInstall } = useInstallPrompt();
  const isActive = (name: string) => route.name === name;
  const go = (path: string) => { setOpen(false); navigate(path); };

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-ocean-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-8">
        <button onClick={() => go('/')} className="flex items-center gap-3 text-left">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-ocean-500 text-ocean-950 shadow-lg shadow-ocean-500/20"><Compass size={21} strokeWidth={2.5} /></span>
          <span><span className="block font-display text-lg font-semibold leading-none text-white">Diani</span><span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-ocean-300">Companion</span></span>
        </button>

        <nav className="hidden items-center gap-8 md:flex">
          <button onClick={() => go('/browse')} className={`text-sm transition-colors ${isActive('browse') ? 'text-ocean-300' : 'text-white/65 hover:text-white'}`}>Explore companions</button>
          <button onClick={() => go('/about')} className={`text-sm transition-colors ${isActive('about') ? 'text-ocean-300' : 'text-white/65 hover:text-white'}`}>How it works</button>
          <button onClick={() => go('/bookings')} className={`text-sm transition-colors ${isActive('bookings') ? 'text-ocean-300' : 'text-white/65 hover:text-white'}`}>My bookings</button>
        </nav>

        <div className="flex items-center gap-2">
          {canInstall && <button onClick={promptInstall} className="hidden items-center gap-2 rounded-full bg-sand-300 px-4 py-2 text-xs font-bold text-ocean-950 transition hover:bg-sand-200 sm:flex"><Download size={14} /> Install app</button>}
          <button onClick={() => go('/browse')} aria-label="Search companions" className="grid h-10 w-10 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"><Search size={19} /></button>
          <button onClick={() => setOpen(!open)} aria-label="Menu" className="grid h-10 w-10 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white md:hidden">{open ? <X size={21} /> : <Menu size={21} />}</button>
        </div>
      </div>
      {open && <nav className="border-t border-white/10 bg-ocean-950 px-5 py-4 md:hidden animate-fade-in"><div className="flex flex-col gap-1"><button onClick={() => go('/browse')} className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-white/80 hover:bg-white/8"><Heart size={17} className="text-ocean-300" /> Explore companions</button><button onClick={() => go('/about')} className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-white/80 hover:bg-white/8"><Compass size={17} className="text-ocean-300" /> How it works</button><button onClick={() => go('/bookings')} className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-white/80 hover:bg-white/8"><Search size={17} className="text-ocean-300" /> My bookings</button>{canInstall && <button onClick={promptInstall} className="mt-2 flex items-center gap-3 rounded-xl bg-sand-300 px-3 py-3 text-left text-sm font-bold text-ocean-950"><Download size={17} /> Install Diani Companion</button>}</div></nav>}
    </header>
  );
}
