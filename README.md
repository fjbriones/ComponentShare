# ComponentShare
This is the repository for CoE 134 project, Component Share. Component Share is a sharing and selling platform of electrical components aimed to help EEE students find components they need without the burden of going to stores to look for that component. It also aims to help recycle components from senior students and give them moneterial incentives in return. Our main goal is to connect students in need and students who have components for them to help each other.

It is recommended that this app be run in an Ubuntu environment. First ensure that you have mysql installed by running the following commands.

```
sudo apt-get update
sudo apt-get install mysql-server
```

Once mysql-server is installed, it is necessary to create a new user and a database.

```
$ mysql -u root
mysql> CREATE USER 'componentshare'@'localhost' IDENTIFIED BY '134compshare';
mysql> exit;
$ mysql -u componentshare -p
mysql> CREATE DATABASE userdb;
```

Once you have the created a new user and the database, it is now necessary to install the prerequisites of the app. Clone the repository and inside the repository install the packages using the command below. The required packages are **express, mysql, validator, body-parser, express-session, promise, fs, nodemailer, socket.io**. 

```
npm install package-name
```

To run this app, run to initiate the server. The database tables are automatically created after running.

```
node apps.js
```

For questions, please comment here or email us at componentshare@gmail.com

