import * as THREE from 'three/three.module.js';

class ControllerGestures extends THREE.EventDispatcher{
    constructor( renderer ){
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
        
        function onSelectStart( ){
            const data = this.userData.gestures;
            
            data.startPosition = this.position.clone();
            data.startTime = clock.getElapsedTime();
            
            if ( data.type.indexOf('tap') != -1) data.taps = 0;
            
            data.type = 'unknown';
            data.selectPressed = true;
        }
        
        function onSelectEnd( ){
            const data = this.userData.gestures;
            
            data.endTime = clock.getElapsedTime();
            const startToEnd = data.endTime - data.startTime;
        
            if (data.type === 'unknown'){
                if ( startToEnd < 0.2 ){
                    switch (data.taps){
                        case 0:
                            data.type = 'tap';
                            break;
                        case 1:
                            data.type = 'doubletap';
                            break;
                        case 2:
                            data.type = 'tripletap';
                            break;
                        case 3:
                            data.type = 'quadtap';
                            break;
                        default:
                            data.type = 'unknown';
                            break;
                    }
                    data.taps++;
                }else if ( startToEnd > 0.5){
                    data.type = 'press';
                }
            }else if (data.type === 'swipe'){
                const direction = (this.controller1.position.y > data.startPosition.y) ? 'UP' : 'DOWN';
                this.dispatchEvent( 'swipe', { direction }) );
            }
        }
    }
    
    update(){
        
    }
}