import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import pdfParse from 'pdf-parse'

// Supabase & OpenAI clients
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const openai  = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function processPendingDocuments() {
  // fetch one pending document
  const { data: docs } = await supabase.from('documents').select('id, path').eq('status','pending').limit(1)
  if (!docs || docs.length === 0) return console.log('No pending docs.')

  const { id: docId, path } = docs[0]
  console.log(`Processing ${docId}`)

  // download and extract text
  const { data: file } = await supabase.storage.from('documents').download(path)
  if (!file) {
    throw new Error(`Failed to download file at path: ${path}`)
  }
  const buffer = Buffer.from(await file.arrayBuffer())
  const { text } = await pdfParse(buffer)

  // call GPT to extract raw attributes
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Extract all attribute name/value pairs from this spec sheet. Return JSON: { attributes: [{ internal_name, value }] }.' },
      { role: 'user', content: text }
    ],
    functions: [{
      name: 'recordAttributes',
      description: 'Record raw attributes for a document',
      parameters: {
        type: 'object',
        properties: {
          attributes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                internal_name: { type: 'string' },
                value: { type: 'string' }
              },
              required: ['internal_name','value']
            }
          }
        },
        required: ['attributes']
      }
    }],
    function_call: { name: 'recordAttributes' }
  })

  // parse and insert raw attributes
  const args = JSON.parse(res.choices[0].message.function_call!.arguments!)
  for (const { internal_name, value } of args.attributes) {
    await supabase.from('raw_attributes').insert({ document_id: docId, attribute_internal_name: internal_name, raw_value: value })
  }

  // mark done
  await supabase.from('documents').update({ status:'extracted' }).eq('id',docId)
  console.log(`Done ${docId} (${args.attributes.length} items)`)
}

processPendingDocuments().catch(e=>{ console.error(e); process.exit(1) })
