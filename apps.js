
var http = require('http');
var express = require('express');
var app = express();
var mysql = require('mysql');
var bodyParser = require('body-parser')
var validator = require('validator')
var promise = require('promise')
var session = require('express-session')


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
	
	console.log('Looking for table usrprofiles.');

	let createUsrprofiles = "CREATE TABLE IF NOT EXISTS usrprofiles(profile_id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,fname varchar(40) NOT NULL, lname varchar(40) NOT NULL, email varchar(40), contactnum bigint(20))";
	mysql_con.query(createUsrprofiles, function(err, results, fields){
		if(err){
			console.log(err.message);
		}
	});
	
        console.log('Looking for table usrlogin');
	let createUsrlogin = "CREATE TABLE IF NOT EXISTS usrlogin(user_id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,uname varchar(20) NOT NULL, pword varchar(20) NOT NULL, profile_id INT NOT NULL,FOREIGN KEY fk_usrlogin(profile_id) REFERENCES usrprofiles(profile_id))";
	mysql_con.query(createUsrlogin, function(err, results, fields){
		if(err){
			console.log(err.message);
		} 
	});

	 console.log('Looking for table inventory.');
	let createInventory = "CREATE TABLE IF NOT EXISTS inventory(inv_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,profile_id INT NOT NULL,FOREIGN KEY fk_inventory(profile_id) REFERENCES usrprofiles(profile_id),timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,i_quantity int(11),i_item varchar(45),	i_resistance varchar(45), i_RESwattage varchar(45),i_capacitance varchar(45),i_CAPtype varchar(45),i_CAPvoltage varchar(45),i_ICnum varchar(45),i_ICpackage varchar(45),i_LEDcolor varchar(45),	i_LEDsize varchar(45),i_MISCname varchar(100),	i_remarks text)";
	mysql_con.query(createInventory, function(err, results, fields){
		if(err){
			console.log(err.message);
		}
	});
        console.log('Looking for table request.');
	let createRequest =  "CREATE TABLE IF NOT EXISTS request(req_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,profile_id INT NOT NULL, FOREIGN KEY fk_request(profile_id) REFERENCES usrprofiles(profile_id),timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, r_quantity int(11), r_item varchar(45),r_resistance varchar(45),r_RESwattage varchar(45),	r_capacitance varchar(45),r_CAPtype varchar(45),r_CAPvoltage varchar(45),r_ICnum varchar(45),r_ICpackage varchar(45),r_LEDcolor varchar(45),r_LEDsize varchar(45),r_MISCname varchar(100),r_remarks text)";
	 mysql_con.query(createRequest, function(err, results, fields){
                if(err){
                        console.log(err.message);
                }
        });
	
	console.log('Application running at 10.158.3.101:3000');
});
global.db = mysql_con;

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use(session({
	key: 'user_sid',
	secret: 'big bad wolf',
	resave: false,
	saveUninitialized:true,
	cookie: {maxAge: 60000}
}))
	
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
	// res.sendFile(__dirname + '/html/login.html');
	res.render('pages/login')
})

app.post('/login', function (req, res) {
	var sess = req.session;
	var sql_com = "SELECT profile_id, uname FROM usrlogin WHERE uname='"+req.body.username+"' and pword ='"+req.body.password+"'"; 
	db.query(sql_com, function(err, result){
		if(result.length){
			sess.userId = result[0].profile_id;
			sess.user = result[0];
			console.log(result[0].profile_id);
			res.redirect('/home')
		}
		else
		{
			message = 'Incorrect username or password!';
			res.redirect('/');
		}
	})
})

app.get('/home', function(req, res){
	var userId = req.session.userId;
	var sql_com_inventory = "SELECT * FROM inventory WHERE profile_id='"+userId+"'";
	var sql_com_request = "SELECT * FROM request WHERE profile_id='"+userId+"'";
	var sql_com_inventory_all = "SELECT * FROM inventory";
	var sql_com_request_all = "SELECT * FROM request";

	var inventory;
	var request;
	var inventory_all;
	var request_all;
	mysql_con.query(sql_com_inventory, function(err, result, fields){
		if (err)
		{
			inventory = [];
		}
		else
		{
			inventory = result;
		}
		mysql_con.query(sql_com_request, function(err2, result2, fields2){
			if (err) 
			{
				request = [];
			}
			else
			{
				request = result2;
			}
			mysql_con.query(sql_com_inventory_all, function(err3, result3, fields3){
				if (err)
				{
					inventory_all = [];
				}
				else
				{
					inventory_all = result3;
				}
				mysql_con.query(sql_com_request, function(err4, result4, fields4){
					if (err) 
					{
						request_all = [];
					}
					else
					{
						request_all = result4;
					}
					res.render('pages/home', {
						inventory: inventory,
						request: request,
						inventory_all: inventory_all,
						request_all: request_all
					})
				})
			})
		})
	})
})
app.post('/logout', function(req, res){
	var sess = req.session;
	console.log('User logged out');
	sess.destroy();
	if(sess.user && sess.user_sid){
		res.clearCookie('user_sid');
		res.redirect('/');
	}else{
		re.redirect('/login');
	}
}); 
app.post('/deleterequest', function(req, res){
	var sql_com_delreq = "DELETE FROM request where req_id=?";
	console.log(req.body)
	mysql_con.query(sql_com_delreq, [parseInt(req.body.req_id, 10)], function(err, result){
		if (err)
		{
			res.send("Unable to delete " + req.body.req_id);
			console.log(err);
		}
		else
		{
			res.redirect('/home')
		}
	})
})
app.post('/deleteinventory', function(req, res){
	var sql_com_delinv = "DELETE FROM inventory where inv_id=?";
	console.log(req.body)
	mysql_con.query(sql_com_delinv, [parseInt(req.body.inv_id, 10)], function(err, result){
		if (err)
		{
			res.send("Unable to delete " + req.body.inv_id);
			console.log(err);
		}
		else
		{
			res.redirect('/home')
		}
	})
})


app.get('/signup', function (req, res) {
	res.render('pages/signup')
})

app.post('/registered', function (req, res) {
	var sql_com_usrprof = "INSERT INTO usrprofiles (fname, lname, email, contactnum) VALUES (?, ?, ?, ?)";
	var sql_com_usrid = "SELECT profile_id FROM usrprofiles WHERE email=?";
	var sql_com_usrnm = "SELECT * FROM usrlogin where uname=?";
	var sql_com_usrlog = "INSERT INTO usrlogin (uname, pword, profile_id) VALUES (?, ?, ?)";
	var prof_id;
	if(!validator.isEmail(req.body.email)){
		console.log('Email is invalid')
		res.redirect('/signup')
	}
	else{
		if(!validator.isMobilePhone(req.body.number)){
			console.log('Mobile number is invalid')
			res.redirect('/signup')
		}
		else{
			mysql_con.query(sql_com_usrnm,[req.body.username], function(err0, result0, fields0){
				if(result0.length == 0){
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
				}
				else{
					console.log('Username already taken')
					res.redirect('/signup')
				}
			})
		}
	}
})
// })

app.get('/addinv', function(req, res) {
	// res.sendFile(__dirname + '/html/addinv.html')
	res.render('pages/addinv')
})

app.get('/addreq', function(req, res) {
	// res.sendFile(__dirname + '/html/addreq.html')
	res.render('pages/addreq')
})

app.post('/addreq', function(req, res) {
	// mysql_con.connect(function(err){
	// 	if(err) throw err;
	var userId = req.session.userId;
	var sql_com_addreq = "INSERT INTO request (r_quantity, r_item, r_voltage, r_wattage, r_remarks, profile_id) VALUES (?, ?, ?, ?, ?, ?)";
	mysql_con.query(sql_com_addreq, [req.body.quantity, req.body.component, req.body.voltage, req.body.wattage, req.body.others, userId], function(err, result){
		if(err) throw err;
		console.log("1 record inserted into request for ", app.get("profile_id"));
		res.redirect('/home')
	}) 
})

app.post('/addinv', function(req, res) {
	// mysql_con.connect(function(err){
	// 	if(err) throw err;
	var userId = req.session.userId;
	var sql_com_addreq = "INSERT INTO inventory (i_quantity, i_item, i_voltage, i_wattage, i_remarks, profile_id) VALUES (?, ?, ?, ?, ?, ?)";
	mysql_con.query(sql_com_addreq, [req.body.quantity, req.body.component, req.body.voltage, req.body.wattage, req.body.others, userId], function(err, result){
		if(err) throw err;
		console.log("1 record inserted into inventory for ", app.get("profile_id"));
		res.redirect('/home')
	}) 
})
// })

app.listen(port);
