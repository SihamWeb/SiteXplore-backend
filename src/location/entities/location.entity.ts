import {AutoIncrement, BelongsTo, Column, CreatedAt, UpdatedAt, ForeignKey, Model, PrimaryKey, Table} from "sequelize-typescript";

@Table({ tableName: 'map' })
export class Location extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    id: number;

    @Column({type: 'float'})
    Latitude: number;

    @Column({type: 'float'})
    Longitude: number;

    @Column
    Region: string;

    @Column
    Departement: string;

    @Column
    Commune: string;

    @Column
    Nom: string;

    @Column
    Debut: Date;

    @Column
    Fin: Date;

    @Column
    Periodes: string;

    @Column
    Themes: string;

    @Column
    Type: string;

    @Column({type:'datetime'})
    @CreatedAt
    createdAt: Date;

    @Column ({type:'datetime'})
    @UpdatedAt
    updatedAt: Date;

}


