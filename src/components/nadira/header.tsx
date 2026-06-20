"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { NadiraWordmark, KhatimStar } from "./brand";
import { cn } from "@/lib/utils";
import { Menu, X, Search, ShoppingBag, User, Phone } from "lucide-react";

const NAV_ITEMS: { label: string; view: Parameters<ReturnType<typeof useStore.getState>["setView"]>[0] }[] = [
  { label: "Accueil", view: "accueil" },
  { label: "Collections", view: "collections" },
  { label: "Sur-Mesure", view: "sur-mesure" },
  { label: "Atelier", view: "atelier" },
  { label: "Notre Histoire", view: "histoire" },
  { label: "Contact", view: "contact" },
];

export function Header() {
  const { view, setView, setFilters } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (v: typeof view) => {
    setView(v);
    setMobileOpen(false);
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ recherche: searchVal });
    setView("collections");
    setSearchOpen(false);
    setMobileOpen(false);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-500",
        scrolled
          ? "velvet-deep shadow-lg shadow-emerald-deep/30 backdrop-blur-md"
          : "velvet-deep/95 backdrop-blur-sm"
      )}
    >
      {/* Top utility bar */}
      <div className="hidden md:flex items-center justify-center gap-6 border-b border-gold/15 py-1.5 text-[11px] tracking-wider text-ivory/70">
        <span className="flex items-center gap-1.5">
          <KhatimStar className="h-3 w-3 text-gold/70" />
          Livraison soignée dans tout le Maroc
        </span>
        <span className="h-3 w-px bg-gold/20" />
        <a href="tel:+212535634218" className="flex items-center gap-1.5 hover:text-gold-light transition-colors">
          <Phone className="h-3 w-3" /> +212 5 35 63 42 18
        </a>
        <span className="h-3 w-px bg-gold/20" />
        <span className="flex items-center gap-1.5">
          <KhatimStar className="h-3 w-3 text-gold/70" />
          Atelier · Fès
        </span>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden text-ivory p-2 -ml-2"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Logo */}
          <button onClick={() => go("accueil")} className="shrink-0 lg:absolute lg:left-1/2 lg:-translate-x-1/2">
            <NadiraWordmark onDark />
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-7">
            {NAV_ITEMS.slice(0, 3).map((item) => (
              <NavItem key={item.view} {...item} active={view === item.view} onClick={() => go(item.view)} />
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="text-ivory p-2 hover:text-gold-light transition-colors"
              aria-label="Rechercher"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              onClick={() => go("espace-client")}
              className={cn(
                "text-ivory p-2 hover:text-gold-light transition-colors",
                view === "espace-client" && "text-gold-light"
              )}
              aria-label="Espace client"
            >
              <User className="h-5 w-5" />
            </button>
            <button
              onClick={() => go("sur-mesure")}
              className="hidden sm:flex items-center gap-1.5 ml-2 rounded-full bg-gold/15 border border-gold/40 px-3 py-1.5 text-xs tracking-wider text-gold-light hover:bg-gold/25 transition-colors"
            >
              <ShoppingBag className="h-3.5 w-3.5" /> Prendre RDV
            </button>
          </div>
        </div>

        {/* Desktop secondary nav (3 more items) */}
        <nav className="hidden lg:flex items-center justify-center gap-7 pb-2">
          {NAV_ITEMS.slice(3).map((item) => (
            <NavItem key={item.view} {...item} active={view === item.view} onClick={() => go(item.view)} />
          ))}
        </nav>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <form onSubmit={submitSearch} className="border-t border-gold/15 velvet-deep">
          <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
            <Search className="h-5 w-5 text-gold" />
            <input
              autoFocus
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Rechercher un caftan, une takchita, un tissu..."
              className="flex-1 bg-transparent text-ivory placeholder:text-ivory/40 outline-none text-sm"
            />
            <button type="submit" className="text-xs uppercase tracking-widest text-gold-light hover:text-gold">
              Chercher
            </button>
          </div>
        </form>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden velvet-deep border-t border-gold/15">
          <nav className="px-4 py-4 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.view}
                onClick={() => go(item.view)}
                className={cn(
                  "text-left px-4 py-3 rounded-lg text-sm tracking-wide transition-colors",
                  view === item.view
                    ? "bg-gold/15 text-gold-light"
                    : "text-ivory/85 hover:bg-white/5"
                )}
              >
                {item.label}
              </button>
            ))}
            <form onSubmit={submitSearch} className="mt-2 flex items-center gap-2 px-4">
              <Search className="h-4 w-4 text-gold" />
              <input
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Rechercher..."
                className="flex-1 bg-white/5 border border-gold/20 rounded-full px-4 py-2 text-sm text-ivory placeholder:text-ivory/40 outline-none"
              />
            </form>
          </nav>
        </div>
      )}
    </header>
  );
}

function NavItem({
  label,
  active,
  onClick,
}: {
  label: string;
  view: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative text-sm tracking-wide transition-colors py-1 group",
        active ? "text-gold-light" : "text-ivory/80 hover:text-gold-light"
      )}
    >
      {label}
      <span
        className={cn(
          "absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-px bg-gold transition-all duration-300",
          active ? "w-6" : "w-0 group-hover:w-4"
        )}
      />
    </button>
  );
}
