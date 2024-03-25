import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailService } from './mail.service';

@Module({
    imports: [
        ConfigModule.forRoot(),
        MailerModule.forRootAsync({
            useFactory: async (config: ConfigService) => ({
                transport: {
                    host: config.get('MAIL_HOST'),
                    secure: false,
                    tls: {
                        ciphers:'SSLv3'
                    },
                    requireTLS:true,
                    auth: {
                        user: config.get('MAIL_USERNAME'),
                        pass: config.get('MAIL_PASSWORD'),
                    },
                },
                defaults: {
                    from: `"Ne pas répondre" <${config.get('MAIL_USERNAME')}>`,
                },
                template: {
                    dir: 'src/mail/templates',
                    adapter: new HandlebarsAdapter(),
                    options: {
                        strict: true,
                    },
                },
            }),
            inject: [ConfigService],
        }),
        /*MailerModule.forRootAsync({
            useFactory: async (config: ConfigService) => ({
                transport: {
                    service: 'gmail',
                    auth: {
                        type: 'OAuth2',
                        user: config.get('MAIL_USERNAME'),
                        clientId: config.get('GOOGLE_CLIENT_ID'),
                        clientSecret: config.get('GOOGLE_SECRET'),
                        refreshToken: 'your-refresh-token',
                    },
                },
                template: {
                    dir: 'src/mail/templates',
                    adapter: new HandlebarsAdapter(),
                    options: {
                        strict: true,
                    },
                },
                inject: [ConfigService],
            }),
        }),*/
    ],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule {}