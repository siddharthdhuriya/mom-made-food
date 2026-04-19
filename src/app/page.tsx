import Image from "next/image";

const WA_TEXT = encodeURIComponent("I want to order some tasty banana chips");
const WA_1 = `https://wa.me/919892181645?text=${WA_TEXT}`;
const WA_2 = `https://wa.me/919619288170?text=${WA_TEXT}`;

const PRICING = [
  { weight: "100g", price: "₹150", star: false },
  { weight: "250g", price: "₹250", star: true },
  { weight: "500g", price: "₹480", star: true },
  { weight: "1kg",  price: "₹960", star: false },
];

const FEATURES = [
  { icon: "🚫", label: "No preservatives" },
  { icon: "🌿", label: "Simple honest ingredients" },
  { icon: "🍳", label: "Freshly prepared" },
];

const WHY = [
  { icon: "🫙", text: "Made in small batches for freshness" },
  { icon: "🫒", text: "Uses good quality groundnut oil" },
  { icon: "💛", text: "The same snack I make for my child" },
];

export default function Home() {
  return (
    <div
      className="min-h-screen flex flex-col items-center"
      style={{ background: "#fdf7ed", fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Hero */}
      <section className="w-full max-w-lg px-6 pt-10 pb-8 flex flex-col items-center text-center">
        <Image
          src="/logo.png"
          alt="Mom Made Food"
          width={96}
          height={96}
          className="rounded-full shadow-lg mb-5"
          priority
        />
        <h1
          className="text-3xl font-bold text-gray-900 leading-tight"
          style={{ fontFamily: "'Lora', Georgia, serif" }}
        >
          Mom Made <span className="text-amber-500">Food</span>
        </h1>
        <p
          className="mt-2 text-base text-gray-500 italic"
          style={{ fontFamily: "'Lora', Georgia, serif" }}
        >
          Made with care, just like at home.
        </p>
      </section>

      {/* Product */}
      <section className="w-full max-w-lg px-4 pb-6">
        <div className="bg-white rounded-3xl shadow-sm border border-amber-100 p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🍌</span>
            <h2
              className="text-xl font-semibold text-gray-900"
              style={{ fontFamily: "'Lora', Georgia, serif" }}
            >
              Classic Salted Banana Chips
            </h2>
          </div>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Thinly sliced, perfectly crispy banana chips made from fresh raw bananas — salted just right and fried in pure groundnut oil. A classic Kerala-style snack with no shortcuts.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {FEATURES.map((f) => (
              <span
                key={f.label}
                className="flex items-center gap-1.5 bg-amber-50 text-amber-800 text-xs font-medium px-3 py-1.5 rounded-full border border-amber-200"
              >
                {f.icon} {f.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="w-full max-w-lg px-4 pb-6">
        <div className="bg-amber-50 rounded-3xl border border-amber-200 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-3">Why Choose Us</p>
          <ul className="space-y-3">
            {WHY.map((w) => (
              <li key={w.text} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="text-lg leading-none mt-0.5">{w.icon}</span>
                <span>{w.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Pricing */}
      <section className="w-full max-w-lg px-4 pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-3 px-1">Pricing</p>
        <div className="grid grid-cols-2 gap-3">
          {PRICING.map((p) => (
            <div
              key={p.weight}
              className={`relative bg-white rounded-2xl border p-4 text-center shadow-sm ${
                p.star ? "border-amber-400 ring-1 ring-amber-300" : "border-amber-100"
              }`}
            >
              {p.star && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Popular
                </span>
              )}
              <p className="text-base font-bold text-gray-900 mt-1">{p.weight}</p>
              <p className="text-xl font-bold text-amber-600 mt-0.5">{p.price}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-center text-gray-400 mt-3 italic">
          Made to order to ensure freshness
        </p>
      </section>

      {/* Order CTA */}
      <section className="w-full max-w-lg px-4 pb-6 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-1 px-1">Order Now</p>
        <a
          href={WA_1}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold rounded-2xl py-4 text-base shadow-md transition-all duration-150 active:scale-[0.98]"
        >
          <WhatsAppIcon />
          +91 98921 81645
        </a>
        <a
          href={WA_2}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold rounded-2xl py-4 text-base shadow-md transition-all duration-150 active:scale-[0.98]"
        >
          <WhatsAppIcon />
          +91 96192 88170
        </a>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-lg px-4 pt-2 pb-10 flex flex-col items-center gap-4">
        <p
          className="text-sm text-gray-500 italic text-center"
          style={{ fontFamily: "'Lora', Georgia, serif" }}
        >
          From our kitchen to your family 💛
        </p>
      </footer>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
