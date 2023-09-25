/**
 * Returns a list of tags for the P2 post.
 *
 * @param 	{string}	url			URL that was validated.
 * @param 	{object}	summary		Validator summary as generated by compileValidatorSummary().
 *
 * @return 	{string[]}
 */
export function generateP2PostTags(url, summary = null) {
	const tags = ['t51w3c'];

	tags.push(
		't51w3c-' +
			url
				.toLowerCase()
				.replace(/^https?:\/\//i, '')
				.replace('www.', '')
				.replace(/\//g, '-')
				.replace(/\./g, '-')
				.replace(/ /g, '-')
				.replace(/[^\w-]+/g, '')
				.replace(/-$/, '')
	);

	if (summary) {
		for (const type of Object.keys(summary)) {
			if (0 === summary[type].count) {
				continue;
			}

			tags.push('t51w3c-' + type);

			for (const subtype of Object.keys(summary[type])) {
				if (!summary[type][subtype]['messages']) {
					continue;
				}
				if (0 === summary[type][subtype].count) {
					continue;
				}

				tags.push('t51w3c-' + subtype + '-' + type);
			}
		}
	} else {
		tags.push('t51w3c-unknown');
	}

	return tags;
}

/**
 * Generates the HTML for the WordPress P2 post.
 *
 * @param 	{object}	summary			Validator summary as generated by compileValidatorSummary().
 * @param 	{string[]}	validatedURLs	Array of URLs that were validated.
 *
 * @returns	{string}
 */
export function generateP2PostHtml(summary, validatedURLs) {
	let htmlData = '';

	htmlData += `<p>The following URLs were inspected:</p>`;
	htmlData += `<ul class="t51-w3c-urls">`;
	htmlData += validatedURLs.map((item) => `<li>${item}</li>`).join('');
	htmlData += `</ul>`;

	htmlData += '<p class="t51-w3c-summary">';

	const htmlSummaryCount = [];
	for (const type of Object.keys(summary)) {
		for (const subtype of Object.keys(summary[type])) {
			if (!summary[type][subtype]['messages']) {
				continue;
			}
			if (!summary[type][subtype].count) {
				continue;
			}

			htmlSummaryCount.push(
				`<span class="t51-w3c-summary-${type} t51-w3c-summary-${type}-${subtype}">${summary[type][subtype].count} ${subtype} ${type}s</span>`
			);
		}
	}

	const htmlLastSummaryCount = htmlSummaryCount.pop();
	htmlData +=
		htmlSummaryCount.join(', ') +
		' and ' +
		htmlLastSummaryCount +
		' were encountered.</p>';

	for (const type of Object.keys(summary)) {
		if (0 === summary[type].count) {
			continue;
		}

		const typeLabel = type.charAt(0).toUpperCase() + type.slice(1) + 's';
		htmlData += `<h2>${typeLabel}</h2>`;

		for (const subtype of Object.keys(summary[type])) {
			if (!summary[type][subtype]['messages']) {
				continue;
			}
			if (0 === summary[type][subtype].count) {
				continue;
			}

			const subtypeLabel =
				subtype.charAt(0).toUpperCase() +
				subtype.slice(1) +
				' ' +
				typeLabel;
			htmlData += `<h3>${subtypeLabel}</h3>`;

			htmlData += '<details>';
			htmlData += `<summary class="t51-w3c-details-summary t51-w3c-${type}-${subtype}-details-summary">View ${summary[type][subtype].count} ${subtype} ${type}s</summary>`;
			htmlData += `<ul class="t51-w3c-list t51-w3c-${type}-${subtype}-list">`;

			Object.keys(summary[type][subtype].messages).forEach((key) => {
				const message = summary[type][subtype].messages[key];
				htmlData += `<li class="t51-w3c-item t51-w3c-${type}-${subtype}-item">
                        <span class="t51-w3c-item-count t51-w3c-${type}-${subtype}-item-count">
							${message.count}
						</span> findings for:
                        <span class="t51-w3c-item-msg t51-w3c-${type}-${subtype}-item-msg">
							${key}
						</span>
                        <ul class="t51-w3c-item-examples t51-w3c-${type}-${subtype}-item-examples">
							<li>
								<code style="font-size: 0.75rem;">
									${encodeHtmlEntities(message.extracts[0])}
								</code>
							</li>
                        </ul>
                    </li>`;
			});

			htmlData += '</ul>';
			htmlData += '</details>';
		}
	}

	return htmlData.replace(/(\r\n|\n|\r|\t)/gm, '');
}

/**
 * Private function
 * Utility function to convert HTML tags in a way WP Editor will output correctly
 * @param {*} string
 * @returns
 */
const encodeHtmlEntities = (string) => {
	if (!string) {
		return '';
	}

	return string
		.replace(/[\u00A0-\u9999<>&]/g, (i) => {
			return '&#' + i.charCodeAt(0) + ';';
		})
		.trim()
		.replace(/\s+/g, ' ')
		.replace(/\n/g, '<br />');
};
