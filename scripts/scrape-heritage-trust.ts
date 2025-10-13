/**
 * Scrape missing Heritage Trust plaques and add them to our dataset
 * 
 * Usage: bun run scripts/scrape-heritage-trust.ts
 */

import * as cheerio from 'cheerio';

interface HeritageTraustPlaque {
  title: string;
  description: string;
  url: string;
}

interface ScrapedPlaque {
  id: string;
  url: string;
  canonical_url: string;
  title: string;
  meta_description?: string;
  location_text?: string;
  location_hierarchy?: string[];
  coordinates_text?: string;
  latitude?: number;
  longitude?: number;
  plaque_text: string;
  related_links?: Array<{ title: string; url: string }>;
  subject_links?: Array<{ title: string; url: string }>;
  more_links?: Array<{ title: string; url: string }>;
  photos?: Array<{
    src: string;
    alt?: string;
    caption?: string;
  }>;
  source_directories?: string[];
  scraped_at: string;
}

async function scrapePlaquePage(url: string, title: string): Promise<ScrapedPlaque | null> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log(`     ⚠️  Failed to fetch: ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract plaque ID from URL
    const urlParts = url.split('/');
    const slug = urlParts[urlParts.length - 1];
    const id = `HeritageTrust_${slug}`;
    
    // Extract location information
    const locationText = $('.plaque-location, [class*="location"]').first().text().trim() ||
                        $('p:contains("Location:")').first().text().replace('Location:', '').trim() ||
                        $('.address').first().text().trim();
    
    // Extract plaque text - look for the main content
    let plaqueText = '';
    
    // Try various selectors for the plaque text
    const textSelectors = [
      '.plaque-text',
      '.plaque-content',
      '[class*="plaque-text"]',
      'article p',
      '.content p',
      'main p'
    ];
    
    for (const selector of textSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        // Get the longest paragraph as the plaque text
        let longest = '';
        elements.each((_, el) => {
          const text = $(el).text().trim();
          if (text.length > longest.length && text.length > 100) {
            longest = text;
          }
        });
        if (longest) {
          plaqueText = longest;
          break;
        }
      }
    }
    
    // If still no plaque text, try to extract from paragraphs
    if (!plaqueText) {
      const paragraphs = $('p').toArray();
      for (const p of paragraphs) {
        const text = $(p).text().trim();
        if (text.length > 100 && text.length < 3000) {
          plaqueText = text;
          break;
        }
      }
    }
    
    // Extract coordinates if present
    const coordsText = $('p:contains("Coordinates:"), span:contains("Coordinates:")').first().text();
    const coordsMatch = coordsText.match(/Coordinates:\s*N\s*([\d.]+)\s*W\s*([\d.]+)/i);
    
    let latitude: number | undefined;
    let longitude: number | undefined;
    let coordinatesText: string | undefined;
    
    if (coordsMatch) {
      latitude = parseFloat(coordsMatch[1]);
      longitude = -parseFloat(coordsMatch[2]); // West is negative
      coordinatesText = `N ${coordsMatch[1]} W ${coordsMatch[2]}`;
    }
    
    // Extract images
    const photos: Array<{ src: string; alt?: string; caption?: string }> = [];
    $('img').each((_, img) => {
      const src = $(img).attr('src');
      if (src && !src.includes('logo') && !src.includes('icon') && (src.includes('plaque') || src.includes('image'))) {
        const fullSrc = src.startsWith('http') ? src : `https://www.heritagetrust.on.ca${src}`;
        photos.push({
          src: fullSrc,
          alt: $(img).attr('alt') || title,
          caption: $(img).parent().find('figcaption, .caption').text().trim() || undefined
        });
      }
    });
    
    // Extract location hierarchy from breadcrumbs or location info
    const locationHierarchy: string[] = [];
    $('.breadcrumb a, .breadcrumbs a').each((_, a) => {
      const text = $(a).text().trim();
      if (text && text !== 'Home' && text !== 'Plaques') {
        locationHierarchy.push(text);
      }
    });
    
    // Extract related links
    const relatedLinks: Array<{ title: string; url: string }> = [];
    $('a[href*="/plaques/"]').each((_, a) => {
      const href = $(a).attr('href');
      const linkText = $(a).text().trim();
      if (href && linkText && href !== url && !href.includes('online-plaque-guide')) {
        const fullUrl = href.startsWith('http') ? href : `https://www.heritagetrust.on.ca${href}`;
        if (!relatedLinks.find(l => l.url === fullUrl)) {
          relatedLinks.push({
            title: linkText,
            url: fullUrl
          });
        }
      }
    });
    
    return {
      id,
      url,
      canonical_url: url,
      title,
      location_text: locationText || undefined,
      location_hierarchy: locationHierarchy.length > 0 ? locationHierarchy : undefined,
      coordinates_text: coordinatesText,
      latitude,
      longitude,
      plaque_text: plaqueText,
      related_links: relatedLinks.slice(0, 10).length > 0 ? relatedLinks.slice(0, 10) : undefined,
      photos: photos.length > 0 ? photos : undefined,
      scraped_at: new Date().toISOString(),
      source_directories: ['https://www.heritagetrust.on.ca/online-plaque-guide']
    };
    
  } catch (error) {
    console.log(`     ❌ Error scraping: ${error}`);
    return null;
  }
}

async function main() {
  console.log('🏛️  Heritage Trust Plaque Scraper\n');
  console.log('='.repeat(70) + '\n');
  
  // Load missing plaques list
  let missingPlaques: HeritageTraustPlaque[];
  try {
    missingPlaques = await Bun.file('./scripts/missing-heritage-plaques.json').json();
    console.log(`✅ Loaded ${missingPlaques.length} missing plaques to scrape\n`);
  } catch (error) {
    console.error('❌ Could not load missing-heritage-plaques.json');
    console.log('   Please run: bun run scripts/compare-heritage-plaques.ts first\n');
    process.exit(1);
  }
  
  // Load existing dataset
  let existingPlaques: any[];
  try {
    existingPlaques = await Bun.file('./public/data/ontario_plaques.json').json();
    console.log(`✅ Loaded ${existingPlaques.length} existing plaques\n`);
  } catch (error) {
    console.error('❌ Could not load existing dataset');
    process.exit(1);
  }
  
  console.log('🔍 Starting to scrape missing plaques...\n');
  console.log('   This will take a while (rate limited to be respectful)\n');
  
  const scrapedPlaques: ScrapedPlaque[] = [];
  const failed: Array<{ title: string; url: string; reason: string }> = [];
  
  for (let i = 0; i < missingPlaques.length; i++) {
    const missing = missingPlaques[i];
    const progress = `[${(i + 1).toString().padStart(3)}/${missingPlaques.length}]`;
    
    console.log(`${progress} ${missing.title}`);
    console.log(`     ${missing.url}`);
    
    const scraped = await scrapePlaquePage(missing.url, missing.title);
    
    if (scraped) {
      // Validate required fields
      if (!scraped.plaque_text || scraped.plaque_text.length < 50) {
        console.log(`     ⚠️  Missing plaque text, skipping`);
        failed.push({ title: missing.title, url: missing.url, reason: 'No plaque text found' });
      } else {
        scrapedPlaques.push(scraped);
        console.log(`     ✅ Scraped successfully`);
      }
    } else {
      failed.push({ title: missing.title, url: missing.url, reason: 'Failed to fetch' });
    }
    
    // Rate limiting - be respectful
    if (i < missingPlaques.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    }
    
    // Save progress every 50 plaques
    if ((i + 1) % 50 === 0) {
      console.log(`\n   💾 Saving progress... (${scrapedPlaques.length} scraped so far)\n`);
      const combined = [...existingPlaques, ...scrapedPlaques];
      await Bun.write(
        './public/data/ontario_plaques.json',
        JSON.stringify(combined, null, 2)
      );
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 SCRAPING RESULTS');
  console.log('='.repeat(70));
  console.log(`Total to scrape:        ${missingPlaques.length}`);
  console.log(`Successfully scraped:   ${scrapedPlaques.length}`);
  console.log(`Failed:                 ${failed.length}`);
  console.log('='.repeat(70) + '\n');
  
  if (scrapedPlaques.length > 0) {
    // Merge with existing dataset
    const combined = [...existingPlaques, ...scrapedPlaques];
    
    console.log('💾 Saving updated dataset...');
    await Bun.write(
      './public/data/ontario_plaques.json',
      JSON.stringify(combined, null, 2)
    );
    console.log(`✅ Saved ${combined.length} total plaques to ontario_plaques.json\n`);
    
    // Backup original
    await Bun.write(
      './public/data/ontario_plaques.backup.json',
      JSON.stringify(existingPlaques, null, 2)
    );
    console.log('💾 Backup saved to ontario_plaques.backup.json\n');
  }
  
  if (failed.length > 0) {
    console.log(`⚠️  ${failed.length} plaques failed to scrape:\n`);
    failed.slice(0, 20).forEach((f, i) => {
      console.log(`${(i + 1).toString().padStart(3)}. ${f.title}`);
      console.log(`     Reason: ${f.reason}`);
      console.log(`     URL: ${f.url}\n`);
    });
    
    await Bun.write(
      './scripts/failed-plaques.json',
      JSON.stringify(failed, null, 2)
    );
    console.log('💾 Full failure list saved to: scripts/failed-plaques.json\n');
  }
  
  console.log('✨ Scraping complete!\n');
  console.log(`📈 Dataset grew from ${existingPlaques.length} to ${existingPlaques.length + scrapedPlaques.length} plaques!\n`);
}

main().catch(console.error);

