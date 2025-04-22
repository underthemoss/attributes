import { Controller, Post, Param } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { GenerateProductsCommand } from './generate.command';

@Controller('api')
export class GenerateController {
  constructor(private readonly bus: CommandBus) {}
  @Post('generate/:id')
  async generate(@Param('id') documentId: string) {
    await this.bus.execute(new GenerateProductsCommand(documentId));
    return { status: 'queued' };
  }
}
