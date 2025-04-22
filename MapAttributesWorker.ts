// MapAttributesWorker.ts
/**
 * Worker to map raw_attributes → attribute_definitions → mapped_attributes.
 *
 * Prereqs:
 *   • Migrations 004_add_mapped_flag.sql & 005_create_mapped_attributes.sql have been applied.
 *
 * Steps:
 * 1. Fetch all raw_attributes where mapped = false.
 * 2. Try exact match on attribute_definitions.name.
 * 3. If no exact match, call supabase.rpc('match_attribute_definition', { input_name }).
 * 4. For the best definition, insert { raw_attribute_id, definition_id, normalized_value } into mapped_attributes.
 * 5. Update raw_attributes.mapped = true.
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export default async function MapAttributesWorker() {
  console.log('[MapAttributesWorker] starting…');

  // 1. load all unmapped raw attributes
  const { data: raws, error: fetchErr } = await supabase
    .from('raw_attributes')
    .select('*')
    .eq('mapped', false);

  if (fetchErr) {
    console.error('[MapAttributesWorker] fetch error', fetchErr);
    return;
  }

  for (const raw of raws || []) {
    // 2. exact match on definition
    let { data: defs, error: defErr } = await supabase
      .from('attribute_definitions')
      .select('id, name')
      .eq('name', raw.attribute_internal_name);

    if (defErr) {
      console.error('[MapAttributesWorker] lookup error', defErr);
      continue;
    }

    // 3. fallback to fuzzy RPC
    if (!defs || defs.length === 0) {
      const rpc = await supabase
        .rpc('match_attribute_definition', { input_name: raw.attribute_internal_name })
        .select('id, name');
      defs = rpc.data;
    }

    if (!defs || defs.length === 0) {
      console.warn(`[MapAttributesWorker] no match for "${raw.attribute_internal_name}"`);
      continue;
    }

    const def = defs[0];

    // 4. insert mapping
    const { error: insertErr } = await supabase
      .from('mapped_attributes')
      .insert({
        raw_attribute_id: raw.id,      // integer → raw_attributes.id
        definition_id: def.id,         // uuid    → attribute_definitions.id
        normalized_value: raw.raw_value,
      });

    if (insertErr) {
      console.error('[MapAttributesWorker] insert error', insertErr);
      continue;
    }

    // 5. mark as mapped
    const { error: updateErr } = await supabase
      .from('raw_attributes')
      .update({ mapped: true })
      .eq('id', raw.id);

    if (updateErr) {
      console.error('[MapAttributesWorker] update mapped flag error', updateErr);
    } else {
      console.log(`[MapAttributesWorker] mapped raw ${raw.id} → def ${def.id}`);
    }
  }
}

if (require.main === module) {
  MapAttributesWorker().catch(console.error);
}
