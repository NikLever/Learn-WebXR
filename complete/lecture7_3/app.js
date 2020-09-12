import { ARButton } from './ARButton.js';


class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
        
        this.clock = new THREE.Clock();
        
		this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );
		
		this.scene = new THREE.Scene();
        
        this.scene.add ( this.camera );
       
		this.scene.add( new THREE.HemisphereLight( 0x606060, 0x404040 ) );

        const light = new THREE.DirectionalLight( 0xffffff );
        light.position.set( 1, 1, 1 ).normalize();
		this.scene.add( light );
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        
		container.appendChild( this.renderer.domElement );
        
        this.tmpVec3 = new THREE.Vector3();
        this.tmpQuat = new THREE.Quaternion();
        this.tmpMat4 = new THREE.Matrix4();
        
        this.initGame();
        this.setupXR();
        
        window.addEventListener('resize', this.resize.bind(this) );
	}	
    
    initGame(){
        this.geometry = new THREE.SphereBufferGeometry( 0.04, 12, 20 );
        this.material = new THREE.MeshStandardMaterial( { side: THREE.DoubleSide, color: 0x0000FF });
        this.spheres = [];
        for(let i=0; i<=2; i++){
            const sphere = new THREE.Mesh( this.geometry, this.material );
            sphere.position.set( (i-1)*0.1, 0, -0.5 );
            this.scene.add(sphere);
            this.spheres.push(sphere);
        }
    }
    
    setupXR(){
        this.renderer.xr.enabled = true; 
        
        const self = this;

        const btn = new ARButton( this.renderer, { sessionInit: { optionalFeatures: [ 'dom-overlay' ], domOverlay: { root: document.body } } } ); 
        
        const controller = this.renderer.xr.getController( 0 );
        
        this.scene.add( controller );
        this.controller = controller;
        
        this.renderer.setAnimationLoop( this.render.bind(this) );
    }
    
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }
    
	render( ) {   
        const dt = this.clock.getDelta();
       
        if (this.renderer.xr.isPresenting){
        
        }
        
        this.renderer.render( this.scene, this.camera );
    }
}

export { App };