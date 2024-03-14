import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Rss } from './entities/rss.entity';
import {Op} from "sequelize";
import {ArticleAuthor} from "./entities/article-author.entity";
import {Author} from "./entities/author.entity";
import {Category} from "./entities/category.entity";
import {ArticleCategory} from "./entities/article-category.entity";
import {Media} from "./entities/media.entity";

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

    /*async create(): Promise<void> {
        const parser = require('rss-url-parser');

        const rss_feed = [
            'https://www.youtube.com/feeds/videos.xml?channel_id=UC6Yhg_Phtz-RHX0CBFhU8pA',
            'https://services.lesechos.fr/rss/archeologie.xml',
            'https://www.lemonde.fr/archeologie/rss_full.xml',
            'https://www.lefigaro.fr/rss/figaro_histoire.xml',
            'https://www.sciencesetavenir.fr/archeo-paleo/rss.xml',
            'https://www.inrap.fr/rss.xml',
            'https://archipeldessciences.wordpress.com/category/archeologie/feed/',
            'https://www.cibpl.fr/rubrique/epaves-et-archeologie/epaves-et-archeologie/feed/',
            'https://www.cairn.info/rss/rss_encyclo-histoire.xml',
            'https://histoires-archeologie.lepodcast.fr/rss',
            'https://radiofrance-podcast.net/podcast09/35099478-7c72-4f9e-a6de-1b928400e9e5/rss_10267.xml'
        ];

        for (const url of rss_feed) {
            console.log('#######################################');
            console.log('##### Chargement du flux : ' + url);
            console.log('#######################################');

            try {
                const data = await parser(url);

                for (const item of data) {
                    console.log('#######################################');
                    console.log('Titre : ' + item.title);
                    console.log('Description : ' + item.description);
                    console.log('Date de publication : ' + item.pubDate);
                    console.log('Lien : ' + item.link);

                    const rssData: any = {};

                    rssData.title = item.title ?? undefined;
                    rssData.description = item.description ?? undefined;
                    rssData.publicationDate = item.pubDate ? new Date(item.pubDate) : undefined;
                    rssData.link = item.link ?? undefined;

                    if (Object.keys(rssData).length > 0) {
                        const rss = await this.rssModel.create(rssData);
                        console.log('Enregistrement réussi dans la base de données');

                        // Traiter les auteurs et les associer à l'article RSS
                        if (item.authors && item.authors.length > 0) {
                            for (const authorName of item.authors) {
                                const fullName = authorName; // Supposant que le nom est enregistré comme un nom complet dans le champ name
                                let author = await this.authorModel.findOne({
                                    where: {
                                        name: fullName,
                                    },
                                });

                                if (!author) {
                                    author = await this.authorModel.create({
                                        name: fullName,
                                    });
                                }

                                console.log('Fullname ajouté à la base de données :', fullName);

                               await this.articleAuthorModel.create({
                                    article_id: rss.id,
                                    author_id: author.id,
                                });
                                console.log('Auteur ajouté à la base de données :', author);
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
    }*/

    async create(): Promise<void> {
        const parser = require('rss-url-parser');

        const rss_feed = [
            'https://www.youtube.com/feeds/videos.xml?channel_id=UC6Yhg_Phtz-RHX0CBFhU8pA',
            'https://services.lesechos.fr/rss/archeologie.xml',
            'https://www.lemonde.fr/archeologie/rss_full.xml',
            'https://www.lefigaro.fr/rss/figaro_histoire.xml',
            'https://www.sciencesetavenir.fr/archeo-paleo/rss.xml',
            'https://www.inrap.fr/rss.xml',
            'https://archipeldessciences.wordpress.com/category/archeologie/feed/',
            'https://www.cibpl.fr/rubrique/epaves-et-archeologie/epaves-et-archeologie/feed/',
            'https://www.cairn.info/rss/rss_encyclo-histoire.xml',
            'https://histoires-archeologie.lepodcast.fr/rss',
            'https://radiofrance-podcast.net/podcast09/35099478-7c72-4f9e-a6de-1b928400e9e5/rss_10267.xml'
        ];

        for (const url of rss_feed) {
            console.log('#######################################');
            console.log('##### Chargement du flux : ' + url);
            console.log('#######################################');

            try {
                const data = await parser(url);

                for (const item of data) {
                    /*console.log('#######################################');
                    console.log('Titre : ' + item.title);
                    console.log('Description : ' + item.description);
                    console.log('Date de publication : ' + item.pubDate);
                    console.log('Lien : ' + item.link);*/

                    const rssData: any = {};

                    rssData.title = item.title ?? undefined;
                    rssData.description = item.description ?? undefined;
                    rssData.publicationDate = item.pubDate ? new Date(item.pubDate) : undefined;
                    rssData.link = item.link ?? undefined;

                    if (Object.keys(rssData).length > 0) {
                        const rss = await this.rssModel.create(rssData);
                        console.log('Enregistrement réussi dans la base de données');

                        let liste_auteurs = (item.author !== null && item.author.length !== 0) ? item.author : item.meta.author ;

                        if (liste_auteurs !== null) {
                            if (liste_auteurs.length !== 0) {
                                console.log(" - Auteur : " + liste_auteurs)
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

                                console.log('Auteur ajouté à la base de données :', liste_auteurs);

                                await this.articleAuthorModel.create({
                                    article_id: rss.id,
                                    author_id: author.id,
                                });
                                console.log('Auteur lié à l\'article dans la base de données');
                            }
                        }

                        let liste_categories = (item.categories.length !== 0 ? item.categories : item.meta.categories) ;

                        if (liste_categories !== null) {
                            if (liste_categories.length !== 0) {
                                for (let i = 0; i < liste_categories.length; i++) {
                                    console.log(" - Catégories : " + liste_categories[i])
                                    let category = await this.categoryModel.findOne({
                                        where: {
                                            name: liste_categories,
                                        },
                                    });

                                    if (!category) {
                                        category = await this.categoryModel.create({
                                            name: liste_categories,
                                        });
                                    }

                                    console.log('Auteur ajouté à la base de données :', liste_categories);

                                    await this.articleCategoryModel.create({
                                        article_id: rss.id,
                                        category_id: category.id,
                                    });
                                    console.log('Category lié à l\'article dans la base de données');
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
        });

        if (!articles || articles.length === 0) {
            throw new NotFoundException('Aucun article trouvé pour la recherche spécifiée.');
        }

        return articles;
    }
}