// AssembleProductsWorker.ts
/**
 * Worker to assemble mapped attributes into product records.
 *
 * Steps:
 * 1. Fetch all documents with status='processed' that lack product_metadata key 'source_document'.
 * 2. For each such document:
 *    a. Create a new product (name = file name, attributes_json empty).
 *    b. Fetch all mapped_attributes → definitions for this document.
 *    c. Insert each as product_attribute_values(product_id, attribute_id, value).
 *    d. Add product_metadata { key: 'source_document', value: document.id }.
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export default async function AssembleProductsWorker() {
  console.log('[AssembleProductsWorker] starting…');

  // 1. documents ready & not yet assembled
  const { data: docs, error: docsErr } = await supabase
    .from('documents')
    .select('id, storage_path')
    .eq('status', 'processed');
  if (docsErr) {
    console.error('[AssembleProducts] fetch docs error', docsErr);
    return;
  }
  for (const doc of docs || []) {
    // skip if already assembled
    const { data: meta, error: metaErr } = await supabase
      .from('product_metadata')
      .select('id')
      .eq('key', 'source_document')
      .eq('value', doc.id);
    if (metaErr) {
      console.error('[AssembleProducts] fetch meta error', metaErr);
      continue;
    }
    if (meta?.length) continue;

    // a. create product
    const { data: prodRaw, error: prodErr } = await supabase
      .from('products')
      .insert({
        name: doc.storage_path.split('/').pop(),
        description: `Product from ${doc.storage_path}`,
      })
      .single();
    if (prodErr) {
      console.error('[AssembleProducts] product insert error', prodErr);
      continue;
    }
    const prod = prodRaw as { id: string };
    const docWithId = doc as { id: string; storage_path: string };

    // b. fetch mapped attrs for this doc
    const { data: maps, error: mapErr } = await supabase
      .from('mapped_attributes')
      .select('definition_id, normalized_value, raw_attribute:raw_attributes(document_id)')
      .eq('mapped', true)
      .eq('raw_attribute.document_id', docWithId.id);
    if (mapErr) {
      console.error('[AssembleProducts] fetch maps error', mapErr);
      continue;
    }

    // c. insert each attribute value
    for (const m of maps || []) {
      const { error: pavErr } = await supabase
        .from('product_attribute_values')
        .insert({
          product_id: prod.id,
          attribute_id: m.definition_id,
          value: m.normalized_value,
        });
      if (pavErr) console.error('[AssembleProducts] pav insert error', pavErr);
    }

    // d. mark assembled
    await supabase
      .from('product_metadata')
      .insert({
        product_id: prod.id,
        key: 'source_document',
        value: docWithId.id,
      });

    console.log(`[AssembleProductsWorker] assembled product ${prod.id} from doc ${docWithId.id}`);
  }

  console.log('[AssembleProductsWorker] done.');
}

if (require.main === module) {
  AssembleProductsWorker().catch(console.error);
}
