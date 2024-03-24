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

    // Tous les jours à 8h
    @Cron('0 8 * * *')
    // Création de la base de données des articles RSS
    async create(): Promise<void> {

        // Suppression des données des tables liées au RSS
        await this.articleAuthorModel.destroy({truncate: true, restartIdentity: true});
        await this.articleCategoryModel.destroy({truncate: true, restartIdentity: true});
        await this.categoryModel.destroy({where: {}, restartIdentity: true});
        await this.authorModel.destroy({where: {}, restartIdentity: true});
        await this.mediaModel.destroy({where: {}, restartIdentity: true});
        await this.rssModel.destroy({where: {}, restartIdentity: true});

        const parser = require('rss-url-parser');

        // Les feed RSS dont on récupère les articles/médias
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

        // Pour chaque flux RSS
        for (const url of rss_feed) {
            console.log('#######################################');
            console.log('##### Chargement du flux : ' + url);
            console.log('#######################################');

            try {
                // Analyse du flux pour récupérer les données
                const data = await parser(url);

                // Pour chaque article
                for (const item of data) {

                    const rssData: any = {};

                    // Extraire les données de l'article
                    rssData.title = item.title ?? undefined;
                    rssData.description = item.description ?? undefined;
                    rssData.publicationDate = item.pubDate ? new Date(item.pubDate) : undefined;
                    rssData.link = item.link ?? undefined;

                    // Si les données existe, création des objet
                    // et enregistrement dans la base de données
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
                            // Association de l'id du média à l'article
                            rssData.media_id = media.id;
                        }

                        // Enregistrement de l'article dans la base de données
                        const rss = await this.rssModel.create(rssData);

                        // Récupération des auteurs
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
                                // Association de l'auteur à l'article
                                await this.articleAuthorModel.create({
                                    article_id: rss.id,
                                    author_id: author.id,
                                });
                            }
                        }

                        // Récupération des catégories de l'article
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

                                    // Association de la catégorie à l'article
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

    // Barre de recherche
    async searchArticles(query: string): Promise<Rss[]> {
        // Vérification si une requête est envoyé
        if (!query) {
            throw new BadRequestException('Aucune recherche envoyée');
        }

        // Recherche des articles dans la base de données
        // en fonction des requêtes de recherche
        // dans 'title' et 'description'
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
            // Récupération des catégories associées à chaque article
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

            // Récupération des auteurs associés à chaque article
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
            // Ajout des catégories et auteurs à chacun des articles
            article.dataValues.categories = Categories;
            article.dataValues.authors = Auteurs;
        }

        if (!articles || articles.length === 0) {
            throw new NotFoundException('Aucun article trouvé pour la recherche spécifiée.');
        }

        return articles;
    }

    // Filtrer les articles en fonction des critères utilisateur
    async filtresArticles(startDate: Date, endDate: Date, author: number, category: number): Promise<any> {
        let where: any = {};

        // Si aucun critère
        if (!startDate && !endDate && !author && !category) {
            console.log('AUCUN PARAMETRE');
            // Retourne tous les articles
            const articles = await this.findAll();
            return articles;
        }

        // Si une date saisie,
        // Construction de la clause WHERE sur la date de publication
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

        // Si au moins une date est saisie mais pas d'auteur ni catégorie
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

        // Si pas de date saisi
        if (Object.keys(where).length === 0) {
            // Filtrer les articles par auteur
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
                    // Associer l'id auteur de la table de jointure à l'id de l'auteur saisi
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
                    let data = {
                        status: 404,
                        message: 'Aucun article trouvé pour les filtres spécifiés.',
                    }

                    return data;
                }

                let RSS = [];
                Authors.forEach(function (author) {
                    RSS.push(author.rss);
                });

                return RSS;

            // Filtrer les articles par categorie
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
                    // Associer l'id category de la table de jointure à l'id de la category saisi
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
                    let data = {
                        status: 404,
                        message: 'Aucun article trouvé pour les filtres spécifiés.',
                    }

                    return data;
                }

                let RSS = [];
                Categories.forEach(function (category) {
                    RSS.push(category.rss)
                });

                return RSS;

            // Filtrer les articles par auteur et category
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
                    let data = {
                        status: 404,
                        message: 'Aucun article trouvé pour les filtres spécifiés.',
                    }

                    return data;
                }
                return articles;
            }
        }

        // Si au moins une date est saisie
        if (where){
            // Filtrer par auteur et date
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
                    // Associer l'id auteur de la table de jointure à l'id de l'auteur saisi
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
                    let data = {
                        status: 404,
                        message: 'Aucun article trouvé pour les filtres spécifiés.',
                    }

                    return data;
                }

                let RSS = [];
                Authors.forEach(function (author) {
                    RSS.push(author.rss);
                });

                return RSS;

            // Filtrer par category et date
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
                    // Associer l'id categorie de la table de jointure à l'id de la categorie saisie
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
                    let data = {
                        status: 404,
                        message: 'Aucun article trouvé pour les filtres spécifiés.',
                    }

                    return data;
                }

                let RSS = [];
                Categories.forEach(function (category) {
                    RSS.push(category.rss);
                });

                return RSS;

            // Filtrer par date, categpry et author
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
                    let data = {
                        status: 404,
                        message: 'Aucun article trouvé pour les filtres spécifiés.',
                    }

                    return data;
                }

                return articles;
            }
        }
    }

    // Récupérer tous les articles
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

    // Récupérer tous les auteurs
    async findAllAuthors(){
        const authors = await Author.findAll();
        if (!authors || authors.length === 0) {
            throw new Error('Aucun auteur trouvé');
        }
        return authors;
    }

    // Récupérer toutes les catégories
    async findAllCategories(){
        const categories = await Category.findAll();
        if (!categories || categories.length === 0) {
            throw new Error('Aucune categorie trouvée');
        }
        return categories;
    }
}
