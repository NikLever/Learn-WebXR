
import * as THREE from '../../../libs/three/three.module.js';
import { GLTFLoader } from '../../../libs/three/jsm/GLTFLoader.js';
import { LoadingBar } from '../../../libs/LoadingBar.js';
import { JoyStick } from '../../../libs/JoyStick.js';
import { Stats } from '../../../libs/stats.module.js';

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );

		this.assetsPath = '../../../assets/';
        
		this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.5, 500 );
		this.camera.position.set( 0, 1.5, 10 );
        
        this.dolly = new THREE.Object3D(  );
        this.dolly.position.set(0, 0, 10);
        
		this.scene = new THREE.Scene();
        this.scene.add( this.dolly );
        
		const ambient = new THREE.HemisphereLight(0xFFFFFF, 0xAAAAAA, 1.2);
		this.scene.add(ambient);
			
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		container.appendChild( this.renderer.domElement );

		this.stats = new Stats();
		container.appendChild( this.stats.dom );
		
        window.addEventListener( 'resize', this.resize.bind(this) );
        
        this.clock = new THREE.Clock();
        this.up = new THREE.Vector3(0,1,0);
        this.origin = new THREE.Vector3();
        
        this.raycaster = new THREE.Raycaster();
			
    	this.mouse = { x:0, y:0 };
        
		this.loadingBar = new LoadingBar();
		
		this.loadCollege();
	}
	
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }
    
    raycast( e ){
        if (this.loading) return;

        this.mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
        this.mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;

        //2. set the picking ray from the camera position and mouse coordinates
        this.raycaster.setFromCamera( this.mouse, this.camera );    

        //3. compute intersections
        const intersects = this.raycaster.intersectObject( this.proxy );

        if (intersects.length>0){
            const pt = intersects[0].point;

        }	
    }
    
	loadCollege(){
        
		const loader = new GLTFLoader( ).setPath(this.assetsPath);
        const self = this;
		
		// Load a glTF resource
		loader.load(
			// resource URL
			'college.glb',
			// called when the resource is loaded
			function ( gltf ) {

                const college = gltf.scene.children[2];
				self.scene.add( college );
				
				college.traverse(function (child) {
    				if (child.isMesh){
						if (child.name.indexOf("PROXY")!=-1){
							child.material.visible = false;
							self.proxy = child;
						}else if (child.material.name.indexOf('Glass')!=-1){
                            child.visible = false;
                        }else if (child.material.name.indexOf("SkyBox")!=-1){
                            const mat1 = child.material;
                            const mat2 = new THREE.MeshBasicMaterial({map: mat1.map});
                            child.material = mat2;
                            mat1.dispose();
                        }else{
                           child.material.metalness = 0;  
                        }
					}
				});
                        
                self.loadingBar.visible = false;
                
                self.move = { forward:0, turn: 0 };
                
                self.joystick = new JoyStick({
                    app: self,
                    onMove: self.onMove
                })
			
				self.renderer.setAnimationLoop( self.render.bind(self) );
			},
			// called while loading is progressing
			function ( xhr ) {

				self.loadingBar.progress = (xhr.loaded / xhr.total);
				
			},
			// called when loading has errors
			function ( error ) {

				console.log( 'An error happened' );

			}
		);
	}
    
    moveDolly(dt){
        if (this.proxy === undefined) return;
        
        const wallLimit = 1.3;
        const speed = 6;
		let pos = this.dolly.position.clone();
        pos.y += 1;
        
		let dir = new THREE.Vector3();
		this.dolly.getWorldDirection(dir);
		if (this.move.forward<0) dir.negate();
		this.raycaster.set(pos, dir);
		
        let blocked = false;
		
		let intersect = this.raycaster.intersectObject(this.proxy);
        if (intersect.length>0){
            if (intersect[0].distance < wallLimit) blocked = true;
        }
		
		if (!blocked){
            const delta = (this.move.forward>0) ? dt*this.move.forward*speed : dt*this.move.forward*speed*0.3;
            //console.log(`Moving ${delta.toFixed(2)}:${this.dolly.position.x.toFixed(2)}, ${this.dolly.position.z.toFixed(2)}`);
            this.dolly.translateZ(delta);
            pos = this.dolly.getWorldPosition( this.origin );
		}
		
        //cast left
        dir.set(-1,0,0);
        dir.applyMatrix4(this.dolly.matrix);
        dir.normalize();
        this.raycaster.set(pos, dir);

        intersect = this.raycaster.intersectObject(this.proxy);
        if (intersect.length>0){
            if (intersect[0].distance<wallLimit) this.dolly.translateX(wallLimit-intersect[0].distance);
        }

        //cast right
        dir.set(1,0,0);
        dir.applyMatrix4(this.dolly.matrix);
        dir.normalize();
        this.raycaster.set(pos, dir);

        intersect = this.raycaster.intersectObject(this.proxy);
        if (intersect.length>0){
            if (intersect[0].distance<wallLimit) this.dolly.translateX(intersect[0].distance-wallLimit);
        }

        //cast down
        dir.set(0,-1,0);
        pos.y += 1.5;
        this.raycaster.set(pos, dir);
        
        intersect = this.raycaster.intersectObject(this.proxy);
        if (intersect.length>0){
            this.dolly.position.copy( intersect[0].point );
        }
	}
    
    onMove( forward, turn ){
        this.move.forward = -forward;
        this.move.turn = (Math.abs(turn)<0.2) ? 0 : -turn;
    }
		
	render(){
        const dt = this.clock.getDelta();
        if (this.move.turn!==0){
            this.dolly.rotateOnWorldAxis( this.up, this.move.turn * dt );
        }
        if (this.move.forward !== 0){
            //Use the raycasting to get a safe place to move to. 
            this.moveDolly(dt);
        }
        const pos = this.dolly.getWorldPosition(this.origin);
        pos.y += 1.5;
        
        this.camera.position.lerp(pos, 0.1);
        this.camera.quaternion.slerp(this.dolly.quaternion, 0.1);
        this.stats.update();
		this.renderer.render(this.scene, this.camera);
	}
}

export { App };
