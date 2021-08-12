
## About

This CLI receives a URL as parameter and sends it to W3C HTML Validator tool.
It then process the data in a summary.

```
t51check http://wordpress --save
```


## Installation

Create an .env file with your WordPress API account token
Run `npm install -g .` to install the CLI globally.


## Use

The tool can be accessed with the command `t51check`

### List of commands
 - `t51check [url]` to view results in Terminal
 - `t51check [url] --save` to post results in P2
 - `t51check [url] --crawl` to inspect the pages from all links in a given url
 - `t51check [url] --crawl=10` to limit the cralwer to a max number of links

 - `t51check --help`

 ### Known issues
 - The `--crawl` parameter won't account for external links or relative paths
 - W3C API might respond some times with two message types different than `error` and `info`. If a `fatalerror` is returned, it won't be processed correctly.