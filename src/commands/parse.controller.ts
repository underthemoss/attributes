import { Controller, Post, Body } from '@nestjs/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const openaiApiKey = process.env.OPENAI_API_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

@Controller('api')
export class ParseController {
  @Post('parse')
  async parse(@Body() body: { bucket: string; name: string }) {
    console.log('[PARSE] Endpoint HIT', new Date().toISOString(), body);
    const log = (...args: any[]) => console.log(new Date().toISOString(), '[ParseController]', ...args);
    log('Parse request received', body);
    // 1. Download file from Supabase Storage
    const { data, error } = await supabase.storage.from(body.bucket).download(body.name);
    if (error || !data) {
      log('Storage download error', error);
      return { error: 'Failed to download file from storage', details: error };
    }
    if (!data) {
      log('File download failed: data is null');
      return { error: 'File download failed', details: 'No data returned from Supabase.' };
    }
    log('File downloaded');
    // 2. Read file as text (assuming PDF or text for demo)
    let fileText = '';
    let fileType = 'unknown';
    try {
      if (body.name.toLowerCase().endsWith('.pdf')) {
        fileType = 'pdf';
        log('Detected PDF file, extracting text with pdf-parse');
        const pdfParse = require('pdf-parse');
        const buffer = Buffer.from(await data.arrayBuffer());
        const pdfData = await pdfParse(buffer);
        fileText = pdfData.text;
      } else {
        fileType = 'text';
        log('Detected non-PDF file, extracting as plain text');
        fileText = (await data.text?.()) || '';
      }
      log('File type for GPT:', fileType);
    } catch (err) {
      log('File read error', err);
      return { error: 'Failed to read file', details: err };
    }
    log('File text extracted', fileText.slice(0, 200));
    // 3. Send to OpenAI GPT-4o-mini API with function-calling
    let gptResult = '';
    let rawAttributes = [];
    try {
      const systemPrompt = 'Extract all attribute name/value pairs from this spec sheet. Return JSON: { attributes: [{ internal_name, value }] }.';
      const userPrompt = fileText.slice(0, 8000);
      log('Prompt sent to GPT (function-calling):', { system: systemPrompt, user: userPrompt.slice(0, 200) });
      const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
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
                    required: ['internal_name', 'value']
                  }
                }
              },
              required: ['attributes']
            }
          }],
          function_call: { name: 'recordAttributes' }
        }),
      });
      log('Successfully connected to GPT API.');
      const gptData = await gptRes.json();
      log('Full GPT-4o-mini API response:', JSON.stringify(gptData, null, 2));
      const functionCall = gptData.choices?.[0]?.message?.function_call;
      if (!functionCall || !functionCall.arguments) {
        log('No function_call response from OpenAI.');
        return { error: 'No function_call response from OpenAI' };
      }
      const args = JSON.parse(functionCall.arguments);
      rawAttributes = args.attributes || [];
      log('Extracted raw attributes:', rawAttributes);
      gptResult = JSON.stringify(rawAttributes);
    } catch (err) {
      log('OpenAI API error', err);
      return { error: 'Failed to parse with GPT-4o-mini', details: err };
    }
    // 4. Store results in raw_attributes and optionally parsed_attributes
    try {
      for (const { internal_name, value } of rawAttributes) {
        await supabase.from('raw_attributes').insert({
          document_id: null, // TODO: set document_id if available, or add to body
          attribute_internal_name: internal_name,
          raw_value: value
        });
        log('Inserted raw attribute', { internal_name, value });
      }
      // Optionally, insert audit record
      const { error: insertError } = await supabase.from('parsed_attributes').insert({
        file_name: body.name,
        bucket: body.bucket,
        parsed_json: gptResult,
        parsed_at: new Date().toISOString(),
      });
      if (insertError) {
        log('DB insert error', insertError);
        return { error: 'Failed to save parsed result', details: insertError };
      }
    } catch (err) {
      log('DB insert exception', err);
      return { error: 'Failed to save parsed result', details: err };
    }
    // 5. Update document status and return result
    try {
      await supabase.from('documents').update({ status: 'extracted', processed_at: new Date().toISOString() }).eq('storage_path', body.name);
      log('Updated document status to extracted');
    } catch (err) {
      log('Failed to update document status', err);
    }
    const responseObj = { result: gptResult };
    log('Returning response to frontend:', JSON.stringify(responseObj));
    return responseObj;
  }
}
