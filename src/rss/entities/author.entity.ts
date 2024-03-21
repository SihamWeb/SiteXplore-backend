import {BelongsToMany, HasMany, Table, Column, Model, AutoIncrement, PrimaryKey, ForeignKey, BelongsTo} from 'sequelize-typescript';
import {ArticleAuthor} from "./article-author.entity";
import {Rss} from "./rss.entity";

@Table({ tableName: 'author' })
export class Author extends Model<Author> {

    @AutoIncrement
    @PrimaryKey
    @Column
    id : number ;

    @Column
    firstName: string;

    @Column
    lastName: string;

    @Column
    name: string;

    @BelongsToMany(() => Rss, () => ArticleAuthor)
    articles: Rss[];
}

