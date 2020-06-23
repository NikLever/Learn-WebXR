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
        
        this.type = 'unknown';
        this.touchCount = 0;
        
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
        
            if (self.type === 'unknown'){
                if ( startToEnd < 0.2 ){
                    switch (data.taps){
                        case 0:
                            self.type = 'tap';
                            this.dispatchEvent('tap');
                            break;
                        case 1:
                            self.type = 'doubletap';
                            this.dispatchEvent('doubletap');
                            break;
                        case 2:
                            self.type = 'tripletap';
                            this.dispatchEvent('tripletap');
                            break;
                        case 3:
                            self.type = 'quadtap';
                            this.dispatchEvent('quadtap');
                            break;
                        default:
                            self.type = 'unknown';
                            break;
                    }
                    data.taps++;
                }else if ( startToEnd > 0.5){
                    self.type = 'press';
                    this.dispatchEvent( 'press' );
                }
            }else if (data.type === 'swipe'){
                const direction = (this.controller1.position.y > data.startPosition.y) ? 'UP' : 'DOWN';
                this.dispatchEvent( 'swipe', { direction } );
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
        if (this.type === 'unknown'){
            if (data1.selectPressed && data2.selectPressed ){
                const startDistance = data1.startPosition.distanceTo( data2.startPosition );
                const currentDistance = this.controller1.position.distanceTo( this.controller2.position );
                const delta = currentDistance - startDistance;
                if ( Math.abs(delta) > 0.005 ){
                    this.type = 'pinch';
                }else{
                    const v1 = data2.startPosition.clone().sub( data1.startPosition ).normalize();
                    const v2 = this.controller2.position.clone().sub( this.controller1.position ).normalize();
                    const theta = v1.angleTo( v2 );
                    if (Math.abs(theta) > 0.1){
                        this.type = 'rotate';
                    }
                }
            }
        }else if (this.type === 'pinch'){
            const startDistance = data1.startPosition.distanceTo( data2.startPosition );
            const currentDistance = this.controller1.position.distanceTo( this.controller2.position );
            const delta = currentDistance - startDistance;
            this.dispatchEvent( 'pinch', { delta } );
        }else if (this.type === 'rotate'){
            const v1 = data2.startPosition.clone().sub( data1.startPosition ).normalize();
            const v2 = this.controller2.position.clone().sub( this.controller1.position ).normalize();
            const theta = v1.angleTo( v2 );
            this.dispatchEvent( 'rotate', { theta } );
        }
    }
}

export { ControllerGestures };