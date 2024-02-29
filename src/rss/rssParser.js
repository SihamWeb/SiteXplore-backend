let Parser = require('rss-parser');
let parser = new Parser();

(async () => {

    const parser = require('rss-url-parser')

    var rss_feed =
        [
            'https://www.inrap.fr/rss.xml',
            'https://www.lefigaro.fr/rss/figaro_histoire.xml',
            'https://www.lemonde.fr/archeologie/rss_full.xml',
            'https://www.sciencesetavenir.fr/archeo-paleo/rss.xml',
            'https://services.lesechos.fr/rss/archeologie.xml',
            'https://archipeldessciences.wordpress.com/category/archeologie/feed/',
            'https://www.cibpl.fr/rubrique/epaves-et-archeologie/epaves-et-archeologie/feed/',
            'https://www.cairn.info/rss/rss_encyclo-histoire.xml',
            'https://histoires-archeologie.lepodcast.fr/rss',
            'https://radiofrance-podcast.net/podcast09/35099478-7c72-4f9e-a6de-1b928400e9e5/rss_10267.xml',
            'https://www.youtube.com/feeds/videos.xml?channel_id=UC6Yhg_Phtz-RHX0CBFhU8pA'
        ]

    for (let r = 0; r < rss_feed.length; r++) {

        console.log('#######################################')
        console.log('##### Chargement du flux : ' + rss_feed[r]);
        console.log('#######################################')

        const data = await parser(rss_feed[r]);

        data.forEach((item) => {
            console.log('#######################################')

            var param = ['title', 'description', 'author', 'pubDate', 'link', 'copyright'];
            for (let i = 0; i < param.length; i++) {
                if (item[param[i]]) {
                    console.log(' - ' + param[i] + ' : ' + item[param[i]]);
                }
            }

            // Image miniature youtube
            if (item.image) {
                console.log(item.image) ;
            }

            // Image (ou media audio) enclosure
            if (item['rss:enclosure']) {
                console.log(item['rss:enclosure']['@']['url'])
            }

            // Media content
             else if (item['media:content']) {
                var image = ['media:description', 'media:credit', '@'];
                for (let i = 0; i < image.length; i++) {
                    if (item['media:content'][image[i]]) {
                        if (image[i] === '@') {
                            console.log(image[i] + ' : ' + item['media:content'][image[i]].url);
                        } else {
                            console.log(image[i] + ' : ' + item['media:content'][image[i]]['#']);
                        }
                    }
                }
            }
        });
    }
})();
