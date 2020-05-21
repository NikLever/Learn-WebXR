// Any copyright is dedicated to the Public Domain.
// http://creativecommons.org/publicdomain/zero/1.0/

import * as mat4 from './gl-matrix/mat4.js'
import * as vec3 from './gl-matrix/vec3.js'

const _workingMatrix1 = mat4.create()
const _workingMatrix2 = mat4.create()
const _workingMatrix3 = mat4.create()

export default class XRInputManager {
	constructor(listener=null, targetElement=document){
		this._listener = listener
		this._handleTouchEvent = this._handleTouchEvent.bind(this);
		targetElement.addEventListener("touchstart", this._handleTouchEvent);
	}

	_normalizeTouchCoordinates(clientX, clientY){
		return [
			clientX / document.documentElement.offsetWidth * 2 - 1,
			-(clientY / document.documentElement.offsetHeight) * 2 + 1
		]
	}

	_handleTouchEvent(ev){
		if(!ev.touches || ev.touches.length == 0) return
		if(!this._listener) return
		this._listener('normalized-touch', {
			normalizedCoordinates: this._normalizeTouchCoordinates(ev.touches[0].clientX, ev.touches[0].clientY)
		})
	}

	/**
	@return [origin {vec3}, direction {vec3}]
	* origin is always [0,0,0], direction is a vector through the viewing screen
	*/
	static convertScreenCoordinatesToRay(normalizedX, normalizedY, projectionMatrix){
		var rayorigin = vec3.create();
		mat4.invert(_workingMatrix1, projectionMatrix.elements );
		var raydir = vec3.fromValues(normalizedX, normalizedY, 0.5);
		vec3.transformMat4(raydir,raydir,_workingMatrix1);
		vec3.normalize(raydir, raydir);

		return [rayorigin,raydir]
	}
}
