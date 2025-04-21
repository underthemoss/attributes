import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { UploadDocumentCommand } from './upload.command';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

@CommandHandler(UploadDocumentCommand)
export class UploadDocumentCommandHandler implements ICommandHandler<UploadDocumentCommand> {
  constructor(private readonly eventBus: EventBus) {}

  async execute(command: UploadDocumentCommand) {
    const log = (...args: any[]) => console.log(new Date().toISOString(), '[UploadHandler]', ...args);
    log('Upload started', { storage_path: command.storage_path });
    // Insert into documents table
    const { data, error } = await supabase.from('documents').insert({
      storage_path: command.storage_path,
      status: 'pending',
    }).select().single();
    if (error) {
      log('DB insert error', error);
      throw error;
    }
    log('DB insert success', data);
    // Emit DocumentUploaded event
    this.eventBus.publish({
      type: 'DocumentUploaded',
      documentId: data.id,
      storagePath: data.storage_path,
    });
    return data;
  }
}
