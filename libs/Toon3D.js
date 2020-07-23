class Easing{
	// t: current time, b: begInnIng value, c: change In value, d: duration
	constructor(start, end, duration, startTime=0, type='linear'){
		this.b = start;
		this.c = end - start;
		this.d = duration;
		this.type = type;
		this.startTime = startTime;
	}
	
	value(time){
		this.t = time - this.startTime;
		return this[this.type]();
	}
	
	linear(){
		return this.c*(this.t/this.d) + this.b;	
	}
	
	inQuad() {
		return this.c*(this.t/=this.d)*this.t + this.b;
	}
	
	outQuad() {
		return -this.c*(this.t/=this.d)*(this.t-2) + this.b;
	}
	
	inOutQuad() {
		if ((this.t/=this.d/2) < 1) return this.c/2*this.t*this.t + this.b;
		return -this.c/2 * ((--this.t)*(this.t-2) - 1) + this.b;
	}
	
	projectile(){
		let c = this.c;
		let b = this.b;
		let t = this.t;
		this.t *= 2;
		let result;
		let func;
		if (this.t<this.d){
			result = this.outQuad();
			func = "outQuad";
		}else{
			this.t -= this.d;
			this.b += c;
			this.c = -c;
			result = this.inQuad();
			func = "inQuad";
		}
		console.log("projectile: " + result.toFixed(2) + " time:" + this.t.toFixed(2) + " func:" + func);
		this.b = b;
		this.c = c;
		this.t = t;
		return result;
	}
	
	inCubic() {
		return this.c*(this.t/=this.d)*this.t*this.t + this.b;
	}
	
	outCubic() {
		return this.c*((this.t=this.t/this.d-1)*this.t*this.t + 1) + this.b;
	}
	
	inOutCubic() {
		if ((this.t/=this.d/2) < 1) return this.c/2*this.t*this.t*this.t + this.b;
		return this.c/2*((this.t-=2)*this.t*this.t + 2) + this.b;
	}
	
	inQuart() {
		return this.c*(this.t/=this.d)*this.t*this.t*this.t + this.b;
	}
	
	outQuart() {
		return -this.c * ((this.t=this.t/this.d-1)*this.t*this.t*this.t - 1) + this.b;
	}
	
	inOutQuart() {
		if ((this.t/=this.d/2) < 1) return this.c/2*this.t*this.t*this.t*this.t + this.b;
		return -this.c/2 * ((this.t-=2)*this.t*this.t*this.t - 2) + this.b;
	}
	
	inQuint() {
		return this.c*(this.t/=this.d)*this.t*this.t*this.t*this.t + this.b;
	}
	
	outQuint() {
		return this.c*((this.t=this.t/this.d-1)*this.t*this.t*this.t*this.t + 1) + this.b;
	}
	
	inOutQuint() {
		if ((this.t/=this.d/2) < 1) return this.c/2*this.t*this.t*this.t*this.t*this.t + this.b;
		return this.c/2*((this.t-=2)*this.t*this.t*this.t*this.t + 2) + this.b;
	}
	
	inSine() {
		return -this.c * Math.cos(this.t/this.d * (Math.PI/2)) + this.c + this.b;
	}
	
	outSine() {
		return this.c * Math.sin(this.t/this.d * (Math.PI/2)) + this.b;
	}
	
	inOutSine() {
		return -this.c/2 * (Math.cos(Math.PI*this.t/this.d) - 1) + this.b;
	}
	
	inExpo() {
		return (this.t==0) ? this.b : this.c * Math.pow(2, 10 * (this.t/this.d - 1)) + this.b;
	}
	
	outExpo() {
		return (this.t==this.d) ? this.b+this.c : this.c * (-Math.pow(2, -10 * this.t/this.d) + 1) + this.b;
	}
	
	inOutExpo() {
		if (this.t==0) return this.b;
		if (this.t==this.d) return this.b+this.c;
		if ((this.t/=this.d/2) < 1) return this.c/2 * Math.pow(2, 10 * (this.t - 1)) + this.b;
		return this.c/2 * (-Math.pow(2, -10 * --this.t) + 2) + this.b;
	}
	
	inCirc() {
		return -this.c * (Math.sqrt(1 - (this.t/=this.d)*this.t) - 1) + this.b;
	}
	
	outCirc() {
		return this.c * Math.sqrt(1 - (this.t=this.t/this.d-1)*this.t) + this.b;
	}
	
	inOutCirc() {
		if ((this.t/=this.d/2) < 1) return -this.c/2 * (Math.sqrt(1 - this.t*this.t) - 1) + this.b;
		return this.c/2 * (Math.sqrt(1 - (this.t-=2)*this.t) + 1) + this.b;
	}
	
	inElastic() {
		let s=1.70158, p=0, a=this.c;
		if (this.t==0) return this.b;  if ((this.t/=this.d)==1) return this.b+this.c;  if (!p) p=this.d*.3;
		if (a < Math.abs(this.c)) { a=this.c; let s=p/4; }
		else{ let s = p/(2*Math.PI) * Math.asin (this.c/a) };
		return -(a*Math.pow(2,10*(this.t-=1)) * Math.sin( (this.t*this.d-s)*(2*Math.PI)/p )) + this.b;
	}
	
	outElastic() {
		let s=1.70158, p=0, a=this.c;
		if (this.t==0) return this.b;  if ((this.t/=this.d)==1) return this.b+this.c;  if (!p) p=this.d*.3;
		if (a < Math.abs(this.c)) { a=this.c; let s=p/4; }
		else{ let s = p/(2*Math.PI) * Math.asin (this.c/a) };
		return a*Math.pow(2,-10*this.t) * Math.sin( (this.t*this.d-s)*(2*Math.PI)/p ) + this.c + this.b;
	}
	
	inOutElastic() {
		let s=1.70158, p=0, a=this.c;
		if (this.t==0) return this.b;  if ((this.t/=this.d/2)==2) return this.b+this.c;  if (!p) p=this.d*(.3*1.5);
		if (a < Math.abs(this.c)) { a=this.c; let s=p/4; }
		else{ let s = p/(2*Math.PI) * Math.asin (this.c/a) };
		if (this.t < 1) return -.5*(a*Math.pow(2,10*(this.t-=1)) * Math.sin( (this.t*this.d-s)*(2*Math.PI)/p )) + this.b;
		return a*Math.pow(2,-10*(this.t-=1)) * Math.sin( (this.t*this.d-s)*(2*Math.PI)/p )*.5 + this.c + this.b;
	}
	
	inBack() {
		let s = 1.70158;
		return this.c*(this.t/=this.d)*this.t*((s+1)*this.t - s) + this.b;
	}
	
	outBack() {
		let s = 1.70158;
		return this.c*((this.t=this.t/this.d-1)*this.t*((s+1)*this.t + s) + 1) + this.b;
	}
	
	inOutBack() {
		let s = 1.70158; 
		if ((this.t/=this.d/2) < 1) return this.c/2*(this.t*this.t*(((s*=(1.525))+1)*this.t - s)) + this.b;
		return this.c/2*((this.t-=2)*this.t*(((s*=(1.525))+1)*this.t + s) + 2) + this.b;
	}
	
	inBounce(t=this.t, b=this.b) {
		return this.c - this.outBounce (this.d-t, 0) + b;
	}
	
	outBounce(t=this.t, b=this.b) {
		if ((t/=this.d) < (1/2.75)) {
			return this.c*(7.5625*t*t) + b;
		} else if (t < (2/2.75)) {
			return this.c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
		} else if (t < (2.5/2.75)) {
			return this.c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
		} else {
			return this.c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
		}
	}
	
	inOutBounce() {
		if (this.t < this.d/2) return this.inBounce (this.t*2, 0) * .5 + this.b;
		return this.outBounce (this.t*2-this.d, 0) * .5 + this.c*.5 + this.b;
	}
}

class Tween{
	constructor(target, channel, endValue, duration, oncomplete, easing="inOutQuad"){
		this.target = target;
		this.channel = channel;
		this.oncomplete = oncomplete;
		this.endValue = endValue;
		this.duration = duration;
		this.currentTime = 0;
		this.finished = false;
		//constructor(start, end, duration, startTime=0, type='linear')
		this.easing = new Easing(target[channel], endValue, duration, 0, easing); 
	}
	
	update(dt){
		if (this.finished) return;
		this.currentTime += dt;
		if (this.currentTime>=this.duration){
			this.target[this.channel] = this.endValue;
			if (this.oncomplete) this.oncomplete();
			this.finished = true;
		}else{
			this.target[this.channel] = this.easing.value(this.currentTime);
		}
	}
}

class SFX{
	constructor(options){
		this.context = options.context;
		const volume = (options.volume!=undefined) ? options.volume : 1.0;
		this.gainNode = this.context.createGain();
		this.gainNode.gain.setValueAtTime(volume, this.context.currentTime);
		this.gainNode.connect(this.context.destination);
		this._loop = (options.loop==undefined) ? false : options.loop;
		this.fadeDuration = (options.fadeDuration==undefined) ? 0.5 : options.fadeDuration;
		this.autoplay = (options.autoplay==undefined) ? false : options.autoplay;
		this.buffer = null;
		
		let codec;
		for(let prop in options.src){
			if (SFX.supportsAudioType(prop)){
				codec = prop;
				break;
			}
		}
		
		if (codec!=undefined){
			this.url = options.src[codec];
			this.load(this.url);
		}else{
			console.warn("Browser does not support any of the supplied audio files");
		}
	}
	
	static supportsAudioType(type) {
		let audio;

		// Allow user to create shortcuts, i.e. just "mp3"
		let formats = {
			mp3: 'audio/mpeg',
			wav: 'audio/wav',
			aif: 'audio/x-aiff',
			ogg: 'audio/ogg'
		};

		if(!audio) audio = document.createElement('audio');

		return audio.canPlayType(formats[type] || type);
	}
	
	load(url) {
  		// Load buffer asynchronously
  		const request = new XMLHttpRequest();
  		request.open("GET", url, true);
  		request.responseType = "arraybuffer";

  		const sfx = this;

  		request.onload = function() {
			// Asynchronously decode the audio file data in request.response
    		sfx.context.decodeAudioData(
      			request.response,
      			function(buffer) {
					if (!buffer) {
						console.error('error decoding file data: ' + sfx.url);
						return;
					}
					sfx.buffer = buffer;
					if (sfx.autoplay) sfx.play();
				},
				function(error) {
					console.error('decodeAudioData error', error);
				}
    		);
  		}

  		request.onerror = function() {
    		console.error('SFX Loader: XHR error');
  		}

  		request.send();
	}
	
	set loop(value){
		this._loop = value;
		if (this.source!=undefined) this.source.loop = value;
	}
	
	play(){
		if (this.buffer==null) return; 
		if (this.source!=undefined) this.source.stop();
		this.source = this.context.createBufferSource();
		this.source.loop = this._loop;
	  	this.source.buffer = this.buffer;
	  	this.source.connect(this.gainNode);
		this.source.start(0);
	}
	
	set volume(value){
		this._volume = value;
		this.gainNode.gain.setTargetAtTime(value, this.context.currentTime + this.fadeDuration, 0);
	}
	
	pause(){
		if (this.source==undefined) return;
		this.source.stop();
	}
	
	stop(){
		if (this.source==undefined) return;
		this.source.stop();
		delete this.source;
	}
}

class JoyStick{
	constructor(options){
		const circle = document.createElement("div");
		circle.style.cssText = "position:absolute; bottom:35px; width:80px; height:80px; background:rgba(126, 126, 126, 0.5); border:#444 solid medium; border-radius:50%; left:50%; transform:translateX(-50%);";
		const thumb = document.createElement("div");
		thumb.style.cssText = "position: absolute; left: 20px; top: 20px; width: 40px; height: 40px; border-radius: 50%; background: #fff;";
		circle.appendChild(thumb);
		document.body.appendChild(circle);
		this.domElement = thumb;
		this.maxRadius = options.maxRadius || 40;
		this.maxRadiusSquared = this.maxRadius * this.maxRadius;
		this.onMove = options.onMove;
		this.game = options.game;
		this.origin = { left:this.domElement.offsetLeft, top:this.domElement.offsetTop };
		this.rotationDamping = options.rotationDamping || 0.06;
		this.moveDamping = options.moveDamping || 0.01;
		if (this.domElement!=undefined){
			const joystick = this;
			if ('ontouchstart' in window){
				this.domElement.addEventListener('touchstart', function(evt){ evt.preventDefault(); joystick.tap(evt); evt.stopPropagation();});
			}else{
				this.domElement.addEventListener('mousedown', function(evt){ evt.preventDefault(); joystick.tap(evt); evt.stopPropagation();});
			}
		}
	}
	
	getMousePosition(evt){
		let clientX = evt.targetTouches ? evt.targetTouches[0].pageX : evt.clientX;
		let clientY = evt.targetTouches ? evt.targetTouches[0].pageY : evt.clientY;
		return { x:clientX, y:clientY };
	}
	
	tap(evt){
		evt = evt || window.event;
		// get the mouse cursor position at startup:
		this.offset = this.getMousePosition(evt);
		const joystick = this;
		if ('ontouchstart' in window){
			document.ontouchmove = function(evt){ evt.preventDefault(); joystick.move(evt); };
			document.ontouchend =  function(evt){ evt.preventDefault(); joystick.up(evt); };
		}else{
			document.onmousemove = function(evt){ evt.preventDefault(); joystick.move(evt); };
			document.onmouseup = function(evt){ evt.preventDefault(); joystick.up(evt); };
		}
	}
	
	move(evt){
		evt = evt || window.event;
		const mouse = this.getMousePosition(evt);
		// calculate the new cursor position:
		let left = mouse.x - this.offset.x;
		let top = mouse.y - this.offset.y;
		//this.offset = mouse;
		
		const sqMag = left*left + top*top;
		if (sqMag>this.maxRadiusSquared){
			//Only use sqrt if essential
			const magnitude = Math.sqrt(sqMag);
			left /= magnitude;
			top /= magnitude;
			left *= this.maxRadius;
			top *= this.maxRadius;
		}
		// set the element's new position:
		this.domElement.style.top = `${top + this.domElement.clientHeight/2}px`;
		this.domElement.style.left = `${left + this.domElement.clientWidth/2}px`;
		
		const forward = -(top - this.origin.top + this.domElement.clientHeight/2)/this.maxRadius;
		const turn = (left - this.origin.left + this.domElement.clientWidth/2)/this.maxRadius;
		
		if (this.onMove!=undefined){
            if (this.game===undefined){
                this.onMove(forward, turn);
            }else{
                this.onMove.call(this.game, forward, turn);
            }
        }
	}
	
	up(evt){
		if ('ontouchstart' in window){
			document.ontouchmove = null;
			document.touchend = null;
		}else{
			document.onmousemove = null;
			document.onmouseup = null;
		}
		this.domElement.style.top = `${this.origin.top}px`;
		this.domElement.style.left = `${this.origin.left}px`;
		
		this.onMove.call(this.game, 0, 0);
	}
}

class Preloader{
	constructor(options){
		this.assets = {};
		for(let asset of options.assets){
			this.assets[asset] = { loaded:0, complete:false };
			this.load(asset);
		}
		this.container = options.container;
		
		if (options.onprogress==undefined){
			this.onprogress = onprogress;
			this.domElement = document.createElement("div");
			this.domElement.style.position = 'absolute';
			this.domElement.style.top = '0';
			this.domElement.style.left = '0';
			this.domElement.style.width = '100%';
			this.domElement.style.height = '100%';
			this.domElement.style.background = '#000';
			this.domElement.style.opacity = '0.7';
			this.domElement.style.display = 'flex';
			this.domElement.style.alignItems = 'center';
			this.domElement.style.justifyContent = 'center';
			this.domElement.style.zIndex = '1111';
			const barBase = document.createElement("div");
			barBase.style.background = '#aaa';
			barBase.style.width = '50%';
			barBase.style.minWidth = '250px';
			barBase.style.borderRadius = '10px';
			barBase.style.height = '15px';
			this.domElement.appendChild(barBase);
			const bar = document.createElement("div");
			bar.style.background = '#2a2';
			bar.style.width = '50%';
			bar.style.borderRadius = '10px';
			bar.style.height = '100%';
			bar.style.width = '0';
			barBase.appendChild(bar);
			this.progressBar = bar;
			if (this.container!=undefined){
				this.container.appendChild(this.domElement);
			}else{
				document.body.appendChild(this.domElement);
			}
		}else{
			this.onprogress = options.onprogress;
		}
		
		this.oncomplete = options.oncomplete;
		
		const loader = this;
		function onprogress(delta){
			const progress = delta*100;
			loader.progressBar.style.width = `${progress}%`;
		}
	}
	
	checkCompleted(){
		for(let prop in this.assets){
			const asset = this.assets[prop];
			if (!asset.complete) return false;
		}
		return true;
	}
	
	get progress(){
		let total = 0;
		let loaded = 0;
		
		for(let prop in this.assets){
			const asset = this.assets[prop];
			if (asset.total == undefined){
				loaded = 0;
				break;
			}
			loaded += asset.loaded; 
			total += asset.total;
		}
		
		return loaded/total;
	}
	
	load(url){
		const loader = this;
		var xobj = new XMLHttpRequest();
		xobj.overrideMimeType("application/json");
		xobj.open('GET', url, true); 
		xobj.onreadystatechange = function () {
			  if (xobj.readyState == 4 && xobj.status == "200") {
				  loader.assets[url].complete = true;
				  if (loader.checkCompleted()){
					  if (loader.domElement!=undefined){
						  if (loader.container!=undefined){
							  loader.container.removeChild(loader.domElement);
						  }else{
							  document.body.removeChild(loader.domElement);
						  }
					  }
					  loader.oncomplete();	
				  }
			  }
		};
		xobj.onprogress = function(e){
			const asset = loader.assets[url];
			asset.loaded = e.loaded;
			asset.total = e.total;
			loader.onprogress(loader.progress);
		}
		xobj.send(null);
	}
}

export { Easing, Preloader, JoyStick, SFX, Tween };