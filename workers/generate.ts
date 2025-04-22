// workers/generate.ts
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import fs from 'fs';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

async function main() {
  while (true) {
    const { data: docs } = await supabase.from('documents').select('*').eq('status', 'generating').limit(1);
    if (!docs || docs.length === 0) {
      await new Promise(r => setTimeout(r, 3000));
      continue;
    }
    const doc = docs[0];
    try {
      const { data: rawAttrs } = await supabase.from('raw_attributes').select('*').eq('document_id', doc.id);
      const { data: defs } = await supabase.from('attribute_definitions').select('*');
      const { data: groups } = await supabase.from('attribute_groups').select('*');
      const schema = JSON.parse(fs.readFileSync('docs/schemas/generate.schema.json', 'utf-8'));
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-1106-preview',
        messages: [{ role: 'system', content: 'Map the following raw attributes to product attributes.' },
                   { role: 'user', content: JSON.stringify({ rawAttrs, defs, groups }) }],
        functions: [{ name: 'createProducts', parameters: schema }],
        function_call: { name: 'createProducts' },
        temperature: 0.1,
      });
      const args = JSON.parse(completion.choices[0].message.function_call.arguments);
      for (const product of args.products) {
        await supabase.from('products').insert({
          id: product.id,
          name: product.name,
          model: product.model,
          manufacturer: product.manufacturer,
          attributes_json: product.attributes.reduce((o: any, a: any) => (o[a.attribute_id] = { value: a.value, unit: a.unit }, o), {})
        });
      }
      await supabase.from('documents').update({ status: 'completed', processed_at: new Date().toISOString() }).eq('id', doc.id);
    } catch (err: any) {
      await supabase.from('documents').update({ status: 'error', error_message: err.message }).eq('id', doc.id);
    }
  }
}

main();
