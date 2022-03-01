
## About

This CLI receives a URL as parameter and evaluates the accessiblity issues that page might have.
It then process the data in a summary and posts it to a P2

## Installation

- Clone this repo with the command:
    - `git clone git@github.com:a8cteam51/team51-a11y-cli.git`
	- Then run `cd team51-a11y-cli` to navigate to this directory

- Make sure you have NodeJS installed on you local computer.
    - Open a Terminal a type `node -v` to verify it's installed
	- If this throws an error, try running `brew install node`

- Duplicate the file `.env_sample` and rename it to `.env`
    - This can be done with the Finder, or
	- via Terminal: `cp .env_sample .env`

- Open this `.env` file and place the WPCOM API Token there

- To install the tool, run `npm install -g .`


## Use

The tool can be accessed with the command `t51check`

```
t51check http://wordpress.com --save
```

### List of commands
 - `t51check [url]` to view results in Terminal
 - `t51check [url] --save` to post results in P2
 - `t51check [url] --crawl` to inspect the pages from all links in a given url
 - `t51check [url] --crawl=10` to limit the cralwer to a max number of links

 - `t51check --help`

 ### Known issues
 - The `--crawl` parameter won't account for external links or relative paths
 - W3C API might respond some times with two message types different than `error` and `info`. If a `fatalerror` is returned, it won't be processed correctly.