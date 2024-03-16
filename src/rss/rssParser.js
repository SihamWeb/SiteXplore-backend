var Split = require('split.js') ;
var typeOf = require('typeof');

// let parser = new Parser();

(async () => {

    const parser = require('rss-url-parser')

    var rss_feed =
        [
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
        ]

    for (let r = 0; r < rss_feed.length; r++) {

        console.log('#######################################')
        console.log('##### Chargement du flux : ' + rss_feed[r]);
        console.log('#######################################')

        const data = await parser(rss_feed[r])

        data.forEach((item) => {
            console.log('#######################################');

            // Auteurs
           /* let liste_auteurs = (item.author !== null && item.author.length !== 0) ? item.author : item.meta.author ;

            if (liste_auteurs !== null) {
                if (liste_auteurs.length !== 0) {
                    console.log(" - Auteur : " + liste_auteurs)
                }
            }

            // Categories
            let liste_categories = (item.categories.length !== 0 ? item.categories : item.meta.categories) ;

            if (liste_categories !== null) {
                if (liste_categories.length !== 0) {
                    for (let i = 0; i < liste_categories.length; i++) {
                        console.log(" - Catégories : " + liste_categories[i])
                    }
                }
            }

                        let param = ['title', 'description', 'pubDate', 'link', 'copyright'];
                        for (let i = 0; i < param.length; i++) {
                             console.log((item[param[i]]) ? (' - ' + param[i] + ' : ' + item[param[i]]) : '');
                        }

                        // Image miniature youtube
                        (item.image.url) ? console.log(" - Image : " + item.image.url) : console.log('') ;

                        // Image (ou media audio) enclosure
                        (item['rss:enclosure']) ? console.log(" - URL media : " + (item['rss:enclosure']['@']['url'])) : console.log('') ;*/

                        // Media content
                         if (item['media:content']) {
                            console.log(item['media:content']['@'] ? item['media:content']['@'].url : '');
                            console.log (item['media:content']['media:description'] ? item['media:content']['media:description']['#'] : '');
                            console.log (item['media:content']['media:credit'] ? item['media:content']['media:credit']['#'] : '');
                         }

        });
    }
})();
