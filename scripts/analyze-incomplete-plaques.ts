import fs from 'fs';
import path from 'path';

interface Plaque {
  id: string;
  url: string;
  title: string | null;
  location_text: string | null;
  plaque_text: string | null;
  latitude: number | null;
  longitude: number | null;
  [key: string]: any;
}

const dataPath = path.join(process.cwd(), 'public/data/ontario_plaques.json');
const data: Plaque[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

console.log(`Total plaques: ${data.length}\n`);

// Categorize incomplete plaques
const missingTitle = data.filter(p => !p.title);
const missingText = data.filter(p => !p.plaque_text);
const missingLocation = data.filter(p => !p.location_text);
const missingCoords = data.filter(p => p.latitude === null || p.longitude === null);

console.log('=== MISSING DATA ANALYSIS ===\n');
console.log(`Missing title: ${missingTitle.length}`);
console.log(`Missing plaque text: ${missingText.length}`);
console.log(`Missing location text: ${missingLocation.length}`);
console.log(`Missing coordinates: ${missingCoords.length}`);

// Find plaques missing multiple critical fields
const criticallyIncomplete = data.filter(p => 
  (!p.title && !p.plaque_text) || 
  (!p.title && !p.location_text) ||
  (!p.plaque_text && !p.location_text)
);

console.log(`\nCritically incomplete (missing 2+ key fields): ${criticallyIncomplete.length}`);

// Check Heritage Trust plaques specifically
const heritageTrustPlaques = data.filter(p => p.id.startsWith('HeritageTrust_'));
const incompleteHeritageTrust = heritageTrustPlaques.filter(p => !p.location_text);

console.log(`\n=== HERITAGE TRUST PLAQUES ===`);
console.log(`Total Heritage Trust plaques: ${heritageTrustPlaques.length}`);
console.log(`Missing location: ${incompleteHeritageTrust.length}`);

// Check Ontario Plaques specifically
const ontarioPlaques = data.filter(p => p.id.startsWith('Plaque_'));
const incompleteOntarioPlaques = ontarioPlaques.filter(p => !p.title || !p.plaque_text || !p.location_text);

console.log(`\n=== ONTARIO PLAQUES ===`);
console.log(`Total Ontario Plaques: ${ontarioPlaques.length}`);
console.log(`Incomplete: ${incompleteOntarioPlaques.length}`);

if (incompleteOntarioPlaques.length > 0) {
  console.log(`\nIncomplete Ontario Plaques:`);
  incompleteOntarioPlaques.slice(0, 20).forEach(p => {
    console.log(`  ${p.id}: title=${!!p.title}, text=${!!p.plaque_text}, location=${!!p.location_text}`);
  });
}

// Recommendation
console.log(`\n=== RECOMMENDATIONS ===`);
console.log(`1. Keep all plaques with complete data (${data.length - criticallyIncomplete.length} plaques)`);
console.log(`2. Heritage Trust plaques missing location are still valuable - they have title and text`);
console.log(`3. Consider removing ${criticallyIncomplete.length} critically incomplete plaques`);
console.log(`4. The remaining ${missingTitle.length} plaques with null titles need investigation`);

// Show some examples of null title plaques
const nullTitleWithData = data.filter(p => !p.title && p.plaque_text);
console.log(`\n=== NULL TITLE EXAMPLES (with plaque text) ===`);
nullTitleWithData.slice(0, 3).forEach(p => {
  console.log(`\nID: ${p.id}`);
  console.log(`URL: ${p.url}`);
  console.log(`Text: ${(p.plaque_text || '').substring(0, 100)}...`);
});

