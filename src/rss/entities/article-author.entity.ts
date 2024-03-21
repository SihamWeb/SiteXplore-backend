import {
    Table,
    Column,
    Model,
    ForeignKey,
    BelongsTo,
    AutoIncrement,
    PrimaryKey,
    BelongsToMany
} from 'sequelize-typescript';
import { Rss } from './rss.entity';
import { Author } from './author.entity';

@Table({ tableName: 'article_author' })
export class ArticleAuthor extends Model<ArticleAuthor> {
    @AutoIncrement
    @PrimaryKey
    @Column
    id : number ;

    @ForeignKey(() => Rss)
    @Column
    article_id: number;

    @ForeignKey(() => Author)
    @Column
    author_id: number;

    @BelongsTo(() => Rss)
    rss: Rss;

    @BelongsTo(() => Author)
    author: Author;
}
