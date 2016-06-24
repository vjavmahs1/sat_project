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


//문제셋의 이름, 오디오파일 넣는 화면 라우팅
app.get('/set/new', function(req, res){
  var sql = 'select*from l_questionset';
  conn.query(sql, function(err, l_questionsets){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');
    }
    res.render('listening_set_new',{l_questionsets:l_questionsets});

  })



});

//문제셋의 이름, 오디오파일, 생성날짜 데이터 받고 l_questionset 로우에 insert
app.post('/set/new', l_set_upload.single('l_userfile_audio'), function(req, res, next){
  var l_questionset_name = req.body.l_questionset_name;
  var l_questionset_audiopath = "http://localhost:3000/"+req.file.path;
  Date.prototype.yyyymmdd = function() {
  var yyyy = this.getFullYear().toString();
  var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
  var dd  = this.getDate().toString();
  return yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]); // padding
 };

  date = new Date();
    var now = date.yyyymmdd();


  var sql = 'INSERT into `l_questionset` (`l_questionset_name`, `l_questionset_date`, `l_questionset_audiopath`) VALUES(?,?,?)';
  conn.query(sql,[l_questionset_name, now ,l_questionset_audiopath], function(err, row){
    if(err){
      console.log(err);
     res.status(500).send('Internal Server Error');
   }else{
     var insertId = row.insertId
     res.end(JSON.stringify(insertId))

   }
  })

});

//questionset 리스트
app.get('/set', function(req, res){
  var sql = 'select*from l_questionset order by `l_questionset_id` desc';
  conn.query(sql, function(err, l_questionsets){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');
    }
    res.render('listening_set',{l_questionsets:l_questionsets});

  })

})
// questionset delete
app.post('/set/delete', function(req, res){
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
app.get('/set/edit/:id', function(req, res){
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

app.post('/set/edit/:id', l_set_upload.single('l_userfile_audio'), function(req, res, next){
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

app.get('/set/:id', function(req, res){
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
app.post('/set/:id',l_set_upload.single('l_userfile_image'), function(req, res, next){
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
app.post('/problem/edit/:id',l_set_upload.single('l_userfile_image'), function(req, res, next){
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
app.post('/set/problem/delete/:id', function(req, res){
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
app.get('/exam/:id/problem', function(req, res){
  var id = req.params.id
  var sql = 'select * from l_exam where l_exam_id =? '
  conn.query(sql, [id], function(err,l_exam){
    if(err){
      console.log(err);
      res.status(500).send('Internal server Error')
    }else{
      var sql = 'select * from l_questionset where l_questionset_id not in(select l_questionset_id from l_exam_questionset where l_exam_id = ?)'
        conn.query(sql, [id], function(err, l_questionSets){
          if(err){
            console.log(err);
            res.status(500).send('Internal Server Error')
          }else{
            var sql = "select q.* from l_questionset as q inner join l_exam_questionset as eq on eq.l_questionset_id = q.l_questionset_id where eq.l_exam_id = ?"
            conn.query(sql, [id], function(err, l_examQuestions){
              if(err){
                console.log(err);
                res.status(500).send('Internal Server Error')
              }else{
                res.render('listening_exam_problem',{l_exam:l_exam[0], l_questionSets:l_questionSets, l_examQuestions:l_examQuestions})
              }
            })
        }
      })
    }
  })

})

//시험 문제셋 추가
app.post('/exam/:id/problem', function(req, res){
  var examId = req.params.id
  var questionSetId = req.body.questionId
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
              var sql = 'update l_exam set l_exam_count = l_exam_count+'+count+' where l_exam_id = ?'
              conn.query(sql, examId, function(err, rows){
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
app.post('/exam/problem/:id/delete', function(req, res){
  var setId = req.params.id;
  var examId = req.body.examId
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
              var sql = 'update l_exam set l_exam_count = l_exam_count-'+count+' where l_exam_id = ?'
              conn.query(sql, examId, function(err, rows){
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

// 리딩시험 리스트
app.get('/exam', function(req, res){
  var  sql= 'select * from l_exam'
  conn.query(sql, function(err, l_exams){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');
    }else{
      res.render('listening_exam', {l_exams:l_exams});
    }
  })

})

app.post('/exam/new', function(req, res){
  Date.prototype.yyyymmdd = function() {
  var yyyy = this.getFullYear().toString();
  var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
  var dd  = this.getDate().toString();

  return yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]); // padding
 };
  date = new Date();
    var now = date.yyyymmdd();

  var sql = 'insert into l_exam (l_exam_date) values(?)'
  conn.query(sql,[now], function(err, row){
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
app.post('/exam/drop', function(req, res){
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
app.post('/exam/name', function(req,res){
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
app.get('/set/:id/preview', function(req, res){
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

module.exports = app;
