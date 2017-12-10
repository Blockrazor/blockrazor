import { Meteor } from 'meteor/meteor';

Meteor.methods({
    checkuploaduser: function (userId) {
        if (userId !=null && this.userId == userId) {
            valid = true;
            picid = userId;
        }
    }
});

var fs = Npm.require('fs');

Meteor.methods({
  click(){
    console.log("start");
    var fs = Npm.require('fs');
    var wstream = fs.createWriteStream('/Users/gareth/Desktop/test/test.txt');
    wstream.write('Hello worldddd!\n');
      wstream.write('Another line\n');
      wstream.end();
      console.log("end");
  }
});

//using interal webapp or iron:router
WebApp.connectHandlers.use('/uploadSomeWhere',function(req,res){
  res.setHeader("Access-Control-Allow-Methods", "PUT");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
} else if (req.method === 'PUT') {
    // We only want images
    if (!req.headers['content-type'].startsWith('image')) {
        res.writeHead(400);
        res.end();
    }
    var type = false;
    if(req.headers['content-type'].endsWith('jpeg')){type = "jpg"};
    if(req.headers['content-type'].endsWith('png')){type = "png"};
    if(!type){
      res.writeHead(400);
      res.end();
    }
    var filename = ('/Users/gareth/git/blockrazor/temp/static/' + (Math.floor(Math.random() * 10000)) + '.' + type)
    var file = fs.createWriteStream(filename);

    file.on('error',function(error){console.log(error)});
    file.on('finish',function(){
        res.writeHead(200)
        res.end(); //end the respone
        //console.log('Finish uploading, time taken: ' + Date.now() - start);
    });
    req.pipe(file); //pipe the request to the file
    console.log(filename);
  }
});
