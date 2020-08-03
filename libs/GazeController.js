import { Clock, Vector3, Matrix4 } from "./three/three.module.js";
import { RingProgressMesh } from './RingProgressMesh.js';

class GazeController{
    static Modes = { HIDDEN:1, GAZING:2, MOVE:3 };

    constructor( scene, camera ){
        if ( scene === undefined ){
            console.warn( 'GazeController needs a THREE.Scene instance passing to the constructor');
            return;
        }
        if ( camera === undefined ){
            console.warn( 'GazeController needs a THREE.Camera instance passing to the constructor');
            return;
        }
        this.clock = new Clock();
        this.ring = new RingProgressMesh( 0.2 );
        this.ring.visible = false;
        this.direction = new Vector3();
        this.tmpPos = new Vector3();
        this.vec3 = new Vector3();
        this.mat4 = new Matrix4();
        this.camera = camera;
        this.mode = GazeController.Modes.HIDDEN;
        this.ring.position.set(0, 0, -1);
        this.ring.lookAt( this.camera.position );
        camera.add( this.ring ); 
    }
    
    set mode( value ){
        this.modeTime = this.clock.getElapsedTime();
        this.mat4.identity().extractRotation( this.camera.matrixWorld );
        this.direction.set(0,0,-1).applyMatrix4( this.mat4 );
        this._mode = value;
    }

    get mode(){
        return this._mode;
    }

    update(){
        const elapsedTime = this.clock.getElapsedTime() - this.modeTime;
        this.mat4.identity().extractRotation( this.camera.matrixWorld );
        this.vec3.set(0,0,-1).applyMatrix4( this.mat4 );
        const theta = this.vec3.angleTo( this.direction );
        //console.log(`GazeController.update: mode:${this._mode} elapsedTime=${elapsedTime.toFixed(2)} theta:${theta.toFixed(2)}`);
        switch(this._mode){
            case GazeController.Modes.HIDDEN:
                if (elapsedTime>1){
                    this.mode = GazeController.Modes.GAZING;
                    this.ring.visible = true;
                }else if (theta > 0.2 ){
                    //Reset direction and time
                    this.mode = GazeController.Modes.HIDDEN;
                }
                break;
            case GazeController.Modes.GAZING:
                if (elapsedTime>1){
                    this.mode = GazeController.Modes.MOVE;
                    this.ring.visible = false;
                }else if ( theta > 0.2 ){
                    //Reset direction and time
                    this.mode = GazeController.Modes.HIDDEN;
                    this.ring.visible = false;
                }else{
                    this.ring.progress = elapsedTime;
                }
                break;
            case GazeController.Modes.MOVE:
                if ( theta > 0.2 ){
                    //Reset direction and time
                    this.mode = GazeController.Modes.HIDDEN;
                    this.ring.visible = false;
                }
                break;
                
        }
    }
}

export { GazeController };