import { Mongo } from 'meteor/mongo'

const puppeteer = require('puppeteer')

const seoContent = new Mongo.Collection('seoContent')

if (Picker) { // compatibility with iron router
    const SeoRouter = Picker.filter((request, response) => {
        // from prerender.io
        let botAgents = [
            /googlebot/i,
            /yahoo/i,
            /bingbot/i,
            /baiduspider/i,
            /facebookexternalhit/i,
            /twitterbot/i,
            /rogerbot/i,
            /linkedinbot/i,
            /embedly/i,
            /quora link preview/i,
            /showyoubot/i,
            /outbrain/i,
            /pinterest\/0./i,
            /developers.google.com\/+\/web\/snippet/i,
            /slackbot/i,
            /vkShare/i,
            /W3C_Validator/i,
            /redditbot/i,
            /Applebot/i,
            /WhatsApp/i,
            /flipboard/i,
            /tumblr/i,
            /bitlybot/i,
            /SkypeUriPreview/i,
            /nuzzel/i,
            /Discordbot/i,
            /Google Page Speed/i,
            /Qwantify/i,
            /pinterestbot/
        ]

        return /escaped_fragment/.test(request.url) || botAgents.some(i => i.test(request.headers['user-agent']))
    })

    const handler = async (params, request, response) => {
        request.url = request.url.substr(1)

        let content = seoContent.findOne({
            env: Meteor.isProduction ? 'prod' : 'dev',
            name: `${request.url.replace(/\//ig, '-').split('?')[0]}`
        })

        let html = ''
        
        let t = new Date()
        t.setDate(t.getDate() - 7) // 7 days old

        if (!content || !content.date || new Date(content.date) < t || !content.html) {
            html = await fetcher(request.url.split('?')[0])

            seoContent.upsert({
                name: `${request.url.replace(/\//ig, '-').split('?')[0]}`,
                env: Meteor.isProduction ? 'prod' : 'dev'
            }, {
                $set: {
                    html: html,
                    date: new Date().getTime()
                }
            })
        } else {
            html = content.html
        }

        response.setHeader('Content-Type', 'text/html;charset=utf-8');
        response.end(html)
    }

    const fetcher = (async (url, waitElem) => {
        const browser = await puppeteer.launch({ args: [ '--no-sandbox', '--disable-setuid-sandbox' ] })

        const page = await browser.newPage()
        await page.goto(Meteor.absoluteUrl(url), {
            waitUntil: 'load'
        })

        await page.waitFor(waitElem || 'footer')
        html = await page.evaluate(() => document.documentElement.outerHTML)

        await browser.close()

        return html
    })

    // Add SEO critical routes here
    // currency page
    SeoRouter.route('/currency/:slug', handler)

    // home route
    SeoRouter.route('/', handler)
    SeoRouter.route('/home', handler)

    // compare currencies
    SeoRouter.route('/compareCurrencies', handler)

    // problems page
    SeoRouter.route('/problems', handler)
    SeoRouter.route('/problem/:slug', handler)

    // bounties
    SeoRouter.route('/bounties', handler)
}