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

mysql_con.connect(function(err){
		if(err) throw err;
});

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
// app.use(express.bodyParser());

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/html/login.html');
})

app.post('/login', function (req, res) {
	// var sql_usrlog = 
	// mysql_con.connect(function(err){
	// 	if(err) throw err;
	var sql_com_uname = "SELECT pword, profile_id FROM usrlogin WHERE uname=?"
	mysql_con.query(sql_com_uname, [req.body.username], function(err, result, fields){
		if(err) throw err;
		console.log(result[0])
		console.log(req.body.password)
		if(isEmpty(result)){
			res.redirect('/')
		}
		else
		{
			if (result[0].pword == req.body.password)
			{
				res.redirect('/home');
				app.set('profile_id', result[0].profile_id);
			}
			else
			{
				res.redirect('/');
			}
		}
		// })
	})
})

app.get('/home', function(req, res){
	var sql_com_inventory = "SELECT * FROM inventory WHERE profile_id=?";
	var sql_com_request = "SELECT * FROM request WHERE profile_id=?";
	var inventory;
	var request;
	mysql_con.query(sql_com_inventory, [app.get("profile_id")], function(err, result, fields){
		if (err)
		{
			inventory = [];
		}
		else
		{
			console.log(result);
			inventory = result;
		}
		mysql_con.query(sql_com_request, [app.get("profile_id")], function(err2, result2, fields2){
			if (err) 
			{
				request = [];
			}
			else
			{
				console.log(result2);
				request = result2;
			}
			res.render('home', {
				inventory: inventory,
				request: request
			});
		})
	})

	// console.log("Homepage for ", app.get("profile_id"))
	// res.sendFile(__dirname + '/html/home.html');
})

app.get('/signup', function (req, res) {
	res.sendFile(__dirname + '/html/signup.html');
})

app.post('/registered', function (req, res) {
	// mysql_con.connect(function(err){
	// 	if(err) throw err;
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
// })

app.get('/addinv', function(req, res) {
	res.sendFile(__dirname + '/html/addinv.html')
})

app.get('/addreq', function(req, res) {
	res.sendFile(__dirname + '/html/addreq.html')
})

app.post('/addreq', function(req, res) {
	// mysql_con.connect(function(err){
	// 	if(err) throw err;
	var sql_com_addreq = "INSERT INTO request (r_quantity, r_item, r_voltage, r_wattage, r_remarks, profile_id) VALUES (?, ?, ?, ?, ?, ?)";
	mysql_con.query(sql_com_addreq, [req.body.quantity, req.body.component, req.body.voltage, req.body.wattage, req.body.others, app.get('profile_id')], function(err, result){
		if(err) throw err;
		console.log("1 record inserted into request for ", app.get("profile_id"));
		res.redirect('/home')
	}) 
})

app.post('/addinv', function(req, res) {
	// mysql_con.connect(function(err){
	// 	if(err) throw err;
	var sql_com_addreq = "INSERT INTO inventory (i_quantity, i_item, i_voltage, i_wattage, i_remarks, profile_id) VALUES (?, ?, ?, ?, ?, ?)";
	mysql_con.query(sql_com_addreq, [req.body.quantity, req.body.component, req.body.voltage, req.body.wattage, req.body.others, app.get('profile_id')], function(err, result){
		if(err) throw err;
		console.log("1 record inserted into inventory for ", app.get("profile_id"));
		res.redirect('/home')
	}) 
})
// })

app.listen(port);
