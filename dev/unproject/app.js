import * as THREE from '../../libs/three/three.module.js';

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
                
		this.camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 100 );
		this.camera.position.set( 0, 1.6, 0 );
        
		this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0x505050 );
        this.scene.add( this.camera );
        
        this.clock = new THREE.Clock();
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        
		container.appendChild( this.renderer.domElement );
        
        this.icon = this.loadIcon();
        
        this.renderer.setAnimationLoop( this.render.bind(this) );
        
        window.addEventListener('resize', this.resize.bind(this) );
	}	
    
    ndcToWorld( x, y, z ){
        const pos = new THREE.Vector3( x, y, z );
        pos.unproject( this.camera );
        return pos;
    }
    
    ndcToScreen( x, y, z ){
        const pos = this.ndcToWorld( x, y, z );
        return this.worldToScreen( pos.x, pos.y, pos.z );
    }
    
    worldToScreen( x, y, z ){
        const pos = new THREE.Vector3( x, y, z );
        pos.x = ( pos.x + 1) * window.innerWidth / 2;
        pos.y = -( pos.y - 1) * window.innerHeight / 2;
        pos.z = 0;
        return pos;
    }
    
    loadIcon(){
        const svgStr = '<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 93.75 93.75"><defs><style>.cls-1{fill:#fff;}</style></defs><circle cx="46.87" cy="46.87" r="46.87"/><path class="cls-1" d="M95,49.08H92.48A42.5,42.5,0,0,0,51,7.52V5.17H49V7.53A42.49,42.49,0,0,0,7.52,49.08H5.17v2H7.53A42.47,42.47,0,0,0,49,92.47v2.86h2V92.47A42.47,42.47,0,0,0,92.47,51.08H95Zm-4.52,0h-8A32.5,32.5,0,0,0,51,17.52v-8A40.55,40.55,0,0,1,90.48,49.08Zm-10,2A30.51,30.51,0,0,1,51,80.47V67.17H49v13.3A30.51,30.51,0,0,1,19.53,51.08h5.55v-2H19.52A30.52,30.52,0,0,1,49,19.53v14h2v-14A30.54,30.54,0,0,1,80.48,49.08H74.92v2ZM49,9.53v8A32.49,32.49,0,0,0,17.52,49.08h-8A40.54,40.54,0,0,1,49,9.53ZM9.53,51.08h8A32.48,32.48,0,0,0,49,82.47v8A40.52,40.52,0,0,1,9.53,51.08ZM51,90.47v-8A32.48,32.48,0,0,0,82.47,51.08h8A40.52,40.52,0,0,1,51,90.47ZM50,35C37.21,35,27.11,48.83,26.69,49.42l-.42.58.42.58C27.11,51.17,37.21,65,50,65S72.89,51.17,73.31,50.58l.42-.58-.42-.58C72.89,48.83,62.79,35,50,35Zm1.28,27.52a12.58,12.58,0,1,1,0-25.15l.57,0a9.93,9.93,0,1,0,10.46,6.52,12.57,12.57,0,0,1-11,18.6Zm9.85-20.36a4.47,4.47,0,0,1,.22,1.33,4.62,4.62,0,1,1-4.62-4.62,3.93,3.93,0,0,1,.6.06A12.7,12.7,0,0,1,61.13,42.16ZM28.76,50c1.45-1.84,6.31-7.6,12.7-10.79a14.51,14.51,0,0,0,.26,21.72C35.21,57.75,30.23,51.87,28.76,50Zm35,7.48a14.45,14.45,0,0,0,.13-14.85A46.35,46.35,0,0,1,71.24,50,45.55,45.55,0,0,1,63.73,57.48Z" transform="translate(-3.61 -3.8)"/></svg>';
        
        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext("2d");
        const img = new Image();
        const svg = new Blob([svgStr], {type: "image/svg+xml;charset=utf-8"});
        const url = URL.createObjectURL(svg);
        const opacity = 1;
		
        const material = new THREE.MeshBasicMaterial({ transparent: true, opacity });
        const geometry = new THREE.PlaneBufferGeometry();
		const icon = new THREE.Mesh(geometry, material);
        const scale = 0.02;
        icon.scale.set( scale, scale, scale )
        
        const texture = new THREE.CanvasTexture(canvas);
        material.map = texture;

        const self = this;
        
        img.onload = function() {
            ctx.drawImage(img, 0, 0);
            texture.needsUpdate;
            self.resize();
        };
        img.src = url;
        
        return icon;
        
    }
    
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
        this.camera.remove( this.icon );
        this.icon.position.copy( this.ndcToWorld( -0.9, 0.9, 0.5 ));
        this.camera.attach( this.icon );
        this.icon.lookAt( this.camera.position );
    }
    
	render( ) {   
        this.renderer.render( this.scene, this.camera );
    }
}

export { App };