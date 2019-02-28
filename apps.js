var http = require('http');
// var fs = require('fs');
var express = require('express');
var app = express();
var mysql = require('mysql');
var bodyParser = require('body-parser')
// var path = require('path');
// var finalhandler = require('finalhandler');
// var serveStatic = require('serve-static');

// var serve = serveStatic('html/static');

//IP 10.158.3.101
const hostname = '127.0.0.1';
const port = 3000;

var mysql_con = mysql.createConnection({
	host: "10.158.3.101",
	user: "componentshare",
	password: "134compshare",
	database: "userdb",
	// _socket: '/var/run/mysqld/mysqld.sock',
});

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/html/login.html')
})
app.post('/login', function (req, res) {
	res.send('Log in')
})

app.get('/signup', function (req, res) {
	res.sendFile(__dirname + '/html/signup.html')
})

app.post('/signup', function (req, res) {
	mysql_con.connect(function(err){
		if(err) throw err;
		var sql_com_usrprof = "INSERT INTO usrprofiles (fname, lname, email, contactnum) VALUES (?, ?, ?, ?)";
		var sql_com_usrlog = "INSERT INTO usrlogin (uname, pword) VALUES (?, ?)";
		con.query(sql_com_usrprof,[req.body.firstname, req.body.lastname, req.body.email, req.body.number], function(err, result){
			console.log("1 record inserted");
		});
		con.query(sql_com_usrlog, [req.body.username, req.body.password], function(err, result){
			console.log("1 record inserted");
		});
	})
})
app.listen(port)




// http.createServer((req, res, next) => {
	
// 	var done = finalhandler(req, res);
// 	serve(req, res, done);
// 	// res.sendFile(__dirname + '/html/login.html');
// 	fs.readFile(__dirname + '/html/login.html', function(err, data){
// 		// res.statusCode = 200;
// 		// res.setHeader('Content-Type', 'text/html');
// 		res.write(data);
// 		res.end()
// 	});	
// }).listen(3000);