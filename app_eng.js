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
    }
    res.redirect('/login')
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
            var sql = 'INSERT INTO teacher_student(student_id,teacher_id) values(?,?)'
            if(teachers.constructor === Array){
            for(var i= 0; i < teachers.length; i++){
              (function() {
                var j = i;
                console.log("you have multiple teachers");
                conn.query(sql, [user.insertId, teachers[j]],function(err,results){
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







var listening = require('./routes/listening');
app.use('/listening', listening)

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
      var addProblem = 'INSERT INTO `r_question`(`r_questiontype_id`,`r_question_topic`,`r_question_text`,`r_question_asw1`,'+
        '`r_question_asw2`,`r_question_asw3`,`r_question_asw4`,`r_question_asw5`,r_question_solution,r_question_explain, publisher_id) VALUES(?,?,?,?,?,?,?,?,?,?,?)';
        conn.query(addProblem,[r_questiontype_id,r_question_topic,r_question_text,r_question_asw1,r_question_asw2,r_question_asw3,
                  r_question_asw4,r_question_asw5,r_question_solution,r_question_explain, user[0].user_id], function(err, addedProblem){
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
                    console.log(sharedProblems);
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

  var sql = 'insert into r_exam (r_exam_date) values(default)'
  conn.query(sql, function(err, row){
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
      var sql = 'select q.*,t.* from r_question as q inner join r_questiontype as t on q.r_questiontype_id = t.r_questiontype_id'+
                ' where  r_question_id not in(select r_question_id from r_exam_question where r_exam_id = ?) order by q.`r_question_id` desc';
        conn.query(sql, [id], function(err, r_questions){
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
                res.render('reading_exam_problem',{r_exam:r_exam[0], r_questions:r_questions, r_examQuestions:r_examQuestions});

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
  var sql = 'insert into r_exam_question (r_exam_id,r_question_id) VALUES(?,?)'
    conn.query(sql,[examId, questionId], function(err, rows){
      if(err){
        console.log(err);
        res.status(500).send('Internal Server Error');
      }else{
        var sql = 'update r_exam set r_exam_count =r_exam_count+1 where r_exam_id = ?'
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
app.get('/exam', function(req, res){
  var  sql= 'select * from r_exam'
  conn.query(sql, function(err, r_exams){
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



app.listen(3000,function(){
  console.log('Connected, 3000 port!');
})
