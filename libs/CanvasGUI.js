import { Mesh, CanvasTexture, MeshBasicMaterial, PlaneGeometry } from './three/three.module.js';

/*An element is defined by 
type: text|image|shape|button
hover: hex
active: hex
position: x,y in pixels of canvas
width: pixels
height: pixels
overflow: fit | scroll | hidden
textAlign: center | left | right
fontSize: pixels
fontColor: hex
fontFamily: string
padding: pixels
backgroundColor: hex
borderRadius: pixels
border: width color style
*/
class CanvasGUI{
	constructor(content, css){
		this.css = (css===undefined) ? { width:256, height:256, body:{fontFamily:'sans', size:30, padding:10, backgroundColor: '#000', fontColor:'#fff'} } : css;
        
        if (this.css.width === undefined) this.css.width = 256;
        if (this.css.height === undefined) this.css.height = 256;
        if (this.css.body === undefined) this.css.body = {fontFamily:'sans', size:30, padding:10, backgroundColor: '#000', fontColor:'#fff', borderRadius: 6};
        
        const canvas = this.createOffscreenCanvas(this.css.width, this.css.height);
        this.context = canvas.getContext('2d');
        this.context.save();
        
        const opacity = css.opacity | 1.0;
		
        const planeMaterial = new MeshBasicMaterial({ transparent: true, opacity });
        this.panelSize = ( css.panelSize !== undefined) ? css.panelSize : { width:0.5, height:0.5 }
		const planeGeometry = new PlaneGeometry(this.panelSize.width, this.panelSize.height);
		
		this.mesh = new Mesh(planeGeometry, planeMaterial);
        
        this.texture = new CanvasTexture(canvas);
        this.mesh.material.map = this.texture;
        
        const self = this;

        Object.entries(this.css).forEach( ([name, value ]) => {
           if (typeof value === 'object'){
               if (name!=='panelSize'){
                   //self.setElementClipPath( value );
               }
           } 
        });

        this.content = content;
        this.needsUpdate = true;
        
        this.update();
	}
	
    setClip( elm ){
        const pos = (elm.position!==undefined) ? elm.position : { x:0, y: 0 };
        const borderRadius = elm.borderRadius | 0;
        const width = elm.width | this.css.width;
        const height = elm.height | this.css.height;
        const context = this.context;
        context.restore();
        context.save();
        context.beginPath();
        if (borderRadius !== 0){
            const angle = Math.PI/2;
            //start top left
            context.moveTo(pos.x + borderRadius, pos.y );
            context.arc( pos.x + borderRadius, pos.y + borderRadius, borderRadius, angle, angle*2, true);
            context.lineTo( pos.x, pos.y + height - borderRadius );
            context.arc( pos.x + borderRadius, pos.y + height - borderRadius, borderRadius, 0, angle, true);
            context.lineTo( pos.x + width - borderRadius, pos.y + height);
            context.arc( pos.x + width - borderRadius, pos.y + height - borderRadius, borderRadius, angle*3, angle*4, true);
            context.lineTo( pos.x + width, pos.y + borderRadius );
            context.arc( pos.x + width - borderRadius, pos.y + borderRadius, borderRadius, angle*2, angle*3, true);
            context.closePath();
        }else{
            context.rect( pos.x, pos.y, width, height );
        }
        context.clip();
    }

    setPosition(x, y, z){
        if (this.mesh === undefined) return;
        this.mesh.position.set(x, y, z);
    }

    setRotation(x, y, z){
        if (this.mesh === undefined) return;
        this.mesh.rotation.set(x, y, z);
    }

    updateElement( name, content ){
        let elm = this.content[name];
        
        if (elm===undefined){
            console.warn( `CanvasGUI.updateElement: No ${name} found`);
            return;
        }
        
        if (typeof elm === 'object'){
            elm.content = content;
        }else{
            elm = content;
        }
        
        this.content[name] = elm;
        
        this.needsUpdate = true;
    }
    
    get panel(){
        return this.mesh;
    }

    getElementAtLocation( x, y ){
        const self = this;
        const elms = Object.entries( this.css ).filter( ([ name, elm ]) => {
            if (typeof elm === 'object' && name !== 'panelSize' && name !== 'body'){
                const pos = elm.position;
                const width = (elm.width !== undefined) ? elm.width : self.css.width;
                const height = (elm.height !== undefined) ? elm.height : self.css.height;
                return (x>=pos.x && x<(pos.x+width) && y>=pos.y && y<(pos.y + height));
            }
        });
        const elm = (elms.length==0) ? null : this.css[elms[0][0]];
        //console.log(`selected = ${elm}`);
        return elm;
    }

    updateCSS( name, property, value ){  
        let elm = this.css[name];
        
        if (elm===undefined){
            console.warn( `CanvasGUI.updateCSS: No ${name} found`);
            return;
        }
        
        elm[property] = value;
        
        this.needsUpdate = true;
    }

    hover( position ){
        if (position === undefined){
            if (this.selectedElement !== undefined){
                this.selectedElement = undefined;
                this.needsUpdate = true;
            }
        }else{
            const localPos = this.mesh.worldToLocal( position );
            //Convert + and - half panelSize to 0 to 1
            localPos.x /= this.panelSize.width;
            localPos.y /= this.panelSize.height;
            localPos.addScalar(0.5);
            //Invert the y axis
            localPos.y = 1 - localPos.y;
            const x = localPos.x * this.css.width;
            const y = localPos.y * this.css.height;
            //console.log( `hover localPos:${localPos.x.toFixed(2)},${localPos.y.toFixed(2)}>>texturePos:${x.toFixed(0)}, ${y.toFixed(0)}`);
            const elm = this.getElementAtLocation( x, y );
            if (elm===null){
                if ( this.selectedElement !== undefined ){
                    this.selectedElement = undefined;
                    this.needsUpdate = true;
                }
            }else if( this.selectedElement !== elm ){
                this.selectedElement = elm;
                this.needsUpdate = true;
            }
        }
         
    }
    
    select( ){
        if (this.selectedElement !== undefined){
            if (this.selectedElement.onSelect){
                this.selectedElement.onSelect();
            }
            this.selectedElement = undefined;
        }
    }
    
	update(){
		if (this.mesh===undefined || !this.needsUpdate) return;
		
		let context = this.context;
		
		context.clearRect(0, 0, this.css.width, this.css.height);
        
        const bgColor = ( this.css.body.backgroundColor ) ? this.css.body.backgroundColor : "#000";
        const fontFamily = ( this.css.body.fontFamily ) ? this.css.body.fontFamily : "sans";
        const fontColor = ( this.css.body.fontColor ) ? this.css.body.fontColor : "#fff";
        const fontSize = ( this.css.body.fontSize ) ? this.css.body.fontSize : 30;
        context.fillStyle = bgColor;
        context.restore();
        this.setClip(this.css.body);
        context.fillRect( 0, 0, this.css.width, this.css.height);
        
        const self = this;
        
        Object.entries(this.content).forEach( ([name, content]) => {
            const css = (self.css[name]!==undefined) ? self.css[name] : self.css.body;
            const display = (css.display !== undefined) ? css.display : 'block';
            
            if (display !== 'none'){
                context.restore();         
                self.setClip( css );

                const pos = (css.position!==undefined) ? css.position : { x: 0, y: 0 };
                const width = (css.width!==undefined) ? css.width : self.css.width;
                const height = (css.height!==undefined) ? css.height : self.css.height;

                if ( css.backgroundColor !== undefined){
                    context.fillStyle = css.backgroundColor;
                    context.fillRect( pos.x, pos.y, width, height );
                }

                if (css.type == "text" || css.type == "button"){
                    let stroke = false;
                    if (self.selectedElement !== undefined && this.selectedElement === css){
                        context.fillStyle = (css.hover !== undefined) ? css.hover : ( css.fontColor !== undefined) ? css.fontColor : fontColor;
                        stroke = (css.hover === undefined);
                    }else{
                        context.fillStyle = (css.fontColor !== undefined) ? css.fontColor : fontColor;
                    }
                    
                    if (content.toLowerCase().startsWith("<path>")){
                        const code = content.toUpperCase().substring(6, content.length - 7);
                        const tokens = code.split(' ');
                        context.beginPath();
                        while(tokens.length>0){
                            const token = tokens.shift();
                            let cmd;
                            switch(token){
                                case 'M':
                                    context.moveTo(Number(tokens.shift()) + pos.x, Number(tokens.shift()) + pos.y);
                                    break;
                                case 'L':
                                    context.lineTo(Number(tokens.shift()) + pos.x, Number(tokens.shift()) + pos.y);
                                    break;
                                case 'Z':
                                    context.closePath();
                                    break
                            }
                        }
                        context.fill();
                    }else{
                        self.wrapText( name, content )
                    }

                    if (stroke){
                        context.beginPath();
                        context.strokeStyle = "#fff";
                        context.lineWidth = 2;
                        context.rect( pos.x, pos.y, width, height);
                        context.stroke();
                    }
                }
            }
        })
		
        this.needsUpdate = false;
		this.texture.needsUpdate = true;
	}
	
	createOffscreenCanvas(w, h) {
		const canvas = document.createElement('canvas');
		canvas.width = w;
		canvas.height = h;
		return canvas;
	}
	
	wrapText(name, txt){
        //console.log( `wrapText: ${name}:${txt}`);
		const words = txt.split(' ');
        let line = '';
		const lines = [];
        const css = (this.css[name]!==undefined) ? this.css[name] : this.css.body;
        const width = (css.width!==undefined) ? css.width : this.css.width;
        const height = (css.height!==undefined) ? css.height : this.css.height;
        const pos = (css.position!==undefined) ? css.position : { x:0, y:0 };
        const padding = (css.padding!==undefined) ? css.padding : (this.css.body.padding!==undefined) ? this.css.body.padding : 10;
        const rect = { x:pos.x+padding, y:pos.y+padding, width: width - 2*padding, height: height - 2*padding};
        const textAlign = (css.textAlign !== undefined) ? css.textAlign : (this.css.body.textAlign !== undefined) ? this.css.body.textAlign : "left";
        const fontSize = (css.fontSize !== undefined ) ? css.fontSize : ( this.css.body.fontSize !== undefined) ? this.css.body.fontSize : 30;
        const fontFamily = (css.fontFamily!==undefined) ? css.fontFamily : (this.css.body.fontFamily!==undefined) ? this.css.body.fontFamily : 'Arial';
        const leading = (css.leading !== undefined) ? css.leading : (this.css.body.leading !== undefined) ? this.css.body.leading : 8;
		const lineHeight = fontSize + leading;
        
        const context = this.context;
        
        context.textAlign = textAlign;
        
		context.font = `${fontSize}px ${fontFamily}`;
		
        words.forEach( function(word){
			let testLine = `${line}${word} `;
        	let metrics = context.measureText(testLine);
        	if (metrics.width > rect.width) {
                if (line.length==0 && metrics.width > rect.width){
                    //word too long
                    while(metrics.width > rect.width){
                        let count = 0;
                        do{
                            count++
                            testLine = word.substr(0, count);
                            metrics = context.measureText(testLine);
                        }while(metrics.width < rect.width && count < (word.length-1));
                        count--;
                        testLine = word.substr(0, count);
                        lines.push( testLine );
                        word = word.substr(count);
                        metrics = context.measureText(word);
                    }
                    if (word != "") lines.push(word);
                }else{
				    lines.push(line);
				    line = `${word} `;
                }
			}else {
				line = testLine;
			}
		});
		
		if (line != '') lines.push(line);
		
		let y = rect.y + fontSize/2;
		let x;
        
        switch( textAlign ){
            case "center":
                x = rect.x + rect.width/2;
                break;
            case "right":
                x = rect.x + rect.width;
                break;
            default:
                x = rect.x;
                break;
        }
        
		lines.forEach( (line) => {
            context.fillText(line, x, y);
			y += lineHeight;
		});
	}
}

export { CanvasGUI };