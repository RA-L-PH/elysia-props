"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { DollarSign, Landmark, Ruler, Bed, Bath, ArrowUpRight } from "lucide-react";

type Currency = "AED" | "USD" | "EUR";
type FilterType = "all" | "penthouses" | "beachfront" | "off-plan";

interface Property {
  id: number;
  title: string;
  category: FilterType;
  zone: "palm" | "downtown" | "marina" | "hills";
  beds: number;
  baths: number;
  sqft: number;
  priceAED: number;
  image: string;
  handover: string;
}

const propertiesData: Property[] = [
  {
    id: 1,
    title: "Lagoon-Facing Grand Villa",
    category: "beachfront",
    zone: "palm",
    beds: 4,
    baths: 5,
    sqft: 7269,
    priceAED: 13100000,
    image: "/images/prop4.jpg",
    handover: "Q3 2026",
  },
  {
    id: 2,
    title: "Waterfront Private Villa",
    category: "beachfront",
    zone: "marina",
    beds: 4,
    baths: 5,
    sqft: 2193,
    priceAED: 1990000,
    image: "/images/prop1.jpg",
    handover: "Q4 2026",
  },
  {
    id: 3,
    title: "Floating Seahorse Villa",
    category: "penthouses",
    zone: "palm",
    beds: 2,
    baths: 2,
    sqft: 4004,
    priceAED: 22000000,
    image: "/images/seahorse3.jpg",
    handover: "Q1 2027",
  },
  {
    id: 4,
    title: "Premium Waterfront Residence",
    category: "off-plan",
    zone: "marina",
    beds: 1,
    baths: 2,
    sqft: 740,
    priceAED: 1790888,
    image: "/images/prop12.jpg",
    handover: "Q2 2027",
  },
  {
    id: 5,
    title: "Serro Luxury Villa",
    category: "off-plan",
    zone: "hills",
    beds: 5,
    baths: 5,
    sqft: 5884,
    priceAED: 11255888,
    image: "/images/prop7.jpg",
    handover: "Q4 2026",
  },
  {
    id: 6,
    title: "Lagoon-Facing Sanctuary",
    category: "beachfront",
    zone: "palm",
    beds: 4,
    baths: 6,
    sqft: 5844,
    priceAED: 9300000,
    image: "/images/prop9.jpg",
    handover: "Q3 2027",
  },
  {
    id: 7,
    title: "The Royal Atlantis Sky Palace",
    category: "penthouses",
    zone: "palm",
    beds: 5,
    baths: 6,
    sqft: 8500,
    priceAED: 180000000,
    image: "/images/skyline.jpg",
    handover: "Ready Q1 2026",
  },
  {
    id: 8,
    title: "DAMAC Islands Waterfront Palace",
    category: "beachfront",
    zone: "marina",
    beds: 4,
    baths: 5,
    sqft: 3160,
    priceAED: 2900000,
    image: "/images/prop2.jpg",
    handover: "Ready Now",
  },
  {
    id: 9,
    title: "Bulgari Lighthouse Mansion",
    category: "beachfront",
    zone: "marina",
    beds: 7,
    baths: 9,
    sqft: 15600,
    priceAED: 143000000,
    image: "/images/pool.jpg",
    handover: "Ready Q4 2026",
  },
  {
    id: 10,
    title: "Downtown Boulevard Heights",
    category: "off-plan",
    zone: "downtown",
    beds: 3,
    baths: 4,
    sqft: 4500,
    priceAED: 45000000,
    image: "/images/prop11.jpg",
    handover: "Handover Q3 2028",
  },
  {
    id: 11,
    title: "Emirates Hills Grand Estate",
    category: "off-plan",
    zone: "hills",
    beds: 8,
    baths: 10,
    sqft: 22000,
    priceAED: 210000000,
    image: "/images/prop10.jpg",
    handover: "Ready Now",
  },
  {
    id: 12,
    title: "Sobha Hartland Sanctuary",
    category: "off-plan",
    zone: "downtown",
    beds: 2,
    baths: 2,
    sqft: 977,
    priceAED: 2500000,
    image: "/images/prop5.jpg",
    handover: "Ready Q4 2026",
  },
];

export default function Properties() {
  const [currency, setCurrency] = useState<Currency>("AED");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  // Conversion rates (approximate for layout simulation)
  const rates = {
    AED: 1.0,
    USD: 0.272,
    EUR: 0.254,
  };

  const currencySymbols = {
    AED: "AED",
    USD: "$",
    EUR: "€",
  };

  const formatPrice = (priceAED: number, curr: Currency) => {
    const converted = priceAED * rates[curr];
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(converted);
  };

  // Filter listings based on active filters
  const filteredProperties = propertiesData.filter((p) => {
    const matchesCategory = filter === "all" || p.category === filter;
    const matchesZone = !selectedZone || p.zone === selectedZone;
    return matchesCategory && matchesZone;
  });

  const neighborhoodInfo = {
    palm: { name: "Palm Jumeirah", desc: "An architectural wonder of private beachfront villas." },
    downtown: { name: "Downtown Dubai", desc: "Super-tall skyscraper penthouses near Burj Khalifa." },
    marina: { name: "Dubai Marina", desc: "Waterfront luxury living with private yacht slips." },
    hills: { name: "Emirates Hills", desc: "The Beverly Hills of Dubai. Exclusive gated mansions." },
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-16">
      
      {/* HEADER SECTION */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-accent/15 pb-8">
        <div className="space-y-4">
          <span className="text-xs uppercase tracking-[0.3em] text-accent font-plus-jakarta">
            The Curation
          </span>
          <h1 className="font-cormorant text-5xl md:text-7xl text-text-primary leading-tight">
            Curated <span className="font-persian italic text-accent font-normal">Acquisitions</span>
          </h1>
        </div>

        {/* Currency Switcher */}
        <div className="glass-panel p-1 rounded-lg flex items-center self-start md:self-auto shadow-md">
          {(["AED", "USD", "EUR"] as Currency[]).map((curr) => (
            <button
              key={curr}
              onClick={() => setCurrency(curr)}
              className={`px-4 py-2 text-[10px] font-plus-jakarta font-semibold tracking-wider rounded transition-all duration-300 ${
                currency === curr ? "bg-accent text-canvas" : "text-text-primary/70 hover:text-accent"
              }`}
            >
              {curr}
            </button>
          ))}
        </div>
      </section>

      {/* FILTER BAR */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {([
            { id: "all", label: "All Properties" },
            { id: "penthouses", label: "Penthouses" },
            { id: "beachfront", label: "Beachfront" },
            { id: "off-plan", label: "Off-Plan" },
          ] as { id: FilterType; label: string }[]).map((chip) => (
            <button
              key={chip.id}
              onClick={() => setFilter(chip.id)}
              className={`px-6 py-2.5 rounded-full border text-[10px] font-plus-jakarta uppercase tracking-[0.15em] transition-all duration-500 hover:border-accent hover:text-accent ${
                filter === chip.id
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-accent/15 bg-transparent text-text-primary/80"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Map clear filters reminder */}
        {selectedZone && (
          <button 
            onClick={() => setSelectedZone(null)}
            className="text-[10px] uppercase font-plus-jakarta tracking-wider text-accent border-b border-accent"
          >
            Clear Zone: {selectedZone.toUpperCase()} (Show All Zones)
          </button>
        )}
      </section>

      {/* STAGGERED PROPERTY GRID */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProperties.length > 0 ? (
          filteredProperties.map((p) => (
            <div
              key={p.id}
              className="glass-panel p-4 rounded-lg relative overflow-hidden group cursor-pointer border border-accent/10 hover:border-accent/30 transition-all duration-500 shadow-lg flex flex-col justify-between"
              style={{
                clipPath: "polygon(0 0, 100% 0, 100% 100%, 0% 100%)",
              }}
            >
              {/* Image Container with Hover Zoom */}
              <div className="relative h-72 w-full overflow-hidden rounded mb-4 bg-black/10">
                <Image
                  src={p.image}
                  alt={p.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                />
                <span className="absolute top-4 left-4 glass-panel px-3 py-1 text-[9px] font-plus-jakarta tracking-widest text-white uppercase bg-black/45 rounded">
                  {p.handover}
                </span>
              </div>

              {/* Title & Metadata */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] tracking-widest uppercase font-plus-jakarta text-accent">
                    {p.zone.toUpperCase()} • {p.category.toUpperCase()}
                  </span>
                  <h3 className="font-cormorant text-xl text-text-primary group-hover:text-accent transition-colors">
                    {p.title}
                  </h3>
                </div>

                {/* Specs Bar */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-accent/10 text-[10px] font-plus-jakarta text-text-primary/75">
                  <div className="flex items-center space-x-1.5 justify-center border-r border-accent/10">
                    <Bed className="w-3.5 h-3.5 text-accent" />
                    <span>{p.beds} Beds</span>
                  </div>
                  <div className="flex items-center space-x-1.5 justify-center border-r border-accent/10">
                    <Bath className="w-3.5 h-3.5 text-accent" />
                    <span>{p.baths} Baths</span>
                  </div>
                  <div className="flex items-center space-x-1.5 justify-center">
                    <Ruler className="w-3.5 h-3.5 text-accent" />
                    <span>{p.sqft} sq ft</span>
                  </div>
                </div>

                {/* Price to CTA Switcher */}
                <div className="flex justify-between items-center h-10 overflow-hidden relative">
                  <div className="flex flex-col justify-center h-full transition-transform duration-500 group-hover:-translate-y-full">
                    <p className="text-[9px] tracking-widest font-plus-jakarta text-text-primary/50 uppercase">Starting Price</p>
                    <span className="font-italiana text-lg text-accent font-semibold">
                      {currencySymbols[currency]} {formatPrice(p.priceAED, currency)}
                    </span>
                  </div>
                  
                  {/* Book Private Viewing Slide CTA */}
                  <Link
                    href="/contact"
                    className="absolute inset-0 flex items-center justify-between bg-accent text-canvas px-4 rounded text-[10px] font-plus-jakarta uppercase tracking-widest transition-all duration-500 translate-y-full group-hover:translate-y-0"
                  >
                    <span>Request Private Desk</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center space-y-4">
            <p className="font-cormorant text-2xl text-text-primary/70">No listings match the criteria.</p>
            <button 
              onClick={() => { setFilter("all"); setSelectedZone(null); }}
              className="px-6 py-2 border border-accent text-[10px] uppercase font-plus-jakarta tracking-wider text-accent rounded"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </section>

      {/* INTERACTIVE NEIGHBORHOOD RAY-CASTER MAP */}
      <section className="glass-panel p-8 rounded-lg border border-accent/15 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
        <div className="space-y-4 text-left">
          <span className="text-xs uppercase tracking-[0.3em] text-accent font-plus-jakarta">
            Neighborhood Selector
          </span>
          <h2 className="font-cormorant text-3xl md:text-4xl text-text-primary">
            Prime Dubai Zones
          </h2>
          <p className="font-plus-jakarta text-xs text-text-primary/80 font-light leading-relaxed">
            Click on any coordinate on our custom radar vector map to target specific investment hubs. Tap a node to isolate properties in that sector.
          </p>

          <div className="pt-2">
            {selectedZone ? (
              <div className="p-4 border border-accent/30 rounded bg-accent/5 space-y-2">
                <span className="text-[10px] font-bold text-accent uppercase font-plus-jakarta tracking-widest">
                  Active Zone: {neighborhoodInfo[selectedZone as keyof typeof neighborhoodInfo].name}
                </span>
                <p className="text-[11px] font-plus-jakarta text-text-primary/85 leading-relaxed font-light">
                  {neighborhoodInfo[selectedZone as keyof typeof neighborhoodInfo].desc}
                </p>
              </div>
            ) : (
              <p className="text-[10px] tracking-wider font-plus-jakarta text-text-primary/65 uppercase">
                Hover or click map coordinates to filter.
              </p>
            )}
          </div>
        </div>

        {/* Vector SVG Map representing Dubai Coastline */}
        <div className="lg:col-span-2 relative h-[300px] w-full border border-accent/10 rounded flex items-center justify-center bg-black/25">
          <svg className="w-full h-full text-accent/20" viewBox="0 0 600 300" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Coastline */}
            <path d="M50 250 C 200 240, 350 180, 550 50" stroke="#D4AF37" strokeWidth="2" strokeDasharray="5 5" className="opacity-40" />

            {/* Gulf Water representation */}
            <path d="M50 250 C 200 240, 350 180, 550 50 L 550 0 L 0 0 L 0 250 Z" fill="#D4AF37" className="opacity-[0.02]" />

            {/* Palm Jumeirah representation grid */}
            <g transform="translate(180, 150)">
              <circle cx="0" cy="0" r="30" stroke="#D4AF37" strokeWidth="1" className="opacity-20" />
              <line x1="0" y1="0" x2="0" y2="-40" stroke="#D4AF37" strokeWidth="1.5" className="opacity-30" />
              <line x1="0" y1="0" x2="-25" y2="-25" stroke="#D4AF37" strokeWidth="1" className="opacity-20" />
              <line x1="0" y1="0" x2="25" y2="-25" stroke="#D4AF37" strokeWidth="1" className="opacity-20" />
            </g>

            {/* Grid Coordinates */}
            <line x1="100" y1="0" x2="100" y2="300" stroke="#D4AF37" strokeWidth="0.5" className="opacity-10" />
            <line x1="300" y1="0" x2="300" y2="300" stroke="#D4AF37" strokeWidth="0.5" className="opacity-10" />
            <line x1="500" y1="0" x2="500" y2="300" stroke="#D4AF37" strokeWidth="0.5" className="opacity-10" />
            <line x1="0" y1="100" x2="600" y2="100" stroke="#D4AF37" strokeWidth="0.5" className="opacity-10" />
            <line x1="0" y1="200" x2="600" y2="200" stroke="#D4AF37" strokeWidth="0.5" className="opacity-10" />

            {/* Neighborhood nodes */}
            {/* Palm Jumeirah Node */}
            <g 
              className="cursor-pointer group/node"
              onClick={() => setSelectedZone(selectedZone === "palm" ? null : "palm")}
              onMouseEnter={() => setSelectedZone("palm")}
            >
              <circle cx="180" cy="110" r="10" fill={selectedZone === "palm" ? "#D4AF37" : "transparent"} stroke="#D4AF37" strokeWidth="2" className="transition-all duration-300" />
              <circle cx="180" cy="110" r="18" stroke="#D4AF37" strokeWidth="1" className="animate-pulse opacity-50" />
              <text x="180" y="85" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontFamily="var(--font-plus-jakarta)" letterSpacing="0.1em" className="opacity-80 font-semibold uppercase">Palm Jumeirah</text>
            </g>

            {/* Downtown Node */}
            <g 
              className="cursor-pointer group/node"
              onClick={() => setSelectedZone(selectedZone === "downtown" ? null : "downtown")}
              onMouseEnter={() => setSelectedZone("downtown")}
            >
              <circle cx="420" cy="140" r="10" fill={selectedZone === "downtown" ? "#D4AF37" : "transparent"} stroke="#D4AF37" strokeWidth="2" className="transition-all duration-300" />
              <circle cx="420" cy="140" r="18" stroke="#D4AF37" strokeWidth="1" className="animate-pulse opacity-50" />
              <text x="420" y="115" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontFamily="var(--font-plus-jakarta)" letterSpacing="0.1em" className="opacity-80 font-semibold uppercase">Downtown</text>
            </g>

            {/* Dubai Marina Node */}
            <g 
              className="cursor-pointer group/node"
              onClick={() => setSelectedZone(selectedZone === "marina" ? null : "marina")}
              onMouseEnter={() => setSelectedZone("marina")}
            >
              <circle cx="100" cy="200" r="10" fill={selectedZone === "marina" ? "#D4AF37" : "transparent"} stroke="#D4AF37" strokeWidth="2" className="transition-all duration-300" />
              <circle cx="100" cy="200" r="18" stroke="#D4AF37" strokeWidth="1" className="animate-pulse opacity-50" />
              <text x="100" y="175" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontFamily="var(--font-plus-jakarta)" letterSpacing="0.1em" className="opacity-80 font-semibold uppercase">Marina</text>
            </g>

            {/* Emirates Hills Node */}
            <g 
              className="cursor-pointer group/node"
              onClick={() => setSelectedZone(selectedZone === "hills" ? null : "hills")}
              onMouseEnter={() => setSelectedZone("hills")}
            >
              <circle cx="280" cy="220" r="10" fill={selectedZone === "hills" ? "#D4AF37" : "transparent"} stroke="#D4AF37" strokeWidth="2" className="transition-all duration-300" />
              <circle cx="280" cy="220" r="18" stroke="#D4AF37" strokeWidth="1" className="animate-pulse opacity-50" />
              <text x="280" y="195" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontFamily="var(--font-plus-jakarta)" letterSpacing="0.1em" className="opacity-80 font-semibold uppercase">Emirates Hills</text>
            </g>
          </svg>
        </div>
      </section>

    </div>
  );
}
