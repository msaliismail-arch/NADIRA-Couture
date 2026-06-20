import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Seeding NADIRA Couture database...");

  // ===== Admin =====
  const adminHash = await bcrypt.hash("Nadira@2024", 10);
  await db.administrateur.upsert({
    where: { email: "admin@nadira-couture.ma" },
    update: {},
    create: {
      nom: "Nadira Admin",
      email: "admin@nadira-couture.ma",
      motDePasseHash: adminHash,
      role: "super_admin",
    },
  });
  console.log("✓ Admin created (admin@nadira-couture.ma / Nadira@2024)");

  // ===== Catégories =====
  const categories = [
    { libelle: "Caftans", slug: "caftans", ordre: 1 },
    { libelle: "Takchitas", slug: "takchitas", ordre: 2 },
    { libelle: "Djellabas", slug: "djellabas", ordre: 3 },
    { libelle: "Accessoires", slug: "accessoires", ordre: 4 },
  ];
  for (const c of categories) {
    await db.categorie.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }
  const catMap: Record<string, number> = {};
  const allCats = await db.categorie.findMany();
  allCats.forEach((c) => (catMap[c.slug] = c.id));

  // ===== Artisans =====
  const artisans = [
    { nom: "Fatima Zahra", specialite: "Broderie main", biographie: "Maître brodeuse depuis 32 ans, détentrice des points ancestraux de Fès et de la rbati.", photo: "", ordre: 1 },
    { nom: "Khadija El Amrani", specialite: "Coupe & assemblage", biographie: "Formée à l'École des Arts Traditionnels, Khadija sublime les caftans modernes.", photo: "", ordre: 2 },
    { nom: "Hajja Rachida", specialite: "Finitions & passementerie", biographie: "La main dorée de l'atelier — ses ourlets invisibles et ses boutons tissés sont légendaires.", photo: "", ordre: 3 },
    { nom: "Salma Benkirane", specialite: "Takchita & sfifa", biographie: "La jeune garde. Salma marie la sfifa traditionnelle aux coupes contemporaines.", photo: "", ordre: 4 },
  ];
  const artisanIds: number[] = [];
  for (const a of artisans) {
    const created = await db.artisan.upsert({
      where: { id: a.ordre },
      update: {},
      create: a,
    });
    artisanIds[a.ordre] = created.id;
  }
  console.log("✓ Artisans created");

  // ===== Produits =====
  const produits = [
    {
      nom: "Caftan Zellige Émeraude",
      slug: "caftan-zellige-emeraude",
      description:
        "Caftan long en velours émeraude, broderie main au fil d'or motif zellige. Pièce d'exception pour cérémonies et mariages. La sfifa dorée souligne l'ouverture centrale, tandis que les manches bellot s'ornent de passementerie traditionnelle.",
      idCategorie: catMap["caftans"],
      prix: 8900,
      tissu: "Velours",
      couleurs: "Émeraude, Bordeaux, Bleu nuit",
      delaiRealisation: 35,
      occasion: "Mariage, Cérémonie",
      vedette: true,
      stock: 3,
      photos: "/images/caftan-zellige.jpg,/images/caftan-zellige-2.jpg,/images/caftan-zellige-3.jpg",
      artisans: [1, 3],
    },
    {
      nom: "Takchita Royale Dorée",
      slug: "takchita-royale-doree",
      description:
        "Takchita deux pièces en satin broché, dtala dorée et tahtia en faille. Broderie aakad et pierres incrustées sur le plastron. La pièce maîtresse des grandes occasions.",
      idCategorie: catMap["takchitas"],
      prix: 14500,
      tissu: "Satin broché",
      couleurs: "Or, Ivoire, Champagne",
      delaiRealisation: 45,
      occasion: "Mariage, Soirée",
      vedette: true,
      stock: 2,
      photos: "/images/takchita-royale.jpg,/images/takchita-royale-2.jpg,/images/takchita-royale-3.jpg",
      artisans: [2, 4],
    },
    {
      nom: "Djellaba Brodée Fès",
      slug: "djellaba-brodee-fes",
      description:
        "Djellaba en lin écru, broderie Fès au point de chaînette sur capuche et poignets. Élégance discrète du quotidien, façonnée à la main dans la pure tradition.",
      idCategorie: catMap["djellabas"],
      prix: 3200,
      tissu: "Lin",
      couleurs: "Écru, Sable, Terracotta",
      delaiRealisation: 21,
      occasion: "Quotidien, Cérémonie",
      vedette: true,
      stock: 8,
      photos: "/images/djellaba-fes.jpg,/images/djellaba-fes-2.jpg",
      artisans: [1],
    },
    {
      nom: "Caftan Andalou Brodé",
      slug: "caftan-andalou-brode",
      description:
        "Caftan en crêpe vert profond, broderie andalouse au fil soie. Manches amples, ceinture Mdamma dorée. L'âme de l'Andalousie marocaine.",
      idCategorie: catMap["caftans"],
      prix: 7600,
      tissu: "Crêpe",
      couleurs: "Vert, Rose poudré, Ivoire",
      delaiRealisation: 30,
      occasion: "Cérémonie, Soirée",
      vedette: true,
      stock: 4,
      photos: "/images/caftan-andalou.jpg,/images/caftan-andalou-2.jpg",
      artisans: [2, 4],
    },
    {
      nom: "Caftan Velours Bordeaux",
      slug: "caftan-velours-bordeaux",
      description:
        "Caftan en velours bordeaux, broderie aux motifs floraux, boutons tissés aakad. Une pièce chaleureuse pour les soirées d'hiver.",
      idCategorie: catMap["caftans"],
      prix: 8200,
      tissu: "Velours",
      couleurs: "Bordeaux, Noir, Vert sapin",
      delaiRealisation: 32,
      occasion: "Soirée, Cérémonie",
      vedette: false,
      stock: 3,
      photos: "/images/caftan-bordeaux.jpg,/images/caftan-bordeaux-2.jpg",
      artisans: [1, 3],
    },
    {
      nom: "Takchita Nacre & Argent",
      slug: "takchita-nacre-argent",
      description:
        "Takchita en mousseline nacre, broderie perlée et fil d'argent. Légèreté et raffinement pour les mariées modernes.",
      idCategorie: catMap["takchitas"],
      prix: 12800,
      tissu: "Mousseline",
      couleurs: "Nacre, Argent, Blush",
      delaiRealisation: 40,
      occasion: "Mariage",
      vedette: false,
      stock: 2,
      photos: "/images/takchita-nacre.jpg,/images/takchita-nacre-2.jpg",
      artisans: [4, 2],
    },
    {
      nom: "Djellaba Capuche Brodée",
      slug: "djellaba-capuche-brodee",
      description:
        "Djellaba en crêpe émeraude, capuche brodée de motifs géométriques khatim. Coupe contemporaine, savoir-faire ancestral.",
      idCategorie: catMap["djellabas"],
      prix: 2800,
      tissu: "Crêpe",
      couleurs: "Émeraude, Bleu, Anthracite",
      delaiRealisation: 18,
      occasion: "Quotidien",
      vedette: false,
      stock: 10,
      photos: "/images/djellaba-capuche.jpg,/images/djellaba-capuche-2.jpg",
      artisans: [4],
    },
    {
      nom: "Bouton Aakad Doré (Lot)",
      slug: "boutons-aakad-dore",
      description:
        "Lot de 12 boutons tissés main au fil d'or, technique aakad. Finitions d'exception pour caftans et takchitas.",
      idCategorie: catMap["accessoires"],
      prix: 650,
      tissu: "Fil d'or",
      couleurs: "Or, Argent",
      delaiRealisation: 7,
      occasion: "Accessoire",
      vedette: false,
      stock: 25,
      photos: "/images/boutons-aakad.jpg",
      artisans: [3],
    },
    {
      nom: "Ceinture Mdamma Dorée",
      slug: "ceinture-mdamma-doree",
      description:
        "Ceinture traditionnelle mdamma en métal doré ciselé, motif khatim. La signature de la maison sur chaque caftan.",
      idCategorie: catMap["accessoires"],
      prix: 1800,
      tissu: "Métal ciselé",
      couleurs: "Or",
      delaiRealisation: 10,
      occasion: "Accessoire",
      vedette: false,
      stock: 12,
      photos: "/images/ceinture-mdamma.jpg",
      artisans: [3],
    },
    {
      nom: "Caftan Soie Ivoire Royal",
      slug: "caftan-soie-ivoire-royal",
      description:
        "Caftan en soie naturelle ivoire, broderie au fil d'or motif khatim et entrelacs. La pureté de la soie sublimée par l'or.",
      idCategorie: catMap["caftans"],
      prix: 9800,
      tissu: "Soie naturelle",
      couleurs: "Ivoire, Champagne",
      delaiRealisation: 38,
      occasion: "Mariage, Cérémonie",
      vedette: false,
      stock: 2,
      photos: "/images/caftan-soie-ivoire.jpg,/images/caftan-soie-ivoire-2.jpg",
      artisans: [1, 2],
    },
  ];
  for (const p of produits) {
    const { artisans: aIds, ...data } = p;
    const existing = await db.produit.findUnique({ where: { slug: data.slug } });
    if (existing) {
      await db.produit.update({ where: { id: existing.id }, data });
      if (aIds && aIds.length) {
        await db.produitArtisan.deleteMany({ where: { idProduit: existing.id } });
        for (const aid of aIds) {
          if (artisanIds[aid]) {
            await db.produitArtisan.create({ data: { idProduit: existing.id, idArtisan: artisanIds[aid] } });
          }
        }
      }
    } else {
      const created = await db.produit.create({ data });
      if (aIds && aIds.length) {
        for (const aid of aIds) {
          if (artisanIds[aid]) {
            await db.produitArtisan.create({ data: { idProduit: created.id, idArtisan: artisanIds[aid] } });
          }
        }
      }
    }
  }
  console.log("✓ Produits created");

  // ===== Contenu éditorial =====
  const contenus = [
    { cle: "histoire_texte", valeur: "Née à Fès au cœur de la médina, la maison NADIRA perpétue depuis trois générations l'art ancestral de la couture marocaine. Chaque pièce est une conversation entre la brodeuse et le tissu, entre le geste transmis et l'inspiration du moment. Nos caftans et takchitas ne sont pas des vêtements : ce sont des héritages que l'on porte." },
    { cle: "histoire_accroche", valeur: "Trois générations de mains qui brodent l'âme du Maroc." },
    { cle: "hero_accroche", valeur: "L'art de la couture marocaine, façonné pour vous." },
    { cle: "atelier_texte", valeur: "Dans notre atelier de Fès, douze artisans perpétuent chaque jour des gestes vieux de plusieurs siècles. Le point de Fès, la sfifa, l'aakad, le rabat — autant de techniques que nous préservons et transmettons aux jeunes générations. La broderie main reste notre signature : un caftan peut demander jusqu'à 200 heures de travail." },
    { cle: "contact_adresse", valeur: "Quartier Salam, Agadir" },
    { cle: "contact_maps", valeur: "https://maps.apple/p/osTsur6u9BnDAr" },
    { cle: "contact_email", valeur: "couture.nadira2026@gmail.com" },
    { cle: "contact_horaires", valeur: "Tous les jours, toute l'année · 10h00–23h00" },
    { cle: "citation_1", valeur: "« Le fil d'or ne ment pas : il garde la mémoire des mains qui l'ont tiré. »" },
    { cle: "citation_2", valeur: "« Un caftan n'est jamais terminé. Il s'endort et se réveille avec celle qui le porte. »" },
    { cle: "reseaux_instagram", valeur: "https://www.instagram.com/couture_nadira?igsh=bjZneDIzMGVudHBn" },
  ];
  for (const c of contenus) {
    await db.contenu.upsert({
      where: { cle: c.cle },
      update: { valeur: c.valeur },
      create: c,
    });
  }
  console.log("✓ Contenu éditorial créé");

  // ===== Galerie photos (seed) =====
  const galeriePhotos = [
    { url: "/images/atelier-heritage.jpg", legende: "Notre atelier", categorie: "atelier" },
    { url: "/images/artisan-1.jpg", legende: "Broderie main", categorie: "coulisses" },
    { url: "/images/artisan-2.jpg", legende: "Coupe du velours", categorie: "coulisses" },
    { url: "/images/artisan-3.jpg", legende: "Sfifa dorée", categorie: "coulisses" },
    { url: "/images/hero-atelier.jpg", legende: "L'art de la broderie", categorie: "atelier" },
  ];
  for (const g of galeriePhotos) {
    const existing = await db.galerie.findFirst({ where: { url: g.url } });
    if (!existing) {
      await db.galerie.create({ data: g });
    }
  }
  console.log("✓ Galerie créée");

  // ===== Avis clients =====
  const avis = [
    { note: 5, commentaire: "Un caftan d'une beauté à couper le souffle. La broderie est d'une finesse incroyable, on sent le travail d'artiste. Nadira a su comprendre exactement ce que je souhaitais.", nomAuteur: "Leïla M." },
    { note: 5, commentaire: "Ma takchita de mariage a fait l'unanimité. Le sur-mesure était parfait, les mesures prises avec soin. Une maison qui respecte ses clients et son savoir-faire.", nomAuteur: "Sara B." },
    { note: 5, commentaire: "J'ai commandé une djellaba brodée Fès. La qualité du lin et de la broderie dépasse tout ce que j'ai vu. Service irréprochable, livraison soignée.", nomAuteur: "Yasmine T." },
    { note: 5, commentaire: "L'accueil à l'atelier est chaleureux, on se sent en famille. Les artisans sont passionnés et ça se voit dans chaque couture. Je recommande les yeux fermés.", nomAuteur: "Nadia E." },
    { note: 5, commentaire: "Trois générations de savoir-faire, et ça se ressent. Ma pièce est un héritage que je transmettrai à ma fille. Merci Nadira.", nomAuteur: "Fatima R." },
  ];
  for (const a of avis) {
    await db.avis.upsert({
      where: { id: avis.indexOf(a) + 1 },
      update: {},
      create: { ...a, approuve: true },
    });
  }
  console.log("✓ Avis clients créés");

  console.log("\n✅ Seed terminé !");
  console.log("   Admin: admin@nadira-couture.ma / Nadira@2024");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
