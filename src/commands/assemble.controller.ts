import { Controller, Post, Body } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AssembleProductCommand } from './assemble.command';

@Controller('api')
export class AssembleController {
  constructor(private readonly bus: CommandBus) {}

  @Post('assemble')
  async assemble(@Body() body: { documentId: string }) {
    return this.bus.execute(new AssembleProductCommand(body.documentId));
  }
}
