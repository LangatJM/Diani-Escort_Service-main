import { ShieldCheck, AlertTriangle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'diani_age_verified';

export function AgeGate() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let verified = false;
    try {
      verified = sessionStorage.getItem(STORAGE_KEY) === 'yes';
    } catch {
      verified = false;
    }
    if (!verified) {
      setVisible(true);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const accept = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, 'yes');
    } catch {
      // Ignore storage failures — allow access anyway.
    }
    setVisible(false);
    document.body.style.overflow = '';
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ocean-950/95 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-ocean-900 p-8 text-center shadow-2xl animate-scale-in">
        <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-sand-400/15 text-sand-300">
          <ShieldCheck size={32} />
        </div>

        <h1 className="mt-6 font-display text-3xl font-semibold leading-tight text-white">
          Adults only
        </h1>

        <div className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full bg-coral-500/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-coral-400">
          <AlertTriangle size={13} /> 18+ content
        </div>

        <p className="mx-auto mt-5 max-w-sm text-sm leading-7 text-white/65">
          This website contains companion and lifestyle services intended for
          <span className="font-semibold text-white"> adults aged 18 and over</span>.
          By continuing, you confirm that you are at least 18 years old and that you
          are legally permitted to view this content in your country or region.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={accept}
            className="w-full rounded-xl bg-ocean-400 py-4 text-sm font-bold text-ocean-950 transition hover:bg-ocean-300"
          >
            I am 18 or older — Enter
          </button>
          <a
            href="https://www.google.com"
            onClick={() => {
              try {
                sessionStorage.clear();
              } catch {
                // ignore
              }
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 py-4 text-sm font-semibold text-white/70 transition hover:bg-white/8"
          >
            <X size={16} /> Exit
          </a>
        </div>

        <p className="mt-6 text-xs leading-5 text-white/35">
          If you are under 18, please leave now. This site takes age verification
          seriously and requires all users to be of legal adult age.
        </p>
      </div>
    </div>
  );
}

