
import * as THREE from '../../../libs/three/three.module.js';
import { GLTFLoader } from '../../../libs/three/jsm/GLTFLoader.js';
import { LoadingBar } from '../../../libs/LoadingBar.js';
import { VRButton } from '../../../libs/three/jsm/VRButton.js';
import { XRControllerModelFactory } from '../../../libs/three/jsm/XRControllerModelFactory.js';
import { Stats } from '../../../libs/stats.module.js';

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );

		this.assetsPath = '../../../assets/';
        
		this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.01, 500 );
		this.camera.position.set( 0, 1.6, 0 );
        
        this.dolly = new THREE.Object3D(  );
        this.dolly.position.set(0, 0, 10);
        this.dolly.add( this.camera );
        this.dummyCam = new THREE.Object3D();
        this.camera.add( this.dummyCam );
        
		this.scene = new THREE.Scene();
        this.scene.add( this.dolly );
        
		const ambient = new THREE.HemisphereLight(0xFFFFFF, 0xAAAAAA, 1.2);
		this.scene.add(ambient);
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
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
        
		this.loadingBar = new LoadingBar();
		
		this.loadCollege();
	}
	
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
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
			
                self.setupVR();
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
    
    setupVR(){
        this.renderer.xr.enabled = true;

        const self = this;
        
        document.body.appendChild( VRButton.createButton( this.renderer ) );
        
        // controller
        this.controller = this.renderer.xr.getController( 0 );
        this.controller.addEventListener( 'selectstart', this.onSelectStart.bind(this) );
        this.controller.addEventListener( 'selectend', this.onSelectEnd.bind(this) );
        this.dolly.add( this.controller );

        const controllerModelFactory = new XRControllerModelFactory();

        this.controllerGrip = this.renderer.xr.getControllerGrip( 0 );
        this.controllerGrip.add( controllerModelFactory.createControllerModel( this.controllerGrip ) );
        this.dolly.add( this.controllerGrip );
        
        //
        const geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );

        const line = new THREE.Line( geometry );
        line.name = 'line';
		line.scale.z = 0;

        this.controller.add( line.clone() );
        
        this.selectPressed = false;
        
        this.renderer.setAnimationLoop( this.render.bind(this) );
    }
    
    onSelectStart( event ) {
        
        this.selectPressed = true;
        
    }

    onSelectEnd( event ) {
        
        this.selectPressed = false;
        
    }
    
    moveDolly(dt){
        if (this.proxy === undefined) return;
        
        const wallLimit = 1.3;
        const speed = 2;
		let pos = this.dolly.position.clone();
        pos.y += 1;
        
		let dir = new THREE.Vector3();
        //Store original dolly rotation
        const quaternion = this.dolly.quaternion.clone();
        //Get rotation for movement from the headset pose
        this.dolly.quaternion.copy( this.dummyCam.getWorldQuaternion() );
		this.dolly.getWorldDirection(dir);
        dir.negate();
		this.raycaster.set(pos, dir);
		
        let blocked = false;
		
		let intersect = this.raycaster.intersectObject(this.proxy);
        if (intersect.length>0){
            if (intersect[0].distance < wallLimit) blocked = true;
        }
		
		if (!blocked){
            this.dolly.translateZ(-dt*speed);
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

        //Restore the original rotation
        this.dolly.quaternion.copy( quaternion );
	}
		
	render( timestamp, frame ){
        const dt = this.clock.getDelta();
        
        if (this.renderer.xr.isPresenting && this.selectPressed){
            this.moveDolly(dt);
        }
        
        this.stats.update();
		this.renderer.render(this.scene, this.camera);
	}
}

export { App };
