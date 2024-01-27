import { NodeUpdateType } from './constants.js';

class NodeFrame {

	constructor() {

		this.time = 0;
		this.deltaTime = 0;

		this.frameId = 0;
		this.renderId = 0;

		this.startTime = null;

		this.updateMap = new WeakMap();
		this.updateBeforeMap = new WeakMap();

		this.renderer = null;
		this.material = null;
		this.camera = null;
		this.object = null;
		this.scene = null;

	}

	_getMaps( referenceMap, nodeRef ) {

		let maps = referenceMap.get( nodeRef );

		if ( maps === undefined ) {

			maps = {
				renderMap: new WeakMap(),
				frameMap: new WeakMap()
			};

			referenceMap.set( nodeRef, maps );

		}

		return maps;

	}

	updateBeforeNode( node ) {

		const updateType = node.getUpdateBeforeType();
		const reference = node.updateReference( this );

		const { frameMap, renderMap } = this._getMaps( this.updateBeforeMap, reference );

		if ( updateType === NodeUpdateType.FRAME ) {

			if ( frameMap.get( node ) !== this.frameId ) {

				frameMap.set( node, this.frameId );

				node.updateBefore( this );

			}

		} else if ( updateType === NodeUpdateType.RENDER ) {

			if ( renderMap.get( node ) !== this.renderId || frameMap.get( node ) !== this.frameId ) {

				renderMap.set( node, this.renderId );
				frameMap.set( node, this.frameId );

				node.updateBefore( this );

			}

		} else if ( updateType === NodeUpdateType.OBJECT ) {

			node.updateBefore( this );

		}

	}

	updateNode( node ) {

		const updateType = node.getUpdateType();
		const reference = node.updateReference( this );

		const { frameMap, renderMap } = this._getMaps( this.updateMap, reference );

		if ( updateType === NodeUpdateType.FRAME ) {

			if ( frameMap.get( node ) !== this.frameId ) {

				frameMap.set( node, this.frameId );

				node.update( this );

			}

		} else if ( updateType === NodeUpdateType.RENDER ) {

			if ( renderMap.get( node ) !== this.renderId || frameMap.get( node ) !== this.frameId ) {

				renderMap.set( node, this.renderId );
				frameMap.set( node, this.frameId );

				node.update( this );

			}

		} else if ( updateType === NodeUpdateType.OBJECT ) {

			node.update( this );

		}

	}

	update() {

		this.frameId ++;

		if ( this.lastTime === undefined ) this.lastTime = performance.now();

		this.deltaTime = ( performance.now() - this.lastTime ) / 1000;

		this.lastTime = performance.now();

		this.time += this.deltaTime;

	}

}

export default NodeFrame;
