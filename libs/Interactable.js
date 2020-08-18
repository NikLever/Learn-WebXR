import {Mesh} from './three/three.module.js';
import {Tween} from './toon3D.js';

class Interactable{
    /*options
    mode: tweens | highlight | pickup
        tween:
            target, channel, start, end, duration
    */
    constructor(mesh, options){
        this.mesh = mesh;
        this.options = options;
        this.tweens = [];
        this.delta = 0;
    }
    
    set delta( value ){
        //Only applies to tween interactable
        if (!this.options || !this.options.mode=='tweens') return;
        
        if ( value<0 ) value = 0;
        if ( value>1 ) value = 1;
        
        const tweens = this.options.tweens;
        tweens.forEach( tween => {
            tween.target[tween.channel] = (tween.end - tween.start) * delta + tween.start;
        });
    }
    
    onComplete(){
        this.tweens = [];
    }
    
    set play(value){
        //Only applies to tween interactable
        if (!this.options || !this.options.mode=='tweens') return;
        
        const tweens = this.options.tweens;
            
        switch(value){
            case 0:
                //stop
                this.tweens = [];
                break;
            case 1:
                tweens.forEach( tween => {
                    const target = tween.target;
                    target[tween.channel] = tween.start;
                    this.tweens.push( new Tween(target, tween.channel, tween.end, tween.duration, this.onComplete.bind(this) ) );
                });
                break;
            case -1:
                tweens.forEach( tween => {
                    const target = tween.target;
                    target[tween.channel] = tween.end;
                    this.tweens.push( new Tween(target, tween.channel, tween.start, tween.duration, this.onComplete.bind(this) ) );
                });
                break;
        }
    }
    
    update(){
        this.tweens.forEach( tween => tween.update() );
    }
}