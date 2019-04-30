var http = require('http');
var express = require('express');
var mysql = require('mysql');
var bodyParser = require('body-parser')
var validator = require('validator')
var promise = require('promise')
var session = require('express-session')
var fs = require('fs')
var nodemailer = require('nodemailer');


var app = express();
var server = app.listen(3000);
var io = require("socket.io").listen(server);

var transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: 'componentshare@gmail.com',
		pass: '134compshare'
	}
})

var components;

const hostname = '127.0.0.1';
const port = 3000;
// var prompt = "";

var mysql_con = mysql.createConnection({
	host: "localhost",
	user: "componentshare",
	password: "134compshare",
	database: "userdb",
	// socketPath: "/var/run/mysqld/mysqld.sock",
	socketPath: "",
	debug: false
});

fs.readFile(__dirname + '/public/js/components.json', function(err, data){
	if (err) throw err;

	components = JSON.parse(data);
	// console.log(components)
})

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
	let createInventory = "CREATE TABLE IF NOT EXISTS inventory(inv_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,profile_id INT NOT NULL,FOREIGN KEY fk_inventory(profile_id) REFERENCES usrprofiles(profile_id),timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, quantity int(11), item varchar(45), remarks text, category tinyint(1) default 0)";
	mysql_con.query(createInventory, function(err, results, fields){
		if(err){
			console.log(err.message);
		}
	});

    console.log('Looking for table request.');
	let createRequest =  "CREATE TABLE IF NOT EXISTS request(req_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT, profile_id INT NOT NULL, FOREIGN KEY fk_request(profile_id) REFERENCES usrprofiles(profile_id),timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, quantity int(11), item varchar(45), remarks text , category tinyint(1) default 1, batchname varchar(50))";
	mysql_con.query(createRequest, function(err, results, fields){
        if(err){
            console.log(err.message);
        }
    });

	console.log('Looking for table batches.');
	let createBatches =  "CREATE TABLE IF NOT EXISTS batches(batch_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT, batchname varchar(50), quantities TEXT, items TEXT, remarks LONGTEXT)";
	mysql_con.query(createBatches, function(err, results, fields){
        if(err){
            console.log(err.message);
        }
    });    

	console.log('Looking for table matches.');
	let createMatches = "CREATE TABLE IF NOT EXISTS matches(match_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT, inv_profile_id INT NOT NULL, FOREIGN KEY fk_inv_profile(inv_profile_id) REFERENCES usrprofiles(profile_id), inv_id INT NOT NULL, FOREIGN KEY fk_inv_matches(inv_id) REFERENCES inventory(inv_id) ON DELETE CASCADE, req_profile_id INT NOT NULL, FOREIGN KEY fk_req_profile(req_profile_id) REFERENCES usrprofiles(profile_id), req_id INT NOT NULL, FOREIGN KEY fk_req_matches(req_id) REFERENCES request(req_id) ON DELETE CASCADE, done tinyint(1) default 0)";
	mysql_con.query(createMatches, function(err, results, fields) {
		if(err) {
			console.log(err.message);
		}
	})

	console.log('Looking for table messages')
	let createMessages = "CREATE TABLE IF NOT EXISTS messages(msg_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT, user_from VARCHAR(40), user_to VARCHAR(40), message text)";
	mysql_con.query(createMessages, function(err, results, fields){
		if(err){
			console.log(err.message);
		}
	})

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
	cookie: {maxAge: null}
}))
	
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
	var prompt = "";
	res.render('pages/login', {
		prompt : prompt
	})
})

app.post('/login', function (req, res) {
	var sess = req.session;
	var sql_com = "SELECT profile_id, uname FROM usrlogin WHERE uname='"+req.body.username+"' and pword ='"+req.body.password+"'"; 
	db.query(sql_com, function(err, result){
		if(result.length){
			sess.userId = result[0].profile_id;
			sess.username = result[0].uname;
			console.log(sess.username + " logged in");
			res.redirect('/home')
		}
		else
		{
			var prompt = 'Incorrect username or password!';
			res.render('pages/login', {
				prompt : prompt
			})
		}
	})
})

function readRemarks(database) {
	var data = JSON.parse(JSON.stringify(database))
	data.forEach(function(value, index) {

		var remarks = JSON.parse(value.remarks)
		var remarksKeys = Object.keys(remarks)
		var newRemarks = [];
		
		remarksKeys.forEach(function(value2, index2) {
			// if (index2 > 0)
			// 	newRemarks += "\n"
			if (index2 == 0){
				newRemarks.push(remarks[value2])
			}
			else {
			newRemarks.push(value2 + ": " + remarks[value2])
			}
		})
		data[index].remarks = newRemarks
		// console.log(data[index].remarks)
	})
	return data
}

app.get('/home', function(req, res){
	var userId = req.session.userId;
	var username = req.session.username;
	var sql_com_inventory = "SELECT * FROM inventory WHERE profile_id='"+userId+"'";
	var sql_com_request = "SELECT * FROM request WHERE profile_id='"+userId+"'";
	var sql_com_feed = "SELECT req_id, profile_id, timestamp, quantity, item, remarks, category FROM request UNION SELECT * FROM inventory ORDER BY timestamp ASC";
	var sql_com_match = "SELECT * FROM matches WHERE inv_profile_id='"+userId+"' OR req_profile_id='"+userId+"'";
	var sql_com_profiles = "SELECT * FROM usrlogin"

	var inventory;
	var request;
	var feed;
	var matches;

	mysql_con.query(sql_com_inventory, function(err, result, fields){
		if (err) {
			inventory = [];
		}
		else {
			inventory = result;
		}
		mysql_con.query(sql_com_request, function(err2, result2, fields2){
			if (err) {
				request = [];
			}
			else {
				request = result2;
			}
			mysql_con.query(sql_com_feed, function(err3, result3, fields3){
				if (err) {
					feed = [];
				}
				else {
					feed = result3;
				}
				mysql_con.query(sql_com_match, function(err4, result4, fields4){
					if(err) {
						matches = [];
					}
					else {
						matches = result4;
					}
					mysql_con.query(sql_com_profiles, function(err5, result5, fields5) {
						if(err) {
							profiles = [];
						}
						else {
							profiles = result5;
						}

						inventory = readRemarks(inventory)
						request = readRemarks(request)
						feed = readRemarks(feed)
						res.render('pages/home', {
							userId:  userId,
							username: username,
							inventory: inventory,
							request: request,
							feed: feed,
							matches: JSON.stringify(matches),
							profiles: JSON.stringify(profiles)
						})
					})
				})
			})
		})
	})
})

app.get('/logout', function(req, res){
	var sess = req.session;
	console.log('User logged out');
	sess.destroy();
	if(sess.user && sess.user_sid){
		res.clearCookie('user_sid');
		res.redirect('/');
	}
	else{
		res.redirect('/');
	}
});

app.post('/deleterequest', function(req, res){
	var sql_com_delreq = "DELETE FROM request where req_id=?";
	mysql_con.query(sql_com_delreq, [parseInt(req.body.req_id, 10)], function(err, result){
		if (err)
		{
			res.send("Unable to delete " + req.body.req_id);
			console.log(err);
		}
		else
		{
			console.log(req.body.req_id + ' deleted from request')
			res.redirect('/home')
		}
	})
})
app.post('/deleteinventory', function(req, res){
	var sql_com_delinv = "DELETE FROM inventory where inv_id=?";
	mysql_con.query(sql_com_delinv, [parseInt(req.body.inv_id, 10)], function(err, result){
		if (err)
		{
			res.send("Unable to delete " + req.body.inv_id);
			console.log(err);
		}
		else
		{
			console.log(req.body.inv_id + ' deleted from inventory')
			res.redirect('/home')
		}
	})
})

app.get('/signup', function (req, res) {
	var prompt = "";
	res.render('pages/signup', {
		prompt : prompt
	})
})

app.get('/components', function(req, res) {
	console.log(req)
	res.json(components)
})

app.post('/registered', function (req, res) {
	var sql_com_usrprof = "INSERT INTO usrprofiles (fname, lname, email, contactnum) VALUES (?, ?, ?, ?)";
	var sql_com_usrid = "SELECT profile_id FROM usrprofiles WHERE email=?";
	var sql_com_usrnm = "SELECT * FROM usrlogin where uname=?";
	var sql_com_usrlog = "INSERT INTO usrlogin (uname, pword, profile_id) VALUES (?, ?, ?)";
	var prof_id;
	if(!validator.isEmail(req.body.email)){
		var prompt = 'Email is invalid'
		console.log(prompt)
		res.render('pages/signup', {
			prompt : prompt
		})
	}
	else{
		if(!validator.isMobilePhone(req.body.number)){
			var prompt = 'Mobile number is invalid'
			console.log(prompt)
			res.render('pages/signup', {
				prompt : prompt
			})
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
					var prompt = "Username already taken"
					console.log(prompt)
					res.render('pages/signup', {
						prompt : prompt
					})
				}
			})
		}
	}
})

app.get('/addinv', function(req, res) {
	res.render('pages/addinv');
})

app.get('/addreq', function(req, res) {
	res.render('pages/addreq');
})
app.get('/chat', function(req,res){
	userId = req.session.userId;
	uname = req.session.username;
	// console.log(req)
	console.log("Going to chat with " + req.query["otherId"] + " : " + req.query["otherUname"] + " for " + req.query["component"])
	res.render('pages/chat', {
		username: uname,
		userId:  userId,
		uname: uname,
		otherId: req.query["otherId"],
		otherUname: req.query["otherUname"],
		matched_user: req.query["otherUname"],
		matched_comp: req.query["component"]
	});
});

//Configurable text for the mail
function mailText(firstName, item, remarks, table) {
	var remarksJSON = JSON.parse(remarks)
	var descriptors = Object.keys(remarksJSON)

	text = ""
	text += "Congratulations " + firstName + ",<br><br><br>"
	text += "Your <b>" + item +  "</b> with the following specifications has been matched from your <b>" + table + "</b>.<br><br>"
	text += "<table style='width:100%'>"
	descriptors.forEach(function(value, index) {
		text += "<th>" + value + "</th>"
		text += "<td>" + remarksJSON[value] + "</td>"
		text += "</tr>"
	})
	text += "</table><br>"
	text += "Please login to your account to communicate with your match.<br><br><br>"
	text += "Sincerely,<br><br>"
	text += "Component Share team"
	return text
}

//Sending mail notification
function mailMatched(prof_id, item_id, table) {
	var idKey;

	if (table=='request') {
		idKey = 'req_id';
	}
	else {
		idKey = 'inv_id';
	}
	// console.log("Sending email...")
	var sql_com_item_desc = 'SELECT * FROM ' + table + ' WHERE ' + idKey + ' = ' + item_id;
	var sql_com_prof = 'SELECT * FROM usrprofiles WHERE profile_id = (?)';
	var email;
	var firstName;

	db.query(sql_com_prof, prof_id, function(err, result) {
		if (err) throw err;
		console.log(prof_id)
		email = result[0].email;
		firstName = result[0].fname;
		// console.log(email)
		db.query(sql_com_item_desc, function(err2, result2) {
			if (err2) throw err2;
			// console.log(result2)
			var mailOptions = {
				from : 'componentshare@gmail.com',
				to : email,
				subject : 'Item matched from ' + table,
				html: mailText(firstName, result2[0].item, result2[0].remarks, table)
			}
			transporter.sendMail(mailOptions, function(err3, info) {
				if (err3) throw err3;
				console.log('Email sent to '+ email + ': ' + info.response)
			})
		})
	})
}

function readMatches() {
	var sql_com_rdmatch = 'SELECT * FROM matches'

	db.query(sql_com_rdmatch, function(err, result) {
		result.forEach(function(value, index, array) {
			var text = "Request " + value.match_id
			text += " Owner: " + value.inv_profile_id
			text += " Request: " + value.req_profile_id
			console.log(text)
		})
	})
}

//The Matching Algorithm
async function matchingAlgorithm(compType, compDesc, otherTable, userId, curId) {

	var other_id_name = otherTable.slice(0,3) + "_id"
	var other_id;

	var sql_com_matched = "SELECT * FROM matches WHERE " + other_id_name + " = (?)"
	var sql_com_match = "SELECT * FROM " + otherTable + " WHERE item = ? AND remarks = ? AND NOT profile_id = ? ORDER BY timestamp ASC";
	var sql_com_values = [compType, compDesc, userId];
	var req_id;
	var req_prof_id;
	var inv_id;
	var inv_prof_id;

	
	db.query(sql_com_match, sql_com_values, function(err, result){
		if(err) {
			console.log("No match")
			return 0;
		}
		if (result.length > 0) {
			console.log(result)
			if (otherTable == 'request') {
				other_id = result[0].req_id;
			}
			else {
				other_id = result[0].inv_id;
			}

			db.query(sql_com_matched, other_id, function(err2, result2) {
				if (err2) throw err2;
				if (result2.length == 0) {
					// console.log(result)
					console.log("Found a match for " + userId + " with " + result[0].profile_id)
					if (otherTable == 'request') {
						req_id = result[0].req_id;
						req_prof_id = result[0].profile_id;
						inv_id = curId;
						inv_prof_id = userId;
					}
					else {
						req_id = curId;
						req_prof_id = userId;
						inv_id = result[0].inv_id;
						inv_prof_id = result[0].profile_id;
					}			
					var sql_com_match_insert = 'INSERT INTO matches (inv_profile_id, inv_id, req_profile_id, req_id) VALUES (?, ?, ?, ?)';
					var sql_com_match_values = [inv_prof_id, inv_id, req_prof_id, req_id];

					db.query(sql_com_match_insert, sql_com_match_values, function(err2, result2) {
						if (err) throw err;
						console.log("1 record inserted into matches");
						mailMatched(req_prof_id, req_id, "request");
						mailMatched(inv_prof_id, inv_id, "inventory");
						return 0;
					})
				}
				else {
					return 0;
				}
			})
		}
		else {
			console.log('No match for ' + curId)
			return 0;
		}
	})
}

function delay() {
	return new Promise(resolve => setTimeout(resolve, 50));
}

async function insertComponent(req, table, otherTable, userId){
	var quantity;
	var number;
	var item;
	var remarks;

	var batch_quantities = [];
	var batch_items = [];
	var batch_remarks = [];

	var counter = 0;
	const length = Object.keys(req.body).length

	var batchName = req.body["batchName"]
	var batchNameExisting = req.body["batchname"]
	var batch_name = "";

	if (batchName != null) {
		batch_name = batchName
	}
	else {
		batchName = ""
	}

	if (batchNameExisting != null) {
		batch_name = batchNameExisting
		console.log(batch_name)
	}
	descriptor_list = Object.keys(req.body)
	for (description in req.body) {
		counter += 1;
		desc = description.slice(0, description.length-1)

		if (desc == 'Quan'){
			await delay();
			item = "";
			quantity = req.body[description];
			number = description[description.length-1];
		}
		else if(desc == "compType"){
			item = req.body[description]
			var compDescList = Object.keys(components[item])

			remarks = '{'
			compDescList.forEach(function(value, index) {
				if (index > 0)
					remarks += ','
				remarks += ' "' + value + '" : "' + req.body[value + number] + '"'
			})
			remarks += ' }'

			var sql_com_addcomp;
			var sql_com_values;

			if (table =='request'){
				//If request has a batchname
				if (/\S/.test(batchName)) {
					batch_quantities.push(quantity)
					batch_items.push(item)
					batch_remarks.push(remarks)
				}
				sql_com_addcomp = "INSERT INTO " + table + " (quantity, item, remarks, profile_id, batchname) VALUES (?, ?, ?, ?, ?)";
				sql_com_values = [quantity, item, remarks, userId, batch_name]
			}
			else{
				sql_com_addcomp = "INSERT INTO " + table + " (quantity, item, remarks, profile_id) VALUES (?, ?, ?, ?)";
				sql_com_values = [quantity, item, remarks, userId]
			}
						 
			await mysql_con.query(sql_com_addcomp, sql_com_values, async function(err, result){
				if (err) throw err;
				log = "1 " + item + " record inserted into " + table + " for " + userId;
				console.log(log);

				await matchingAlgorithm(item, remarks, otherTable, userId, result.insertId)
			})
		}

		if (counter == length && /\S/.test(batchName)) {
			var sql_com_addbatch = "INSERT INTO batches (batchname, quantities, items, remarks) VALUES (?, ?, ?, ?)"
			var sql_com_addbatch_values = [batchName, batch_quantities.toString(), batch_items.toString(), batch_remarks.toString()]
			mysql_con.query(sql_com_addbatch, sql_com_addbatch_values, function(err, result) {
				if (err) throw err;
				console.log("Batch " + batchName + " has been added to batches");
			})
		}
	}
}

app.post('/addreq', async function(req, res) {
	var userId = req.session.userId;
	await insertComponent(req, "request", "inventory", userId)
	res.redirect('/home')
})

app.post('/addinv', async function(req, res) {
	var userId = req.session.userId;
	await insertComponent(req, "inventory", "request", userId)
	res.redirect('/home') 
})

//initiatie socket connection server side
//connection is initiated on homepage and chat page visit refer to home.ejs script and public/client.js

io.on("connection", function(client){ 
	//push notification function
	console.log("User connected " + client.id);

	//code block for chat sequence - ** needs to be separated from push notification connection
	var owner_id;
	var request_id;
	var sql_com_owner = "SELECT user_id FROM usrlogin,matches WHERE usrlogin.user_id = matches.inv_profile_id";
	var sql_com_searcher =  "SELECT user_id FROM usrlogin,matches WHERE  usrlogin.user_id = matches.req_profile_id";
	mysql_con.query(sql_com_owner, function(err,result, fields){
		if(err){
			throw err;
		}else{
			if (result.length > 0) {
				owner_id = result[0].user_id;
				mysql_con.query(sql_com_searcher, function(err,result1, fields){
					if(err){
						throw err;
					}else{
						request_id = result1[0].user_id;
						client.emit("matchid", {own_id:  owner_id, req_id: request_id });
					}
				});
			}
		}
	});
	client.on("messages", function(data){
		client.emit("thread", data);
		client.broadcast.emit("thread", data);
		db.query("INSERT INTO `messages` (`user_from`, `user_to`, `message`) VALUES ('"+data.user_id+"', '"+data.user_to+"', '"+data.message+"' )");
	});

	client.on('is_typing', function(data){
		//console.log(data);
		if(data.status === true){
			client.emit("typing", data);
			client.broadcast.emit('typing', data);
		}else {
			client.emit("typing", data);
			client.broadcast.emit('typing', data);
		}
	});

	client.on('loaddb', function(data){
		var msgquery = "SELECT * FROM messages WHERE user_from = '"+data.user_id+"' AND user_to = '"+data.user_to+"'";
		var data = [];
		db.query(msgquery, function(err, result, fields){
			if (err) throw err
			else {
				result.forEach(function(value, index, array) {
					var item = {
						user_id : value.user_from,
						username : value.user_from,
						user_to : value.user_to,
						message : value.message
					}
					console.log(item)
					data.push(item)
					if (array.length == index + 1){
						client.emit("thread", data)
						client.broadcast.emit("thread", data);
					}
				})
			}
		})
	});
});
	

app.get('/batches', function(req, res) {
	var sql_com_batches = "SELECT * FROM batches"

	var batches = [];
	var quantities =[];
	var items = [];
	var remarks = [];

	db.query(sql_com_batches, function(err, result){
		//Read for each batch
		result.forEach(function(value, index, array) {
			
			batches.push(value.batchname)

			var quantities_batch = [];
			var items_batch = [];
			var remarks_batch = [];

			// console.log(value)
			value.items.split(',').forEach(function(value2, index2, array2) {
				var new_remarks = []

				var cur_remarks = value.remarks.split('}')[index2]
				if (cur_remarks[0] == ',') {
					cur_remarks = cur_remarks.slice(1)
				}
				cur_remarks += '}'

				cur_remarks_json = JSON.parse(cur_remarks)
				cur_remarks_keys = Object.keys(cur_remarks_json)

				cur_remarks_keys.forEach(function(value3, index3, array3) {
					new_remarks.push(value3 + ': ' + cur_remarks_json[value3])
					
				})

				quantities_batch.push(value.quantities.split(',')[index2])
				items_batch.push(value2)
				remarks_batch.push(new_remarks)

				// console.log(quantities_batch)

				if(array2.length == index2 + 1) {
					quantities.push(quantities_batch)
					items.push(items_batch)
					remarks.push(remarks_batch)

					if(array.length == index + 1) {
						res.render('pages/batches', {
							batches: batches,
							items: items,
							quantities: quantities,
							remarks: remarks
						})
					}
				}
			})
		})

	})
})

app.get('/profile', function(req, res) {
	res.render('pages/profile')
})

app.get('/reqcomp', function(req, res) {
	res.render('pages/reqcomp')
})

app.post('/reqcomp', function(req, res) {
	var userId = req.session.userId;
	var username = req.session.username;
	var type = req.body["new_type"];
	var component = req.body["new_component"]
	var value = req.body["new_value"]
	var datasheet = req.body["new_datasheet"]
	var description = req.body["new_description"]
	var others = req.body["new_others"]

	var mailText = "Greetings admin,<br><br><br>"
	mailText += username + " is requesting for a new component with the following parameters: <br><br>"
	mailText += "<table style='width:100%'>"
	mailText += "<tr><th>Type</th>"
	mailText += "<td>" + type + "</td></tr>"
	mailText += "<tr><th>Component</th>"
	mailText += "<td>" + component + "</td></tr>"
	mailText += "<tr><th>Value</th>"
	mailText += "<td>" + value + "</td></tr>"
	mailText += "<tr><th>datasheet</th>"
	mailText += "<td>" + datasheet + "</td></tr>"
	mailText += "<tr><th>description</th>"
	mailText += "<td>" + description + "</td></tr>"
	mailText += "<tr><th>Others</th>"
	mailText += "<td>" + others + "</td></tr>"
	mailText += "</table>"

	var mailOptions = {
		from : 'componentshare@gmail.com',
		to : 'ferdinand.john.briones@eee.upd.edu.ph',
		subject : 'Request for additional components',
		html: mailText
	}
	transporter.sendMail(mailOptions, function(err3, info) {
		if (err3) throw err3;
		console.log('Email sent to '+ email + ': ' + info.response)
	})

	res.redirect('/home')

})

// app.get('/chat', function(req, res) {
// 	res.render('pages/chat')
// })

// app.listen(port);
