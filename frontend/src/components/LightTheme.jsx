import React, { useEffect, useState } from 'react';

const LightTheme = ({ topAction, children }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(160deg,#f8fff8_0%,#eefcf3_42%,#fdfdf7_100%)] text-slate-800">
      <div className="absolute inset-0 opacity-60">
        <div
          className={`absolute -left-24 top-0 h-[34rem] w-[34rem] rounded-full bg-emerald-200/60 blur-[140px] transition-all duration-1000 ${
            isMounted ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
          }`}
        />
        <div
          className={`absolute right-[-8rem] top-1/3 h-[30rem] w-[30rem] rounded-full bg-lime-200/50 blur-[130px] transition-all delay-150 duration-1000 ${
            isMounted ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
          }`}
        />
        <div
          className={`absolute bottom-[-10rem] left-1/3 h-[28rem] w-[28rem] rounded-full bg-teal-100/60 blur-[130px] transition-all delay-300 duration-1000 ${
            isMounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        />
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

export default LightTheme;
