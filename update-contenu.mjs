/**
 * NADIRA Couture — Mise à jour ciblée du contenu éditorial.
 *
 * Met à jour UNIQUEMENT les clés ci-dessous (adresse, carte, réseaux sociaux).
 * Contrairement à `prisma/seed.ts`, ce script ne touche pas aux produits,
 * catégories, artisans, commandes ni à la galerie.
 *
 * Usage :  node update-contenu.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ADRESSE = '26 Rue Iligh, Agadir 80000';
const MAPS =
  'https://www.google.com/maps/search/?api=1&query=' +
  encodeURIComponent(`${ADRESSE}, Maroc`);

/**
 * Clés à écrire en base.
 * - `force: true`  → la valeur est toujours écrasée.
 * - `force: false` → la clé est seulement créée si elle n'existe pas encore
 *                    (on ne détruit pas ce que vous avez déjà saisi en admin).
 */
const CONTENUS = [
  { cle: 'contact_adresse', valeur: ADRESSE, force: true },
  { cle: 'contact_maps', valeur: MAPS, force: true },
  { cle: 'reseaux_instagram', valeur: '', force: false },
  { cle: 'reseaux_tiktok', valeur: '', force: false },
  { cle: 'reseaux_facebook', valeur: '', force: false },
  { cle: 'reseaux_whatsapp', valeur: '', force: false },
];

async function main() {
  for (const c of CONTENUS) {
    const existant = await prisma.contenu.findUnique({ where: { cle: c.cle } });

    if (!existant) {
      await prisma.contenu.create({
        data: { cle: c.cle, valeur: c.valeur },
      });
      console.log(`+ créé    ${c.cle} = ${c.valeur || '(vide)'}`);
      continue;
    }

    if (c.force && existant.valeur !== c.valeur) {
      await prisma.contenu.update({
        where: { cle: c.cle },
        data: { valeur: c.valeur },
      });
      console.log(`~ mis à jour ${c.cle} = ${c.valeur}`);
      continue;
    }

    console.log(`= inchangé  ${c.cle}`);
  }

  console.log('\nTerminé. Ouvrez Admin -> Contenu -> Réseaux sociaux pour saisir vos liens.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
