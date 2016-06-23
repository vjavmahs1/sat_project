

    function playFile(obj) {
      var sound = document.getElementById('play');
      var reader = new FileReader();
      reader.onload = (function(audio) {return function(e) {audio.src = e.target.result;};})(sound);
      reader.addEventListener('load', function() {
    });
      reader.readAsDataURL(obj.files[0]);
    }

    var imageLoader = document.getElementById('image_file');
    imageLoader.addEventListener('change', function(){
      handleImage();
      resizeImage();

    });


  function handleImage(e) {
    var reader = new FileReader();
      reader.onload = function (event) {

          $('#uploader img').attr('src',event.target.result);
      }
      reader.readAsDataURL(e.target.files[0]);
  }

  function resizeImage(event){
   ImageTools.resize(this.files[0], {
     width : 419,
     height : 362 }, function(blob, didItResize){
     document.getElementById('image').src = window.URL.createObjectURL(blob);
   })
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



var t= document.getElementById('target');
var type = document.getElementById('opt');
t.addEventListener('submit', function(event){
  for(var i=0; i< opt.length; i++){
    if(opt[i].selected){
      return;
      }
    }
    alert('문제유형을 선택해주세요');
    event.preventDefault();
});

t.addEventListener('submit', function(event){
  if(document.getElementById('audio_file').value == ""){
    alert("오디오 파일을 넣어주세요")
    event.preventDefault();
      }
  });

t.addEventListener('submit', function(event){
  if(document.getElementById('droplist').value == 3 && document.getElementById('image_file').value == ""){
    alert("이미지 파일을 넣어주세요")
    event.preventDefault();
    }
});

t.addEventListener('submit', function(event){
  if(document.getElementById('problem').value.length === 0){
  alert('문제를 입력해주십시오');
  event.preventDefault();
    }
});
var aswers = document.getElementsByClassName('problem');
t.addEventListener('submit', function(event){
  for(var i=0; i< aswers.length; i++){
    if(aswers[i].value.length === 0){
      alert('보기를 작성해주십시오');
      event.preventDefault();
      return;
      }
    }
});

t.addEventListener('submit', function(event){
  var boxs = document.getElementsByClassName('box');
  for(var i=0; i< boxs.length; i++){
    if(boxs[i].checked == true){
        return;
      }
      }
      alert('정답을 입력해주세요');
      event.preventDefault();
});

var droplist = document.getElementById('droplist')
droplist.addEventListener('change', function(event){
  if(droplist.value != 3){
    document.getElementById("image_file").style.visibility = "hidden";
    document.getElementById('image').style.visibility ="hidden "
  }else {
    document.getElementById("image_file").style.visibility = "visible";
    document.getElementById('image').style.visibility ="visible"
    }
})
