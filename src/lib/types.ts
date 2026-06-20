// Shared types for NADIRA views (mirror Prisma models)

export type Categorie = {
  id: number;
  libelle: string;
  slug: string;
  ordre: number;
};

export type Produit = {
  id: number;
  nom: string;
  slug: string;
  description: string;
  idCategorie: number;
  categorie?: Categorie;
  prix: number;
  tissu: string;
  couleurs: string;
  delaiRealisation: number;
  occasion: string | null;
  vedette: boolean;
  stock: number;
  photos: string;
  // Dimensions (cm)
  longueur: number | null;
  largeur: number | null;
  tourPoitrine: number | null;
  tourTaille: number | null;
  tourHanches: number | null;
  longueurManche: number | null;
  autreDimensions: string | null;
  datePiece: string | null;
  created_at: string;
  updated_at: string;
};

export type Galerie = {
  id: number;
  url: string;
  legende: string | null;
  categorie: string | null;
  created_at: string;
};

export type Artisan = {
  id: number;
  nom: string;
  specialite: string;
  biographie: string | null;
  photo: string | null;
  ordre: number;
};

export type Client = {
  id: number;
  nom: string;
  prenom: string;
  email: string | null;
  telephone: string;
  adresse: string | null;
  dateInscription: string;
};

export type Commande = {
  id: number;
  reference: string;
  idClient: number;
  client?: Client;
  dateCommande: string;
  statut: string;
  montantTotal: number;
  modePaiement: string;
  acompte: number;
  notes: string | null;
  dateRetrait: string | null;
  lignes?: LigneCommande[];
  created_at: string;
};

export type LigneCommande = {
  idCommande: number;
  idProduit: number;
  quantite: number;
  prixUnitaire: number;
  surMesure: boolean;
  taille: string | null;
  couleur: string | null;
  produit?: Produit;
};

export type Mesure = {
  id: number;
  idClient: number;
  tourPoitrine: number | null;
  tourTaille: number | null;
  tourHanches: number | null;
  longueurRobe: number | null;
  longueurManche: number | null;
  longueurEpaule: number | null;
  tourBras: number | null;
  notes: string | null;
  created_at: string;
};

export type RendezVous = {
  id: number;
  idClient: number | null;
  nom: string;
  telephone: string;
  email: string | null;
  dateRdv: string;
  type: string;
  statut: string;
  notes: string | null;
  created_at: string;
};

export type Avis = {
  id: number;
  idCommande: number | null;
  note: number;
  commentaire: string;
  nomAuteur: string;
  dateAvis: string;
  approuve: boolean;
};

export type Contenu = {
  id: number;
  cle: string;
  valeur: string;
};

export const STATUT_LABELS: Record<string, string> = {
  en_attente: "En attente",
  en_confection: "En confection",
  expediee: "Expédiée",
  livree: "Livrée",
  annulee: "Annulée",
};

export const STATUT_COLORS: Record<string, string> = {
  en_attente: "bg-amber-100 text-amber-800 border-amber-300",
  en_confection: "bg-sky-100 text-sky-800 border-sky-300",
  expediee: "bg-violet-100 text-violet-800 border-violet-300",
  livree: "bg-emerald-100 text-emerald-800 border-emerald-300",
  annulee: "bg-rose-100 text-rose-800 border-rose-300",
};
