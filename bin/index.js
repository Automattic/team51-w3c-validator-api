#! /usr/bin/env node

require( 'dotenv' ).config()
const yargs = require( "yargs" );
const axios = require( 'axios' );

const wpcom = require( 'wpcom' )( process.env.WP_API_ACCOUNT_TOKEN );

yargs.usage( "\nUsage: t51check URL to be validated" ).help( true ).argv;

const params = yargs.argv._;
const save = yargs.argv.save;

const P2_SITE = 'team51validator.wordpress.com';

const siteURL = params[ 0 ];
const w3cURL = `https://validator.w3.org/nu/?doc=${ siteURL }&out=json`;


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

    // Post to P2 or show inline
    if ( !save ) {
        console.log( "Summary: ", summary );
        console.log( "Running the command with --save argument will pipe this results to the team51validator P2" );
    } else {

        const htmlData = generateHtmlPost( summary );

        const postData = {
            title: `Check for: ${ siteURL }`,
            tags: [],
            content: htmlData
        }

        //console.log( P2_SITE );
        wpcom.site( P2_SITE )
            .addPost( postData, function ( err, post ) {
                if ( err ) {
                    console.log( "Oops, something went wrong.", err );
                } else {
                    console.log( "P2 entry created! Visit", post.short_URL );
                }
            } );

    }

} )();

/**
 * Formats the W3C validator response into a summary object, that categorizes
 * the data into error or info, and counts how many individual messages there
 * are in each category. Also appends a code sample for each error.
 * 
 * @param {*} data 
 * @returns {*} summary 
 */
function generateSummary ( data ) {
    const summary = [];

    data.messages.forEach( msg => {
        // Type could be 'info' or 'error'
        if ( !summary[ msg.type ] ) {
            summary[ msg.type ] = { type_count: 0, messages: {} };
        }

        summary[ msg.type ].type_count++;

        // Cumulative for this specific message
        if ( !summary[ msg.type ].messages[ msg.message ] ) {
            summary[ msg.type ].messages[ msg.message ] = {
                message_count: 0,
                code_sample: msg.extract
            };
        }
        summary[ msg.type ].messages[ msg.message ].message_count++;
    } );

    // Sort summary object by number of messages
    summary.info.messages = Object.keys( summary.info.messages )
        .sort( ( a, b ) => summary.info.messages[ b ].message_count - summary.info.messages[ a ].message_count )
        .reduce( ( _sortedObj, key ) => ( { ..._sortedObj, [ key ]: summary.info.messages[ key ] } ), {} );

    summary.error.messages = Object.keys( summary.error.messages )
        .sort( ( a, b ) => summary.error.messages[ b ].message_count - summary.error.messages[ a ].message_count )
        .reduce( ( _sortedObj, key ) => ( { ..._sortedObj, [ key ]: summary.error.messages[ key ] } ), {} );

    return summary;
}

/**
 * Generates the HTML for the WordPress P2 post
 * 
 * @param {*} summary 
 */
function generateHtmlPost ( summary ) {
    let htmlData = `<pre class="wp-block-verse">There are ${ summary.error.type_count } errors and ${ summary.info.type_count } info warnings</pre>`;

    htmlData += '<h2>Errors</h2>';
    htmlData += '<ul>';
    Object.keys( summary.error.messages ).forEach( ( key ) => {
        htmlData += `<li>${ summary.error.messages[ key ].message_count } findings for: ${ key }
                        <ul><li>eg: ${ summary.error.messages[ key ].code_sample.replace( /[\u00A0-\u9999<>\&]/g, ( i ) => {
            return '&#' + i.charCodeAt( 0 ) + ';';
        } ) }</li></ul></li>`;
    } )
    htmlData += '</ul>';

    htmlData += '<h2>Warnings/Info</h2>';
    htmlData += '<ul>';
    Object.keys( summary.info.messages ).forEach( ( key ) => {
        htmlData += `<li>
                        ${ summary.info.messages[ key ].message_count } findings for: ${ key }
                        <ul><li>eg: ${ summary.info.messages[ key ].code_sample.replace( /[\u00A0-\u9999<>\&]/g, ( i ) => {
            return '&#' + i.charCodeAt( 0 ) + ';';
        } ) }</li></ul>
                    </li>`;
    } )
    htmlData += '</ul>';

    return htmlData;
}