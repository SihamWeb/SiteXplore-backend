let Parser = require('rss-parser');
let parser = new Parser();

(async () => {

    let feed = await parser.parseURL('https://www.lefigaro.fr/rss/figaro_histoire.xml');
    /*console.log(feed.title);*/

    const mediaUrls = [];
    feed.items.forEach(item => {
        console.log(item['media:content'][0]['media:description'][0]);
    });

})();
