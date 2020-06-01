import * as THREE from '../libs/three/three.module.js';
import { ARButton } from '../libs/three/jsm/ARButton.js';
import { XREngine } from '../libs/XREngine.js';

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
        
		this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );
		this.camera.position.set( 0, 1.6, 3 );
        
		this.scene = new THREE.Scene();

		const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 2);
        ambient.position.set( 0.5, 1, 0.25 );
		this.scene.add(ambient);
        
        const light = new THREE.DirectionalLight();
        light.position.set( 0.2, 1, 1);
        this.scene.add(light);
        
        this.lights = { ambient, light };
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.renderer.xr.enabled = true;
		container.appendChild( this.renderer.domElement );
		
		document.body.appendChild( ARButton.createButton( this.renderer, { requiredFeatures: [ 'hit-test', 'worldSensing' ] } ) );
        
        this.initScene();
        
        const self = this;

        function onSelect() {
            
        }

        this.controller = this.renderer.xr.getController( 0 );
        this.controller.addEventListener( 'select', onSelect );
        this.scene.add( this.controller );
        
        this.sessionN
        
        this.renderer.setAnimationLoop((timestamp, frame)=>{ self.render(timestamp, frame)});
		
		window.addEventListener('resize', function(){ 
			self.camera.aspect = window.innerWidth / window.innerHeight;
    		self.camera.updateProjectionMatrix();
    		self.renderer.setSize( window.innerWidth, window.innerHeight );  
    	});
	}	
    
    initScene(){
        
        this.workingMatrix = new THREE.Matrix4();
        this.workingVec3 = new THREE.Vector3();

        this.savedOrigin = new THREE.Vector3(0,0,0);
        this.savedDirection = new THREE.Vector3(0,0,-1);
        
        this.reticle = new THREE.Object3D()
            
        this.reticle.userData.trackedColor = new THREE.Color( 0xDDFFDD );
        this.reticle.userData.notTrackedColor = new THREE.Color( 0xFF6666 );
            
        const reticleMaterial = new THREE.MeshStandardMaterial({ color: this.reticle.userData.trackedColor })
        this.requestNextHit = true

        const mesh = new THREE.Mesh(
            new THREE.RingGeometry(0.04, 0.05, 36, 64),
            reticleMaterial
        );

        mesh.geometry.rotateX( -Math.PI/2 );
        this.reticle.add(mesh);

        this.reticle.matrixAutoUpdate = false;
        this.reticle.visible = false;
        
        this.scene.add(this.reticle);
    }
    
    updateScene(frame){
        if (this.sessionNeedsInitialising){
                
        }
        
        const worldInfo = frame.worldInformation;
        
        const self = this;
        
        this.engine.objectsSeen = false;
        
        if(worldInfo.estimatedLight){
            let ambientIntensity = worldInfo.estimatedLight.ambientIntensity
            this.lights.ambient.intensity = ambientIntensity;
            this.lights.light.intensity = ambientIntensity * 0.5;
        }
        
        if(worldInfo.meshes){
            worldInfo.meshes.forEach(worldMesh => {
                const object = meshMap.get(worldMesh.uid);
            }); 
        }
    }
    
	render( timestamp, frame ) {
        if (frame) this.updateScene(frame);         
        this.renderer.render( this.scene, this.camera );
    }
}

export { App };



            
            
            

    /*        function handleUpdateNode(worldMesh, object) {
                object.seen = true

                // we don't need to do anything if the timestamp isn't updated
                if (worldMesh.timeStamp <= object.ts) {
                    return;
                }

                if (worldMesh.vertexCountChanged) {
                    let newMesh = newMeshNode(worldMesh)
                    object.threeMesh.geometry.dispose()
                    object.node.remove(object.threeMesh)
                    object.node.add(newMesh)
                    object.threeMesh = newMesh
                } else {
                    if (worldMesh.vertexPositionsChanged) {
                        let position = object.threeMesh.geometry.attributes.position
                        if (position.array.length != worldMesh.vertexPositions.length) {
                            console.error("position and vertex arrays are different sizes", position, worldMesh)
                        }
                        position.setArray(worldMesh.vertexPositions);
                        position.needsUpdate = true;
                    }
                    if (worldMesh.textureCoordinatesChanged) {
                        let uv = object.threeMesh.geometry.attributes.uv
                        if (uv.array.length != worldMesh.textureCoordinates.length) {
                            console.error("uv and vertex arrays are different sizes", uv, worldMesh)
                        }
                        uv.setArray(worldMesh.textureCoordinates);
                        uv.needsUpdate = true;
                    }
                    if (worldMesh.triangleIndicesChanged) {
                        let index = object.threeMesh.geometry.index
                        if (index.array.length != worldMesh.triangleIndices) {
                            console.error("uv and vertex arrays are different sizes", index, worldMesh)
                        }
                        index.setArray(worldMesh.triangleIndices);
                        index.needsUpdate = true;
                    }
                    if (worldMesh.vertexNormalsChanged && worldMesh.vertexNormals.length > 0) {
                        // normals are optional
                        let normals = object.threeMesh.geometry.attributes.normals
                        if (normals.array.length != worldMesh.vertexNormals) {
                            console.error("uv and vertex arrays are different sizes", normals, worldMesh)
                        }
                        normals.setArray(worldMesh.vertexNormals);
                        normals.needsUpdate = true;
                    }
                }
            }

            function handleRemoveNode(object) {
                object.threeMesh.geometry.dispose()
                engine.removeAnchoredNode(object.node);
                meshMap.delete(object.worldMesh.uid)
            }

            function handleNewNode(worldMesh) {
                let worldMeshGroup = new THREE.Group();
                var mesh = null;

                mesh = newMeshNode(worldMesh)

                worldMeshGroup.add(mesh)

                var axesHelper = engine.createAxesHelper([0.1,0.1,0.1])
                worldMeshGroup.add( axesHelper );
                
                //worldMesh.node = worldMeshGroup;
                engine.addAnchoredNode(worldMesh, worldMeshGroup)

                meshMap.set(worldMesh.uid, {
                    ts: worldMesh.timeStamp, 
                    worldMesh: worldMesh, 
                    node: worldMeshGroup, 
                    seen: true, 
                    threeMesh: mesh
                })
            }

            function newMeshNode(worldMesh) {
                let edgeColor, polyColor
                if (worldMesh instanceof XRFaceMesh) {
                    edgeColor = '#999999'
                    polyColor = '#999900'
                } else {
                    edgeColor = '#11FF11'
                    polyColor = '#009900'
                }

                let mesh = new THREE.Group();
                let geometry = new THREE.BufferGeometry()

                let indices = new THREE.BufferAttribute(worldMesh.triangleIndices, 1)
                indices.dynamic = true
                geometry.setIndex(indices)
                
                let verticesBufferAttribute = new THREE.BufferAttribute( worldMesh.vertexPositions, 3 )
                verticesBufferAttribute.dynamic = true
                geometry.addAttribute( 'position', verticesBufferAttribute );

                let uvBufferAttribute = new THREE.BufferAttribute( worldMesh.textureCoordinates, 2 )
                uvBufferAttribute.dynamic = true
                geometry.addAttribute( 'uv', uvBufferAttribute );

                if (worldMesh.vertexNormals.length > 0) {
                    let normalsBufferAttribute = new THREE.BufferAttribute( worldMesh.vertexNormals, 3 )
                    normalsBufferAttribute.dynamic = true
                    geometry.addAttribute( 'normal', normalsBufferAttribute );
                } else {
                    geometry.computeVertexNormals()
                }

                // transparent mesh
                var wireMaterial = new THREE.MeshPhongMaterial({color: edgeColor, wireframe: true})
                var material = new THREE.MeshPhongMaterial({color: polyColor, transparent: true, opacity: 0.25})

                mesh.add(new THREE.Mesh(geometry, material))
                mesh.add(new THREE.Mesh(geometry, wireMaterial))

                mesh.geometry = geometry;  // for later use

                //worldMesh.mesh = mesh;
                return mesh
            }

            // handle hit testing slightly differently than other samples, since we're doing
            // it per frame.  The "boiler plate" code below is slightly different, setting 
            // requestNextHit on tap instead of executing the hit test.  The custom XREngineHits
            // does a hit test each frame if the previous one has resolved
            function handleHitResults(hits) {
                let size = 0.05;
                if (hits.length > 0) {
                    let hit = hits[0]

					session.requestFrameOfReference('head-model').then(headFrameOfReference => {
                        // convert hit matrices from head to eye level coordinate systems
                        headFrameOfReference.getTransformTo(eyeLevelFrameOfReference, workingMatrix)
                        mat4.multiply(workingMatrix, workingMatrix, hit.hitMatrix)

                        const node = reticleParent
                        node.matrix.fromArray(workingMatrix)
                        reticleParent.visible = true   // it starts invisible
                        reticle.material.color = reticleTrackedColor

                        node.updateMatrixWorld(true)
                    })
                } else {
                    reticle.material.color = reticleNotTrackedColor
                }
                requestNextHit = true
            }

            class XREngineHits extends XREngine {
                endFrame(){
                    if (requestNextHit) {
                        requestNextHit = false

						session.requestFrameOfReference('head-model').then(headFrameOfReference => {
                            session.requestHitTest(savedOrigin, savedDirection, headFrameOfReference)
                                .then(handleHitResults)
                                .catch(err => {
                                    console.error('Error testing hits', err)
                                })
                        })
                    }
                }
            }


            ////////////////////////////////////////////////////
            ////////////////////////////////////////////////////
            // BOILER PLATE.  Can you feel the plates boiling?
            //
            // There are slight differences between examples but largely this code is similar
            //
            // Create the output context where the XRSession will place composited renders
            const xrCanvas = document.createElement('canvas')
            xrCanvas.setAttribute('class', 'xr-canvas')
            const xrContext = xrCanvas.getContext('xrpresent')
            if(!xrContext){
                console.error('No XR context', xrCanvas)
            }

            // get the XR Device
            navigator.xr.requestDevice().then(xrDevice => {
                device = xrDevice
            }).catch(err => {
            })

            document.getElementById('description').addEventListener('touchstart', hideMe, {capture: true})
            function hideMe(event) { 
                event.target.style.display = 'none' 
                event.stopPropagation()
            }

            document.getElementById('go-button').addEventListener('click', handleStartSessionRequest, true)
            document.getElementById('go-button').addEventListener('touchstart', handleGoButtonTouch, true)
            function handleGoButtonTouch(event) { 
                event.stopPropagation()
            }

            // handle input events from the XRInputManager
            const inputManager = new XRInputManager(handleXRInput)
            function handleXRInput(eventName, details){
                switch(eventName){
                    case 'normalized-touch':
                        hitTestWithScreenCoordinates(...details.normalizedCoordinates)
                        break
                    default:
                        console.error('unknown xr input event', eventName, details)
                        break
                }
            }

            function hitTestWithScreenCoordinates(normalizedX, normalizedY){
                if(session === null){
                    console.log('No session for hit testing')
                    return
                }

                // Convert the screen coordinates into head-model origin/direction for hit testing
                const [origin, direction] = 
                XRInputManager.convertScreenCoordinatesToRay(normalizedX, normalizedY, 
                                                            engine.camera.projectionMatrix)
                savedOrigin = origin
                savedDirection = direction

                requestNextHit = true
            }

            /////////////////////
            // Session startup / shutdown
            function handleStartSessionRequest(ev){
                if(device === null){
                    console.error('No xr device')
                    return
                }

                if (!session) {
                    device.requestSession({ 
                        outputContext: xrContext,
                        worldSensing: true  
                    }).then(handleSessionStarted)
                        .catch(err => {
                            console.error('Session setup error', err)
                        })
                    document.getElementById('go-button').innerText = "End"
                    document.getElementById('go-button').style.display = 'none' 
                } else {
                    session.end()
                    handleSessionEnded();
                    reticleParent.visible = false   // it starts invisible
                    document.getElementById('description').style.display = 'block' 
					document.getElementById('go-button').style.display = "block"
                    document.getElementById('go-button').innerText = "Go"
                }
            }

            function handleSessionEnded() {	
                session = null
            }

            function handleSessionStarted(xrSession){
                session = xrSession
                document.body.insertBefore(xrCanvas, document.body.firstChild)

                let sensingState = xrSession.updateWorldSensingState({
                    illuminationDetectionState : {
                        enabled : true
                    },
                    meshDetectionState : {
                        enabled : true,
                        normals: true
                    }
                })

                // Create the context where we will render our 3D scene
                const canvas = document.createElement('canvas')
                var glContext = canvas.getContext('webgl', {
                    compatibleXRDevice: device
                })
                if(!glContext) throw new Error('Could not create a webgl context')

                // Set up the base layer
                session.baseLayer = new XRWebGLLayer(session, glContext)

                // Create a simple test scene and renderer
                // The engine's scene is in the eye-level coordinate system 
                // Our custom engine class does hit testing at the end of each rAF 
                engine = new XREngineHits(canvas, glContext)

				createRootNode().then(() => {
					// Kick off rendering
					session.requestAnimationFrame(handleAnimationFrame)
				})

				initializeScene()
			}

			async function createRootNode() {
				let headFrameOfReference = await session.requestFrameOfReference('head-model')
				eyeLevelFrameOfReference = await session.requestFrameOfReference('eye-level')

				// get the location of the device, and use it to create an 
				// anchor with the identity orientation
				headFrameOfReference.getTransformTo(eyeLevelFrameOfReference, workingMatrix)
				mat4.getTranslation(workingVec3, workingMatrix)
				mat4.fromTranslation(workingMatrix, workingVec3)

				let anchor = await session.addAnchor(workingMatrix, eyeLevelFrameOfReference)
				engine.addAnchoredNode(anchor, engine.root)
				
				return true
			}

            ////////////////
            // render loop			
            function handleAnimationFrame(t, frame){
                updateScene(frame)
                if(!session || session.ended) return
                session.requestAnimationFrame(handleAnimationFrame)

                let pose = frame.getDevicePose(eyeLevelFrameOfReference)
                if(!pose){
                    console.log('No pose')
                    return
                }

                engine.startFrame()
                for (let view of frame.views) {
					engine.preRender(
						session.baseLayer.getViewport(view),
						view.projectionMatrix,
						pose.getViewMatrix(view)
					)
					engine.render()
                }
                engine.endFrame()
            }*/
