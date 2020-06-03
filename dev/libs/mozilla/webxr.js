/**
 * @license
 * webxr-ios-js
 * Copyright (c) 2019 Mozilla Inc. All Rights Reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 */

/**
 * @license
 * webxr-polyfill
 * Copyright (c) 2017 Google
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @license
 * wglu-preserve-state
 * Copyright (c) 2016, Brandon Jones.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * @license
 * nosleep.js
 * Copyright (c) 2017, Rich Tibbett
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

const _global = typeof global !== 'undefined' ? global :
                typeof self !== 'undefined' ? self :
                typeof window !== 'undefined' ? window : {};

const PRIVATE = Symbol('@@webxr-polyfill/EventTarget');
class EventTarget {
  constructor() {
    this[PRIVATE] = {
      listeners: new Map(),
    };
  }
  addEventListener(type, listener) {
    if (typeof type !== 'string') { throw new Error('`type` must be a string'); }
    if (typeof listener !== 'function') { throw new Error('`listener` must be a function'); }
    const typedListeners = this[PRIVATE].listeners.get(type) || [];
    typedListeners.push(listener);
    this[PRIVATE].listeners.set(type, typedListeners);
  }
  removeEventListener(type, listener) {
    if (typeof type !== 'string') { throw new Error('`type` must be a string'); }
    if (typeof listener !== 'function') { throw new Error('`listener` must be a function'); }
    const typedListeners = this[PRIVATE].listeners.get(type) || [];
    for (let i = typedListeners.length; i >= 0; i--) {
      if (typedListeners[i] === listener) {
        typedListeners.pop();
      }
    }
  }
  dispatchEvent(type, event) {
    const typedListeners = this[PRIVATE].listeners.get(type) || [];
    const queue = [];
    for (let i = 0; i < typedListeners.length; i++) {
      queue[i] = typedListeners[i];
    }
    for (let listener of queue) {
      listener(event);
    }
    if (typeof this[`on${type}`] === 'function') {
      this[`on${type}`](event);
    }
  }
}

const PRIVATE$1 = Symbol('@@webxr-polyfill/XR');
class XR$1 extends EventTarget {
  constructor(device) {
    super();
    this[PRIVATE$1] = {
      device,
    };
  }
  async requestDevice() {
    const device = await this[PRIVATE$1].device;
    if (device) {
      return device;
    }
    throw new Error('NotFoundError');
  }
}

let now;
if ('performance' in _global === false) {
  let startTime = Date.now();
  now = () => Date.now() - startTime;
} else {
  now = () => performance.now();
}
var now$1 = now;

const PRIVATE$2 = Symbol('@@webxr-polyfill/XRPresentationContext');
class XRPresentationContext {
  constructor(canvas, ctx, glAttribs) {
    this[PRIVATE$2] = { canvas, ctx, glAttribs };
    Object.assign(this, ctx);
  }
  get canvas() { return this[PRIVATE$2].canvas; }
}

let ARRAY_TYPE = (typeof Float32Array !== 'undefined') ? Float32Array : Array;


const degree = Math.PI / 180;

function create() {
  let out = new ARRAY_TYPE(16);
  if(ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
  }
  out[0] = 1;
  out[5] = 1;
  out[10] = 1;
  out[15] = 1;
  return out;
}

function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  out[9] = a[9];
  out[10] = a[10];
  out[11] = a[11];
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}


function identity(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

function invert(out, a) {
  let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
  let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
  let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
  let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
  let b00 = a00 * a11 - a01 * a10;
  let b01 = a00 * a12 - a02 * a10;
  let b02 = a00 * a13 - a03 * a10;
  let b03 = a01 * a12 - a02 * a11;
  let b04 = a01 * a13 - a03 * a11;
  let b05 = a02 * a13 - a03 * a12;
  let b06 = a20 * a31 - a21 * a30;
  let b07 = a20 * a32 - a22 * a30;
  let b08 = a20 * a33 - a23 * a30;
  let b09 = a21 * a32 - a22 * a31;
  let b10 = a21 * a33 - a23 * a31;
  let b11 = a22 * a33 - a23 * a32;
  let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) {
    return null;
  }
  det = 1.0 / det;
  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  return out;
}


function multiply(out, a, b) {
  let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
  let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
  let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
  let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
  let b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
  out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
  out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
  out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
  out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
  b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
  out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
  out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
  out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
  out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
  b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
  out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
  out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
  out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
  out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
  b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
  out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
  out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
  out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
  out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
  return out;
}

const PRIVATE$3 = Symbol('@@webxr-polyfill/XRDevicePose');
class XRDevicePose {
  constructor(polyfill) {
    this[PRIVATE$3] = {
      polyfill,
      leftViewMatrix: identity(new Float32Array(16)),
      rightViewMatrix: identity(new Float32Array(16)),
      poseModelMatrix: identity(new Float32Array(16)),
    };
  }
  get poseModelMatrix() { return this[PRIVATE$3].poseModelMatrix; }
  getViewMatrix(view) {
    switch (view.eye) {
      case 'left': return this[PRIVATE$3].leftViewMatrix;
      case 'right': return this[PRIVATE$3].rightViewMatrix;
    }
    throw new Error(`view is not a valid XREye`);
  }
  updateFromFrameOfReference(frameOfRef) {
    const pose = this[PRIVATE$3].polyfill.getBasePoseMatrix();
    const leftViewMatrix = this[PRIVATE$3].polyfill.getBaseViewMatrix('left');
    const rightViewMatrix = this[PRIVATE$3].polyfill.getBaseViewMatrix('right');
    if (pose) {
      frameOfRef.transformBasePoseMatrix(this[PRIVATE$3].poseModelMatrix, pose);
    }
    if (leftViewMatrix && rightViewMatrix) {
      frameOfRef.transformBaseViewMatrix(this[PRIVATE$3].leftViewMatrix,
                                         leftViewMatrix,
                                         this[PRIVATE$3].poseModelMatrix);
      frameOfRef.transformBaseViewMatrix(this[PRIVATE$3].rightViewMatrix,
                                         rightViewMatrix,
                                         this[PRIVATE$3].poseModelMatrix);
    }
  }
}

const PRIVATE$4 = Symbol('@@webxr-polyfill/XRViewport');
class XRViewport {
  constructor(target) {
    this[PRIVATE$4] = { target };
  }
  get x() { return this[PRIVATE$4].target.x; }
  get y() { return this[PRIVATE$4].target.y; }
  get width() { return this[PRIVATE$4].target.width; }
  get height() { return this[PRIVATE$4].target.height; }
}

const XREyes = ['left', 'right'];
const PRIVATE$5 = Symbol('@@webxr-polyfill/XRView');
class XRView {
  constructor(polyfill, eye, sessionId) {
    if (!XREyes.includes(eye)) {
      throw new Error(`XREye must be one of: ${XREyes}`);
    }
    const temp = Object.create(null);
    const viewport = new XRViewport(temp);
    this[PRIVATE$5] = {
      polyfill,
      eye,
      viewport,
      temp,
      sessionId,
    };
  }
  get eye() { return this[PRIVATE$5].eye; }
  get projectionMatrix() { return this[PRIVATE$5].polyfill.getProjectionMatrix(this.eye); }
  _getViewport(layer) {
    const viewport = this[PRIVATE$5].viewport;
    if (this[PRIVATE$5].polyfill.getViewport(this[PRIVATE$5].sessionId,
                                           this.eye,
                                           layer,
                                           this[PRIVATE$5].temp)) {
      return this[PRIVATE$5].viewport;
    }
    return undefined;
  }
}

const PRIVATE$6 = Symbol('@@webxr-polyfill/XRFrame');
class XRFrame$1 {
  constructor(polyfill, session, sessionId) {
    const devicePose = new XRDevicePose(polyfill);
    const views = [
      new XRView(polyfill, 'left', sessionId),
    ];
    if (session.immersive) {
      views.push(new XRView(polyfill, 'right', sessionId));
    }
    this[PRIVATE$6] = {
      polyfill,
      devicePose,
      views,
      session,
    };
  }
  get session() { return this[PRIVATE$6].session; }
  get views() { return this[PRIVATE$6].views; }
  getDevicePose(coordinateSystem) {
    this[PRIVATE$6].devicePose.updateFromFrameOfReference(coordinateSystem);
    return this[PRIVATE$6].devicePose;
  }
  getInputPose(inputSource, coordinateSystem) {
    return this[PRIVATE$6].polyfill.getInputPose(inputSource, coordinateSystem);
  }
}

const PRIVATE$7 = Symbol('@@webxr-polyfill/XRStageBoundsPoint');
class XRStageBoundsPoint {
  constructor(x, z) {
    this[PRIVATE$7] = { x, z };
  }
  get x() { return this[PRIVATE$7].x; }
  get z() { return this[PRIVATE$7].z; }
}

const PRIVATE$8 = Symbol('@@webxr-polyfill/XRStageBounds');
class XRStageBounds {
  constructor(boundsData) {
    const geometry = [];
    for (let i = 0; i < boundsData.length; i += 2) {
      geometry.push(new XRStageBoundsPoint(boundsData[i], boundsData[i + 1]));
    }
    this[PRIVATE$8] = { geometry };
  }
  get geometry() { return this[PRIVATE$8].geometry; }
}

class XRCoordinateSystem {
  constructor() {}
  getTransformTo(other) {
    throw new Error('Not yet supported');
  }
}

const DEFAULT_EMULATION_HEIGHT = 1.6;
const PRIVATE$9 = Symbol('@@webxr-polyfill/XRFrameOfReference');
const XRFrameOfReferenceTypes = ['head-model', 'eye-level', 'stage'];
const XRFrameOfReferenceOptions = Object.freeze({
  disableStageEmulation: false,
  stageEmulationHeight: 0,
});
class XRFrameOfReference$1 extends XRCoordinateSystem {
  constructor(polyfill, type, options, transform, bounds) {
    options = Object.assign({}, XRFrameOfReferenceOptions, options);
    if (!XRFrameOfReferenceTypes.includes(type)) {
      throw new Error(`XRFrameOfReferenceType must be one of ${XRFrameOfReferenceTypes}`);
    }
    super();
    if (type === 'stage' && options.disableStageEmulation && !transform) {
      throw new Error(`XRFrameOfReference cannot use 'stage' type, if disabling emulation and platform does not provide`);
    }
    const { disableStageEmulation, stageEmulationHeight } = options;
    let emulatedHeight = 0;
    if (type === 'stage' && !transform) {
      emulatedHeight = stageEmulationHeight !== 0 ? stageEmulationHeight : DEFAULT_EMULATION_HEIGHT;
    }
    if (type === 'stage' && !transform) {
      transform = identity(new Float32Array(16));
      transform[13] = emulatedHeight;
    }
    this[PRIVATE$9] = {
      disableStageEmulation,
      stageEmulationHeight,
      emulatedHeight,
      type,
      transform,
      polyfill,
      bounds,
    };
    this.onboundschange = undefined;
  }
  get bounds() { return this[PRIVATE$9].bounds; }
  get emulatedHeight() { return this[PRIVATE$9].emulatedHeight; }
  get type() { return this[PRIVATE$9].type; }
  transformBasePoseMatrix(out, pose) {
    if (this[PRIVATE$9].transform) {
      multiply(out, this[PRIVATE$9].transform, pose);
      return;
    }
    switch (this.type) {
      case 'head-model':
        if (out !== pose) {
          copy(out, pose);
        }
        out[12] = out[13] = out[14] = 0;
        return;
      case 'eye-level':
        if (out !== pose) {
          copy(out, pose);
        }
        return;
    }
  }
  transformBaseViewMatrix(out, view) {
    let frameOfRef = this[PRIVATE$9].transform;
    if (frameOfRef) {
      invert(out, frameOfRef);
      multiply(out, view, out);
    }
    else if (this.type === 'head-model') {
      invert(out, view);
      out[12] = 0;
      out[13] = 0;
      out[14] = 0;
      invert(out, out);
      return out;
    }
    else {
      copy(out, view);
    }
    return out;
  }
}

const PRIVATE$10 = Symbol('@@webxr-polyfill/XRSession');
const XRSessionCreationOptions = Object.freeze({
  immersive: false,
  outputContext: undefined,
});
const validateSessionOptions = options => {
  const { immersive, outputContext } = options;
  if (!immersive && !outputContext) {
    return false;
  }
  if (outputContext !== undefined && !(outputContext instanceof XRPresentationContext)) {
    return false;
  }
  return true;
};
class XRSession$1 extends EventTarget {
  constructor(polyfill, device, sessionOptions, id) {
    sessionOptions = Object.assign({}, XRSessionCreationOptions, sessionOptions);
    super();
    const { immersive, outputContext } = sessionOptions;
    this[PRIVATE$10] = {
      polyfill,
      device,
      immersive,
      outputContext,
      ended: false,
      suspended: false,
      suspendedCallback: null,
      id,
    };
    const frame = new XRFrame$1(polyfill, this, this[PRIVATE$10].id);
    this[PRIVATE$10].frame = frame;
    this[PRIVATE$10].onPresentationEnd = sessionId => {
      if (sessionId !== this[PRIVATE$10].id) {
        this[PRIVATE$10].suspended = false;
        this.dispatchEvent('focus', { session: this });
        const suspendedCallback = this[PRIVATE$10].suspendedCallback;
        this[PRIVATE$10].suspendedCallback = null;
        if (suspendedCallback) {
          this.requestAnimationFrame(suspendedCallback);
        }
        return;
      }
      this[PRIVATE$10].ended = true;
      polyfill.removeEventListener('@webvr-polyfill/vr-present-end', this[PRIVATE$10].onPresentationEnd);
      polyfill.removeEventListener('@webvr-polyfill/vr-present-start', this[PRIVATE$10].onPresentationStart);
      polyfill.removeEventListener('@@webvr-polyfill/input-select-start', this[PRIVATE$10].onSelectStart);
      polyfill.removeEventListener('@@webvr-polyfill/input-select-end', this[PRIVATE$10].onSelectEnd);
      this.dispatchEvent('end', { session: this });
    };
    polyfill.addEventListener('@@webxr-polyfill/vr-present-end', this[PRIVATE$10].onPresentationEnd);
    this[PRIVATE$10].onPresentationStart = sessionId => {
      if (sessionId === this[PRIVATE$10].id) {
        return;
      }
      this[PRIVATE$10].suspended = true;
      this.dispatchEvent('blur', { session: this });
    };
    polyfill.addEventListener('@@webxr-polyfill/vr-present-start', this[PRIVATE$10].onPresentationStart);
    this[PRIVATE$10].onSelectStart = evt => {
      if (evt.sessionId !== this[PRIVATE$10].id) {
        return;
      }
      this.dispatchEvent('selectstart', {
        frame: this[PRIVATE$10].frame,
        inputSource: evt.inputSource
      });
    };
    polyfill.addEventListener('@@webxr-polyfill/input-select-start', this[PRIVATE$10].onSelectStart);
    this[PRIVATE$10].onSelectEnd = evt => {
      if (evt.sessionId !== this[PRIVATE$10].id) {
        return;
      }
      this.dispatchEvent('selectend', {
        frame: this[PRIVATE$10].frame,
        inputSource: evt.inputSource
      });
      this.dispatchEvent('select',  {
        frame: this[PRIVATE$10].frame,
        inputSource: evt.inputSource
      });
    };
    polyfill.addEventListener('@@webxr-polyfill/input-select-end', this[PRIVATE$10].onSelectEnd);
    this.onblur = undefined;
    this.onfocus = undefined;
    this.onresetpose = undefined;
    this.onend = undefined;
    this.onselect = undefined;
    this.onselectstart = undefined;
    this.onselectend = undefined;
  }
  get device() { return this[PRIVATE$10].device; }
  get immersive() { return this[PRIVATE$10].immersive; }
  get outputContext() { return this[PRIVATE$10].outputContext; }
  get depthNear() { return this[PRIVATE$10].polyfill.depthNear; }
  set depthNear(value) { this[PRIVATE$10].polyfill.depthNear = value; }
  get depthFar() { return this[PRIVATE$10].polyfill.depthFar; }
  set depthFar(value) { this[PRIVATE$10].polyfill.depthFar = value; }
  get environmentBlendMode() {
    return this[PRIVATE$10].polyfill.environmentBlendMode || 'opaque';
  }
  get baseLayer() { return this[PRIVATE$10].baseLayer; }
  set baseLayer(value) {
    if (this[PRIVATE$10].ended) {
      return;
    }
    this[PRIVATE$10].baseLayer = value;
    this[PRIVATE$10].polyfill.onBaseLayerSet(this[PRIVATE$10].id, value);
  }
  async requestFrameOfReference(type, options={}) {
    if (this[PRIVATE$10].ended) {
      return;
    }
    options = Object.assign({}, XRFrameOfReferenceOptions, options);
    if (!XRFrameOfReferenceTypes.includes(type)) {
      throw new TypeError(`XRFrameOfReferenceType must be one of ${XRFrameOfReferenceTypes}`);
    }
    let transform = null;
    let bounds = null;
    try {
      transform = await this[PRIVATE$10].polyfill.requestFrameOfReferenceTransform(type, options);
    } catch (e) {
      if (type !== 'stage' || options.disableStageEmulation) {
        throw e;
      }
    }
    if (type === 'stage' && transform) {
      bounds = this[PRIVATE$10].polyfill.requestStageBounds();
      if (bounds) {
        bounds = new XRStageBounds(bounds);
      }
    }
    return new XRFrameOfReference$1(this[PRIVATE$10].polyfill, type, options, transform, bounds);
  }
  requestAnimationFrame(callback) {
    if (this[PRIVATE$10].ended) {
      return;
    }
    if (this[PRIVATE$10].suspended && this[PRIVATE$10].suspendedCallback) {
      return;
    }
    if (this[PRIVATE$10].suspended && !this[PRIVATE$10].suspendedCallback) {
      this[PRIVATE$10].suspendedCallback = callback;
    }
    return this[PRIVATE$10].polyfill.requestAnimationFrame(() => {
      this[PRIVATE$10].polyfill.onFrameStart(this[PRIVATE$10].id);
      callback(now$1(), this[PRIVATE$10].frame);
      this[PRIVATE$10].polyfill.onFrameEnd(this[PRIVATE$10].id);
    });
  }
  cancelAnimationFrame(handle) {
    if (this[PRIVATE$10].ended) {
      return;
    }
    this[PRIVATE$10].polyfill.cancelAnimationFrame(handle);
  }
  getInputSources() {
    return this[PRIVATE$10].polyfill.getInputSources();
  }
  async end() {
    if (this[PRIVATE$10].ended) {
      return;
    }
    if (!this.immersive) {
      this[PRIVATE$10].ended = true;
      this[PRIVATE$10].polyfill.removeEventListener('@@webvr-polyfill/vr-present-start',
                                                 this[PRIVATE$10].onPresentationStart);
      this[PRIVATE$10].polyfill.removeEventListener('@@webvr-polyfill/vr-present-end',
                                                 this[PRIVATE$10].onPresentationEnd);
      this[PRIVATE$10].polyfill.removeEventListener('@@webvr-polyfill/input-select-start',
                                                 this[PRIVATE$10].onSelectStart);
      this[PRIVATE$10].polyfill.removeEventListener('@@webvr-polyfill/input-select-end',
                                                 this[PRIVATE$10].onSelectEnd);
      this.dispatchEvent('end', { session: this });
    }
    return this[PRIVATE$10].polyfill.endSession(this[PRIVATE$10].id);
  }
}

const PRIVATE$11 = Symbol('@@webxr-polyfill/XRDevice');
class XRDevice$1 extends EventTarget {
  constructor(polyfill) {
    if (!polyfill) {
      throw new Error('XRDevice must receive a PolyfilledXRDevice.');
    }
    super();
    this[PRIVATE$11] = {
      polyfill,
      immersiveSession: null,
      nonImmersiveSessions: new Set(),
    };
    this.ondeactive = undefined;
  }
  async supportsSession(sessionOptions={}) {
    sessionOptions = Object.assign({}, XRSessionCreationOptions, sessionOptions);
    if (!validateSessionOptions(sessionOptions)) {
      return Promise.reject(null);
    }
    if (!this[PRIVATE$11].polyfill.supportsSession(sessionOptions)) {
      return Promise.reject(null);
    }
    return null;
  }
  async requestSession(sessionOptions) {
    sessionOptions = Object.assign({}, XRSessionCreationOptions, sessionOptions);
    if (!validateSessionOptions(sessionOptions)) {
      throw new Error('NotSupportedError');
    }
    if (this[PRIVATE$11].immersiveSession && sessionOptions.immersive) {
      throw new Error('InvalidStateError');
    }
    const sessionId = await this[PRIVATE$11].polyfill.requestSession(sessionOptions);
    const session = new XRSession$1(this[PRIVATE$11].polyfill, this, sessionOptions, sessionId);
    if (sessionOptions.immersive) {
      this[PRIVATE$11].immersiveSession = session;
    } else {
      this[PRIVATE$11].nonImmersiveSessions.add(session);
    }
    const onSessionEnd = () => {
      if (session.immersive) {
        this[PRIVATE$11].immersiveSession = null;
      } else {
        this[PRIVATE$11].nonImmersiveSessions.delete(session);
      }
      session.removeEventListener('end', onSessionEnd);
    };
    session.addEventListener('end', onSessionEnd);
    return session;
  }
}

let domPointROExport = ('DOMPointReadOnly' in _global) ? DOMPointReadOnly : null;
if (!domPointROExport) {
  const PRIVATE = Symbol('@@webxr-polyfill/DOMPointReadOnly');
  domPointROExport = class DOMPointReadOnly {
    constructor(x, y, z, w) {
      if (arguments.length === 1) {
        this[PRIVATE] = {
          x: x.x,
          y: x.y,
          z: x.z,
          w: x.w
        };
      } else if (arguments.length === 4) {
        this[PRIVATE] = {
          x: x,
          y: y,
          z: z,
          w: w
        };
      } else {
        throw new TypeError('Must supply either 1 or 4 arguments')
      }
    }
    get x() { return this[PRIVATE].x }
    get y() { return this[PRIVATE].y }
    get z() { return this[PRIVATE].z }
    get w() { return this[PRIVATE].w }
  };
}
var DOMPointReadOnly$1 = domPointROExport;

class XRRay {
  constructor(origin=new DOMPointReadOnly$1(0, 0, 0, 1),
              direction=new DOMPointReadOnly$1(0, 0, -1, 0),
              transformMatrix=new Float32Array(16)) {
    if (!(origin instanceof DOMPointReadOnly$1)) {
      throw new Error('origin must be a DOMPointReadOnly');
    }
    if (!(direction instanceof DOMPointReadOnly$1)) {
      throw new Error('direction must be a DOMPointReadOnly');
    }
    if (!(transformMatrix instanceof Float32Array)) {
      throw new Error('transformMatrix must be a Float32Array');
    }
    Object.defineProperties(this, {
      origin: {
        value: origin,
        writable: false,
      },
      direction: {
        value: direction,
        writable: false,
      },
      transformMatrix: {
        value: transformMatrix,
        writable: false,
      },
    });
  }
}

const PRIVATE$12 = Symbol('@@webxr-polyfill/XRInputPose');
class XRInputPose {
  constructor(inputSourceImpl, hasGripMatrix) {
    this[PRIVATE$12] = {
      inputSourceImpl,
      targetRay: new XRRay(),
      gripMatrix: hasGripMatrix ? create() : null,
    };
  }
  get targetRay() { return this[PRIVATE$12].targetRay; }
  set targetRay(value) { this[PRIVATE$12].targetRay = value; }
  get emulatedPosition() { return this[PRIVATE$12].inputSourceImpl.emulatedPosition; }
  get gripMatrix() { return this[PRIVATE$12].gripMatrix; }
}

const PRIVATE$13 = Symbol('@@webxr-polyfill/XRInputSource');
class XRInputSource {
  constructor(impl) {
    this[PRIVATE$13] = {
      impl
    };
  }
  get handedness() { return this[PRIVATE$13].impl.handedness; }
  get targetRayMode() { return this[PRIVATE$13].impl.targetRayMode; }
}

class XRLayer {
  constructor() {}
  getViewport(view) {
    return view._getViewport(this);
  }
}

const POLYFILLED_COMPATIBLE_XR_DEVICE = Symbol('@@webxr-polyfill/polyfilled-compatible-xr-device');
const COMPATIBLE_XR_DEVICE= Symbol('@@webxr-polyfill/compatible-xr-device');

const PRIVATE$14 = Symbol('@@webxr-polyfill/XRWebGLLayer');
const XRWebGLLayerInit = Object.freeze({
  antialias: true,
  depth: false,
  stencil: false,
  alpha: true,
  multiview: false,
  framebufferScaleFactor: 0,
});
class XRWebGLLayer extends XRLayer {
  constructor(session, context, layerInit={}) {
    const config = Object.assign({}, XRWebGLLayerInit, layerInit);
    if (!(session instanceof XRSession$1)) {
      throw new Error('session must be a XRSession');
    }
    if (session.ended) {
      throw new Error(`InvalidStateError`);
    }
    if (context[POLYFILLED_COMPATIBLE_XR_DEVICE]) {
      if (context[COMPATIBLE_XR_DEVICE] !== session.device) {
        throw new Error(`InvalidStateError`);
      }
    }
    const framebuffer = context.getParameter(context.FRAMEBUFFER_BINDING);
    super();
    this[PRIVATE$14] = {
      context,
      config,
      framebuffer,
    };
  }
  get context() { return this[PRIVATE$14].context; }
  get antialias() { return this[PRIVATE$14].config.antialias; }
  get depth() { return this[PRIVATE$14].config.depth; }
  get stencil() { return this[PRIVATE$14].config.stencil; }
  get alpha() { return this[PRIVATE$14].config.alpha; }
  get multiview() { return false; }
  get framebuffer() { return this[PRIVATE$14].framebuffer; }
  get framebufferWidth() { return this[PRIVATE$14].context.drawingBufferWidth; }
  get framebufferHeight() { return this[PRIVATE$14].context.drawingBufferHeight; }
  requestViewportScaling(viewportScaleFactor) {
    console.warn('requestViewportScaling is not yet implemented');
  }
}

var API = {
  XR: XR$1,
  XRDevice: XRDevice$1,
  XRSession: XRSession$1,
  XRFrame: XRFrame$1,
  XRView,
  XRViewport,
  XRDevicePose,
  XRLayer,
  XRWebGLLayer,
  XRPresentationContext,
  XRCoordinateSystem,
  XRFrameOfReference: XRFrameOfReference$1,
  XRStageBounds,
  XRStageBoundsPoint,
  XRInputPose,
  XRInputSource,
  XRRay,
};

const polyfillSetCompatibleXRDevice = Context => {
  if (typeof Context.prototype.setCompatibleXRDevice === 'function') {
    return false;
  }
  Context.prototype.setCompatibleXRDevice = function (xrDevice) {
    return new Promise((resolve, reject) => {
      if (xrDevice && typeof xrDevice.requestSession === 'function') {
        resolve();
      } else {
        reject();
      }
    }).then(() => this[COMPATIBLE_XR_DEVICE] = xrDevice);
  };
  return true;
};
const polyfillGetContext = (Canvas, renderContextType) => {
  const getContext = Canvas.prototype.getContext;
  Canvas.prototype.getContext = function (contextType, glAttribs) {
    if (renderContextType && contextType === 'xrpresent') {
      let ctx = getContext.call(this, renderContextType, glAttribs);
      return new XRPresentationContext(this, ctx, glAttribs);
    }
    const ctx = getContext.call(this, contextType, glAttribs);
    ctx[POLYFILLED_COMPATIBLE_XR_DEVICE] = true;
    if (glAttribs && ('compatibleXRDevice' in glAttribs)) {
      ctx[COMPATIBLE_XR_DEVICE] = glAttribs.compatibleXRDevice;
    }
    return ctx;
  };
};

function create$1() {
  let out = new ARRAY_TYPE(3);
  if(ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }
  return out;
}













































const forEach = (function() {
  let vec = create$1();
  return function(a, stride, offset, count, fn, arg) {
    let i, l;
    if(!stride) {
      stride = 3;
    }
    if(!offset) {
      offset = 0;
    }
    if(count) {
      l = Math.min((count * stride) + offset, a.length);
    } else {
      l = a.length;
    }
    for(i = offset; i < l; i += stride) {
      vec[0] = a[i]; vec[1] = a[i+1]; vec[2] = a[i+2];
      fn(vec, vec, arg);
      a[i] = vec[0]; a[i+1] = vec[1]; a[i+2] = vec[2];
    }
    return a;
  };
})();

const isImageBitmapSupported = global =>
  !!(global.ImageBitmapRenderingContext &&
     global.createImageBitmap);

const isMobile = global => {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true;})(global.navigator.userAgent||global.navigator.vendor||global.opera);
  return check;
};

const getXRDevice = async function (global) {
  let device = null;
  if ('xr' in global.navigator) {
    try {
      device = await global.navigator.xr.requestDevice();
    } catch (e) {}
  }
  return device;
};
const requestDevice = async function (global, config) {
  let device = await getXRDevice(global);
  if (device) {
    return device;
  }
  return null;
};

const CONFIG_DEFAULTS = {
  webvr: true,
  cardboard: true,
};
const partials = ['navigator', 'HTMLCanvasElement', 'WebGLRenderingContext'];
class WebXRPolyfill {
  constructor(global, config={}) {
    this.global = global || _global;
    this.config = Object.freeze(Object.assign({}, CONFIG_DEFAULTS, config));
    this.nativeWebXR = 'xr' in this.global.navigator;
    this.injected = false;
    if (!this.nativeWebXR) {
      this._injectPolyfill(this.global);
    }
    else if (this.config.cardboard && isMobile(this.global)) {
      this._patchRequestDevice();
    }
  }
  _injectPolyfill(global) {
    if (!partials.every(iface => !!global[iface])) {
      throw new Error(`Global must have the following attributes : ${partials}`);
    }
    for (const className of Object.keys(API)) {
      if (global[className] !== undefined) {
        console.warn(`${className} already defined on global.`);
      } else {
        global[className] = API[className];
      }
    }
    {
      const polyfilledCtx = polyfillSetCompatibleXRDevice(global.WebGLRenderingContext);
      if (polyfilledCtx) {
        const renderContextType = isImageBitmapSupported(global) ? 'bitmaprenderer' : '2d';
        polyfillGetContext(global.HTMLCanvasElement, renderContextType);
        if (global.OffscreenCanvas) {
          polyfillGetContext(global.OffscreenCanvas, null);
        }
        if (global.WebGL2RenderingContext){
          polyfillSetCompatibleXRDevice(global.WebGL2RenderingContext);
        }
      }
    }
    this.injected = true;
    this._patchRequestDevice();
  }
  _patchRequestDevice() {
    const device = requestDevice(this.global, this.config);
    this.xr = new XR$1(device);
    Object.defineProperty(this.global.navigator, 'xr', {
      value: this.xr,
      configurable: true,
    });
  }
}

const EPSILON$1 = 0.000001;
let ARRAY_TYPE$1 = (typeof Float32Array !== 'undefined') ? Float32Array : Array;


const degree$1 = Math.PI / 180;

function create$2() {
  let out = new ARRAY_TYPE$1(16);
  if(ARRAY_TYPE$1 != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
  }
  out[0] = 1;
  out[5] = 1;
  out[10] = 1;
  out[15] = 1;
  return out;
}
function clone$2(a) {
  let out = new ARRAY_TYPE$1(16);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  out[9] = a[9];
  out[10] = a[10];
  out[11] = a[11];
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}
function copy$2(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  out[9] = a[9];
  out[10] = a[10];
  out[11] = a[11];
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}


function identity$1(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

function invert$1(out, a) {
  let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
  let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
  let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
  let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
  let b00 = a00 * a11 - a01 * a10;
  let b01 = a00 * a12 - a02 * a10;
  let b02 = a00 * a13 - a03 * a10;
  let b03 = a01 * a12 - a02 * a11;
  let b04 = a01 * a13 - a03 * a11;
  let b05 = a02 * a13 - a03 * a12;
  let b06 = a20 * a31 - a21 * a30;
  let b07 = a20 * a32 - a22 * a30;
  let b08 = a20 * a33 - a23 * a30;
  let b09 = a21 * a32 - a22 * a31;
  let b10 = a21 * a33 - a23 * a31;
  let b11 = a22 * a33 - a23 * a32;
  let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) {
    return null;
  }
  det = 1.0 / det;
  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  return out;
}


function multiply$2(out, a, b) {
  let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
  let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
  let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
  let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
  let b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
  out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
  out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
  out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
  out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
  b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
  out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
  out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
  out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
  out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
  b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
  out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
  out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
  out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
  out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
  b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
  out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
  out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
  out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
  out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
  return out;
}











function fromZRotation$1(out, rad) {
  let s = Math.sin(rad);
  let c = Math.cos(rad);
  out[0]  = c;
  out[1]  = s;
  out[2]  = 0;
  out[3]  = 0;
  out[4] = -s;
  out[5] = c;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}


function getTranslation$1(out, mat) {
  out[0] = mat[12];
  out[1] = mat[13];
  out[2] = mat[14];
  return out;
}

function getRotation$1(out, mat) {
  let trace = mat[0] + mat[5] + mat[10];
  let S = 0;
  if (trace > 0) {
    S = Math.sqrt(trace + 1.0) * 2;
    out[3] = 0.25 * S;
    out[0] = (mat[6] - mat[9]) / S;
    out[1] = (mat[8] - mat[2]) / S;
    out[2] = (mat[1] - mat[4]) / S;
  } else if ((mat[0] > mat[5]) && (mat[0] > mat[10])) {
    S = Math.sqrt(1.0 + mat[0] - mat[5] - mat[10]) * 2;
    out[3] = (mat[6] - mat[9]) / S;
    out[0] = 0.25 * S;
    out[1] = (mat[1] + mat[4]) / S;
    out[2] = (mat[8] + mat[2]) / S;
  } else if (mat[5] > mat[10]) {
    S = Math.sqrt(1.0 + mat[5] - mat[0] - mat[10]) * 2;
    out[3] = (mat[8] - mat[2]) / S;
    out[0] = (mat[1] + mat[4]) / S;
    out[1] = 0.25 * S;
    out[2] = (mat[6] + mat[9]) / S;
  } else {
    S = Math.sqrt(1.0 + mat[10] - mat[0] - mat[5]) * 2;
    out[3] = (mat[1] - mat[4]) / S;
    out[0] = (mat[8] + mat[2]) / S;
    out[1] = (mat[6] + mat[9]) / S;
    out[2] = 0.25 * S;
  }
  return out;
}
















function equals$4(a, b) {
  let a0  = a[0],  a1  = a[1],  a2  = a[2],  a3  = a[3];
  let a4  = a[4],  a5  = a[5],  a6  = a[6],  a7  = a[7];
  let a8  = a[8],  a9  = a[9],  a10 = a[10], a11 = a[11];
  let a12 = a[12], a13 = a[13], a14 = a[14], a15 = a[15];
  let b0  = b[0],  b1  = b[1],  b2  = b[2],  b3  = b[3];
  let b4  = b[4],  b5  = b[5],  b6  = b[6],  b7  = b[7];
  let b8  = b[8],  b9  = b[9],  b10 = b[10], b11 = b[11];
  let b12 = b[12], b13 = b[13], b14 = b[14], b15 = b[15];
  return (Math.abs(a0 - b0) <= EPSILON$1*Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
          Math.abs(a1 - b1) <= EPSILON$1*Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
          Math.abs(a2 - b2) <= EPSILON$1*Math.max(1.0, Math.abs(a2), Math.abs(b2)) &&
          Math.abs(a3 - b3) <= EPSILON$1*Math.max(1.0, Math.abs(a3), Math.abs(b3)) &&
          Math.abs(a4 - b4) <= EPSILON$1*Math.max(1.0, Math.abs(a4), Math.abs(b4)) &&
          Math.abs(a5 - b5) <= EPSILON$1*Math.max(1.0, Math.abs(a5), Math.abs(b5)) &&
          Math.abs(a6 - b6) <= EPSILON$1*Math.max(1.0, Math.abs(a6), Math.abs(b6)) &&
          Math.abs(a7 - b7) <= EPSILON$1*Math.max(1.0, Math.abs(a7), Math.abs(b7)) &&
          Math.abs(a8 - b8) <= EPSILON$1*Math.max(1.0, Math.abs(a8), Math.abs(b8)) &&
          Math.abs(a9 - b9) <= EPSILON$1*Math.max(1.0, Math.abs(a9), Math.abs(b9)) &&
          Math.abs(a10 - b10) <= EPSILON$1*Math.max(1.0, Math.abs(a10), Math.abs(b10)) &&
          Math.abs(a11 - b11) <= EPSILON$1*Math.max(1.0, Math.abs(a11), Math.abs(b11)) &&
          Math.abs(a12 - b12) <= EPSILON$1*Math.max(1.0, Math.abs(a12), Math.abs(b12)) &&
          Math.abs(a13 - b13) <= EPSILON$1*Math.max(1.0, Math.abs(a13), Math.abs(b13)) &&
          Math.abs(a14 - b14) <= EPSILON$1*Math.max(1.0, Math.abs(a14), Math.abs(b14)) &&
          Math.abs(a15 - b15) <= EPSILON$1*Math.max(1.0, Math.abs(a15), Math.abs(b15)));
}

function create$3() {
  let out = new ARRAY_TYPE$1(3);
  if(ARRAY_TYPE$1 != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }
  return out;
}




























function transformMat4$1(out, a, m) {
  let x = a[0], y = a[1], z = a[2];
  let w = m[3] * x + m[7] * y + m[11] * z + m[15];
  w = w || 1.0;
  out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
  out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
  out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
  return out;
}








function equals$5(a, b) {
  let a0 = a[0], a1 = a[1], a2 = a[2];
  let b0 = b[0], b1 = b[1], b2 = b[2];
  return (Math.abs(a0 - b0) <= EPSILON$1*Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
          Math.abs(a1 - b1) <= EPSILON$1*Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
          Math.abs(a2 - b2) <= EPSILON$1*Math.max(1.0, Math.abs(a2), Math.abs(b2)));
}







const forEach$1 = (function() {
  let vec = create$3();
  return function(a, stride, offset, count, fn, arg) {
    let i, l;
    if(!stride) {
      stride = 3;
    }
    if(!offset) {
      offset = 0;
    }
    if(count) {
      l = Math.min((count * stride) + offset, a.length);
    } else {
      l = a.length;
    }
    for(i = offset; i < l; i += stride) {
      vec[0] = a[i]; vec[1] = a[i+1]; vec[2] = a[i+2];
      fn(vec, vec, arg);
      a[i] = vec[0]; a[i+1] = vec[1]; a[i+2] = vec[2];
    }
    return a;
  };
})();

class XRAnchor extends EventTarget {
	constructor(transform, uid=null, timestamp = 0){
		super();
		this._uid = uid || XRAnchor._generateUID();
		this._transform = clone$2(transform);
		this._timestamp = timestamp;
		this._poseChanged = true;
		this._deleted = false;
		this._placeholder = false;
	}
	get deleted () { return this._deleted }
	set deleted (value) { this._deleted = value; }
	get placeholder () { return this._placeholder }
	set placeholder (value) { this._placeholder = value; }
	isMesh() { return false }
	get timeStamp () { return this._timestamp }
	get changed () { return this._poseChanged }
	clearChanged() {
		this._poseChanged = false;
	}
	get modelMatrix () {  return this._transform };
	updateModelMatrix (transform, timestamp) {
		this._timestamp = timestamp;
		if (!this._deleted) {
			if (!equals$4(this._transform, transform)) {
				this._poseChanged = true;
				for ( var i = 0; i < 16; i ++ ) {
					this._transform[ i ] = transform[ i ];
				}
				try {
					this.dispatchEvent( "update", { source: this });
				} catch(e) {
					console.error('XRAnchor update event error', e);
				}
			}
		}
	}
	notifyOfRemoval() {
		try {
			this.dispatchEvent( "remove", { source: this });
		} catch(e) {
			console.error('XRAnchor removed event error', e);
		}
	}
	get position(){
		return getTranslation$1(new Float32Array(3), this._poseMatrix)
	}
	get orientation(){
		return getRotation$1(new Float32Array(4), this._poseMatrix)
	}
	get uid(){ return this._uid }
	static _generateUID(){
		return 'anchor-' + new Date().getTime() + '-' + Math.floor((Math.random() * Number.MAX_SAFE_INTEGER))
	}
}

class XRAnchorOffset extends XRAnchor {
	constructor(anchor, offset=null){
		super(offset, null);
		this._anchor = anchor;
		this._timestamp = anchor.timeStamp;
		this._tempArray = new Float32Array(16);
		this._offsetMatrix = create$2();
		if (offset) {
			copy$2(this._offsetMatrix, offset);
		}
		multiply$2(this._transform, anchor.modelMatrix, this._offsetMatrix);
		this._handleAnchorUpdateListener = this._handleAnchorUpdate.bind(this);
		this._notifyOfRemovalListener = this.notifyOfRemoval.bind(this);
		this._handleReplaceAnchorListener = this._handleReplaceAnchor.bind(this);
		anchor.addEventListener("update", this._handleAnchorUpdateListener);
		anchor.addEventListener("removal", this._notifyOfRemovalListener);
		anchor.addEventListener("replaceAnchor", this._handleReplaceAnchorListener);
	}
	_handleReplaceAnchor(detail) {
		this._anchor.removeEventListener("update", this._handleAnchorUpdateListener);
		this._anchor.removeEventListener("removal", this._notifyOfRemovalListener);
		this._anchor.removeEventListener("replaceAnchor", this._handleReplaceAnchorListener);
		this._anchor = detail;
		this._anchor.addEventListener("update", this._handleAnchorUpdateListener);
		this._anchor.addEventListener("removal", this._notifyOfRemovalListener);
		this._anchor.addEventListener("replaceAnchor", this._handleReplaceAnchorListener);
	}
	_handleAnchorUpdate() {
		multiply$2(this._tempArray, this._anchor.modelMatrix, this._offsetMatrix);
		this.updateModelMatrix(this._tempArray, Math.max(this._anchor.timeStamp, this._timestamp));
	}
	get modelMatrix () { return this._transform }
	clearChanged() {
		super.clearChanged();
	}
	get anchor(){ return this._anchor }
	get offsetMatrix(){ return this._offsetMatrix }
	set offsetMatrix(array16){
		copy$2(this._offsetMatrix, array16);
		this._handleAnchorUpdate();
	}
}

var _useGeomArrays = false;
class XRMesh extends XRAnchor {
    static setUseGeomArrays() { _useGeomArrays = true; }
    static useGeomArrays() {return _useGeomArrays}
	constructor(transform, geometry, uid=null, timestamp=0) {
        super(transform, uid, timestamp);
        this._useGeomArrays = _useGeomArrays;
        this._vertexCountChanged = true;
        this._vertexPositionsChanged = true;
        this._triangleIndicesChanged = true;
		this._textureCoordinatesChanged = true;
        this._vertexPositions = [];
        this._triangleIndices = [];
		this._textureCoordinates = [];
        this._vertexNormalsChanged = true;
        this._vertexNormals = [];
        if (geometry) {
            this._geometry = geometry;
            this._updateGeometry(this._geometry);
        }
    }
    isMesh() { return true }
    get changed () {
        return super.changed ||
            this._vertexPositionsChanged ||
            this._vertexNormalsChanged ||
            this._triangleIndicesChanged ||
            this._vertexCountChanged
        }
	clearChanged() {
		super.clearChanged();
        this._vertexPositionsChanged = false;
        this._vertexNormalsChanged = false;
        this._triangleIndicesChanged = false;
        this._vertexCountChanged = false;
	}
    get vertexCountChanged () { return this._vertexCountChanged }
    get vertexPositionsChanged() { return this._vertexPositionsChanged }
    get triangleIndicesChanged () { this._triangleIndicesChanged; }
    get textureCoordinatesChanged () { this._textureCoordinatesChanged; }
    get vertexNormalsChanged () { this._vertexNormalsChanged; }
    get vertexPositions () { return this._vertexPositions }
    get vertexNormals () { return this._vertexNormals }
    get triangleIndices () { return this._triangleIndices}
    get textureCoordinates () { return this._textureCoordinates}
    get vertexCount () { return this._vertexPositions.length }
    get triangleCount () { return this._triangleIndices.length }
    get hasNormals () { return this._vertexNormals.length > 0 }
    get hasTextureCoordinates () { return this._textureCoordinates.length > 0}
    _updateGeometry(geometry) {
        this._geometry = geometry;
        let g = geometry;
        if (g.vertexCount == 0) {
            if (this._vertexPositions.length > 0) {
                this._vertexPositionsChanged = true;
                this._vertexNormalsChanged = true;
                this._triangleIndicesChanged = true;
                this._textureCoordinatesChanged = true;
                this._vertexPositions = [];
                this._vertexNormals = [];
                this.triangleIndices = [];
                this._textureCoordinates = [];
            }
            return
        }
        if (typeof g.vertexCount === 'undefined') {
            console.warn("bad geometry data passed to XRMesh._updateGeometry: no vertex count", g);
            return
        }
        let currentVertexIndex = 0;
        if (this._vertexPositions.length != g.vertexCount * 3) {
            if (typeof g.vertices === 'undefined') {
                console.warn("bad geometry data passed to XRMesh._updateGeometry: no vertices", g);
                return
            }
            this._vertexCountChanged = true;
            this._vertexPositionsChanged = true;
            this._vertexPositions = new Float32Array( g.vertexCount * 3 );
            if (g.textureCoordinates) {
                this._textureCoordinatesChanged = true;
                this._textureCoordinates = new Float32Array( g.vertexCount * 2 );
            }
        } else {
            if (this._useGeomArrays) {
                this._vertexPositionsChanged = (typeof g.vertices != 'undefined') && !XRMesh.arrayFuzzyEquals(this._vertexPositions, g.vertices);
                this._textureCoordinatesChanged = (typeof g.textureCoordinates != 'undefined') && !XRMesh.arrayFuzzyEquals(this._textureCoordinates, g.textureCoordinates);
            } else {
                this._vertexPositionsChanged = false;
                if (g.vertices) {
                    currentVertexIndex = 0;
                    for ( var i = 0, l = g.vertexCount; i < l; i++ ) {
                        if (Math.abs(this._vertexPositions[currentVertexIndex++] - g.vertices[i].x) > EPSILON$1 ||
                            Math.abs(this._vertexPositions[currentVertexIndex++] - g.vertices[i].y) > EPSILON$1 ||
                            Math.abs(this._vertexPositions[currentVertexIndex++] - g.vertices[i].z) > EPSILON$1)
                        {
                            this._vertexPositionsChanged = true;
                            break;
                        }
                    }
                }
                this._textureCoordinatesChanged = false;
                if (g.textureCoordinates) {
                    currentVertexIndex = 0;
                    for ( var i = 0, l = g.vertexCount; i < l; i++ ) {
                        if (Math.abs(this._textureCoordinates[currentVertexIndex++] - g.textureCoordinates[i].x) > EPSILON$1 ||
                            Math.abs(this._textureCoordinates[currentVertexIndex++] - g.textureCoordinates[i].x) > EPSILON$1)
                        {
                            this._textureCoordinatesChanged = true;
                            break;
                        }
                    }
                }
            }
        }
        if (g.triangleCount) {
            if(this._triangleIndices.length != g.triangleCount * 3) {
                this._triangleIndicesChanged = true;
                this._triangleIndices = XRMesh.arrayMax(g.triangleIndices) > 65535 ? new Uint32Array( g.triangleCount * 3) :  new Uint32Array( g.triangleCount * 3);
            } else {
                this._triangleIndicesChanged = g.triangleIndicies && !XRMesh.arrayEquals(this._triangleIndices, g.triangleIndices);
            }
        } else {
            this._triangleIndicesChanged = false;
        }
        if (this._vertexPositionsChanged) {
            if (this._useGeomArrays) {
                this._vertexPositions.set(g.vertices);
            } else {
                currentVertexIndex = 0;
                for (let vertex of g.vertices) {
                    this._vertexPositions[currentVertexIndex++] = vertex.x;
                    this._vertexPositions[currentVertexIndex++] = vertex.y;
                    this._vertexPositions[currentVertexIndex++] = vertex.z;
                }
            }
        }
        if (this._textureCoordinatesChanged) {
			currentVertexIndex = 0;
            if (this._useGeomArrays) {
                this._textureCoordinates.set(g.textureCoordinates);
            } else {
                for (let tc of g.textureCoordinates) {
                    this._textureCoordinates[currentVertexIndex++] = tc.x;
                    this._textureCoordinates[currentVertexIndex++] = tc.y;
                }
			}
        }
        if (this._triangleIndicesChanged) {
            this._triangleIndices.set(g.triangleIndices);
        }
    }
    static arrayMax( array ) {
        if ( array.length === 0 ) return - Infinity;
        var max = array[ 0 ];
        for ( var i = 1, l = array.length; i < l; ++ i ) {
            if ( array[ i ] > max ) max = array[ i ];
        }
        return max;
    }
    static arrayEquals(a, b) {
        if (!a || !b)
            return false;
        if (a.length != b.length)
            return false;
        for (var i = 0, l=a.length; i < l; i++) {
            if (a[i] != b[i]) {
                return false;
            }
        }
        return true;
    }
    static arrayFuzzyEquals(a, b) {
        if (!a || !b)
            return false;
        if (a.length != b.length)
            return false;
        for (var i = 0, l=a.length; i < l; i++) {
            if (Math.abs(a[i] - b[i]) > EPSILON$1) {
                return false;
            }
        }
        return true;
    }
}

class XRFaceMesh extends XRMesh {
    constructor(transform, geometry, blendShapeArray, uid=null, timestamp=0) {
        super(transform, geometry, uid, timestamp);
        this._blendShapes = {};
        this._blendShapesChanged = true;
        this._updateBlendShapes(blendShapeArray);
    }
    get changed () { return super.changed || this._blendShapesChanged }
	clearChanged() {
		super.clearChanged();
		this._blendShapesChanged = false;
	}
    _updateBlendShapes(blendShapeArray) {
        for (let i = 0; i < blendShapeNames.length; i++) {
            let j = blendShapeNames[i];
            var a0 = this._blendShapes[j];
            var b0 = blendShapeArray[i];
            if (Math.abs(a0 - b0) > EPSILON$1) {
                this._blendShapesChanged = true;
                this._blendShapes[j] = b0;
            }
        }
    }
	updateFaceData(transform, geometry, blendShapeArray, timestamp) {
        super.updateModelMatrix(transform, timestamp);
        if (typeof geometry.vertexCount === 'undefined') {
            geometry.vertexCount = geometry.vertices.length / (XRMesh.useGeomArrays() ? 3 : 1);
        }
        this._updateGeometry(geometry);
        this._updateBlendShapes(blendShapeArray);
	}
    get blendShapes() { return this._blendShapes }
}
const blendShapeNames = [
    "browDownLeft",
    "browDownRight",
    "browInnerUp",
    "browOuterUpLeft",
    "browOuterUpRight",
    "cheekPuff",
    "cheekSquintLeft",
    "cheekSquintRight",
    "eyeBlinkLeft",
    "eyeBlinkRight",
    "eyeLookDownLeft",
    "eyeLookDownRight",
    "eyeLookInLeft",
    "eyeLookInRight",
    "eyeLookOutLeft",
    "eyeLookOutRight",
    "eyeLookUpLeft",
    "eyeLookUpRight",
    "eyeSquintLeft",
    "eyeSquintRight",
    "eyeWideLeft",
    "eyeWideRight",
    "jawForward",
    "jawLeft",
    "jawOpen",
    "jawRight",
    "mouthClose",
    "mouthDimpleLeft",
    "mouthDimpleRight",
    "mouthFrownLeft",
    "mouthFrownRight",
    "mouthFunnel",
    "mouthLeft",
    "mouthLowerDownLeft",
    "mouthLowerDownRight",
    "mouthPressLeft",
    "mouthPressRight",
    "mouthPucker",
    "mouthRight",
    "mouthRollLower",
    "mouthRollUpper",
    "mouthShrugLower",
    "mouthShrugUpper",
    "mouthSmileLeft",
    "mouthSmileRight",
    "mouthStretchLeft",
    "mouthStretchRight",
    "mouthUpperUpLeft",
    "mouthUpperUpRight",
    "noseSneerLeft",
    "noseSneerRight"
];

class XRHitResult {
	constructor(hitMatrix=null, hit=null, ts){
		this._hit = hit;
		this._timestamp = ts;
		this._hitMatrix = clone$2(hitMatrix);
	}
	get hitMatrix(){
		return this._hitMatrix
	}
	get timeStamp() { return this._timestamp }
}

class XRImageAnchor extends XRAnchor {}

class XRLightEstimate {
	constructor(){
		this._ambientLightIntensity = 1;
	}
	set ambientIntensity(value){
		this._ambientLightIntensity = value / 1000;
	}
	get ambientIntensity(){
		return this._ambientLightIntensity
	}
	getAmbientColorTemperature(){
		throw new Error('Not implemented')
	}
}

function create$4() {
  let out = new ARRAY_TYPE$1(4);
  if(ARRAY_TYPE$1 != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
  }
  return out;
}

function fromValues$4(x, y, z, w) {
  let out = new ARRAY_TYPE$1(4);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  out[3] = w;
  return out;
}























function transformMat4$2(out, a, m) {
  let x = a[0], y = a[1], z = a[2], w = a[3];
  out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
  out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
  out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
  out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
  return out;
}











const forEach$2 = (function() {
  let vec = create$4();
  return function(a, stride, offset, count, fn, arg) {
    let i, l;
    if(!stride) {
      stride = 4;
    }
    if(!offset) {
      offset = 0;
    }
    if(count) {
      l = Math.min((count * stride) + offset, a.length);
    } else {
      l = a.length;
    }
    for(i = offset; i < l; i += stride) {
      vec[0] = a[i]; vec[1] = a[i+1]; vec[2] = a[i+2]; vec[3] = a[i+3];
      fn(vec, vec, arg);
      a[i] = vec[0]; a[i+1] = vec[1]; a[i+2] = vec[2]; a[i+3] = vec[3];
    }
    return a;
  };
})();

class XRPlaneMesh extends XRMesh {
	constructor(transform, center, extent, alignment, geometry, uid=null, timestamp=0) {
		super(transform, null, uid, timestamp);
		this._center = center;
		this._extent = extent;
		this._alignment = alignment;
		this._planeFeatureChanged = true;
		this._yAxis = fromValues$4(0,1,0, 0);
        this._normal = create$4();
		this._boundaryVerticesChanged = true;
		this._boundaryVertices = [];
		this._geometry = geometry;
		this._updateGeometry(this._geometry);
	}
    get changed () { return super.changed || this._planeFeatureChanged }
	clearChanged() {
		super.clearChanged();
		this._planeFeatureChanged = false;
	}
	updatePlaneData(transform, center, extent, alignment, geometry, timestamp) {
		super.updateModelMatrix(transform, timestamp);
		if (!equals$5(this._center, center) || !equals$5(this._extent, extent) ||
		 	this._alignment) {
			this._center = center;
			this._extent = extent;
			this._alignment = alignment;
			this._planeFeatureChanged = true;
		}
		this._updateGeometry(geometry);
	}
	get center() { return this._center }
	get extent() { return this._extent }
	get alignment() { return this._alignment }
	get boundaryVertices () { return this._boundaryVertices }
	get boundaryVerticesChanged () { return this._boundaryVerticesChanged }
	get boundaryVertexCount () { return this._boundaryVertices.length }
	_updateGeometry(geometry) {
		super._updateGeometry(geometry);
		let g = geometry;
		const n = transformMat4$2(this._normal, this._yAxis, this._transform);
		const nx = n[0], ny = n[1], nz = n[2];
		let currentVertexIndex = 0;
		if (this._boundaryVertices.length != g.boundaryVertexCount * 3) {
			this._boundaryVerticesChanged = true;
			this._boundaryVertices = new Float32Array( g.vertexCount * 3 );
			this._vertexNormalsChanged = true;
			this._vertexNormals = new Float32Array( g.vertexCount * 3 );
		} else {
			this._vertexNormalsChanged = (Math.abs(this._vertexNormals[0] - nx) > EPSILON$1 ||
					Math.abs(this._vertexNormals[1] - ny) > EPSILON$1 ||
					Math.abs(this._vertexNormals[2] - nz) > EPSILON$1);
			if (this._useGeomArrays) {
                this._vertexPositionsChanged = !XRMesh.arrayFuzzyEquals(this._boundaryVertices, g.boundaryVertices);
            } else {
                this._boundaryVerticesChanged = false;
                currentVertexIndex = 0;
                for ( var i = 0, l = g.vertexCount; i < l; i++ ) {
                    if (Math.abs(this._boundaryVertices[currentVertexIndex++] - g.boundaryVertices[i].x) > EPSILON$1 ||
                        Math.abs(this._boundaryVertices[currentVertexIndex++] - g.boundaryVertices[i].y) > EPSILON$1 ||
                        Math.abs(this._boundaryVertices[currentVertexIndex++] - g.boundaryVertices[i].z) > EPSILON$1)
                    {
                        this._boundaryVerticesChanged = true;
                        break
                    }
				}
			}
		}
		if (this._boundaryVerticesChanged) {
            if (this._useGeomArrays) {
                this._boundaryVertices.set(g.boundaryVertices);
            } else {
				currentVertexIndex = 0;
				for (let vertex of g.boundaryVertices) {
					this._boundaryVertices[currentVertexIndex++] = vertex.x;
					this._boundaryVertices[currentVertexIndex++] = vertex.y;
					this._boundaryVertices[currentVertexIndex++] = vertex.z;
				}
			}
		}
		if (this._vertexNormalsChanged) {
			currentVertexIndex = 0;
			for (var i = 0; i < g.vertexCount; i++) {
				this._vertexNormals[currentVertexIndex++] = nx;
				this._vertexNormals[currentVertexIndex++] = ny;
				this._vertexNormals[currentVertexIndex++] = nz;
			}
		}
	}
}

class base64 {
	static decodeLength(input)  {
		return (input.length/4) * 3;
	}
	static decodeArrayBuffer(input, buffer) {
		var bytes = (input.length/4) * 3;
		if (!buffer || buffer.byteLength != bytes) {
			buffer = new ArrayBuffer(bytes);
		}
		this.decode(input, buffer);
		return buffer;
	}
	static removePaddingChars(input){
		var lkey = this._keyStr.indexOf(input.charAt(input.length - 1));
		if(lkey == 64){
			return input.substring(0,input.length - 1);
		}
		return input;
	}
	static decode(input, arrayBuffer) {
		input = this.removePaddingChars(input);
		input = this.removePaddingChars(input);
		var bytes = parseInt((input.length / 4) * 3, 10);
		var uarray;
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;
		var j = 0;
		if (arrayBuffer)
			uarray = new Uint8Array(arrayBuffer);
		else
			uarray = new Uint8Array(bytes);
		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
		for (i=0; i<bytes; i+=3) {
			enc1 = this._keyStr.indexOf(input.charAt(j++));
			enc2 = this._keyStr.indexOf(input.charAt(j++));
			enc3 = this._keyStr.indexOf(input.charAt(j++));
			enc4 = this._keyStr.indexOf(input.charAt(j++));
			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;
			uarray[i] = chr1;
			if (enc3 != 64) uarray[i+1] = chr2;
			if (enc4 != 64) uarray[i+2] = chr3;
		}
		return uarray;
	}
    static encode(buffer) {
	    var base64    = '';
  		var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
		var bytes      = buffer;
		if (buffer instanceof ArrayBuffer) {
			bytes = new Uint8Array(arrayBuffer);
		} else if (buffer instanceof ImageData) {
			bytes = buffer.data;
		}
		var byteLength    = buffer.length;
		var byteRemainder = byteLength % 3;
		var mainLength    = byteLength - byteRemainder;
		var a, b, c, d;
		var chunk;
		for (var i = 0; i < mainLength; i = i + 3) {
			chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
			a = (chunk & 16515072) >> 18;
			b = (chunk & 258048)   >> 12;
			c = (chunk & 4032)     >>  6;
			d = chunk & 63;
			base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
		}
		if (byteRemainder == 1) {
			chunk = bytes[mainLength];
			a = (chunk & 252) >> 2;
			b = (chunk & 3)   << 4;
			base64 += encodings[a] + encodings[b] + '==';
		} else if (byteRemainder == 2) {
			chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];
			a = (chunk & 64512) >> 10;
			b = (chunk & 1008)  >>  4;
			c = (chunk & 15)    <<  2;
			base64 += encodings[a] + encodings[b] + encodings[c] + '=';
		}
		return base64
	}
}
base64._keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

var _ab = [];
class XRVideoFrame {
	constructor(buffers, pixelFormat, timestamp, camera){
		this._buffers = buffers;
        for (var i=0; i< buffers.length; i++) {
            buffers[i]._buffer = buffers[i].buffer;
            buffers[i].buffer = null;
            if (!buffers[i]._abCache && typeof buffers[i]._buffer == "string") {
                var bytes = base64.decodeLength(buffers[i]._buffer);
                for (var j=0; j < _ab.length; j++) {
                    if (_ab[j].byteLength == bytes) {
                        buffers[i]._abCache = _ab[j];
                        _ab.splice(j, 1);
                        break;
                    }
                }
            } else if (!buffers[i]._abCache && buffers[i]._buffer instanceof ImageData) {
                var data = buffers[i]._buffer.data;
                var bytes = data.length;
                for (var j=0; j < _ab.length; j++) {
                    if (_ab[j].byteLength == bytes) {
                        buffers[i]._abCache = _ab[j];
                        _ab.splice(j, 1);
                        break;
                    }
                }
                var ab = buffers[i]._abCache ? buffers[i]._abCache : new ArrayBuffer(bytes);
                buffers[i]._abCache = null;
                var buffData = new Uint8Array(ab);
                for (var k = 0; k < bytes; k++) buffData[k] = data[k];
                buffers[i]._buffer = ab;
            }
        }
		this._pixelFormat = pixelFormat;
		this._timestamp = timestamp;
		this._camera = camera;
	}
    static createFromMessage (event) {
        return new this(event.data.buffers, event.data.pixelFormat, event.data.timestamp, event.data.camera)
    }
    numBuffers() {this._buffers.length;}
    buffer(index) {
        if (index >= 0 && index < this._buffers.length) {
            var buff = this._buffers[index];
            if (!buff.buffer) {
                if (typeof buff._buffer == "string") {
                    buff._buffer = base64.decodeArrayBuffer(buff._buffer, buff._abCache);
                    buff._abCache = null;
                    buff.buffer = new Uint8Array(buff._buffer);
                } else if (buff._buffer instanceof ArrayBuffer) {
                    buff.buffer = new Uint8Array(buff._buffer);
                } else if (buff._buffer instanceof ImageData) {
                    buff.buffer = ImageData.data;
                }
            }
            return buff;
        }
        return null
    }
	get pixelFormat(){ return this._pixelFormat }
	get timestamp(){ return this._timestamp }
	get camera(){ return this._camera }
    release () {
        var buffers = this._buffers;
        for (var i=0; i< buffers.length; i++) {
            if (buffers[i]._buffer instanceof ArrayBuffer && buffers[i]._buffer.byteLength > 0) {
                _ab.push(buffers[i]._buffer);
            }
            if (buffers[i]._abCache instanceof ArrayBuffer && buffers[i]._abCache.byteLength > 0) {
                _ab.push(buffers[i]._abCache);
            }
        }
    }
    postMessageToWorker (worker, options) {
        var msg = Object.assign({}, options || {});
        msg.buffers = this._buffers;
        msg.timestamp = this._timestamp;
        msg.pixelFormat = this._pixelFormat;
        msg.camera = this._camera;
        var buffs = [];
        for (var i = 0; i < msg.buffers.length; i++) {
            msg.buffers[i].buffer = msg.buffers[i]._buffer;
            if (msg.buffers[i]._buffer instanceof ArrayBuffer || msg.buffers[i]._buffer instanceof ImageData) {
                buffs.push(msg.buffers[i]._buffer);
            }
            msg.buffers[i]._buffer = null;
            if (msg.buffers[i]._abCache instanceof ArrayBuffer) {
                buffs.push(msg.buffers[i]._abCache);
            }
        }
        worker.postMessage(msg, buffs);
    }
    postReplyMessage (options) {
        var msg = Object.assign({}, options);
        msg.buffers = this._buffers;
        msg.timestamp = this._timestamp;
        msg.pixelFormat = this._pixelFormat;
        msg.camera = this._camera;
        var buffs = [];
        for (var i = 0; i < msg.buffers.length; i++) {
            msg.buffers[i].buffer = null;
            if (msg.buffers[i]._buffer instanceof ArrayBuffer || msg.buffers[i]._buffer instanceof ImageData) {
                buffs.push(msg.buffers[i]._buffer);
                msg.buffers[i].buffer = msg.buffers[i]._buffer;
            }
            msg.buffers[i]._buffer = null;
            if (msg.buffers[i]._abCache instanceof ArrayBuffer) {
                buffs.push(msg.buffers[i]._abCache);
            }
         }
        postMessage(msg, buffs);
    }
}
XRVideoFrame.IMAGEFORMAT_RGBA32 = "RGBA32";
XRVideoFrame.IMAGEFORMAT_BGRA32 = "BGRA32";
XRVideoFrame.IMAGEFORMAT_RGB24 = "RGB24";
XRVideoFrame.IMAGEFORMAT_BGR24 = "BGR24";
XRVideoFrame.IMAGEFORMAT_GRAY8 = "GRAY8";
XRVideoFrame.IMAGEFORMAT_YUV444P = "YUV444P";
XRVideoFrame.IMAGEFORMAT_YUV422P = "YUV422P";
XRVideoFrame.IMAGEFORMAT_YUV420P = "YUV420P";
XRVideoFrame.IMAGEFORMAT_YUV420SP_NV12 = "YUV420SP_NV12";
XRVideoFrame.IMAGEFORMAT_YUV420SP_NV21 = "YUV420SP_NV21";
XRVideoFrame.IMAGEFORMAT_HSV = "HSV";
XRVideoFrame.IMAGEFORMAT_Lab = "Lab";
XRVideoFrame.IMAGEFORMAT_DEPTH = "DEPTH";
XRVideoFrame.IMAGEFORMAT_NULL = "";
XRVideoFrame.IMAGEFORMAT = [
    XRVideoFrame.IMAGEFORMAT_RGBA32,
    XRVideoFrame.IMAGEFORMAT_BGRA32,
    XRVideoFrame.IMAGEFORMAT_RGB24,
    XRVideoFrame.IMAGEFORMAT_BGR24,
    XRVideoFrame.IMAGEFORMAT_GRAY8,
    XRVideoFrame.IMAGEFORMAT_YUV444P,
    XRVideoFrame.IMAGEFORMAT_YUV422P,
    XRVideoFrame.IMAGEFORMAT_YUV420P,
    XRVideoFrame.IMAGEFORMAT_YUV420SP_NV12,
    XRVideoFrame.IMAGEFORMAT_YUV420SP_NV21,
    XRVideoFrame.IMAGEFORMAT_HSV,
    XRVideoFrame.IMAGEFORMAT_Lab,
    XRVideoFrame.IMAGEFORMAT_DEPTH,
    XRVideoFrame.IMAGEFORMAT_NULL
];

var API$1 = {
    XRAnchor,
    XRAnchorOffset,
    XRFaceMesh,
    XRHitResult,
    XRImageAnchor,
    XRLightEstimate,
    XRMesh,
    XRPlaneMesh,
    XRVideoFrame
}

class PolyfilledXRDevice extends EventTarget {
  constructor(global) {
    super();
    this.global = global;
    this.onWindowResize = this.onWindowResize.bind(this);
    this.global.window.addEventListener('resize', this.onWindowResize);
    this.environmentBlendMode = 'opaque';
  }
  get depthNear() { throw new Error('Not implemented'); }
  set depthNear(val) { throw new Error('Not implemented'); }
  get depthFar() { throw new Error('Not implemented'); }
  set depthFar(val) { throw new Error('Not implemented'); }
  onBaseLayerSet(sessionId, layer) { throw new Error('Not implemented'); }
  supportsSession(options={}) { throw new Error('Not implemented'); }
  async requestSession(options={}) { throw new Error('Not implemented'); }
  requestAnimationFrame(callback) { throw new Error('Not implemented'); }
  onFrameStart(sessionId) { throw new Error('Not implemented'); }
  onFrameEnd(sessionId) { throw new Error('Not implemented'); }
  requestStageBounds() { throw new Error('Not implemented'); }
  async requestFrameOfReferenceTransform(type, options) {
    return undefined;
  }
  cancelAnimationFrame(handle) { throw new Error('Not implemented'); }
  endSession(sessionId) { throw new Error('Not implemented'); }
  getViewport(sessionId, eye, layer, target) { throw new Error('Not implemented'); }
  getProjectionMatrix(eye) { throw new Error('Not implemented'); }
  getBasePoseMatrix() { throw new Error('Not implemented'); }
  getBaseViewMatrix(eye) { throw new Error('Not implemented'); }
  getInputSources() { throw new Error('Not implemented'); }
  getInputPose(inputSource, coordinateSystem) { throw new Error('Not implemented'); }
  onWindowResize() {
    this.onWindowResize();
  }
}

let throttle = function(func, wait, leading=true, trailing=true) {
	var timeout, context, args, result;
	var previous = 0;
	var later = function() {
		previous = leading === false ? 0 : Date.now();
		timeout = null;
		result = func.apply(context, args);
		if (!timeout) context = args = null;
	};
	var throttled = function() {
		var now = Date.now();
		if (!previous && leading === false) previous = now;
		var remaining = wait - (now - previous);
		context = this;
		args = arguments;
		if (remaining <= 0 || remaining > wait) {
		if (timeout) {
			clearTimeout(timeout);
			timeout = null;
		}
		previous = now;
		result = func.apply(context, args);
		if (!timeout) context = args = null;
		} else if (!timeout && trailing !== false) {
		timeout = setTimeout(later, remaining);
		}
		return result
	};
	throttled.cancel = function() {
		clearTimeout(timeout);
		previous = 0;
		timeout = context = args = null;
	};
	return throttled
};
let throttledConsoleLog = throttle(function(...params){
	console.log(...params);
}, 1000);

const PI_OVER_180 = Math.PI / 180.0;
class ARKitWrapper extends EventTarget {
	constructor(){
		super();
		if(ARKitWrapper.HasARKit() === false){
			throw new Error('ARKitWrapper will only work in Mozilla\'s ARDemo test app')
		}
		if(typeof ARKitWrapper.GLOBAL_INSTANCE !== 'undefined'){
			throw new Error('ARKitWrapper is a singleton. Use ARKitWrapper.GetOrCreate() to get the global instance.')
		}
		this._timestamp = 0;
		this._lightIntensity = new XRLightEstimate();
		this._deviceId = null;
		this._isWatching = false;
		this._waitingForSessionStart = false;
		this._isInitialized = false;
		this._rawARData = null;
		this._rAF_callback = null;
		this._rAF_callbackParams = [];
		this._requestedPermissions = {
			cameraAccess: false,
			worldAccess: false
		};
		this._currentPermissions = {
			cameraAccess:  false,
			worldAccess: false
		};
		this._worldSensingState = {
			illuminationDetectionState: false,
			meshDetectionState: false
		};
		this._worldInformation = null;
		this._projectionMatrix = new Float32Array(16);
		this._viewMatrix = new Float32Array(16);
		this._cameraTransform = new Float32Array(16);
		this._anchors = new Map();
		this._anchorOffsets = new Map();
		this._timeOffsets = [];
		this._timeOffset = 0;
		this._timeOffsetComputed = false;
		this._dataBeforeNext = 0;
		this._worldMappingStatus = ARKitWrapper.WEB_AR_WORLDMAPPING_NOT_AVAILABLE;
		this._globalCallbacksMap = {};
		let callbackNames = ['onInit', 'onData'];
		for(let i=0; i < callbackNames.length; i++){
			this._generateGlobalCallback(callbackNames[i], i);
		}
		this._defaultOptions = {
			location: true,
			camera: true,
			objects: true,
			light_intensity: true,
			computer_vision_data: false
		};
		this._m90 = fromZRotation$1(create$2(), 90*PI_OVER_180);
		this._m90neg = fromZRotation$1(create$2(), -90*PI_OVER_180);
		this._m180 = fromZRotation$1(create$2(), 180*PI_OVER_180);
		this._mTemp = create$2();
		let eventCallbacks = [
			['arkitStartRecording', ARKitWrapper.RECORD_START_EVENT],
			['arkitStopRecording', ARKitWrapper.RECORD_STOP_EVENT],
			['arkitDidMoveBackground', ARKitWrapper.DID_MOVE_BACKGROUND_EVENT],
			['arkitWillEnterForeground', ARKitWrapper.WILL_ENTER_FOREGROUND_EVENT],
			['arkitInterrupted', ARKitWrapper.INTERRUPTED_EVENT],
			['arkitInterruptionEnded', ARKitWrapper.INTERRUPTION_ENDED_EVENT],
			['arkitShowDebug', ARKitWrapper.SHOW_DEBUG_EVENT],
			['arkitWindowResize', ARKitWrapper.WINDOW_RESIZE_EVENT],
			['onError', ARKitWrapper.ON_ERROR],
			['arTrackingChanged', ARKitWrapper.AR_TRACKING_CHANGED],
		];
		for(let i=0; i < eventCallbacks.length; i++){
			window[eventCallbacks[i][0]] = (detail) => {
				detail = detail || null;
				try {
					this.dispatchEvent(
						eventCallbacks[i][1],
						new CustomEvent(
							eventCallbacks[i][1],
							{
								source: this,
								detail: detail
							}
						)
					);
				} catch(e) {
					console.error(eventCallbacks[i][0] + ' callback error', e);
				}
			};
		}
		window['onComputerVisionData'] = (detail) => {
			this._onComputerVisionData(detail);
		};
		window['setNativeTime'] = (detail) => {
			this._timeOffsets.push (( performance || Date ).now() - detail.nativeTime);
			this._timeOffsetComputed = true;
			this._timeOffset = 0;
			for (var i = 0; i < this._timeOffsets.length; i++) {
				this._timeOffset += this._timeOffsets[i];
			}
			this._timeOffset = this._timeOffset / this._timeOffsets.length;
		};
		window['userGrantedComputerVisionData'] = (detail) => {
			this._sessionCameraAccess |= detail.granted;
		};
		window['userGrantedWorldSensingData'] = (detail) => {
			this._sessionWorldAccess |= detail.granted;
		};
	}
	static GetOrCreate(options=null){
		if(typeof ARKitWrapper.GLOBAL_INSTANCE === 'undefined'){
			ARKitWrapper.GLOBAL_INSTANCE = new ARKitWrapper();
			options = (options && typeof(options) == 'object') ? options : {};
			let defaultUIOptions = {
				browser: true,
				points: true,
				focus: false,
				rec: true,
				rec_time: true,
				mic: false,
				build: false,
				plane: true,
				warnings: true,
				anchors: false,
				debug: true,
				statistics: false
			};
			let uiOptions = (typeof(options.ui) == 'object') ? options.ui : {};
			options.ui = Object.assign(defaultUIOptions, uiOptions);
			options.geometry_arrays = true;
			XRMesh.setUseGeomArrays();
			ARKitWrapper.GLOBAL_INSTANCE._sendInit(options);
		}
		return ARKitWrapper.GLOBAL_INSTANCE
	}
	static HasARKit(){
		return typeof window.webkit !== 'undefined'
	}
	get deviceId(){ return this._deviceId }
	get hasSession(){ return this._isWatching }
	get isInitialized(){ return this._isInitialized }
	_sendInit(options){
		console.log('----INIT');
		window.webkit.messageHandlers.initAR.postMessage({
			options: options,
			callback: this._globalCallbacksMap.onInit
		});
	}
	waitForInit(){
		return new Promise((resolve, reject) => {
			if(this._isInitialized){
				resolve();
				return
			}
			const callback = () => {
				this.removeEventListener(ARKitWrapper.INIT_EVENT, callback, false);
				resolve();
			};
			this.addEventListener(ARKitWrapper.INIT_EVENT, callback, false);
		})
	}
	_onInit(deviceId){
		this._deviceId = deviceId;
		this._isInitialized = true;
		try {
			this.dispatchEvent(
				ARKitWrapper.INIT_EVENT,
				new CustomEvent(ARKitWrapper.INIT_EVENT, {
					source: this
				})
			);
        } catch(e) {
            console.error('INIT_EVENT event error', e);
        }
	}
	hitTest(x, y, types=ARKitWrapper.HIT_TEST_TYPE_ALL){
		return new Promise((resolve, reject) => {
			if (!this._isInitialized){
				reject(new Error('ARKit is not initialized'));
				return;
			}
			window.webkit.messageHandlers.hitTest.postMessage({
				x: x,
				y: y,
				type: types,
				callback: this._createPromiseCallback('hitTest', resolve)
			});
		})
	}
	pickBestHit(hits){
		if(hits.length === 0) return null
		let planeResults = hits.filter(
			hitTestResult => hitTestResult.type != ARKitWrapper.HIT_TEST_TYPE_FEATURE_POINT
		);
		let planeExistingUsingExtentResults = planeResults.filter(
			hitTestResult => hitTestResult.type == ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANE_USING_EXTENT
		);
		let planeExistingResults = planeResults.filter(
			hitTestResult => hitTestResult.type == ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANE
		);
		if (planeExistingUsingExtentResults.length) {
			planeExistingUsingExtentResults = planeExistingUsingExtentResults.sort((a, b) => a.distance - b.distance);
			return planeExistingUsingExtentResults[0]
		} else if (planeExistingResults.length) {
			planeExistingResults = planeExistingResults.sort((a, b) => a.distance - b.distance);
			return planeExistingResults[0]
		} else if (planeResults.length) {
			planeResults = planeResults.sort((a, b) => a.distance - b.distance);
			return planeResults[0]
		} else {
			return hits[0]
		}
		return null
	}
  _addAnchor(uid, transform){
		return new Promise((resolve, reject) => {
			if (!this._isInitialized){
				reject(new Error('ARKit is not initialized'));
				return;
			}
			window.webkit.messageHandlers.addAnchor.postMessage({
				uuid: uid,
				transform: transform,
				callback: this._createPromiseCallback('addAnchor', resolve)
			});
		})
	}
	createAnchor(anchorInWorldMatrix) {
		return new Promise((resolve, reject) => {
			var tempAnchor = new XRAnchor(anchorInWorldMatrix, null, this._timestamp);
			this._addAnchor(tempAnchor.uid, anchorInWorldMatrix).then(detail => {
				if (detail.error) {
					reject(detail.error);
					return;
				}
				var anchor = this._anchors.get(detail.uuid);
				if(!anchor){
					this._anchors.set(detail.uuid, tempAnchor);
					resolve(tempAnchor);
				}else{
					anchor.placeholder = false;
					anchor.deleted = false;
					anchor.updateModelMatrix(detail.transform, this._timestamp);
					resolve(anchor);
				}
			}).catch((...params) => {
				console.error('could not create anchor', ...params);
				reject();
			});
		});
	}
	createAnchorFromHit(hit) {
		return new Promise((resolve, reject) => {
			if (hit.anchor_transform) {
				let anchor = this._anchors.get(hit.uuid);
				if(!anchor) {
					anchor = new XRAnchor(hit.anchor_transform, hit.uuid, this._timestamp);
					console.log('created dummy anchor from hit test');
					anchor.placeholder = true;
					this._anchors.set(hit.uuid, anchor);
				}
				const anchorOffset = new XRAnchorOffset(anchor, hit.local_transform);
				resolve(anchorOffset);
			} else {
				let anchor = this._anchors.get(hit.uuid);
				if(!anchor){
					anchor = new XRAnchor(hit.world_transform, hit.uuid);
					console.log('created dummy anchor (not a plane) from hit test');
					anchor.placeholder = true;
					this._anchors.set(hit.uuid, anchor);
				} else {
					anchor.placeholder = false;
					anchor.deleted = false;
					console.log('hit test resulted in a hit on an existing anchor, without an offset');
				}
				resolve(anchor);
			}
		})
	}
	removeAnchor(anchor) {
		let _anchor = this._anchors.get(anchor.uid);
		if (_anchor.placeholder) {
			this._anchors.delete(anchor.uid);
			return
		}
		if (_anchor) {
			_anchor.deleted = true;
		}
		if (!anchor instanceof XRAnchorOffset) {
			window.webkit.messageHandlers.removeAnchors.postMessage([anchor.uid]);
		}
	}
  _createDetectionImage(uid, buffer, width, height, physicalWidthInMeters) {
		return new Promise((resolve, reject) => {
            if (!this._isInitialized){
                reject(new Error('ARKit is not initialized'));
                return;
            }
            let b64 = base64.encode(buffer);
            window.webkit.messageHandlers.createImageAnchor.postMessage({
                uid: uid,
                buffer: b64,
                imageWidth: width,
                imageHeight: height,
                physicalWidth: physicalWidthInMeters,
								callback: this._createPromiseCallback('createImageAnchor', resolve)
            });
		})
	}
  createDetectionImage(uid, buffer, width, height, physicalWidthInMeters) {
		return new Promise((resolve, reject) => {
			this._createDetectionImage(uid, buffer, width, height, physicalWidthInMeters).then(detail => {
				if (detail.error) {
					reject(detail.error);
					return;
				}
				if (!detail.created) {
					reject(null);
					return;
				}
				resolve();
			}).catch((...params) => {
				console.error('could not create image', ...params);
				reject();
			});
		});
	}
	_destroyDetectionImage(uid) {
		return new Promise((resolve, reject) => {
            if (!this._isInitialized){
                reject(new Error('ARKit is not initialized'));
                return;
						}
            window.webkit.messageHandlers.destroyImageAnchor.postMessage({
                uid: uid,
								callback: this._createPromiseCallback('destroyImageAnchor', resolve)
            });
		})
	}
  destroyDetectionImage(uid) {
		return new Promise((resolve, reject) => {
			this._destroyDetectionImage(uid).then(detail => {
				if (detail.error) {
					reject(detail.error);
					return;
				}
				resolve();
			}).catch((...params) => {
				console.error('could not destroy image', ...params);
				reject();
			});
		});
	}
	_activateDetectionImage(uid, trackable = false) {
        return new Promise((resolve, reject) => {
            if (!this._isInitialized){
                reject(new Error('ARKit is not initialized'));
                return;
            }
            window.webkit.messageHandlers.activateDetectionImage.postMessage({
								uid: uid,
								trackable: trackable,
                callback: this._createPromiseCallback('activateDetectionImage', resolve)
            });
        })
	}
	activateDetectionImage(uid, trackable = false) {
		return new Promise((resolve, reject) => {
			var anchor = this._anchors.get(uid);
			if (anchor && !anchor.deleted) {
				resolve(anchor);
				return
			}
			this._activateDetectionImage(uid, trackable).then(detail => {
				if (detail.error) {
					reject(detail.error);
					
				}
				if (!detail.activated) {
					reject(null);
					return;
				}
				this._createOrUpdateAnchorObject(detail.imageAnchor);
				detail.imageAnchor.object.deleted = false;
				resolve(detail.imageAnchor.object);
			}).catch((...params) => {
				console.error('could not activate image', ...params);
				reject();
			});
		});
	}
	_deactivateDetectionImage(uid) {
		return new Promise((resolve, reject) => {
				if (!this._isInitialized){
						reject(new Error('ARKit is not initialized'));
						return;
				}
				window.webkit.messageHandlers.deactivateDetectionImage.postMessage({
						uid: uid,
						callback: this._createPromiseCallback('deactivateDetectionImage', resolve)
				});
		})
	}
	deactivateDetectionImage(uid) {
		return new Promise((resolve, reject) => {
			this._deactivateDetectionImage(uid).then(detail => {
				if (detail.error) {
					reject(detail.error);
					
				}
				var anchor = this._anchors.get(uid);
				if (anchor) {
					console.warn("anchor for image target '" + uid + "' still exists after deactivation");
					this.removeAnchor(anchor);
				}
				resolve();
			}).catch((...params) => {
				console.error('could not activate image', ...params);
				reject();
			});
		});
	}
	setNumberOfTrackedImages(count) {
		if (typeof(count) != "number") {
			count = 0;
		}
		window.webkit.messageHandlers.setNumberOfTrackedImages.postMessage({ numberOfTrackedImages: count });
	}
	_getWorldMap() {
		return new Promise((resolve, reject) => {
					if (!this._isInitialized){
							reject(new Error('ARKit is not initialized'));
							return;
					}
					window.webkit.messageHandlers.getWorldMap.postMessage({
							callback: this._createPromiseCallback('getWorldMap', resolve)
					});
		})
	}
	getWorldMap() {
		return new Promise((resolve, reject) => {
			this._getWorldMap().then(ARKitWorldMap => {
				if (ARKitWorldMap.saved === true) {
						resolve(ARKitWorldMap.worldMap);
				} else if (ARKitWorldMap.error !== null) {
						reject(ARKitWorldMap.error);
						return;
				} else {
						reject(null);
						return;
				}
			}).catch((...params) => {
				console.error('could not get world map', ...params);
				reject();
			});
		})
	}
	setWorldMap(worldMap) {
		return new Promise((resolve, reject) => {
					if (!this._isInitialized){
							reject(new Error('ARKit is not initialized'));
							return;
					}
					window.webkit.messageHandlers.setWorldMap.postMessage({
						worldMap: worldMap.worldMap,
							callback: this._createPromiseCallback('setWorldMap', resolve)
					});
		})
	}
	stop(){
		return new Promise((resolve, reject) => {
			if (!this._isWatching){
				resolve();
				return;
			}
			console.log('----STOP');
			window.webkit.messageHandlers.stopAR.postMessage({
				callback: this._createPromiseCallback('stop', resolve)
			});
		})
	}
	watch(options=null){
		return new Promise((resolve, reject) => {
			if (!this._isInitialized){
				reject("ARKitWrapper hasn't been initialized yet");
				return
			}
			if (this._waitingForSessionStart){
				reject("ARKitWrapper startSession called, waiting to finish");
				return
			}
			if(this._isWatching){
				resolve({
					"cameraAccess": this._sessionCameraAccess,
					"worldAccess": this._sessionWorldAccess,
					"webXRAccess": true
				});
				return
			}
			this._waitingForSessionStart = true;
			var newO = Object.assign({}, this._defaultOptions);
			if(options != null) {
				newO = Object.assign(newO, options);
			}
			this._requestedPermissions.cameraAccess = newO.videoFrames;
			this._requestedPermissions.worldAccess = newO.worldSensing;
			if (newO.videoFrames) {
				delete newO.videoFrames;
				newO.computer_vision_data = true;
			}
			const data = {
				options: newO,
				callback: this._createPromiseCallback('requestSession', (results) => {
					if (!results.webXRAccess) {
						reject("user did not give permission to start a webxr session");
						return
					}
					this._waitingForSessionStart = false;
					this._isWatching = true;
					this._currentPermissions.cameraAccess = results.cameraAccess;
					this._currentPermissions.worldAccess = results.worldAccess;
					resolve(results);
				}),
				data_callback: this._globalCallbacksMap.onData
			};
			console.log('----WATCH');
			window.webkit.messageHandlers.requestSession.postMessage(data);
		})
	}
	setUIOptions(options){
		window.webkit.messageHandlers.setUIOptions.postMessage(options);
	}
	_createOrUpdateAnchorObject(element) {
		if(element.plane_center){
			var anchor = this._anchors.get(element.uuid);
			if(!anchor || anchor.placeholder){
				var planeObject = new XRPlaneMesh(element.transform,
					element.plane_center,
					[element.plane_extent.x, element.plane_extent.z],
					element.plane_alignment,
					element.geometry,
					element.uuid, this._timestamp);
				if (anchor) {
					try {
						anchor.dispatchEvent("replaceAnchor",
							new CustomEvent("replaceAnchor", {
								source: anchor,
								detail: planeObject
							})
						);
					} catch(e) {
							console.error('replaceAnchor event error', e);
					}
					console.log('replaced dummy anchor created from hit test with plane');
					this._anchors.delete(element.uuid);
				}
				this._anchors.set(element.uuid, planeObject);
				element.object = planeObject;
			} else if (anchor) {
				anchor.updatePlaneData(element.transform, element.plane_center, [element.plane_extent.x,element.plane_extent.y], element.plane_alignment, element.geometry, this._timestamp);
				element.object = anchor;
			}
		} else {
			var anchor = this._anchors.get(element.uuid);
			if(!anchor || anchor.placeholder) {
				let anchorObject;
				switch (element.type) {
					case ARKitWrapper.ANCHOR_TYPE_FACE:
						anchorObject = new XRFaceMesh(element.transform, element.geometry, element.blendShapes,  element.uuid, this._timestamp);
						break
					case ARKitWrapper.ANCHOR_TYPE_ANCHOR:
						anchorObject = new XRAnchor(element.transform, element.uuid, this._timestamp);
						break
					case ARKitWrapper.ANCHOR_TYPE_IMAGE:
						anchorObject = new XRImageAnchor(element.transform, element.uuid, this._timestamp);
						break
				}
				if (anchor) {
						try {
						anchor.dispatchEvent("replaceAnchor",
							new CustomEvent("replaceAnchor", {
								source: anchor || mesh,
								detail: anchorObject
							})
						);
					} catch(e) {
							console.error('replaceAnchor event error', e);
					}
					console.log('replaced dummy anchor created from hit test with new anchor');
				}
						this._anchors.set(element.uuid, anchorObject);
				element.object = anchorObject;
			} else {
				anchor = anchor;
				switch (element.type) {
					case ARKitWrapper.ANCHOR_TYPE_FACE:
						anchor.updateFaceData(element.transform, element.geometry, element.blendShapes, this._timestamp);
						break
					default:
						anchor.updateModelMatrix(element.transform, this._timestamp);
						break;
				}
				element.object = anchor;
			}
		}
	}
	updateWorldSensingState(options) {
		if (options.hasOwnProperty("illuminationDetectionState") && this._currentPermissions.worldAccess) {
			this._worldSensingState.illuminationDetectionState = options.illuminationDetectionState.enabled || false;
		} else {
			this._worldSensingState.illuminationDetectionState = false;
		}
		if (options.hasOwnProperty("meshDetectionState") && this._currentPermissions.worldAccess) {
			this._worldSensingState.meshDetectionState = options.meshDetectionState.enabled || false;
		} else {
			this._worldSensingState.meshDetectionState = false;
		}
		return this._worldSensingState
	}
	getWorldInformation() {
		if (this._worldInformation) {
			return this._worldInformation
		}
		let state = {};
		if (this._worldSensingState.illuminationDetectionState) {
			state.estimatedLight = this._lightIntensity;
		}
		if (this._worldSensingState.meshDetectionState) {
			state.meshes = [];
			this._anchors.forEach(anchor => {
				if (anchor.isMesh() && !anchor.deleted && !anchor.placeholder) {
					state.meshes.push(anchor);
				}
			});
		}
		this._worldInformation = state;
		return state
	}
	get hasData(){ return this._rawARData !== null }
	_getData(key=null){
		if (!key){
			return this._rawARData
		}
		if(this._rawARData && typeof this._rawARData[key] !== 'undefined'){
			return this._rawARData[key]
		}
		return null
	}
	requestAnimationFrame(callback, ...params) {
		this._rAF_callback = callback;
		this._rAF_callbackParams = params;
	}
	_do_rAF() {
		if (this._rAF_callback) {
			var _callback = this._rAF_callback;
			var _params = this._rAF_callbackParams;
			this._rAF_callback = null;
			this._rAF_callbackParams = [];
			return window.requestAnimationFrame((...params) => {
					this.startingRender();
					try {
						_callback(..._params);
					} catch(e) {
						console.error('application callback error: ', e);
					}
					this.finishedRender();
			})
		}
	}
	finishedRender() {
		this._dataBeforeNext = 0;
		this._anchors.forEach(anchor => {
			anchor.clearChanged();
		});
	}
	startingRender() {
		if (this._dataBeforeNext > 1) {
		}
	}
	_onData(data){
		this._rawARData = data;
		var plane, anchor;
		this._worldInformation = null;
		this._timestamp = this._adjustARKitTime(data.timestamp);
		this._lightIntensity.ambientIntensity = data.light_intensity;
		copy$2(this._cameraTransform, data.camera_transform);
		copy$2(this._viewMatrix, data.camera_view);
		copy$2(this._projectionMatrix, data.projection_camera);
		this._worldMappingStatus = data.worldMappingStatus;
		if(data.newObjects.length){
			for (let i = 0; i < data.newObjects.length; i++) {
				const element = data.newObjects[i];
				var anchor = this._anchors.get(element.uuid);
				if (anchor && anchor.deleted) {
					anchor.deleted = false;
				}
				this._createOrUpdateAnchorObject(element);
			}
		}
		if(data.removedObjects.length){
			for (let i = 0; i < data.removedObjects.length; i++) {
				const element = data.removedObjects[i];
					const anchor = this._anchors.get(element);
					if (anchor) {
						anchor.notifyOfRemoval();
						this._anchors.delete(element);
					} else {
						console.error("app signalled removal of non-existant anchor/plane");
					}
			}
		}
		if(data.objects.length){
			for (let i = 0; i < data.objects.length; i++) {
				const element = data.objects[i];
				this._createOrUpdateAnchorObject(element);
			}
		}
		try {
			this.dispatchEvent(
				ARKitWrapper.WATCH_EVENT,
				new CustomEvent(ARKitWrapper.WATCH_EVENT, {
					source: this,
					detail: this
				})
			);
		} catch(e) {
				console.error('WATCH_EVENT event error', e);
		}
		if (this._rAF_callback) {
			this._do_rAF();
		}
		this._dataBeforeNext++;
	}
	_onStop(){
		this._isWatching = false;
	}
	_adjustARKitTime(time) {
		if (this._timeOffsetComputed) {
			return time + this._timeOffset;
		} else {
			return ( performance || Date ).now()
		}
	}
	_createPromiseCallback(action, resolve){
		const callbackName = this._generateCallbackUID(action);
		window[callbackName] = (data) => {
			delete window[callbackName];
			const wrapperCallbackName = '_on' + action[0].toUpperCase() +
				action.slice(1);
			if (typeof(this[wrapperCallbackName]) == 'function'){
				this[wrapperCallbackName](data);
			}
			resolve(data);
		};
		return callbackName;
	}
	_generateCallbackUID(prefix){
		return 'arkitCallback_' + prefix + '_' + new Date().getTime() +
			'_' + Math.floor((Math.random() * Number.MAX_SAFE_INTEGER))
	}
	_generateGlobalCallback(callbackName, num){
		const name = 'arkitCallback' + num;
		this._globalCallbacksMap[callbackName] = name;
		const self = this;
		window[name] = function(deviceData){
			self['_' + callbackName](deviceData);
		};
	}
	_onComputerVisionData(detail) {
		if (!detail) {
			console.error("detail passed to _onComputerVisionData is null");
			this._requestComputerVisionData();
			return;
		}
		if (!detail.frame || !detail.frame.buffers || detail.frame.buffers.length <= 0) {
			console.error("detail passed to _onComputerVisionData is bad, no buffers");
			this._requestComputerVisionData();
			return;
		}
		detail.camera.arCamera = true;
		var orientation = detail.camera.interfaceOrientation;
		detail.camera.viewMatrix = detail.camera.inverse_viewMatrix;
        switch (orientation) {
			case 1:
				detail.camera.cameraOrientation = -90;
				break;
			case 2:
				detail.camera.cameraOrientation = 90;
				break;
			case 3:
				detail.camera.cameraOrientation = 0;
				break;
			case 4:
				detail.camera.cameraOrientation = 180;
				break;
		}
		switch(detail.frame.pixelFormatType) {
			case "kCVPixelFormatType_420YpCbCr8BiPlanarFullRange":
				detail.frame.pixelFormat = "YUV420P";
				break;
			default:
				detail.frame.pixelFormat = detail.frame.pixelFormatType;
				break;
		}
		var xrVideoFrame = new XRVideoFrame(detail.frame.buffers, detail.frame.pixelFormat, this._adjustARKitTime(detail.frame.timestamp), detail.camera );
		try {
			this.dispatchEvent(
				ARKitWrapper.COMPUTER_VISION_DATA,
				new CustomEvent(
					ARKitWrapper.COMPUTER_VISION_DATA,
					{
						source: this,
						detail: xrVideoFrame
					}
				)
			);
		} catch(e) {
			console.error('COMPUTER_VISION_DATA event error', e);
		}
	}
    _requestComputerVisionData() {
        window.webkit.messageHandlers.requestComputerVisionData.postMessage({});
	}
    _startSendingComputerVisionData() {
        window.webkit.messageHandlers.startSendingComputerVisionData.postMessage({});
	}
    _stopSendingComputerVisionData() {
        window.webkit.messageHandlers.stopSendingComputerVisionData.postMessage({});
	}
}
ARKitWrapper.INIT_EVENT = 'arkit-init';
ARKitWrapper.WATCH_EVENT = 'arkit-watch';
ARKitWrapper.RECORD_START_EVENT = 'arkit-record-start';
ARKitWrapper.RECORD_STOP_EVENT = 'arkit-record-stop';
ARKitWrapper.DID_MOVE_BACKGROUND_EVENT = 'arkit-did-move-background';
ARKitWrapper.WILL_ENTER_FOREGROUND_EVENT = 'arkit-will-enter-foreground';
ARKitWrapper.INTERRUPTED_EVENT = 'arkit-interrupted';
ARKitWrapper.INTERRUPTION_ENDED_EVENT = 'arkit-interruption-ended';
ARKitWrapper.SHOW_DEBUG_EVENT = 'arkit-show-debug';
ARKitWrapper.WINDOW_RESIZE_EVENT = 'arkit-window-resize';
ARKitWrapper.ON_ERROR = 'on-error';
ARKitWrapper.AR_TRACKING_CHANGED = 'ar_tracking_changed';
ARKitWrapper.COMPUTER_VISION_DATA = 'cv_data';
ARKitWrapper.USER_GRANTED_COMPUTER_VISION_DATA = 'user-granted-cv-data';
ARKitWrapper.USER_GRANTED_WORLD_SENSING_DATA = 'user-granted-world-sensing-data';
ARKitWrapper.ORIENTATION_UP = 1;
ARKitWrapper.ORIENTATION_UP_MIRRORED = 2;
ARKitWrapper.ORIENTATION_DOWN = 3;
ARKitWrapper.ORIENTATION_DOWN_MIRRORED = 4;
ARKitWrapper.ORIENTATION_LEFT_MIRRORED = 5;
ARKitWrapper.ORIENTATION_RIGHT = 6;
ARKitWrapper.ORIENTATION_RIGHT_MIRRORED = 7;
ARKitWrapper.ORIENTATION_LEFT = 8;
ARKitWrapper.WEB_AR_WORLDMAPPING_NOT_AVAILABLE = "ar_worldmapping_not_available";
ARKitWrapper.WEB_AR_WORLDMAPPING_LIMITED       = "ar_worldmapping_limited";
ARKitWrapper.WEB_AR_WORLDMAPPING_EXTENDING     = "ar_worldmapping_extending";
ARKitWrapper.WEB_AR_WORLDMAPPING_MAPPED        = "ar_worldmapping_mapped";
ARKitWrapper.HIT_TEST_TYPE_FEATURE_POINT = 1;
ARKitWrapper.HIT_TEST_TYPE_ESTIMATED_HORIZONTAL_PLANE = 2;
ARKitWrapper.HIT_TEST_TYPE_ESTIMATED_VERTICAL_PLANE = 4;
ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANE = 8;
ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANE_USING_EXTENT = 16;
ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANE_USING_GEOMETRY = 32;
ARKitWrapper.HIT_TEST_TYPE_ALL = ARKitWrapper.HIT_TEST_TYPE_FEATURE_POINT |
	ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANE |
	ARKitWrapper.HIT_TEST_TYPE_ESTIMATED_HORIZONTAL_PLANE |
	ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANE_USING_EXTENT;
ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANES = ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANE |
	ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANE_USING_EXTENT;
ARKitWrapper.ANCHOR_TYPE_PLANE = 'plane';
ARKitWrapper.ANCHOR_TYPE_FACE = 'face';
ARKitWrapper.ANCHOR_TYPE_ANCHOR = 'anchor';
ARKitWrapper.ANCHOR_TYPE_IMAGE = 'image';

class ARKitWatcher {
	constructor(arKitWrapper){
		this._subscribed = false;
		this._arKitWrapper = arKitWrapper;
		this.subscribe();
	}
	subscribe(){
		if(this._subscribed) return
		this._subscribed = true;
		this._arKitWrapper.addEventListener(ARKitWrapper.INIT_EVENT, this.handleARKitInit.bind(this));
		this._arKitWrapper.addEventListener(ARKitWrapper.WATCH_EVENT, this.handleARKitUpdate.bind(this));
		this._arKitWrapper.addEventListener(ARKitWrapper.WINDOW_RESIZE_EVENT, this.handleARKitWindowResize.bind(this));
		this._arKitWrapper.addEventListener(ARKitWrapper.ON_ERROR, this.handleOnError.bind(this));
		this._arKitWrapper.addEventListener(ARKitWrapper.AR_TRACKING_CHANGED, this.handleArTrackingChanged.bind(this));
		this._arKitWrapper.addEventListener(ARKitWrapper.COMPUTER_VISION_DATA, this.handleComputerVisionData.bind(this));
	}
	handleARKitInit(){}
	handleARKitUpdate(){}
	handleARKitWindowResize(){}
	handleOnError(){}
	handleArTrackingChanged(){}
	handleComputerVisionData(){}
}

class ARKitDevice extends PolyfilledXRDevice {
	constructor(global){
		super(global);
		this._throttledLogPose = throttle(this.logPose, 1000);
		this._sessions = new Map();
		this._activeSession = null;
		this._wrapperDiv = document.createElement('div');
		this._wrapperDiv.setAttribute('class', 'arkit-device-wrapper');
		document.addEventListener('DOMContentLoaded', ev => {
			document.body.insertBefore(this._wrapperDiv, document.body.firstChild || null);
		});
		this._headModelMatrix = create$2();
		this._projectionMatrix = create$2();
		this._eyeLevelMatrix = identity$1(create$2());
		this._stageMatrix = identity$1(create$2());
		this._stageMatrix[13] = -1.3;
		this._baseFrameSet = false;
		this._frameOfRefRequestsWaiting = [];
		this._depthNear = 0.1;
		this._depthFar = 1000;
		try{
			this._arKitWrapper = ARKitWrapper.GetOrCreate();
			this._arWatcher = new ARWatcher(this._arKitWrapper, this);
		} catch (e){
			console.error('Error initializing the ARKit wrapper', e);
			this._arKitWrapper = null;
			this._arWatcher = null;
		}
	}
	static initStyles() {
		window.addEventListener('DOMContentLoaded', () => {
		  setTimeout(() => {
			try {
			  var styleEl = document.createElement('style');
			  document.head.appendChild(styleEl);
			  var styleSheet = styleEl.sheet;
			  styleSheet.insertRule('.arkit-device-wrapper { z-index: -1; }', 0);
			  styleSheet.insertRule('.arkit-device-wrapper, .xr-canvas { position: absolute; top: 0; left: 0; bottom: 0; right: 0; }', 0);
			  styleSheet.insertRule('.arkit-device-wrapper, .arkit-device-wrapper canvas { width: 100%; height: 100%; padding: 0; margin: 0; -webkit-user-select: none; user-select: none; }', 0);
			} catch(e) {
			  console.error('page error', e);
			}
		  }, 1);
		});
	  }
	get depthNear(){ return this._depthNear }
	set depthNear(val){ this._depthNear = val; }
	get depthFar(){ return this._depthFar }
	set depthFar(val){ this._depthFar = val; }
	supportsSession(options={}){
		return !options.hasOwnProperty("immersive") || !options.immersive
	}
	async requestSession(options={}){
		if(!this.supportsSession(options)){
			console.error('Invalid session options', options);
			return Promise.reject()
		}
		if(!this._arKitWrapper){
			console.error('Session requested without an ARKitWrapper');
			return Promise.reject()
		}
		if(this._activeSession !== null){
			console.error('Tried to start a second active session');
			return Promise.reject()
		}
		var ARKitOptions = {};
		if (options.hasOwnProperty("worldSensing")) {
			ARKitOptions.worldSensing = options.worldSensing;
		}
		if (options.hasOwnProperty("computerVision")) {
			ARKitOptions.videoFrames = options.useComputerVision;
		}
		if (options.hasOwnProperty("alignEUS")) {
			ARKitOptions.alignEUS = options.alignEUS;
		}
		let initResult = await this._arKitWrapper.waitForInit().then(() => {
		}).catch((...params) => {
			console.error("app failed to initialize: ", ...params);
			return Promise.reject()
		});
		let watchResult = await this._arKitWrapper.watch(ARKitOptions).then((results) => {
			const session = new Session(options.outputContext || null);
			this._sessions.set(session.id, session);
			this._activeSession = session;
			return Promise.resolve(session.id)
		}).catch((...params) => {
			console.error("session request failed: ", ...params);
			return Promise.reject()
		});
		return watchResult
	}
	onBaseLayerSet(sessionId, layer){
		this._sessions.get(sessionId).baseLayer = layer;
		this._wrapperDiv.appendChild(layer.context.canvas);
		layer.context.canvas.style.width = "100%";
		layer.context.canvas.style.height = "100%";
	}
	requestAnimationFrame(callback, ...params){
	    this._arKitWrapper.requestAnimationFrame(callback, params);
		}
	cancelAnimationFrame(handle){
		return window.cancelAnimationFrame(handle)
	}
	onFrameStart(sessionId){
	}
	onFrameEnd(sessionId){
	}
	logPose(){
		console.log('pose',
			getTranslation$1(new Float32Array(3), this._headModelMatrix),
			getRotation$1(new Float32Array(4), this._headModelMatrix)
		);
	}
	requestFrameOfReferenceTransform(type, options){
		var that = this;
        return new Promise((resolve, reject) => {
			let enqueueOrExec = function (callback) {
				if (that._baseFrameSet) {
					callback();
				} else {
					that._frameOfRefRequestsWaiting.push(callback);
				}
			};
			switch(type){
				case 'head-model':
					enqueueOrExec(function () {
						resolve(that._headModelMatrix);
					});
					return
				case 'eye-level':
					enqueueOrExec(function () {
						resolve(that._eyeLevelMatrix);
					});
					return
				case 'stage':
					reject(new Error('stage not supported', type));
				default:
					reject(new Error('Unsupported frame of reference type', type));
			}
		})
	}
	endSession(sessionId){
		const session = this._sessions.get(sessionId);
		if(!session || session.ended) return
		session.ended = true;
		if(this._activeSession === session){
			this._activeSession = null;
			this._arKitWrapper.stop();
		}
		if(session.baseLayer !== null){
			this._wrapperDiv.removeChild(session.baseLayer.context.canvas);
		}
	}
	getViewport(sessionId, eye, layer, target){
		const { offsetWidth, offsetHeight } = layer.context.canvas;
		target.x = 0;
		target.y = 0;
		target.width = offsetWidth;
		target.height = offsetHeight;
		return true
	}
	getProjectionMatrix(eye){
		return this._projectionMatrix
	}
	setProjectionMatrix(matrix){
		copy$2(this._projectionMatrix, matrix);
	}
	getBasePoseMatrix(){
		return this._headModelMatrix
	}
	getBaseViewMatrix(eye){
		return this._headModelMatrix
	}
	setBaseViewMatrix(matrix){
		copy$2(this._headModelMatrix, matrix);
		if (!this._baseFrameSet) {
			this._baseFrameSet = true;
			for (let i = 0; i < this._frameOfRefRequestsWaiting.length; i++) {
				const callback = this._frameOfRefRequestsWaiting[i];
				try {
					callback();
				} catch(e) {
					console.error("finalization of reference frame requests failed: ", e);
				}
			}
			this._frameOfRefRequestsWaiting = [];
		}
	}
	requestStageBounds(){
		return null
	}
	getInputSources(){
		return []
	}
	getInputPose(inputSource, coordinateSystem){
		return null
	}
	onWindowResize(){
		this._sessions.forEach((value, key) => {
		});
	}
}
let SESSION_ID = 100;
class Session {
	constructor(outputContext){
		this.ended = null;
		this.outputContext = outputContext;
		this.baseLayer = null;
		this.id = ++SESSION_ID;
	}
}
class ARWatcher extends ARKitWatcher {
	constructor(arKitWrapper, arKitDevice){
		super(arKitWrapper);
		this._arKitDevice = arKitDevice;
	}
	handleARKitUpdate(event){
		this._arKitDevice.setBaseViewMatrix(this._arKitWrapper._cameraTransform);
		this._arKitDevice.setProjectionMatrix(this._arKitWrapper._projectionMatrix);
	}
	handleOnError(...args){
		console.error('ARKit error', ...args);
	}
}

const _workingMatrix = create$2();
const _workingMatrix2 = create$2();
WebXRPolyfill.prototype._patchRequestDevice = function(){
	  var _arKitDevice = new ARKitDevice(this.global);
		this.xr = new XR(new XRDevice(_arKitDevice));
		this.xr._mozillaXRViewer = true;
    Object.defineProperty(this.global.navigator, 'xr', {
      value: this.xr,
      configurable: true,
    });
};
let mobileIndex =  navigator.userAgent.indexOf("Mobile/");
let isWebXRViewer = navigator.userAgent.indexOf("WebXRViewer") !== -1 ||
			((navigator.userAgent.indexOf("iPhone") !== -1 ||  navigator.userAgent.indexOf("iPad") !== -1)
				&& mobileIndex !== -1 && navigator.userAgent.indexOf("AppleWebKit") !== -1
				&& navigator.userAgent.indexOf(" ", mobileIndex) === -1);
const xrPolyfill =  !isWebXRViewer ? null : new WebXRPolyfill(null, {
	webvr: false,
	cardboard: false
});
function _xrFrameOfReferenceGetTransformTo(otherFoR, out){
	return _getTransformTo(this[PRIVATE$9].transform, otherFoR[PRIVATE$9].transform, out)
}
function _getTransformTo(sourceMatrix, destinationMatrix, out){
	invert$1(_workingMatrix, destinationMatrix);
	return multiply$2(out, sourceMatrix, _workingMatrix)
}
function _updateWorldSensingState (options) {
	return _arKitWrapper.updateWorldSensingState(options)
}
function _getWorldInformation () {
	 return  _arKitWrapper.getWorldInformation()
}
async function _xrSessionRequestHitTest(origin, direction, coordinateSystem) {
	if(coordinateSystem.type !== 'head-model'){
		return Promise.reject('Only head-model hit testing is supported')
	}
	if(origin[0] != 0.0 && origin[1] != 0.0 && origin[2] != 0.0) {
		return Promise.reject('Platform only supports hit testing with ray origin = [0,0,0]')
	}
	return new Promise((resolve, reject) => {
		const normalizedScreenCoordinates = _convertRayToARKitScreenCoordinates(direction, _arKitWrapper._projectionMatrix);
		_arKitWrapper.hitTest(...normalizedScreenCoordinates, ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANE_USING_GEOMETRY).then(hits => {
			if(hits.length === 0) resolve([]);
			this.requestFrameOfReference('eye-level').then(eyeLevelFrameOfReference => {
				eyeLevelFrameOfReference.getTransformTo(coordinateSystem, _workingMatrix);
				resolve(hits.map(hit => {
					multiply$2(_workingMatrix2, _workingMatrix, hit.world_transform);
					return new XRHitResult(_workingMatrix2, hit, _arKitWrapper._timestamp)
				}));
			}).catch((...params) => {
				console.error('Error testing for hits', ...params);
				reject();
			});
		}).catch((...params) => {
			console.error('Error testing for hits', ...params);
			reject();
		});
	})
}
async function                          _addAnchor(value, frameOfReference) {
	  if (value instanceof XRHitResult) {
			return _arKitWrapper.createAnchorFromHit(value._hit)
		} else if (value instanceof Float32Array) {
			return new Promise((resolve, reject) => {
				this.requestFrameOfReference('eye-level').then(eyeLevelFrameOfReference => {
					frameOfReference.getTransformTo(eyeLevelFrameOfReference, _workingMatrix);
					const anchorInWorldMatrix = multiply$2(create$2(), _workingMatrix, value);
					_arKitWrapper.createAnchor(anchorInWorldMatrix).then(anchor => {
						resolve(anchor);
					}).catch((...params) => {
						console.error('could not create anchor', ...params);
						reject();
					});
				}).catch((...params) => {
					console.error('could not create eye-level frame of reference', ...params);
					reject();
				});
			});
		}	else {
			return Promise.reject('invalid value passed to addAnchor', value)
		}
}
async function                       _removeAnchor(anchor) {
	return new Promise((resolve, reject) => {
		_arKitWrapper.removeAnchor(anchor);
		resolve();
	})
}
function _setNumberOfTrackedImages (count) {
	return _arKitWrapper.setNumberOfTrackedImages(count)
}
function _createDetectionImage(uid, buffer, width, height, physicalWidthInMeters) {
	return _arKitWrapper.createDetectionImage(uid, buffer, width, height, physicalWidthInMeters)
}
function _destroyDetectionImage(uid) {
	return _arKitWrapper.createDetectionImage(uid)
}
function _activateDetectionImage(uid) {
	return  _arKitWrapper.activateDetectionImage(uid)
}
function _deactivateDetectionImage(uid) {
	return  _arKitWrapper.deactivateDetectionImage(uid)
}
function _getWorldMap() {
	return _arKitWrapper.getWorldMap()
}
function _setWorldMap(worldMap) {
	return _arKitWrapper.setWorldMap(worldMap)
}
function _getWorldMappingStatus() {
	return _arKitWrapper._worldMappingStatus;
}
function _convertRayToARKitScreenCoordinates(ray, projectionMatrix){
	var proj = transformMat4$1(create$3(), ray, projectionMatrix);
	let x = (proj[0] + 1)/2;
	let y = (-proj[1] + 1)/2;
	return [x, y]
}
var _arKitWrapper = null;
function _installExtensions(){
	if(!navigator.xr) return
	_arKitWrapper = ARKitWrapper.GetOrCreate();
	ARKitDevice.initStyles();
	if(window.XRSession){
		XRSession.prototype.requestHitTest = _xrSessionRequestHitTest;
		XRSession.prototype.updateWorldSensingState = _updateWorldSensingState;
		XRSession.prototype.addAnchor = _addAnchor;
		XRSession.prototype.removeAnchor = _removeAnchor;
		XRSession.prototype.nonStandard_createDetectionImage = _createDetectionImage;
		XRSession.prototype.nonStandard_destroyDetectionImage = _destroyDetectionImage;
		XRSession.prototype.nonStandard_activateDetectionImage = _activateDetectionImage;
		XRSession.prototype.nonStandard_deactivateDetectionImage = _deactivateDetectionImage;
		XRSession.prototype.nonStandard_setNumberOfTrackedImages = _setNumberOfTrackedImages;
		XRSession.prototype.nonStandard_getWorldMap = _getWorldMap;
		XRSession.prototype.nonStandard_setWorldMap = _setWorldMap;
		XRSession.prototype.nonStandard_getWorldMappingStatus = _getWorldMappingStatus;
	}
	if(window.XRFrame) {
		Object.defineProperty(XRFrame.prototype, 'worldInformation', { get: _getWorldInformation });
	}
	if(window.XRFrameOfReference){
		XRFrameOfReference.prototype.getTransformTo = _xrFrameOfReferenceGetTransformTo;
	}
	for (const className of Object.keys(API$1)) {
		if (window[className] !== undefined) {
			console.warn(`${className} already defined on global.`);
		} else {
			window[className] = API$1[className];
		}
	}
}
if (xrPolyfill && xrPolyfill.injected) {
	_installExtensions();
}

})));
