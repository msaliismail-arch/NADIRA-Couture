"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Header } from "@/components/nadira/header";
import { Footer } from "@/components/nadira/footer";
import { IntroLoader } from "@/components/nadira/intro-loader";
import { api } from "@/lib/api";
import type { Contenu } from "@/lib/types";

import { HomeView } from "@/components/nadira/views/home-view";
import { HistoireView } from "@/components/nadira/views/histoire-view";
import { CollectionsView } from "@/components/nadira/views/collections-view";
import { ProduitView } from "@/components/nadira/views/produit-view";
import { SurMesureView } from "@/components/nadira/views/sur-mesure-view";
import { AtelierView } from "@/components/nadira/views/atelier-view";
import { ContactView } from "@/components/nadira/views/contact-view";
import { EspaceClientView } from "@/components/nadira/views/espace-client-view";
import { AdminView } from "@/components/nadira/views/admin-view";

export default function Page() {
  const { view } = useStore();
  const [contenu, setContenu] = useState<Record<string, string>>({});

  useEffect(() => {
    api<Contenu[]>("/api/contenu")
      .then((data) => {
        const map: Record<string, string> = {};
        data.forEach((c) => (map[c.cle] = c.valeur));
        setContenu(map);
      })
      .catch(() => {});
  }, []);

  // Admin view is full-screen (no public header/footer)
  if (view === "admin") {
    return (
      <div className="min-h-screen bg-background">
        <AdminView />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <IntroLoader />
      <Header />
      <main className="flex-1">
        {view === "accueil" && <HomeView contenu={contenu} />}
        {view === "histoire" && <HistoireView contenu={contenu} />}
        {view === "collections" && <CollectionsView />}
        {view === "produit" && <ProduitView />}
        {view === "sur-mesure" && <SurMesureView />}
        {view === "atelier" && <AtelierView contenu={contenu} />}
        {view === "contact" && <ContactView contenu={contenu} />}
        {view === "espace-client" && <EspaceClientView />}
      </main>
      <Footer contenu={contenu} />
    </div>
  );
}
