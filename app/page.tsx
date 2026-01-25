"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Section = {
  id: string;
  kicker?: string;
  title: string;
  subtitle: string;
  bullets?: string[];
  ctaPrimary?: { label: string; href: string };
  ctaSecondary?: { label: string; href: string };
  media?: { kind: "image"; src: string; alt: string } | { kind: "mock" };
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function TurnoAquiLanding() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);

  // ✅ Puedes cambiar este path por una foto REAL en /public
  // Por ejemplo: /hero-music.jpg
  const HERO_IMAGE_SRC = "/hero-music.jpg";

  const sections: Section[] = useMemo(
    () => [
      {
        id: "hero",
        kicker: "Universal • Agenda • Recursos • Staff • Servicios",
        title: "TurnoAqui",
        subtitle:
          "La agenda universal que se adapta a tu medida.\nArma tu sistema como un rompecabezas: salas, sillones, boxes, equipos, profesionales y servicios.",
        bullets: [
          "Se adapta a cualquier negocio",
          "Recursos ilimitados (lo que se agenda)",
          "Semana completa + mover bloques rápido",
        ],
        ctaPrimary: { label: "Entrar", href: "/login" },
        ctaSecondary: { label: "Ver demo", href: "/dashboard" },
        media: {
          kind: "image",
          src: HERO_IMAGE_SRC,
          alt: "Jóvenes haciendo música en un estudio mientras revisan la agenda",
        },
      },
      {
        id: "puzzle",
        kicker: "Diseño modular",
        title: "Arma tu agenda a tu manera",
        subtitle:
          "No te obligamos a un formato.\nSi necesitas 2 salas o 20 boxes, TurnoAqui se adapta sin romperse.",
        bullets: [
          "Define recursos: salas, boxes, sillones, cabinas",
          "Define staff: profesionales, barberos, terapeutas",
          "Define servicios: duración, precio, colores",
        ],
        ctaPrimary: { label: "Ir a recursos", href: "/resources" },
        ctaSecondary: { label: "Ir a staff", href: "/staff" },
        media: { kind: "mock" },
      },
      {
        id: "calendar",
        kicker: "Semana completa (7 días)",
        title: "Agenda rápida y limpia",
        subtitle:
          "Mueve reservas, ajusta duración y cambia color.\nLo importante es trabajar rápido, no pelear con el sistema.",
        bullets: ["Drag & Drop", "Resize por minutos", "Colores por tipo de cita"],
        ctaPrimary: { label: "Abrir agenda", href: "/calendar" },
        ctaSecondary: { label: "Dashboard", href: "/dashboard" },
        media: { kind: "mock" },
      },
      {
        id: "control",
        kicker: "Orden total",
        title: "Todo en un solo lugar",
        subtitle:
          "Recursos + staff + servicios + agenda.\nUna base sólida para crecer con pagos, reportes y roles.",
        bullets: [
          "Evita choques y dobles reservas",
          "Notas y datos del cliente",
          "Escala sin rehacer todo",
        ],
        ctaPrimary: { label: "Configurar servicios", href: "/services" },
        ctaSecondary: { label: "Configurar recursos", href: "/resources" },
        media: { kind: "mock" },
      },
      {
        id: "cta",
        kicker: "Listo para tu negocio",
        title: "TurnoAqui. Hecho a tu medida.",
        subtitle:
          "Empieza con lo básico y crece cuando quieras.\nTu agenda queda profesional desde el día 1.",
        bullets: ["Setup rápido", "UI limpia", "Modular y universal"],
        ctaPrimary: { label: "Comenzar", href: "/login" },
        ctaSecondary: { label: "Ver demo", href: "/dashboard" },
        media: { kind: "mock" },
      },
    ],
    []
  );

  // ✅ Wheel vertical => horizontal
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (e.shiftKey) return;
      const delta = e.deltaY + e.deltaX;
      if (Math.abs(delta) < 1) return;
      e.preventDefault();
      el.scrollLeft += delta * 1.08;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel as any);
  }, []);

  // progress for blur/fade
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const onScroll = () => {
      const w = el.clientWidth || 1;
      setProgress(el.scrollLeft / w);
    };

    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll as any);
  }, []);

  return (
    <main
      style={{
        background: "#ffffff",
        color: "#0b1020",
        minHeight: "100vh",
        overflow: "hidden",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
      }}
    >
      {/* NAV */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: "14px 18px",
          background: "rgba(255,255,255,0.80)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(15,23,42,0.08)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                background:
                  "linear-gradient(135deg, rgba(59,130,246,1), rgba(16,185,129,1))",
                boxShadow: "0 12px 26px rgba(59,130,246,0.18)",
              }}
            />
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontWeight: 900, letterSpacing: -0.2 }}>
                TurnoAqui
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Agenda universal modular
              </div>
            </div>
          </div>

          <nav style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <a
              href="#"
              style={{
                color: "#0b1020",
                textDecoration: "none",
                fontWeight: 650,
                opacity: 0.85,
              }}
            >
              Negocios
            </a>
            <a
              href="#"
              style={{
                color: "#0b1020",
                textDecoration: "none",
                fontWeight: 650,
                opacity: 0.85,
              }}
            >
              Funciones
            </a>
            <a
              href="#"
              style={{
                color: "#0b1020",
                textDecoration: "none",
                fontWeight: 650,
                opacity: 0.85,
              }}
            >
              Precios
            </a>
          </nav>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <a
              href="/login"
              style={{
                color: "#0b1020",
                textDecoration: "none",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(15,23,42,0.14)",
                background: "rgba(15,23,42,0.02)",
                fontWeight: 700,
              }}
            >
              Ir a mi cuenta
            </a>
            <a
              href="/login"
              style={{
                color: "white",
                textDecoration: "none",
                padding: "10px 14px",
                borderRadius: 12,
                background:
                  "linear-gradient(90deg, rgba(59,130,246,1), rgba(16,185,129,1))",
                boxShadow: "0 16px 42px rgba(59,130,246,0.22)",
                fontWeight: 800,
              }}
            >
              Comenzar
            </a>
          </div>
        </div>
      </header>

      {/* HORIZONTAL PAGES */}
      <div
        ref={wrapRef}
        style={{
          height: "100vh",
          width: "100vw",
          overflowX: "auto",
          overflowY: "hidden",
          scrollSnapType: "x mandatory",
          display: "flex",
          scrollBehavior: "smooth",
          scrollbarWidth: "none",
        }}
      >
        <style>{`
          div::-webkit-scrollbar { height: 0px; }
        `}</style>

        {sections.map((s, i) => {
          const dist = Math.abs(progress - i);
          const opacity = clamp(1 - dist * 0.85, 0, 1);
          const blur = clamp(dist * 12, 0, 18);
          const scale = clamp(1 - dist * 0.03, 0.92, 1);
          const y = clamp(dist * 14, 0, 22);

          const isHero = i === 0;

          return (
            <section
              key={s.id}
              style={{
                scrollSnapAlign: "start",
                flex: "0 0 100vw",
                height: "100vh",
                display: "grid",
                placeItems: "center",
                padding: "110px 22px 40px",
                background:
                  i % 2 === 0
                    ? "linear-gradient(180deg, rgba(59,130,246,0.06), transparent 35%)"
                    : "linear-gradient(180deg, rgba(16,185,129,0.06), transparent 35%)",
              }}
            >
              <div
                style={{
                  width: "min(1200px, 100%)",
                  display: "grid",
                  gridTemplateColumns: isHero ? "1.05fr 0.95fr" : "1fr 1fr",
                  gap: 16,
                  alignItems: "center",
                  filter: `blur(${blur}px)`,
                  opacity,
                  transform: `translateY(${y}px) scale(${scale})`,
                  transition:
                    "filter 140ms linear, opacity 140ms linear, transform 140ms linear",
                }}
              >
                {/* LEFT */}
                <div
                  style={{
                    padding: 18,
                    borderRadius: 22,
                    border: "1px solid rgba(15,23,42,0.10)",
                    background: "rgba(255,255,255,0.85)",
                    boxShadow: "0 28px 90px rgba(15,23,42,0.10)",
                  }}
                >
                  {s.kicker && (
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        borderRadius: 999,
                        border: "1px solid rgba(15,23,42,0.10)",
                        background: "rgba(15,23,42,0.02)",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "rgba(15,23,42,0.75)",
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 999,
                          background: "rgba(59,130,246,1)",
                          boxShadow: "0 0 14px rgba(59,130,246,0.35)",
                        }}
                      />
                      {s.kicker}
                    </div>
                  )}

                  <h1
                    style={{
                      margin: "14px 0 6px",
                      fontSize: isHero ? 62 : 46,
                      lineHeight: 1.05,
                      letterSpacing: -1.2,
                      color: "#0b1020",
                    }}
                  >
                    {s.title}
                  </h1>

                  <p
                    style={{
                      margin: 0,
                      opacity: 0.78,
                      fontSize: 16,
                      whiteSpace: "pre-line",
                      color: "#0b1020",
                    }}
                  >
                    {s.subtitle}
                  </p>

                  {s.bullets && (
                    <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
                      {s.bullets.map((b) => (
                        <div
                          key={b}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "10px 12px",
                            borderRadius: 14,
                            border: "1px solid rgba(15,23,42,0.10)",
                            background: "rgba(255,255,255,0.70)",
                          }}
                        >
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 999,
                              background: "rgba(16,185,129,1)",
                              boxShadow: "0 0 14px rgba(16,185,129,0.22)",
                              flex: "0 0 auto",
                            }}
                          />
                          <span style={{ fontWeight: 750, opacity: 0.9 }}>
                            {b}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {(s.ctaPrimary || s.ctaSecondary) && (
                    <div
                      style={{
                        marginTop: 16,
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      {s.ctaPrimary && (
                        <a
                          href={s.ctaPrimary.href}
                          style={{
                            color: "white",
                            textDecoration: "none",
                            padding: "12px 14px",
                            borderRadius: 14,
                            background:
                              "linear-gradient(90deg, rgba(59,130,246,1), rgba(16,185,129,1))",
                            boxShadow: "0 18px 60px rgba(59,130,246,0.22)",
                            fontWeight: 900,
                          }}
                        >
                          {s.ctaPrimary.label}
                        </a>
                      )}

                      {s.ctaSecondary && (
                        <a
                          href={s.ctaSecondary.href}
                          style={{
                            color: "#0b1020",
                            textDecoration: "none",
                            padding: "12px 14px",
                            borderRadius: 14,
                            border: "1px solid rgba(15,23,42,0.14)",
                            background: "rgba(255,255,255,0.80)",
                            fontWeight: 800,
                            opacity: 0.92,
                          }}
                        >
                          {s.ctaSecondary.label}
                        </a>
                      )}
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: 14,
                      fontSize: 12,
                      opacity: 0.65,
                      fontWeight: 650,
                    }}
                  >
                    Desliza con la ruedita para explorar →
                  </div>
                </div>

                {/* RIGHT */}
                <RightVisualCard media={s.media} />
              </div>
            </section>
          );
        })}
      </div>

      {/* Dots */}
      <div
        style={{
          position: "fixed",
          right: 14,
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          zIndex: 60,
          padding: 10,
          borderRadius: 999,
          border: "1px solid rgba(15,23,42,0.10)",
          background: "rgba(255,255,255,0.80)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 20px 70px rgba(15,23,42,0.10)",
        }}
      >
        {sections.map((_, i) => {
          const active = Math.round(progress) === i;
          return (
            <span
              key={i}
              style={{
                width: active ? 10 : 8,
                height: active ? 10 : 8,
                borderRadius: 999,
                background: active ? "rgba(59,130,246,1)" : "rgba(15,23,42,0.22)",
                boxShadow: active ? "0 0 14px rgba(59,130,246,0.35)" : "none",
                transition: "all 140ms linear",
              }}
            />
          );
        })}
      </div>
    </main>
  );
}

function RightVisualCard({
  media,
}: {
  media?: { kind: "image"; src: string; alt: string } | { kind: "mock" };
}) {
  const isImage = media && media.kind === "image";

  return (
    <div
      style={{
        padding: 18,
        borderRadius: 22,
        border: "1px solid rgba(15,23,42,0.10)",
        background: "rgba(255,255,255,0.85)",
        boxShadow: "0 28px 90px rgba(15,23,42,0.10)",
        minHeight: 410,
        display: "grid",
        gap: 12,
        alignContent: "start",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ fontWeight: 900, opacity: 0.9 }}>
          TurnoAqui • Modular
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "rgba(239,68,68,0.85)",
            }}
          />
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "rgba(245,158,11,0.85)",
            }}
          />
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "rgba(34,197,94,0.85)",
            }}
          />
        </div>
      </div>

      {/* HERO IMAGE (si existe) */}
      <div
        style={{
          borderRadius: 18,
          border: "1px solid rgba(15,23,42,0.10)",
          overflow: "hidden",
          position: "relative",
          height: 190,
          background: isImage
            ? "rgba(0,0,0,0.04)"
            : "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(16,185,129,0.10))",
        }}
      >
        {isImage ? (
          <>
            <img
              src={(media as any).src}
              alt={(media as any).alt}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
            {/* overlay para que se vea premium */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.00), rgba(255,255,255,0.78))",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 14,
                right: 14,
                bottom: 12,
                padding: 12,
                borderRadius: 16,
                background: "rgba(255,255,255,0.85)",
                border: "1px solid rgba(15,23,42,0.10)",
              }}
            >
              <div style={{ fontWeight: 900 }}>Hecho para tu flujo real</div>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                Tú decides qué es “recurso” y cómo se agenda.
              </div>
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(500px 240px at 20% 20%, rgba(255,255,255,0.7), transparent 60%), radial-gradient(420px 220px at 85% 40%, rgba(255,255,255,0.55), transparent 62%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 16,
                bottom: 16,
                right: 16,
                padding: 12,
                borderRadius: 16,
                background: "rgba(255,255,255,0.85)",
                border: "1px solid rgba(15,23,42,0.08)",
              }}
            >
              <div style={{ fontWeight: 900 }}>Ejemplo universal</div>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                “Sala 1 / Box 2 / Sillón 3” → todo funciona igual.
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { t: "Recursos", s: "Ilimitados" },
          { t: "Staff", s: "Con avatar" },
          { t: "Servicios", s: "Duración + precio" },
          { t: "Agenda", s: "Semana completa" },
        ].map((x) => (
          <div
            key={x.t}
            style={{
              borderRadius: 16,
              border: "1px solid rgba(15,23,42,0.10)",
              background: "rgba(255,255,255,0.75)",
              padding: 12,
            }}
          >
            <div style={{ fontWeight: 900 }}>{x.t}</div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
              {x.s}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          borderRadius: 18,
          border: "1px solid rgba(15,23,42,0.10)",
          background: "rgba(255,255,255,0.75)",
          padding: 12,
        }}
      >
        <div style={{ fontWeight: 900 }}>Ejemplo de uso</div>
        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
          {[
            { title: "Estudio musical", meta: "Sala A • Grabación 1h" },
            { title: "Psicología", meta: "Box 2 • Sesión 50min" },
            { title: "Barbería", meta: "Sillón 1 • Corte 30min" },
          ].map((b) => (
            <div
              key={b.title}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid rgba(15,23,42,0.10)",
                background: "rgba(255,255,255,0.90)",
              }}
            >
              <div>
                <div style={{ fontWeight: 900 }}>{b.title}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{b.meta}</div>
              </div>
              <span
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: "rgba(16,185,129,0.12)",
                  border: "1px solid rgba(16,185,129,0.22)",
                  fontWeight: 800,
                  fontSize: 12,
                  color: "rgba(6,95,70,0.95)",
                }}
              >
                Modular
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
