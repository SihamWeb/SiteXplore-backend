import {IsBoolean, IsEmail, IsNotEmpty, IsString, MinLength} from 'class-validator';

export class CreateUserDto {

    @IsString({
        message: 'Le prénom renseigné n\'est pas une chaîne de caractères.',
    })
    @IsNotEmpty({
        message: 'Aucun prénom renseigné',
    })
    firstName: string;

    @IsString({
        message: 'Le nom renseigné n\'est pas une chaîne de caractères.',
    })
    @IsNotEmpty({
        message: 'Aucun nom renseigné',
    })
    lastName: string;

    @IsEmail({}, {
        message: 'Email renseigné de mauvais format.'
    })
    @IsString({
        message: 'L\'email renseigné n\'est pas une chaîne de caractères.',
    })
    @IsNotEmpty({
        message: 'Aucun email renseigné',
    })
    email: string;

    @IsString({
        message: 'Mauvais format de mot de passe, il doit être une chaîne de caractères.',
    })
    @IsNotEmpty({
        message: 'Aucun mot de passe renseigné.',
    })
    @MinLength(8, {
        message: 'Le mot de passe doit contenir minimum 8 caractères.',
    })
    password: string;

    @IsBoolean()
    isAdmin: boolean;
}
