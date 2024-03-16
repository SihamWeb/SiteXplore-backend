import {AutoIncrement, Column, Model, PrimaryKey, Table} from "sequelize-typescript";

@Table({ tableName: 'media' })
export class Media extends Model<Media> {

    @AutoIncrement
    @PrimaryKey
    @Column
    id : number ;

    @Column
    mediaLink: string;

    @Column
    mediaDescription: string;

    @Column
    mediaCredit: string;
}