import {IsNotEmpty} from "class-validator";

export class CreateContactDto {
    @IsNotEmpty({
        message: 'Aucun prénom renseigné',
    })
    firstName: string;

    @IsNotEmpty({
        message: 'Aucun nom renseigné',
    })
    lastName: string;

    @IsNotEmpty({
        message: 'Aucun email renseigné',
    })
    email: string;

    @IsNotEmpty({
        message: 'Aucun sujet renseigné',
    })
    subject: string;

    @IsNotEmpty({
        message: 'Aucun message renseigné',
    })
    content: string;
}
