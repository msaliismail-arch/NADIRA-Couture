"use client";

import { useStore } from "@/lib/store";
import { NadiraMedallion, GoldDivider, KhatimStar } from "./brand";
import { Instagram, Facebook, Phone, Mail, MapPin, MessageCircle } from "lucide-react";

export function Footer({ contenu }: { contenu: Record<string, string> }) {
  const { setView } = useStore();

  return (
    <footer className="relative velvet-deep text-ivory overflow-hidden mt-auto">
      {/* Medallion watermark */}
      <NadiraMedallion className="pointer-events-none absolute -right-24 -bottom-24 w-[28rem] h-[28rem] opacity-[0.07] khatim-spin" />

      {/* Khatim pattern top border */}
      <div className="h-2 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Top — medallion + tagline */}
        <div className="flex flex-col items-center text-center mb-12">
          <NadiraMedallion className="w-28 h-28 mb-4 opacity-95" />
          <p className="font-display text-2xl text-gold-light tracking-[0.3em]">NADIRA</p>
          <p className="text-xs tracking-[0.4em] uppercase text-ivory/50 mt-1">Couture · Maroc</p>
          <GoldDivider className="py-4 opacity-60" />
          <p className="max-w-md text-ivory/70 italic font-display text-lg leading-relaxed">
            {contenu.citation_1 || "« Le fil d'or ne ment pas : il garde la mémoire des mains qui l'ont tiré. »"}
          </p>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Navigation */}
          <div>
            <h3 className="text-gold-light text-xs tracking-[0.25em] uppercase mb-4 flex items-center gap-2">
              <KhatimStar className="h-3 w-3" /> Explorer
            </h3>
            <ul className="space-y-2.5 text-sm text-ivory/75">
              {[
                { label: "Accueil", v: "accueil" as const },
                { label: "Collections", v: "collections" as const },
                { label: "Sur-Mesure", v: "sur-mesure" as const },
                { label: "Notre Histoire", v: "histoire" as const },
                { label: "Atelier & Artisans", v: "atelier" as const },
                { label: "Espace Client", v: "espace-client" as const },
              ].map((item) => (
                <li key={item.v}>
                  <button
                    onClick={() => setView(item.v)}
                    className="hover:text-gold-light transition-colors text-left"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-gold-light text-xs tracking-[0.25em] uppercase mb-4 flex items-center gap-2">
              <KhatimStar className="h-3 w-3" /> Maison NADIRA
            </h3>
            <ul className="space-y-3 text-sm text-ivory/75">
              <li className="flex gap-2.5">
                <MapPin className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                <span>{contenu.contact_adresse}</span>
              </li>
              <li className="flex gap-2.5">
                <Phone className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                <a href={`tel:${contenu.contact_telephone}`} className="hover:text-gold-light">
                  {contenu.contact_telephone}
                </a>
              </li>
              <li className="flex gap-2.5">
                <MessageCircle className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                <span>WhatsApp : {contenu.contact_whatsapp}</span>
              </li>
              <li className="flex gap-2.5">
                <Mail className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                <a href={`mailto:${contenu.contact_email}`} className="hover:text-gold-light">
                  {contenu.contact_email}
                </a>
              </li>
            </ul>
          </div>

          {/* Horaires */}
          <div>
            <h3 className="text-gold-light text-xs tracking-[0.25em] uppercase mb-4 flex items-center gap-2">
              <KhatimStar className="h-3 w-3" /> Atelier
            </h3>
            <p className="text-sm text-ivory/75 leading-relaxed">{contenu.contact_horaires}</p>
            <div className="mt-4 flex gap-3">
              <a
                href={contenu.reseaux_instagram}
                target="_blank"
                rel="noreferrer"
                className="h-9 w-9 rounded-full border border-gold/30 flex items-center justify-center text-gold-light hover:bg-gold/15 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href={contenu.reseaux_facebook}
                target="_blank"
                rel="noreferrer"
                className="h-9 w-9 rounded-full border border-gold/30 flex items-center justify-center text-gold-light hover:bg-gold/15 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Newsletter / admin */}
          <div>
            <h3 className="text-gold-light text-xs tracking-[0.25em] uppercase mb-4 flex items-center gap-2">
              <KhatimStar className="h-3 w-3" /> La Maison
            </h3>
            <p className="text-sm text-ivory/75 mb-4 leading-relaxed">
              Recevez nos nouvelles collections et l'actualité de l'atelier.
            </p>
            <form className="flex flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Votre email"
                className="bg-white/5 border border-gold/25 rounded-full px-4 py-2 text-sm text-ivory placeholder:text-ivory/40 outline-none focus:border-gold/60"
              />
              <button
                type="submit"
                className="rounded-full bg-gold/15 border border-gold/40 px-4 py-2 text-xs tracking-widest uppercase text-gold-light hover:bg-gold/25 transition-colors"
              >
                S'inscrire
              </button>
            </form>
            <button
              onClick={() => setView("admin")}
              className="mt-4 text-[11px] tracking-widest uppercase text-ivory/40 hover:text-gold-light transition-colors"
            >
              Espace Administrateur
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-gold/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ivory/50">
          <p>© {new Date().getFullYear()} NADIRA Couture. Tous droits réservés.</p>
          <p className="flex items-center gap-2">
            <KhatimStar className="h-3 w-3 text-gold/50" />
            Fait main à Fès, avec passion
            <KhatimStar className="h-3 w-3 text-gold/50" />
          </p>
        </div>
      </div>
    </footer>
  );
}
