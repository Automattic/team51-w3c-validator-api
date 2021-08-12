#! /usr/bin/env node

require( 'dotenv' ).config()
const yargs = require( 'yargs' );
const axios = require( 'axios' );
const chalk = require( 'chalk' );
const log = console.log;

const { 
    generateSummary,
    formatTerminalOutput,
    generateHtmlPost,
    scrapLinks
} = require('./utils');

const wpcom = require( 'wpcom' )( process.env.WP_API_ACCOUNT_TOKEN );
const P2_SITE = 'team51validator.wordpress.com';

yargs.usage( "\nUsage: t51check URL to be validated" ).help( true ).argv;
const params = yargs.argv._; // URL (and other arguments if required in the future)
const siteURL = params[ 0 ];
const save = yargs.argv.save; // --save argument
const crawl = yargs.argv.crawl; // --save argument

/**
 * Initial API Request
 */
( async function () {
    // Scrap given URL to include in inspectURLs
    let inspectURLs = [ siteURL ];
    if ( crawl ) {
        await scrapLinks(siteURL)
            .then(({ data, response }) => {
                let limit = typeof crawl === 'number' ? true : false;
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
                        if ( limit && (inspectURLs.length >= crawl) ) {
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

    // --save will pipe the summary to the P2 blog
    if ( !save ) {
        formatTerminalOutput( summary );
        log( "Running the command with --save argument will pipe this results to the team51validator P2" );
    
    // otherwise we just print the data in the terminal
    } else {
        const postData = {
            title: `Check for: ${ siteURL }`,
            tags: [],
            content: generateHtmlPost( summary, inspectURLs )
        }

        wpcom.site( P2_SITE )
            .addPost( postData, function ( err, post ) {
                if ( err ) {
                    log( chalk.bgRed( 'Oops, something went wrong when creating the P2 post\nPlease try again. If the problem persists you can always run the command without --save to view the results in the Terminal\n' ), err );
                } else {
                    log( chalk.bgGreen( "P2 entry created! Visit:" ), post.short_URL );
                }
            } );

    }

} )();
