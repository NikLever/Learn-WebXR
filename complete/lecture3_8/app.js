import * as THREE from '../../libs/three/three.module.js';
import { VRButton } from '../../libs/VRButton.js';
import { XRControllerModelFactory } from '../../libs/three/jsm/XRControllerModelFactory.js';
import { Stats } from '../../libs/stats.module.js';
import { OrbitControls } from '../../libs/three/jsm/OrbitControls.js';

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
        
        this.clock = new THREE.Clock();
        
		this.camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 100 );
		this.camera.position.set( 0, 1.6, 3 );
        this.camera.lookAt( 0, 0.75, 0 );
        
		this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0x505050 );

		this.scene.add( new THREE.HemisphereLight( 0x555555, 0xFFFFFF ) );

        const light = new THREE.DirectionalLight( 0xffffff );
        light.position.set( 1, 1.25, 1.25 ).normalize();
        light.castShadow = true;
        const size = 15;
        light.shadow.left = -size;
        light.shadow.bottom = -size;
        light.shadow.right = size;
        light.shadow.top = size;
		this.scene.add( light );
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.shadowMap.enabled = true;
		this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        
		container.appendChild( this.renderer.domElement );
        
        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls.target.set(0, 3.5, 0);
        this.controls.update();
        
        this.stats = new Stats();
        
        this.initScene();
        this.setupVR();
        
        this.raycaster = new THREE.Raycaster();
        
        window.addEventListener('resize', this.resize.bind(this) );
	}	
    
    initScene(){
      //Create a plane for following mouse movement
      const geometry1 = new THREE.PlaneGeometry(100, 100);
      const material1 = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
      gplane = new THREE.Mesh( geometry1, material1 );
      scene.add(gplane);

      //Create a marker to indicate where the joint is
      const geometry2 = new THREE.SphereBufferGeometry( 0.1, 8, 8 );
      const material2 = new THREE.MeshStandardMaterial({ color: 0xaa0000 });
      marker = new THREE.Mesh( geometry2, material2 );
      marker.visible = false;
      scene.add(marker);

      this.initPhysics();
    }
    
    initPhysics(){
        this.world = new CANNON.World();
		
        this.dt = 1.0/60.0;
	    this.damping = 0.01;
		
        world.broadphase = new CANNON.NaiveBroadphase();
        world.gravity.set(0, -10, 0);
  
        this.helper = new CannonHelper( scene, world );
		
	const groundShape = new CANNON.Plane();
  groundMaterial = new CANNON.Material();
	const groundBody = new CANNON.Body({ mass: 0, material: groundMaterial });
	groundBody.quaternion.setFromAxisAngle( new CANNON.Vec3(1,0,0), -Math.PI/2);
	groundBody.addShape(groundShape);
	world.add(groundBody);
  helper.addVisual(groundBody, 0xffaa00);
  
  // Joint body
  const shape = new CANNON.Sphere(0.1);
  jointBody = new CANNON.Body({ mass: 0 });
  jointBody.addShape(shape);
  jointBody.collisionFilterGroup = 0;
  jointBody.collisionFilterMask = 0;
  world.add(jointBody);
  
  box = addBody();
}    
    }
    
    setupVR(){
        
    }
    
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }
    
	render( ) {   
        this.stats.update();
        this.renderer.render( this.scene, this.camera );
    }
}

export { App };

/*
var scene, camera, renderer, controls, world, helper, dt, damping, marker, jointBody, raycaster, mouse, box;

function initPhysics(){
	world = new CANNON.World();
		
  dt = 1.0/60.0;
	damping = 0.01;
		
	world.broadphase = new CANNON.NaiveBroadphase();
	world.gravity.set(0, -10, 0);
  
  helper = new CannonHelper( scene, world );
		
	const groundShape = new CANNON.Plane();
  groundMaterial = new CANNON.Material();
	const groundBody = new CANNON.Body({ mass: 0, material: groundMaterial });
	groundBody.quaternion.setFromAxisAngle( new CANNON.Vec3(1,0,0), -Math.PI/2);
	groundBody.addShape(groundShape);
	world.add(groundBody);
  helper.addVisual(groundBody, 0xffaa00);
  
  // Joint body
  const shape = new CANNON.Sphere(0.1);
  jointBody = new CANNON.Body({ mass: 0 });
  jointBody.addShape(shape);
  jointBody.collisionFilterGroup = 0;
  jointBody.collisionFilterMask = 0;
  world.add(jointBody);
  
  box = addBody();
}

function addBody(box=true){
  let shape;
  if (!box){
	  shape = new CANNON.Sphere(0.5);
  }else{
	  shape = new CANNON.Box(new CANNON.Vec3(0.5,0.5,0.5));
  }
  const material = new CANNON.Material();
	const body = new CANNON.Body({ mass: 5, material: material });
  body.addShape(shape);
  	
  body.position.set(0, 1, 0);
	body.linearDamping = damping;
	world.add(body);
        
  helper.addVisual(body);
  
  return body;
}

function onMouseMove( event ) {

	// calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components

	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
//console.log( `${mouse.x.toFixed(1)}, ${mouse.y.toFixed(1)}`);
  
  if (mouse.constraint){
    raycaster.setFromCamera( mouse, camera );
    const intersects = raycaster.intersectObject( gplane );
    console.log( "constraint:" + intersects.length );
    if (intersects.length>0){
      marker.position.copy( intersects[0].point );
      jointBody.position.copy( intersects[0].point );
      mouse.constraint.update(); 
    }
  }
}

function onMouseDown( event ){
  // Find mesh from a ray
  raycaster.setFromCamera( mouse, camera );
  const intersects = raycaster.intersectObject( box.threemesh, true );
  if (intersects.length>0){
    marker.visible = true;
    marker.position.copy( intersects[0].point );
    let object = intersects[0].object;
    mouse.down = true;
    //Align movement plane to intersection
    gplane.position.copy(intersects[0].point);
    gplane.lookAt(camera.position);  

    addMouseConstraint(intersects[0].point, box);
  }
}

function addMouseConstraint(pos, body){
  const pivot = pos.clone();
  body.threemesh.worldToLocal(pivot);

  jointBody.position.copy(pos);
 
  mouse.constraint = new CANNON.PointToPointConstraint(body, pivot, jointBody, new CANNON.Vec3(0,0,0));

  world.addConstraint(mouse.constraint);
}

function onMouseUp(){
  marker.visible = false;
  mouse.down = false;
  if (mouse.constraint){
    world.removeConstraint(mouse.constraint);
    mouse.constraint = false;
  }
}

function onWindowResize( event ) {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

function update() {
  requestAnimationFrame( update );
  world.step(dt);
  helper.update( );
  renderer.render( scene, camera );
}
*/