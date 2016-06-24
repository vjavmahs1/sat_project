var express =  require('express');
var bodyParser = require('body-parser');
var app = express.Router();

var mysql = require('mysql');

var conn = mysql.createConnection({
  host     : 'localhost',
  port     : '3306',
  user     : 'root',
  password : '900620zZ.',
  database : 'eng'
});

conn.connect();

//리딩문제 추가 화면
//(localhost:2000/reaindg/new 연결)
app.get('/new', function(req, res){
  //reading/new에 보내줄 데이터 뽑는 query문 결과는
    var sql ='SELECT*FROM r_questiontype';
                                    //이쪽으로 들어옴
    conn.query(sql, function(err, r_questiontypes){
      if(err){
        console.log(err);
        res.status(500).send('Internal Server Error');
      }
      //reading_new라는 제이드파일을 뛰어주고 r_questiontypes 변수 프론트페이지로 전달
    res.render('reading_new',{r_questiontypes:r_questiontypes});


  });
});

//리딩문제 추가
app.post('/new', function(req,res){
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
  Date.prototype.yyyymmdd = function() {
  var yyyy = this.getFullYear().toString();
  var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
  var dd  = this.getDate().toString();

  return yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]); // padding
 };
  date = new Date();
    var now = date.yyyymmdd();
  var sql = 'INSERT INTO `r_question`(`r_questiontype_id`,`r_question_topic`,`r_question_text`,`r_question_asw1`,'+
    '`r_question_asw2`,`r_question_asw3`,`r_question_asw4`,`r_question_asw5`,r_question_solution,r_question_explain, r_question_date) VALUES(?,?,?,?,?,?,?,?,?,?,?)';
  conn.query(sql,[r_questiontype_id,r_question_topic,r_question_text,r_question_asw1,r_question_asw2,r_question_asw3,
            r_question_asw4,r_question_asw5,r_question_solution,r_question_explain,now],function(err, rows){
      if(err){
        console.log(err);
        res.status(500).send('Internal Server Error');


      } else {
        res.redirect('/reading/new');

      }

    });

  });
  //리딩문제 수정화면
  app.get(['/:id/edit'], function(req,res){
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
  app.post(['/:id/edit'], function(req,res){
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
    Date.prototype.yyyymmdd = function() {
    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
    var dd  = this.getDate().toString();

    return yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]); // padding
   };
    date = new Date();
      var now = date.yyyymmdd();
    var sql = 'UPDATE r_question SET `r_questiontype_id`=?,`r_question_topic`=?,`r_question_text`=?,`r_question_asw1`=?, '+
    '`r_question_asw2`=?,`r_question_asw3`=?,`r_question_asw4`=?,`r_question_asw5`=?, `r_question_solution`=?, `r_question_explain`=?, r_question_date=? WHERE r_question_id = ?';
    conn.query(sql,[r_questiontype_id,r_question_topic,r_question_text,r_question_asw1,r_question_asw2,r_question_asw3,
      r_question_asw4,r_question_asw5,r_question_solution, r_question_explain, date, id], function(err, result){
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
  app.post(['/:id/delete'], function(req,res){

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
app.get('', function(req, res){
  var sql = 'Select * from r_questiontype'
  conn.query(sql, function(err, r_questiontypes){
    if(err){
      console.log(err);
      res.status(500).send('Internal Server Error');

    }else{
      var sql = 'Select s.`r_questiontype_type`, l.`r_question_id`, l.`r_question_topic`, l.`r_question_text`, l.`r_question_asw1`,'+
      'l.`r_question_asw2`, l.`r_question_asw3`, l.`r_question_asw4`, l.`r_question_asw5`,l.r_question_solution,l.`r_question_date` from'+
      '`r_questiontype` as s inner join `r_question` as l ON s.`r_questiontype_id` = l.`r_questiontype_id` order by l.`r_question_id` desc';
        conn.query(sql, function(err, r_questions){
          if(err){
            console.log(err);
            res.status(500).send('Internal Server Error')
          }else{
            res.render('reading',{r_questiontypes:r_questiontypes, r_questions:r_questions});
          }
        })
    }
  })
})
//리딩리스트에 무제 보기 화면 띄우기
app.get('/:id/preshow', function(req, res){
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
app.post('/exam/new', function(req, res){
  Date.prototype.yyyymmdd = function() {
  var yyyy = this.getFullYear().toString();
  var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
  var dd  = this.getDate().toString();

  return yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]); // padding
 };
  date = new Date();
    var now = date.yyyymmdd();

  var sql = 'insert into r_exam (r_exam_date) values(?)'
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



//리딩시험 문제관리 화면
app.get('/exam/:id/problem', function(req, res){
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
app.post('/exam/:id/problem',function(req, res){
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
app.post('/exam/problem/:id/delete', function(req, res){
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
app.post('/exam/drop', function(req, res){
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











module.exports = app;
