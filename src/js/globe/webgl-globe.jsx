/**
* @jsx React.DOM
*/

var React = require('react'),
Detector = require('./third-party/Detector.js'),
TWEEN = require('./third-party/Tween.js'),
DAT = require('./globe.js');
var THREE = require("../globe/third-party/three.min.js");

var globe;

function colorFn(x) {
  var c = new THREE.Color();
  c.setHex(0xDC1E32); // ADP red
  return c;
}

var WebGLGlobe = React.createClass({
  render: function() {

    return (
      <div>
      <div className="container" ref="container"></div>

      <div id="info">
      <strong><a href="http://www.chromeexperiments.com/globe">WebGL Globe</a></strong> <span className="bull">&bull;</span> <span className="google-ack">Created by the Google Data Arts Team</span> <span className="bull">&bull;</span>
      </div>

      <div id="currentInfo">
      <span ref="yearAll" className="year"></span>
      </div>

      <div id="title">
        <h2>Providing services in over <span className="highlight">130 countries</span></h2>
      </div>

      </div>
    );
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return false;
  },
  componentDidMount: function() {
    var _this = this;
    var container = this.refs.container.getDOMNode();
    if(!Detector.webgl){
      Detector.addGetWebGLMessage();
    } else {

      var years = ['All'];
      // var container = document.getElementById('container');

      var opts = {imgDir: 'assets/', colorFn: colorFn};
      globe = new DAT.Globe(container, opts);
      var i, tweens = [];

      var settime = function(globe, t) {
        return function() {
          new TWEEN.Tween(globe).to({time: t/years.length},500).easing(TWEEN.Easing.Cubic.EaseOut).start();
          var y = _this.refs[('year'+years[t])].getDOMNode();
          if (y.getAttribute('class') === 'year active') {
            return;
          }
          var yy = document.getElementsByClassName('year');
          for(i=0; i<yy.length; i++) {
            yy[i].setAttribute('class','year');
          }
          y.setAttribute('class', 'year active');
        };
      };

      for(i = 0; i<years.length; i++) {
        var y = this.refs[('year'+years[i])].getDOMNode();
        y.addEventListener('mouseover', settime(globe,i), false);
      }

      var xhr;
      TWEEN.start();


      xhr = new XMLHttpRequest();
      xhr.open('GET', 'assets/countries.json', true);
      var onreadystatechangecallback = function(e) {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            window.data = data;
            for (i=0;i<data.length;i++) {
              globe.addData(data[i][1], {format: 'magnitude', name: data[i][0], animated: true, autoRotate: true});
            }
            globe.createPoints();
            (settime(globe,0).bind(this))();
            globe.animate();

            rotate(globe, 0.003, 0);

            document.body.style.backgroundImage = 'none'; // remove loading
          }
        }
      };
      xhr.onreadystatechange = onreadystatechangecallback.bind(this);
      xhr.send(null);
    }

  }

});

function rotate(globe, x, y) {
  globe.rotate(x, y);
  setTimeout(function() {
    rotate(globe, x, y);
  }, 100);
}

module.exports = WebGLGlobe;
