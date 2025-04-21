import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import pdfParse from 'pdf-parse'

// Supabase & OpenAI clients
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const openai  = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function processPendingDocuments() {
  const log = (...args: any[]) => console.log(new Date().toISOString(), ...args);
  // fetch one pending document
  log('Fetching pending document...');
  const { data: docs } = await supabase.from('documents').select('id, storage_path').eq('status','pending').limit(1);
  if (!docs || docs.length === 0) return log('No pending docs.')

  const { id: docId, storage_path: path } = docs[0]
  log('Processing document', { docId, path });

  // download and extract text
  log('Downloading file from storage:', path);
  const { data: file } = await supabase.storage.from('documents').download(path)
  if (!file) {
    log('File download failed', { path });
    throw new Error(`Failed to download file at path: ${path}`)
  }
  log('File downloaded, extracting text...');
  const buffer = Buffer.from(await file.arrayBuffer())
  const { text } = await pdfParse(buffer)
  log('Text extracted, length:', text.length);

  // call GPT to extract raw attributes
  log('Calling OpenAI GPT for attribute extraction...');
  const gptStart = Date.now();
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
  const gptDuration = Date.now() - gptStart;
  log('OpenAI GPT response received', {
    duration_ms: gptDuration,
    choices: res.choices.length,
    function_call: res.choices[0]?.message?.function_call?.name,
    args_length: res.choices[0]?.message?.function_call?.arguments?.length,
  });
  const args = JSON.parse(res.choices[0].message.function_call!.arguments!)
  log('Parsed attributes', { count: args.attributes.length });
  for (const { internal_name, value } of args.attributes) {
    await supabase.from('raw_attributes').insert({ document_id: docId, attribute_internal_name: internal_name, raw_value: value })
    log('Inserted raw attribute', { docId, internal_name, value });
  }

  // mark done
  await supabase.from('documents').update({ status:'extracted' }).eq('id',docId)
  log('Document processing complete', { docId, attribute_count: args.attributes.length });
}

processPendingDocuments().catch(e=>{ console.error(e); process.exit(1) })
