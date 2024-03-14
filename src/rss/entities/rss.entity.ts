import {Table, Column, Model, AutoIncrement, PrimaryKey, ForeignKey, BelongsTo} from 'sequelize-typescript';
import {Media} from "./media.entity"

@Table({ tableName: 'article' })
export class Rss extends Model<Rss> {

    @AutoIncrement
    @PrimaryKey
    @Column
    id : number ;

    @Column
    title: string;

    @Column({
        type: 'TEXT'
    })
    description: string;

    @Column
    publicationDate: Date;

    @Column
    link:string ;

    @ForeignKey(() => Media)
    @Column
    media_id:number;

    @BelongsTo(() => Media)
    media : Media
}

