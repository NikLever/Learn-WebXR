import * as THREE from '../../libs/three/three.module.js';

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
                
		this.camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 100 );
		this.camera.position.set( 0, 0, 4 );
        
		this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0x505050 );
        this.scene.add( this.camera );
        
        const ambient = new THREE.HemisphereLight( 0xaaaaaa, 0x444444 );
        this.scene.add(ambient);
        
        const light = new THREE.DirectionalLight();
        light.position.set(1,1,1);
        this.scene.add(light);
        
        this.clock = new THREE.Clock();
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        
		container.appendChild( this.renderer.domElement );
        
        this.initScene();
        this.elapsedTime = 0;
        this.orders = [ 'XYZ', 'YZX' ];
        this.orderIndex = 0;
        this.euler = new THREE.Euler( Math.PI/2, Math.PI/3, Math.PI, 'XYZ' );
        this.quaternion = new THREE.Quaternion();
        this.quaternion.setFromEuler( this.euler );
        
        this.renderer.setAnimationLoop( this.render.bind(this) );
        
        window.addEventListener('resize', this.resize.bind(this) );
	}	
    
    initScene( ){
        const shape = new THREE.Shape();
        const w1 = 0.8;
        const w2 = 0.5;
        const h1 = 1;
        const h2 = 0.2;
        shape.moveTo( 0,h1 );
        shape.lineTo( -w1, h2 );
        shape.lineTo( -w2, h2 );
        shape.lineTo( -w2, -h1 );
        shape.lineTo( w2, -h1 );
        shape.lineTo( w2, h2 );
        shape.lineTo( w1, h2 );
        shape.lineTo( 0, h1 );

        const extrudeSettings = {
            steps: 1,
            depth: 0.5,
            bevelEnabled: false
        };

        const geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );
        const material = new THREE.MeshStandardMaterial( { color: 0x00ff00 } );
        this.arrow = new THREE.Mesh( geometry, material ) ;
        this.scene.add( this.arrow );
        
        const axesHelper = new THREE.AxesHelper( 2.5 );
        this.arrow.add( axesHelper );
    }
    
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }
    
	render( ) {  
        this.elapsedTime += this.clock.getDelta();
        if ( this.elapsedTime<2 ){
            this.arrow.quaternion.identity().slerp( this.quaternion, this.elapsedTime/2 );
        }else if (this.elapsedTime>3){
            this.orderIndex ++;
            if (this.orderIndex >= this.orders.length ) this.orderIndex = 0;
            this.elapsedTime = 0;
            this.euler.order = this.orders[this.orderIndex];
            this.quaternion.setFromEuler( this.euler );
        }
        
        this.renderer.render( this.scene, this.camera );
    }
}

export { App };