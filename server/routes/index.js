const express = require('express');
const router = express.Router();
const request = require('request-promise');
const async = require("async");
const needle = require('needle');
const Sentiment = require('natural').SentimentAnalyzer;
const stemmer = require('natural').PorterStemmer;
const analyzer = new Sentiment('English', stemmer, 'afinn');
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();

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
    query = '#' + hashtag + ' lang:en entity:' + candidate + ' -entity:' + other + ' -is:retweet'
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
  (async () => {

    try {
      // Get Trump tweets
      const responseTrump = await getTweets(req.params.hashtag, 'Trump');
      //console.log(responseTrump);
      let resultTrump = [];
      let resultBiden = [];
      let trumpFeedback = [];
      let bidenFeedback = [];
      let negativeCounter = 0;
      let positiveCounter = 0;
      let neutralCounter = 0;

      //console.log(responseTrump)
      responseTrump.data.forEach(item => {
        let sentiment_score = analyzer.getSentiment(tokenizer.tokenize(item.text));
        let support = '';
        if (sentiment_score >= 0.05) {
          support = 'positive';
          positiveCounter++;
        } else if (sentiment_score <= -0.05) {
          support = 'negative';
          negativeCounter++;
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
      // Get Biden tweets
      const responseBiden = await getTweets(req.params.hashtag, 'Biden');
      responseBiden.data.forEach(item => {
        let sentiment_score = analyzer.getSentiment(tokenizer.tokenize(item.text));
        let support = '';
        if (sentiment_score >= 0.05) {
          support = 'positive';
          positiveCounter++;
        } else if (sentiment_score <= -0.05) {
          support = 'negative';
          negativeCounter++;
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
      result = { "Trump": resultTrump, "Biden": resultBiden, "TrumpFeedback": trumpFeedback, "BidenFeedback": bidenFeedback };
      res.send(result);
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




