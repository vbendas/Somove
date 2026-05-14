"use client";
import { useEffect, useRef } from "react";

export function ParallaxBackground() {
  const b1 = useRef<HTMLDivElement>(null);
  const b2 = useRef<HTMLDivElement>(null);
  const b3 = useRef<HTMLDivElement>(null);
  const b4 = useRef<HTMLDivElement>(null);
  const b5 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const entries = [
      { ref: b1, rate: -0.07 },
      { ref: b2, rate: 0.11 },
      { ref: b3, rate: -0.05 },
      { ref: b4, rate: 0.08 },
      { ref: b5, rate: 0.14 },
    ];
    let ticking = false;
    let rafId: number;

    const update = () => {
      const y = window.scrollY;
      entries.forEach(({ ref, rate }) => {
        if (ref.current) {
          const offset = Math.max(-240, Math.min(240, y * rate));
          ref.current.style.transform = `translateY(${offset}px)`;
        }
      });
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        rafId = requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(150deg, #FFFDF5 0%, #FFF8EC 50%, #FFFDF5 100%)",
        }}
      />

      <div ref={b1} className="absolute" style={{ top: "-80px", left: "-120px" }}>
        <div className="animate-float-slow">
          <div
            className="blob-morph-1"
            style={{
              width: "600px",
              height: "600px",
              background: "rgba(212,165,116,0.36)",
              filter: "blur(80px)",
            }}
          />
        </div>
      </div>

      <div ref={b2} className="absolute" style={{ top: "5vh", right: "-160px" }}>
        <div className="animate-float-slower">
          <div
            className="blob-morph-2"
            style={{
              width: "640px",
              height: "640px",
              background: "rgba(139,168,136,0.27)",
              filter: "blur(90px)",
            }}
          />
        </div>
      </div>

      <div ref={b3} className="absolute" style={{ top: "42vh", left: "-100px" }}>
        <div className="animate-float-slow" style={{ animationDelay: "-3s" }}>
          <div
            className="blob-morph-3"
            style={{
              width: "500px",
              height: "500px",
              background: "rgba(232,196,184,0.38)",
              filter: "blur(72px)",
            }}
          />
        </div>
      </div>

      <div ref={b4} className="absolute" style={{ top: "38vh", right: "-120px" }}>
        <div className="animate-float-slower" style={{ animationDelay: "-5s" }}>
          <div
            className="blob-morph-4"
            style={{
              width: "560px",
              height: "560px",
              background: "rgba(197,213,197,0.28)",
              filter: "blur(84px)",
            }}
          />
        </div>
      </div>

      <div ref={b5} className="absolute" style={{ bottom: "0", left: "28%" }}>
        <div className="animate-float-slow" style={{ animationDelay: "-6s" }}>
          <div
            className="blob-morph-1"
            style={{
              width: "420px",
              height: "420px",
              background: "rgba(212,165,116,0.2)",
              filter: "blur(64px)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
