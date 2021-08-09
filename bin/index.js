#! /usr/bin/env node

require( 'dotenv' ).config()
const yargs = require( 'yargs' );
const axios = require( 'axios' );
const chalk = require( 'chalk' );
const log = console.log;

const { 
    generateSummary,
    formatTerminalOutput,
    generateHtmlPost
} = require('./utils');

const wpcom = require( 'wpcom' )( process.env.WP_API_ACCOUNT_TOKEN );
const P2_SITE = 'team51validator.wordpress.com';

yargs.usage( "\nUsage: t51check URL to be validated" ).help( true ).argv;
const params = yargs.argv._; // URL (and other arguments if required in the future)
const siteURL = params[ 0 ];
const save = yargs.argv.save; // --save argument

const w3cURL = `https://validator.w3.org/nu/?doc=${ siteURL }&out=json`;

/**
 * Initial API Request
 */
( async function () {
    // Pull data from w3.org
    const { data } = await axios( {
        method: 'GET',
        url: w3cURL,
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.101 Safari/537.36',
            'Content-Type': 'text/html; charset=UTF-8'
        }
    } );

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
            content: generateHtmlPost( summary )
        }

        //console.log( postData );

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
