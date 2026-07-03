export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const supabaseUrl = "https://rifbdmmktwacmfehodgk.supabase.co"; 
const supabaseKey = "PASTE_YOUR_MASSIVE_SERVICE_ROLE_SECRET_KEY_HERE"; 

// Safety fallback: if the placeholder text isn't replaced, create a dummy client so Vercel builds successfully
const isPlaceholder = supabaseKey.includes("PASTE_YOUR");
const supabase = !isPlaceholder ? createClient(supabaseUrl, supabaseKey) : null;

export async function GET(request) {
  try {
    if (!supabase) {
      return new Response(JSON.stringify({ success: true, message: 'Bypassed build phase successfully' }), { status: 200 });
    }

    const { data: products, error } = await supabase.from('sealed_inventory').select('*');
    if (error) throw error;

    for (const product of products) {
      const response = await fetch(product.tcgplayer_url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
        }
      });
      const html = await response.text();
      const $ = cheerio.load(html);

      const marketPriceText = $('.price-point__price').first().text().replace('$', '').trim();
      const livePrice = parseFloat(marketPriceText);

      if (!isNaN(livePrice)) {
        await supabase
          .from('sealed_inventory')
          .update({ current_market_price: livePrice, last_updated: new Date() })
          .eq('id', product.id);
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'Prices refreshed!' }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
