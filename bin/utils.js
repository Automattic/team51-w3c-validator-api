import chalk from 'chalk';
import scrapeIt from 'scrape-it';

/**
 * Checks whether a given string is a valid URL.
 *
 * @link	https://stackoverflow.com/a/55585593
 *
 * @param 	{string}	string		string to check
 * @param	{string}	hostname	optional hostname to check against
 *
 * @return 	{boolean}
 */
export function isValidURL(string, hostname = undefined) {
	try {
		const url = new URL(string);
		hostname = hostname || url.hostname;

		return hostname === url.hostname;
	} catch (_) {
		return false;
	}
}

/**
 * Parses a given value into a boolean or integer.
 *
 * @param 	{any}	value
 *
 * @return 	{boolean|number}
 */
export function parseBoolOrInt(value) {
	if (isNaN(value)) {
		return value === 'true';
	}

	value = parseInt(value);
	return isNaN(value) ? false : value;
}

/**
 * Scraps all the a[href] in a given URL.
 *
 * @param 	{string} 	url
 *
 * @return 	{Promise<scrapeIt.ScrapeResult<unknown>>}
 */
export async function scrapLinks(url) {
	return await scrapeIt(url, {
		links: {
			listItem: 'a',
			data: {
				href: {
					attr: 'href',
				},
			},
		},
	});
}

/**
 * Parses the response from the HTML scrapper and returns an array of links.
 *
 * @param 	{object}	response
 *
 * @return 	{object[]}
 */
export function parseScrapperResponse(response) {
	if (200 !== response.status) {
		throw new Error(`Invalid scrapper response status ${response.status}.`);
	}

	return response.data.links;
}

// region LEGACY UNUSED FUNCTIONS

/**
 * Generates the text version for the Terminal
 *
 * @param {*} summary
 */
export const formatTerminalOutput = (summary) => {
	console.log(
		chalk.bold(
			`There are ${summary.error.type_count} errors and ${summary.info.type_count} info warnings\n`
		)
	);

	console.log(chalk.bgRed('Errors\n'));
	Object.keys(summary.error.messages).forEach((key) => {
		console.log(
			chalk.underline(
				`${summary.error.messages[key].message_count} findings`
			) +
				` for: ${chalk.italic(key)} \n ${chalk.italic.dim(
					summary.error.messages[key].code_sample
				)}\n`
		);
	});

	console.log(chalk.bgYellow('Warnings/Info\n'));
	Object.keys(summary.info.messages).forEach((key) => {
		console.log(
			chalk.underline(
				`${summary.info.messages[key].message_count} findings`
			) +
				` for: ${chalk.italic(key)} \n ${chalk.italic.dim(
					summary.info.messages[key].code_sample
				)}\n`
		);
	});
};

/**
 * Private function
 * Generates an HTML chart for P2 post
 */
function generateChart(data) {
	const messages = data.messages;
	const chart_colors = ['darksalmon', 'moccasin'];
	let current_color_index;

	let tempHtmlChart = '';
	tempHtmlChart =
		'<div style="display:flex; height:26px; text-align:center; color:#333; font-size:0.9rem; margin-bottom:1rem;">';
	let other_percentage = 0;
	Object.keys(messages).forEach((key, index) => {
		current_color_index = index < chart_colors.length ? index : 0;

		const bar_bg_color = chart_colors[current_color_index];
		const message_count = parseInt(messages[key].message_count);
		const percentage = parseFloat(
			(message_count / parseInt(data.type_count)) * 100
		).toFixed(1);
		const bar_title = key;
		const bar_value = `${percentage}%`;

		if (percentage > 5) {
			// not rendered yet on screen, just storing value from the loop
			tempHtmlChart += `<div title="${bar_title}" style="width:${percentage}%; background:${bar_bg_color};">${bar_value}</div>`;
		} else {
			other_percentage += parseFloat(percentage);
		}
	});
	if (other_percentage) {
		other_percentage = other_percentage.toFixed(1);
		tempHtmlChart += `<div title="Other" style="width:${other_percentage}%; background:#aaa;">${other_percentage}%</div>`;
	}
	tempHtmlChart += '</div>';

	return tempHtmlChart;
}

// endregion
