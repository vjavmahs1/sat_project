
module.exports = function(passport){
  var express =  require('express');
  var bodyParser = require('body-parser');

  var app = express.Router();

  var mysql = require('mysql');
  //파일 업로드 미들웨어
  var multer = require('multer');


  //파일 저장경로 지정
  var l_storage = multer.diskStorage({

    destination: function (req, file, cb) {
      {
        cb(null, 'problem_file/image/');
      }
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    }
  });

  var l_set_storage = multer.diskStorage({

    destination: function (req, file, cb) {
      {
          cb(null, 'problem_file/mp3/');

      }
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    }
  });
  var l_set_upload = multer({ storage: l_set_storage});
  var l_upload = multer({ storage: l_storage});


  //mysql연결
  var conn = mysql.createConnection({
    host     : 'localhost',
    port     : '3306',
    user     : 'root',
    password : '900620zZ.',
    database : 'eng'
  });

  conn.connect();





  return app;
}
