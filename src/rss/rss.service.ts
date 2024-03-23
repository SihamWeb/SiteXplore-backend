import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Rss } from './entities/rss.entity';
import {Op, Sequelize} from "sequelize";
import {ArticleAuthor} from "./entities/article-author.entity";
import {Author} from "./entities/author.entity";
import {Category} from "./entities/category.entity";
import {ArticleCategory} from "./entities/article-category.entity";
import {Media} from "./entities/media.entity";
import * as moment from 'moment-timezone';

import {Cron} from "@nestjs/schedule";
import { Repository } from 'typeorm';

@Injectable()
export class RssService {
    constructor(
        @InjectModel(Rss)
        private rssRepository: Repository<Rss>,
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
    ) {
    }

    @Cron('0 8 * * *')
    async create(): Promise<void> {

        await this.articleAuthorModel.destroy({truncate: true, restartIdentity: true});
        await this.articleCategoryModel.destroy({truncate: true, restartIdentity: true});
        await this.categoryModel.destroy({where: {}, restartIdentity: true});
        await this.authorModel.destroy({where: {}, restartIdentity: true});
        await this.mediaModel.destroy({where: {}, restartIdentity: true});
        await this.rssModel.destroy({where: {}, restartIdentity: true});

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
                        (item.image.url) ? await Media.create({mediaLink: item.image.url}) : console.log('');

                        // Image (ou media audio) enclosure
                        (item['rss:enclosure']) ? await Media.create({mediaLink: item['rss:enclosure']['@'].url}) : console.log('');

                        if (item['media:content']) {
                            const media = await Media.create({
                                mediaLink: item['media:content']['@'] ? item['media:content']['@'].url : '',
                                mediaDescription: item['media:content']['media:description'] ? item['media:content']['media:description']['#'] : '',
                                mediaCredit: item['media:content']['media:credit'] ? item['media:content']['media:credit']['#'] : '',
                            })
                            rssData.media_id = media.id;
                        }

                        const rss = await this.rssModel.create(rssData);

                        let liste_auteurs = (item.author !== null && item.author.length !== 0) ? item.author : item.meta.author;

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

                        let liste_categories = (item.categories.length !== 0 ? item.categories : item.meta.categories);

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
                    {title: {[Op.like]: `%${query}%`}},
                    {description: {[Op.like]: `%${query}%`}},
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

    async filtresArticles(startDate: Date, endDate: Date, author: number, category: number): Promise<any> {
        let where: any = {};

        if (!startDate && !endDate && !author && !category) {
            console.log('AUCUN PARAMETRE');
            const articles = await this.findAll();
            return articles;
        }

        if (startDate && endDate) {
            where.publicationDate = {
                [Op.between]: [moment(startDate).tz('Europe/Paris'), moment(endDate).tz('Europe/Paris')],
            };
        } else if (startDate) {
            where.publicationDate = {
                [Op.gte]: moment(startDate).tz('Europe/Paris'),
            };
        } else if (endDate) {
            where.publicationDate = {
                [Op.lte]: moment(endDate).tz('Europe/Paris'),
            };
        }

        if ((Object.keys(where).length !== 0) && !author && !category){
            console.log('WHERE');
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

                article.dataValues.authors = Auteurs;
                article.dataValues.categories = Categories;
            }

            if (Object.keys(articles).length === 0) {
                throw new NotFoundException('Aucun article trouvé pour les filtres spécifiés.');
            }

            return articles;
        }

        if (Object.keys(where).length === 0) {
            if (author && !category){
                console.log('AUTHOR');
                const Authors = await ArticleAuthor.findAll({
                    include: [
                        {
                            model: Rss,
                            where: {
                                id: Sequelize.col('ArticleAuthor.article_id'),
                            },
                            include: [
                                {
                                    model: Media,
                                    required: false,
                                },
                            ],
                        },
                        {
                            model: Author,
                            required: false,
                        },
                    ],
                    where: { author_id: author },
                });

                for (const auteur of Authors) {
                    const article = await Rss.findOne({
                        where: { id: auteur.article_id },
                    });

                    if (article) {
                        const Categories = await ArticleCategory.findAll({
                            where: {
                                article_id: article.id,
                            },
                            include: [
                                {
                                    model: Category,
                                    required: false,
                                },
                            ],
                        });
                        (auteur as any).dataValues.categories = Categories;
                    }
                }

                if (Object.keys(Authors).length === 0) {
                    throw new NotFoundException('Aucun article trouvé pour les filtres spécifiés.');
                }

                return Authors;

            } else if (category && !author){
                console.log('CATEGORY');
                const Categories = await ArticleCategory.findAll({
                    include: [
                        {
                            model: Rss,
                            where: {
                                id: Sequelize.col('ArticleCategory.article_id'),
                            },
                            include: [
                                {
                                    model: Media,
                                    required: false,
                                },
                            ],
                        },
                        {
                            model: Category,
                            required: false,
                        },
                    ],
                    where: { category_id: category },
                });

                for (const categorie of Categories) {
                    const article = await Rss.findOne({
                        where: { id: categorie.article_id },
                    });

                    if (article) {
                        const Authors = await ArticleAuthor.findAll({
                            where: {
                                article_id: article.id,
                            },
                            include: [
                                {
                                    model: Author,
                                    required: false,
                                },
                            ],
                        });
                        (categorie as any).dataValues.authors = Authors;
                    }
                }

                if (Object.keys(Categories).length === 0) {
                    throw new NotFoundException('Aucun article trouvé pour les filtres spécifiés.');
                }

                return Categories;

            } else if (author && category) {
                console.log('AUTHOR and CATEGORY');

                const articles = await this.rssModel.sequelize.query(`
                    SELECT 
                        article.*, 
                        author.name AS authorName, 
                        category.name AS categoryName
                    FROM article
                    INNER JOIN article_author 
                        ON article.id = article_author.article_id
                    INNER JOIN article_category 
                        ON article.id = article_category.article_id
                    INNER JOIN author 
                        ON article_author.author_id = author.id
                    INNER JOIN category 
                        ON article_category.category_id = category.id
                    WHERE 
                        article_author.author_id = :authorId AND 
                        article_category.category_id = :categoryId
                `, {
                    replacements: { authorId: author, categoryId: category },
                    model: Rss,
                });

                if (Object.keys(articles).length === 0) {
                    throw new NotFoundException('Aucun article trouvé pour les filtres spécifiés.');
                }

                return articles;
            }
        }

        if (where){
            if (author && !category){
                console.log('AUTHOR & WHERE');
                const Authors = await ArticleAuthor.findAll({
                    include: [
                        {
                            model: Rss,
                            where: where,
                            include: [
                                {
                                    model: Media,
                                    required: false,
                                },
                            ],
                        },
                        {
                            model: Author,
                            required: false,
                        },
                    ],
                    where: { author_id: author },
                });

                for (const auteur of Authors) {
                    const article = await Rss.findOne({
                        where: { id: auteur.article_id },
                    });

                    if (article) {
                        const Categories = await ArticleCategory.findAll({
                            where: {
                                article_id: article.id,
                            },
                            include: [
                                {
                                    model: Category,
                                    required: false,
                                },
                            ],
                        });
                        (auteur as any).dataValues.categories = Categories;
                    }
                }

                if (Object.keys(Authors).length === 0) {
                    throw new NotFoundException('Aucun article trouvé pour les filtres spécifiés.');
                }

                return Authors;

            } else if (category && !author){
                console.log('CATEGORY & WHERE');
                const Categories = await ArticleCategory.findAll({
                    include: [
                        {
                            model: Rss,
                            where: where,
                            include: [
                                {
                                    model: Media,
                                    required: false,
                                },
                            ],
                        },
                        {
                            model: Category,
                            required: false,
                        },
                    ],
                    where: { category_id: category },
                });

                for (const categorie of Categories) {
                    const article = await Rss.findOne({
                        where: { id: categorie.article_id },
                    });

                    if (article) {
                        const Authors = await ArticleAuthor.findAll({
                            where: {
                                article_id: article.id,
                            },
                            include: [
                                {
                                    model: Author,
                                    required: false,
                                },
                            ],
                        });
                        (categorie as any).dataValues.authors = Authors;
                    }
                }

                if (Object.keys(Categories).length === 0) {
                    throw new NotFoundException('Aucun article trouvé pour les filtres spécifiés.');
                }

                return Categories;

            } else if (author && category){
                console.log('WHERE and AUTHOR and CATEGORY');

                let publicationDate : string;

                if (startDate && endDate) {
                    publicationDate = ` article.publicationDate BETWEEN :startDate AND :endDate`;
                } else if (startDate) {
                    publicationDate = ` article.publicationDate >= :startDate`;
                } else if (endDate) {
                    publicationDate = ` article.publicationDate <= :endDate`;
                }

                const articles = await this.rssModel.sequelize.query(`
                SELECT 
                    article.*, 
                    author.name AS authorName, 
                    category.name AS categoryName
                FROM article
                INNER JOIN article_author 
                    ON article.id = article_author.article_id
                INNER JOIN article_category 
                    ON article.id = article_category.article_id
                INNER JOIN author 
                    ON article_author.author_id = author.id
                INNER JOIN category 
                    ON article_category.category_id = category.id
                WHERE
                    article_author.author_id = :authorId AND
                    article_category.category_id = :categoryId AND 
                    ${publicationDate}
            `, {
                    replacements: { authorId: author, categoryId: category, startDate, endDate },
                    model: Rss,
                });

                if (Object.keys(articles).length === 0) {
                    throw new NotFoundException('Aucun article trouvé pour les filtres spécifiés.');
                }

                return articles;
            }
        }
    }

    async findAll(){
        const articles = await Rss.findAll(
            {
                include: [
                    {
                        model: Media,
                        required: false,
                    },
                    {
                        model: Author,
                        required: false,
                    },
                    {
                        model: Category,
                        required: false,
                    }
                ],
            }
        )
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
