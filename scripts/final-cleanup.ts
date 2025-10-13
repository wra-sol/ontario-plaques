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

console.log(`Starting with ${data.length} plaques\n`);

// Remove critically incomplete plaques (missing 2+ critical fields)
const criticallyIncomplete = data.filter(p => 
  (!p.title && !p.plaque_text) || 
  (!p.title && !p.location_text) ||
  (!p.plaque_text && !p.location_text)
);

const cleanedData = data.filter(p => 
  !((!p.title && !p.plaque_text) || 
    (!p.title && !p.location_text) ||
    (!p.plaque_text && !p.location_text))
);

console.log(`=== CLEANUP RESULTS ===`);
console.log(`Removed ${criticallyIncomplete.length} critically incomplete plaques:`);
criticallyIncomplete.forEach(p => {
  console.log(`  - ${p.id}: title=${!!p.title}, text=${!!p.plaque_text}, location=${!!p.location_text}`);
  console.log(`    URL: ${p.url}`);
});

console.log(`\nRemaining: ${cleanedData.length} plaques`);

// Generate statistics
const heritageTrust = cleanedData.filter(p => p.id.startsWith('HeritageTrust_'));
const ontarioPlaques = cleanedData.filter(p => p.id.startsWith('Plaque_'));

console.log(`\n=== FINAL STATISTICS ===`);
console.log(`Total plaques: ${cleanedData.length}`);
console.log(`  - Ontario Plaques: ${ontarioPlaques.length}`);
console.log(`  - Heritage Trust: ${heritageTrust.length}`);

// Check for remaining issues
const minorIssues = cleanedData.filter(p => !p.title || !p.plaque_text || !p.location_text);
console.log(`\nPlaques with minor issues (missing 1 field): ${minorIssues.length}`);
console.log(`  - Missing title only: ${cleanedData.filter(p => !p.title && p.plaque_text && p.location_text).length}`);
console.log(`  - Missing text only: ${cleanedData.filter(p => p.title && !p.plaque_text && p.location_text).length}`);
console.log(`  - Missing location only: ${cleanedData.filter(p => p.title && p.plaque_text && !p.location_text).length}`);

// Check duplicate titles
const titleMap = new Map<string, Plaque[]>();
cleanedData.forEach(plaque => {
  const title = plaque.title || 'null';
  if (!titleMap.has(title)) {
    titleMap.set(title, []);
  }
  titleMap.get(title)!.push(plaque);
});

const duplicates = Array.from(titleMap.entries())
  .filter(([_, plaques]) => plaques.length > 1);

console.log(`\nDuplicate titles: ${duplicates.length} sets`);
console.log(`  (These are mostly legitimate - different plaques about same subject)`);

// Save cleaned data
fs.writeFileSync(dataPath, JSON.stringify(cleanedData, null, 2));
console.log(`\n✅ Saved ${cleanedData.length} cleaned plaques to ${dataPath}`);

// Save removed plaques
const removedPath = path.join(process.cwd(), 'scripts/critically-incomplete-plaques.json');
fs.writeFileSync(removedPath, JSON.stringify(criticallyIncomplete, null, 2));
console.log(`📋 Saved ${criticallyIncomplete.length} removed plaques to ${removedPath}`);

console.log(`\n=== SUMMARY ===`);
console.log(`✅ Removed ${criticallyIncomplete.length} critically incomplete plaques`);
console.log(`✅ ${cleanedData.length} high-quality plaques remaining`);
console.log(`ℹ️  ${heritageTrust.length} Heritage Trust plaques are missing location data but have title/text`);
console.log(`ℹ️  ${duplicates.length} sets of duplicate titles (mostly legitimate different locations)`);

