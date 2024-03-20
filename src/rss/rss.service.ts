import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Rss } from './entities/rss.entity';
import {Op, Sequelize} from "sequelize";
import {ArticleAuthor} from "./entities/article-author.entity";
import {Author} from "./entities/author.entity";
import {Category} from "./entities/category.entity";
import {ArticleCategory} from "./entities/article-category.entity";
import {Media} from "./entities/media.entity";
import {Cron} from "@nestjs/schedule";

@Injectable()
export class RssService {
    constructor(
        @InjectModel(Rss)
        private rssModel: typeof Rss,
        @InjectModel(Author)
        private readonly authorModel: typeof Author,
        @InjectModel(ArticleAuthor)
        private readonly articleAuthorModel: typeof ArticleAuthor,
        @InjectModel(Category)
        private readonly categoryModel: typeof Category,
        @InjectModel(ArticleCategory)
        private readonly articleCategoryModel: typeof ArticleCategory,
        @InjectModel(Media)
        private mediaModel: typeof Media
    ) {}

    //@Cron('0 8 * * *')
    async create(): Promise<void> {

        await this.articleAuthorModel.destroy({truncate: true, restartIdentity: true});
        await this.articleCategoryModel.destroy({truncate: true, restartIdentity: true});
        await this.categoryModel.destroy({where : {}, restartIdentity: true});
        await this.authorModel.destroy({where : {}, restartIdentity: true});
        await this.mediaModel.destroy({where : {}, restartIdentity: true});
        await this.rssModel.destroy({where : {}, restartIdentity: true});

        const parser = require('rss-url-parser');

        const rss_feed = [
            'https://services.lesechos.fr/rss/archeologie.xml',
            'https://www.lemonde.fr/archeologie/rss_full.xml',
            'https://www.lefigaro.fr/rss/figaro_histoire.xml',
            'https://www.sciencesetavenir.fr/archeo-paleo/rss.xml',
            'https://www.inrap.fr/rss.xml',
            'https://archipeldessciences.wordpress.com/category/archeologie/feed/',
            'https://www.cibpl.fr/rubrique/epaves-et-archeologie/epaves-et-archeologie/feed/',
            'https://www.cairn.info/rss/rss_encyclo-histoire.xml',
            'https://histoires-archeologie.lepodcast.fr/rss',
            'https://radiofrance-podcast.net/podcast09/35099478-7c72-4f9e-a6de-1b928400e9e5/rss_10267.xml',
            'https://www.youtube.com/feeds/videos.xml?channel_id=UC6Yhg_Phtz-RHX0CBFhU8pA'
        ];

        for (const url of rss_feed) {
            console.log('#######################################');
            console.log('##### Chargement du flux : ' + url);
            console.log('#######################################');

            try {
                const data = await parser(url);

                for (const item of data) {

                    const rssData: any = {};

                    rssData.title = item.title ?? undefined;
                    rssData.description = item.description ?? undefined;
                    rssData.publicationDate = item.pubDate ? new Date(item.pubDate) : undefined;
                    rssData.link = item.link ?? undefined;

                    if (Object.keys(rssData).length > 0) {
                        // Image miniature youtube
                        (item.image.url) ? await Media.create({mediaLink: item.image.url}) : console.log('') ;

                        // Image (ou media audio) enclosure
                        (item['rss:enclosure']) ? await Media.create({mediaLink: item['rss:enclosure']['@'].url}) : console.log('') ;

                        if (item['media:content']) {
                            const media = await Media.create({
                                mediaLink: item['media:content']['@'] ? item['media:content']['@'].url : '',
                                mediaDescription: item['media:content']['media:description'] ? item['media:content']['media:description']['#'] : '',
                                mediaCredit: item['media:content']['media:credit'] ? item['media:content']['media:credit']['#'] : '',
                            })
                            rssData.media_id = media.id;
                        }

                        const rss = await this.rssModel.create(rssData);

                         let liste_auteurs = (item.author !== null && item.author.length !== 0) ? item.author : item.meta.author ;

                       if (liste_auteurs !== null) {
                             if (liste_auteurs.length !== 0) {
                                 let author = await this.authorModel.findOne({
                                     where: {
                                         name: liste_auteurs,
                                     },
                                 });

                                 if (!author) {
                                     author = await this.authorModel.create({
                                         name: liste_auteurs,
                                     });
                                 }

                                 await this.articleAuthorModel.create({
                                     article_id: rss.id,
                                     author_id: author.id,
                                 });
                             }
                         }

                        let liste_categories = (item.categories.length !== 0 ? item.categories : item.meta.categories) ;

                        if (liste_categories !== null) {
                            if (liste_categories.length !== 0) {
                                for (let i = 0; i < liste_categories.length; i++) {
                                    let category = await this.categoryModel.findOne({
                                        where: {
                                            name: liste_categories[i],
                                        },
                                    });

                                    if (!category) {
                                        category = await this.categoryModel.create({
                                            name: liste_categories[i],
                                        });
                                    }

                                    await this.articleCategoryModel.create({
                                        article_id: rss.id,
                                        category_id: category.id,
                                    });
                                }
                            }
                        }
                    } else {
                        console.log('Aucune donnée à enregistrer dans la base de données');
                    }
                }
            } catch (error) {
                console.error('Erreur lors de l\'enregistrement dans la bas de donnée :', error);
            }
        }
    }

    // Search bar
    async searchArticles(query: string): Promise<Rss[]> {
        if (!query) {
            throw new BadRequestException('Aucune recherche envoyée');
        }

        const articles = await this.rssModel.findAll({
            where: {
                [Op.or]: [
                    { title: { [Op.like]: `%${query}%` } },
                    { description: { [Op.like]: `%${query}%` } },
                ],
            },
            include: [
                {
                    model: Media,
                    required: false,
                },
            ],
        });

        for (const article of articles) {
            const Categories = await ArticleCategory.findAll({
                where: {
                    article_id: article.id
                },
                include: [
                    {
                        model: Category,
                        required: false,
                    }
                ]
            });

            const Auteurs = await ArticleAuthor.findAll({
                where: {
                    article_id: article.id
                },
                include: [
                    {
                        model: Author,
                        required: false,
                    }
                ]
            });
            article.dataValues.categories = Categories;
            article.dataValues.authors = Auteurs;
        }

        if (!articles || articles.length === 0) {
            throw new NotFoundException('Aucun article trouvé pour la recherche spécifiée.');
        }

        return articles;
    }

    async filtresArticles(startDate: Date, endDate: Date, author: number[]): Promise<Rss[]> {
        console.log('startDate:', startDate);
        console.log('endDate:', endDate);
        let where: any = {};

        if (startDate && endDate) {
            where.publicationDate = {
                [Op.between]: [startDate, endDate],
            };
        } else if (startDate) {
            where.publicationDate = {
                [Op.gte]: startDate,
            };
        } else if (endDate) {
            where.publicationDate = {
                [Op.lte]: endDate,
            };
        }

        console.log('Clause WHERE:', where);

        const articles = await this.rssModel.findAll({
            where: where,
            include: [
                {
                    model: Media,
                    required: false,
                },
            ],
        });
        for (const article of articles) {
            /*const Categories = await ArticleCategory.findAll({
                where: {
                    article_id: article.id
                },
                include: [
                    {
                        model: Category,
                        required: false,
                    }
                ]
            });*/

            const Auteurs = await ArticleAuthor.findAll({
                where: {
                    article_id: article.id,
                    author_id : {
                        [Op.in]: author,
                    }
                },
                include: [
                    {
                        model: Author,
                        required: false,
                    }
                ]
            });
            console.log('Auteur saisi : ' + author);
            //article.dataValues.categories = Categories;
            article.dataValues.authors = Auteurs;
        }

        if (!articles || articles.length === 0) {
            throw new NotFoundException('Aucun article trouvé pour les filtres spécifiés.');
        }

        return articles;
    }l

    async findAll(){
        const articles = await Rss.findAll(
            {
                include: [
                    {
                        model: Media,
                        required: false,
                    }
                ],
            }
        )
        for (const article of articles) {
            const Categories = await ArticleCategory.findAll({
                where: {
                    article_id: article.id
                },
                include: [
                    {
                        model: Category,
                        required: false,
                    }
                ]
            });

            const Auteurs = await ArticleAuthor.findAll({
                where: {
                    article_id: article.id
                },
                include: [
                    {
                        model: Author,
                        required: false,
                    }
                ]
            });
            article.dataValues.categories = Categories;
            article.dataValues.authors = Auteurs;
        }

        if (!articles || articles.length === 0) {
            throw new Error('Aucun article trouvé');
        }
        return articles;
    }

    async findAllAuthors(){
        const authors = await Author.findAll();
        if (!authors || authors.length === 0) {
            throw new Error('Aucun auteur trouvé');
        }
        return authors;
    }

    async findAllCategories(){
        const categories = await Category.findAll();
        if (!categories || categories.length === 0) {
            throw new Error('Aucune categorie trouvée');
        }
        return categories;
    }
}
