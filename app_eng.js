var express =  require('express');
var bodyParser = require('body-parser');

var app = express();

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

//파일 유알엘로 쓸때 쓰는것
app.use('/problem_file',express.static('problem_file'));
app.use('/javascript',express.static('javascript'));
app.use('/css',express.static('css'));


app.use(bodyParser.urlencoded({ extended: false }))

//제이드 소스 틀에 맞쳐보여주는것
app.locals.pretty = true;

//뷰 저장경로 지정
app.set('views', './views');
//엔진 템플렛 설정
app.set('view engine', 'jade');




var listening = require('./routes/listening')
app.use('/listening', listening)

var reading = require('./routes/reading');
app.use('/reading', reading);




app.listen(3000,function(){
  console.log('Connected, 2000 port!');
})
