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
	host: "localhost",
	user: "componentshare",
	password: "134compshare",
	database: "userdb",
});

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
// app.use(express.bodyParser());

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/html/login.html');
})
app.post('/login', function (req, res) {
	// var sql_usrlog = 
	mysql_con.connect(function(err){
		if(err) throw err;
		var sql_com_uname = "SELECT pword FROM usrlogin WHERE uname=?"
		mysql_con.query(sql_com_uname, [req.body.username], function(err, result, fields){
			if(err) throw err;
			console.log(result[0])
			console.log(req.body.password)
			if (result[0].pword == req.body.password)
				res.redirect('/home');
			else
				res.redirect('/');
		})
	})
})

app.get('/home', function(req, res){
	res.send('Home');
})

app.get('/signup', function (req, res) {
	res.sendFile(__dirname + '/html/signup.html');
})

app.post('/registered', function (req, res) {
	mysql_con.connect(function(err){
		if(err) throw err;
		var sql_com_usrprof = "INSERT INTO usrprofiles (fname, lname, email, contactnum) VALUES (?, ?, ?, ?)";
		var sql_com_usrid = "SELECT profile_id FROM usrprofiles WHERE email=?";
		var sql_com_usrlog = "INSERT INTO usrlogin (uname, pword, profile_id) VALUES (?, ?, ?)";
		var prof_id;
		mysql_con.query(sql_com_usrprof,[req.body.firstname, req.body.lastname, req.body.email, req.body.number], function(err, result){
			if(err) throw err;
			console.log("1 record inserted into usrprofiles");
			mysql_con.query(sql_com_usrid, [req.body.email], function (err2, result2, fields){
				if (err) throw err;
				prof_id = result2[0].profile_id;
				mysql_con.query(sql_com_usrlog, [req.body.username, req.body.password, prof_id], function(err3, result3){
					if(err) throw err;
					console.log("1 record inserted into usrlogin");
				});
			});
		});
		res.redirect('/');
	})
})

app.listen(port)
