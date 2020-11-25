/* eslint-disable no-undef */
const mcanvas = document.getElementById("myCanvas");
const mctx = mcanvas.getContext("2d");
var current = {color: "black", size: 5, type: "pen", x: 0, y: 0};
function clearCanvas() {mctx.clearRect(0, 0, mcanvas.width, mcanvas.height);};
var startX, startY;
mcanvas.addEventListener("mouseup", stop);
mcanvas.addEventListener("mouseleave", stop);
mcanvas.addEventListener("mousedown", start);
mcanvas.addEventListener("mouseup", stop);
mcanvas.addEventListener("resize", resize);
resize();
function resize() {
  mctx.canvas.width = window.innerWidth;
  mctx.canvas.height = window.innerHeight;
}
function reposition(evt) {
  var rect = mcanvas.getBoundingClientRect();
  current.x = (evt.clientX - rect.left) / (rect.right - rect.left) * mcanvas.width;
  current.y = (evt.clientY - rect.top) / (rect.bottom - rect.top) * mcanvas.height;
}
function start(evt) {
  var rect = mcanvas.getBoundingClientRect();
  startX = (evt.clientX - rect.left) / (rect.right - rect.left) * mcanvas.width;
  startY = (evt.clientY - rect.top) / (rect.bottom - rect.top) * mcanvas.height;
  document.addEventListener("mousemove", begindraw);
  reposition(evt);
}
function stop(evt) {
  document.removeEventListener("mousemove", begindraw);
  if (current.type=="circle") publish(["circle",current.color,startX,startY,current.x,current.y])
  else if (current.type=="square") publish(["square",current.color,startX,startY,current.x-startX,current.y-startY]);
}
function begindraw(e) {
  e.preventDefault();
  // e.stopPropagation();
  mctx.fillStyle = mctx.strokeStyle = current.color;
  if (current.type=="pen") draw(e);
  else if (current.type=="circle") circle(e);
  else if (current.type=="square") square(e);
}
function circle(e) {
    reposition(e);
    // mctx.clearRect(0, 0, canvas.width, canvas.height);
    mctx.beginPath();
    var a = startX - current.x;
    var b = startY - current.y;
    var c = Math.sqrt( a*a + b*b );
    mctx.arc(startX, startY, c, 0, Math.PI * 2);
    mctx.closePath();
    mctx.fill();
}
function square(e) {
  reposition(e);
  mctx.beginPath();
  mctx.fillRect(startX, startY, current.x-startX, current.y-startY);
  mctx.closePath();
  mctx.fill();
}
function draw(evt) {
  mctx.beginPath();
  mctx.lineWidth = current.size;
  mctx.lineCap = mctx.lineJoin = "round";
  var x0 = current.x;
  var y0 = current.y;
  mctx.moveTo(current.x, current.y);
  reposition(evt);
  var x1 = current.x;
  var y1 = current.y;
  mctx.lineTo(current.x, current.y);
  mctx.closePath();
  mctx.stroke();
  var w = mcanvas.width;
  var h = mcanvas.height;
  publish(["line",current.color,x0,y0,x1,y1,current.size])
}
function drawStream(e) {
  mctx.beginPath();
  mctx.fillStyle = mctx.strokeStyle = e[1];
  if (e[0]=="line") {
    mctx.lineWidth = e[6];
    mctx.lineCap = mctx.lineJoin = "round";
    mctx.moveTo(e[2], e[3]);
    mctx.lineTo(e[4], e[5]);
    mctx.stroke();
  } else if (e[0]=="square") {
    mctx.fillRect(e[2],e[3],e[4],e[5]);
    mctx.fill();
  } else if (e[0]=="circle") {
    var a = e[2] - e[4];
    var b = e[3] - e[5];
    var c = Math.sqrt( a*a + b*b );
    mctx.arc(e[2], e[3], c, 0, Math.PI * 2);
    mctx.closePath();
    mctx.fill();
  }
}
function publish(data) {socket.emit("draw", data)};
$("#undo").on("click", function() {socket.emit("undo")});
var hueb = new Huebee( document.getElementById("color"), {setText: false, saturations: 1}).on( "change", function( color, hue, sat, lum ) {current.color = color;});
var snowStorm=function(e,t){this.autoStart=!0,this.excludeMobile=!0,this.flakesMax=128,this.flakesMaxActive=64,this.animationInterval=33,this.useGPU=!0,this.className="snow",this.excludeMobile=!0,this.flakeBottom=null,this.followMouse=!1,this.snowColor="#fff",this.snowCharacter="&bull;",this.snowStick=!0,this.targetElement="preload",this.useMeltEffect=!0,this.useTwinkleEffect=!1,this.usePositionFixed=!1,this.usePixelPosition=!1,this.freezeOnBlur=!0,this.flakeLeftOffset=0,this.flakeRightOffset=0,this.flakeWidth=8,this.flakeHeight=8,this.vMaxX=5,this.vMaxY=4,this.zIndex=0;var i,s=this,n=navigator.userAgent.match(/msie/i),o=navigator.userAgent.match(/msie 6/i),l=navigator.userAgent.match(/mobile|opera m(ob|in)/i),a=n&&"BackCompat"===t.compatMode||o,r=null,f=null,m=null,h=null,u=null,c=null,d=null,v=1,p=!1,y=!1,k=function(){try{t.createElement("div").style.opacity="0.5"}catch(e){return!1}return!0}(),g=!1,x=t.createDocumentFragment();function w(e,t){return isNaN(t)&&(t=0),Math.random()*e+t}function F(){e.setTimeout((function(){s.start(!0)}),20),s.events.remove(n?t:e,"mousemove",F)}return i=function(){var i;var n,o=e.requestAnimationFrame||e.webkitRequestAnimationFrame||e.mozRequestAnimationFrame||e.oRequestAnimationFrame||e.msRequestAnimationFrame||function(t){e.setTimeout(t,1e3/(s.animationInterval||20))};function l(e){return void 0!==n.style[e]?e:null}i=o?function(){return o.apply(e,arguments)}:null,n=t.createElement("div");var a={transform:{ie:l("-ms-transform"),moz:l("MozTransform"),opera:l("OTransform"),webkit:l("webkitTransform"),w3:l("transform"),prop:null},getAnimationFrame:i};return a.transform.prop=a.transform.w3||a.transform.moz||a.transform.webkit||a.transform.ie||a.transform.opera,n=null,a}(),this.timer=null,this.flakes=[],this.disabled=!1,this.active=!1,this.meltFrameCount=20,this.meltFrames=[],this.setXY=function(e,t,i){if(!e)return!1;s.usePixelPosition||y?(e.style.left=t-s.flakeWidth+"px",e.style.top=i-s.flakeHeight+"px"):a||s.flakeBottom?(e.style.right=100-t/r*100+"%",e.style.top=Math.min(i,u-s.flakeHeight)+"px"):(e.style.right=100-t/r*100+"%",e.style.bottom=100-i/m*100+"%")},this.events=function(){var t=!e.addEventListener&&e.attachEvent,i=Array.prototype.slice,s={add:t?"attachEvent":"addEventListener",remove:t?"detachEvent":"removeEventListener"};function n(e){var s=i.call(e),n=s.length;return t?(s[1]="on"+s[1],n>3&&s.pop()):3===n&&s.push(!1),s}function o(e,i){var n=e.shift(),o=[s[i]];t?n[o](e[0],e[1]):n[o].apply(n,e)}return{add:function(){o(n(arguments),"add")},remove:function(){o(n(arguments),"remove")}}}(),this.randomizeWind=function(){var e,t;if(t=w(s.vMaxX,.2),c=1===parseInt(w(2),10)?-1*t:t,d=w(s.vMaxY,.2),this.flakes)for(e=0;e<this.flakes.length;e++)this.flakes[e].active&&this.flakes[e].setVelocities()},this.scrollHandler=function(){var i;if(h=s.flakeBottom?0:parseInt(e.scrollY||t.documentElement.scrollTop||(a?t.body.scrollTop:0),10),isNaN(h)&&(h=0),!p&&!s.flakeBottom&&s.flakes)for(i=0;i<s.flakes.length;i++)0===s.flakes[i].active&&s.flakes[i].stick()},this.resizeHandler=function(){e.innerWidth||e.innerHeight?(r=e.innerWidth-16-s.flakeRightOffset,m=s.flakeBottom||e.innerHeight):(r=(t.documentElement.clientWidth||t.body.clientWidth||t.body.scrollWidth)-(n?0:8)-s.flakeRightOffset,m=s.flakeBottom||t.documentElement.clientHeight||t.body.clientHeight||t.body.scrollHeight),u=t.body.offsetHeight,f=parseInt(r/2,10)},this.resizeHandlerAlt=function(){r=s.targetElement.offsetWidth-s.flakeRightOffset,m=s.flakeBottom||s.targetElement.offsetHeight,f=parseInt(r/2,10),u=t.body.offsetHeight},this.freeze=function(){if(s.disabled)return!1;s.disabled=1,s.timer=null},this.resume=function(){if(!s.disabled)return!1;s.disabled=0,s.timerInit()},this.toggleSnow=function(){s.flakes.length?(s.active=!s.active,s.active?(s.show(),s.resume()):(s.stop(),s.freeze())):s.start()},this.stop=function(){var i;for(this.freeze(),i=0;i<this.flakes.length;i++)this.flakes[i].o.style.display="none";s.events.remove(e,"scroll",s.scrollHandler),s.events.remove(e,"resize",s.resizeHandler),s.freezeOnBlur&&(n?(s.events.remove(t,"focusout",s.freeze),s.events.remove(t,"focusin",s.resume)):(s.events.remove(e,"blur",s.freeze),s.events.remove(e,"focus",s.resume)))},this.show=function(){var e;for(e=0;e<this.flakes.length;e++)this.flakes[e].o.style.display="block"},this.SnowFlake=function(e,n,o){var l=this;this.type=e,this.x=n||parseInt(w(r-20),10),this.y=isNaN(o)?-w(m)-12:o,this.vX=null,this.vY=null,this.vAmpTypes=[1,1.2,1.4,1.6,1.8],this.vAmp=this.vAmpTypes[this.type]||1,this.melting=!1,this.meltFrameCount=s.meltFrameCount,this.meltFrames=s.meltFrames,this.meltFrame=0,this.twinkleFrame=0,this.active=1,this.fontSize=10+this.type/5*10,this.o=t.createElement("div"),this.o.innerHTML=s.snowCharacter,s.className&&this.o.setAttribute("class",s.className),this.o.style.color=s.snowColor,this.o.style.position=p?"fixed":"absolute",s.useGPU&&i.transform.prop&&(this.o.style[i.transform.prop]="translate3d(0px, 0px, 0px)"),this.o.style.width=s.flakeWidth+"px",this.o.style.height=s.flakeHeight+"px",this.o.style.fontFamily="arial,verdana",this.o.style.cursor="default",this.o.style.overflow="hidden",this.o.style.fontWeight="normal",this.o.style.zIndex=s.zIndex,x.appendChild(this.o),this.refresh=function(){if(isNaN(l.x)||isNaN(l.y))return!1;s.setXY(l.o,l.x,l.y)},this.stick=function(){a||s.targetElement!==t.documentElement&&s.targetElement!==t.body?l.o.style.top=m+h-s.flakeHeight+"px":s.flakeBottom?l.o.style.top=s.flakeBottom+"px":(l.o.style.display="none",l.o.style.top="auto",l.o.style.bottom="0%",l.o.style.position="fixed",l.o.style.display="block")},this.vCheck=function(){l.vX>=0&&l.vX<.2?l.vX=.2:l.vX<0&&l.vX>-.2&&(l.vX=-.2),l.vY>=0&&l.vY<.2&&(l.vY=.2)},this.move=function(){var e=l.vX*v;l.x+=e,l.y+=l.vY*l.vAmp,l.x>=r||r-l.x<s.flakeWidth?l.x=0:e<0&&l.x-s.flakeLeftOffset<-s.flakeWidth&&(l.x=r-s.flakeWidth-1),l.refresh(),m+h-l.y+s.flakeHeight<s.flakeHeight?(l.active=0,s.snowStick?l.stick():l.recycle()):(s.useMeltEffect&&l.active&&l.type<3&&!l.melting&&Math.random()>.998&&(l.melting=!0,l.melt()),s.useTwinkleEffect&&(l.twinkleFrame<0?Math.random()>.97&&(l.twinkleFrame=parseInt(8*Math.random(),10)):(l.twinkleFrame--,k?l.o.style.opacity=l.twinkleFrame&&l.twinkleFrame%2==0?0:1:l.o.style.visibility=l.twinkleFrame&&l.twinkleFrame%2==0?"hidden":"visible")))},this.animate=function(){l.move()},this.setVelocities=function(){l.vX=c+w(.12*s.vMaxX,.1),l.vY=d+w(.12*s.vMaxY,.1)},this.setOpacity=function(e,t){if(!k)return!1;e.style.opacity=t},this.melt=function(){s.useMeltEffect&&l.melting&&l.meltFrame<l.meltFrameCount?(l.setOpacity(l.o,l.meltFrames[l.meltFrame]),l.o.style.fontSize=l.fontSize-l.fontSize*(l.meltFrame/l.meltFrameCount)+"px",l.o.style.lineHeight=s.flakeHeight+2+.75*s.flakeHeight*(l.meltFrame/l.meltFrameCount)+"px",l.meltFrame++):l.recycle()},this.recycle=function(){l.o.style.display="none",l.o.style.position=p?"fixed":"absolute",l.o.style.bottom="auto",l.setVelocities(),l.vCheck(),l.meltFrame=0,l.melting=!1,l.setOpacity(l.o,1),l.o.style.padding="0px",l.o.style.margin="0px",l.o.style.fontSize=l.fontSize+"px",l.o.style.lineHeight=s.flakeHeight+2+"px",l.o.style.textAlign="center",l.o.style.verticalAlign="baseline",l.x=parseInt(w(r-s.flakeWidth-20),10),l.y=parseInt(-1*w(m),10)-s.flakeHeight,l.refresh(),l.o.style.display="block",l.active=1},this.recycle(),this.refresh()},this.snow=function(){var e,t,n=0,o=null;for(e=0,t=s.flakes.length;e<t;e++)1===s.flakes[e].active&&(s.flakes[e].move(),n++),s.flakes[e].melting&&s.flakes[e].melt();n<s.flakesMaxActive&&0===(o=s.flakes[parseInt(w(s.flakes.length),10)]).active&&(o.melting=!0),s.timer&&i.getAnimationFrame(s.snow)},this.mouseMove=function(e){if(!s.followMouse)return!0;var t=parseInt(e.clientX,10);v=t<f?t/f*2-2:(t-=f)/f*2},this.createSnow=function(e,t){var i;for(i=0;i<e;i++)s.flakes[s.flakes.length]=new s.SnowFlake(parseInt(w(6),10)),(t||i>s.flakesMaxActive)&&(s.flakes[s.flakes.length-1].active=-1);s.targetElement.appendChild(x)},this.timerInit=function(){s.timer=!0,s.snow()},this.sinit=function(){var i;for(i=0;i<s.meltFrameCount;i++)s.meltFrames.push(1-i/s.meltFrameCount);s.randomizeWind(),s.createSnow(s.flakesMax),s.events.add(e,"resize",s.resizeHandler),s.events.add(e,"scroll",s.scrollHandler),s.freezeOnBlur&&(n?(s.events.add(t,"focusout",s.freeze),s.events.add(t,"focusin",s.resume)):(s.events.add(e,"blur",s.freeze),s.events.add(e,"focus",s.resume))),s.resizeHandler(),s.scrollHandler(),s.followMouse&&s.events.add(n?t:e,"mousemove",s.mouseMove),s.animationInterval=Math.max(20,s.animationInterval),s.timerInit()},this.start=function(i){if(g){if(i)return!0}else g=!0;if("string"==typeof s.targetElement){var n=s.targetElement;if(s.targetElement=t.getElementById(n),!s.targetElement)throw new Error('Snowstorm: Unable to get targetElement "'+n+'"')}if(s.targetElement||(s.targetElement=t.body||t.documentElement),s.targetElement!==t.documentElement&&s.targetElement!==t.body&&(s.resizeHandler=s.resizeHandlerAlt,s.usePixelPosition=!0),s.resizeHandler(),s.usePositionFixed=s.usePositionFixed&&!a&&!s.flakeBottom,e.getComputedStyle)try{y="relative"===e.getComputedStyle(s.targetElement,null).getPropertyValue("position")}catch(e){y=!1}p=s.usePositionFixed,r&&m&&!s.disabled&&(s.sinit(),s.active=!0)},s.autoStart&&s.events.add(e,"load",(function t(){s.excludeMobile&&l||F(),s.events.remove(e,"load",t)}),!1),this}(window,document);