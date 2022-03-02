
## About

Originally thought as a CLI tool, this project is now an API that receives a URL as parameter, evaluates the HTML using the W3C validator, and returns the result in JSON format, ready to be posted to a P2.

It's installed in Team51 AWS instance, and is used by the Team51 Monitor tool to evaluate our sites periodically. Results are posted on https://team51validator.wordpress.com/

## Installation

For local development, clone the site and run `npm install`

After that, you can start the Express server by running `node app.js`

## Use

Local:
```
http://localhost:3000/evaluate?url=https://wordpress.com
```

Production:
```
http://ec2-3-18-32-5.us-east-2.compute.amazonaws.com:3000/evaluate?url=https://wordpress.com
```

 ### Known issues
 - W3C API might respond some times with two message types different than `error` and `info`. If a `fatalerror` is returned, it won't be processed correctly.