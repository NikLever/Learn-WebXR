import { Mesh, Vector3 } from "./three/three.module.js";

class RotationalConstraint{
    constructor( mesh, options = { axis:'x', min: 0, max: Math.PI, returnSpeed: 0.1 } ){
        this.mesh = mesh;
        this.axis = options.axis;
        this.min = options.min;
        this.max = options.max;
        this.maxReturn = options.max * 0.9;
        this.quaternion = this.mesh.quaternion.clone();
        this.position = new Vector3();
        this.mesh.getWorldPosition( this.position );
        this.position.x = 0;
        this.vec3 = new Vector3();
        this.direction = new Vector3( 0, 0, 1);
        this.reset = false;
    }
    
    set target( obj ){
        this._target = obj;
        if (!obj){
            let reset = true;
            if (this.max > this.min){
                if (this.mesh.rotation.x > this.maxReturn) reset = false;
            }else{
                if (this.mesh.rotation.x < this.maxReturn) reset = false;
            }
            this.reset = true;
        }else{
            this.initialAngle = this.currentAngle; 
        }
    }
    
    get currentAngle(){
        this._target.getWorldPosition( this.vec3 );
        this.vec3.x = 0;
        this.vec3.sub( this.position );
        this.vec3.normalize();
        return this.vec3.angleTo( this.direction );
    }
    
    get target(){
        return this._target;
    }
    
    update(){
        if ( this._target ){
            const theta = this.initialAngle - this.currentAngle + this.min;
            //console.log( `min:${this.min.toFixed(3)} max:${this.max.toFixed(3)} theta:${theta.toFixed(3)}`);
            this.mesh.rotation.x = theta;
            if ( this.mesh.rotation.x > this.max) this.mesh.rotation.x = this.max;
            if ( this.mesh.rotation.x > this.min) this.mesh.rotation.x = this.min;
        }else if (this.reset){
            this.mesh.quaternion.slerp( this.quaternion, 0.1 );
        }
    }
}

export { RotationalConstraint };