
import * as THREE from '../../../libs/three/three.module.js';
import { GLTFLoader } from '../../../libs/three/jsm/GLTFLoader.js';
import { OrbitControls } from '../../../libs/three/jsm/OrbitControls.js';
import { LoadingBar } from '../../../libs/LoadingBar.js';
import { Stats } from '../../../libs/stats.module.js';

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );

		this.assetsPath = '../../../assets/';
        
		this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 500 );
		this.camera.position.set( 0, 2, 10 );

		this.scene = new THREE.Scene();

		const ambient = new THREE.HemisphereLight(0xFFFFFF, 0xAAAAAA, 1.2);
		this.scene.add(ambient);
			
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		container.appendChild( this.renderer.domElement );
		
		this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls.target.set(0, 1.3, 8);

		this.stats = new Stats();
		container.appendChild( this.stats.dom );
		
        window.addEventListener( 'resize', this.resize.bind(this) );
        
        const raycaster = new THREE.Raycaster();
			
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
                        }
					}
				});
                        
                self.loadingBar.visible = false;
			
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
		
	render(){
        this.stats.update();
		this.renderer.render(this.scene, this.camera);
	}
}

export { App };
