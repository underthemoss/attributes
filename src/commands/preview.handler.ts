import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PreviewProductCommand } from './preview.command';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

@CommandHandler(PreviewProductCommand)
export class PreviewProductHandler implements ICommandHandler<PreviewProductCommand> {
  async execute(cmd: PreviewProductCommand) {
    const { default: previewWorker } = await import('../../workers/preview-products');
    return previewWorker(supabase, cmd.documentId);
  }
}
