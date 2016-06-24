$(function(){

function playFile(obj) {
  var sound = document.getElementById('audio_play');
  var reader = new FileReader();
  reader.onload = (function(audio) {return function(e) {audio.src = e.target.result;};})(sound);
  reader.addEventListener('load', function() {
});
  reader.readAsDataURL(obj.files[0]);
}

var imageLoader = document.getElementById('image_file');
    imageLoader.addEventListener('change', handleImage, false);

function handleImage(e) {
  var reader = new FileReader();
    reader.onload = function (event) {

        $('#uploader img').attr('src',event.target.result);
    }
    reader.readAsDataURL(e.target.files[0]);
}

var dropbox;
dropbox = document.getElementById("uploader");
dropbox.addEventListener("dragenter", dragenter, false);
dropbox.addEventListener("dragover", dragover, false);
dropbox.addEventListener("drop", drop, false);

function dragenter(e) {
  e.stopPropagation();
  e.preventDefault();
}

function dragover(e) {
  e.stopPropagation();
  e.preventDefault();
}

function drop(e) {
  e.stopPropagation();
  e.preventDefault();
  //you can check e's properties
  //console.log(e);
  var dt = e.dataTransfer;
  var files = dt.files;

  //this code line fires your 'handleImage' function (imageLoader change event)
  imageLoader.files = files;
}

function checkProtype(e){
  var type = document.getElementById('opt');
  for(var i=0; i< opt.length; i++){
    if(opt[i].selected){
      return;
      }
    }
    alert('문제유형을 선택해주세요');
    event.preventDefault();

}

function checkAudio(e){
  if(document.getElementById('audio_file').value == ""){
    alert("오디오 파일을 넣어주세요")
    event.preventDefault();
      }
}

function checkImage(e){
  if(document.getElementById('droplist').value == 3 && document.getElementById('image_file').value == ""){
    alert("이미지 파일을 넣어주세요")
    event.preventDefault();
    }
}

function checkPro(e){
  if(document.getElementById('problem').value.length === 0){
  alert('문제를 입력해주십시오');
  event.preventDefault();
    }
}

function checkOption(e){
   var aswers = document.getElementsByClassName('options');
   for(var i=0; i< aswers.length; i++){
     if(aswers[i].value.length === 0){
       alert('보기를 작성해주십시오');
       event.preventDefault();
       return;
       }
     }
}

function checkAnswer(e){
  var boxs = document.getElementsByClassName('box');
  for(var i=0; i< boxs.length; i++){
    if(boxs[i].checked == true){
        return;
      }
      }
      alert('정답을 입력해주세요');
      event.preventDefault();
}



var droplist = document.getElementById('droplist')
droplist.addEventListener('change', function(event){
if(droplist.value == 3){
document.getElementById('image').style.display ="block "
document.getElementById('uploader').style.display ="block "
}else{
document.getElementById('image').style.display ="none "
document.getElementById('uploader').style.display ="none "
}
})



$("#sortable").sortable({
stop: function(event, ui){
var cnt = 1;
$(this).children('li').each(function(){
    $(this).children('input:first').attr('name', "l_question_asw"+cnt+"");
    cnt++;
    });
}
});


});
