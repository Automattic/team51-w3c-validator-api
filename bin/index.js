#! /usr/bin/env node

require( 'dotenv' ).config()
const yargs = require( "yargs" );
const axios = require( 'axios' );

const wpcom = require( 'wpcom' )( process.env.WP_API_ACCOUNT_TOKEN );

yargs.usage( "\nUsage: t51check URL to be validated" ).help( true ).argv;

const params = yargs.argv._;
const save = yargs.argv.save;

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
    const summary = [];
    data.messages.forEach( i => {
        if ( !summary[ i.type ] ) {
            summary[ i.type ] = { count: 0, messages: {} };
        }

        summary[ i.type ].count++;

        if ( !summary[ i.type ].messages[ i.message ] ) {
            summary[ i.type ].messages[ i.message ] = 0;
        }
        summary[ i.type ].messages[ i.message ]++;
    } );

    // Sort summary object
    summary.info.messages = Object.keys( summary.info.messages )
        .sort( ( a, b ) => summary.info.messages[ b ] - summary.info.messages[ a ] )
        .reduce( ( _sortedObj, key ) => ( { ..._sortedObj, [ key ]: summary.info.messages[ key ] } ), {} );

    summary.error.messages = Object.keys( summary.error.messages )
        .sort( ( a, b ) => summary.error.messages[ b ] - summary.error.messages[ a ] )
        .reduce( ( _sortedObj, key ) => ( { ..._sortedObj, [ key ]: summary.error.messages[ key ] } ), {} );


    // Post to P2 or show inline
    if ( !save ) {
        console.log( "Summary: ", summary );
        console.log( "Running the command with --save argument will pipe this results to the team51validator P2" );
    } else {
        const p2 = 'team51validator.wordpress.com';

        let htmlData = `<pre class="wp-block-verse">There are ${ summary.error.count } errors and ${ summary.info.count } info warnings</pre>`;

        htmlData += '<h2>Errors</h2>';
        htmlData += '<ul>';
        Object.keys( summary.error.messages ).forEach( ( key ) => {
            htmlData += `<li>${ summary.error.messages[ key ] } findings for: ${ key }</li>`;
        } )
        htmlData += '</ul>';

        htmlData += '<h2>Warnings</h2>';
        htmlData += '<ul>';
        Object.keys( summary.info.messages ).forEach( ( key ) => {
            htmlData += `<li>${ summary.info.messages[ key ] } findings for: ${ key }</li>`;
        } )
        htmlData += '</ul>';

        const postData = {
            title: `Check for: ${ siteURL }`,
            tags: [],
            content: htmlData
        }

        wpcom.site( p2 )
            .addPost( postData, function ( err, post ) {
                if ( err ) {
                    console.log( "Oops, something went wrong.", err );
                } else {
                    console.log( "P2 entry created! Visit", post.short_URL );
                }
            } );

    }

} )();