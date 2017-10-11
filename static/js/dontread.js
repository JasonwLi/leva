var tag = document.createElement('script');
tag.id = 'iframe-demo';
tag.src = 'https://www.youtube.com/iframe_api';
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
var player;
var times;
var timeBank = {
  times : {},
  last_updated : new Date(),
  started : false,
  updateData : function(data) {
    this.times = data;
    this.last_updated = new Date();
    this.started = true;
  }
}

function updateView() {
  if (!timeBank.started) return;
  current = new Date();
  seconds_elapsed = (current - timeBank.last_updated)/1000;
  console.log(seconds_elapsed);
  var time_array = [];
  $.map(timeBank.times, function(v, k) {
    time_array.push({name: v.name, duration: v.duration});
  });
  time_array.sort(function(a, b) {
    return a.name.localeCompare(b.name);
  });
  $.map(time_array, function(v) {
    v.duration += seconds_elapsed;
  });
  var table = $("#viewertab");
  table.empty();
  $.map(time_array, function(v) {
    console.log(v.name);
    var row = $("<tr/>");
    row.append($("<td/>").text(v.name));
    row.append($("<td/>").text(secondsToHms(v.duration)));
    table.append(row);
  });
}

function secondsToHms(d) {
  d = Number(d);
  var h = Math.floor(d / 3600);
  var m = Math.floor(d % 3600 / 60);
  var s = Math.floor(d % 3600 % 60);
  return ('0' + h).slice(-2) + ":" + ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
}

var name = "gong" + (new Date).getTime()%23157;
function onYouTubeIframeAPIReady() {
  console.log("test");
  player = new YT.Player('av', {
    events: {
      'onReady': onPlayerReady,
    }
  });
}

function getCurrentTime() {
  return { "name" : name, "duration" : player.getCurrentTime() };
}

function postTime() {
  console.log("posting time");
  $.post("api/set_time", JSON.stringify(getCurrentTime()), "json");
}

function getTimes() {
  $.getJSON("api/get_times").done( function(data) {
    console.log(data);
    times = data;
    timeBank.updateData(data);
  });
}

function onPlayerReady(event) {
  document.getElementById('av').style.borderColor = '#FF6D00';
  event.target.playVideo();
  var updateLoop = setInterval(updateView, 750);
  var sendLoop = setInterval(postTime, 5000);
  var getLoop = setInterval(getTimes, 5000);
}

$( document ).ready(function() {
  var enterbutton = $("#enter");
  enterbutton.click(function() {
    var namebox = $("namebox");
    if (!namebox.val()) return;
    name = namebox.val();
  });
  $("#kiminona").text("your name is: " + name);
});
