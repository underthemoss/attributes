// LoadDefinitionsWorker.ts
/**
 * Worker to bulk‑load physics‑derived attribute definitions and groups.
 *
 * Prereqs:
 *   • Place your JSON at ./data/attribute_library.json with shape:
 *     {
 *       "attributes": [ ... ],
 *       "groups": [ ... ]
 *     }
 *
 * Steps:
 * 1. Read & parse JSON.
 * 2. Upsert each attribute into attribute_definitions.
 * 3. Upsert each group into attribute_groups.
 * 4. Link definitions ↔ groups via group_attributes.
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export default async function LoadDefinitionsWorker() {
  console.log('[LoadDefinitionsWorker] starting…');

  // 1. load JSON
  const filePath = path.resolve(__dirname, '../data/attribute_library.json');
  const raw = await fs.readFile(filePath, 'utf-8');
  const { attributes, groups } = JSON.parse(raw);

  // 2. upsert definitions
  for (const def of attributes) {
    const { error } = await supabase
      .from('attribute_definitions')
      .upsert({
        name: def.name,
        display_name: def.display_name,
        description: def.description,
        data_type: def.data_type,
        unit: def.unit,
        synonyms: def.synonyms,
        constraints: def.constraints,
      }, { onConflict: 'name' });
    if (error) console.error('[LoadDefinitions] def upsert error', def.name, error);
    else console.log('[LoadDefinitions] upserted def', def.name);
  }

  // 3. upsert groups
  for (const grp of groups) {
    // insert or fetch existing
    const { data: existing } = await supabase
      .from('attribute_groups')
      .select('id')
      .eq('name', grp.name)
      .single();
    let groupId = existing?.id;
    if (!groupId) {
      const { data, error } = await supabase
        .from('attribute_groups')
        .insert({ name: grp.name, description: grp.description })
        .single();
      if (error) {
        console.error('[LoadDefinitions] group insert error', grp.name, error);
        continue;
      }
      groupId = data.id;
      console.log('[LoadDefinitions] created group', grp.name);
    }

    // 4. link attributes → group
    for (const attrName of grp.attribute_names) {
      // fetch definition id
      const { data: defRaw } = await supabase
        .from('attribute_definitions')
        .select('id')
        .eq('name', attrName)
        .single();
      const def = defRaw as { id: string } | null;
      if (!def) {
        console.warn('[LoadDefinitions] no def for group', grp.name, attrName);
        continue;
      }
      const { error: linkErr } = await supabase
        .from('group_attributes')
        .upsert({
          group_id: groupId,
          attribute_id: def.id,
        }, { onConflict: 'group_id,attribute_id' });
      if (linkErr) console.error('[LoadDefinitions] group_attr link error', grp.name, attrName, linkErr);
    }
  }

  console.log('[LoadDefinitionsWorker] done.');
}

if (require.main === module) {
  LoadDefinitionsWorker().catch(console.error);
}
