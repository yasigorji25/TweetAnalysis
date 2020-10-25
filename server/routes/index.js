const express = require('express');
const router = express.Router();
const needle = require('needle');
const Sentiment = require('natural').SentimentAnalyzer;
const stemmer = require('natural').LancasterStemmer;
const analyzer = new Sentiment('English', stemmer, 'afinn');
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const sw = require('stopword');
const fs = require('fs');
const AFFIN = JSON.parse(fs.readFileSync('./AFINN.json', 'utf8'));
const keyword_extractor = require("keyword-extractor");
const lemmatize = require('wink-lemmatizer');
const redis = require('redis');

// redis localhost
const redisClient = redis.createClient();
// aws elasticache
//const redisClient = redis.createClient(6379, 'trump-biden.km2jzi.ng.0001.apse2.cache.amazonaws.com'  ,  { no_ready_check:  true });

redisClient.on('error', (err) => {
  console.log("Error " + err);
});

// get credentials
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
// connect to s3
/*
try {
  const bucketPromise = new AWS.S3({ apiVersion: '2006-03-01', region: 'ap-southeast-2' }).createBucket({ Bucket: bucketName }).promise();
  bucketPromise.then(function (data) {
    console.log("Successfully created " + bucketName);
  }).catch(function (err) {

  });
} catch (e) {

}
*/
const bucketPromise = new AWS.S3({ apiVersion: '2006-03-01' }).createBucket({ Bucket: bucketName }).promise();
bucketPromise.then(function (data) {
  console.log("Successfully created " + bucketName);
})
  .catch(function (err) {
    console.error(err, err.stack);
  });

const token = 'AAAAAAAAAAAAAAAAAAAAAF0zIgEAAAAADFW0UWDGP3X3gK4e1ldfjSBBYxE%3DIOFKXbD7Ix0iRaD2YQCi4zCxYNrk7TGZcjHhGNyPtRq08wvtHh';

const endpointUrl = 'https://api.twitter.com/2/tweets/search/recent'

router.get('/line', (req, res) => {
  (async () => {
    try {
      const currentTime = parseInt(Date.now() / 60 / 60 / 1000);
      const hashtagList = ['election', 'democrates', 'politics', 'republican'];
      let sentiResLine = [];
      for (let i = currentTime - 168; i <= currentTime; i++) {
        let date = new Date(i * 60 * 60 * 1000);
        if (i % 24 == 0) {
          // counters for count number of tweets
          const time = new Date(date.toString().substring(0, 15)).getTime() / 60 / 60 / 1000;
          let negativeCounterTrump = 0;
          let positiveCounterTrump = 0;
          let negativeCounterBiden = 0;
          let positiveCounterBiden = 0;
          console.log(time)
          //timestamp = (i*60*60*1000).getTime()
          for (let j = 0; j < hashtagList.length; j++) {
            const s3Key = `twitter-${hashtagList[j]}-${time}`;
            const params_line = { Bucket: bucketName, Key: s3Key };
            try {
              const result = await new AWS.S3({ apiVersion: '2006-03-01' }).getObject(params_line).promise();
              console.log(s3Key);
              const resultJSON = JSON.parse(result.Body);
              const responseTrump = resultJSON.Trump;
              const responseBiden = resultJSON.Biden;
              console.log(responseTrump);

              responseTrump.forEach(item => {
                if (item.sentiment === 'positive') {
                  positiveCounterTrump++;
                } if (item.sentiment === 'negative') {
                  negativeCounterTrump++
                }
              })
              responseBiden.forEach(item => {
                if (item.sentiment === 'positive') {
                  positiveCounterBiden++;
                } if (item.sentiment === 'negative') {
                  negativeCounterBiden++
                }
              })
              //const headCode = await s3.headObject(params).promise();
              //const signedUrl = s3.getSignedUrl('getObject', params);
              // Do something with signedUrl
            } catch (headErr) {
              if (headErr.code === 'NotFound') {
                // Handle no object on cloud here  
              }
            }
          }
          dic = {
            "Trump_sentiment": positiveCounterTrump - negativeCounterTrump,
            "Biden_sentiment": positiveCounterBiden - negativeCounterBiden,
            "date": date,
          };
          console.log(dic);

          sentiResLine.push(dic);
        }
      };
      res.send(sentiResLine)
    } catch (e) {
      console.log(e);
      process.exit(-1);
    }
  })()
})

router.get('/sentiment/:hashtag', (req, res) => {
  // get tweets from twitter api
  async function getTweets(hashtag, candidate) {
    if (candidate == 'Biden') {
      other = 'Trump'
    } else {
      other = 'Biden'
    }
    // the query
    let query = '#' + hashtag + ' lang:en entity:' + candidate + ' -entity:' + other + ' -is:retweet' + ' -has:media -has:links';
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

  // compute results from raw tweets
  async function getResults(response) {
    // tweets with sentiment analysis results
    let result = [];
    // number of positive, negative and neural tweets
    let feedback = [];
    // keywords in positive or negative wods 
    let posKeywords = [];
    let negKeywords = [];
    // data for word cloud, including text and value
    let wordCloud = [];
    // counters for count number of tweets
    let negativeCounter = 0;
    let positiveCounter = 0;
    let neutralCounter = 0;
    // each tweet from twtiter api endpoint response
    response.data.forEach(item => {
      let sentiment_score = analyzer.getSentiment(sw.removeStopwords(tokenizer.tokenize(item.text)));
      let extraction_result = keyword_extractor.extract(item.text, {
        language: "english",
        remove_digits: true,
        return_changed_case: true,
        remove_duplicates: false
      });

      let support = '';
      // postive tweets have more than 0.05 sentiment score, negative lesss than 0.05 and the others are neutral
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
    // count the frequancy of words
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

  // get response from the analysis results and change them to suitable format
  async function getResponse(responseTrump, responseBiden) {
    // Trump
    const resTrump = await getResults(responseTrump);
    const resultTrump = resTrump.result
    const trumpFeedback = resTrump.feedback
    const trumpWordCloud = resTrump.wordCloud
    // Biden
    const resBiden = await getResults(responseBiden);
    const resultBiden = resBiden.result
    const bidenFeedback = resBiden.feedback
    const bidenWordCloud = resBiden.wordCloud

    const twitter_results = {
      "Trump": resultTrump, "Biden": resultBiden, "TrumpFeedback": trumpFeedback, "BidenFeedback": bidenFeedback,
      'Keywords': { 'TrumpWordCloud': trumpWordCloud, 'BidenWordCloud': bidenWordCloud }
    };
    return twitter_results
  }

  (async () => {
    try {
      // set s3key by hashtag and a hour timestamp
      const currentTime = parseInt(Date.now() / 60 / 60 / 1000);

      const s3Key = `twitter-${req.params.hashtag}-${currentTime}`;
      const redisKey = `twitter-${req.params.hashtag}`;

      //const params = { Bucket: bucketName, Key: s3Key };

      redisClient.get(redisKey, async (err, result) => {
        // Check if a result got in 1 hour in the cache, if true, use the data, if not, try get data from s3
        if (result) {
          // Serve from Cache
          console.log('redis');
          const resultJSON = JSON.parse(result);
          const twitter_results = await getResponse(resultJSON.responseTrump, resultJSON.responseBiden);
          res.send(twitter_results);
        } else {
          // If cannot find data from cache or s3, get tweets from twitter api endpoint
          console.log('twitter');
          // Get Trump tweets
          const responseTrump = await getTweets(req.params.hashtag, 'Trump');
          // Get Biden tweets
          const responseBiden = await getTweets(req.params.hashtag, 'Biden');
          const twitter_results = await getResponse(responseTrump, responseBiden);

          // Serve from Twitter API and store in s3
          const objectParams = { Bucket: bucketName, Key: s3Key, Body: JSON.stringify(twitter_results) };
          const uploadPromise = new AWS.S3({ apiVersion: '2006-03-01' }).putObject(objectParams).promise();
          uploadPromise.then(function (data) {
            console.log("Successfully uploaded data to " + bucketName + "/" + s3Key);
          });
          // Serve from Twitter API and store in cache
          redisClient.setex(redisKey, 3600, JSON.stringify({ source: 'Redis Cache', ...{ 'responseTrump': responseTrump, 'responseBiden': responseBiden }, }));

          res.send(twitter_results);
        }
      });
    } catch (e) {
      console.log(e);
      process.exit(-1);
    }
  })();
});

module.exports = router;




