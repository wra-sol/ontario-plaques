/**
 * Inspect the Heritage Trust website structure
 */

import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';

async function inspectSite() {
  const url = 'https://www.heritagetrust.on.ca/online-plaque-guide?handle=plaques-form&fields%5Bkeyword%5D=&fields%5Btheme%5D=';
  
  console.log('Fetching:', url, '\n');
  
  const response = await fetch(url);
  const html = await response.text();
  
  // Save raw HTML for inspection
  writeFileSync('./scripts/heritage-trust-page.html', html);
  console.log('✅ Saved raw HTML to: scripts/heritage-trust-page.html\n');
  
  const $ = cheerio.load(html);
  
  // Try to find plaque titles
  console.log('Looking for plaque titles...\n');
  
  // Try various selectors
  const selectors = [
    'h2', 'h3', 'h4',
    'strong',
    '.view-content li',
    '.views-row',
    'article h2',
    'article h3',
    '.plaque-title',
    '[class*="plaque"] h2',
    '[class*="plaque"] h3'
  ];
  
  for (const selector of selectors) {
    const elements = $(selector);
    if (elements.length > 0) {
      console.log(`\n${selector}: ${elements.length} matches`);
      elements.slice(0, 5).each((i, el) => {
        const text = $(el).text().trim().substring(0, 100);
        console.log(`  ${i + 1}. ${text}`);
      });
    }
  }
  
  // Look for "plaques found" text
  const bodyText = $('body').text();
  const match = bodyText.match(/(\d+)\s+plaques?\s+found/i);
  if (match) {
    console.log(`\n✅ Found text: "${match[0]}"`);
  }
  
  // Look for pagination
  console.log('\n\nLooking for pagination...');
  const paginationSelectors = [
    '.pager', '.pagination', '[class*="pager"]', '[class*="pagination"]',
    'a[rel="next"]', '.next', '.next-page'
  ];
  
  for (const selector of paginationSelectors) {
    const elements = $(selector);
    if (elements.length > 0) {
      console.log(`\n${selector}: ${elements.length} matches`);
      console.log('  HTML:', elements.first().html()?.substring(0, 200));
    }
  }
}

inspectSite().catch(console.error);

