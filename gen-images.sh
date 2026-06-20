#!/bin/bash
cd /home/z/my-project
IMG_DIR="public/images"
mkdir -p "$IMG_DIR"

gen() {
  local prompt="$1"
  local out="$2"
  local size="${3:-864x1152}"
  if [ -f "$IMG_DIR/$out" ]; then
    echo "SKIP $out (exists)"
    return
  fi
  echo "GEN $out ..."
  z-ai image -p "$prompt" -o "$IMG_DIR/$out" -s "$size" 2>&1 | tail -1
}

gen "Luxurious Moroccan haute couture atelier, close-up of artisan hands embroidering gold thread on deep emerald velvet caftan, warm golden light, silk threads spool, traditional Moroccan zellige tiles in soft background, cinematic, elegant, shallow depth of field, editorial fashion photography, no text" "hero-atelier.jpg" "1344x768"

gen "Elegant Moroccan caftan on mannequin, deep emerald velvet with intricate gold zellige embroidery, sfifa gold trim, belted, luxury boutique background, soft warm lighting, full length, editorial fashion photography, no text, no face" "caftan-zellige.jpg" "864x1152"
gen "Close up detail of gold zellige embroidery on emerald velvet caftan, hand-stitched, Moroccan patterns, warm light, no text" "caftan-zellige-2.jpg" "864x1152"
gen "Moroccan caftan back view, emerald velvet with gold embroidery detail, elegant drape, studio, no text" "caftan-zellige-3.jpg" "864x1152"

gen "Luxurious Moroccan takchita two-piece, gold brocade satin, pearl and bead embroidery on bodice, royal wedding dress, champagne and gold, elegant boutique, soft lighting, full length, editorial, no text, no face" "takchita-royale.jpg" "864x1152"
gen "Close up of gold bead and pearl embroidery on takchita bodice, Moroccan aakad technique, intricate, warm light, no text" "takchita-royale-2.jpg" "864x1152"
gen "Takchita gold satin drape detail, luxurious fabric folds, soft light, no text" "takchita-royale-3.jpg" "864x1152"

gen "Elegant Moroccan djellaba in natural ecru linen, traditional Fes embroidery chain-stitch on hood and cuffs, minimalist, warm natural light, full length, editorial, no text, no face" "djellaba-fes.jpg" "864x1152"
gen "Close up of white Fes embroidery on ecru linen djellaba, delicate chain stitch floral pattern, no text" "djellaba-fes-2.jpg" "864x1152"

gen "Moroccan caftan in deep green crepe, Andalusian style silk thread embroidery, flowing sleeves, gold mdamma belt, elegant, studio lighting, full length, editorial, no text, no face" "caftan-andalou.jpg" "864x1152"
gen "Detail of Andalusian silk thread embroidery on green crepe, floral motifs, warm light, no text" "caftan-andalou-2.jpg" "864x1152"

gen "Moroccan velvet bordeaux caftan with gold floral embroidery, warm winter evening gown, elegant, studio, full length, editorial, no text, no face" "caftan-bordeaux.jpg" "864x1152"
gen "Bordeaux velvet with gold floral embroidery close up, hand stitched, no text" "caftan-bordeaux-2.jpg" "864x1152"

gen "Moroccan takchita in pearlescent mousseline, silver thread and bead embroidery, modern bridal, ethereal, soft light, full length, editorial, no text, no face" "takchita-nacre.jpg" "864x1152"
gen "Silver bead and pearl embroidery detail on nacre mousseline, delicate, no text" "takchita-nacre-2.jpg" "864x1152"

gen "Modern Moroccan djellaba in emerald crepe, hood with geometric khatim embroidery, contemporary cut, studio, full length, editorial, no text, no face" "djellaba-capuche.jpg" "864x1152"
gen "Geometric khatim star embroidery on emerald crepe hood close up, gold thread, no text" "djellaba-capuche-2.jpg" "864x1152"

gen "Set of twelve hand-woven gold aakad buttons for Moroccan caftan, arranged on dark velvet, macro, warm light, no text" "boutons-aakad.jpg" "1024x1024"

gen "Traditional Moroccan mdamma gold belt, engraved metal with khatim motifs, on emerald velvet, macro, warm light, no text" "ceinture-mdamma.jpg" "1024x1024"

gen "Moroccan silk caftan in natural ivory, gold khatim star and interlace embroidery, purity and elegance, soft light, full length, editorial, no text, no face" "caftan-soie-ivoire.jpg" "864x1152"
gen "Ivory silk with gold khatim embroidery detail close up, hand stitched, no text" "caftan-soie-ivoire-2.jpg" "864x1152"

gen "Moroccan artisan woman embroidering gold thread on fabric by hand, focused, warm window light, traditional atelier, dignity, editorial documentary, no text" "artisan-1.jpg" "1152x864"
gen "Moroccan seamstress hands cutting emerald velvet fabric with scissors, atelier, golden light, macro, editorial, no text" "artisan-2.jpg" "1152x864"
gen "Old Moroccan atelier interior, spools of gold and colored thread, embroidery frames, vintage, warm light, heritage, no text" "atelier-heritage.jpg" "1344x768"
gen "Close up of skilled hands doing gold sfifa passementerie on caftan, traditional Moroccan craft, warm light, no text" "artisan-3.jpg" "1152x864"

echo "DONE all images"
