var express =  require('express');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var bkfd2Password = require("pbkdf2-password");
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var hasher = bkfd2Password();

var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: '1234DSFs@adf1234!@#$asd',
  resave: false,
  saveUninitialized: true,
  store:new MySQLStore({
    host:'localhost',
    port:3306,
    user:'root',
    password:'900620zZ.',
    database:'eng'
  })
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next){
  if(req.session.passport){
    var user = req.session.passport.user
    var sql = 'select * from user where auth_id = ?'
    conn.query(sql, [user], function(err, session){
      if(err){
        console.log(err);
        res.status(500).send('Internal Server Error');
      }else{
        res.locals.SESSIONUSER = session[0];
        next();

      }
    })

  }else{
    res.locals.SESSIONUSER = req.session.passport
    next();
  }

})

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



app.get('/admin', function(req, res){
  var sql = "select * from school"
  conn.query(sql, function(err, shcools){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');
    }else{
      var sql = "select*from role"
      conn.query(sql, function(err, roles){
        if(err){
          console.log(err);
          res.status(500).send('Internal Server Error');
        }else{
          var sql = "select*from serial"
          conn.query(sql, function(err, serials){
            if(err){
              console.log(err);
              res.status(500).send('Internal Server Error');
            }else{
              res.render('admin',{schools:shcools, roles:roles, serials : serials})

            }
          })
        }
      })

    }
  })
})

app.post('/serial', function(req,res){
  var schoolId = req.body.schoolId
  var roleId = req.body.postData
  Date.prototype.yyyymmdd = function() {
  var yyyy = this.getFullYear().toString();
  var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
  var dd  = this.getDate().toString();

  return yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]); // padding
 };
  date = new Date();
    var now = date.yyyymmdd();

    var serialNumber = Math.random().toString(36).substr(2, 8)

  var sql = "INSERT INTO serial (school_id,role_id,created_date,serial_number) VALUES(?,?,?,?)"
  conn.query(sql, [schoolId,roleId,now,serialNumber], function(err, result){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');
    }else{
      res.redirect('/admin')
    }
  })

})

app.post('/school', function(req, res){
  var schoolName = req.body.schoolName
  var type = req.body.type
  var grade = req.body.grade
  Date.prototype.yyyymmdd = function() {
  var yyyy = this.getFullYear().toString();
  var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
  var dd  = this.getDate().toString();

  return yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]); // padding
 };
  date = new Date();
    var now = date.yyyymmdd();

  var sql = 'INSERT INTO school(school_name, school_type, school_grade, school_date) VALUES(?,?,?,?)'
  conn.query(sql, [schoolName,type,grade,now], function(err, result){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');
    }else{
      res.redirect('/admin')
    }
  })
})



app.get('/login', function(req, res){
  var sql = "select*from serial"
  conn.query(sql, function(err, serials){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');
    }else{
      res.render('login', {serials : serials});
    }
  })
})

passport.serializeUser(function(user, done) {
  console.log('serializeUser', user);
  done(null, user.auth_id);
});
passport.deserializeUser(function(id, done) {
  console.log('deserializeUser', id);
  var sql = 'SELECT * FROM user WHERE auth_id=?';
  conn.query(sql, [id], function(err, results){
    if(err){
      console.log(err);
      done('There is no user.');
    } else {
      done(null, results[0]);
    }
  });
});

passport.use(new LocalStrategy(
  function(username, password, done){
    var email = username;
    var pwd = password;
    var sql = 'SELECT * FROM user WHERE auth_id=?';
    conn.query(sql, ['local:'+email], function(err, results){
      if(err){
        return done("잘못됨");
      }else{
        if(!results.length){
          done(null,false)
        }else{
          var user = results[0];
          return hasher({password:pwd, salt:user.salt}, function(err, pass, salt, hash){
            if(hash === user.password){
              console.log('LocalStrategy', user);
              done(null, user);
            } else {
              done(null, false);
            }
          });
        }
      }
    });
  }
));

app.post(
  '/login',
  passport.authenticate(
    'local',
    {
      successRedirect: '/successPort',
      failureRedirect: '/login',
      failureFlash: false
    }
  )
);

app.post('/logout', function(req,res){
  req.logout();
  res.end('/login')
})

app.get('/successPort', function(req, res) {
    res.end('/reading');
});

app.get('/auth', function(req, res){
  res.render('auth')
})

app.post('/auth', function(req, res){
  var serialNumber = req.body.serialNumber
  var sql = 'select * from serial where serial_number = ?'
  conn.query(sql, [serialNumber], function(err, serial){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');
    }else{
      if(!serial.length){
        res.end('/auth')
      }else{
        res.end('/signup/'+serialNumber)

      }
    }
  })

})



app.get('/signup/:id', function(req, res){
  var serial =  req.params.id

  var sql = "select r.*, sc.*, s.* from `serial` as s inner join school as sc on s.school_id = sc.school_id inner join role as r on s.role_id = r.role_id AND s.serial_number = ? "
  conn.query(sql, [serial], function(err, serialInfo){

    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');
    }else{
          var sql = "select u.* from user as u inner join serial as s on u.serial_id = s.serial_id and s.role_id = 1 and u.school_id = ?"

          conn.query(sql, [serialInfo[0].school_id], function(err, teachers){
            if(err){
              console.log(err);
              res.status(500).send('Internal Server Error');
            }else{
                res.render('signup', {serialInfo:serialInfo[0], teachers:teachers});
            }
          })


    }
  })
})

app.post('/signup', function(req, res){
  if(req.body.roleId==2){
    var personal_id = req.body.grade+req.body.classroom
  }else{
    var personal_id = req.body.role
  }
  hasher({password:req.body.password}, function(err, pass, salt,hash){
    var user = {
      auth_id :'local:'+req.body.email,
      email : req.body.email,
      password : hash,
      salt : salt,
      serial_id : req.body.serialId,
      school_id : req.body.schoolId,
      name : req.body.userName,
      personal_id : personal_id
    };
    var sql = 'INSERT INTO user SET ?';
    conn.query(sql, user, function(err, results){
      if(err){
        console.log(err);
        res.status(500);
      }else{
        if(req.body.teachers){
            var teachers = req.body.teachers
            var sql = 'INSERT INTO teacher_student(student_id,teacher_id) values(?,?)'

            if(teachers.constructor === Array){
            for(var i= 0; i < teachers.length; i++){
              console.log("you have multiple teachers");
              conn.query(sql, [results.insertId, teachers[i]],function(err,results){
                if(err){
                  console.log(err);
                  res.status(500).send("Internal Server Error")
                }else{
                  return;
                }
              })
              }
            }else{
              console.log("you have a teacher");
              conn.query(sql, [results.insertId, teachers],function(err,results){
                if(err){
                  console.log(err);
                  res.status(500).send("Internal Server Error")
                }else{
                  return;
                }
              })
            }
      }
      res.redirect('/login')

      }
    })
  })
})

app.post('/email/check', function(req, res){
  var email = req.body.email
  var sql = 'select * from user where email = ?'
  conn.query(sql, [email], function(err, email){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');
    }else{
      if(email.length){
        res.write('""')
      }else{
        res.write('"true"')
      }
      res.end();
    }
  })

})




var listening = require('./routes/listening')
app.use('/listening', listening)

var reading = require('./routes/reading');
app.use('/reading', reading);


app.get('login/register', function(req, res){
  res.render('login_register')
})



app.listen(3000,function(){
  console.log('Connected, 2000 port!');
})
