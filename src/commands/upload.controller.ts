import { Controller, Post, Body } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { UploadDocumentCommand } from './upload.command';

@Controller('api')
export class UploadController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('upload')
  async upload(@Body() body: { path: string }) {
    return this.commandBus.execute(new UploadDocumentCommand(body.path));
  }
}
