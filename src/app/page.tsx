import Image from "next/image";

export const dynamic = "force-dynamic";

const WA_TEXT = encodeURIComponent("I want to order some tasty banana chips");
const WA_1 = `https://wa.me/919892181645?text=${WA_TEXT}`;
const WA_2 = `https://wa.me/919619288170?text=${WA_TEXT}`;

type PricingTier = { weight: string; price: string; popular: boolean };

const DEFAULT_PRICING: PricingTier[] = [
  { weight: "100g", price: "₹150", popular: false },
  { weight: "250g", price: "₹250", popular: true },
  { weight: "500g", price: "₹480", popular: true },
  { weight: "1kg",  price: "₹960", popular: false },
];

async function getPricing(): Promise<PricingTier[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/unit_pricing?select=*&order=sort_order`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
        cache: "no-store",
      }
    );
    if (!res.ok) return DEFAULT_PRICING;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return DEFAULT_PRICING;
    return data.map((r: { weight: string; price_rs: number; popular: boolean }) => ({
      weight: r.weight,
      price: `₹${r.price_rs}`,
      popular: r.popular,
    }));
  } catch {
    return DEFAULT_PRICING;
  }
}

const FEATURES = [
  { icon: "🚫", label: "No preservatives" },
  { icon: "🌿", label: "Simple ingredients" },
  { icon: "🍳", label: "Freshly prepared" },
  { icon: "🫒", label: "Pure groundnut oil" },
];

const WHY = [
  {
    icon: "🫙",
    title: "Small Batches",
    text: "Made in small batches so every chip is fresh and crispy. Never sitting on a shelf.",
  },
  {
    icon: "🫒",
    title: "Quality Ingredients",
    text: "Only pure groundnut oil, fresh raw bananas, and salt. That's it.",
  },
  {
    icon: "💛",
    title: "Made with Love",
    text: "The same snack I make for my own child. No shortcuts, no compromises.",
  },
];


export default async function Home() {
  const PRICING = await getPricing();
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#fdf7ed" }}>

      {/* ── Hero ── */}
      <section
        style={{
          background: "linear-gradient(150deg, #431407 0%, #7c2d12 35%, #92400e 65%, #b45309 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative orbs */}
        <div style={{
          position: "absolute", top: "-80px", right: "-80px",
          width: "320px", height: "320px", borderRadius: "50%",
          background: "rgba(251,191,36,0.09)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "80px", left: "-70px",
          width: "260px", height: "260px", borderRadius: "50%",
          background: "rgba(255,255,255,0.04)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: "25%", right: "8%",
          width: "100px", height: "100px", borderRadius: "50%",
          background: "rgba(251,191,36,0.07)", pointerEvents: "none",
        }} />

        <div className="flex flex-col items-center text-center px-6 pt-16 pb-8">
          {/* Logo with glow ring */}
          <div style={{ position: "relative", marginBottom: "22px" }}>
            <div style={{
              position: "absolute", inset: "-10px", borderRadius: "50%",
              background: "rgba(251,191,36,0.18)", filter: "blur(14px)",
            }} />
            <div style={{
              width: 128, height: 128, borderRadius: "50%",
              border: "2.5px solid rgba(251,191,36,0.45)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
              overflow: "hidden", position: "relative",
            }}>
              <Image src="/logo.png" alt="Mom Made Food" width={128} height={128}
                style={{ objectFit: "cover", width: "100%", height: "100%" }} priority />
            </div>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontFamily: "'Lora', Georgia, serif",
              color: "white", lineHeight: 1.15,
              letterSpacing: "-0.01em", marginBottom: "8px",
              fontSize: "clamp(2rem, 8vw, 2.6rem)", fontWeight: 700,
            }}
          >
            Mom Made Food
          </h1>

          <p
            style={{
              fontFamily: "'Lora', Georgia, serif",
              color: "rgba(255,255,255,0.72)", fontStyle: "italic",
              fontSize: "16px", marginBottom: "6px",
            }}
          >
            Made with care, just like at home.
          </p>
          <p style={{ color: "rgba(255,255,255,0.42)", fontSize: "13px", marginBottom: "28px", letterSpacing: "0.04em" }}>
            Crispy · Authentic · No shortcuts
          </p>

          {/* Hero order buttons */}
          <div style={{ width: "100%", maxWidth: "320px", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "28px" }}>
            <a
              href={WA_1}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                padding: "15px 20px", borderRadius: "18px",
                background: "linear-gradient(135deg, #16a34a, #15803d)",
                color: "white", fontWeight: 700, fontSize: "15px",
                textDecoration: "none",
                boxShadow: "0 4px 20px rgba(22,163,74,0.45)",
                transition: "transform 0.15s",
              }}
            >
              <WhatsAppIcon /> +91 98921 81645
            </a>
            <a
              href={WA_2}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                padding: "15px 20px", borderRadius: "18px",
                background: "linear-gradient(135deg, #16a34a, #15803d)",
                color: "white", fontWeight: 700, fontSize: "15px",
                textDecoration: "none",
                boxShadow: "0 4px 20px rgba(22,163,74,0.45)",
                transition: "transform 0.15s",
              }}
            >
              <WhatsAppIcon /> +91 96192 88170
            </a>
          </div>

          {/* Feature pills */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", paddingBottom: "48px" }}>
            {FEATURES.map((f) => (
              <span
                key={f.label}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.16)",
                  borderRadius: "999px",
                  padding: "5px 13px",
                  color: "rgba(255,255,255,0.78)",
                  fontSize: "12px", fontWeight: 500,
                }}
              >
                {f.icon} {f.label}
              </span>
            ))}
          </div>
        </div>

        {/* Wave into next section */}
        <svg
          viewBox="0 0 1440 72"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: "block", width: "100%", marginBottom: "-2px" }}
          preserveAspectRatio="none"
        >
          <path d="M0,36 Q360,4 720,42 Q1080,72 1440,28 L1440,72 L0,72 Z" fill="#fdf7ed" />
        </svg>
      </section>

      <div style={{ maxWidth: "480px", margin: "0 auto" }}>

        {/* ── Product card ── */}
        <section style={{ padding: "28px 16px 16px" }}>
          <div style={{
            background: "white",
            borderRadius: "24px",
            border: "1px solid #fde68a",
            padding: "24px",
            boxShadow: "0 4px 28px rgba(180,83,9,0.08)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px" }}>
              <div style={{
                fontSize: "26px",
                background: "#fffbeb",
                width: 52, height: 52, minWidth: 52,
                borderRadius: "14px",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "1px solid #fde68a",
              }}>🍌</div>
              <div>
                <h2 style={{
                  fontFamily: "'Lora', Georgia, serif",
                  color: "#1c1917", fontSize: "18px", fontWeight: 700,
                  marginBottom: "2px",
                }}>
                  Classic Salted Banana Chips
                </h2>
                <p style={{ color: "#d97706", fontSize: "12px", fontWeight: 600, letterSpacing: "0.02em" }}>
                  Kerala-style · Made to order
                </p>
              </div>
            </div>
            <p style={{ color: "#78716c", fontSize: "14px", lineHeight: 1.7 }}>
              Thinly sliced, perfectly crispy banana chips from fresh raw bananas, salted just right
              and fried in pure groundnut oil. A classic Kerala-style snack with no shortcuts.
            </p>
            <div style={{
              marginTop: "16px",
              padding: "13px 16px",
              background: "#fffbeb",
              borderRadius: "14px",
              border: "1px solid #fde68a",
              color: "#92400e",
              fontSize: "13px",
              fontStyle: "italic",
              fontFamily: "'Lora', Georgia, serif",
              lineHeight: 1.6,
            }}>
              &ldquo;Made to order, not stored. Every batch is freshly made when you place your order.&rdquo;
            </div>
          </div>
        </section>

        {/* ── Why Choose Us ── */}
        <section style={{ padding: "8px 16px 16px" }}>
          <p style={{
            fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "#b45309", marginBottom: "12px",
          }}>Why Choose Us</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {WHY.map((w) => (
              <div
                key={w.title}
                style={{
                  background: "white",
                  borderRadius: "18px",
                  border: "1px solid #fde68a",
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                  boxShadow: "0 2px 12px rgba(180,83,9,0.05)",
                }}
              >
                <div style={{
                  fontSize: "20px",
                  background: "#fffbeb",
                  width: 44, height: 44, minWidth: 44,
                  borderRadius: "12px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid #fde68a",
                }}>{w.icon}</div>
                <div>
                  <p style={{ fontWeight: 700, color: "#1c1917", fontSize: "14px", marginBottom: "3px" }}>
                    {w.title}
                  </p>
                  <p style={{ color: "#78716c", fontSize: "13px", lineHeight: 1.55 }}>{w.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Pricing ── */}
        <section style={{ padding: "8px 16px 16px" }}>
          <p style={{
            fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "#b45309", marginBottom: "12px",
          }}>Pricing</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {PRICING.map((p) => (
              <div
                key={p.weight}
                style={{
                  background: p.popular
                    ? "linear-gradient(145deg, #7c2d12, #b45309)"
                    : "white",
                  borderRadius: "20px",
                  border: p.popular ? "none" : "1px solid #fde68a",
                  padding: "20px 16px",
                  textAlign: "center",
                  position: "relative",
                  boxShadow: p.popular
                    ? "0 8px 28px rgba(124,45,18,0.35)"
                    : "0 2px 12px rgba(180,83,9,0.06)",
                }}
              >
                {p.popular && (
                  <span style={{
                    position: "absolute", top: "-10px", left: "50%",
                    transform: "translateX(-50%)",
                    background: "#f59e0b",
                    color: "white", fontSize: "10px", fontWeight: 700,
                    padding: "3px 11px", borderRadius: "999px",
                    whiteSpace: "nowrap", letterSpacing: "0.06em",
                  }}>POPULAR</span>
                )}
                <p style={{
                  fontSize: "14px", fontWeight: 600,
                  color: p.popular ? "rgba(255,255,255,0.75)" : "#78716c",
                  marginTop: p.popular ? "4px" : "0",
                  marginBottom: "4px",
                }}>{p.weight}</p>
                <p style={{
                  fontSize: "28px", fontWeight: 800,
                  color: p.popular ? "white" : "#92400e",
                  letterSpacing: "-0.02em", lineHeight: 1,
                }}>{p.price}</p>
              </div>
            ))}
          </div>
          <p style={{
            fontSize: "12px", textAlign: "center", color: "#a8a29e",
            marginTop: "10px", fontStyle: "italic",
          }}>
            Made to order. Freshness guaranteed.
          </p>
        </section>

        {/* ── Order CTA card ── */}
        <section style={{ padding: "8px 16px 32px" }}>
          <div style={{
            background: "linear-gradient(145deg, #431407, #92400e)",
            borderRadius: "28px",
            padding: "28px 20px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 10px 40px rgba(67,20,7,0.35)",
          }}>
            <div style={{
              position: "absolute", top: "-50px", right: "-50px",
              width: "180px", height: "180px", borderRadius: "50%",
              background: "rgba(251,191,36,0.08)", pointerEvents: "none",
            }} />
            <div style={{
              position: "absolute", bottom: "-35px", left: "-35px",
              width: "140px", height: "140px", borderRadius: "50%",
              background: "rgba(255,255,255,0.04)", pointerEvents: "none",
            }} />

            <p style={{
              fontFamily: "'Lora', Georgia, serif",
              color: "white", fontSize: "21px", fontWeight: 700,
              marginBottom: "6px", position: "relative",
            }}>
              Ready to order?
            </p>
            <p style={{
              color: "rgba(255,255,255,0.58)", fontSize: "13px",
              marginBottom: "22px", position: "relative", lineHeight: 1.6,
            }}>
              Message us on WhatsApp and we&apos;ll get it freshly made for you
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", position: "relative" }}>
              <a
                href={WA_1}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                  padding: "15px 20px", borderRadius: "18px",
                  background: "linear-gradient(135deg, #16a34a, #15803d)",
                  color: "white", fontWeight: 700, fontSize: "15px",
                  textDecoration: "none",
                  boxShadow: "0 4px 20px rgba(22,163,74,0.42)",
                }}
              >
                <WhatsAppIcon /> +91 98921 81645
              </a>
              <a
                href={WA_2}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                  padding: "15px 20px", borderRadius: "18px",
                  background: "linear-gradient(135deg, #16a34a, #15803d)",
                  color: "white", fontWeight: 700, fontSize: "15px",
                  textDecoration: "none",
                  boxShadow: "0 4px 20px rgba(22,163,74,0.45)",
                }}
              >
                <WhatsAppIcon /> +91 96192 88170
              </a>
            </div>
          </div>
        </section>

      </div>

      {/* ── Footer ── */}
      <footer style={{ textAlign: "center", padding: "4px 24px 48px" }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          overflow: "hidden", margin: "0 auto 10px",
          border: "2px solid #fde68a",
        }}>
          <Image src="/logo.png" alt="" width={36} height={36} className="object-cover" />
        </div>
        <p style={{
          fontFamily: "'Lora', Georgia, serif",
          color: "#a8a29e", fontSize: "13px", fontStyle: "italic",
        }}>
          From our kitchen to your family 💛
        </p>
        <p style={{ color: "#d6d3d1", fontSize: "11px", marginTop: "6px" }}>
          © {new Date().getFullYear()} Mom Made Food · Mumbai
        </p>
      </footer>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
