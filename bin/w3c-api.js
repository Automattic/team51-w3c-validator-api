import axios from 'axios';

/**
 * Validate one or more URLs using the W3C API.
 *
 * @param 	{string|Array<string>}	URLs	One or more URLs to validate.
 *
 * @return 	{Promise<object[]>}
 */
export async function callHtmlValidator( URLs ) {
	URLs = Array.isArray( URLs ) ? URLs : [ URLs ]; // Convert to array.
	URLs = Array.from( new Set( URLs ) ); // Remove duplicates.

	// TODO: If the number of URLs is high, we can end up with 429 responses. We need a way to throttle the requests.
	return axios.all(
		URLs.map( ( URL ) => {
			return axios( {
				method: 'GET',
				url: `https://validator.w3.org/nu/?doc=${ URL }&out=json`,
				headers: {
					'User-Agent':
						'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.101 Safari/537.36',
					'Content-Type': 'text/html; charset=UTF-8',
				},
			} );
		} )
	);
}

/**
 * Parses the response from the W3C API and returns an array of messages.
 *
 * @param 	{object}	response
 *
 * @return 	{object[]}
 */
export function parseValidatorResponse( response ) {
	if ( 200 !== response.status ) {
		throw new Error( `Invalid W3C response status ${ response.status }.` );
	}

	return response.data.messages;
}

/**
 * Formats the W3C validator response into a summary object, that categorizes
 * the data into error or info, and counts how many individual messages there
 * are in each category. Also appends a code sample for each error.
 *
 * @link	https://github.com/validator/validator/wiki/Output-%C2%BB-JSON
 *
 * @param 	{object[]}	messages
 *
 * @return 	{object}
 */
export function compileValidatorSummary( messages ) {
	// According to the specs, there are only three types: info, error, and non-document-error.
	const summary = {
		error: {
			count: 0,
			fatal: {
				count: 0,
				messages: {},
			},
			other: {
				count: 0,
				messages: {},
			},
		},
		info: {
			count: 0,
			warning: {
				count: 0,
				messages: {},
			},
			other: {
				count: 0,
				messages: {},
			},
		},
		'non-document-error': {
			count: 0,
			io: {
				count: 0,
				messages: {},
			},
			schema: {
				count: 0,
				messages: {},
			},
			internal: {
				count: 0,
				messages: {},
			},
			other: {
				count: 0,
				messages: {},
			},
		},
	};

	messages.forEach( ( message ) => {
		if ( ! summary[ message.type ] ) {
			throw new Error( `Unknown W3C message type: ${ message.type }` );
		}

		summary[ message.type ].count++;

		// Only the `type` key is mandatory, the rest are optional.
		const type = message.type,
			subtype = message[ 'subtype' ] || 'other';
		summary[ type ][ subtype ].count++;

		if ( message[ 'message' ] ) {
			if ( ! summary[ type ][ subtype ].messages[ message.message ] ) {
				summary[ type ][ subtype ].messages[ message.message ] = {
					count: 0,
					extracts: [],
				};
			}

			summary[ type ][ subtype ].messages[ message.message ].count++;
			if ( message[ 'extract' ] ) {
				summary[ type ][ subtype ].messages[
					message.message
				].extracts.push( message[ 'extract' ] );
			}
		}
	} );

	// Sort summary object by number of messages.
	for ( const type of Object.keys( summary ) ) {
		for ( const subtype of Object.keys( summary[ type ] ) ) {
			if ( ! summary[ type ][ subtype ][ 'messages' ] ) {
				continue;
			}

			summary[ type ][ subtype ].messages = Object.keys(
				summary[ type ][ subtype ].messages
			)
				.sort(
					( a, b ) =>
						summary[ type ][ subtype ].messages[ b ].count -
						summary[ type ][ subtype ].messages[ a ].count
				)
				.reduce(
					( _sortedObj, key ) => ( {
						..._sortedObj,
						[ key ]: summary[ type ][ subtype ].messages[ key ],
					} ),
					{}
				);
		}
	}

	return summary;
}
