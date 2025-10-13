import fs from 'fs';
import path from 'path';

interface Plaque {
  id: string;
  url: string;
  title: string | null;
  location_text: string;
  plaque_text: string;
  latitude: number;
  longitude: number;
  coordinates_text: string;
}

const dataPath = path.join(process.cwd(), 'public/data/ontario_plaques.json');
const data: Plaque[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// Find duplicates by title
const titleMap = new Map<string, Plaque[]>();
data.forEach(plaque => {
  const title = plaque.title || 'null';
  if (!titleMap.has(title)) {
    titleMap.set(title, []);
  }
  titleMap.get(title)!.push(plaque);
});

const duplicates = Array.from(titleMap.entries())
  .filter(([_, plaques]) => plaques.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

console.log(`\n=== DUPLICATE ANALYSIS ===`);
console.log(`Total plaques: ${data.length}`);
console.log(`Duplicate titles: ${duplicates.length}`);
console.log(`Total duplicate plaques: ${duplicates.reduce((sum, [_, plaques]) => sum + plaques.length, 0)}`);

console.log(`\n=== DUPLICATES BY TITLE ===\n`);

duplicates.forEach(([title, plaques]) => {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TITLE: ${title}`);
  console.log(`Count: ${plaques.length} plaques`);
  console.log(`${'='.repeat(80)}`);
  
  plaques.forEach((plaque, index) => {
    console.log(`\n[${index + 1}] ID: ${plaque.id}`);
    console.log(`URL: ${plaque.url}`);
    console.log(`Location: ${plaque.location_text || 'N/A'}`);
    console.log(`Coordinates: ${plaque.coordinates_text || 'N/A'}`);
    console.log(`Plaque Text (first 200 chars):`);
    const text = plaque.plaque_text || 'N/A';
    console.log(`  ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
  });
  
  // Check if they're at the same location
  const locations = new Set(plaques.map(p => p.location_text));
  const coords = new Set(plaques.map(p => `${p.latitude},${p.longitude}`));
  
  console.log(`\n📍 Unique locations: ${locations.size}`);
  console.log(`📍 Unique coordinates: ${coords.size}`);
  
  if (locations.size === 1 && coords.size === 1) {
    console.log(`⚠️  SAME LOCATION - These are multiple plaques at the same spot`);
  } else if (locations.size > 1) {
    console.log(`ℹ️  DIFFERENT LOCATIONS - These are plaques about the same subject in different places`);
  }
});

// Check for near-identical plaque text
console.log(`\n\n${'='.repeat(80)}`);
console.log(`=== CHECKING FOR NEAR-IDENTICAL TEXT ===`);
console.log(`${'='.repeat(80)}\n`);

const textSimilarity = (text1: string, text2: string): number => {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
};

duplicates.forEach(([title, plaques]) => {
  if (plaques.length === 2) {
    const similarity = textSimilarity(plaques[0].plaque_text, plaques[1].plaque_text);
    if (similarity > 0.7) {
      console.log(`\n⚠️  HIGH SIMILARITY (${(similarity * 100).toFixed(1)}%): ${title}`);
      console.log(`   ${plaques[0].id} vs ${plaques[1].id}`);
      console.log(`   Location match: ${plaques[0].location_text === plaques[1].location_text ? 'YES' : 'NO'}`);
    }
  }
});

console.log(`\n\n=== SUMMARY ===`);
console.log(`You have ${duplicates.length} sets of duplicate titles.`);
console.log(`\nRecommendations:`);
console.log(`1. Keep duplicates that are at DIFFERENT locations (different perspectives on same subject)`);
console.log(`2. Review duplicates at SAME location - may want to merge or keep both if text is substantially different`);
console.log(`3. Consider adding a suffix to titles to distinguish them (e.g., "Title (Location A)", "Title (Location B)")`);

