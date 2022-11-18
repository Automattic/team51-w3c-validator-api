const express = require("express");
const axios = require( 'axios' );

const app = express();
const log = console.log;

const { 
    generateSummary,
    tagsForP2Post,
    generateHtmlPost,
    scrapLinks
} = require('./bin/utils');

app.listen(3000, () => {
    log("Server running on port 3000");
});

app.get("/evaluate", (req, res, next) => {
    const url = req.query.url;
    const output = req.query.output || 'html';
    const crawl = req.query.crawl || false;

    if ( ! url ) {
        res.json("Provide a URL");
    }

    //log( `Evaluating ${url}. Crawl: ${crawl}` );
    ( async function () {
        try {
            // Scrap given URL to include in inspectURLs
            let inspectURLs = [ url ];
            if ( crawl ) {
                await scrapLinks(url)
                    .then(({ data, response }) => {
                        let limit = isNaN(crawl) ? false : true;
                        if ( response.statusCode === 200 ) {
                            for (let i = 0; i < data.links.length; i++) {
                                const url = data.links[i].href.replace(/\/$/, ""); // remove trailing slash
                                if ( inspectURLs.includes( url ) ) {
                                    continue;
                                }
                                // Verify it's actually a URL
                                if ( url.indexOf('http') !== 0 ) {
                                    // TODO: support relative paths
                                    continue;
                                }
                                if ( limit && (inspectURLs.length >= parseInt(crawl)) ) {
                                    break;
                                }
                                    
                                inspectURLs.push( url );
                                
                            }
                        }
                    });
            }
        
            // Remove duplicates
            inspectURLs = Array.from(new Set(inspectURLs));
        
            log('Evaluating these URLs:', inspectURLs);
        
            // Pull data from w3.org
            const inspectURLPromises = [];
            inspectURLs.forEach( url => {
                inspectURLPromises.push(
                    axios( {
                        method: 'GET',
                        url: `https://validator.w3.org/nu/?doc=${ url }&out=json`,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.101 Safari/537.36',
                            'Content-Type': 'text/html; charset=UTF-8'
                        }
                    } )
                );
            } );
        
            let responses = await axios.all(inspectURLPromises);
            const data = {
                messages : responses.map( response => response.data.messages ).flat()
            }
        
            // Process data to create a summary object
            const summary = generateSummary( data );

            if ( output === 'json' ) {
                res.json( summary );
                return;
            }

            const postData = {
                title: `HTML Validator | ${ url } | ${ summary.error.type_count  } errors`,
                tags: tagsForP2Post( url ),
                content: generateHtmlPost( summary, inspectURLs )
            }
        
            res.json( postData );
            
        } catch (error) {
            const postErrData = {
                title: `HTML Validator | ${ url }`,
                tags: tagsForP2Post( url ),
                content: `Oops. Something went wrong: ${error.message}`
            }
            res.json( postErrData );
        }
      
    } )();
});