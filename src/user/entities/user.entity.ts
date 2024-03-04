import {AutoIncrement, Column, CreatedAt, Model, PrimaryKey, Table, UpdatedAt} from "sequelize-typescript";

@Table({ tableName: 'user' })
export class User extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    id: number;

    @Column
    firstName: string;

    @Column
    lastName: string;

    @Column({ unique: true })
    email: string;

    @Column
    password: string;

    @Column
    isAdmin: boolean;

    @Column({ allowNull: true })
    profilePicture?: string;

    @Column({ type: 'datetime', allowNull: true })
    lastConnection?: Date;

    @Column({ type: 'datetime' })
    @CreatedAt
    createdAt: Date;

    @Column({ type: 'datetime' })
    @UpdatedAt
    updatedAt: Date;

}
