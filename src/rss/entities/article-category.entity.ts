import {Table, Column, Model, ForeignKey, BelongsTo, AutoIncrement, PrimaryKey} from 'sequelize-typescript';
import { Rss } from './rss.entity';
import {Category} from "./category.entity";

@Table({ tableName: 'article_category' })
export class ArticleCategory extends Model<ArticleCategory> {
    @AutoIncrement
    @PrimaryKey
    @Column
    id : number ;

    @ForeignKey(() => Rss)
    @Column
    article_id: number;

    @ForeignKey(() => Category)
    @Column
    category_id: number;

    @BelongsTo(() => Rss)
    rss: Rss;

    @BelongsTo(() => Category)
    author: Category;
}
