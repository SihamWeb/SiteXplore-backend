import {Injectable} from "@nestjs/common";
import {PassportStrategy} from "@nestjs/passport";
import {Strategy, VerifyCallback} from "passport-google-oauth20";
import * as process from "process";
import {UserService} from "../../user/user.service";
import {AuthenticationService} from "../authentication.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google'){
    constructor(
        private readonly authenticationService: AuthenticationService,
        private readonly userService: UserService
    ) {
        super({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_SECRET,
            callbackURL: 'http://localhost:3000/auth/google/callback',
            scope: ['email', 'profile']
        });
    }

    authorizationParams(): { [key: string]: string } {
        return {
            access_type: 'offline',
            prompt: 'consent',
        };
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: any,
    ) {
        const { name, emails, photos } = profile;

        const user = {
            email: emails[0].value,
            firstName: name.givenName,
            lastName: name.familyName,
            profilePicture: photos[0].value,
            accessToken,
            refreshToken,
        };

        const isExcistUser = await this.userService.findByEmail(user.email);
        if (isExcistUser) {
            const userIdDatabase = isExcistUser.id;
            await this.userService.updateLastConnection(userIdDatabase);
            return done(null, user);
        } else {
            const userNew = await this.authenticationService.createUserFromToken(user);
            return done(null, userNew);
        }
    }
}