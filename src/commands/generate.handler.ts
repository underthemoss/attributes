import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { GenerateProductsCommand } from './generate.command';
import { SupabaseClient } from '@supabase/supabase-js';

export class DocumentGenerateRequested {
  constructor(public readonly documentId: string) {}
}

@CommandHandler(GenerateProductsCommand)
export class GenerateProductsHandler implements ICommandHandler<GenerateProductsCommand> {
  constructor(private readonly eventBus: EventBus, private supabase: SupabaseClient) {}
  async execute(cmd: GenerateProductsCommand) {
    await this.supabase
      .from('documents')
      .update({ status: 'generating', processed_at: null })
      .eq('id', cmd.documentId);
    this.eventBus.publish(new DocumentGenerateRequested(cmd.documentId));
  }
}
