import { Module } from '@nestjs/common';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';
import {JwtModule} from "@nestjs/jwt";
import {PassportModule} from "@nestjs/passport";
import {LocalStrategy} from "./strategies/local.strategy";
import {JwtStrategy} from "./strategies/jwt.strategy";

@Module({
  imports: [
      PassportModule,
      JwtModule.register({
        secret: 'anjndhjfk80hufdz;n@][{g659jnejqsk327ù;cbui',
        signOptions: {
          expiresIn: '1h'
        },
      })
  ],
  controllers: [AuthenticationController],
  providers: [AuthenticationService, LocalStrategy, JwtStrategy]
})
export class AuthenticationModule {}
