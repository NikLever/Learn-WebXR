// Any copyright is dedicated to the Public Domain.
// http://creativecommons.org/publicdomain/zero/1.0/


const PI_OVER_180 = Math.PI / 180

// the furthese pluto gets from the sun is 7,375,930,000, so let's double that as our "very far value"
const FAR = 15000000000000
// really can't imagine needing to be closer than 1mm
var NEAR = 0.001

// values for the perspective matrix
var PERPS_10 = - ( FAR + NEAR ) / ( FAR - NEAR );
var PERSP_14 = - 2 * FAR * NEAR / ( FAR - NEAR );

/*
A wrapper around the Three renderer and related classes, useful for quick testing.
*/
export default class XREngine {
	constructor(glCanvas, glContext, logarithmicDepth = false){
		this._glCanvas = glCanvas
		this._glContext = glContext
		this._logarithmicDepth = logarithmicDepth
		
		const aspectRatio = document.documentElement.offsetWidth / document.documentElement.offsetHeight

		// Dynamically calculate the FOV
		this._camera = new THREE.PerspectiveCamera(70, aspectRatio, 
			// setting these doesn't really matter, since the perspective matrix gets overritten in
			// the render loop
			logarithmicDepth? NEAR : 0.05, 
			logarithmicDepth? FAR : 1000)
		this._camera.matrixAutoUpdate = false
		this._scene = new THREE.Scene()
		this._root = new THREE.Group()
		this._scene.add(this._root)
		this._scene.add(this._camera)
		this._renderer = new THREE.WebGLRenderer({
			canvas: this._glCanvas,
			context: this._glContext,
			antialias: false,
			logarithmicDepthBuffer: logarithmicDepth,
			alpha: false
		})
		if (logarithmicDepth && !this._renderer.capabilities.logarithmicDepthBuffer) {
			this._logarithmicDepth = false

			console.warn("couldn't create a logarithmic depth buffer in the XREngine: not supported by the renderer")
		}
		// an array of info that we'll use in _handleFrame to update the nodes using anchors
		this._anchoredNodes = new Map() // { XRAnchorOffset, Three.js Object3D }

		this._renderer.autoClear = false
		this._renderer.setPixelRatio(window.devicePixelRatio)
	}

	startFrame(){
		this._renderer.clear()
	}

	setupCamera(viewMatrix) {
		this._camera.matrix.fromArray(viewMatrix)
		this._camera.matrixWorldNeedsUpdate = true
		this._camera.updateMatrixWorld()
    }
  
	preRender(viewport, projectionMatrix, viewMatrix){
		this.setupCamera(viewMatrix)
		this._camera.projectionMatrix.fromArray(projectionMatrix)
		if (this._logarithmicDepth) {
			this._camera.projectionMatrix.elements[10] = PERPS_10
			this._camera.projectionMatrix.elements[14] = PERSP_14
		}

		this._renderer.setSize(this._glCanvas.offsetWidth, this._glCanvas.offsetHeight, false)
		this._renderer.setViewport(viewport.x, viewport.y, viewport.width, viewport.height)
	}
	render() {
		this._renderer.clearDepth()
		this._renderer.render(this._scene, this._camera)
	}

	endFrame(){}

	get scene(){ return this._scene }
	get root(){ return this._root }
	get camera() { return this._camera }
	get renderer() { return this._renderer }

	get near(){ return this._camera.near }
	get far(){ return this._camera.far }
	get fov(){ return this._camera.fov * PI_OVER_180 }

	addDirectionalLight(color=0xffffff, intensity=0.7, position=[0, 10, 20]){
		const light = new THREE.DirectionalLight(color, intensity)
		light.position.set(...position)
		this._root.add(light)
		this._root.add(light.target)
		return light
	}

	addAmbientLight(color=0xffffff, intensity=0.3){
		const light = new THREE.AmbientLight(color, intensity)
		this._root.add(light)
		return light
	}

	addSphere(position=[0,0,0], size=[0.1, 0.1, 0.1], color=0x00FF00){
		const sphere = new THREE.Mesh(
			new THREE.SphereBufferGeometry(...size),
			new THREE.MeshLambertMaterial({ color: color })
		)
		sphere.position.set(...position)
		this._root.add(sphere)
		return sphere
	}

	addTeapot(position=[0,0,0], size=0.1, color=0x00FF00){
		const geometry = new THREE.TeapotBufferGeometry(0.1)
		const material = new THREE.MeshLambertMaterial({ 
			color: color,
			side: THREE.DoubleSide })
		const mesh = new THREE.Mesh(geometry, material)
		mesh.position.set(...position)
		this._root.add(mesh)
		return mesh
	}

	addBox(position=[0,0,0], size=[0.1, 0.1, 0.1], color=0x00FF00){
		const box = new THREE.Mesh(
			new THREE.BoxBufferGeometry(...size),
			new THREE.MeshLambertMaterial({ color: color })
		)
		box.position.set(...position)
		this._root.add(box)
		return box
	}
	
	addAxesHelper( position=[0,0,0], size=[1,1,1] ) {
		let helper = this.createAxesHelper(size)
		helper.position.set(...position)
		this._root.add(helper)
		return helper;
	}

	createAxesHelper (size=[1,1,1]) {
		var vertices = [
			0, 0, 0,	size[0], 0, 0,
			0, 0, 0,	0, size[1], 0,
			0, 0, 0,	0, 0, size[2]
		];

		var colors = [
			1, 0, 0,	1, 0.6, 0,
			0, 1, 0,	0.6, 1, 0,
			0, 0, 1,	0, 0.6, 1
		];

		var geometry = new THREE.BufferGeometry();
		geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
		geometry.addAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );

		var material = new THREE.LineBasicMaterial( { vertexColors: THREE.VertexColors } );

		var helper = new THREE.LineSegments(geometry, material);
		return helper;
	}


	/*
	Add a node to the scene and keep its pose updated using the anchorOffset
	*/
	addAnchoredNode(anchor, node){
		if (!anchor || !anchor.uid) {
			console.error("not a valid anchor", anchor)
			return;
		}
		this._anchoredNodes.set(anchor.uid, {
			anchor: anchor,
			node: node
		})
		node.anchor = anchor
		node.matrixAutoUpdate = false
		node.matrix.fromArray(anchor.modelMatrix)
		node.updateMatrixWorld(true)	
		this._scene.add(node)

		anchor.addEventListener("update", this._handleAnchorUpdate.bind(this))
		anchor.addEventListener("remove", this._handleAnchorDelete.bind(this))
	
		return node
	}

	/*
	Extending classes should override this to get notified when an anchor for node is removed
	*/
	anchoredNodeRemoved(node) {}
	
	_handleAnchorDelete(details) {
		let anchor = details.source
		throttledConsoleLog('Anchor deleted: uid', anchor.uid)

		const anchoredNode = this._anchoredNodes.get(anchor.uid)
		if (anchoredNode) {
			const node = anchoredNode.node
			this.anchoredNodeRemoved(node);
			this._anchoredNodes.delete(anchor.uid);
			this._scene.remove(node)
			return;
		}
	}

	_handleAnchorUpdate(details) {
		const anchor = details.source
		const anchoredNode = this._anchoredNodes.get(anchor.uid)
		if (anchoredNode) {
			const node = anchoredNode.node
			node.matrixAutoUpdate = false
			node.matrix.fromArray(anchor.modelMatrix)
			node.updateMatrixWorld(true)	
			return;
		}
	}

	/* 
	Remove a node from the scene
	*/
	removeAnchoredNode(node) {
		if (!node.anchor) {
			console.error("trying to remove unanchored node with removeAnchoredNode")
			return;
		}
		const anchoredNode = this._anchoredNodes.get(node.anchor.uid)
		if (anchoredNode) {
			this.anchoredNodeRemoved(anchoredNode.node);
			this._anchoredNodes.delete(node.anchor.uid);
			this._scene.remove(anchoredNode.node)
			return;
		}
	}
	
	fillInGLTFScene(path, position=[0, 0, -2], scale=[1, 1, 1]){
		let ambientLight = new THREE.AmbientLight('#FFF', 1)
		this._root.add(ambientLight)
	
		let directionalLight = new THREE.DirectionalLight('#FFF', 0.6)
		this._root.add(directionalLight)
	
		this.loadGLTF(path).then(gltf => {
			gltf.scene.scale.set(...scale)
			gltf.scene.position.set(...position)
			//gltf.scene.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / -2)
			this._root.add(gltf.scene)
		}).catch((...params) =>{
			console.error('could not load gltf', ...params)
		})
	}
}
	
window.loadGLTF = function(url){
	return new Promise((resolve, reject) => {
		let loader = new THREE.GLTFLoader()
		loader.load(url, (gltf) => {
			if(gltf === null){
				reject()
			}
			if(gltf.animations && gltf.animations.length){
				let mixer = new THREE.AnimationMixer(gltf.scene)
				for(let animation of gltf.animations){
					mixer.clipAction(animation).play()
				}
			}
			resolve(gltf)
		})
	})
}

window.loadObj = function(baseURL, geometry){
	return new Promise(function(resolve, reject){
		const mtlLoader = new THREE.MTLLoader()
		mtlLoader.setPath(baseURL)
		const mtlName = geometry.split('.')[geometry.split(':').length - 1] + '.mtl'
		mtlLoader.load(mtlName, (materials) => {
			materials.preload()
			let objLoader = new THREE.OBJLoader()
			objLoader.setMaterials(materials)
			objLoader.setPath(baseURL)
			objLoader.load(geometry, (obj) => {
				resolve(obj)
			}, () => {} , (...params) => {
				console.error('Failed to load obj', ...params)
				reject(...params)
			})
		})
	})
}

/*
Rate limit a function call. Wait is the minimum number of milliseconds between calls.
If leading is true, the first call to the throttled function is immediately called.
If trailing is true, once the wait time has passed the function is called. 

This code is cribbed from https://github.com/jashkenas/underscore
*/
if (!window.throttle) {
	window.throttle = function(func, wait, leading=true, trailing=true) {
		var timeout, context, args, result
		var previous = 0

		var later = function() {
			previous = leading === false ? 0 : Date.now()
			timeout = null
			result = func.apply(context, args)
			if (!timeout) context = args = null
		}

		var throttled = function() {
			var now = Date.now()
			if (!previous && leading === false) previous = now
			var remaining = wait - (now - previous)
			context = this
			args = arguments
			if (remaining <= 0 || remaining > wait) {
			if (timeout) {
				clearTimeout(timeout)
				timeout = null
			}
			previous = now
			result = func.apply(context, args)
			if (!timeout) context = args = null
			} else if (!timeout && trailing !== false) {
			timeout = setTimeout(later, remaining)
			}
			return result
		}

		throttled.cancel = function() {
			clearTimeout(timeout)
			previous = 0
			timeout = context = args = null
		}

		return throttled
	}

	window.throttledConsoleLog = throttle((...params) => {
		console.log(...params)
	}, 1000)
}
