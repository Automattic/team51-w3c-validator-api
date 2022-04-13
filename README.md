
## About

Originally thought as a CLI tool, this project is now an API that receives a URL as parameter, evaluates the HTML using the W3C validator, and returns the result in JSON format, ready to be posted to a P2.

It is used by the Team51 Monitor tool to evaluate our sites periodically. Results are posted on https://team51validator.wordpress.com/

The API is hosted in Team51 AWS instance.

## Installation

For local development, clone the site and run `npm install`


## Use

You can start a local Express server by running `node app.js`
```
http://localhost:3000/evaluate?url=https://url-to-evaluate.com
```

On Production, this was deployed using PM2 package: `pm2 start app.js --name "Team51 HTML Validator" -- run start`
```
http://ec2-***REMOVED***.us-east-2.compute.amazonaws.com:3000/evaluate?url=https://url-to-evaluate.com
```


 ### Known issues
 - W3C API might respond some times with two message types different than `error` and `info`. If a `fatalerror` is returned, it won't be processed correctly.