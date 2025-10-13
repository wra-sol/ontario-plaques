/**
 * Script to identify which Heritage Trust plaques are missing from our dataset
 * 
 * Usage: bun run scripts/find-missing-plaques.ts
 */

import * as cheerio from 'cheerio';

interface HeritageTraustPlaque {
  title: string;
  snippet: string;
  url?: string;
}

interface LocalPlaque {
  id: string;
  title: string;
  municipality?: string;
  location_text?: string;
}

async function fetchHeritageTraustPlaques(): Promise<HeritageTraustPlaque[]> {
  const plaques: HeritageTraustPlaque[] = [];
  let page = 1;
  const maxPages = 50; // ~1200 plaques / 25 per page
  
  console.log('🔍 Fetching plaques from Heritage Trust...\n');
  
  while (page <= maxPages) {
    try {
      // The official site uses a form, but we can access results via query params
      const url = `https://www.heritagetrust.on.ca/online-plaque-guide?handle=plaques-form&fields%5Bkeyword%5D=&fields%5Btheme%5D=&page=${page}`;
      
      console.log(`   Fetching page ${page}...`);
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`   ⚠️  Failed to fetch page ${page}: ${response.status}`);
        break;
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Find all plaque results - Heritage Trust uses list items
      const results = $('ul li, .view-content > div, .views-row').toArray();
      
      // If no results found, try different selectors
      if (results.length === 0) {
        // Look for any content blocks that might contain plaques
        const pageText = $('body').text();
        
        // Check if we've reached the end
        if (pageText.includes('0 plaques found') || pageText.includes('No results')) {
          console.log(`   ℹ️  No more results on page ${page}`);
          break;
        }
        
        // Try to extract plaque titles manually
        const strongTitles = $('strong, h2, h3, h4').filter((_, el) => {
          const text = $(el).text().trim();
          return text.length > 10 && text.length < 200;
        }).toArray();
        
        if (strongTitles.length > 0) {
          strongTitles.forEach(el => {
            const title = $(el).text().trim();
            const parent = $(el).parent();
            const snippet = parent.text().substring(0, 300);
            
            plaques.push({ title, snippet });
          });
        } else {
          console.log(`   ⚠️  Could not parse results on page ${page}`);
          break;
        }
      } else {
        results.forEach(result => {
          const $result = $(result);
          const title = $result.find('h2, h3, h4, strong').first().text().trim() || 
                       $result.find('a').first().text().trim();
          const snippet = $result.text().substring(0, 300).trim();
          const link = $result.find('a').first().attr('href');
          
          if (title && title.length > 3) {
            plaques.push({ 
              title, 
              snippet,
              url: link ? `https://www.heritagetrust.on.ca${link}` : undefined
            });
          }
        });
      }
      
      // Check for next page button
      const hasNext = $('.next-page, .pagination-next, [rel="next"]').length > 0 ||
                     $('a').filter((_, el) => $(el).text().includes('Next')).length > 0;
      
      if (!hasNext && page > 1) {
        console.log(`   ℹ️  No more pages found after page ${page}`);
        break;
      }
      
      page++;
      
      // Be nice to their server
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
    .replace(/^the\s+/i, '');
}

function findMatches(heritagePlaque: HeritageTraustPlaque, localPlaques: LocalPlaque[]): LocalPlaque[] {
  const normalizedTitle = normalizeTitle(heritagePlaque.title);
  
  if (!normalizedTitle) return [];
  
  return localPlaques.filter(local => {
    const localNormalized = normalizeTitle(local.title);
    
    if (!localNormalized) return false;
    
    // Exact match
    if (localNormalized === normalizedTitle) return true;
    
    // Contains match (one way or the other)
    if (localNormalized.includes(normalizedTitle) || normalizedTitle.includes(localNormalized)) {
      return true;
    }
    
    // Fuzzy match - check if 70% of words match
    const heritageWords = normalizedTitle.split(' ').filter(w => w.length > 2);
    const localWords = localNormalized.split(' ').filter(w => w.length > 2);
    
    const matchingWords = heritageWords.filter(w => localWords.includes(w));
    const similarity = matchingWords.length / Math.max(heritageWords.length, localWords.length);
    
    return similarity > 0.7;
  });
}

async function main() {
  console.log('🏛️  Heritage Trust Plaque Comparison Tool\n');
  console.log('='.repeat(60) + '\n');
  
  // Load both datasets
  const [heritagePlaques, localPlaques] = await Promise.all([
    fetchHeritageTraustPlaques(),
    loadLocalPlaques()
  ]);
  
  if (heritagePlaques.length === 0) {
    console.error('❌ No Heritage Trust plaques found. Scraping may have failed.');
    console.log('\n💡 The Heritage Trust website may have changed its structure.');
    console.log('   Try manually checking: https://www.heritagetrust.on.ca/online-plaque-guide\n');
    process.exit(1);
  }
  
  console.log('🔍 Analyzing matches...\n');
  
  const missing: HeritageTraustPlaque[] = [];
  const found: Array<{ heritage: HeritageTraustPlaque; local: LocalPlaque }> = [];
  
  for (const hPlaque of heritagePlaques) {
    const matches = findMatches(hPlaque, localPlaques);
    
    if (matches.length === 0) {
      missing.push(hPlaque);
    } else {
      found.push({ heritage: hPlaque, local: matches[0] });
    }
  }
  
  // Results
  console.log('📊 RESULTS');
  console.log('='.repeat(60));
  console.log(`Heritage Trust plaques: ${heritagePlaques.length}`);
  console.log(`Local dataset plaques:  ${localPlaques.length}`);
  console.log(`Matched plaques:        ${found.length}`);
  console.log(`Missing plaques:        ${missing.length}`);
  console.log('='.repeat(60) + '\n');
  
  if (missing.length > 0) {
    console.log('❌ MISSING PLAQUES FROM HERITAGE TRUST:\n');
    
    missing.slice(0, 50).forEach((plaque, idx) => {
      console.log(`${idx + 1}. ${plaque.title}`);
      console.log(`   Snippet: ${plaque.snippet.substring(0, 100)}...`);
      if (plaque.url) {
        console.log(`   URL: ${plaque.url}`);
      }
      console.log();
    });
    
    if (missing.length > 50) {
      console.log(`... and ${missing.length - 50} more\n`);
    }
    
    // Save to file
    await Bun.write(
      './scripts/missing-plaques.json',
      JSON.stringify(missing, null, 2)
    );
    console.log('💾 Full list saved to: scripts/missing-plaques.json\n');
  } else {
    console.log('✅ All Heritage Trust plaques are present in your dataset!\n');
  }
  
  // Save matched pairs for verification
  await Bun.write(
    './scripts/matched-plaques.json',
    JSON.stringify(found.slice(0, 100), null, 2)
  );
  console.log('💾 Sample matched pairs saved to: scripts/matched-plaques.json\n');
  
  console.log('✨ Analysis complete!\n');
}

main().catch(console.error);

