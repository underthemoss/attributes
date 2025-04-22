import { Controller, Get, Query } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { PreviewProductCommand } from './preview.command';

@Controller('api')
export class PreviewController {
  constructor(private readonly bus: CommandBus) {}

  @Get('preview')
  async preview(@Query('documentId') documentId: string) {
    return this.bus.execute(new PreviewProductCommand(documentId));
  }
}
