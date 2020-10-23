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
const lemmatize = require('wink-lemmatizer');
const redis = require('redis');

const redisClient = redis.createClient();
redisClient.on('error', (err) => {
  console.log("Error " + err);
});

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

  async function getResults(response) {
    let result = [];
    let feedback = [];

    let posKeywords = [];
    let negKeywords = [];

    let wordCloud = [];

    let negativeCounter = 0;
    let positiveCounter = 0;
    let neutralCounter = 0;

    response.data.forEach(item => {
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
        posKeywords = posKeywords.concat(extraction_result);
      } else if (sentiment_score <= -0.05) {
        support = 'negative';
        negativeCounter++;
        negKeywords = negKeywords.concat(extraction_result);
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
      result.push(dic);
    })
    feedback.push(
      positiveCounter, negativeCounter, neutralCounter
    )
    negativeCounter = 0;
    positiveCounter = 0;
    neutralCounter = 0;
    let count = posKeywords.concat(negKeywords).reduce(function (acc, curr) {
      if (typeof acc[lemmatize.adjective(lemmatize.noun(lemmatize.verb(curr)))] == 'undefined') {
        if (Object.keys(AFFIN).indexOf(curr) > -1) {

          acc[lemmatize.adjective(lemmatize.noun(lemmatize.verb(curr)))] = 1;
        }
      } else {
        acc[lemmatize.adjective(lemmatize.noun(lemmatize.verb(curr)))] += 1;
      }

      return acc;
    }, {});
    for (let key in count) {
      let dic = {
        "text": key,
        "value": count[key]
      };
      wordCloud.push(dic);

    }
    return { 'result': result, 'feedback': feedback, 'wordCloud': wordCloud }
  }
  async function getResponse(responseTrump, responseBiden) {

    const resTrump = await getResults(responseTrump);
    const resultTrump = resTrump.result
    const trumpFeedback = resTrump.feedback
    const trumpWordCloud = resTrump.wordCloud


    const resBiden = await getResults(responseBiden);
    const resultBiden = resBiden.result
    const bidenFeedback = resBiden.feedback
    const bidenWordCloud = resBiden.wordCloud

    twitter_results = {
      "Trump": resultTrump, "Biden": resultBiden, "TrumpFeedback": trumpFeedback, "BidenFeedback": bidenFeedback,
      'Keywords': { 'TrumpWordCloud': trumpWordCloud, 'BidenWordCloud': bidenWordCloud }
    };
    return twitter_results
  }
  (async () => {

    try {
      // Get Trump tweets
      const currentTime = parseInt(Date.now() / 60 / 60 / 1000);

      const s3Key = `twitter-${req.params.hashtag}-${currentTime}`;
      console.log(s3Key)
      const params = { Bucket: bucketName, Key: s3Key };
      //60 * 60 * 1000
      redisClient.get(s3Key, (err, result) => {
        if (false) {
          // Serve from Cache
          console.log('redis')

          const resultJSON = JSON.parse(result);
          const twitter_results = getResponse(resultJSON.responseTrump, resultJSON.responseBiden);

          return res.status(200).json(twitter_results);
        } else {
          new AWS.S3({ apiVersion: '2006-03-01' }).getObject(params, async (err, result) => {
            if (false) {
              // Serve from S3
              console.log('s3');
              const resultJSON = JSON.parse(result.Body);
              const twitter_results = await getResponse(resultJSON.responseTrump, resultJSON.responseBiden);
              redisClient.setex(s3Key, 3600, JSON.stringify({ source: 'Redis Cache', ...resultJSON, }));
              res.status(200).json(twitter_results);
            } else {
              console.log('twitter');
              // Get Trump tweets
              const responseTrump = await getTweets(req.params.hashtag, 'Trump');
              // Get Biden tweets
              const responseBiden = await getTweets(req.params.hashtag, 'Biden');
              const twitter_results = await getResponse(responseTrump, responseBiden);

              const objectParams = { Bucket: bucketName, Key: s3Key, Body: JSON.stringify({'responseTrump':responseTrump,'responseBiden':responseBiden}) };
              const uploadPromise = new AWS.S3({ apiVersion: '2006-03-01' }).putObject(objectParams).promise();
              uploadPromise.then(function (data) {
                console.log("Successfully uploaded data to " + bucketName + "/" + s3Key);
              });

              // Serve from Wikipedia API and store in cache
              redisClient.setex(s3Key, 3600, JSON.stringify({ source: 'Redis Cache', ...twitter_results, }));

              res.send(twitter_results);
            }
          });
        }
      });
    } catch (e) {
      console.log(e);
      process.exit(-1);
    }
  })();
});

module.exports = router;




