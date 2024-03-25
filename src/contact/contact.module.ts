import { Module } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import {MailModule} from "../mail/mail.module";
import {AuthModule} from "../auth/auth.module";

@Module({
  imports: [
    MailModule,
    AuthModule,
  ],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
