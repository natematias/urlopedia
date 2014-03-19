_ = require("underscore");
request = require('request');
Promise = require('promise');
WayBack = require('./WayBackService');
MediaCloud = require('./MediaCloudService');
Herdict = require('./HerdictService');
Describing = require('./DescribingAMService');


var MongoClient = require('mongodb').MongoClient
    , format = require('util').format;


// validation method
function validate_url(url){
  if(url!= null && url!=""){
    return true;
  }
  return false;
}

// example of a service that takes in a url and returns a promise for json
function url_service(url){
  // { SERVICE_NAME: { key: value } }
  return new Promise( function( resolve, reject ) {
    resolve( {
      url: url
    } );
  } );
}

exports.all = function (req, res) {
  var url = req.url.substring(req.url.indexOf('?')+1,req.url.length);

  if ( !validate_url( url ) ) {
    res.status( 400 );
    return;
  }

  

  herdict = Object.create(Herdict.HerdictService);
  wayback = Object.create(WayBack.WayBackService);
  mediacloud = Object.create(MediaCloud.MediaCloudService);
  describing = Object.create(Describing.DescribingAMService);

  Promise.all( [
    url_service(url),
    herdict.fetch( url.replace( /^https?:\/\//, '' ) ),
    //describing.fetch(url),
    //mediacloud.fetch(url),
    wayback.fetch(url)
  ] )
  .then( function( result ) {

    console.log("storing result in mongo");

    MongoClient.connect('mongodb://127.0.0.1:27017/urlopedia', function(err, db) {
    if(err) throw err;

    var collection = db.collection('all');
//	collection.insert(result);

	collection.insert({ 'url': url, 'responses': result}, { 'safe':true },  function(err, docs) {

	    console.log(format("err = %s", err ) )
      collection.count(function(err, count) {
          console.log(format("err = %s, count = %s", err, count));
      });

      // Locate all the entries using find
      collection.find().toArray(function(err, results) {
        console.dir(results);
        // Let's close the db
        db.close();
      });
    });
  })

    console.log("returning result json");
    
    res.json(result);
  } )
  .catch(function (e) {
    res.status( 500, {
      error: e
    } );
  });
};

exports.herdict = function (req, res) {
  var url = req.url.substring(req.url.indexOf('?')+1,req.url.length);

  if ( !validate_url( url ) ) {
    res.status( 400 );
    return;
  }

  herdict = Object.create(Herdict.HerdictService);

  Promise.all( [
    url_service(url),
    herdict.fetch(url)
  ] )
  .then( function( result ) {
    res.json(result);
  } )
  .catch(function (e) {
    res.status( 500, {
      error: e
    } );
  });
};
