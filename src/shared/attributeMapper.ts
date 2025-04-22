import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export type AttributeDefinition = {
  id: string;
  internal_name: string;
  synonyms: string[];
  concept_ids: string[];
};

export type AttributeGroup = {
  id: string;
  name: string;
};

// Caches
let attributeDefs: AttributeDefinition[] = [];
let attributeGroups: AttributeGroup[] = [];
let nameToAttrId: Record<string, string> = {};
let groupIdToName: Record<string, string> = {};

export async function loadAttributeLibrary() {
  const { data: defs } = await supabase.from('attribute_definitions').select('id, internal_name, synonyms, concept_ids');
  const { data: groups } = await supabase.from('attribute_groups').select('id, name');
  attributeDefs = defs || [];
  attributeGroups = groups || [];
  nameToAttrId = {};
  groupIdToName = {};
  for (const def of attributeDefs) {
    nameToAttrId[def.internal_name.toLowerCase()] = def.id;
    if (def.synonyms) {
      for (const syn of def.synonyms) {
        nameToAttrId[syn.toLowerCase()] = def.id;
      }
    }
  }
  for (const group of attributeGroups) {
    groupIdToName[group.id] = group.name;
  }
}

export function mapRawNameToId(name: string): string | undefined {
  return nameToAttrId[name.toLowerCase()];
}

export function getConceptsForAttr(attrId: string): string[] {
  const def = attributeDefs.find(d => d.id === attrId);
  if (!def || !def.concept_ids) return [];
  return def.concept_ids.map(cid => groupIdToName[cid]).filter(Boolean);
}
