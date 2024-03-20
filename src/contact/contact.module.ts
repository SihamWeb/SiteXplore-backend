import { Module } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import {MailModule} from "../mail/mail.module";
import {UserModule} from "../user/user.module";

@Module({
  imports: [
    MailModule,
    UserModule,
  ],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
