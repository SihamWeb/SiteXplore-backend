import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Rss } from './entities/rss.entity';
import {Op} from "sequelize";

@Injectable()
export class RssService {
    constructor(
        @InjectModel(Rss)
        private rssModel: typeof Rss
    ) {}

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
                    console.log('#######################################');
                    console.log('Titre : ' + item.title);
                    console.log('Description : ' + item.description);
                    console.log('Date de publication : ' + item.pubDate);
                    console.log('Lien : ' + item.link);

                    await Rss.create({
                        title: item.title,
                        description: item.description,
                        publicationDate: new Date(item.pubDate),
                        link: item.link,
                    });

                    console.log('Enregistrement réussie dans la base de données');
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
