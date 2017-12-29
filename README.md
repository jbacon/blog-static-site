# Blog Website Static Content

[https://portfolio.joshbacon.name](http://portfolio.joshbacon.name)

This repo includes all static content for my blog website. Content in this repo is publically available. 
Files are served to client browsers using AWS S3 Static Site hosting w/ CloudFront. 
To update production, execute `push-to-prod-s3.sh`. 
For development purposes `docker-compose up` can be used to spin up a local nginx server. 