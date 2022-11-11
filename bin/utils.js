const chalk = require( 'chalk' );
const scrapeIt = require("scrape-it")

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
   const summary = {
       info : { type_count: 0, messages: {} },
       error : { type_count: 0, messages: {} }
   };

   data.messages.forEach( msg => {
       // Type would typically be 'info' or 'error'
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
 * @param {string} inspectURLs[]
 */
 exports.generateHtmlPost = ( summary, inspectURLs ) => {
    let htmlData = '';
    
    htmlData += `<p>The following URLs were inspected:</p>`; 
    htmlData += `<ul class="t51-w3c-urls">`; 
    htmlData += inspectURLs.map( item => `<li>${item}</li>` ).join("");
    htmlData += `</ul>`; 
    htmlData += `<p class="t51-w3c-summary">${ summary.error.type_count } errors and ${ summary.info.type_count } info warnings were encountered.</p>`; 
    htmlData += '<h2>Errors</h2>';
    htmlData += '<details>';
    htmlData += `<summary class="t51-w3c-errors-summary">View ${summary.error.type_count} errors</summary>`;
    htmlData += '<ul class="t51-w3c-errors-list">';
    Object.keys( summary.error.messages ).forEach( ( key, index ) => {
        const error_message = summary.error.messages[ key ];
        htmlData += `<li class="t51-w3c-error-item">
                        <span class="t51-w3c-error-item-count">${ error_message.message_count }</span> findings for: 
                        <span class="t51-w3c-error-item-msg">${ key }</span>
                        <ul class="t51-w3c-error-item-examples"><li><code style="font-size: 0.75rem;">${ encodeHtmlEntities(error_message.code_sample)}</code></li></ul>
                    </li>`;
    } );
    htmlData += '</ul>';
    htmlData += '</details>';


    htmlData += '<h2>Warnings/Info</h2>';
    htmlData += '<details>';
    htmlData += `<summary class="t51-w3c-warnings-summary">View ${summary.info.type_count} warnings</summary>`;
    htmlData += '<ul class="t51-w3c-warnings-list">';
    Object.keys( summary.info.messages ).forEach( ( key ) => {
        htmlData += `<li class="t51-w3c-error-item">
                        <span class="t51-w3c-warning-item-count">${ summary.info.messages[ key ].message_count }</span> findings for: 
                        <span class="t51-w3c-warning-item-msg">${ key }</span>
                        <ul class="t51-w3c-warning-item-examples"><li><code style="font-size: 0.75rem;">${ encodeHtmlEntities(summary.info.messages[ key ].code_sample) }</code></li></ul>
                    </li>`;
    } );
    htmlData += '</ul>';
    htmlData += '</details>';

    return htmlData;
}

/**
 * Scraps all the a[href] in a given URL
 * @param {string} url 
 * @returns object with an  array of links
 */
exports.scrapLinks = ( url ) => {
    return scrapeIt(url, {
        links: {
            listItem: "a",
            data: {
                href: {
                    attr: "href"
                }
            }
        }
    });
}

/**
 * Returns a list of tags for the P2 post
 * @param {string} url
 * @returns array of strings
 */
exports.tagsForP2Post = ( url ) => {
    const tag = "t51w3c-" + url
        .toLowerCase()
        .replace(/^https?\:\/\//i, "")
        .replace("www.", "")
        .replace(/\//g,'-')
        .replace(/\./g,'-')
        .replace(/ /g,'-')
        .replace(/[^\w-]+/g,'')
        .replace(/-$/, '');
     return ['t51w3c', tag ];
}

/**
 * Private function
 * Utility function to convert HTML tags in a way WP Editor will output correctly
 * @param {*} string 
 * @returns 
 */
 encodeHtmlEntities = ( string ) => {
    if ( !string ) {
        return '';
    }
    return string
        .replace( /[\u00A0-\u9999<>\&]/g, ( i ) => {
            return '&#' + i.charCodeAt( 0 ) + ';'
        } )
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/\n/g, "<br />");
}

/**
 * Private function
 * Generates an HTML chart for P2 post
 */
function generateChart( data ) {
    const messages = data.messages;
    const chart_colors = [ 'darksalmon', 'moccasin' ];
    let current_color_index;
    
    let tempHtmlChart = '';
    tempHtmlChart = '<div style="display:flex; height:26px; text-align:center; color:#333; font-size:0.9rem; margin-bottom:1rem;">';
    let other_percentage = 0;
    Object.keys( messages ).forEach( ( key, index ) => {
        current_color_index = index < chart_colors.length ? index : 0;

        const bar_bg_color = chart_colors[current_color_index];
        const message_count = parseInt(messages[ key ].message_count);
        const percentage = parseFloat(message_count / parseInt(data.type_count) * 100).toFixed(1);
        const bar_title = key;
        const bar_value = `${percentage}%`;
        
        if ( percentage > 5 ) {
            // not rendered yet on screen, just storing value from the loop
            tempHtmlChart += `<div title="${bar_title}" style="width:${percentage}%; background:${bar_bg_color};">${bar_value}</div>`; 
        } else {
            other_percentage += parseFloat(percentage);
        }
    });
    if ( other_percentage ) {
        other_percentage = other_percentage.toFixed(1);
        tempHtmlChart += `<div title="Other" style="width:${other_percentage}%; background:#aaa;">${other_percentage}%</div>`; 
    }
    tempHtmlChart += '</div>';

    return tempHtmlChart;
}
