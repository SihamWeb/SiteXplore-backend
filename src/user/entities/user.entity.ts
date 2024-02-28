import {AutoIncrement, Column, Model, PrimaryKey} from "sequelize-typescript";

export class User extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    id: number;

    @Column
    firstname: string;

    @Column
    lastname: string;

    @Column({ unique: true })
    email: string;

    @Column
    password: string;

    @Column
    isAdmin: boolean;

    @Column({ allowNull: true })
    profilePicture: string;

    @Column({ type: 'datetime', allowNull: true })
    lastConnection: Date;

}
