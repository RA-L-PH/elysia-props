// ─── Shared types ───────────────────────────────────────────────────────────
export type Currency = "AED" | "USD" | "EUR" | "GBP";

// ─── Conversion rates & symbols ─────────────────────────────────────────────
export const RATES: Record<Currency, number> = {
  AED: 1,
  USD: 0.2723,
  EUR: 0.2524,
  GBP: 0.2162,
};

export const SYMBOLS: Record<Currency, string> = {
  AED: "AED ",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

// ─── Hero carousel views ─────────────────────────────────────────────────────
export const BG_VIEWS = [
  { name: "The Aurelia Penthouse",  image: "/images/bg1.jpg",  label: "Skyline View" },
  { name: "The Sky Crescent Villa", image: "/images/bg2.jpg",  label: "Beachfront View" },
  { name: "Marina Cove Waterfront", image: "/images/bg3.jpg",  label: "Yacht Marina View" },
];

// ─── Flagship property cards ─────────────────────────────────────────────────
export const FLAGSHIP_CARDS = [
  { id: 1, location: "The Oasis by Emaar",  name: "Lagoon-Facing Grand Villa",   beds: 4, baths: 5, priceAED: 13_100_000, images: ["/images/prop4.jpg",  "/images/prop5.jpg",  "/images/prop6.jpg"],   area: "7,269",  handover: "Q3 2026", tag: null as string | null },
  { id: 2, location: "DAMAC Islands",       name: "Waterfront Private Villa",    beds: 4, baths: 5, priceAED: 1_990_000,  images: ["/images/prop1.jpg",  "/images/prop2.jpg",  "/images/prop3.jpg"],   area: "2,193",  handover: "Q4 2026", tag: null as string | null },
  { id: 3, location: "The World Islands",  name: "Floating Seahorse Villa",    beds: 2, baths: 2, priceAED: 22_000_000, images: ["/images/seahorse3.jpg", "/images/seahorse2.jpg", "/images/seahorse5.jpg"], area: "4,004",  handover: "Q1 2027", tag: "Private Access" as string | null },
  { id: 4, location: "Dubai Creek Harbour", name: "Premium Waterfront Residence",beds: 1, baths: 2, priceAED: 1_790_888,  images: ["/images/prop12.jpg", "/images/prop11.jpg", "/images/prop8.jpg"],   area: "740",    handover: "Q2 2027", tag: "Waterfront" as string | null },
  { id: 5, location: "Heights Country Club",name: "Serro Luxury Villa",         beds: 5, baths: 5, priceAED: 11_255_888, images: ["/images/prop7.jpg",  "/images/prop8.jpg",  "/images/prop9.jpg"],   area: "5,884",  handover: "Q4 2026", tag: "Exclusive" as string | null },
  { id: 6, location: "The Oasis by Emaar",  name: "Lagoon-Facing Sanctuary",     beds: 4, baths: 6, priceAED: 9_300_000,  images: ["/images/prop9.jpg",  "/images/prop10.jpg", "/images/prop6.jpg"],   area: "5,844",  handover: "Q3 2027", tag: "New Launch" as string | null },
];

// ─── Floor-exploder level data ───────────────────────────────────────────────
export const FLOOR_LEVELS = [
  {
    floor:  3,
    label:  "LEVEL 03",
    desc:   "Helipad & Sky Lounge",
    specs:  "Includes a private 15m sky helipad, a 360° panoramic Dubai skyline penthouse lounge, keycard elevator access, and a custom gold leaf wet bar.",
    zBase:  40,
    zActive: 140,
    zProg:  1,
    w: "w-72",
    h: "h-36",
  },
  {
    floor:  2,
    label:  "LEVEL 02",
    desc:   "Master Suites & Pool Terraces",
    specs:  "Features 4 expansive master suites with dual dressing rooms, a 20m heated outdoor infinity pool, a private screening room, and iPad-controlled automation.",
    zBase:  0,
    zActive: 50,
    zProg:  0,
    w: "w-80",
    h: "h-40",
  },
  {
    floor:  1,
    label:  "LEVEL 01",
    desc:   "Private Yacht Marina & Wellness",
    specs:  "Offers a private deep-water yacht slip (up to 45m), a Turkish hammam wellness center with a cold plunge pool, and a custom indoor/outdoor squash court.",
    zBase:  -40,
    zActive: -120,
    zProg:  -1,
    w: "w-88",
    h: "h-44",
  },
];

// ─── VIP concierge services ──────────────────────────────────────────────────
export const VIP_SERVICES = [
  {
    title: "NDA Consultation",
    body:  "Complete discretion. Access our private, off-market inventory securely with instant luxury broker authorization.",
    cta:   "Request Access",
    href:  "/contact",
  },
  {
    title: "Custom Helipads",
    body:  "Tailored layout upgrades. Work directly with our design architects to configure sky helipads and mega-yacht moorings.",
    cta:   "Consult Architect",
    href:  "/contact",
  },
  {
    title: "Marina Concierge",
    body:  "Exclusive yacht integration. Select estates come with pre-approved deep water slips and customizable dock utilities.",
    cta:   "View Slip Layouts",
    href:  "/contact",
  },
];
