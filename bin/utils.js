const chalk = require( 'chalk' );

/**
 * Generates the text version for the Terminal
 * 
 * @param {*} summary 
 */
exports.formatTerminalOutput = ( summary ) => {
    const chalk = require( 'chalk' );
    const log = console.log;
    log( chalk.bold( `There are ${ summary.error.type_count } errors and ${ summary.info.type_count } info warnings\n` ) );

    log( chalk.bgRed( 'Errors\n' ) );
    Object.keys( summary.error.messages ).forEach( ( key ) => {
        log( chalk.underline( `${ summary.error.messages[ key ].message_count } findings` ) + ` for: ${ chalk.italic( key ) } \n ${ chalk.italic.dim( summary.error.messages[ key ].code_sample ) }\n` );
    } )

    log( chalk.bgYellow( 'Warnings/Info\n' ) );
    Object.keys( summary.info.messages ).forEach( ( key ) => {
        log( chalk.underline( `${ summary.info.messages[ key ].message_count } findings` ) + ` for: ${ chalk.italic( key ) } \n ${ chalk.italic.dim( summary.info.messages[ key ].code_sample ) }\n` );
    } )
}

/**
* Formats the W3C validator response into a summary object, that categorizes
* the data into error or info, and counts how many individual messages there
* are in each category. Also appends a code sample for each error.
* 
* @param {*} data 
* @returns {*} summary 
*/
exports.generateSummary = ( data ) => {
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
 exports.generateHtmlPost = ( summary ) => {
    let htmlData = '';
    
    htmlData += `<pre class="wp-block-verse">There are ${ summary.error.type_count } errors and ${ summary.info.type_count } info warnings</pre>`; 
    htmlData += '<h2>Errors</h2>';
    htmlData += generateChart(summary.error);
    htmlData += '<ul>';
    Object.keys( summary.error.messages ).forEach( ( key, index ) => {
        const error_message = summary.error.messages[ key ];
        htmlData += `<li>${ error_message.message_count } findings for: ${ key }
                        <ul><li><em>eg: ${ encodeHtmlEntities(error_message.code_sample)}</em></li></ul>
                    </li>`;
    } );
    htmlData += '</ul>';

    htmlData += '<h2>Warnings/Info</h2>';
    htmlData += generateChart(summary.info);
    htmlData += '<ul>';
    Object.keys( summary.info.messages ).forEach( ( key ) => {
        htmlData += `<li>
                        ${ summary.info.messages[ key ].message_count } findings for: ${ key }
                        <ul><li>eg: ${ encodeHtmlEntities(summary.info.messages[ key ].code_sample) }</li></ul>
                    </li>`;
    } );
    htmlData += '</ul>';

    return htmlData;
}

/**
 * Private function
 * Utility function to convert HTML tags in a way WP Editor will output correctly
 * @param {*} string 
 * @returns 
 */
 encodeHtmlEntities = ( string ) => {
    return string.replace( /[\u00A0-\u9999<>\&]/g, ( i ) => {
        return '&#' + i.charCodeAt( 0 ) + ';'
    } );
}

/**
 * Private function
 * Generates an HTML chart for P2 post
 */
function generateChart( data ) {
    const messages = data.messages;
    const chart_colors = [ 'darksalmon', 'moccasin', 'thistle', 'skyblue' ];
    
    let tempHtmlChart = '';
    tempHtmlChart = '<div style="display:flex; height:26px; text-align:center; color:#333; font-size:0.9rem; margin-bottom:1rem;">';
    Object.keys( messages ).forEach( ( key, index ) => {
        const chart_up_to = 3;
        const message_count = messages[ key ].message_count;
        const percetage = Math.ceil(message_count / data.type_count * 100);
        const bar_bg_color = chart_colors[ ( index < chart_up_to ? index : chart_up_to ) ];
        const bar_title = ( index < chart_up_to ? key : 'Other' );
        const bar_value = ( index <= chart_up_to ? `${percetage}%` : '' );

        // not rendered yet on screen, just storing value from the loop
        tempHtmlChart += `<div title="${bar_title}" style="width:${percetage}%; background:${bar_bg_color};">${bar_value}</div>`; 
    });
    tempHtmlChart += '</div>';
    return tempHtmlChart;
}
