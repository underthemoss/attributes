import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import fs from 'fs';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function processExtractedDocuments() {
  const log = (...args: any[]) => console.log(new Date().toISOString(), '[ASSEMBLE]', ...args);
  log('Polling for documents with status=extracted...');
  const { data: docs, error: docError } = await supabase
    .from('documents')
    .select('id, storage_path, status')
    .eq('status', 'extracted')
    .limit(1);
  if (docError) return log('Error fetching documents:', docError);
  if (!docs || docs.length === 0) return log('No extracted documents found.');

  const doc = docs[0];
  log('Processing document', doc.id);

  // Load all raw_attributes for this document
  const { data: rawAttrs, error: rawError } = await supabase
    .from('raw_attributes')
    .select('attribute_internal_name, raw_value')
    .eq('document_id', doc.id);
  if (rawError) return log('Error fetching raw_attributes:', rawError);
  if (!rawAttrs || rawAttrs.length === 0) return log('No raw_attributes for document', doc.id);

  // Load full attribute library: definitions and groups
  const { data: defs, error: defsError } = await supabase.from('attribute_definitions').select('id, internal_name, synonyms, concept_ids');
  if (defsError) return log('Error fetching attribute_definitions:', defsError);
  const { data: groups, error: groupsError } = await supabase.from('attribute_groups').select('id, name');
  if (groupsError) return log('Error fetching attribute_groups:', groupsError);

  // Prepare OpenAI assembly call with full library
  const assemblySchema = JSON.parse(fs.readFileSync('docs/schemas/assembly.schema.json', 'utf-8'));
  const openaiRes = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You have raw_attributes and an attribute library.\n' +
        'definitions: ' + JSON.stringify(defs) + '\n' +
        'groups: ' + JSON.stringify(groups) + '\n' +
        'Map each raw_attribute.internal_name to an attribute_id using synonyms, include its concept_ids.\n' +
        'Return JSON matching the assembly schema, and include an attributes_json object keyed by internal_name with { value, unit, concept_ids }.' },
      { role: 'user', content: JSON.stringify({ rawAttributes: rawAttrs }) }
    ],
    functions: [{
      name: 'createProduct',
      description: 'Create a product record with attribute values',
      parameters: assemblySchema
    }],
    function_call: { name: 'createProduct' }
  });

  const functionCall = openaiRes.choices[0]?.message?.function_call;
  if (!functionCall || !functionCall.arguments) {
    log('No function_call response from OpenAI.');
    await supabase.from('documents').update({ error_message: 'No function_call response from OpenAI', status: 'error' }).eq('id', doc.id);
    return;
  }
  const args = JSON.parse(functionCall.arguments);
  log('Assembled product:', args.product);
  log('Attributes:', args.attributes);
  if (args.new_attributes) log('New attributes:', args.new_attributes);

  // Insert new attributes if any
  if (args.new_attributes) {
    for (const attr of args.new_attributes) {
      // Only insert if not already present
      if (!defMap.has(attr.internal_name)) {
        await supabase.from('attribute_definitions').insert(attr);
        log('Inserted new attribute_definition:', attr);
      }
    }
  }

  // Insert product with id, name, and attributes_json
  const { id, name, attributes_json } = args.product;
  const { data: prodData, error: prodError } = await supabase.from('products').insert({
    id,
    name,
    attributes_json
  }).select().single();
  if (prodError) {
    log('Error inserting product:', prodError);
    await supabase.from('documents').update({ error_message: prodError.message, status: 'error' }).eq('id', doc.id);
    return;
  }
  log('Inserted product:', prodData.id);

  // Mark document as completed
  await supabase.from('documents').update({ status: 'completed', processed_at: new Date().toISOString() }).eq('id', doc.id);
  log('Document assembly complete:', doc.id);
}

processExtractedDocuments().catch(e => { console.error(e); process.exit(1); });
