import { WebApp } from 'meteor/webapp';
import { Currencies } from '/imports/api/coins/currencies.js'

const serverRendering = (req, res, next) => {
    try {

        const ua = req.headers['user-agent'];
        const pathName = req._parsedUrl.pathname;
      if (/bot|WhatsApp|facebook|twitter|pinterest|google|baidu|bing|msn|duckduckgo|teoma|slurp|yandex/i.test(ua)) {

            // Send any non matches forward
            if (!pathName.includes('/currency')) {
                next();
            }

            var parts = req.url.split("/")

            let currency = Currencies.findOne({
                slug: parts[2]
            })

            let count = Currencies.find({
                slug: parts[2]
            }).count();

            let meteorURL = 'https://blockrazor.org/' + parts[2]

            if(count){

            // Fetch the data you need to build your tags (and htmlContent)
            const html = `
            <!DOCTYPE html>
        <!html>
        <head>
          <title>BlockRazor</title>
          <meta name="description" content="Absolutely all information about every blockchain project, presented in a way that anyone can understand." />
          <meta property="og:type" content="website"/>
          <meta property="og:title" content="BlockRazor - ${currency.currencyName}"/>
          <meta property="og:description" content="Absolutely all information about every blockchain project, presented in a way that anyone can understand."/>
          <meta property="og:site_name" content="Saven"/>
          <meta property="og:url" content="${meteorURL}"/>
        </head>
        <body>
          Hello Bot, plz index us!
        </body>
        </html>
      `;
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html');
            res.end(html);
        }else{
            console.log('can not get any content for some unknown reason, plz investigate : ( ')
        }

        } else {

            next();
        }
    } catch (err) {
        console.log(err);
    }
}

// attach the handler to webapp
WebApp.connectHandlers.use(serverRendering);