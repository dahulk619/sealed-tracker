export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

// Connect securely to your Supabase project using the keys we will link in Vercel
const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    // 1. Fetch every sealed product link stored in your database
    const { data: products, error } = await supabase.from('sealed_inventory').select('*');
    if (error) throw error;

    // 2. Loop through every item you have added
    for (const product of products) {
      console.log(`Checking live market price for: ${product.product_name}`);

      // 3. Fetch the raw HTML webpage from your TCGplayer URL link
      const response = await fetch(product.tcgplayer_url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
        }
      });
      const html = await response.text();
      
      // 4. Use Cheerio to parse through the website layout text
      const $ = cheerio.load(html);

      // Locate the element box on TCGplayer that houses the market price numbers
      const marketPriceText = $('.price-point__price').first().text().replace('$', '').trim();
      const livePrice = parseFloat(marketPriceText);

      // 5. If a valid price number was successfully scraped, overwrite your database row
      if (!isNaN(livePrice)) {
        await supabase
          .from('sealed_inventory')
          .update({ current_market_price: livePrice, last_updated: new Date() })
          .eq('id', product.id);
          
        console.log(`Successfully updated database! New Price: $${livePrice}`);
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'Prices refreshed!' }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
