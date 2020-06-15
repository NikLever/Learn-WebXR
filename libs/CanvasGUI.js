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
        
        const opacity = css.opacity | 1.0;
		
        const planeMaterial = new MeshBasicMaterial({ transparent: true, opacity });
        this.panelsize = css.panelsize | { width:0.5, height:0.5 }
		const planeGeometry = new PlaneGeometry(this.panelsize.width, this.panelsize.height);
		
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
        
        this.update();
	}
	
    setClip( elm ){
        //const clipPath = new Path2D();
        const pos = (elm.position!==undefined) ? elm.position : { x:0, y: 0 };
        const borderRadius = elm.borderRadius | this.css.borderRadius | 0;
        const width = elm.width | this.css.width;
        const height = elm.height | this.css.height;
        const context = this.context;
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
        
        if (elm===undefined) elm = { };
        
        elm.content = content;
        
        this.content[name] = elm;
        
        update();
    }
    
    get panel(){
        return this.mesh;
    }

    getElementAtLocation( x, y ){
        
    }

    updateCSS( name, property, value ){   
        update();
    }

    hover( x, y ){
        const elm = getElementAtLocation( x, y );
        update();
    }

    select( x, y ){
        const elm = getElementAtLocation( x, y );
        update();
    }
    
	update(){
		if (this.mesh===undefined) return;
		
		let context = this.context;
		
		context.clearRect(0, 0, this.css.width, this.css.height);
        
        const bgColor = ( this.css.body.backgroundColor ) ? this.css.body.backgroundColor : "#000";
        const fontFamily = ( this.css.body.fontFamily ) ? this.css.body.fontFamily : "sans";
        const fontColor = ( this.css.body.fontColor ) ? this.css.body.fontColor : "#fff";
        const fontSize = ( this.css.body.fontSize ) ? this.css.body.fontSize : 30;
        context.fillStyle = bgColor;
        context.save();
        this.setClip(this.css.body);
        context.fillRect( 0, 0, this.css.width, this.css.height);
        context.restore();
        
        const self = this;
        
        Object.entries(this.content).forEach( ([name, content]) => {
            const css = (self.css[name]!==undefined) ? self.css[name] : self.css.body;
            context.clip( css.clipPath );
            
            const pos = (css.position!==undefined) ? css.position : { x: 0, y: 0 };
            const width = (css.width!==undefined) ? css.width : self.css.width;
            const height = (css.height!==undefined) ? css.height : self.css.height;
            
            if ( css.backgroundColor !== undefined){
                context.fillStyle = css.backgroundColor;
                context.fillRect( pos.x, pos.y, width, height );
            }
            
            if (css.type == "text" || css.type == "button"){
                context.fillStyle = css.fontColor | fontColor;
                if (content.toLowerCase().startsWith("<path>")){
                    const code = content.toUpperCase().substring(6, content.length - 7);
                    const tokens = code.split(' ');
                    context.beginPath();
                    while(tokens.length>0){
                        const token = tokens.shift();
                        let cmd;
                        switch(token){
                            case 'M':
                                context.moveTo(tokens.shift(), tokens.shift());
                                break;
                            case 'L':
                                context.moveTo(tokens.shift(), tokens.shift());
                                break;
                            case 'z':
                                context.closePath();
                                break
                        }
                    }
                    context.fill();
                }else{
                    self.wrapText( name, content )
                }
            }
        })
		
		this.texture.needsUpdate = true;
	}
	
	createOffscreenCanvas(w, h) {
		const canvas = document.createElement('canvas');
		canvas.width = w;
		canvas.height = h;
		return canvas;
	}
	
	wrapText(name, txt){
		const words = txt.split(' ');
        let line = '';
		const lines = [];
        const css = (this.css[name]!==undefined) ? this.css[name] : this.css.body;
        const width = (css.width!==undefined) ? css.width : this.css.width;
        const height = (css.height!==undefined) ? css.height : this.css.height;
        const pos = (css.position!==undefined) ? css.position : { x:0, y:0 };
        const rect = { x:pos.x, y:pos.y, width, height};
        const padding = css.padding | this.css.body.padding | 10;
        const fontSize = css.fontSize | this.css.body.fontSize | 30;
        const fontFamily = (css.fontFamily!==undefined) ? css.fontFamily : (this.css.body.fontFamily!==undefined) ? this.css.body.fontFamily : 'sans';
		const maxWidth = rect.width - 2*padding;
		const lineHeight = fontSize + 8;
        
        const context = this.context;
        
		context.font = `${fontSize}pt ${fontFamily}`;
		
        words.forEach( function(word){
			const testLine = `${line}${word} `;
        	const metrics = context.measureText(testLine);
        	const testWidth = metrics.width;
			if (testWidth > maxWidth) {
				lines.push(line);
				line = `${word} `;
			}else {
				line = testLine;
			}
		});
		
		if (line != '') lines.push(line);
		
		let y = rect.height - lines.length * lineHeight;
		const centerX = rect.x + rect.width/2;
        
		lines.forEach( (line) => {
			context.fillText(line, centerX, y);
			y += lineHeight;
		});
	}
}

export { CanvasGUI };