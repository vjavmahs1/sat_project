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
    password:'Dhtp12rbs.',
    database:'sat_performance'
  })
}));
app.use(passport.initialize());
app.use(passport.session());

//로그인 표시를 위한 전역변수 생성 미들웨어
app.use(function(req, res, next){
  if(req.session.passport){
    var user = req.session.passport.user
    var sql = 'select u.*, s.role_id from user as u inner join serial as s on u.serial_id = s.serial_id and u.auth_id = ?'
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

app.use(function(req,res,next){
  if(req.session.passport){
  var getUser = "select * from user where auth_id = ?"
  conn.query(getUser, req.session.passport.user, function(err, user){
    if(err){
      console.log(err);
      next();
    }else{
      USER = user[0];
      next();
    }
  })
  }else{
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
  password : 'Dhtp12rbs.',
  database : 'sat_performance',
  dateStrings: true
});

conn.connect();

//파일 유알엘로 쓸때 쓰는것
app.use('/problem_file',express.static('problem_file'));
app.use('/javascript',express.static('javascript'));
app.use('/css',express.static('css'));
app.use('/multi-select',express.static('multi-select'));


app.use(bodyParser.urlencoded({ extended: false }))

//제이드 소스 틀에 맞쳐보여주는것
app.locals.pretty = true;

//뷰 저장경로 지정
app.set('views', './views');
//엔진 템플렛 설정
app.set('view engine', 'jade');


//if not authenticated redirect to login
function authenticationMiddleware () {
  return function (req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }else{
      res.redirect('/login')

    }
  }
}


//학교관리 화면
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

//시리얼 넘버 생성
app.post('/serial', function(req,res){
  var schoolId = req.body.schoolId
  var roleId = req.body.postData

    var serialNumber = Math.random().toString(36).substr(2, 8)

  var sql = "INSERT INTO serial (school_id,role_id,serial_number) VALUES(?,?,?)"
  conn.query(sql, [schoolId,roleId,serialNumber], function(err, result){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');
    }else{
      res.redirect('/admin')
    }
  })

})

//학교생성
app.post('/school', function(req, res){
  var schoolName = req.body.schoolName
  var type = req.body.type
  var grade = req.body.grade
  var sql = 'INSERT INTO school(school_name, school_type, school_grade) VALUES(?,?,?)'
  conn.query(sql, [schoolName,type,grade], function(err, result){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');
    }else{
      res.redirect('/admin')
    }
  })
})


//로그인 화면
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

//passport 미들웨어
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

//로그인 확인과정
app.post(
  '/login',
  passport.authenticate(
    'local',
    {
      successRedirect: '/successPort',
      failureRedirect: '/failPort',
      failureFlash: false
    }
  )
);

// 로그아웃
app.post('/logout', function(req,res){
  req.logout();
  res.end('/login')
})

//로그인성공했을시 첫 화면
app.get('/successPort', function(req, res) {
  var sql = 'select u.*, s.* from user as u inner join serial as s on u.`auth_id`=? and u.`serial_id` = s.`serial_id`';
  conn.query(sql, req.session.passport.user, function(err, result){
    if(err){
      console.log(err);
      res.status(500).send("Internal Server Error")
    }else{
      var result = result[0]
      if(result.role_id ==1){
        res.end('/groups')
      }else if(result.role_id ==2){
        res.end('/student')
      }else if(result.role_id ==4){
        console.log(result.role_id);
        res.end('/admin')
      }else if(result.role_id ==3){
        res.end('/admin/groups')
      }
    }
  })
});

app.get('/failPort',function(req, res){
  res.end('fail')
})


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
    var personal_id = req.body.grade+"학년"+req.body.classroom+"반"+req.body.number+"번"
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
    conn.query(sql, user, function(err, user){
      if(err){
        console.log(err);
        res.status(500);
      }else{
          if(req.body.teachers){
            console.log(req.body);
            var teachers = req.body.teachers
            //여기 나중에 join문으로 바뀌면 원래대로
            var sql = 'INSERT INTO teacher_student(student_id,teacher_id, student_name, school_id) values(?,?,?,?)'
            if(teachers.constructor === Array){
            for(var i= 0; i < teachers.length; i++){
              (function() {
                var j = i;
                console.log("you have multiple teachers");
                conn.query(sql, [user.insertId, teachers[j],req.body.userName,req.body.schoolId],function(err,results){
                  if(err){
                    console.log(err);
                    res.status(500).send("Internal Server Error")
                  }else{
                    var name =req.body.grade+"학년"+req.body.classroom+"반"
                    var checkSql = 'select*from user_group where teacher_id =? and name =? '
                    conn.query(checkSql,[teachers[j],name], function(err, row){
                      if(err){
                        console.log(err);
                        res.status(500).send("Internal Server Error")
                      }else{
                        if(row.length){
                          var sql = "UPDATE user_group set users = users+1 where teacher_id = ? and name = ?"
                          conn.query(sql, [teachers[j],name], function(err, rows){
                            if(err){
                              console.log(err);
                              res.status(500).send("Internal Server Error")
                            }else{
                              var sql = "insert into user_group_user(user_group_id, user_id) values(?,?)"
                              conn.query(sql, [row[0].user_group_id,user.insertId], function(err, user_group_user){
                              if(err){
                                console.log(err);
                                res.status(500).send("Internal Server Error")
                              }else{
                                return ;
                              }
                            })
                          }
                        })
                      }else{
                        var sql = 'insert into user_group(teacher_id,name, users) values(?,?,?)'
                        conn.query(sql, [teachers[j],name,1], function(err, user_group){
                          console.log(teachers[j]);
                          if(err){
                            console.log(err);
                            res.status(500).send("Internal Server Error");
                          }else{
                            var sql = "insert into user_group_user(user_group_id, user_id) values(?,?)"
                            conn.query(sql, [user_group.insertId, user.insertId], function(err, user_group_user){
                              if(err){
                                console.log(err);
                                res.status(500).send("Internal Server Error")
                              }else{
                                return;
                              }
                            })
                          }
                        })
                      }
                    }
                  })
                }
              })
            })();
              }
            }else{
              var teacher = req.body.teachers
              console.log(req.body);
              console.log("you have a teacher");
              conn.query(sql, [user.insertId, teacher],function(err,results){
                if(err){
                  console.log(err);
                  res.status(500).send("Internal Server Error")
                }else{
                  var name =req.body.grade+"학년"+req.body.classroom+"반"
                  var checkSql = 'select*from user_group where teacher_id =? and name =? '
                  conn.query(checkSql,[teacher,name], function(err,row){
                    if(err){
                      console.log(err);
                      res.status(500).send("Internal Server Error")
                    }else{
                      if(row.length){
                        var sql = "UPDATE user_group set users = users+1 where teacher_id = ? and name = ?"
                        conn.query(sql, [teacher, name], function(err, rows){
                          if(err){
                            console.log(err);
                            res.status(500).send("Internal Server Error")
                          }else{
                            var sql = "insert into user_group_user(user_group_id, user_id) values(?,?)"
                            conn.query(sql, [row[0].user_group_id, user.insertId], function(err,user_group_user){
                              if(err){
                                console.log(err);
                                res.status(500).send("Internal Server Error")
                              }else{
                                return;
                              }
                            })
                          }
                        })
                      }else{
                        var sql = 'insert into user_group(teacher_id,name, users) values(?,?,?)'
                        conn.query(sql, [teacher, name, 1], function(err, user_group){
                          console.log(teachers);
                          if(err){
                            console.log(err);
                            res.status(500).send("Internal Server Error");
                          }else{
                            var sql = "insert into user_group_user(user_group_id, user_id) values(?,?)"
                            conn.query(sql, [user_group.insertId, user.insertId], function(err, user_group_user){
                              if(err){
                                console.log(err);
                                res.status(500).send("Internal Server Error")
                              }else{
                                return;

                              }
                            })
                          }
                        })
                      }
                    }
                  })
                }
              })
            }
            }
      res.redirect('/login')

      }
    })
  })
})

app.get('/group/:id', function(req,res){
  var groupId = req.params.id;
  var sql = 'select*from user where `auth_id`=?';
  conn.query(sql, req.session.passport.user, function(err, user){
    if(err){
      console.log(err);
      res.status(500).send("not logged in")
    }else{
      var sql = "select * from user_group where teacher_id = ?"
      conn.query(sql, user[0].user_id, function(err, groups){
        if(err){
          console.log(err);
          res.status(500).send("Internal Server Error")
        }else{
          var sql = "select u.*, ugu.* from user as u inner join user_group_user as ugu on u.user_id = ugu.user_id and ugu.`user_group_id` = ?"
          conn.query(sql, groupId, function(err, users){
            if(err){
              console.log(err,"491 err");
              res.status(500).send('Internal Server Error');
            }else{
              var sql = "select * from user_group where user_group_id = ?"
              conn.query(sql, groupId, function(err, group){
                if(err){
                  console.log(err,"497 err");
                  res.status(500).send('Internal Server Error');
                }else{
                  var sql = "select ts.*, u.* from teacher_student as ts inner join user as u on ts.teacher_id= ? and ts.`student_id` = u.user_id"
                  conn.query(sql, user[0].user_id, function(err, takenStudents){
                    if(err){
                      console.log(err);
                      res.status(500).send("Internal Server Error")
                    }else{
                      var sql = "select ugu.*, u.* from user as u inner join user_group_user as ugu on ugu.`user_group_id` = ? and ugu.user_id = u.user_id"
                      conn.query(sql, groupId, function(err, groupStudents){
                        if(err){
                          console.log(err);
                          res.status(500).send("Internal Server Error")
                        }else{
                          var sql = "select ts.*, u.* from teacher_student as ts inner join user as u on ts.teacher_id= ? and ts.`student_id` = u.user_id where user_id not in(select user_id from user_group_user where `user_group_id` =?)"
                          conn.query(sql, [user[0].user_id, groupId], function(err, restStudents){
                            if(err){
                              console.log(err);
                              res.status(500).send("Internal Server Error")
                            }else{
                              res.render("users", {users : users, group:group[0], groups:groups, takenStudents:takenStudents, restStudents:restStudents, groupStudents:groupStudents, user:user[0]})
                            }
                          })
                        }
                      })
                    }
                  })
                }
              })
            }
          })
        }
      })
    }
  })
})

app.get('/groups', function(req,res){
  var sql = 'select*from user where `auth_id`=?';
  conn.query(sql, req.session.passport.user, function(err, user){
    if(err){
      console.log(err);
      res.status(500).send("not logged in")
    }else{
      var sql = "select * from user_group where teacher_id = ?"
      conn.query(sql, user[0].user_id, function(err, groups){
        if(err){
          console.log(err);
          res.status(500).send("Internal Server Error")
        }else{
          console.log(groups);
          var sql = "select ts.*, u.* from teacher_student as ts inner join user as u on ts.teacher_id= ? and ts.`student_id` = u.user_id"
          conn.query(sql, user[0].user_id, function(err, takenStudents){
            if(err){
              console.log(err);
              res.status(500).send("Internal Server Error")
            }else{
              res.render('groups', {groups : groups, takenStudents:takenStudents, user:user[0]})

            }
          })
        }
      })
    }
  })
})
app.post('/delete/group/user', function(req, res){
  var user_id =  req.body.user_id
  if(req.body.group_id){
    var group_id = req.body.group_id
    var sql = "delete from user_group_user where user_id =? and user_group_id = ?"
    conn.query(sql, [user_id, group_id], function(err, row){
      if(err){
        console.log(err);
        res.status(500).send('Internal Server Error')
      }else{
        var sql = "UPDATE user_group set users = users-1 where user_group_id = ?"
        conn.query(sql, [group_id], function(err, row){
          if(err){
            console.log(err);
            res.status(500).send('Internal Server Error')
          }else{
            var getUser = "select*from user where `auth_id`=?"
            conn.query(getUser, req.session.passport.user, function(err,user){
              if(err){
                console.log(err);
                res.status(500).send('Internal Server Error')
              }else{
                var checkRole = "select * from serial where serial_id = ?"
                conn.query(checkRole, user[0].serial_id, function(err, role){
                  if(err){
                    console.log(err);
                    res.status(500).send("Internal Server Error")
                  }else{
                    if(role[0].role_id ==1){
                      res.redirect('/group/'+group_id)
                    }else if(role[0].role_id ==3){
                      res.redirect('/admin/madeGroup/'+group_id)
                    }
                  }
                })
              }
            })
          }
        })
      }
    })
  }else{
    var teacher_id = req.body.teacher_id;
    var sql = "delete from teacher_student where student_id = ? and teacher_id = ?"
    conn.query(sql,[user_id,teacher_id], function(err, rows){
      if(err){
        console.log(err);
        res.status(500).send('Internal Server Error')
      }else{
        var sql = "select * from user_group where teacher_id = ?"
        conn.query(sql, teacher_id, function(err, userGroups){
          if(err){
            console.log(err);
            res.status(500).send('Internal Server Error')
          }else{
            for(var i =0; i < userGroups.length; i++){
              (function() {
                var j = i;
              var sql = "delete from user_group_user where user_group_id =? and user_id =?"
              conn.query(sql, [userGroups[j].user_group_id, user_id], function(err, deletedRows){
                if(err){
                  console.log(err);
                  res.status(500).send("Internal Server Error")
                }else{
                  if(deletedRows.affectedRows != 0){
                    var sql = "UPDATE user_group set users = users-1 where user_group_id = ?"
                    conn.query(sql, userGroups[j].user_group_id, function(err, updatedCount){
                      if(err){
                        console.log(err);
                        res.status(500).send("Internal Server Error")
                      }else{
                        return ;
                      }
                    })
                  }
                }
              })
            })();
            }
            res.redirect('/groups')
          }
        })
      }
    })
  }
})

app.post("/add/group", function(req, res){
  var teacherId = req.body.teacherId;
  var groupName = req.body.groupName;
  var groupDes = req.body.groupDes;
  var students = JSON.parse(req.body.students)
  var sql = "INSERT INTO user_group(description, name, users, teacher_id) values(?,?,?,?)"
  if(students.constructor === Array){
    conn.query(sql, [groupDes, groupName, students.length, teacherId], function(err, row){
      if(err){
        console.log(err);
        res.status(500).send("Internal Server Error")
      }else{
        for(var i=0; i<students.length; i++){
          var sql = 'INSERT INTO user_group_user(user_group_id, user_id) VALUES(?,?)'
          conn.query(sql,[row.insertId,students[i]], function(err, result){
            if(err){
              console.log(err);
              res.status(500).send("Internal Server Error")
            }else{
              return
            }
          })
        }
        var getUser = "select * from user where user_id = ?"
        conn.query(getUser, teacherId, function(err, user){
          if(err){
            console.log(err);
            res.status(500).send("Internal Server Error")
          }else{
            var checkRole = "select * from serial where serial_id = ?"
            conn.query(checkRole, user[0].serial_id, function(err, role){
              if(err){
                console.log(err);
                res.status(500).send("Internal Server Error")
              }else{
                if(role[0].role_id ==1){
                  res.redirect('/group/'+row.insertId)
                }else if(role[0].role_id ==3){
                  res.redirect('/admin/madeGroup/'+row.insertId)
                }
              }
            })
          }
        })
      }
    })
  }
})

app.post("/groupName/check", function(req, res){
  var getUser = 'select * from user where auth_id = ?'
  conn.query(getUser, req.session.passport.user, function(err, user){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error')
    }else{
      var checkGroup = "select * from user_group where teacher_id =? and name = ?"
      conn.query(checkGroup, [user[0].user_id, req.body.groupName], function(err, existedGroup){
        if(err){
          console.log(err);
          res.status(500).send('Internal Server Error');
        }else{
          if(existedGroup.length){
            res.write('""')
          }else{
            res.write('"true"')
          }
          res.end();
        }
      })
    }
  })
})

app.post('/modify/group', function(req,res){
  var teacherId = req.body.teacherId;
  var groupId =req.body.groupId
  var groupName =req.body.groupName;
  var groupDes =req.body.groupDes;
  var studentIds = JSON.parse(req.body.optionValues)
  var sql = "delete from user_group where user_group_id =?"
  conn.query(sql, groupId, function(err, deletedRow){
    if(err){
      console.log(err);
      res.status(500).send("Internal Server Error")
    }else{
      var sql = "INSERT INTO user_group(user_group_id, description, name, users, teacher_id) values(?,?,?,?,?)"
      conn.query(sql, [groupId, groupDes, groupName, studentIds.length, teacherId], function(err, updatedRow){
        if(err){
          console.log(err);
          res.status(500).send("Internal Server Error")
        }else{
          for(var i=0; i<studentIds.length; i++){
            var sql = 'INSERT INTO user_group_user(user_group_id, user_id) VALUES(?,?)'
            conn.query(sql, [groupId, studentIds[i]], function(err, addedUser){
              if(err){
                console.log(err);
                res.status(500).send("Internal Server Error")
              }else{
                return;
              }
            })
          }
          var getUser = "select * from user where user_id = ?"
          conn.query(getUser, teacherId, function(err, user){
            if(err){
              console.log(err);
              res.status(500).send("Internal Server Error")
            }else{
              var checkRole = "select * from serial where serial_id = ?"
              conn.query(checkRole, user[0].serial_id, function(err, role){
                if(err){
                  console.log(err);
                  res.status(500).send("Internal Server Error")
                }else{
                  if(role[0].role_id ==1){
                    res.redirect('/group/'+groupId)
                  }else if(role[0].role_id ==3){
                    res.redirect('/admin/madeGroup/'+groupId)
                  }
                }
              })
            }
          })
        }
      })
    }
  })
})
app.post('/delete/group', function(req,res){
  var groupId = req.body.groupId;
  var sql ="delete from user_group where user_group_id =?"
  conn.query(sql, groupId, function(err, row){
    if(err){
      console.log(err);
      res.status(500).send("Internal Server Error");

    }else{
      var getUser = "select*from user where `auth_id`=?"
      conn.query(getUser, req.session.passport.user, function(err,user){
        if(err){
          console.log(err);
          res.status(500).send('Internal Server Error')
        }else{
          var checkRole = "select * from serial where serial_id = ?"
          conn.query(checkRole, user[0].serial_id, function(err, role){
            if(err){
              console.log(err);
              res.status(500).send("Internal Server Error")
            }else{
              if(role[0].role_id ==1){
                res.redirect('/groups/')
              }else if(role[0].role_id ==3){
                res.redirect('/admin/groups')
              }
            }
          })
        }
      })
    }
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

app.get('/admin/groups', function(req, res){
  var sql = 'select*from user where auth_id =?'
  conn.query(sql, req.session.passport.user, function(err, user){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error')
    }else{
      var sql = 'select u.*, s.*, sch.school_grade from user as u inner join serial as s on u.school_id = ? and u.serial_id = s.serial_id  inner join school as sch on u.school_id = sch.school_id where s.role_id = 2'
      conn.query(sql , user[0].school_id, function(err, students){
        if(err){
          console.log(err);
          res.status(500).send('Internal Server Error')
        }else{
          var getGroups = "select * from user_group where teacher_id = ?"
          conn.query(getGroups, user[0].user_id, function(err, groups){
            if(err){
              console.log(err);
              res.status(500).send('Internal Server Error')
            }else{
              var school_grade;
              if(students[0].school_grade =="E"){
                school_grade = 6;
              }else{
                school_grade = 3;
              }
              var numberStudents = new Array();

              for(var i=0; i<school_grade; i++){
                var getStudentNum = "select u.*, s.* from user as u inner join serial as s on  s.serial_id = u.serial_id and u.personal_id like '?%' and u.school_id = ? where s.role_id=2"
                conn.query(getStudentNum,[i+1, user[0].school_id,], function(err, studentNum){
                  if(err){
                    console.log(err);
                    res.status(500).send('Internal Server Error')
                  }else{
                    numberStudents.push(studentNum.length)
                    if(numberStudents.length == school_grade){
                      console.log(numberStudents);
                      res.render('adminGroups', {students:students, numberStudents: numberStudents, user:user[0], groups:groups})
                    }
                  }
                })
              }
            }
          })
        }
      })
    }
  })
})

app.get('/admin/group/:id', function(req, res){
  var sql = 'select*from user where auth_id =?'
  conn.query(sql, req.session.passport.user, function(err, user){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error')
    }else{
      var sql = 'select u.*, s.*, sch.school_grade from user as u inner join serial as s on u.school_id = ? and u.serial_id = s.serial_id  inner join school as sch on u.school_id = sch.school_id where s.role_id = 2'
      conn.query(sql , user[0].school_id, function(err, students){
        if(err){
          console.log(err);
          res.status(500).send('Internal Server Error')
        }else{
          var grade = req.params.id
          console.log(grade);
          var getStudent = "select u.*, s.*, sc.* from user as u inner join serial as s on  s.serial_id = u.serial_id and u.personal_id like '?%' and u.school_id = ? inner join school as sc on u.school_id = sc.school_id where s.role_id=2"
          conn.query(getStudent,[parseInt(grade), user[0].school_id], function(err, gradeStudents){
            if(err){
              console.log(err);
              res.status(500).send('Internal Server Error')
            }else{
              var getGroups = "select * from user_group where teacher_id = ?"
              conn.query(getGroups, user[0].user_id, function(err, groups){
                if(err){
                  console.log(err);
                  res.status(500).send('Internal Server Error')
                }else{
                  var school_grade;
                  if(students[0].school_grade =="E"){
                    school_grade = 6;
                  }else{
                    school_grade = 3;
                  }
                  var numberStudents = new Array();
                  for(var i=0; i<school_grade; i++){
                    var getStudentNum = "select u.*, s.* from user as u inner join serial as s on  s.serial_id = u.serial_id and u.personal_id like '?%' and u.school_id = ? where s.role_id=2"
                    conn.query(getStudentNum,[i+1, user[0].school_id], function(err, studentNum){
                      if(err){
                        console.log(err);
                        res.status(500).send('Internal Server')
                      }else{
                        numberStudents.push(studentNum.length)
                        if(numberStudents.length == school_grade){
                          console.log(numberStudents);
                          res.render('adminGroups', {students:students, gradeStudents:gradeStudents, numberStudents: numberStudents, user:user[0], groups:groups})
                        }
                      }
                    })
                  }

                }
              })
            }
            })
          }
      })
    }
  })
})

app.get('/admin/madeGroup/:id', function(req, res){
  var getUser = "select*from user where auth_id =?"
  conn.query(getUser, req.session.passport.user, function(err, user){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error')
    }else{
      var getAllStudent = "select u.*, s.*, sch.school_grade from user as u inner join serial as s on u.school_id = ? and u.serial_id = s.serial_id  inner join school as sch on u.school_id = sch.school_id where s.role_id = 2"
      conn.query(getAllStudent, user[0].school_id, function(err, students){
        if(err){
          console.log(err);
          res.status(500).send('Internal Server Error')
        }else{
          var groupId = req.params.id;
          var getGroupStudents = "select u.*, ugu.* from user as u inner join user_group_user as ugu on u.user_id = ugu.user_id and ugu.`user_group_id` = ?"
          conn.query(getGroupStudents, groupId, function(err, groupStudents){
            if(err){
              console.log(err);
              res.status(500).send('Internal Server Error')
            }else{
              var getSelectedGroup = "select * from user_group where user_group_id = ?"
              conn.query(getSelectedGroup, groupId, function(err, selectedGroup){
                if(err){
                  console.log(err);
                  res.status(500).send('Internal Server Error')
                }else{
                  var getGroups = "select * from user_group where teacher_id = ?"
                  conn.query(getGroups, user[0].user_id, function(err, groups){
                    if(err){
                      console.log(err);
                      res.status(500).send('Internal Server Error')
                    }else{
                      var getRestStudents = "select user.* from user inner join serial as s on user.school_id = ? and user.serial_id = s.serial_id inner join school as sch on user.school_id = sch.school_id where user_id not in(select u.user_id from user as u inner join user_group_user as ugu on u.user_id = ugu.user_id and ugu.`user_group_id` = ?) and s.role_id =2"
                      conn.query(getRestStudents,[user[0].school_id, groupId], function(err, restStudents){
                        if(err){
                          console.log(err);
                          res.status(500).send('Internal Server Error')
                        }else{
                          var school_grade;
                          if(students[0].school_grade =="E"){
                            school_grade = 6;
                          }else{
                            school_grade = 3;
                          }
                        var numberStudents = new Array();
                        for(var i =0; i<school_grade; i++){
                          var getStudentNum = "select u.*, s.* from user as u inner join serial as s on  s.serial_id = u.serial_id and u.personal_id like '?%' and u.school_id = ? where s.role_id=2"
                          conn.query(getStudentNum, [i+1, user[0].school_id], function(err, studentNum){
                            if(err){
                              console.log(err);
                              res.status(500).send('Internal Server')
                            }else{
                              numberStudents.push(studentNum.length)
                              if(numberStudents.length == school_grade){
                                res.render('adminGroups', {students:students, groupStudents:groupStudents, groups:groups, user:user[0], numberStudents : numberStudents, selectedGroup: selectedGroup[0], restStudents: restStudents})
                              }
                            }
                          })
                        }
                        }
                      })

                    }
                  })

                }
              })
            }
          })
        }
      })
    }
  })
})



//리딩문제 추가 화면
//(localhost:2000/reaindg/new 연결)
app.get('/reading/new', function(req, res){
  //reading/new에 보내줄 데이터 뽑는 query문 결과는
    var sql ='SELECT*FROM r_questiontype';
                                    //이쪽으로 들어옴
    conn.query(sql, function(err, r_questiontypes){
      if(err){
        console.log(err);
        res.status(500).send('Internal Server Error');
      }
      //reading_new라는 제이드파일을 뛰어주고 r_questiontypes 변수 프론트페이지로 전달
      var getTeachers = "select u.*, sc.school_name, s.role_id from user as u inner join serial as s on u.serial_id = s.serial_id inner join school as sc on u.school_id = sc.school_id where s.role_id =3 or s.role_id =1 "
      conn.query(getTeachers, function(err, teachers){
        if(err){
          console.log(err);
          res.status(500).send('Internal Server Error');
        }else{
          res.render('reading_new',{r_questiontypes:r_questiontypes, teachers: teachers});

        }
      })
  });
});

//리딩문제 추가
app.post('/reading/new', function(req,res){
  var r_questiontype_id = req.body.r_questiontype_id;
  var r_question_topic = req.body.r_question_topic;
  var r_question_text = req.body.r_question_text;
  var r_question_asw1 = req.body.r_question_asw1;
  var r_question_asw2 = req.body.r_question_asw2;
  var r_question_asw3 = req.body.r_question_asw3;
  var r_question_asw4 = req.body.r_question_asw4;
  var r_question_asw5 = req.body.r_question_asw5;
  var r_question_solution = req.body.r_question_solution;
  var r_question_explain = req.body.r_question_explain;

  var getUser = "select*from user where auth_id =?"
  conn.query(getUser, req.session.passport.user, function(err, user){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');
    }else{
      var scope = req.body.scope;
      if(scope != 1 && scope != 2 && scope !=3){
        scope = 4;
      }
      var addProblem = 'INSERT INTO `r_question`(`r_questiontype_id`,`r_question_topic`,`r_question_text`,`r_question_asw1`,'+
        '`r_question_asw2`,`r_question_asw3`,`r_question_asw4`,`r_question_asw5`,r_question_solution,r_question_explain, publisher_id, scope_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)';
        conn.query(addProblem,[r_questiontype_id,r_question_topic,r_question_text,r_question_asw1,r_question_asw2,r_question_asw3,
                  r_question_asw4,r_question_asw5,r_question_solution,r_question_explain, user[0].user_id, scope], function(err, addedProblem){
                    if(err){
                      console.log(err);
                      res.status(500).send('Internal Server Error');
                    }else{
                      var sharingProblem = "INSERT INTO r_shared_question(teacher_id, r_question_id) values(?,?)"
                      if(req.body.scope == 1){
                        var getAllTeacher = "select u.*,  s.role_id from user as u inner join serial as s on u.serial_id = s.serial_id where s.role_id =3 or s.role_id =1 and u.user_id not in (select user_id from user where user_id = ?)"
                        conn.query(getAllTeacher, user[0].user_id, function(err, allTeachers){
                          for(var i=0; i<allTeachers.length; i++){
                            conn.query(sharingProblem,[allTeachers[i].user_id, addedProblem.insertId], function(err, result){
                              if(err){
                                console.log(err);
                                res.status(500).send('Internal Server Error');
                              }else{
                                return;
                              }
                            })
                          }
                          res.redirect('/reading/new')
                        })
                      }else if(req.body.scope ==2){
                        var getSchoolTeachers = "select u.*,  s.role_id from user as u inner join serial as s on u.serial_id = s.serial_id where s.role_id =3 or s.role_id =1 and u.user_id not in (select user_id from user where user_id = ?) and u.school_id = ?"
                        conn.query(getSchoolTeachers, [user[0].user_id, user[0].school_id], function(err, schoolTeachers){
                          for(var i=0; i<schoolTeachers.length; i++){
                            conn.query(sharingProblem, [schoolTeachers[i].user_id, addedProblem.insertId], function(err, result){
                              if(err){
                                console.log(err);
                                res.status(500).send('Internal Server Error');
                              }else{
                                return;
                              }
                            })
                          }
                          res.redirect('/reading/new')
                        })

                      }else if(req.body.scope ==3){
                        res.redirect('/reading/new')
                      }else{
                        var selectedTeacherId =JSON.parse("[" + req.body.scope + "]");
                        for(var i=0; i<selectedTeacherId.length; i++){
                          conn.query(sharingProblem, [selectedTeacherId[i], addedProblem.insertId], function(err, result){
                            if(err){
                              console.log(err);
                              res.status(500).send('Internal Server Error');
                            }else{
                              return;
                            }
                          })
                        }
                        res.redirect('/reading/new')
                      }

                    }
                  })
                }
              })
            });

  //리딩문제 수정화면
  app.get(['/reading/:id/edit'], function(req,res){
    var sql = 'Select * from r_questiontype'
    conn.query(sql, function(err, r_questiontypes){
      var id = req.params.id;
      if(id){
        var sql = 'Select s.`r_questiontype_type`, l.r_question_id,l.r_questiontype_id, l.`r_question_topic`, l.`r_question_text`, l.`r_question_asw1`,'+
        ' l.`r_question_asw2`, l.`r_question_asw3`, l.`r_question_asw4`, l.`r_question_asw5`, l.r_question_solution, l.r_question_explain from'+
         '`r_questiontype` as s inner join `r_question` as l ON s.`r_questiontype_id` = l.`r_questiontype_id` WHERE l.r_question_id =?';
         conn.query(sql,[id], function(err, r_question){
           if(err){
             console.log(err);
             res.status(500).send('Internal Server Error');
           } else{
             res.render('reading_edit',{r_questiontypes:r_questiontypes, question:r_question[0]});
            //res.send(r_question);
           }
         })
      } else {
        console.log('there is no id');
        res.status(500).send('Internal Server Error');
      }
    });

  });

  //리딩문제 수정
  app.post(['/reading/:id/edit'], function(req,res){
    var r_questiontype_id = req.body.r_questiontype_id;
    var r_question_topic = req.body.r_question_topic;
    var r_question_text = req.body.r_question_text;
    var r_question_asw1 = req.body.r_question_asw1;
    var r_question_asw2 = req.body.r_question_asw2;
    var r_question_asw3 = req.body.r_question_asw3;
    var r_question_asw4 = req.body.r_question_asw4;
    var r_question_asw5 = req.body.r_question_asw5;
    var r_question_solution = req.body.r_question_solution;
    var r_question_explain = req.body.r_question_explain;
    var id =req.params.id
    var sql = 'UPDATE r_question SET `r_questiontype_id`=?,`r_question_topic`=?,`r_question_text`=?,`r_question_asw1`=?, '+
    '`r_question_asw2`=?,`r_question_asw3`=?,`r_question_asw4`=?,`r_question_asw5`=?, `r_question_solution`=?, `r_question_explain`=? WHERE r_question_id = ?';
    conn.query(sql,[r_questiontype_id,r_question_topic,r_question_text,r_question_asw1,r_question_asw2,r_question_asw3,
      r_question_asw4,r_question_asw5,r_question_solution, r_question_explain, id], function(err, result){
      if(err){
        console.log(err);
        res.status(500).send('Internal Server Error');
      } else{

          res.redirect('/reading');
          //res.send(result);
      }
    });
  });

  //리딩문제 삭제
  app.post(['/reading/:id/delete'], function(req,res){

    var id =req.params.id
    var sql = 'Delete from r_question WHERE r_question_id = ?'
    conn.query(sql,[id], function(err, result){
      if(err){
        console.log(err);
        res.status(500).send('Internal Server Error');
      } else{
          res.redirect('/reading');

      }
    });
  });

//리딩문제 리스트 화면
app.get('/reading', function(req, res){
  var getUser = "select*from user where auth_id =?"
  conn.query(getUser, req.session.passport.user, function(err, user){
    if(err){
      console.log(err);
      res.status(500).send("Internal Server Error")
    }else{
      var getMyProblems = "select q.*,qt.`r_questiontype_type` from r_question as q inner join r_questiontype as qt on q.r_questiontype_id = qt.r_questiontype_id and q.`publisher_id`=?"
      conn.query(getMyProblems, user[0].user_id, function(err, questions){
        if(err){
          console.log(err);
          res.status(500).send("Internal Server Error")
        }else{
          var getQuestionType = "Select * from r_questiontype"
          conn.query(getQuestionType, function(err, questionTypes){
            if(err){
              console.log(err);
              res.status(500).send("Internal Server Error")
            }else{
              var getSharedProblems = "select q.*, qt.`r_questiontype_type`, u.name, u.personal_id, s.school_name from r_question as q inner join r_shared_question as sq "+
               "on q.r_question_id = sq.r_question_id inner join user as u on u.user_id = q.publisher_id inner join school as s on u.school_id = s.school_id"+
                " inner join r_questiontype as qt on q.`r_questiontype_id` = qt.r_questiontype_id  where sq.teacher_id = ?"
                conn.query(getSharedProblems, user[0].user_id, function(err, sharedProblems){
                  if(err){
                    console.log(err);
                    res.status(500).send("Internal Server Error")
                  }else{
                    res.render('reading',{questions:questions, questionTypes:questionTypes, sharedProblems:sharedProblems})
                  }
                })
            }
          })
        }
      })
    }
  })
})

app.get('/reading/type/:id', function(req, res){
  var getUser = "select*from user where auth_id =?"
  var typeId = req.params.id;
  conn.query(getUser, req.session.passport.user, function(err, user){
    if(err){
      console.log(err);
      res.status(500).send("Internal Server Error")
    }else{
      var getMyProblems = "select q.*,qt.`r_questiontype_type` from r_question as q inner join r_questiontype as qt on q.r_questiontype_id = qt.r_questiontype_id and q.`publisher_id`=? and q.`r_questiontype_id` = ?"
      conn.query(getMyProblems, [user[0].user_id,typeId], function(err, questions){
        if(err){
          console.log(err);
          res.status(500).send("Internal Server Error")
        }else{
          var getQuestionType = "Select * from r_questiontype"
          conn.query(getQuestionType, function(err, questionTypes){
            if(err){
              console.log(err);
              res.status(500).send("Internal Server Error")
            }else{
              var getSharedProblems = "select q.*, qt.`r_questiontype_type`, u.name, u.personal_id, s.school_name from r_question as q inner join r_shared_question as sq "+
               "on q.r_question_id = sq.r_question_id inner join user as u on u.user_id = q.publisher_id inner join school as s on u.school_id = s.school_id"+
                " inner join r_questiontype as qt on q.`r_questiontype_id` = qt.r_questiontype_id  where sq.teacher_id = ? and q.r_questiontype_id =?"
                conn.query(getSharedProblems, [user[0].user_id, typeId], function(err, sharedProblems){
                  if(err){
                    console.log(err);
                    res.status(500).send("Internal Server Error")
                  }else{
                    res.render('reading',{questions:questions, questionTypes:questionTypes, sharedProblems:sharedProblems})
                  }
                })
              }
            })
          }
        })
      }
    })
  })

app.get('/reading/modify/scope/:id', function(req, res){
  var getUser = "select*from user where auth_id =?"
  conn.query(getUser, req.session.passport.user, function(err, user){
    if(err){
      console.log(err);
      res.status(500).send("Internal Server Error")
    }else{
      var questionId = req.params.id;
      var getSharedTeacher = "select u.*,s.school_name from user as u inner join r_shared_question as sq on u.user_id = sq.teacher_id and sq.`r_question_id` = ? inner join school as s on u.school_id = s.school_id "
      conn.query(getSharedTeacher, questionId, function(err, sharedTeachers){
        if(err){
          console.log(err);
          res.status(500).send("Internal Server Error")
        }else{
          var getRestTeachers = "select u.*, s.role_id, sch.school_name from user as u inner join serial as s on u.serial_id = s.serial_id inner join school as sch on u.school_id = sch.school_id where s.role_id =3 or s.role_id =1 and u.user_id not in(select u.user_id from user as u inner join r_shared_question as sq on u.user_id = sq.teacher_id and sq.`r_question_id` = ?) and u.user_id not in(select user_id from user where user_id =?)"
             conn.query(getRestTeachers, [questionId, user[0].user_id], function(err, restTeachers){
               if(err){
                 console.log(err);
                 res.status(500).send("Internal Server Error")
               }else{
                 res.render('reading_mScope', {sharedTeachers:sharedTeachers, restTeachers:restTeachers, questionId:questionId})
               }
             })
        }
      })
    }
  })
})

app.get('/reading/scope/:id', function(req,res){
  var questionId = req.params.id
  var getUser = "select*from user where auth_id =?"
  conn.query(getUser, req.session.passport.user, function(err, user){
    if(err){
      console.log(err);
      res.status(500).send("Internal Server Error")
    }else{
      var getTeachers = "select u.*, sc.school_name, s.role_id from user as u inner join serial as s on u.serial_id = s.serial_id inner join school as sc on u.school_id = sc.school_id where s.role_id =3 or s.role_id =1 and u.user_id not in(select user.user_id from user where user_id = ?)"
      conn.query(getTeachers, user[0].user_id, function(err, restTeachers){
        if(err){
          console.log(err);
          res.status(500).send("Internal Server Error")
        }else{
          res.render('reading_mScope', {restTeachers:restTeachers, questionId:questionId})
        }
      })

    }
  })
})

app.post('/reading/scope/modify/:id', function(req,res){
  var questionId = req.params.id;
  var scope = req.body.scope
  var status ;
  var getUser = "select*from user where auth_id =?"
  conn.query(getUser, req.session.passport.user, function(err, user){
    if(err){
      console.log(err);
      res.status(500).send("Internal Server Error");
    }else{
      var deleteForModify = "delete from r_shared_question where r_question_id = ?"
      conn.query(deleteForModify, questionId, function(err, row){
        if(err){
          console.log(err);
          res.status(500).send("Internal Server Error");
        }else{
          if(scope !=1 && scope !=2 && scope !=3){
            scope = 4;
          }
          var updateScope = "UPDATE r_question SET `scope_id` =? where r_question_id =?"
          conn.query(updateScope,[scope, questionId], function(err, result){
            if(err){
              console.log(err);
              res.status(500).send("Internal Server Error");
            }else{
              var sharingProblem = "INSERT INTO r_shared_question(teacher_id, r_question_id) values(?,?)"
              if(scope == 1){
                var getAllTeacher = "select u.*,  s.role_id from user as u inner join serial as s on u.serial_id = s.serial_id where s.role_id =3 or s.role_id =1 and u.user_id not in (select user_id from user where user_id = ?)"
                conn.query(getAllTeacher, user[0].user_id, function(err, allTeachers){
                  for(var i=0; i<allTeachers.length; i++){
                    conn.query(sharingProblem,[allTeachers[i].user_id, questionId], function(err, result){
                      if(err){
                        console.log(err);
                        res.status(500).send('Internal Server Error');
                      }else{
                        return;
                      }
                    })
                  }
                  res.redirect('/reading')
                })
              }else if(scope ==2){
                var getSchoolTeachers = "select u.*,  s.role_id from user as u inner join serial as s on u.serial_id = s.serial_id where s.role_id =3 or s.role_id =1 and u.user_id not in (select user_id from user where user_id = ?) and u.school_id = ?"
                conn.query(getSchoolTeachers, [user[0].user_id, user[0].school_id], function(err, schoolTeachers){
                  for(var i=0; i<schoolTeachers.length; i++){
                    console.log(schoolTeachers.length);
                    conn.query(sharingProblem, [schoolTeachers[i].user_id, questionId], function(err, result){
                      if(err){
                        console.log(err);
                        res.status(500).send('Internal Server Error');
                      }else{
                        return;
                      }
                    })
                  }
                  res.redirect('/reading')
                })

              }else if(scope ==3){
                console.log('3');
                  res.redirect('/reading')
              }else{
                console.log('hello');
                var selectedTeacherId =JSON.parse("[" + req.body.scope + "]");
                for(var i=0; i<selectedTeacherId.length; i++){
                  conn.query(sharingProblem, [selectedTeacherId[i], questionId], function(err, result){
                    if(err){
                      console.log(err);
                      res.status(500).send('Internal Server Error');
                    }else{
                      return;
                    }
                  })
                }
                res.redirect('/reading')
              }
            }
          })

        }
      })
    }
  })
})

app.post('/reading/delete/sharing', function(req, res){
  var sharedId = req.body.sharedProblem
  var getUser = "select*from user where auth_id =?"
  conn.query(getUser, req.session.passport.user, function(err, user){
    if(err){
      console.log(err);
      res.status(500).send("Internal Server Error")
    }else{
      var deleteShareing = 'delete from r_shared_question where teacher_id = ? and r_question_id =?'
      conn.query(deleteShareing, [user[0].user_id, sharedId], function(err, result){
        res.redirect('/reading')
      })
    }
  })
})

//리딩리스트에 무제 보기 화면 띄우기
app.get('/reading/:id/preshow', function(req, res){
  var id =req.params.id
  var sql = 'select r_question_topic, r_question_text,r_question_asw1,r_question_asw2,r_question_asw3,r_question_asw4,r_question_asw5,r_question_solution from r_question where r_question_id = ?'
  conn.query(sql,[id],function(err, r_question){
    if(err){
      console.log(err);
      res.status(500).send('Internal server Error')
    }else{
      res.render('r_preshow',{question:r_question[0]})
    }
  })

})


//리딩시험 생성
app.post('/reading/exam/new', function(req, res){

  var sql = 'insert into r_exam (teacher_id) values(?)'
  conn.query(sql, USER.user_id, function(err, row){
    if(err){
      console.log(err);
      res.status(500).send('Internal server Error')
    }else{
      var insertId = row.insertId
      res.end(JSON.stringify(insertId))
    }
  })

})



//리딩시험 문제관리 화면
app.get('/reading/exam/:id/problem', function(req, res){
  var id = req.params.id
  var sql = 'select r_exam_id, r_exam_name from r_exam where r_exam_id =?'
  conn.query(sql,[id], function(err, r_exam){
    if(err){
      console.log(err);
      res.status(500).send('Internal server Error')
    }else{
      var getRestProblem = "select q.*, qt.r_questiontype_type from r_question as q inner join user as u on q.publisher_id = u.user_id inner join r_questiontype as qt on"+
                          " q.r_questiontype_id = qt.r_questiontype_id where u.user_id = ? and q.r_question_id not in(select `r_question_id` from `r_exam_question` where r_exam_id =?)"
        conn.query(getRestProblem, [USER.user_id,id], function(err, r_questions){
          if(err){
            console.log(err);
            res.status(500).send('Internal Server Error')
          }else{
            var sql = "select q.* ,t.* from r_question as q inner join r_exam_question as eq on eq.r_question_id = q.r_question_id inner join r_questiontype as t on q.r_questiontype_id = t.r_questiontype_id where eq.r_exam_id = ?"
            conn.query(sql,[id], function(err, r_examQuestions){
              if(err){
                console.log(err);
                res.status(500).send('Internal Server Error')
              }else{
                var getRestSharedProblem = "select q.*, qt.r_questiontype_type, u.name, u.personal_id, s.school_name from r_question as q inner join r_shared_question as sq on q.r_question_id = sq.`r_question_id`inner join user as u"
                                      +" on u.user_id = q.publisher_id inner join school as s on u.school_id = s.school_id inner join r_questiontype as qt on q.r_questiontype_id = qt.`r_questiontype_id`where sq.teacher_id = ? "+
                                      "and q.r_question_id not in (select r_question_id from r_exam_question where r_exam_id = ?)"
                conn.query(getRestSharedProblem, [USER.user_id, id], function(err, sharedProblems){
                  if(err){
                    console.log(err);
                    res.status(500).send('Internal Server Error')
                  }else{
                    res.render('reading_exam_problem',{r_exam:r_exam[0], r_questions:r_questions, sharedProblems:sharedProblems,r_examQuestions:r_examQuestions});
                  }
                })
              }
            })
          }
    })
  }
  })
})

//리딩시험 문제 추가 및 문제 갯수 업데이트
app.post('/reading/exam/:id/problem',function(req, res){
  var examId = req.params.id
  var questionId = req.body.questionId
  var examName = req.body.examName;
  var sql = 'insert into r_exam_question (r_exam_id,r_question_id) VALUES(?,?)'
    conn.query(sql,[examId, questionId], function(err, rows){
      if(err){
        console.log(err);
        res.status(500).send('Internal Server Error');
      }else{
        var sql = 'update r_exam set r_exam_count =r_exam_count+1, r_exam_name =? where r_exam_id = ?'
        conn.query(sql, [examName, examId], function(err, rows){
          if(err){
            console.log(err);
            res.status(500).send('Internal Server Error');
          }else{
            res.redirect('/reading/exam/'+examId+'/problem');

          }
        })
      }
    })
})

//리딩시험 문제 삭제
app.post('/reading/exam/problem/:id/delete', function(req, res){
  var proId = req.params.id
  var examId = req.body.examId
  var sql = 'delete from r_exam_question where r_question_id =?'
  conn.query(sql, [proId], function(err, rows){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');
    }else{
        var sql = 'update r_exam set r_exam_count =r_exam_count-1 where r_exam_id = ?'
        conn.query(sql, [examId], function(err, rows){
          if(err){
            console.log(err);
            res.status(500).send('Internal Server Error');
          }else{
            res.redirect('/reading/exam/'+examId+'/problem');

          }
        })
    }
  })

})


// 리딩시험 리스트
app.get('/reading/exam', function(req, res){
  var  sql= 'select * from r_exam where teacher_id = ?'
  conn.query(sql, USER.user_id, function(err, r_exams){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');
    }else{
      res.render('reading_exam', {r_exams:r_exams});
    }
  })
})

// 리딩시험 삭제
app.post('/reading/exam/drop', function(req, res){
  var examId= req.body.examId
  console.log(examId);
  var sql = 'delete from r_exam where r_exam_id = ?'
  conn.query(sql, [examId], function(err, rows){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');
    }else{
      res.redirect('/reading/exam');
    }
  })
})

// 리딩시험이름 업데이트
app.post('/reading/exam/name', function(req,res){
  var examName = req.body.examName;
  var examId = req.body.examId
  var sql = 'update r_exam set r_exam_name = ? where r_exam_id = ?'
  conn.query(sql, [examName, examId], function(err, rows){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');
    }else{
      res.redirect('/reading/exam')
    }
  })
})


//문제셋의 이름, 오디오파일 넣는 화면 라우팅
app.get('/listening/set/new', function(req, res){
  var getTeachers = "select u.*, sc.school_name, s.role_id from user as u inner join serial as s on u.serial_id = s.serial_id inner join school as sc on u.school_id = sc.school_id where s.role_id =3 or s.role_id =1 "
  conn.query(getTeachers, function(err, teachers){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');
    }
    res.render('listening_set_new',{teachers:teachers});

  })



});

//문제셋의 이름, 오디오파일, 생성날짜 데이터 받고 l_questionset 로우에 insert
app.post('/listening/set/new', l_set_upload.single('l_userfile_audio'), function(req, res, next){
  var l_questionset_name = req.body.l_questionset_name;
  var l_questionset_audiopath = "http://localhost:3000/"+req.file.path;
  var scope = req.body.scope;
  if(scope != 1 && scope != 2 && scope !=3){
    scope = 4;
  }
  var sql = 'INSERT into `l_questionset` (`l_questionset_name`, `l_questionset_audiopath`, publisher_id, scope_id) VALUES(?,?,?,?)';
  conn.query(sql,[l_questionset_name, l_questionset_audiopath, USER.user_id, scope], function(err, addedProblem){
    if(err){
      console.log(err);
     res.status(500).send('Internal Server Error');
   }else{
     var sharingProblem = "INSERT INTO l_shared_questionset(teacher_id, l_questionset_id) VALUES(?,?)"
     if(scope == 1){
       var getAllTeacher = "select u.*,  s.role_id from user as u inner join serial as s on u.serial_id = s.serial_id where s.role_id =3 or s.role_id =1 and u.user_id not in (select user_id from user where user_id = ?)"
      conn.query(sharingProblem, USER.user_id, function(err, allTeachers){
        for(var i=0; i<allTeachers.length; i++){
          conn.query(sharingProblem, [allTeachers[i].user_id, addedProblem.insertId], function(err, result){
            if(err){
              console.log(err);
              res.status(500).send('Internal Server Error');
            }else{
              return;
            }
          })
        }
        res.end(JSON.stringify(addedProblem.insertId))

      })
    }else if (scope == 2) {
      var getSchoolTeachers = "select u.*,  s.role_id from user as u inner join serial as s on u.serial_id = s.serial_id where s.role_id =3 or s.role_id =1 and u.user_id not in (select user_id from user where user_id = ?) and u.school_id = ?"
      conn.query(getSchoolTeachers, [USER.user_id, USER.school_id], function(err, schoolTeachers){
        for(var i=0; i<schoolTeachers.length; i++){
          conn.query(sharingProblem, [schoolTeachers[i].user_id, addedProblem.insertId], function(err, result){
            if(err){
              console.log(err);
              res.status(500).send('Internal Server Error');
            }else{
              return;
            }
          })
        }
        res.end(JSON.stringify(addedProblem.insertId))
      })
    }else if (scope ==3) {
      res.end(JSON.stringify(addedProblem.insertId))

    }else{
      var selectedTeacherId = JSON.parse("[" + req.body.scope + "]");
      for(var i=0; i<selectedTeacherId.length; i++){
        conn.query(sharingProblem, [selectedTeacherId[i], addedProblem.insertId], function(err, result){
          if(err){
            console.log(err);
            res.status(500).send('Internal Server Error');
          }else{
            return;
          }
        })
      }
      res.end(JSON.stringify(addedProblem.insertId))

    }
   }
  })
});


app.get('/listening/set', function(req, res){
  var getProblems = "select * from l_questionset where publisher_id =? "
  conn.query(getProblems, USER.user_id, function(err, problems){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');
    }else{
      var getSharedProblems = "select q.*, u.name, u.personal_id, s.school_name from l_questionset as q inner join l_shared_questionset as sq on q.l_questionset_id = sq.l_questionset_id inner join user as u on u.user_id = q.publisher_id inner join school as s on u.school_id = s.school_id where sq.teacher_id = ?"
        conn.query(getSharedProblems, USER.user_id, function(err, sharedProblems){
          if(err){
            console.log(err);
            res.status(500).send('Internal Server Error');
          }else{
            res.render('listening_set', {l_questionsets : problems, sharedProblems : sharedProblems})
          }
        })
    }
  })
})

app.get('/listening/modify/scope/:id', function(req, res){
  var questionSetId = req.params.id;
  var getSharedTeacher ="select u.*,s.school_name from user as u inner join l_shared_questionset as sq on u.user_id = sq.teacher_id and sq.`l_questionset_id` = ? inner join school as s on u.school_id = s.school_id "
  conn.query(getSharedTeacher, questionSetId, function(err, sharedTeachers){
    if(err){
      console.log(err);
      res.status(500).send("Internal Server Error")
    }else{
      console.log(sharedTeachers)
      var getRestTeachers ="select u.*, s.role_id, sch.school_name from user as u inner join serial as s on u.serial_id = s.serial_id inner join school as sch on u.school_id = sch.school_id where (s.role_id =3 or s.role_id =1) and u.user_id not in(select u.user_id from user as u inner join l_shared_questionset as sq on u.user_id = sq.teacher_id and sq.`l_questionset_id` = ?) and u.user_id not in(select user_id from user where user_id =?)"
        conn.query(getRestTeachers, [questionSetId, USER.user_id], function(err, restTeachers){
          if(err){
            console.log(err);
            res.status(500).send("Internal Server Error")
          }else{
            res.render('reading_mScope', {sharedTeachers:sharedTeachers, restTeachers:restTeachers, questionId:questionSetId})
          }
        })
    }
  })
})

app.post('/listening/scope/modify/:id', function(req, res){
  var questionId = req.params.id;
  var scope = req.body.scope;
  var deleteForModify = "delete from l_shared_questionset where l_questionset_id = ?"
  conn.query(deleteForModify, questionId, function(err, row){
    if(err){
      console.log(err);
      res.status(500).send("Internal Server Error");
    }else{
      if(scope !=1 && scope !=2 && scope !=3){
        scope = 4;
      }
      var updateScope = "UPDATE l_questionset SET `scope_id` = ? where l_questionset_id = ?"
      conn.query(updateScope,[scope, questionId], function(err, result){
        if(err){
          console.log(err);
          res.status(500).send("Internal Server Error");
        }else{
          var sharingProblem = "INSERT INTO l_shared_questionset(teacher_id, l_questionset_id) VALUES(?,?)"
          if(scope == 1){
            var getAllTeacher = "select u.*,  s.role_id from user as u inner join serial as s on u.serial_id = s.serial_id where s.role_id =3 or s.role_id =1 and u.user_id not in (select user_id from user where user_id = ?)"
           conn.query(getAllTeacher, USER.user_id, function(err, allTeachers){
             for(var i=0; i<allTeachers.length; i++){
               conn.query(sharingProblem, [allTeachers[i].user_id, questionId], function(err, result){
                 if(err){
                   console.log(err);
                   res.status(500).send('Internal Server Error');
                 }else{
                   return;
                 }
               })
             }
             res.redirect('/listening/set')
           })
         }else if (scope == 2) {
           var getSchoolTeachers = "select u.*,  s.role_id from user as u inner join serial as s on u.serial_id = s.serial_id where s.role_id =3 or s.role_id =1 and u.user_id not in (select user_id from user where user_id = ?) and u.school_id = ?"
           conn.query(getSchoolTeachers, [USER.user_id, USER.school_id], function(err, schoolTeachers){
             for(var i=0; i<schoolTeachers.length; i++){
               conn.query(sharingProblem, [schoolTeachers[i].user_id, questionId], function(err, result){
                 if(err){
                   console.log(err);
                   res.status(500).send('Internal Server Error');
                 }else{
                   return;
                 }
               })
             }
             res.redirect('/listening/set')
           })
         }else if(scope ==3) {
           res.redirect('/listening/set')

         }else{
           var selectedTeacherId = JSON.parse("[" + req.body.scope + "]");
           console.log(selectedTeacherId)
           for(var i=0; i<selectedTeacherId.length; i++){
             conn.query(sharingProblem, [selectedTeacherId[i], questionId], function(err, result){
               if(err){
                 console.log(err);
                 res.status(500).send('Internal Server Error');
               }else{
                 return;
               }
             })
           }
           res.redirect('/listening/set')
         }
        }
      })
    }
  })
})



// questionset delete
app.post('/listening/set/delete', function(req, res){
  var target_id = req.body.id
  var sql = 'Delete from l_questionset WHERE l_questionset_id = ?'
  conn.query(sql,[target_id], function(err, result){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');
    } else{
        res.redirect('/listening/set');

    }
  });
})


// questionset 이름, 오디오 파일 수정화면
app.get('/listening/set/edit/:id', function(req, res){
  var sql = 'select* from l_questionset where l_questionset_id = ?'
  var id = req.params.id;
  conn.query(sql,[id], function(err, l_questionsets){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');
    } else{
      res.render('listening_set_edit',{l_questionset:l_questionsets[0]});
    }
  })

})


// questionset 이름, 오디오 파일 수정
//(오디오파일이 있으면 오디오파일도 같이, 없으면 없이)

app.post('/listening/set/edit/:id', l_set_upload.single('l_userfile_audio'), function(req, res, next){
  var l_questionset_name = req.body.l_questionset_name;
  var l_questionset_id = req.body.l_questionset_id;
  var id = req.params.id;
  console.log(req.file);
  if(req.file != null){
    var l_questionset_audiopath = "http://localhost:3000/"+req.file.path;
    var sql = 'UPDATE `l_questionset` SET `l_questionset_name` =?, l_questionset_audiopath =? where l_questionset_id = ? '
    conn.query(sql,[l_questionset_name, l_questionset_audiopath, id], function(err, rows){
        if(err){
          console.log(err);
         res.status(500).send('Internal Server Error');
       }else{
         var insertId = row.insertId
         res.end(JSON.stringify(insertId))

        }
      })
  }else{
    var sql = 'UPDATE `l_questionset` SET `l_questionset_name` =? where l_questionset_id = ? '
    conn.query(sql,[l_questionset_name, id], function(err, rows){
      if(err){
        console.log(err);
       res.status(500).send('Internal Server Error');
     }else{
       console.log(rows);
       var updateId = l_questionset_id
       res.end(JSON.stringify(updateId))
      }
      })

  }
})

//문제셋 문제관리 화면

app.get('/listening/set/:id', function(req, res){
  var sql =  'select* from l_questionset where l_questionset_id = ?'
  var id = req.params.id;
  conn.query(sql,[id], function(err, l_questionsets){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');
    } else{
      var sql ='SELECT*FROM l_questiontype';
      conn.query(sql, function(err, l_questiontypes){
        if(err){
          console.log(err);
          res.status(500).send('Internal Server Error');
        } else{
          var sql ='select q.*, t.* from l_question as q inner join l_questiontype as t on q.l_questiontype_id = t.l_questiontype_id where q.l_questionset_id = ' + id
          conn.query(sql, function(err, l_questions){
            if(err){
              console.log(err);
              res.status(500).send('Internal Server Error');
            } else{
              res.render('listening_set_problem',{l_questionset:l_questionsets[0], l_questiontypes:l_questiontypes, l_questions : l_questions});

            }
          })

        }
      })

    }
  })
})


//문제관리 문제 추가
app.post('/listening/set/:id',l_set_upload.single('l_userfile_image'), function(req, res, next){
  var l_questionset_id = req.params.id;
  var l_questiontype_id = req.body.l_questiontype_id;
  var l_question_topic = req.body.l_question_topic;
  if(l_questiontype_id == 3){
    var l_question_imagepath = "http://localhost:3000/"+req.file.path;
  }
  var l_question_asw1 = req.body.l_question_asw1;
  var l_question_asw2 = req.body.l_question_asw2;
  var l_question_asw3 = req.body.l_question_asw3;
  var l_question_asw4 = req.body.l_question_asw4;
  var l_question_asw5 = req.body.l_question_asw5;
  var l_question_solution = req.body.l_question_solution;
  var l_question_explain = req.body.l_question_explain

  var sql ='INSERT INTO `l_question`(`l_questionset_id`, `l_questiontype_id`,`l_question_topic`, `l_question_imagepath`,`l_question_asw1`,' +
  ' `l_question_asw2`,`l_question_asw3`,`l_question_asw4`,`l_question_asw5`,`l_question_solution`,`l_question_explain`) VALUES(?,?,?,?,?,?,?,?,?,?,?);'
  conn.query(sql, [l_questionset_id,l_questiontype_id,l_question_topic,l_question_imagepath,l_question_asw1,l_question_asw2,l_question_asw3,l_question_asw4,l_question_asw5,l_question_solution, l_question_explain],function(err, rows){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');

    }else{
      var sql = 'update l_questionset set l_questionset_count = l_questionset_count+1 where l_questionset_id =?'
      conn.query(sql, l_questionset_id, function(err, rows){
        if(err){
          console.log(err);
          res.status(500).send('Internal Server Error');
        }else{
          res.redirect('/listening/set/'+l_questionset_id);

        }
      })
    }
  })

})

//문제관리 문제 수정
app.post('/listening/problem/edit/:id',l_set_upload.single('l_userfile_image'), function(req, res, next){
  var l_questionset_id = req.body.l_questionset_id
  var l_question_id = req.params.id;
  var l_questiontype_id = req.body.l_questiontype_id;
  var l_question_topic = req.body.l_question_topic;
  var l_question_asw1 = req.body.l_question_asw1;
  var l_question_asw2 = req.body.l_question_asw2;
  var l_question_asw3 = req.body.l_question_asw3;
  var l_question_asw4 = req.body.l_question_asw4;
  var l_question_asw5 = req.body.l_question_asw5;
  var l_question_solution = req.body.l_question_solution;
  var l_question_explain = req.body.l_question_explain

  if(req.file != null && l_questiontype_id ==3){
    var l_question_imagepath = "http://localhost:3000/"+req.file.path;
  }

  if(l_question_imagepath != null){
    var sql = 'UPDATE `l_question` SET `l_questiontype_id`=?,`l_question_topic`=?,`l_question_imagepath`=?,l_question_asw1 =?,'
      +'`l_question_asw2`=?,`l_question_asw3`=?,`l_question_asw4`=?,`l_question_asw5`=?,`l_question_solution` =?,`l_question_explain`=? WHERE l_question_id = ?';
    conn.query(sql, [l_questiontype_id,l_question_topic,l_question_imagepath,l_question_asw1,l_question_asw2,l_question_asw3,
              l_question_asw4,l_question_asw5,l_question_solution,l_question_explain, l_question_id], function(err, rows){
                if(err){
                  console.log(err);
                 res.status(500).send('Internal Server Error');
               }else{
                 res.redirect('/listening/set/'+l_questionset_id)
               }

              })

  }else{
    var sql = 'UPDATE `l_question` SET `l_questiontype_id`=?,`l_question_topic`=?,l_question_asw1 =?,'
      +'`l_question_asw2`=?,`l_question_asw3`=?,`l_question_asw4`=?,`l_question_asw5`=?,`l_question_solution` =?,`l_question_explain`=? WHERE l_question_id = ?';
    conn.query(sql, [l_questiontype_id,l_question_topic,l_question_asw1,l_question_asw2,l_question_asw3,
              l_question_asw4,l_question_asw5,l_question_solution,l_question_explain, l_question_id], function(err, rows){
                if(err){
                  console.log(err);
                 res.status(500).send('Internal Server Error');
               }else{
                 res.redirect('/listening/set/'+l_questionset_id)
               }

              })

  }

})

//문제관리 문제 사제
app.post('/listening/set/problem/delete/:id', function(req, res){
  var target_id = req.params.id;
  var l_questionset_id = req.body.questionset_id
  var sql = 'Delete from l_question WHERE l_question_id = ?'
  conn.query(sql,[target_id], function(err, result){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');

    }else{
      var sql = 'update l_questionset set l_questionset_count = l_questionset_count-1 where l_questionset_id =?'
      conn.query(sql, l_questionset_id, function(err, rows){
        if(err){
          console.log(err);
          res.status(500).send('Internal Server Error');
        }else{
          res.redirect('/listening/set/'+l_questionset_id);

        }
      })

    }
  });
})



//시험추가, 관리 화면
app.get('/listening/exam/:id/problem', function(req, res){
  var id = req.params.id
  var getExam = 'select * from l_exam where l_exam_id =? '
  conn.query(getExam, [id], function(err,l_exam){
    if(err){
      console.log(err);
      res.status(500).send('Internal server Error')
    }else{
      var getRestProblems = 'select * from l_questionset where publisher_id = ? and l_questionset_id not in(select l_questionset_id from l_exam_questionset where l_exam_id = ?)'
        conn.query(getRestProblems, [USER.user_id ,id], function(err, l_questionSets){
          if(err){
            console.log(err);
            res.status(500).send('Internal Server Error')
          }else{
            var getExamProblems = "select q.* from l_questionset as q inner join l_exam_questionset as eq on eq.l_questionset_id = q.l_questionset_id where eq.l_exam_id = ?"
            conn.query(getExamProblems, [id], function(err, l_examQuestions){
              if(err){
                console.log(err);
                res.status(500).send('Internal Server Error')
              }else{
                var getRestSharedProblem = "select q.*, u.name, u.personal_id, s.school_name from l_questionset as q inner join l_shared_questionset as sq on q.`l_questionset_id`= sq.l_questionset_id inner join user as u on u.user_id = q.publisher_id inner join school as s on u.school_id = s.school_id where sq.teacher_id = ? and q.`l_questionset_id` not in (select l_questionset_id from l_exam_questionset where l_exam_id = ?)"
                conn.query(getRestSharedProblem,[USER.user_id, id], function(err, restSharedProblems){
                  if(err){
                    console.log(err);
                    res.status(500).send('Internal Server Error')
                  }else{
                    res.render('listening_exam_problem',{l_exam:l_exam[0], l_questionSets:l_questionSets, l_examQuestions:l_examQuestions, restSharedProblems: restSharedProblems})

                  }
                })
              }
            })
        }
      })
    }
  })

})

//시험 문제셋 추가
app.post('/listening/exam/:id/problem', function(req, res){
  var examId = req.params.id
  var questionSetId = req.body.questionId
  var examName = req.body.examName;
  console.log(examName)
  var sql = "insert into l_exam_questionset (l_exam_id, l_questionset_id) VALUES(?,?)"
    conn.query(sql, [examId, questionSetId], function(err, rows){
      if(err){
        console.log(err);
        res.status(500).send('Internal Server Error');
      }else{
        var sql = "select l_questionset_count from l_questionset where l_questionset_id = ?"
          conn.query(sql, [questionSetId], function(err, l_questionset_count){
            if(err){
              console.log(err);
              res.status(500).send('Internal Server Error')
            }else{
              var count = l_questionset_count[0].l_questionset_count
              var sql = 'update l_exam set l_exam_count = l_exam_count+'+count+', l_exam_name = ? where l_exam_id = ?'
              conn.query(sql, [examName,examId], function(err, rows){
                  if(err){
                    console.log(err);
                    res.status(500).send('Internal Server Error')
                  }else{
                    res.redirect('/listening/exam/'+examId+'/problem')
                  }
              })
            }
          })
      }
    })
})
// 시험 문제 셋 삭제
app.post('/listening/exam/problem/:id/delete', function(req, res){
  var setId = req.params.id;
  var examId = req.body.examId
  var examName = req.body.examName;
  var sql = 'delete from l_exam_questionset where l_questionset_id =?'
  conn.query(sql, setId,function(err, rows){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');
    }else{
        var sql = "select l_questionset_count from l_questionset where l_questionset_id = ?"
          conn.query(sql, setId, function(err, l_questionset_count){
            if(err){
              console.log(err);
              res.status(500).send('Internal Server Error')
            }else{
              var count = l_questionset_count[0].l_questionset_count
              var sql = 'update l_exam set l_exam_count = l_exam_count-'+count+', l_exam_name = ? where l_exam_id = ?'
              conn.query(sql, [examName,examId], function(err, rows){
                if(err){
                  console.log(err);
                  res.status(500).send('Internal Server Error')
                }else{
                  res.redirect('/listening/exam/'+examId+'/problem')

                }
              })
            }
          })
    }
  })
})

app.get('/listening/exam', function(req, res){
  var getExams = 'select * from l_exam where teacher_id = ?'
  conn.query(getExams, USER.user_id, function(err, l_exams){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');
    }else{
      res.render('listening_exam', {l_exams:l_exams});

    }
  })
})



app.post('/listening/exam/new', function(req, res){
  var sql = 'insert into l_exam (teacher_id) values(?)'
  conn.query(sql, USER.user_id, function(err, row){
    if(err){
      console.log(err);
      res.status(500).send('Internal server Error')
    }else{
      var insertId = row.insertId
      res.end(JSON.stringify(insertId))
    }
  })
})

// 시험 삭제
app.post('/listening/exam/drop', function(req, res){
  var examId= req.body.examId
  console.log(examId);
  var sql = 'delete from l_exam where l_exam_id = ?'
  conn.query(sql, [examId], function(err, rows){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');
    }else{
      res.redirect('/listening/exam');
    }
  })
})

// 시험 업데이트
app.post('/listening/exam/name', function(req,res){
  var examName = req.body.examName;
  var examId = req.body.examId
  var sql = 'update r_exam set r_exam_name = ? where r_exam_id = ?'
  conn.query(sql, [examName, examId], function(err, rows){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');
    }else{
      res.redirect('/reading/exam')
    }
  })
})

//시험문제 관리 창에서 문제보기 눌렀을때 주는화면
app.get('/listening/set/:id/preview', function(req, res){
  var setId = req.params.id
  var sql =  'select* from l_questionset where l_questionset_id = ?'
  conn.query(sql, setId, function(err, l_questionSet){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');
    }else{
      var sql = 'select q.*, t.* from l_question as q inner join l_questiontype as t on q.l_questiontype_id = t.l_questiontype_id where q.l_questionset_id = ?'
      conn.query(sql, setId, function(err, l_questions){
        if(err){
          console.log(err);
          res.status(500).send('Internal Server Error');
        }else{
          res.render('listening_set_preview', {l_questionSet:l_questionSet[0], l_questions:l_questions})

        }
      })
    }
  })
})


//오세균
app.get('/performanceList', function(req, res){


  var showPerforms = 'select * from assessment_main';
  var getUserGroups = 'select * from user_group where teacher_id=?';
  var getTeacherStudent = 'select * from teacher_student where teacher_id=?'
  var getStudentsBelongToTeacher = 'select * from user where user_id=?'
  var getStudentEvaluation = 'select user_id from studentEvaluation';
  conn.query(showPerforms, function(showPerforms_err, showPerforms_rows){
    if(showPerforms_err){
      console.log(showPerforms_err);
      res.status(500).send('showPerforms_err Internal Server Error!');
    }else{
      conn.query(getUserGroups,[res.locals.SESSIONUSER.user_id],function(getUserGroups_err, getUserGroups_rows){
        if(getUserGroups_err){
          console.log(getUserGroups_err);
          res.status(500).send('getUserGroups_err Internal Server Error!');
        }else{
          conn.query(getTeacherStudent,[res.locals.SESSIONUSER.user_id],function(getTeacherStu_err, getTeacherStu_rows){
            if(getTeacherStu_err){
              console.log(getTeacherStu_err);
              res.status(500).send('getTeacherStu_err Internal Server Error!');
            }else{
              //console.log(getTeacherStu_rows[0].student_id + '[[[[]]]]'+getTeacherStu_rows[1].student_id)
              var array = new Array();
              var counter = 0;
              for(var i in getTeacherStu_rows){
                conn.query(getStudentsBelongToTeacher,[getTeacherStu_rows[i].student_id],function(students_err, students_rows){
                  if(students_err){
                    //console.log('여기서 걸리냐??');
                    console.log(students_err);
                    res.status(500).send('students_err Internal Server Error!')
                  }else{
                    counter++;
                    array.push(students_rows);
                    if(counter == getTeacherStu_rows.length){
                      //console.log('this is array!!!!!!!AADSFAS!!!!');
                      //console.log(array);
                      conn.query(getStudentEvaluation,function(getStuEvalErr,getStuEvalRows){
                        if(getStuEvalErr){
                          console.log(getStuEvalErr);
                          res.status(500).send('getStuEvalErr');
                        }else{
                          //console.log('getStuEvalRows');
                          //console.log(getStuEvalRows[0].user_id);
                          res.render('performanceList',{ShowPerforms: showPerforms_rows, GetUserGroups: getUserGroups_rows
                                                    ,Students: array, studentEvaluation: getStuEvalRows, teacherStu: getTeacherStu_rows});
                        }
                      });
                    }
                  }
                });
              }
            }
          });
        }
      });
    }
  });
});


//문제생성버튼 클릭시 작성표
app.get('/createPerformance', function(req, res){
  var getUser ="select * from user where auth_id = ?"
  conn.query(getUser, req.session.passport.user, function(err, user){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error')
    }else{
      res.render('createPerformance', {teacherName : user[0].name});

    }
  })

});

//'performance'에서 submit버튼 눌렀을때 db 저장
app.post('/createPerformance/add', function(req, res){

  //top
  var subject_top = req.body.subject_name.trim();
  //var grade = req.body.grade.trim();
  //var _class = req.body.group.trim();
  var grade_semester = req.body.grade_semester.trim();
  var subject = req.body.subject.trim();
  var name_of_section = req.body.name_of_section.trim();
  var term_of_assessment = req.body.term_of_assessment.trim();
  var grader = req.body.grader;
  console.log('grader'+grader);

  //middle
  var assessment_item = req.body.assessment_item.trim();
  var supply = req.body.supply.trim();
  var caution_area = req.body.caution_area.trim();
  var notice_or_not = req.body.notice_or_not.trim();
  var factor = req.body.assessment_factor.trim();
  var way = req.body.assessment_way.trim();

  //bottom
  var standard1 = req.body.standard1;
  var standard2 = req.body.standard2;
  var standard3 = req.body.standard3;
  var standard4 = req.body.standard4;
  var standard5 = req.body.standard5;
  var standard6 = req.body.standard6;
  var standard7 = req.body.standard7;
  var standard8 = req.body.standard8;
  var standard9 = req.body.standard9;
  var standard10 = req.body.standard10;


  var standardArray = new Array();

  if(standard1 !== undefined){
    standardArray.push(standard1.trim());
  }if(standard2 !== undefined){
    standardArray.push(standard2.trim());
  }if(standard3 !== undefined){
    standardArray.push(standard3.trim());
  }if(standard4 !== undefined){
    standardArray.push(standard4.trim());
  }if(standard5 !== undefined){
    standardArray.push(standard5.trim());
  }if(standard6 !== undefined){
    standardArray.push(standard6.trim());
  }if(standard7 !== undefined){
    standardArray.push(standard7.trim());
  }if(standard8 !== undefined){
    standardArray.push(standard8.trim());
  }if(standard9 !== undefined){
    standardArray.push(standard9.trim());
  }if(standard10 !== undefined){
    standardArray.push(standard10.trim());
  }


    var main_sql =
    'INSERT INTO assessment_main (grade_semester,subject_name,name_of_section,'+
      'term_of_assessment,grader,assessment_item,supply,caution_area,notice_or_not,factor,way) VALUES(?,?,?,?,?,?,?,?,?,?,?)';
    conn.query(main_sql, [grade_semester, subject, name_of_section,term_of_assessment,grader,
      assessment_item,supply,caution_area,notice_or_not,factor,way], function(err, result){
      if(err){
        console.log(err);
        res.status(500).send('Internal Server Error!1');
      }else{
        //inser to assessment_standard
        var assessment_sql ='INSERT INTO assessment_standard (id_contents, contents) VALUES(?,?)';
          for(var i in standardArray){
          //console.log(standard0+', '+standard1+', '+standard2);
            conn.query(assessment_sql, [result.insertId,standardArray[i]],function(err1, result2){
            if(err1){
              console.log(err1);
              res.status(500).send('Internal Server Error!2');
            }else{

            }
          });
        }
        res.redirect('/performanceList');
      }
    });
});


//수행평가 삭제
app.post('/delete', function(req, res){

  var id = req.body.Id

  var deletePerform = 'delete from assessment_main where id=?';
  var deleteStand = 'delete from assessment_standard where id_contents=?'

  conn.query(deletePerform,[id],function(deleteP_err,deleteP_rows){
    if(deleteP_err){
      console.log(deleteP_err);
      res.status(500).send('deleteP_err Internal Server Error!');
    }else{
      conn.query(deleteStand,[id],function(deleteStand_err, deleteStand_rows){
        if(deleteStand_err){
          console.log(deleteStand_err);
          res.status(500).send('deleteStand_err Internal Server Error!');
        }else{

        }
      })
      res.redirect('/performanceList');
    }
  });
});

//수행평가 수정

var id;
app.post('/revise', function(req, res){

  id = req.body.id;
  res.redirect('/revise');

});

app.get('/revise', function(req, res){
  //console.log('This is invoked right after app.post() is called');

  var getPerforms = 'SELECT * FROM assessment_main WHERE id=?';
  var getStands = 'SELECT * FROM assessment_standard WHERE id_contents=?'

  conn.query(getPerforms, [id],function(getPerforms_err, getPerforms_rows){

    if(getPerforms_err){
      console.log(getPerforms_err);
      res.status(500).send('Internal Server Error!');
    }else{
      conn.query(getStands, [id], function(getStands_err, getStands_rows){
        if(getStands_err){
          console.log(getStands_err);
          res.status(500).send('Internal Server Error!');
        }else{
          res.render('revise', {GetPerforms: getPerforms_rows, GetStands: getStands_rows});
          //console.log(rows1);
        }
      });
    }
  });
});

app.post('/revise/complete', function(req, res){


  console.log('id is= '+id);
  //var grade = req.body.grade.trim();
  //var _class = req.body.group.trim();
  var grade_semester = req.body.grade_semester.trim();
  var subject = req.body.subject.trim();
  var name_of_section = req.body.name_of_section.trim();
  var term_of_assessment = req.body.term_of_assessment.trim();
  var grader = req.body.grader.trim();

  //database table: below_sci;
  var assessment_item = req.body.assessment_item.trim();
  var supply = req.body.supply.trim();
  var caution_area = req.body.caution_area.trim();
  var notice_or_not = req.body.notice_or_not.trim();
  var factor = req.body.assessment_factor.trim();
  var way = req.body.assessment_way.trim();
  var standard1 = req.body.standard1;
  var standard2 = req.body.standard2;
  var standard3 = req.body.standard3;
  var standard4 = req.body.standard4;
  var standard5 = req.body.standard5;
  var standard6 = req.body.standard6;
  var standard7 = req.body.standard7;
  var standard8 = req.body.standard8;
  var standard9 = req.body.standard9;
  var standard10 = req.body.standard10;

  var arr = new Array();

  if(standard1 !== undefined){
    arr.push(standard1.trim());
  }if(standard2 !== undefined){
    arr.push(standard2.trim());
  }if(standard3 !== undefined){
    arr.push(standard3.trim());
  }if(standard4 !== undefined){
    arr.push(standard4.trim());
  }if(standard5 !== undefined){
    arr.push(standard5.trim());
  }if(standard6 !== undefined){
    arr.push(standard6.trim());
  }if(standard7 !== undefined){
    arr.push(standard7.trim());
  }if(standard8 !== undefined){
    arr.push(standard8.trim());
  }if(standard9 !== undefined){
    arr.push(standard9.trim());
  }if(standard10 !== undefined){
    arr.push(standard10.trim());
  }

  var sql = 'UPDATE assessment_main SET grade_semester=?,subject_name=?,name_of_section=?,'+
  'term_of_assessment=?,grader=?,assessment_item=?,supply=?,caution_area=?,notice_or_not=?,factor=?,way=?'+
  'WHERE id=?';

  conn.query(sql, [grade_semester,subject,name_of_section,term_of_assessment,
    grader,assessment_item,supply,caution_area,notice_or_not,factor,way,id],function(err, rows){

    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error!');
    }else{

      var select = 'SELECT id FROM assessment_standard WHERE id_contents=?';

      conn.query(select, [id], function(err1, rows1){
        if(err1){
          console.log(err1);
          res.status(500).send('Internal Server Error!');
        }else{
            console.log(rows1);

            for(var i in rows1){
              //console.log(rows[i].id + ' & ' + arr[i]);
              iterateDB(rows1[i].id, arr[i]);
            }

        }
      });

      res.redirect('/performanceList');
    }
  });

  //user function
  function iterateDB(id, element){
    //console.log('hello iterateDB!');
    //console.log(results.length);//correct
    var standard ='UPDATE assessment_standard SET contents=? WHERE id=?';
    //수행평가 수정에서 평가기준을 추가/삭제시 DB도 삭제되거나 수정되어야 함.

    conn.query(standard, [element, id], function(err, rows){
      if(err){
        console.log(err);
        res.status(500).send('Internal Server Error!');
      }else{

      }
    });
  }

});

//student 로그인시만 볼수 있음
//수행평가적용 버튼

var idToGetPerformFromTeacher;//수행평가번호 in this variable 수행평가적용버튼을 누르기 전까진 값이 바뀌지 않음.


//수행평가적용버튼 누르면 실행, 학생이 로그인해서 수행평가 볼수 있는 라우터
app.post('/seeThePerformanceForStu', function(req,res){
    idToGetPerformFromTeacher = req.body.Id;//수행평가 번호
    console.log('POST: seeThePerformance' + idToGetPerformFromTeacher)
    res.redirect('/seeThePerformanceForStu');

});

app.get('/seeThePerformanceForStu', function(req,res){
  console.log('GET: seeThePerformance' + idToGetPerformFromTeacher)

  var main = 'select * from assessment_main where id=?'
  var standard = 'select * from assessment_standard where id_contents=?'

  conn.query(main,[idToGetPerformFromTeacher],function(main_err,main_rows){
    if(main_err){
      console.log(main_err);
      res.status(500).send('main_err Internal Server Error!');
    }else{
      conn.query(standard,[idToGetPerformFromTeacher],function(standard_err, standard_rows){
        if(standard_err){
          console.log(standard_err);
          res.status(500).send('standard_err Internal Server Error!');
        }else{
          //console.log('main' + main_rows[0] + ' --- ' + standard_rows)
          res.render('seeThePerformanceForStu',{Main_rows: main_rows,Standard_rows :standard_rows});
        }
      })

    }
  })

});

//학생입장에서 자기 성적보기
app.get('/my_transcript', function(req,res){

  var student_id = res.locals.SESSIONUSER.user_id;
  console.log('my_transcript student_id ' + student_id);
  var getStudentEvaluation = 'select * from studentEvaluation where user_id=?'
  var evaluation_standard_all = 'select * from evaluation_standard where performance_id=? AND grade_class=?'
  var evaluation_standard_ofStu = 'select * from evaluation_standard where performance_id=? AND grade_class=? AND student_name=?'

  conn.query(getStudentEvaluation,[student_id],function(err, rows){
    if(err){
      console.log(err);
      res.status(500).send('my_transcript Error!');
    }else{
      if(rows.length == 0){//존재하지 않으면
        res.render('evaluationResultForStu',{student_name: res.locals.SESSIONUSER.name, ifExist: false})
      }else{//존재하면
          conn.query(evaluation_standard_all,[rows[0].performance_id,rows[0].grade_class],function(err1,rows1){
            if(err1){
              console.log(err1);
              res.status(500).send('evaluationStandardAll Error! my_transcript');
            }else{
              conn.query(evaluation_standard_ofStu,[rows[0].performance_id,rows[0].grade_class,rows[0].student_name],function(err2,rows2){
                if(err2){
                  console.log(err2);
                  res.status(500).send('evaluationResultStandardOfStu Error! my_transcript');
                }else{
                  res.render('evaluationResultForStu',{standard_all:rows1,standard_per_stu:rows2,student_name:rows[0].student_name,ifExist: true});
                }
              });
            }
          });
      }
    }
  });
});



var student_id = 0;
var student_name = null;
var students_teacher_id = 0;
var grade_class = null;

//학생에 대한 수행평가 작성하기
app.post('/evaluateStudent', function(req, res){
  student_id = req.body.student_Id;
  student_name =req.body.student_Name;
  students_teacher_id = req.body.students_teacher_Id;
  grade_class = req.body.grade_Class;
  res.redirect('/evaluateStudent');
});

app.get('/evaluateStudent', function(req, res){
  var getTeacherName = 'select name,personal_id from user where user_id=?';
  var getPerforms = 'SELECT * FROM assessment_main WHERE id=?';
  var getStands = 'SELECT * FROM assessment_standard WHERE id_contents=?'

  conn.query(getTeacherName,[students_teacher_id], function(Teacher_name_err, Teacher_name_rows){
    if(Teacher_name_err){
      console.log(Teacher_name_err);
      res.status(500).send('Teacher_name_err Error!');
    }else{
      conn.query(getPerforms,[idToGetPerformFromTeacher], function(getPerforms_err, getPerforms_rows){
        if(getPerforms_err){
          console.log(getPerforms_err);
          res.status(500).send('getPerforms_err Error!11111');
        }else{
          conn.query(getStands,[idToGetPerformFromTeacher], function(getStands_err, getStands_rows){
            if(getStands_err){
              console.log(getStands_err);
              res.status(500).send('getStands_err Error2222222');
            }else{
              res.render('studentEvaluation',{student_Name: student_name, teacher_name: Teacher_name_rows,
                                              teacher_id:students_teacher_id ,grade: grade_class.substring(0,1), _class:grade_class.substring(3,4),
                                            GetPerforms:getPerforms_rows, GetStands: getStands_rows});
            }
        });
      }
    });
  }
  });


});

//선생님이 학생의 수행평가 결과에 대해 점수를 매기고 저장하는 라우터
app.post('/evaluateStudent/add', function(req, res){
  var performance_id = idToGetPerformFromTeacher;
  var student_name = req.body.student_name.trim()
  var gradeclass = req.body.grade+'학년'+req.body.group+'반';
  var grader = req.body.grader;
  var teacher_id = req.body.teacher_id;

  var box1 = req.body.box1;
  var box2 = req.body.box2;
  var box3 = req.body.box3;
  var box4 = req.body.box4;
  var box5 = req.body.box5;
  var boxes = new Array();

  var standard1 = req.body.standard1;
  var standard2 = req.body.standard2;
  var standard3 = req.body.standard3;
  var standard4 = req.body.standard4;
  var standard5 = req.body.standard5;
  var standards = new Array();

  if(box1 !== undefined&&standard1 !== undefined){
    boxes.push(box1);
    standards.push(standard1.trim())
  }if(box2 !== undefined&&standard2 !== undefined){
    boxes.push(box2);
    standards.push(standard2.trim())
  }if(box3 !== undefined&&standard3 !== undefined){
    boxes.push(box3);
    standards.push(standard3.trim())
  }if(box4 !== undefined&&standard4 !== undefined){
    boxes.push(box4);
    standards.push(standard4.trim())
  }if(box5 !== undefined&&standard5 !== undefined){
    boxes.push(box5);
    standards.push(standard5.trim())
  }

  var selectTeacher_Student = 'select * from teacher_student where teacher_id=? AND student_name=?'
  var selectStuEval = 'select * from studentEvaluation where performance_id=? AND student_name=? AND grade_class=? AND grader=?';
  var selectEvalStands = 'select * from evaluation_standard where performance_id=? AND student_name=? AND grade_class=? AND grader=?'
  var studentEvaluation = 'INSERT INTO studentEvaluation (performance_id,student_name,grade_class,grader,user_id) VALUES(?,?,?,?,?)';
  var evaluation_standard ='INSERT INTO evaluation_standard (performance_id,contents,score,grade_class,student_name,grader) VALUES(?,?,?,?,?,?)';

  conn.query(selectTeacher_Student,[teacher_id,student_name],function(selTeaStuErr, selTeaStuRows){
    if(selTeaStuErr){
      console.log(selTeaStuErr);
      res.status(500).send('selTeaStuErr Error!');
    }else{
      conn.query(selectStuEval,[performance_id,student_name,gradeclass,grader],function(err, rows){
        if(err){
          console.log(err);
          res.status(500).send('selectStuEvalErr Error!');
        }else{
          if(rows.length != 0){//DB에 이미 존재하면
            res.send('<script type="text/javascript">alert("이미 존재 하는 수행평가 데이터 입니다.!");</script>');
          }else{//존재하지 않으면
            conn.query(studentEvaluation, [performance_id,student_name,gradeclass,grader,selTeaStuRows[0].student_id], function(studentEvaluation_err,studentEvaluation_result){
              if(studentEvaluation_err){
                console.log(studentEvaluation_err);
                res.status(500).send('studentEvaluation_err Internal Server Error!1');
              }else{
                for(var i in standards){
                  conn.query(evaluation_standard, [performance_id,standards[i],boxes[i],gradeclass,student_name,grader],
                    function(evaluation_standard_err, evaluation_standard_result){
                  if(evaluation_standard_err){
                    console.log(evaluation_standard_err);
                    res.status(500).send('evaluation_standard_err Internal Server Error!2');
                  }
                  });
                }
              res.redirect('/performanceList');
              }
            });
          }
        }
      })
    }
  })
});


//학생평가결과

var stu_name_for_eval_result;
var stu_grade_class_for_eval_result;

app.post('/evaluationResult', function(req, res){
  stu_name_for_eval_result = req.body.student_Name;
  stu_grade_class_for_eval_result = req.body.grade_Class;
  res.redirect('/evaluationResult');//이거 없으면 밑에게 실행 안됨.
});

app.get('/evaluationResult', function(req, res){

  var studentEvaluation = 'select * from studentEvaluation where student_name=? AND grade_class=?';
  //더 명확하게 하려면 studentEvaluation DB에 teacher_id and school_id 있으면 좋을 듯.
  var evaluation_standard_all = 'select * from evaluation_standard where performance_id=? AND grade_class=?'
  var evaluation_standard_ofStu = 'select * from evaluation_standard where performance_id=? AND grade_class=? AND student_name=?'

  conn.query(studentEvaluation,[stu_name_for_eval_result, stu_grade_class_for_eval_result],function(err, rows){
    if(err){
      console.log(err);
      res.status(500).send('evaluationResult Internal Server Error!');
    }else{
      conn.query(evaluation_standard_all,[rows[0].performance_id,rows[0].grade_class],function(err1,rows1){
        if(err1){
          console.log(err1);
          res.status(500).send('evaluationStandardAll Error!!!');
        }else{
          conn.query(evaluation_standard_ofStu,[rows[0].performance_id,rows[0].grade_class,stu_name_for_eval_result],function(err2,rows2){
            if(err2){
              console.log(err2);
              res.status(500).send('evaluationResultStandardOfStu Error!!');
            }else{
              //console.log('aaaa'+rows1.length +'bbb'+rows2.length)
              res.render('evaluationResult',{standard_all:rows1,standard_per_stu:rows2,student_name:stu_name_for_eval_result});
            }
          });
        }
      });

    }
  });

});
//학생을 평가한걸 지우는 라우터
app.post('/evaluationDelete', function(req, res){
  var student_id = req.body.student_Id;
  var student_name =req.body.student_Name;
  var students_teacher_id = req.body.students_teacher_Id;
  var grade_class = req.body.grade_Class;

  var delStuEval = 'delete from studentEvaluation where student_name=? AND grade_class=?'
  var delEvalStands = 'delete from evaluation_standard where student_name=? AND grade_class=?'

  conn.query(delStuEval,[student_name,grade_class],function(delStuEvalErr, delStuEvalRows){
    if(delStuEvalErr){
      console.log(delStuEvalErr);
      res.status(500).send('delStuEvalErr Error!');
    }else{
      conn.query(delEvalStands,[student_name, grade_class], function(delEvalStandsErr, delEvalStandsRows){
        if(delEvalStandsErr){
          console.log(delEvalStandsErr);
          res.status(500).send('delEvalStandsErr Error!!');
        }else{
          res.redirect('/performanceList');
        }
      })
    }
  });
});

//그 반에 적용된 수행평가 지우는 라우터
app.post('/deletePerform', function(req,res){

  var grade_class = req.body.grade_Class;
  var delStuEvalPerform = 'delete from studentEvaluation where performance_id=? AND grade_class=?'
  var delEvalStandsPerform = 'delete from evaluation_standard where performance_id=? AND grade_class=?'

  conn.query(delStuEvalPerform,[idToGetPerformFromTeacher, grade_class],function(err,rows){
    if(err){
      console.log(err);
      res.status(500).send('delStuEvalPerformErr Error!!!!');
    }else{
      conn.query(delEvalStandsPerform,[idToGetPerformFromTeacher, grade_class], function(err1, rows1){
        if(err1){
          console.log(err1);
          res.status(500).send('delEvalStandsPerformErr Error!');
        }else{
          idToGetPerformFromTeacher = 0;
          res.redirect('/performanceList');
        }
      })
    }
  })

});

app.get('/student',function(req,res){
  res.render('student');
});

app.listen(3030, function() {
  console.log('Listening on port 3030!');
})
