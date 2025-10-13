/**
 * Compare Heritage Trust official plaques with our dataset
 * 
 * Usage: bun run scripts/compare-heritage-plaques.ts
 */

import * as cheerio from 'cheerio';

interface HeritageTraustPlaque {
  title: string;
  description: string;
  url: string;
}

interface LocalPlaque {
  id: string;
  title: string;
  plaque_text?: string;
  location_text?: string;
}

async function fetchHeritageTraustPlaques(): Promise<HeritageTraustPlaque[]> {
  const plaques: HeritageTraustPlaque[] = [];
  let page = 1;
  const maxPages = 50; // Should be enough for 1162 plaques
  
  console.log('🔍 Fetching plaques from Heritage Trust...\n');
  
  while (page <= maxPages) {
    try {
      const url = page === 1 
        ? 'https://www.heritagetrust.on.ca/online-plaque-guide?handle=plaques-form&fields%5Bkeyword%5D=&fields%5Btheme%5D='
        : `https://www.heritagetrust.on.ca/online-plaque-guide/p${page}?handle=plaques-form&fields%5Bkeyword%5D=&fields%5Btheme%5D=`;
      
      console.log(`   Fetching page ${page}...`);
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`   ⚠️  Failed to fetch page ${page}: ${response.status}`);
        break;
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Find the main list of plaques
      const listItems = $('ul > li');
      let foundOnThisPage = 0;
      
      listItems.each((_, li) => {
        const $li = $(li);
        const $link = $li.find('a strong').parent();
        const title = $li.find('strong').text().trim();
        const url = $link.attr('href');
        
        // Get description text (after the <br/>)
        const $p = $li.find('p');
        const fullText = $p.text();
        const description = fullText.replace(title, '').trim();
        
        if (title && url) {
          plaques.push({
            title,
            description,
            url: url.startsWith('http') ? url : `https://www.heritagetrust.on.ca${url}`
          });
          foundOnThisPage++;
        }
      });
      
      console.log(`   Found ${foundOnThisPage} plaques on page ${page}`);
      
      if (foundOnThisPage === 0) {
        console.log(`   No plaques found, assuming end of results`);
        break;
      }
      
      // Be nice to their server
      await new Promise(resolve => setTimeout(resolve, 800));
      page++;
      
    } catch (error) {
      console.error(`   ❌ Error fetching page ${page}:`, error);
      break;
    }
  }
  
  console.log(`\n✅ Fetched ${plaques.length} plaques from Heritage Trust\n`);
  return plaques;
}

async function loadLocalPlaques(): Promise<LocalPlaque[]> {
  try {
    const data = await Bun.file('./public/data/ontario_plaques.json').json();
    console.log(`✅ Loaded ${data.length} plaques from local dataset\n`);
    return data;
  } catch (error) {
    console.error('❌ Failed to load local plaques:', error);
    return [];
  }
}

function normalizeTitle(title: string | null | undefined): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^the\s+/i, '')
    .replace(/\s+the$/i, '');
}

function findMatch(heritagePlaque: HeritageTraustPlaque, localPlaques: LocalPlaque[]): LocalPlaque | null {
  const normalizedTitle = normalizeTitle(heritagePlaque.title);
  
  if (!normalizedTitle) return null;
  
  // Try exact match first
  for (const local of localPlaques) {
    const localNormalized = normalizeTitle(local.title);
    if (localNormalized === normalizedTitle) {
      return local;
    }
  }
  
  // Try substring match
  for (const local of localPlaques) {
    const localNormalized = normalizeTitle(local.title);
    if (localNormalized.includes(normalizedTitle) || normalizedTitle.includes(localNormalized)) {
      if (Math.abs(localNormalized.length - normalizedTitle.length) < 10) {
        return local;
      }
    }
  }
  
  // Try fuzzy match
  for (const local of localPlaques) {
    const localNormalized = normalizeTitle(local.title);
    const heritageWords = normalizedTitle.split(' ').filter(w => w.length > 2);
    const localWords = localNormalized.split(' ').filter(w => w.length > 2);
    
    const matchingWords = heritageWords.filter(w => localWords.includes(w));
    const similarity = matchingWords.length / Math.max(heritageWords.length, localWords.length);
    
    if (similarity > 0.8 && heritageWords.length > 1) {
      return local;
    }
  }
  
  return null;
}

async function main() {
  console.log('🏛️  Heritage Trust vs Local Plaque Comparison\n');
  console.log('='.repeat(70) + '\n');
  
  // Load both datasets
  const [heritagePlaques, localPlaques] = await Promise.all([
    fetchHeritageTraustPlaques(),
    loadLocalPlaques()
  ]);
  
  if (heritagePlaques.length === 0) {
    console.error('❌ No Heritage Trust plaques found. Scraping may have failed.');
    process.exit(1);
  }
  
  console.log('🔍 Analyzing matches...\n');
  
  const missing: HeritageTraustPlaque[] = [];
  const found: Array<{ heritage: HeritageTraustPlaque; local: LocalPlaque }> = [];
  
  for (const hPlaque of heritagePlaques) {
    const match = findMatch(hPlaque, localPlaques);
    
    if (match) {
      found.push({ heritage: hPlaque, local: match });
    } else {
      missing.push(hPlaque);
    }
  }
  
  // Results
  console.log('📊 COMPARISON RESULTS');
  console.log('='.repeat(70));
  console.log(`Heritage Trust plaques:  ${heritagePlaques.length.toString().padStart(4)}`);
  console.log(`Local dataset plaques:   ${localPlaques.length.toString().padStart(4)}`);
  console.log(`Matched plaques:         ${found.length.toString().padStart(4)} (${Math.round(found.length / heritagePlaques.length * 100)}%)`);
  console.log(`Missing plaques:         ${missing.length.toString().padStart(4)} (${Math.round(missing.length / heritagePlaques.length * 100)}%)`);
  console.log('='.repeat(70) + '\n');
  
  if (missing.length > 0) {
    console.log(`❌ MISSING ${missing.length} HERITAGE TRUST PLAQUES:\n`);
    
    missing.slice(0, 30).forEach((plaque, idx) => {
      console.log(`${(idx + 1).toString().padStart(3)}. ${plaque.title}`);
      console.log(`     ${plaque.description.substring(0, 120)}...`);
      console.log(`     🔗 ${plaque.url}`);
      console.log();
    });
    
    if (missing.length > 30) {
      console.log(`... and ${missing.length - 30} more\n`);
    }
    
    // Save to file
    await Bun.write(
      './scripts/missing-heritage-plaques.json',
      JSON.stringify(missing, null, 2)
    );
    console.log('💾 Full list saved to: scripts/missing-heritage-plaques.json\n');
  } else {
    console.log('✅ All Heritage Trust plaques are present in your dataset!\n');
  }
  
  // Save matched pairs for verification
  await Bun.write(
    './scripts/matched-plaques.json',
    JSON.stringify(found.slice(0, 50).map(f => ({
      heritage_title: f.heritage.title,
      local_title: f.local.title,
      match: normalizeTitle(f.heritage.title) === normalizeTitle(f.local.title) ? 'exact' : 'fuzzy'
    })), null, 2)
  );
  console.log('💾 Sample matched pairs saved to: scripts/matched-plaques.json\n');
  
  console.log('✨ Analysis complete!\n');
}

main().catch(console.error);

