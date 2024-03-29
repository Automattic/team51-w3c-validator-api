import express from 'express';
import {
	isValidURL,
	parseBoolOrInt,
	parseScrapperResponse,
	scrapLinks,
} from './bin/utils.js';
import {
	parseValidatorResponse,
	callHtmlValidator,
	compileValidatorSummary,
} from './bin/w3c-api.js';
import { generateP2PostHtml, generateP2PostTags } from './bin/p2-post.js';

const app = express(),
	port = 3000;

app.get('/evaluate', async (req, res) => {
	const url = req.query.url.replace(/\/$/, '');
	if (!url || !isValidURL(url)) {
		res.json('Please provide a valid URL');
		return;
	}

	const format = req.query.format || req.query.output || 'p2html';
	if ('p2html' !== format && 'json' !== format) {
		res.json('Please provide a valid format');
		return;
	}

	const crawl = parseBoolOrInt(req.query.crawl || false);
	if (typeof crawl === 'number' && 1 > crawl) {
		res.json('Please provide a valid crawl value');
		return;
	}

	console.debug(`Evaluating ${url}. Crawl: ${crawl}`);

	try {
		const validateURLs = [url];
		if (crawl) {
			const scrapperResponse = await scrapLinks(url),
				links = parseScrapperResponse(scrapperResponse),
				limit = !isNaN(crawl) ? crawl : Number.MAX_SAFE_INTEGER,
				hostname = new URL(url).hostname;

			for (let i = 0; i < links.length; i++) {
				const link = links[i].href.replace(/\/$/, ''); // Remove trailing slash.
				if (
					validateURLs.includes(link) ||
					!isValidURL(link, hostname)
				) {
					// TODO: support relative paths
					continue;
				}

				validateURLs.push(link);
				if (validateURLs.length >= limit) {
					break;
				}
			}
		}

		console.log('Validating these URLs:', validateURLs);

		const validatorResponses = await callHtmlValidator(validateURLs),
			parsedResponses = validatorResponses
				.map((r) => parseValidatorResponse(r))
				.flat();

		const summary = compileValidatorSummary(parsedResponses);
		switch (format) {
			case 'p2html':
				res.json({
					title: `HTML Validator | ${url} | ${summary.error.count} errors`,
					tags: generateP2PostTags(url, summary),
					content: generateP2PostHtml(summary, validateURLs),
				});
				break;
			case 'json':
				res.json({
					validatedURLs: validateURLs,
					...summary,
				});
				break;
		}
	} catch (error) {
		console.error(error);

		switch (format) {
			case 'p2html':
				res.json({
					title: `HTML Validator | ${url}`,
					tags: generateP2PostTags(url),
					content: `Oops. Something went wrong: ${error.message}`,
				});
				break;
			case 'json':
				res.json(error);
				break;
		}
	}
});

app.listen(port, () => {
	console.log('Server running on port 3000');
});
