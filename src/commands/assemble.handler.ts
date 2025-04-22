import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AssembleProductCommand } from './assemble.command';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

@CommandHandler(AssembleProductCommand)
export class AssembleProductHandler implements ICommandHandler<AssembleProductCommand> {
  async execute(cmd: AssembleProductCommand) {
    const { assembleForDocument } = await import('../../workers/assemble-products');
    return assembleForDocument(supabase, cmd.documentId);
  }
}
