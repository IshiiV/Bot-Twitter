//index.js

var TwitterPackage = require('twitter');
var request = require('request');

console.log("Hello World! I am a twitter bot!");

var secret = {
	consumer_key: '',
	consumer_secret: '',
	access_token_key: '',
	access_token_secret: ''
}

var MongoClient = require('mongodb').MongoClient;
// Connection URL
var url = 'mongodb://userteste:ufcbot1@ds129454.mlab.com:29454/bot';
// Use connect method to connect to the server

/*
MongoClient.connect(url, function(err, db) {
	console.log("Connected successfully to server");
	db.close();
});*/

function findDocuments(db, callback) {
// Get the documents collection
	var collection = db.collection('users');
// Find documents
	collection.find({}).toArray(function(err, docs) {
		callback(docs);
	});
}

var userInterests = [];
loadUserData();

function loadUserData(){
	// Use connect method to connect to the server
	MongoClient.connect(url, function(err, db) {
		console.log("Connected successfully to server");
		findDocuments(db, function(docs) {
			//console.log("Found the following records");
			for (var i = 0; i < docs.length; i++){
				var user = {};
				user.screen_name = docs[i].screen_name;
				user.user_interest = docs[i].user_interest;
				userInterests.push(user);
			}
			db.close();
			console.log(userInterests);
			//tweet to those followers who have
			//expressed interest in specific categories


			//TEM ALGO MUITO ERRSADO

			tweetUserSpecificNews();
		});
	});
}



//Use this line to hardcoding an user.
//var userInterests = [{'screen_name':'srinivasancj','user_interest': 'technology'}];

//tweetUserSpecificNews();

function tweetUserSpecificNews(){
console.log('Tweeting personalised news');
	for (var i=0; i < userInterests.length; i++){
		var user = userInterests[i];
		var screen_name = user.screen_name;
		var interest = user.user_interest;
		var status_id = user.in_reply_to_status_id;
		//get sources
		request({
			url: 'https://newsapi.org/v2/sources?category=' +
				interest +
				'&apiKey=',
			method: 'GET'
		},
		function (error, response, body) {
			if (!error && response.statusCode == 200) {
				// Print out the response body
				var botResponse = JSON.parse(body);
				console.log(botResponse);
				var sources = [];
				for (var i = 0; i < botResponse.sources.length;
					i++)
				{
					console.log('adding.. ' +
						botResponse.sources[i].id)
					sources.push(botResponse.sources[i].id)
				}
				tweetFromRandomSource(sources, screen_name, status_id);
			} else {
				console.log('Sorry. No news in this category.');
			}
		});
	}
}



//Tweet top new from a random sorce.
function tweetFromRandomSource(sources, screen_name, status_id){
	var max = sources.length;
	var randomSource = sources[Math.floor(Math.random() *
		(max + 1))];
	topNewsTweeter(randomSource, screen_name, status_id);
}



//topNewsTweeter('ign', null);
//Find and tweet top news.
function topNewsTweeter(newsSource, screen_name, status_id){
	request({
		url: 'https://newsapi.org/v2/top-headlines?sources='
		+ newsSource +
		'&apiKey=',
		method: 'GET'
	},
	function (error, response, body) {
		//response is from the bot
		if (!error && response.statusCode == 200) {
			var botResponse = JSON.parse(body);
			console.log(botResponse);
			tweetTopArticle(botResponse.articles, screen_name);
		} else {
			console.log('Sorry. No new');
		}
	});
} 
//Tweet top new.
function tweetTopArticle(articles, screen_name, status_id){
	var article = articles[0];
	tweet(article.title + " " + article.url, screen_name);
}





var Twitter = new TwitterPackage(secret);



//tweet ('I am a Twitter Bot!', null, null);

//var hashtag = '#NationalCookieDay '; //put any hashtag to listen e.g. #brexit
//twitterhashtag(hashtag);

// Find all tweets with a certain hashtag
function twitterhashtag(hashtag){
	console.log('Listening to:' + hashtag);

	Twitter.stream('statuses/filter', {track: hashtag}, function(stream) {
		stream.on('data', function(tweet) {
			console.log('Tweet:@' + tweet.user.screen_name + '\t' + tweet.text);
			console.log('------')
		});
		stream.on('error', function(error) {
			console.log(error);
		});
	});
}




// Make a tweet to a person.
function tweet(statusMsg, screen_name, status_id){
	console.log('Sending tweet to: ' + screen_name);
	console.log('In response to:' + status_id);
	var msg = statusMsg;
	var status_id_response = status_id;
	if (screen_name != null){
		msg = '@' + screen_name + ' ' + statusMsg;
	}
	console.log('Tweet:' + msg);
	Twitter.post('statuses/update', {
		status: msg,
		in_reply_to_status_id: status_id_response
		}, function(err, response) {
			// if there was an error while tweeting
			if (err) {
				console.log('Something went wrong while TWEETING...');
				console.log(err);
			}
			else if (response) {
				console.log('Tweeted!!!');
				console.log(response)
			}
	});
}

//var retweetId = '1064342035308646408';
//retweet(retweetId);

// Make a retweet with a Id of a tweet.
function retweet(retweetId){
	Twitter.post('statuses/retweet/', {
		id: retweetId
	}, function(err, response) {
		if (err) {
			console.log('Something went wrong while RETWEETING...');
			console.log(err);
		}
		else if (response) {
			console.log('Retweeted!!!');
			console.log(response)
		}
	});
}

//search('#brexit', 'recent')

//Search for 15(default number) tweets with a hashtag.
function search(hashtag, resultType){
	var params = {
		q: hashtag, // REQUIRED
		result_type: resultType, //mixed,recent or popular
		lang: 'en'
	} 
	Twitter.get('search/tweets', params, function(err, data) {
		if (!err) {
			console.log('Found tweets: ' + data.statuses.length);
			console.log('First one: ' + data.statuses[1].text);
			console.log('Second one: ' + data.statuses[2].text);
			console.log('Third one: ' + data.statuses[3].text);
			console.log('Fourth one: ' + data.statuses[4].text);
			console.log('Fifth one: ' + data.statuses[5].text);
		}
		else {
			console.log('Something went wrong while SEARCHING...');
		}
	});
}


//getAllSourcesAndTweet();
// Get a random source.
function getAllSourcesAndTweet(){
	var sources = [];
	console.log('getting sources...')
	request({
			url: 'https://newsapi.org/v2/sources?apiKey=',
				method: 'GET'
		},
		function (error, response, body) {
			//response is from the bot
			if (!error && response.statusCode == 200) {
				// Print out the response body
				var botResponse = JSON.parse(body);
				for (var i = 0; i < botResponse.sources.length;
					i++){
					console.log('adding.. ' +
						botResponse.sources[i].id)
					sources.push(botResponse.sources[i].id)
				}
				tweetFromRandomSource(sources, null, null);
			} else {
				console.log('Sorry. No news sources!');
			}
		});
}



//var url = "https://g1.globo.com/educacao/guia-de-carreiras/noticia/2018/12/03/mais-medicos-triplica-as-vagas-de-residencia-em-medicina-de-familia-mas-dois-tercos-delas-estao-ociosas.ghtml";
//isFakeNews(url);
function isFakeNews(url) {
	request(
		{
			url: "https://api.fakenewsdetector.org/votes?url="+url+"&title=",
			method: "GET"
		},
		function(error, response, body) {
			if (!error && response.statusCode == 200) {
				var response = JSON.parse(body);
				console.log("\n Verificando noticia:" + url + "\n");
				if(response.domain.category_id==1)console.log("Noticia Real");
				if(response.domain.category_id==2)console.log("Noticia Falsa");
				if(response.domain.category_id==3)console.log("Clickbait");
				if(response.domain.category_id==4)console.log("Extremamente Tendencioso");
				if(response.domain.category_id==5)console.log("Satira");
				if(response.domain.category_id==6)console.log("Nao é noticia");

				console.log("fake news:                " + 100 * Number(response.robot.fake_news) + "%");
				console.log("clickbait:                " + 100 * Number(response.robot.clickbait) + "%");
				console.log("extremamente tendencioso: " + 100 * Number(response.robot.extremely_biased) + "%");
			} else{
				console.log("Sorry. URL error");
				console.log(url);
			}
		}
	);
}
