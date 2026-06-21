"use client";

/**
 * NADIRA Couture — Back-office (Espace Administrateur)
 *
 * Thin shell: login screen + dashboard chrome (top bar + sidebar).
 * Each section is implemented in its own file under
 * `@/components/nadira/admin/*-section.tsx` and rendered based on
 * `adminSection` from the global store. Splitting the previous
 * monolithic ~3.7k-line file fixes dev-server OOM crashes when the
 * browser tried to compile the whole admin view at once.
 */

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import {
  NadiraWordmark,
  NadiraMedallion,
} from "@/components/nadira/brand";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

// lucide
import { LogOut, Menu, Lock, AlertCircle } from "lucide-react";

// sonner
import { toast } from "sonner";

// Shared admin helpers & UI atoms
import {
  TOKEN_KEY,
  NAME_KEY,
  getToken,
  getAdminName,
  NAV_ITEMS,
} from "@/components/nadira/admin/admin-shared";

// Section components — statically imported. The files are split for
// maintainability but bundled together for reliable compilation.
import { DashboardSection } from "@/components/nadira/admin/dashboard-section";
import { ProduitsSection } from "@/components/nadira/admin/produits-section";
import { CommandesSection } from "@/components/nadira/admin/commandes-section";
import { RendezvousSection } from "@/components/nadira/admin/rendezvous-section";
import { MesuresSection } from "@/components/nadira/admin/mesures-section";
import { AvisSection } from "@/components/nadira/admin/avis-section";
import { GalerieSection } from "@/components/nadira/admin/galerie-section";
import { CategoriesSection } from "@/components/nadira/admin/categories-section";
import { ArtisansSection } from "@/components/nadira/admin/artisans-section";
import { ContenuSection } from "@/components/nadira/admin/contenu-section";

/* ============================================================
   Main export
============================================================ */

export function AdminView() {
  const { adminAuthed, setAdminAuthed } = useStore();
  // After hydration, check if a token exists in localStorage.
  // No API call — the admin API routes will return 401 if the token is invalid.
  useEffect(() => {
    const token = getToken();
    if (token && !adminAuthed) {
      setAdminAuthed(true);
    }
  }, [adminAuthed, setAdminAuthed]);

  if (!adminAuthed) return <AdminLogin />;
  return <AdminDashboard />;
}

/* ============================================================
   Login screen
============================================================ */

function AdminLogin() {
  const { setAdminAuthed, setView } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFA, setTwoFA] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api<{
        token: string;
        admin: { id: number; nom: string; email: string; role: string };
      }>("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(NAME_KEY, data.admin.nom);
      setAdminAuthed(true);
      toast.success(`Bienvenue, ${data.admin.nom}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="velvet-deep min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => setView("accueil")}
          className="text-ivory/60 hover:text-gold-light text-xs tracking-[0.2em] uppercase mb-6 mx-auto block transition-colors"
        >
          ← Retour au site
        </button>

        <div className="bg-card rounded-2xl shadow-2xl border border-gold/30 p-8">
          <div className="flex justify-center mb-5">
            <NadiraMedallion className="w-20 h-20" />
          </div>
          <h1 className="font-display text-2xl text-center text-emerald-deep mb-1">
            Espace Administrateur
          </h1>
          <p className="text-center text-[10px] text-muted-foreground tracking-[0.34em] uppercase mb-6">
            Maison NADIRA Couture
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs uppercase tracking-wider">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@nadira-couture.ma"
                autoComplete="username"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-xs uppercase tracking-wider"
              >
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={twoFA}
                onChange={(e) => setTwoFA(e.target.checked)}
                className="rounded border-border w-4 h-4 accent-emerald"
              />
              Activer la double authentification
            </label>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald hover:bg-emerald-deep text-ivory h-10"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <p className="text-center text-[10px] text-muted-foreground mt-6 tracking-[0.2em] uppercase">
            Accès réservé à la maison NADIRA
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Dashboard shell (top bar + sidebar + main)
============================================================ */

function AdminDashboard() {
  const { setAdminAuthed, adminSection, setView } = useStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const adminName = getAdminName();

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(NAME_KEY);
    setAdminAuthed(false);
    toast.success("Déconnecté");
  }

  return (
    <div className="min-h-screen flex flex-col bg-ivory-warm">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 lg:px-6 h-14">
          <div className="flex items-center gap-2">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <Sidebar onNavigate={() => setMobileNavOpen(false)} />
              </SheetContent>
            </Sheet>
            <NadiraWordmark className="scale-90 origin-left" />
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] text-emerald-deep bg-emerald/5 border border-emerald/20 rounded-full px-2.5 py-1">
              <Lock className="w-3 h-3" /> Session sécurisée
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView("accueil")}
              className="text-emerald-deep"
            >
              Voir le site
            </Button>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            <span className="hidden sm:inline text-sm text-muted-foreground">
              {adminName}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-destructive hover:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-1" /> Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar — desktop */}
        <aside className="hidden lg:block w-64 bg-card border-r border-border shrink-0">
          <Sidebar />
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6 max-h-screen overflow-y-auto nadira-scroll">
          {adminSection === "dashboard" && <DashboardSection />}
          {adminSection === "produits" && <ProduitsSection />}
          {adminSection === "commandes" && <CommandesSection />}
          {adminSection === "rendezvous" && <RendezvousSection />}
          {adminSection === "mesures" && <MesuresSection />}
          {adminSection === "avis" && <AvisSection />}
          {adminSection === "galerie" && <GalerieSection />}
          {adminSection === "categories" && <CategoriesSection />}
          {adminSection === "artisans" && <ArtisansSection />}
          {adminSection === "contenu" && <ContenuSection />}
        </main>
      </div>
    </div>
  );
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { adminSection, setAdminSection } = useStore();
  return (
    <nav className="p-4 space-y-1">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-3 py-2">
        Navigation
      </div>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = adminSection === item.key;
        return (
          <button
            key={item.key}
            onClick={() => {
              setAdminSection(item.key);
              onNavigate?.();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              active
                ? "bg-emerald text-ivory shadow-sm"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {item.label}
          </button>
        );
      })}
      <div className="pt-6 px-3">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
          Maison NADIRA
        </div>
        <div className="h-px gold-line opacity-60" />
        <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
          Atelier de Agadir · Maroc
          <br />
          Couture haute joaillerie
        </p>
      </div>
    </nav>
  );
}
