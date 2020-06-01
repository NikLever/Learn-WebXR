class XRWorldMeshes{
    constructor(){
        this.meshMap = new Map();
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
    
    removeUnseenObjects(){
        const self = this;
        this.meshMap.forEach(object => { 
            if (!object.seen) {
                self.handleRemoveNode(object);
            } 
        });
    }
    
    set objectsSeen( value ){
        this.meshMap.forEach( (object) => { object.seen = value });
    }
    
    handleUpdateNode(worldMesh, object) {
        object.seen = true

        // we don't need to do anything if the timestamp isn't updated
        if (worldMesh.timeStamp <= object.ts) {
            return;
        }

        if (worldMesh.vertexCountChanged) {
            let newMesh = this.newMeshNode(worldMesh)
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

    handleRemoveNode(object) {
        object.threeMesh.geometry.dispose()
        this.removeAnchoredNode(object.node);
        this.meshMap.delete(object.worldMesh.uid)
    }

    handleNewNode(worldMesh) {
        const worldMeshGroup = new THREE.Group();
        const mesh = newMeshNode(worldMesh)

        worldMeshGroup.add(mesh)

        var axesHelper = this.createAxesHelper([0.1,0.1,0.1])
        worldMeshGroup.add( axesHelper );

        //worldMesh.node = worldMeshGroup;
        this.addAnchoredNode(worldMesh, worldMeshGroup)

        this.meshMap.set(worldMesh.uid, {
            ts: worldMesh.timeStamp, 
            worldMesh: worldMesh, 
            node: worldMeshGroup, 
            seen: true, 
            threeMesh: mesh
        })
    }

    newMeshNode(worldMesh) {
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

        return mesh;
    }
    
    update( meshes ){
        const self = this;
        
        this.objectsSeen = false;
        
        meshes.forEach(worldMesh => {
            var object = self.meshMap.get(worldMesh.uid);
            if (object) {
                self.handleUpdateNode(worldMesh, object);
            } else {
                self.handleNewNode(worldMesh);
            }
        })

        this.meshMap.forEach(object => { 
            if (!object.seen) {
                self.handleRemoveNode(object)
            } 
        })
    }
    
    clearAll(){
        const self = this;
        this.meshMap.forEach(object => { 
            self.handleRemoveNode(object); 
        });
    }
}

export { XRWorldMeshes };