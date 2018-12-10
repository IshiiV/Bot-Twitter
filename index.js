//index.js

var TwitterPackage = require('twitter');
var request = require('request');

console.log("Hello World! I am a twitter bot!");

var secret = {
	consumer_key: '1J1KO6C7Nxnfby36FNbCHsVJR',
	consumer_secret: '5Dm0K27vo2oQAT0rgmjNYzVaCJhtrYfppWWbxaqHUbscENahsv',
	access_token_key: '1066778119955251200-lAHbbRm5I1rr7QOqpGq0MR0OycmNsF',
	access_token_secret: '90er4kffE926qgZZLU6Ua4VkRGWzzYYzTnS9qFyIlIUX7'
}

var MongoClient = require('mongodb').MongoClient;
// Connection URL
var url = 'mongodb://userteste:ufcbot1@ds129454.mlab.com:29454/bot';
// Use connect method to connect to the server

var Twitter = new TwitterPackage(secret);


var userInterests = [];
var urlnews = ""; 
var urlarticle = "";

//Função responsável pra tweetar notícias
loadUserData();


twitterhashtag("#meutwitterbot", (screen_name, text)=> {
 	responseUser(screen_name,text);
});

twitterhashtagfakenews("#meutwitterbotnews", (screen_name, text)=> {
 	responseUserFakenews(screen_name,text);
});






function loadUserData(){
	//setInterval(function () {
		console.log("\n ------------- Send News (" + new Date() + ")-------------\n");

		// Use connect method to connect to the server
		MongoClient.connect(url, function(err, db) {
			console.log("Connected successfully to server");
			findDocuments(db, function(docs) {
				//console.log("Found the following records");
				userInterests = [];
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
				
				for (var i=0; i < userInterests.length; i++){
					var user = userInterests[i];
					var screen_name = user.screen_name;
					var country = 'br';
					var interest = user.user_interest;
					var status_id = user.in_reply_to_status_id;
					//console.log('screen_name: '+screen_name+" interest: "+interest+" i: "+i+"PRIMEIRO");
					//console.log(userInterests.length);
					//get sources
					topcountrytweet(user,screen_name,country,interest,status_id,
						(articles, screen_name, status_id) => {
							tweetTopArticle(articles, screen_name, status_id);
						}
					);
					//console.log('screen_name: '+screen_name+" interest: "+interest+" i: "+i+"ultimio");
				}
			});
		});
//}, 60 * 1000); 
}

function findDocuments(db, callback) {
// Get the documents collection
	var collection = db.collection('users');
// Find documents
	collection.find({}).toArray(function(err, docs) {
		callback(docs);
	});
}

//Encontrar lista da notícias mais importantes.
function topcountrytweet(user,screen_name,country,interest,status_id, callback){
	request({
		url: 'https://newsapi.org/v2/top-headlines?country=' +
			country +'&category=' +
			interest +'&apiKey=02bca42e3f5f421d874ba4107e3cc249',
		method: 'GET'
	},
	function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log('\nTweeting news');
			var botResponse = JSON.parse(body);
			//console.log(botResponse);
			console.log('screen_name: '+screen_name+" interest: "+interest);
			
			//tweetTopArticle(botResponse.articles, screen_name, status_id);
			callback(botResponse.articles, screen_name, status_id);
		} else {
			console.log('Sorry. No new');
		}
	});
}

//find top new.
function tweetTopArticle(articles, screen_name, status_id){
	var article = articles[1];
	//urlnews = '';
	isFakeNews(article.url);
	//tweet(article.title + " " + article.url, screen_name);
	tweeturlfake(article.title + " " + article.url, screen_name);
}

function tweeturlfake(statusMsg, screen_name, status_id){
	setTimeout(function () {
		console.log('\nSending tweet to: ' + screen_name);
		console.log('In response to:' + status_id);
		var msg = statusMsg;
		var status_id_response = status_id;
		if (screen_name != null){
			msg = '@' + screen_name + ' ' + statusMsg;
		}
		msg = msg.concat("\nResultado do Fakenewsdetector: "+urlnews);
		msg = msg.concat(" "+ new Date());
		console.log('Tweet:' + msg);
		
		Twitter.post('statuses/update', {
			status: msg,
			in_reply_to_status_id: status_id_response
			}, function(err, response) {
				// if there was an error while tweeting
				if (err) {
					console.log('Something went wrong while TWEETING...');
					console.log('screen_name: '+screen_name+" msg: "+msg);
					console.log(err);
				}
				else if (response) {
					console.log('Tweeted!!!');
					//console.log(response)
				}
		});
	}, 10000);
}

function responseUser (screen_name, text){
	console.log('Tweet Msg:' + text);
	console.log('Tweet from:' + '@' + screen_name);

	var userInterest = getInterestedGenre(text);
	var userSentiment = getSentiment(text);
	var user = { 'screen_name' : screen_name,
	'user_interest' : userInterest};

	console.log(user);
	// Use connect method to connect to the server
	MongoClient.connect(url, function(err, db) {
		console.log("Connected successfully to server");
		var collection = db.collection('users');
		if (userSentiment == 'positive'){
			collection.insertMany([user], function(err, result) {
				if (err){
					console.log(err);
				} else {
					console.log("Inserted a user interest into the collection");
					db.close();
				}
			});
		} else {
			collection.deleteOne(user, function(err, result) {
				//console.log(err);
				console.log("Deleted a user interest from the collection");
				db.close();
			});
		}
	});
}

function getSentiment(text){
	if (text.search('not interested') != -1){
		return 'negative';
	}
	if (text.search('no more') != -1){
		return 'negative';
	}
	if (text.search('don\'t send') != -1){
		return 'negative';
	}
	if (text.search('no ') != -1){
		return 'negative';
	}
	if (text.search('dont like ') != -1){
		return 'negative';
	}
	if (text.search('unsubscribe ') != -1){
		return 'negative';
	}
	if (text.search('don\'t follow ') != -1){
		return 'negative';
	}
	if (text.search('stop ') != -1){
		return 'negative';
	}
	//Informations in portuguese
	if (text.search('não ') != -1){
		return 'negative';
	}
	if (text.search('pare ') != -1){
		return 'negative';
	}
	if (text.search('cancelar ') != -1){
		return 'negative';
	}
	return 'positive';
}

function getInterestedGenre(text){
	if (text.search('tech') != -1 || text.search('technology') != -1 || text.search('tecnologia') != -1 ){
		return 'technology';
	}
	else if (text.search('all kinds') != -1 || text.search('') != -1){
		return 'general';
	}
	else if (text.search('sports') != -1 || text.search('esportes') != -1){
		return 'sports';
	}
	else if (text.search('business') != -1 || text.search('negócios') != -1){
		return 'business';
	}
	else if (text.search('entertainment') != -1 || text.search('entretenimento') != -1){
		return 'entertainment';
	}
	else if (text.search('health') != -1 || text.search('saúde') != -1){
		return 'health';
	}
	else if (text.search('science') != -1 || text.search('ciência') != -1){
		return 'science';
	}
}

function responseUserFakenews(screen_name, text){
	var responseurl = text.substr(19); 
	console.log('URL:' + responseurl);
	console.log('Tweet from:' + '@' + screen_name);

	isFakeNews1(screen_name,responseurl);
	//console.log(urlnews);
}


//var hashtag = '#NationalCookieDay '; //put any hashtag to listen e.g. #brexit
//twitterhashtag(hashtag);

// Find all tweets with a certain hashtag
function twitterhashtag(hashtag, callback){
	console.log('Listening to:' + hashtag);

	Twitter.stream('statuses/filter', {track: hashtag}, function(stream) {
		stream.on('data', function(tweet) {
			console.log('Tweet:@' + tweet.user.screen_name + '\t' + tweet.text);
			console.log('------')
			callback(tweet.user.screen_name, tweet.text);
		});
		stream.on('error', function(error) {
			console.log(error);
		});
	});
}

function twitterhashtagfakenews(hashtag, callback){
	console.log('Listening to:' + hashtag);

	Twitter.stream('statuses/filter', {track: hashtag}, function(stream) {
		stream.on('data', function(tweet) {
			console.log('Verifica notícia de @' + tweet.user.screen_name + '\t tweet: ' + tweet.text);
			console.log('------')
			callback(tweet.user.screen_name, tweet.text);
		});
		stream.on('error', function(error) {
			console.log(error);
		});
	});
}


/*Lista dos domínios verificados:
    "cnn.com",
    "nytimes.com",
    "theguardian.com",
    "washingtonpost.com",
    "bbc.co.uk",
    "forbes.com",
    "g1.globo.com",
    "estadao.com.br",
    "folha.com.br",
    "uol.com.br",
*/ 
//isFakeNews(url);
function isFakeNews(url,callback) {
	request(
		{
			url: "https://api.fakenewsdetector.org/votes?url="+url+"&title=",
			method: "GET"
		},
		function(error, response, body) {
			var rebalancedChance = 0;

			urlnews = "";
			if (!error && response.statusCode == 200) {
				var response = JSON.parse(body);
				console.log("\nVerificando notícia: " + url + "\n");
				if(response.domain != null){
					if(response.domain.category_id==1)urlnews = urlnews.concat("Notícia Real.")
					if(response.domain.category_id==2)urlnews = urlnews.concat("Notícia Falsa");
					if(response.domain.category_id==3)urlnews = urlnews.concat("Clickbait");
					if(response.domain.category_id==4)urlnews = urlnews.concat("Extremamente Tendencioso");
					if(response.domain.category_id==5)urlnews = urlnews.concat("Satira");
					if(response.domain.category_id==6)urlnews = urlnews.concat("Nao é notícia");
				}
				else{
				//robot predictions
				    if (Number(response.robot.fake_news) > 0.5){
			    	    rebalancedChance = (Number(response.robot.fake_news) * 100 - 50) * 2
					    if (rebalancedChance >= 66)
					    	urlnews = urlnews.concat("Tenho quase certeza que é Fake news.");
					    else if (rebalancedChance >= 33)
					        urlnews = urlnews.concat("Parece muito ser Fake news.");
					    else
					        urlnews = urlnews.concat("Parece ser Fake news.");
				    }    
				    if (Number(response.robot.clickbait) > 0.5){
			    	    rebalancedChance = (Number(response.robot.clickbait) * 100 - 50) * 2
					    if (rebalancedChance >= 66)
					    	urlnews = urlnews.concat("Tenho quase certeza que é Clickbait.");
					    else if (rebalancedChance >= 33)
					        urlnews = urlnews.concat("Parece muito ser Clickbait.");
					    else
					        urlnews = urlnews.concat("Parece ser Clickbait.");
				    }   
				    if (Number(response.robot.extremely_biased) > 0.5){
			    	    rebalancedChance = (Number(response.robot.extremely_biased) * 100 - 50) * 2
					    if (rebalancedChance >= 66)
					    	urlnews = urlnews.concat("Tenho quase certeza que é Extremamente tendencioso.");
					    else if (rebalancedChance >= 33)
					        urlnews = urlnews.concat("Parece muito ser Extremamente tendencioso.");
					    else
					        urlnews = urlnews.concat("Parece ser Extremamente tendencioso.");
				    }  
				    if ((Number(response.robot.fake_news) < 0.5)&&(Number(response.robot.clickbait) < 0.5)&&(Number(response.robot.extremely_biased) < 0.5))
 						urlnews = urlnews.concat("Tendencioso.");
				}
				console.log(urlnews);
			} else{
				console.log("Sorry. URL error");
				console.log(url);
			}
		}
	);
}



//------------------FUNÇÕES QUE NÃO ESTÃO SENDO USADAS---------------------


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
				console.log('screen_name: '+screen_name+" msg: "+msg);
				console.log(err);
			}
			else if (response) {
				console.log('Tweeted!!!');
				//console.log(response)
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
			url: 'https://newsapi.org/v2/sources?apiKey=02bca42e3f5f421d874ba4107e3cc249',
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
				'&apiKey=02bca42e3f5f421d874ba4107e3cc249',
			method: 'GET'
		},
		function (error, response, body) {
			if (!error && response.statusCode == 200) {
				// Print out the response body
				var botResponse = JSON.parse(body);
				//console.log(botResponse);
				var sources = [];
				for (var i = 0; i < botResponse.sources.length;
					i++)
				{
					//console.log('adding.. ' + botResponse.sources[i].id)
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
		'&apiKey=02bca42e3f5f421d874ba4107e3cc249',
		method: 'GET'
	},
	function (error, response, body) {
		//response is from the bot
		if (!error && response.statusCode == 200) {
			var botResponse = JSON.parse(body);
			//console.log(botResponse);
			tweetTopArticle(botResponse.articles, screen_name);
		} else {
			console.log('Sorry. No new');
		}
	});
} 

function isFakeNews1(screen_name,url,callback) {
	request(
		{
			url: "https://api.fakenewsdetector.org/votes?url="+url+"&title=",
			method: "GET"
		},
		function(error, response, body) {
			var rebalancedChance = 0;

			urlnews = "";
			if (!error && response.statusCode == 200) {
				var response = JSON.parse(body);
				console.log("\nVerificando notícia: " + url + "\n");
				if(response.domain != null){
					if(response.domain.category_id==1)urlnews = urlnews.concat("Notícia Real.")
					if(response.domain.category_id==2)urlnews = urlnews.concat("Notícia Falsa");
					if(response.domain.category_id==3)urlnews = urlnews.concat("Clickbait");
					if(response.domain.category_id==4)urlnews = urlnews.concat("Extremamente Tendencioso");
					if(response.domain.category_id==5)urlnews = urlnews.concat("Satira");
					if(response.domain.category_id==6)urlnews = urlnews.concat("Nao é notícia");
				}
				else{
				//robot predictions
				    if (Number(response.robot.fake_news) > 0.5){
			    	    rebalancedChance = (Number(response.robot.fake_news) * 100 - 50) * 2
					    if (rebalancedChance >= 66)
					    	urlnews = urlnews.concat("Tenho quase certeza que é Fake news.");
					    else if (rebalancedChance >= 33)
					        urlnews = urlnews.concat("Parece muito ser Fake news.");
					    else
					        urlnews = urlnews.concat("Parece ser Fake news.");
				    }    
				    if (Number(response.robot.clickbait) > 0.5){
			    	    rebalancedChance = (Number(response.robot.clickbait) * 100 - 50) * 2
					    if (rebalancedChance >= 66)
					    	urlnews = urlnews.concat("Tenho quase certeza que é Clickbait.");
					    else if (rebalancedChance >= 33)
					        urlnews = urlnews.concat("Parece muito ser Clickbait.");
					    else
					        urlnews = urlnews.concat("Parece ser Clickbait.");
				    }   
				    if (Number(response.robot.extremely_biased) > 0.5){
			    	    rebalancedChance = (Number(response.robot.extremely_biased) * 100 - 50) * 2
					    if (rebalancedChance >= 66)
					    	urlnews = urlnews.concat("Tenho quase certeza que é Extremamente tendencioso.");
					    else if (rebalancedChance >= 33)
					        urlnews = urlnews.concat("Parece muito ser Extremamente tendencioso.");
					    else
					        urlnews = urlnews.concat("Parece ser Extremamente tendencioso.");
				    }  
				    if ((Number(response.robot.fake_news) < 0.5)&&(Number(response.robot.clickbait) < 0.5)&&(Number(response.robot.extremely_biased) < 0.5))
 						urlnews = urlnews.concat("Tendencioso.");
				}
				console.log(urlnews);
				tweet(urlnews,screen_name);
			} else{
				console.log("Sorry. URL error");
				console.log(url);
			}
		}
	);
}
