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
