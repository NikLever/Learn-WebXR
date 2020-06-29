import { Mesh, CanvasTexture, MeshBasicMaterial, PlaneGeometry } from './three/three.module.js';

/*An element is defined by 
type: text | button | image | shape
hover: hex
active: hex
position: x, y, left, right, top, bottom
width: pixels, will inherit from body if missing
height: pixels, will inherit from body if missing
overflow: fit | scroll | hidden
textAlign: center | left | right
fontSize: pixels
fontColor: hex
fontFamily: string
padding: pixels
backgroundColor: hex
borderRadius: pixels
clipPath: svg path
border: width color style
*/
class CanvasUI{
	constructor(content, css){
        const defaultcss = {
            panelSize: { width: 1, height: 1},
            width: 512,
            height: 512,
            opacity: 0.7,
            body:{
                fontFamily:'Arial', 
                fontSize:30, 
                padding:20, 
                backgroundColor: '#000', 
                fontColor:'#fff', 
                borderRadius: 6,
                opacity: 0.7
            }
        }
		this.css = (css===undefined) ? defaultcss : css;
        
        if (this.css.width === undefined) this.css.width = 512;
        if (this.css.height === undefined) this.css.height = 512;
        if (this.css.body === undefined) this.css.body = {fontFamily:'Arial', size:30, padding:20, backgroundColor: '#000', fontColor:'#fff', borderRadius: 6};
        
        const canvas = this.createOffscreenCanvas(this.css.width, this.css.height);
        this.context = canvas.getContext('2d');
        this.context.save();
        
        const opacity = ( this.css.opacity !== undefined ) ? this.css.opacity : 0.7;
		
        const planeMaterial = new MeshBasicMaterial({ transparent: true, opacity });
        this.panelSize = ( this.css.panelSize !== undefined) ? this.css.panelSize : { width:1, height:1 }
		const planeGeometry = new PlaneGeometry(this.panelSize.width, this.panelSize.height);
		
		this.mesh = new Mesh(planeGeometry, planeMaterial);
        
        this.texture = new CanvasTexture(canvas);
        this.mesh.material.map = this.texture;
        
        if (content === undefined){
            this.content = { body: "" };
            this.css.body.type = "text";
        }else{
            this.content = content;
        }
        
        this.selectedElements = [ undefined, undefined ];
        
        this.needsUpdate = true;
        
        this.update();
	}
	
    setClip( elm ){
        const context = this.context;
        
        context.restore();
        context.save();
        
        if (elm.clipPath !== undefined){
            const path = new Path2D( elm.clipPath );
            context.clip( path );
        }else{
            const pos = (elm.position!==undefined) ? elm.position : { x:0, y: 0 };
            const borderRadius = elm.borderRadius || 0;
            const width = elm.width || this.css.width;
            const height = elm.height || this.css.height;
           
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
                context.clip();
            }else{
                context.rect( pos.x, pos.y, width, height );
                context.clip();
            }
            
            
        }
        
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

    hover( index = 0, position ){
        if (position === undefined){
            if (this.selectedElements[index] !== undefined){
                this.selectedElements[index] = undefined;
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
                if ( this.selectedElements[index] !== undefined ){
                    this.selectedElements[index] = undefined;
                    this.needsUpdate = true;
                }
            }else if( this.selectedElements[index] !== elm ){
                this.selectedElements[index] = elm;
                this.needsUpdate = true;
            }
        }
         
    }
    
    select( index = 0 ){
        if (this.selectedElements[index] !== undefined){
            if (this.selectedElements[index].onSelect){
                this.selectedElements[index].onSelect();
            }
            this.selectedElements[index] = undefined;
        }
    }
    
	update(){
		if (this.mesh===undefined || !this.needsUpdate) return;
		
		let context = this.context;
		
		context.clearRect(0, 0, this.css.width, this.css.height);
        
        const bgColor = ( this.css.body.backgroundColor ) ? this.css.body.backgroundColor : "#000";
        const fontFamily = ( this.css.body.fontFamily ) ? this.css.body.fontFamily : "Arial";
        const fontColor = ( this.css.body.fontColor ) ? this.css.body.fontColor : "#fff";
        const fontSize = ( this.css.body.fontSize ) ? this.css.body.fontSize : 30;
        this.setClip(this.css.body);
        context.fillStyle = bgColor;
        context.fillRect( 0, 0, this.css.width, this.css.height);
        
        const self = this;
        
        Object.entries(this.content).forEach( ([name, content]) => {
            const css = (self.css[name]!==undefined) ? self.css[name] : self.css.body;
            const display = (css.display !== undefined) ? css.display : 'block';
            
            if (display !== 'none'){
                const pos = (css.position!==undefined) ? css.position : { x: 0, y: 0 };
                if (pos.left !== undefined && pos.x === undefined ) pos.x = pos.left;
                if (pos.top !== undefined && pos.y === undefined ) pos.y = pos.top;
                
                const width = (css.width!==undefined) ? css.width : self.css.width;
                const height = (css.height!==undefined) ? css.height : self.css.height;

                if (pos.right !== undefined && pos.x === undefined ) pos.x = self.css.width - pos.right - width;
                if (pos.bottom !== undefined && pos.y === undefined ) pos.y = self.css.height - pos.bottom - height;
                if (pos.x === undefined) pos.x = 0;
                if (pos.y === undefined) pos.y = 0;
                
                if (css.type == "button" && !content.toLowerCase().startsWith("<path>")){
                    if ( css.borderRadius === undefined) css.borderRadius = 6;
                    if ( css.textAlign === undefined ) css.textAlign = "center";
                }
                
                self.setClip( css );
                
                const svgPath = content.toLowerCase().startsWith("<path>");
                const hover = ((self.selectedElements[0] !== undefined && this.selectedElements[0] === css)||(self.selectedElements[1] !== undefined && this.selectedElements[1] === css));
                
                if ( css.backgroundColor !== undefined){
                    if (hover && css.type== "button" && css.hover !== undefined){
                        context.fillStyle = css.hover;
                    }else{
                        context.fillStyle = css.backgroundColor;
                    }
                    context.fillRect( pos.x, pos.y, width, height );
                }

                if (css.type == "text" || css.type == "button"){
                    let stroke = false;
                    if (hover){
                        if (!svgPath && css.type == "button"){
                            context.fillStyle = (css.fontColor !== undefined) ? css.fontColor : fontColor;
                        }else{
                            context.fillStyle = (css.hover !== undefined) ? css.hover : ( css.fontColor !== undefined) ? css.fontColor : fontColor;
                        }
                        stroke = (css.hover === undefined);
                    }else{
                        context.fillStyle = (css.fontColor !== undefined) ? css.fontColor : fontColor;
                    }
                    
                    if ( svgPath ){
                        const code = content.toUpperCase().substring(6, content.length - 7);
                        context.save();
                        context.translate( pos.x, pos.y );
                        const path = new Path2D(code);
                        context.fill(path);
                        context.restore();
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
                }else if (css.type == "img"){
                    if (css.img === undefined){
                        this.loadImage(content).then(img =>{
                            console.log(`w: ${img.width} | h: ${img.height}`);
                            css.img = img;
                            self.needsUpdate = true;
                            self.update();           
                        }).catch(err => console.error(err));
                    }else{
                        const aspect = css.img.width/css.img.height;
                        const h = width/aspect;
                        context.drawImage( css.img, pos.x, pos.y, width, h );           
                    }
                }
            }
        })
		
        this.needsUpdate = false;
		this.texture.needsUpdate = true;
	}
	
    loadImage(src) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.addEventListener("load", () => resolve(img));
        img.addEventListener("error", err => reject(err));
        img.src = src;
      });
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
        const paddingTop = (css.paddingTop!==undefined) ? css.paddingTop : padding;
        const paddingLeft = (css.paddingLeft!==undefined) ? css.paddingLeft : padding;
        const paddingBottom = (css.paddingBottom!==undefined) ? css.paddingBottom : padding;
        const paddingRight = (css.paddingRight!==undefined) ? css.paddingRight : padding;
        const rect = { x:pos.x+paddingLeft, y:pos.y+paddingTop, width: width - paddingLeft - paddingRight, height: height - paddingTop - paddingBottom };
        const textAlign = (css.textAlign !== undefined) ? css.textAlign : (this.css.body.textAlign !== undefined) ? this.css.body.textAlign : "left";
        const fontSize = (css.fontSize !== undefined ) ? css.fontSize : ( this.css.body.fontSize !== undefined) ? this.css.body.fontSize : 30;
        const fontFamily = (css.fontFamily!==undefined) ? css.fontFamily : (this.css.body.fontFamily!==undefined) ? this.css.body.fontFamily : 'Arial';
        const leading = (css.leading !== undefined) ? css.leading : (this.css.body.leading !== undefined) ? this.css.body.leading : 8;
		const lineHeight = fontSize + leading;
        
        const context = this.context;
        
        context.textAlign = textAlign;
        
		context.font = `${fontSize}px '${fontFamily}'`;
		
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

export { CanvasUI };