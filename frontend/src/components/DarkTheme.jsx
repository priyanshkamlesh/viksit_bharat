import React, { useEffect, useState } from 'react';

const DarkTheme = ({ topAction, children }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#143127_0%,#08110c_38%,#040806_100%)] text-slate-100">
      <div className="absolute inset-0">
        <div
          className={`absolute -left-24 top-0 h-[34rem] w-[34rem] rounded-full bg-emerald-500/12 blur-[150px] transition-all duration-1000 ${
            isMounted ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
          }`}
        />
        <div
          className={`absolute right-[-8rem] top-1/4 h-[30rem] w-[30rem] rounded-full bg-amber-400/10 blur-[150px] transition-all delay-150 duration-1000 ${
            isMounted ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
          }`}
        />
        <div
          className={`absolute bottom-[-8rem] left-1/3 h-[24rem] w-[24rem] rounded-full bg-emerald-300/8 blur-[130px] transition-all delay-300 duration-1000 ${
            isMounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.08]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-8 sm:px-10">
        <div className="absolute left-0 right-0 top-6 mx-auto flex w-full max-w-6xl justify-end px-6 sm:px-10">
          {topAction}
        </div>

        <div
          className={`w-full transition-all duration-1000 ${
            isMounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <div className="mx-auto flex w-full justify-center">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default DarkTheme;
