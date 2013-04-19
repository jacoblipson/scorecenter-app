// Express initialization
var express = require('express');
var app = express(express.logger());
app.use(express.bodyParser());
app.set('title', 'ScoreCenter');

//Enable CORS
app.all('/', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
 });

// Mongo initialization
var mongoUri = process.env.MONGOLAB_URI || 
  process.env.MONGOHQ_URL || 'mongodb://localhost:27017/scorecenter';
var mongo = require('mongodb');
var db = mongo.Db.connect(mongoUri, function (error, databaseConnection) {
	console.log(error);
	db = databaseConnection;
});

app.post('/submit.json', function (request, response) {
	app.set('Content-Type', 'text/json');
	request.header("Access-Control-Allow-Origin","*");
	request.header("Access-Control-Allow-Headers", "X-Requested-With");
	if (request.body.game_title && request.body.username && request.body.score) {
		var now = new Date;
		input = {"game_title":request.body.game_title, "username":request.body.username, "score":request.body.score, "created_at": now};
		console.log(input);
		db.collection('scores', function (err, scores) {
			console.log(err);
			scores.insert(input);
			console.log('inserting');
		});
	}
});


app.get('/', function (request, response) {
	db.collection('scores', function (err, scores) {
		scores.find().sort({game_title:1}, function(err, cursor) {
			console.log(err);
			var content = '';
			cursor.each(function (err, item) {
				console.log(err);
				if (item != null) {
					content = content + '<tr><td>' + item.game_title + '</td><td>' + item.username + '</td><td>' + item.score + '</td><td>' + item.created_at + '</td></tr>';
				}
				else {
					db.close();
					response.set('Content-Type', 'text/html');
					response.send('<html><head><title>High Scores</title></head><body><h1>High Scores</h1><a href="/usersearch">Find scores for a specific user</a><p>Find scores for a specific game: </p><form name="input" action="highscores.json" method="get">Game Title: <input type="text" name="game_title"><input type="submit" value="Submit"></form><p><h2>All Scores</h2><table border=1px width=500px><tr><td>Game</td><td>Username</td><td>Score</td><td>Created At</td></tr>' + content + '</table></p></body></html>');
				}
			});
		});
	});
});


app.get('/highscores.json', function(request, response) {
	var game = request.query;
	var content = '';
	db.collection('scores', function (err, scores) {
		scores.find(game).sort( {score: -1} ).limit( 10, function (err, cursor) {
			console.log(err);
			cursor.each(function (err, item) {
				console.log(err);
				if (item != null) {
					content = content + JSON.stringify(item);
				}
				else {
					db.close();
					response.set('Content-Type', 'text/json');
					response.send(content);
				}
			});
		});
	});
});

app.get('/usersearch', function(request, response) {
	response.set('Content-Type', 'text/html');
	response.send('<html><head><title>User Score Search</title></head><body><h1>User Score Search</h1><p>Find scores for a specific user: </p><form name="input" action="showuserscores" method="post">Username: <input type="text" name="username"><input type="submit" value="Submit"></form><a href="/">Back to all scores</a></body></html>');
});

app.post('/showuserscores', function(request, response) {
	var user = request.body.username;
	db.collection('scores', function(error, scores) {
		scores.find({username: user}).sort({game_title:1}, function (error, cursor) {
			console.log(error);
			var content = '';
			cursor.each(function (err, item) {
				console.log(err);
				if (item != null) {
					content = content + '<tr><td>' + item.game_title + '</td><td>' + item.username + '</td><td>' + item.score + '</td><td>' + item.created_at + '</td></tr>';
				}
				else {
					db.close();
					response.set('Content-Type', 'text/html');
					response.send('<html><head><title>User Score Search</title></head><body><h1>User Score Search</h1><h2>Displaying scores for: ' + user + '</h2><p><table border=1px width=500px><tr><td>Game</td><td>Username</td><td>Score</td><td>Created At</td></tr>' + content + '</table></p><a href="/usersearch">Back to user search</a></body></html>');
				}
			});
		});
	});
});

// Oh joy! http://stackoverflow.com/questions/15693192/heroku-node-js-error-web-process-failed-to-bind-to-port-within-60-seconds-of
app.listen(process.env.PORT || 8000);