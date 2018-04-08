# Production server tips
### Renewing SSL
1. STOP the Nginx service to free up port 80
2. `sudo letsencrypt renew`
3. START Nginx service

This process causes approximately 30 seconds of downtime.

### Environment variables
#### Set the root URL so Meteor knows where it's running (needed for things like API callbacks from Facebook or whatever)
```
export ROOT_URL=https://blockrazor.org
```

#### Tell Meteor that she's running behind a reverse proxy:
```
export HTTP_FORWARDED_COUNT=1
```

### Take a snapshot of the database
```
mongodump -h  127.0.0.1 --port 3001 -d meteor
```

### Cron jobs
```
*/1 * * * 0-6 cd ~/blockrazor/blockrazor && git stash > /var/www/static/git0.txt && git pull > /var/www/static/git.txt
7 * * * * cd ~/blockrazor && mongodump -h 127.0.0.1 --port 3001 -d meteor && tar -cvf /var/www/static/dump.tar.gz dump > ~/mongodump.log
```


