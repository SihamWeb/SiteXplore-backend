import {AutoIncrement, Column, Model, PrimaryKey, Table} from "sequelize-typescript";

@Table({ tableName: 'category' })
export class Category extends Model<Category> {

    @AutoIncrement
    @PrimaryKey
    @Column
    id : number ;

    @Column
    name: string;
}
