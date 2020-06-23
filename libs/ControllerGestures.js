import * as THREE from './three/three.module.js';

class ControllerGestures extends THREE.EventDispatcher{
    constructor( renderer ){
        super();
        
        if (renderer === undefined){
            console.error('ControllerGestures must be passed a renderer');
            return;
        }
        
        const clock = new THREE.Clock();
        
        this.controller1 = renderer.xr.getController(0);
        this.controller1.userData.gestures = {};
        this.controller1.addEventListener( 'selectstart', onSelectStart );
        this.controller1.addEventListener( 'selectend', onSelectEnd );
        
        this.controller2 = renderer.xr.getController(1);
        this.controller2.userData.gestures = {};
        this.controller2.addEventListener( 'selectstart', onSelectStart );
        this.controller2.addEventListener( 'selectend', onSelectEnd );
        
        this.doubleClickLimit = 0.2;
        this.pressMinimum = 0.4;
        
        this.type = 'unknown';
        this.touchCount = 0;
        
        this.clock = clock;
        
        const self = this;
        
        function onSelectStart( ){
            const data = this.userData.gestures;
            
            data.startPosition = this.position.clone();
            data.startTime = clock.getElapsedTime();
            
            if ( self.type.indexOf('tap') == -1) data.taps = 0;
            
            self.type = 'unknown';
            data.selectPressed = true;
            
            self.touchCount++;
        }
        
        function onSelectEnd( ){
            const data = this.userData.gestures;
            
            data.endTime = clock.getElapsedTime();
            const startToEnd = data.endTime - data.startTime;
            
            //console.log(`ControllerGestures.onSelectEnd: startToEnd:${startToEnd.toFixed(2)} taps:${data.taps}`);
        
            if (self.type === 'swipe'){
                const direction = (self.controller1.position.y > data.startPosition.y) ? 'UP' : 'DOWN';
                self.dispatchEvent( { type:'swipe', direction } );
            }else if (self.type !== "pinch" && self.type !== "rotate" ){
                if ( startToEnd < self.doubleClickLimit ){
                    self.type = "tap";
                    data.taps++;
                }else if ( startToEnd > self.pressMinimum ){
                    self.type = 'press';
                    self.dispatchEvent( 'press' );
                }
            }
            
            data.selectPressed = false;
            
            self.touchCount--;
        }
    }
    
    get debugMsg(){
        return this.type;
    }
    
    update(){
        const data1 = this.controller1.userData.gestures;
        const data2 = this.controller2.userData.gestures;
        
        if (!data1.selectPressed && this.type === 'tap' ){
            const elapsedTime = this.clock.getElapsedTime() - data1.endTime;
            if (elapsedTime > this.doubleClickLimit){
                //console.log( `ControllerGestures.update dispatchEvent taps:${data1.taps}` );
                switch( data1.taps ){
                    case 1:
                        this.dispatchEvent( { type: 'tap' } );
                        break;
                    case 2:
                        this.dispatchEvent( { type: 'doubletap' });
                        break;
                    case 3:
                        this.dispatchEvent( { type: 'tripletap' } );
                        break;
                    case 4:
                        this.dispatchEvent( { type: 'quadtap' } );
                        break;
                }
                this.type = "unknown";
                data1.taps = 0;
            }
        }
        
        if (this.type === 'unknown'){
            if (data1.selectPressed && data2.selectPressed ){
                const startDistance = data1.startPosition.distanceTo( data2.startPosition );
                const currentDistance = this.controller1.position.distanceTo( this.controller2.position );
                const delta = currentDistance - startDistance;
                if ( Math.abs(delta) > 0.01 ){
                    this.type = 'pinch';
                }else{
                    const v1 = data2.startPosition.clone().sub( data1.startPosition ).normalize();
                    const v2 = this.controller2.position.clone().sub( this.controller1.position ).normalize();
                    const theta = v1.angleTo( v2 );
                    if (Math.abs(theta) > 0.2){
                        this.type = 'rotate';
                    }
                }
            }else if (data1.selectPressed){
                const dist = this.controller1.position.y - data1.startPosition.y;
                if (Math.abs(dist)> 0.01) this.type = "swipe";
            }
        }else if (this.type === 'pinch'){
            const startDistance = data1.startPosition.distanceTo( data2.startPosition );
            const currentDistance = this.controller1.position.distanceTo( this.controller2.position );
            const delta = currentDistance - startDistance;
            this.dispatchEvent( { type: 'pinch', delta });
        }else if (this.type === 'rotate'){
            const v1 = data2.startPosition.clone().sub( data1.startPosition ).normalize();
            const v2 = this.controller2.position.clone().sub( this.controller1.position ).normalize();
            const theta = v1.angleTo( v2 );
            this.dispatchEvent( { type: 'rotate', theta } );
        }
    }
}

export { ControllerGestures };