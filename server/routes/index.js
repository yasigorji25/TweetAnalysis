const express = require('express');
const router = express.Router();
const request = require('request-promise');
const async = require("async");
const needle = require('needle');
const Sentiment = require('natural').SentimentAnalyzer;
const stemmer = require('natural').LancasterStemmer;
const analyzer = new Sentiment('English', stemmer, 'afinn');
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const axios = require('axios');
const sw = require('stopword');
const fs = require('fs');
const AFFIN = JSON.parse(fs.readFileSync('./AFINN.json', 'utf8'));
const keyword_extractor = require("keyword-extractor");
const wordnet = new natural.WordNet();
var lemmatize = require( 'wink-lemmatizer' );

console.log(lemmatize.adjective( 'supports' ));

require('dotenv').config();
var AWS = require("aws-sdk");
AWS.config.getCredentials(function (err) {
  if (err) console.log(err.stack);
  // credentials not loaded
  else {
    console.log("Access key:", AWS.config.credentials.accessKeyId);
    console.log("Secret access key:", AWS.config.credentials.secretAccessKey);
  }
});

const bucketName = 'n10296255-a2-store';

const bucketPromise = new AWS.S3({ apiVersion: '2006-03-01' }).createBucket({ Bucket: bucketName }).promise();


bucketPromise.then(function (data) {
  console.log("Successfully created " + bucketName);
})
  .catch(function (err) {
    console.error(err, err.stack);
  });
/*
router.get('/api/store', (req, res) => {
  const key = (req.query.key).trim();

  // Construct the wiki URL and S3 key
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=parse&format=json&section=0&page=${key}`;
  //const s3Key = `wikipedia-${key}`;

  // Check S3
  const currentTime = parseInt(Date.now() / 60 / 60 / 1000);
  console.log(currentTime)
  const s3Key = `wikipedia-${currentTime}`;

  const params = { Bucket: bucketName, Key: s3Key };
  //60 * 60 * 1000
  return new AWS.S3({ apiVersion: '2006-03-01' }).getObject(params, (err, result) => {
    if (result) {
      // Serve from S3
      console.log('s3');
      const resultJSON = JSON.parse(result.Body);
      return res.status(200).json(resultJSON);

    } else {
      // Serve from Wikipedia API and store in S3
      console.log('wiki')
      return axios.get(searchUrl)
        .then(response => {
          const responseJSON = response.data;
          const body = JSON.stringify({ source: 'S3 Bucket', ...responseJSON });
          const objectParams = { Bucket: bucketName, Key: s3Key, Body: body };
          const uploadPromise = new AWS.S3({ apiVersion: '2006-03-01' }).putObject(objectParams).promise();
          uploadPromise.then(function (data) {
            console.log("Successfully uploaded data to " + bucketName + "/" + s3Key);
          });
          return res.status(200).json({ source: 'Wikipedia API', ...responseJSON, });
        })
        .catch(err => {
          return res.json(err);
        });
    }
  });
});
*/
/*
const responseTime = require('response-time')
const axios = require('axios');
const redis = require('redis');

// This section will change for Cloud Services
const redisClient = redis.createClient();
redisClient.on('error', (err) => {
 console.log("Error " + err);
});
router.use(responseTime());
*/

//console.log(analyzer.getSentiment(["I","hates","love","biden"]))
// To set environment variables on Mac OS X, run the export command below from the terminal: 
// export BEARER_TOKEN='YOUR-TOKEN' 
const token = 'AAAAAAAAAAAAAAAAAAAAAF0zIgEAAAAADFW0UWDGP3X3gK4e1ldfjSBBYxE%3DIOFKXbD7Ix0iRaD2YQCi4zCxYNrk7TGZcjHhGNyPtRq08wvtHh';

const endpointUrl = 'https://api.twitter.com/2/tweets/search/recent'


router.get('/sentiment/:hashtag', (req, res) => {
  async function getTweets(hashtag, candidate) {
    if (candidate == 'Biden') {
      other = 'Trump'
    } else {
      other = 'Biden'
    }
    // Edit query parameters below
    query = '#' + hashtag + ' lang:en entity:' + candidate + ' -entity:' + other + ' -is:retweet' + ' -has:media -has:links	'
    const params = {
      'query': query,
      'max_results': 100
    }

    const res = await needle('get', endpointUrl, params, {
      headers: {
        "authorization": `Bearer ${token}`
      }
    })

    if (res.body) {
      return res.body;
    } else {
      throw new Error('Unsuccessful request')
    }
  }

  function rateWord(word) {
    return (word in AFFIN) ? AFFIN[word] : 0;
  }

  (async () => {

    try {
      // Get Trump tweets
      const currentTime = parseInt(Date.now() / 60 / 60 / 1000);

      const s3Key = `twitter-${req.params.hashtag}-${currentTime}`;
      console.log(s3Key)
      const params = { Bucket: bucketName, Key: s3Key };
      //60 * 60 * 1000
      return new AWS.S3({ apiVersion: '2006-03-01' }).getObject(params, async (err, result) => {
        if (false) {
          // Serve from S3
          console.log('s3');
          const resultJSON = JSON.parse(result.Body);
          return res.status(200).json(resultJSON);

        } else {
          console.log('twitter');
          const responseTrump = await getTweets(req.params.hashtag, 'Trump');
          //console.log(responseTrump);
          let resultTrump = [];
          let resultBiden = [];
          let trumpFeedback = [];
          let bidenFeedback = [];
          let trumpPosKeywords = [];
          let trumpNegKeywords = [];
          let bidenPosKeywords = [];
          let bidenNegKeywords = [];

          let trumpWordCloud = [];
          let bidenWordCloud = [];

          let negativeCounter = 0;
          let positiveCounter = 0;
          let neutralCounter = 0;
          //let newtxt = ''
          //let tokens = [];
          //console.log(responseTrump)
          responseTrump.data.forEach(item => {
            //console.log(item.text.split(' ')));
            //let newtxt = item.text.slice(0, item.text.search('(https?|ftp|file)://[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]'));
            //console.log(newtxt)
            let sentiment_score = analyzer.getSentiment(sw.removeStopwords(tokenizer.tokenize(item.text)));
            let extraction_result = keyword_extractor.extract(item.text, {
              language: "english",
              remove_digits: true,
              return_changed_case: true,
              remove_duplicates: false
            });
            //console.log(extraction_result)

            let support = '';
            if (sentiment_score >= 0.05) {
              support = 'positive';
              positiveCounter++;
              trumpPosKeywords = trumpPosKeywords.concat(extraction_result);
            } else if (sentiment_score <= -0.05) {
              support = 'negative';
              negativeCounter++;
              trumpNegKeywords = trumpNegKeywords.concat(extraction_result);
            } else {
              support = 'neutral';
              neutralCounter++;
            }

            dic = {
              "id": item.id,
              "text": item.text,
              "sentiment_score": sentiment_score,
              'sentiment': support
            };
            resultTrump.push(dic);
          })
          trumpFeedback.push(
            positiveCounter, negativeCounter, neutralCounter
          )
          negativeCounter = 0;
          positiveCounter = 0;
          neutralCounter = 0;
          let trumpCount = trumpPosKeywords.concat(trumpNegKeywords).reduce(function (acc, curr) {
            if (typeof acc[lemmatize.adjective(lemmatize.noun(lemmatize.verb(curr)))] == 'undefined') {
              if (Object.keys(AFFIN).indexOf(curr) > -1) {

                acc[lemmatize.adjective(lemmatize.noun(lemmatize.verb(curr)))] = 1;
              }
            } else {
              acc[lemmatize.adjective(lemmatize.noun(lemmatize.verb(curr)))] += 1;
            }

            return acc;
          }, {});
          for (let key in trumpCount) {
            let dic = {
              "text": key,
              "value": trumpCount[key]
            };
            trumpWordCloud.push(dic);

          }

          // Get Biden tweets
          const responseBiden = await getTweets(req.params.hashtag, 'Biden');
          responseBiden.data.forEach(item => {

            let sentiment_score = analyzer.getSentiment(tokenizer.tokenize(item.text));
            let extraction_result = keyword_extractor.extract(item.text, {
              language: "english",
              remove_digits: true,
              return_changed_case: true,
              remove_duplicates: false
            });
            //console.log(extraction_result)

            let support = '';
            if (sentiment_score >= 0.05) {
              support = 'positive';
              positiveCounter++;
              bidenPosKeywords = bidenPosKeywords.concat(extraction_result);
            } else if (sentiment_score <= -0.05) {
              support = 'negative';
              negativeCounter++;
              bidenNegKeywords = bidenNegKeywords.concat(extraction_result);
            } else {
              support = 'neutral';
              neutralCounter++;
            }

            dic = {
              "id": item.id,
              "text": item.text,
              "sentiment_score": sentiment_score,
              'sentiment': support
            };
            resultBiden.push(dic);
          })
          bidenFeedback.push(
            positiveCounter, negativeCounter, neutralCounter
          )
          let bidenCount = bidenPosKeywords.concat(bidenNegKeywords).reduce(function (acc, curr) {
            if (typeof acc[lemmatize.adjective(lemmatize.noun(lemmatize.verb(curr)))] == 'undefined') {
              if (Object.keys(AFFIN).indexOf(curr) > -1) {
                acc[lemmatize.adjective(lemmatize.noun(lemmatize.verb(curr)))] = 1;
              }
            } else {
              acc[lemmatize.adjective(lemmatize.noun(lemmatize.verb(curr)))] += 1;
            }

            return acc;
          }, {});
          for (let key in bidenCount) {
            let dic = {
              "text": key,
              "value": bidenCount[key]
            };
            bidenWordCloud.push(dic);

          }

          twitter_results = {
            "Trump": resultTrump, "Biden": resultBiden, "TrumpFeedback": trumpFeedback, "BidenFeedback": bidenFeedback,
            'Keywords': { 'TrumpWordCloud': trumpWordCloud, 'BidenWordCloud': bidenWordCloud}
          };

          const objectParams = { Bucket: bucketName, Key: s3Key, Body: JSON.stringify(twitter_results) };
          const uploadPromise = new AWS.S3({ apiVersion: '2006-03-01' }).putObject(objectParams).promise();
          uploadPromise.then(function (data) {
            console.log("Successfully uploaded data to " + bucketName + "/" + s3Key);
          });
          res.send(twitter_results);
        }
      });
    } catch (e) {
      console.log(e);
      process.exit(-1);
    }
  })();
});

/*
router.get('/api/search', (req, res) => {
  const query = (req.query.query).trim();
  // Construct the wiki URL and key
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=parse&format=json&section=0&page=${query}`;
  const redisKey = `wikipedia:${query}`;
  // Try the cache
  return redisClient.get(redisKey, (err, result) => {

    if (result) {
      // Serve from Cache
      const resultJSON = JSON.parse(result);
      return res.status(200).json(resultJSON);
    } else {
      // Serve from Wikipedia API and store in cache
      return axios.get(searchUrl)
        .then(response => {
          const responseJSON = response.data;
          redisClient.setex(redisKey, 3600, JSON.stringify({ source: 'Redis Cache', ...responseJSON, }));
          return res.status(200).json({ source: 'Wikipedia API', ...responseJSON, });
        })
        .catch(err => {
          return res.json(err);
        });
    }
  });
});
*/
module.exports = router;




