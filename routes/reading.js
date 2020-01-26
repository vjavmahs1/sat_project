module.exports = function(passport){
  var express =  require('express');
  var bodyParser = require('body-parser');
  var app = express.Router();

  var mysql = require('mysql');

  var conn = mysql.createConnection({
    host     : 'localhost',
    port     : '3306',
    user     : 'root',
    password : '-',
    database : 'eng'
  });

  conn.connect();





  return app;
}
