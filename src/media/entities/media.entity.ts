import {AutoIncrement, Column, Model, PrimaryKey} from "sequelize-typescript";

export class Media extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    id : number ;

    @Column
    mediaLink: string;

    @Column
    mediaDescription: string;

    @Column
    mediaCredits: string;

}
