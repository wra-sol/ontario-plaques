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
  [key: string]: any;
}

const dataPath = path.join(process.cwd(), 'public/data/ontario_plaques.json');
const data: Plaque[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

console.log(`Starting with ${data.length} plaques`);

// Strategy:
// 1. Remove exact duplicate IDs (keep first occurrence)
// 2. For plaques with null/missing data, keep only if they have unique information
// 3. For same location duplicates, keep all (they're different plaques at same spot)

const seenIds = new Set<string>();
const uniquePlaques: Plaque[] = [];
const removedDuplicates: Plaque[] = [];

data.forEach(plaque => {
  if (seenIds.has(plaque.id)) {
    console.log(`Removing duplicate ID: ${plaque.id} - ${plaque.title}`);
    removedDuplicates.push(plaque);
  } else {
    seenIds.add(plaque.id);
    uniquePlaques.push(plaque);
  }
});

console.log(`\nRemoved ${removedDuplicates.length} exact duplicate IDs`);
console.log(`Remaining: ${uniquePlaques.length} plaques`);

// Check for plaques with null/missing critical data
const incompletePlaques = uniquePlaques.filter(p => 
  !p.title || !p.plaque_text || !p.location_text
);

console.log(`\n⚠️  Found ${incompletePlaques.length} plaques with missing critical data:`);
incompletePlaques.forEach(p => {
  console.log(`  - ${p.id}: title=${!!p.title}, text=${!!p.plaque_text}, location=${!!p.location_text}`);
});

// Save the cleaned data
const outputPath = path.join(process.cwd(), 'public/data/ontario_plaques.json');
fs.writeFileSync(outputPath, JSON.stringify(uniquePlaques, null, 2));

console.log(`\n✅ Saved ${uniquePlaques.length} unique plaques to ${outputPath}`);

// Save removed duplicates for review
const removedPath = path.join(process.cwd(), 'scripts/removed-duplicates.json');
fs.writeFileSync(removedPath, JSON.stringify(removedDuplicates, null, 2));
console.log(`📋 Saved ${removedDuplicates.length} removed duplicates to ${removedPath}`);

