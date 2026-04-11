(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const a of r.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function e(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(s){if(s.ep)return;s.ep=!0;const r=e(s);fetch(s.href,r)}})();/**
 * @license
 * Copyright 2010-2023 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const wr="162",oc=0,Gr=1,ac=2,ya=1,Ma=2,dn=3,nn=0,be=1,ue=2,Sn=0,mi=1,Se=2,Hr=3,Vr=4,cc=5,Hn=100,lc=101,hc=102,Wr=103,Xr=104,dc=200,uc=201,fc=202,pc=203,fr=204,pr=205,mc=206,gc=207,xc=208,_c=209,vc=210,yc=211,Mc=212,bc=213,wc=214,Sc=0,Ec=1,Tc=2,ps=3,Ac=4,Cc=5,Rc=6,Pc=7,Sr=0,Lc=1,Ic=2,En=0,Dc=1,Uc=2,Nc=3,ba=4,Fc=5,Oc=6,zc=7,wa=300,xi=301,_i=302,mr=303,gr=304,ws=306,xr=1e3,je=1001,_r=1002,Le=1003,qr=1004,Ti=1005,Ne=1006,Ds=1007,Wn=1008,Tn=1009,kc=1010,Bc=1011,Er=1012,Sa=1013,wn=1014,un=1015,Ui=1016,Ea=1017,Ta=1018,Xn=1020,Gc=1021,Ke=1023,Hc=1024,Vc=1025,qn=1026,vi=1027,Wc=1028,Aa=1029,Xc=1030,Ca=1031,Ra=1033,Us=33776,Ns=33777,Fs=33778,Os=33779,$r=35840,Yr=35841,jr=35842,Kr=35843,Pa=36196,Zr=37492,Jr=37496,Qr=37808,to=37809,eo=37810,no=37811,io=37812,so=37813,ro=37814,oo=37815,ao=37816,co=37817,lo=37818,ho=37819,uo=37820,fo=37821,zs=36492,po=36494,mo=36495,qc=36283,go=36284,xo=36285,_o=36286,$c=3200,Yc=3201,La=0,jc=1,bn="",Ye="srgb",Rn="srgb-linear",Tr="display-p3",Ss="display-p3-linear",ms="linear",re="srgb",gs="rec709",xs="p3",Kn=7680,vo=519,Kc=512,Zc=513,Jc=514,Ia=515,Qc=516,tl=517,el=518,nl=519,yo=35044,Mo="300 es",vr=1035,fn=2e3,_s=2001;class bi{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;const n=this._listeners;return n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;const s=this._listeners[t];if(s!==void 0){const r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){if(this._listeners===void 0)return;const n=this._listeners[t.type];if(n!==void 0){t.target=this;const s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,t);t.target=null}}}const Te=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let bo=1234567;const Ii=Math.PI/180,yi=180/Math.PI;function wi(){const i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Te[i&255]+Te[i>>8&255]+Te[i>>16&255]+Te[i>>24&255]+"-"+Te[t&255]+Te[t>>8&255]+"-"+Te[t>>16&15|64]+Te[t>>24&255]+"-"+Te[e&63|128]+Te[e>>8&255]+"-"+Te[e>>16&255]+Te[e>>24&255]+Te[n&255]+Te[n>>8&255]+Te[n>>16&255]+Te[n>>24&255]).toLowerCase()}function Ie(i,t,e){return Math.max(t,Math.min(e,i))}function Ar(i,t){return(i%t+t)%t}function il(i,t,e,n,s){return n+(i-t)*(s-n)/(e-t)}function sl(i,t,e){return i!==t?(e-i)/(t-i):0}function Di(i,t,e){return(1-e)*i+e*t}function rl(i,t,e,n){return Di(i,t,1-Math.exp(-e*n))}function ol(i,t=1){return t-Math.abs(Ar(i,t*2)-t)}function al(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*(3-2*i))}function cl(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*i*(i*(i*6-15)+10))}function ll(i,t){return i+Math.floor(Math.random()*(t-i+1))}function hl(i,t){return i+Math.random()*(t-i)}function dl(i){return i*(.5-Math.random())}function ul(i){i!==void 0&&(bo=i);let t=bo+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function fl(i){return i*Ii}function pl(i){return i*yi}function yr(i){return(i&i-1)===0&&i!==0}function ml(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function vs(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function gl(i,t,e,n,s){const r=Math.cos,a=Math.sin,o=r(e/2),c=a(e/2),l=r((t+n)/2),h=a((t+n)/2),d=r((t-n)/2),p=a((t-n)/2),m=r((n-t)/2),g=a((n-t)/2);switch(s){case"XYX":i.set(o*h,c*d,c*p,o*l);break;case"YZY":i.set(c*p,o*h,c*d,o*l);break;case"ZXZ":i.set(c*d,c*p,o*h,o*l);break;case"XZX":i.set(o*h,c*g,c*m,o*l);break;case"YXY":i.set(c*m,o*h,c*g,o*l);break;case"ZYZ":i.set(c*g,c*m,o*h,o*l);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function ui(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function Re(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}const se={DEG2RAD:Ii,RAD2DEG:yi,generateUUID:wi,clamp:Ie,euclideanModulo:Ar,mapLinear:il,inverseLerp:sl,lerp:Di,damp:rl,pingpong:ol,smoothstep:al,smootherstep:cl,randInt:ll,randFloat:hl,randFloatSpread:dl,seededRandom:ul,degToRad:fl,radToDeg:pl,isPowerOfTwo:yr,ceilPowerOfTwo:ml,floorPowerOfTwo:vs,setQuaternionFromProperEuler:gl,normalize:Re,denormalize:ui};class qt{constructor(t=0,e=0){qt.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Ie(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,a=this.y-t.y;return this.x=r*n-a*s+t.x,this.y=r*s+a*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Vt{constructor(t,e,n,s,r,a,o,c,l){Vt.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,c,l)}set(t,e,n,s,r,a,o,c,l){const h=this.elements;return h[0]=t,h[1]=s,h[2]=o,h[3]=e,h[4]=r,h[5]=c,h[6]=n,h[7]=a,h[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[3],c=n[6],l=n[1],h=n[4],d=n[7],p=n[2],m=n[5],g=n[8],y=s[0],f=s[3],u=s[6],S=s[1],v=s[4],b=s[7],R=s[2],C=s[5],T=s[8];return r[0]=a*y+o*S+c*R,r[3]=a*f+o*v+c*C,r[6]=a*u+o*b+c*T,r[1]=l*y+h*S+d*R,r[4]=l*f+h*v+d*C,r[7]=l*u+h*b+d*T,r[2]=p*y+m*S+g*R,r[5]=p*f+m*v+g*C,r[8]=p*u+m*b+g*T,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],c=t[6],l=t[7],h=t[8];return e*a*h-e*o*l-n*r*h+n*o*c+s*r*l-s*a*c}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],c=t[6],l=t[7],h=t[8],d=h*a-o*l,p=o*c-h*r,m=l*r-a*c,g=e*d+n*p+s*m;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const y=1/g;return t[0]=d*y,t[1]=(s*l-h*n)*y,t[2]=(o*n-s*a)*y,t[3]=p*y,t[4]=(h*e-s*c)*y,t[5]=(s*r-o*e)*y,t[6]=m*y,t[7]=(n*c-l*e)*y,t[8]=(a*e-n*r)*y,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,a,o){const c=Math.cos(r),l=Math.sin(r);return this.set(n*c,n*l,-n*(c*a+l*o)+a+t,-s*l,s*c,-s*(-l*a+c*o)+o+e,0,0,1),this}scale(t,e){return this.premultiply(ks.makeScale(t,e)),this}rotate(t){return this.premultiply(ks.makeRotation(-t)),this}translate(t,e){return this.premultiply(ks.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const ks=new Vt;function Da(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function ys(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function xl(){const i=ys("canvas");return i.style.display="block",i}const wo={};function _l(i){i in wo||(wo[i]=!0,console.warn(i))}const So=new Vt().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),Eo=new Vt().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),Vi={[Rn]:{transfer:ms,primaries:gs,toReference:i=>i,fromReference:i=>i},[Ye]:{transfer:re,primaries:gs,toReference:i=>i.convertSRGBToLinear(),fromReference:i=>i.convertLinearToSRGB()},[Ss]:{transfer:ms,primaries:xs,toReference:i=>i.applyMatrix3(Eo),fromReference:i=>i.applyMatrix3(So)},[Tr]:{transfer:re,primaries:xs,toReference:i=>i.convertSRGBToLinear().applyMatrix3(Eo),fromReference:i=>i.applyMatrix3(So).convertLinearToSRGB()}},vl=new Set([Rn,Ss]),Qt={enabled:!0,_workingColorSpace:Rn,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(i){if(!vl.has(i))throw new Error(`Unsupported working color space, "${i}".`);this._workingColorSpace=i},convert:function(i,t,e){if(this.enabled===!1||t===e||!t||!e)return i;const n=Vi[t].toReference,s=Vi[e].fromReference;return s(n(i))},fromWorkingColorSpace:function(i,t){return this.convert(i,this._workingColorSpace,t)},toWorkingColorSpace:function(i,t){return this.convert(i,t,this._workingColorSpace)},getPrimaries:function(i){return Vi[i].primaries},getTransfer:function(i){return i===bn?ms:Vi[i].transfer}};function gi(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Bs(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let Zn;class Ua{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{Zn===void 0&&(Zn=ys("canvas")),Zn.width=t.width,Zn.height=t.height;const n=Zn.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),e=Zn}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=ys("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=gi(r[a]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(gi(e[n]/255)*255):e[n]=gi(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let yl=0;class Na{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:yl++}),this.uuid=wi(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(Gs(s[a].image)):r.push(Gs(s[a]))}else r=Gs(s);n.url=r}return e||(t.images[this.uuid]=n),n}}function Gs(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Ua.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let Ml=0;class De extends bi{constructor(t=De.DEFAULT_IMAGE,e=De.DEFAULT_MAPPING,n=je,s=je,r=Ne,a=Wn,o=Ke,c=Tn,l=De.DEFAULT_ANISOTROPY,h=bn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Ml++}),this.uuid=wi(),this.name="",this.source=new Na(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=l,this.format=o,this.internalFormat=null,this.type=c,this.offset=new qt(0,0),this.repeat=new qt(1,1),this.center=new qt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Vt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==wa)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case xr:t.x=t.x-Math.floor(t.x);break;case je:t.x=t.x<0?0:1;break;case _r:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case xr:t.y=t.y-Math.floor(t.y);break;case je:t.y=t.y<0?0:1;break;case _r:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}}De.DEFAULT_IMAGE=null;De.DEFAULT_MAPPING=wa;De.DEFAULT_ANISOTROPY=1;class ce{constructor(t=0,e=0,n=0,s=1){ce.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=this.w,a=t.elements;return this.x=a[0]*e+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*e+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*e+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*e+a[7]*n+a[11]*s+a[15]*r,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r;const c=t.elements,l=c[0],h=c[4],d=c[8],p=c[1],m=c[5],g=c[9],y=c[2],f=c[6],u=c[10];if(Math.abs(h-p)<.01&&Math.abs(d-y)<.01&&Math.abs(g-f)<.01){if(Math.abs(h+p)<.1&&Math.abs(d+y)<.1&&Math.abs(g+f)<.1&&Math.abs(l+m+u-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const v=(l+1)/2,b=(m+1)/2,R=(u+1)/2,C=(h+p)/4,T=(d+y)/4,L=(g+f)/4;return v>b&&v>R?v<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(v),s=C/n,r=T/n):b>R?b<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(b),n=C/s,r=L/s):R<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(R),n=T/r,s=L/r),this.set(n,s,r,e),this}let S=Math.sqrt((f-g)*(f-g)+(d-y)*(d-y)+(p-h)*(p-h));return Math.abs(S)<.001&&(S=1),this.x=(f-g)/S,this.y=(d-y)/S,this.z=(p-h)/S,this.w=Math.acos((l+m+u-1)/2),this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class bl extends bi{constructor(t=1,e=1,n={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new ce(0,0,t,e),this.scissorTest=!1,this.viewport=new ce(0,0,t,e);const s={width:t,height:e,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Ne,depthBuffer:!0,stencilBuffer:!1,depthTexture:null,samples:0,count:1},n);const r=new De(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];const a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,s=t.textures.length;n<s;n++)this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;const e=Object.assign({},t.texture.image);return this.texture.source=new Na(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class $n extends bl{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class Fa extends De{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Le,this.minFilter=Le,this.wrapR=je,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class wl extends De{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Le,this.minFilter=Le,this.wrapR=je,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Fi{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,a,o){let c=n[s+0],l=n[s+1],h=n[s+2],d=n[s+3];const p=r[a+0],m=r[a+1],g=r[a+2],y=r[a+3];if(o===0){t[e+0]=c,t[e+1]=l,t[e+2]=h,t[e+3]=d;return}if(o===1){t[e+0]=p,t[e+1]=m,t[e+2]=g,t[e+3]=y;return}if(d!==y||c!==p||l!==m||h!==g){let f=1-o;const u=c*p+l*m+h*g+d*y,S=u>=0?1:-1,v=1-u*u;if(v>Number.EPSILON){const R=Math.sqrt(v),C=Math.atan2(R,u*S);f=Math.sin(f*C)/R,o=Math.sin(o*C)/R}const b=o*S;if(c=c*f+p*b,l=l*f+m*b,h=h*f+g*b,d=d*f+y*b,f===1-o){const R=1/Math.sqrt(c*c+l*l+h*h+d*d);c*=R,l*=R,h*=R,d*=R}}t[e]=c,t[e+1]=l,t[e+2]=h,t[e+3]=d}static multiplyQuaternionsFlat(t,e,n,s,r,a){const o=n[s],c=n[s+1],l=n[s+2],h=n[s+3],d=r[a],p=r[a+1],m=r[a+2],g=r[a+3];return t[e]=o*g+h*d+c*m-l*p,t[e+1]=c*g+h*p+l*d-o*m,t[e+2]=l*g+h*m+o*p-c*d,t[e+3]=h*g-o*d-c*p-l*m,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,s=t._y,r=t._z,a=t._order,o=Math.cos,c=Math.sin,l=o(n/2),h=o(s/2),d=o(r/2),p=c(n/2),m=c(s/2),g=c(r/2);switch(a){case"XYZ":this._x=p*h*d+l*m*g,this._y=l*m*d-p*h*g,this._z=l*h*g+p*m*d,this._w=l*h*d-p*m*g;break;case"YXZ":this._x=p*h*d+l*m*g,this._y=l*m*d-p*h*g,this._z=l*h*g-p*m*d,this._w=l*h*d+p*m*g;break;case"ZXY":this._x=p*h*d-l*m*g,this._y=l*m*d+p*h*g,this._z=l*h*g+p*m*d,this._w=l*h*d-p*m*g;break;case"ZYX":this._x=p*h*d-l*m*g,this._y=l*m*d+p*h*g,this._z=l*h*g-p*m*d,this._w=l*h*d+p*m*g;break;case"YZX":this._x=p*h*d+l*m*g,this._y=l*m*d+p*h*g,this._z=l*h*g-p*m*d,this._w=l*h*d-p*m*g;break;case"XZY":this._x=p*h*d-l*m*g,this._y=l*m*d-p*h*g,this._z=l*h*g+p*m*d,this._w=l*h*d+p*m*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],s=e[4],r=e[8],a=e[1],o=e[5],c=e[9],l=e[2],h=e[6],d=e[10],p=n+o+d;if(p>0){const m=.5/Math.sqrt(p+1);this._w=.25/m,this._x=(h-c)*m,this._y=(r-l)*m,this._z=(a-s)*m}else if(n>o&&n>d){const m=2*Math.sqrt(1+n-o-d);this._w=(h-c)/m,this._x=.25*m,this._y=(s+a)/m,this._z=(r+l)/m}else if(o>d){const m=2*Math.sqrt(1+o-n-d);this._w=(r-l)/m,this._x=(s+a)/m,this._y=.25*m,this._z=(c+h)/m}else{const m=2*Math.sqrt(1+d-n-o);this._w=(a-s)/m,this._x=(r+l)/m,this._y=(c+h)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<Number.EPSILON?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Ie(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,s=t._y,r=t._z,a=t._w,o=e._x,c=e._y,l=e._z,h=e._w;return this._x=n*h+a*o+s*l-r*c,this._y=s*h+a*c+r*o-n*l,this._z=r*h+a*l+n*c-s*o,this._w=a*h-n*o-s*c-r*l,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const n=this._x,s=this._y,r=this._z,a=this._w;let o=a*t._w+n*t._x+s*t._y+r*t._z;if(o<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,o=-o):this.copy(t),o>=1)return this._w=a,this._x=n,this._y=s,this._z=r,this;const c=1-o*o;if(c<=Number.EPSILON){const m=1-e;return this._w=m*a+e*this._w,this._x=m*n+e*this._x,this._y=m*s+e*this._y,this._z=m*r+e*this._z,this.normalize(),this}const l=Math.sqrt(c),h=Math.atan2(l,o),d=Math.sin((1-e)*h)/l,p=Math.sin(e*h)/l;return this._w=a*d+this._w*p,this._x=n*d+this._x*p,this._y=s*d+this._y*p,this._z=r*d+this._z*p,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class A{constructor(t=0,e=0,n=0){A.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(To.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(To.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=t.elements,a=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(t){const e=this.x,n=this.y,s=this.z,r=t.x,a=t.y,o=t.z,c=t.w,l=2*(a*s-o*n),h=2*(o*e-r*s),d=2*(r*n-a*e);return this.x=e+c*l+a*d-o*h,this.y=n+c*h+o*l-r*d,this.z=s+c*d+r*h-a*l,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,s=t.y,r=t.z,a=e.x,o=e.y,c=e.z;return this.x=s*c-r*o,this.y=r*a-n*c,this.z=n*o-s*a,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Hs.copy(this).projectOnVector(t),this.sub(Hs)}reflect(t){return this.sub(Hs.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Ie(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Hs=new A,To=new Fi;class Oi{constructor(t=new A(1/0,1/0,1/0),e=new A(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(Xe.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(Xe.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=Xe.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,Xe):Xe.fromBufferAttribute(r,a),Xe.applyMatrix4(t.matrixWorld),this.expandByPoint(Xe);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Wi.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Wi.copy(n.boundingBox)),Wi.applyMatrix4(t.matrixWorld),this.union(Wi)}const s=t.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return!(t.x<this.min.x||t.x>this.max.x||t.y<this.min.y||t.y>this.max.y||t.z<this.min.z||t.z>this.max.z)}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return!(t.max.x<this.min.x||t.min.x>this.max.x||t.max.y<this.min.y||t.min.y>this.max.y||t.max.z<this.min.z||t.min.z>this.max.z)}intersectsSphere(t){return this.clampPoint(t.center,Xe),Xe.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Ai),Xi.subVectors(this.max,Ai),Jn.subVectors(t.a,Ai),Qn.subVectors(t.b,Ai),ti.subVectors(t.c,Ai),gn.subVectors(Qn,Jn),xn.subVectors(ti,Qn),Dn.subVectors(Jn,ti);let e=[0,-gn.z,gn.y,0,-xn.z,xn.y,0,-Dn.z,Dn.y,gn.z,0,-gn.x,xn.z,0,-xn.x,Dn.z,0,-Dn.x,-gn.y,gn.x,0,-xn.y,xn.x,0,-Dn.y,Dn.x,0];return!Vs(e,Jn,Qn,ti,Xi)||(e=[1,0,0,0,1,0,0,0,1],!Vs(e,Jn,Qn,ti,Xi))?!1:(qi.crossVectors(gn,xn),e=[qi.x,qi.y,qi.z],Vs(e,Jn,Qn,ti,Xi))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Xe).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Xe).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(on[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),on[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),on[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),on[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),on[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),on[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),on[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),on[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(on),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}const on=[new A,new A,new A,new A,new A,new A,new A,new A],Xe=new A,Wi=new Oi,Jn=new A,Qn=new A,ti=new A,gn=new A,xn=new A,Dn=new A,Ai=new A,Xi=new A,qi=new A,Un=new A;function Vs(i,t,e,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){Un.fromArray(i,r);const o=s.x*Math.abs(Un.x)+s.y*Math.abs(Un.y)+s.z*Math.abs(Un.z),c=t.dot(Un),l=e.dot(Un),h=n.dot(Un);if(Math.max(-Math.max(c,l,h),Math.min(c,l,h))>o)return!1}return!0}const Sl=new Oi,Ci=new A,Ws=new A;class zi{constructor(t=new A,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):Sl.setFromPoints(t).getCenter(n);let s=0;for(let r=0,a=t.length;r<a;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Ci.subVectors(t,this.center);const e=Ci.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(Ci,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Ws.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Ci.copy(t.center).add(Ws)),this.expandByPoint(Ci.copy(t.center).sub(Ws))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}}const an=new A,Xs=new A,$i=new A,_n=new A,qs=new A,Yi=new A,$s=new A;class Cr{constructor(t=new A,e=new A(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,an)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=an.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(an.copy(this.origin).addScaledVector(this.direction,e),an.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){Xs.copy(t).add(e).multiplyScalar(.5),$i.copy(e).sub(t).normalize(),_n.copy(this.origin).sub(Xs);const r=t.distanceTo(e)*.5,a=-this.direction.dot($i),o=_n.dot(this.direction),c=-_n.dot($i),l=_n.lengthSq(),h=Math.abs(1-a*a);let d,p,m,g;if(h>0)if(d=a*c-o,p=a*o-c,g=r*h,d>=0)if(p>=-g)if(p<=g){const y=1/h;d*=y,p*=y,m=d*(d+a*p+2*o)+p*(a*d+p+2*c)+l}else p=r,d=Math.max(0,-(a*p+o)),m=-d*d+p*(p+2*c)+l;else p=-r,d=Math.max(0,-(a*p+o)),m=-d*d+p*(p+2*c)+l;else p<=-g?(d=Math.max(0,-(-a*r+o)),p=d>0?-r:Math.min(Math.max(-r,-c),r),m=-d*d+p*(p+2*c)+l):p<=g?(d=0,p=Math.min(Math.max(-r,-c),r),m=p*(p+2*c)+l):(d=Math.max(0,-(a*r+o)),p=d>0?r:Math.min(Math.max(-r,-c),r),m=-d*d+p*(p+2*c)+l);else p=a>0?-r:r,d=Math.max(0,-(a*p+o)),m=-d*d+p*(p+2*c)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,d),s&&s.copy(Xs).addScaledVector($i,p),m}intersectSphere(t,e){an.subVectors(t.center,this.origin);const n=an.dot(this.direction),s=an.dot(an)-n*n,r=t.radius*t.radius;if(s>r)return null;const a=Math.sqrt(r-s),o=n-a,c=n+a;return c<0?null:o<0?this.at(c,e):this.at(o,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,a,o,c;const l=1/this.direction.x,h=1/this.direction.y,d=1/this.direction.z,p=this.origin;return l>=0?(n=(t.min.x-p.x)*l,s=(t.max.x-p.x)*l):(n=(t.max.x-p.x)*l,s=(t.min.x-p.x)*l),h>=0?(r=(t.min.y-p.y)*h,a=(t.max.y-p.y)*h):(r=(t.max.y-p.y)*h,a=(t.min.y-p.y)*h),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),d>=0?(o=(t.min.z-p.z)*d,c=(t.max.z-p.z)*d):(o=(t.max.z-p.z)*d,c=(t.min.z-p.z)*d),n>c||o>s)||((o>n||n!==n)&&(n=o),(c<s||s!==s)&&(s=c),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,an)!==null}intersectTriangle(t,e,n,s,r){qs.subVectors(e,t),Yi.subVectors(n,t),$s.crossVectors(qs,Yi);let a=this.direction.dot($s),o;if(a>0){if(s)return null;o=1}else if(a<0)o=-1,a=-a;else return null;_n.subVectors(this.origin,t);const c=o*this.direction.dot(Yi.crossVectors(_n,Yi));if(c<0)return null;const l=o*this.direction.dot(qs.cross(_n));if(l<0||c+l>a)return null;const h=-o*_n.dot($s);return h<0?null:this.at(h/a,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class le{constructor(t,e,n,s,r,a,o,c,l,h,d,p,m,g,y,f){le.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,c,l,h,d,p,m,g,y,f)}set(t,e,n,s,r,a,o,c,l,h,d,p,m,g,y,f){const u=this.elements;return u[0]=t,u[4]=e,u[8]=n,u[12]=s,u[1]=r,u[5]=a,u[9]=o,u[13]=c,u[2]=l,u[6]=h,u[10]=d,u[14]=p,u[3]=m,u[7]=g,u[11]=y,u[15]=f,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new le().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,n=t.elements,s=1/ei.setFromMatrixColumn(t,0).length(),r=1/ei.setFromMatrixColumn(t,1).length(),a=1/ei.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*a,e[9]=n[9]*a,e[10]=n[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,s=t.y,r=t.z,a=Math.cos(n),o=Math.sin(n),c=Math.cos(s),l=Math.sin(s),h=Math.cos(r),d=Math.sin(r);if(t.order==="XYZ"){const p=a*h,m=a*d,g=o*h,y=o*d;e[0]=c*h,e[4]=-c*d,e[8]=l,e[1]=m+g*l,e[5]=p-y*l,e[9]=-o*c,e[2]=y-p*l,e[6]=g+m*l,e[10]=a*c}else if(t.order==="YXZ"){const p=c*h,m=c*d,g=l*h,y=l*d;e[0]=p+y*o,e[4]=g*o-m,e[8]=a*l,e[1]=a*d,e[5]=a*h,e[9]=-o,e[2]=m*o-g,e[6]=y+p*o,e[10]=a*c}else if(t.order==="ZXY"){const p=c*h,m=c*d,g=l*h,y=l*d;e[0]=p-y*o,e[4]=-a*d,e[8]=g+m*o,e[1]=m+g*o,e[5]=a*h,e[9]=y-p*o,e[2]=-a*l,e[6]=o,e[10]=a*c}else if(t.order==="ZYX"){const p=a*h,m=a*d,g=o*h,y=o*d;e[0]=c*h,e[4]=g*l-m,e[8]=p*l+y,e[1]=c*d,e[5]=y*l+p,e[9]=m*l-g,e[2]=-l,e[6]=o*c,e[10]=a*c}else if(t.order==="YZX"){const p=a*c,m=a*l,g=o*c,y=o*l;e[0]=c*h,e[4]=y-p*d,e[8]=g*d+m,e[1]=d,e[5]=a*h,e[9]=-o*h,e[2]=-l*h,e[6]=m*d+g,e[10]=p-y*d}else if(t.order==="XZY"){const p=a*c,m=a*l,g=o*c,y=o*l;e[0]=c*h,e[4]=-d,e[8]=l*h,e[1]=p*d+y,e[5]=a*h,e[9]=m*d-g,e[2]=g*d-m,e[6]=o*h,e[10]=y*d+p}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(El,t,Tl)}lookAt(t,e,n){const s=this.elements;return ze.subVectors(t,e),ze.lengthSq()===0&&(ze.z=1),ze.normalize(),vn.crossVectors(n,ze),vn.lengthSq()===0&&(Math.abs(n.z)===1?ze.x+=1e-4:ze.z+=1e-4,ze.normalize(),vn.crossVectors(n,ze)),vn.normalize(),ji.crossVectors(ze,vn),s[0]=vn.x,s[4]=ji.x,s[8]=ze.x,s[1]=vn.y,s[5]=ji.y,s[9]=ze.y,s[2]=vn.z,s[6]=ji.z,s[10]=ze.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[4],c=n[8],l=n[12],h=n[1],d=n[5],p=n[9],m=n[13],g=n[2],y=n[6],f=n[10],u=n[14],S=n[3],v=n[7],b=n[11],R=n[15],C=s[0],T=s[4],L=s[8],W=s[12],_=s[1],E=s[5],j=s[9],K=s[13],I=s[2],Y=s[6],V=s[10],tt=s[14],q=s[3],Z=s[7],et=s[11],ot=s[15];return r[0]=a*C+o*_+c*I+l*q,r[4]=a*T+o*E+c*Y+l*Z,r[8]=a*L+o*j+c*V+l*et,r[12]=a*W+o*K+c*tt+l*ot,r[1]=h*C+d*_+p*I+m*q,r[5]=h*T+d*E+p*Y+m*Z,r[9]=h*L+d*j+p*V+m*et,r[13]=h*W+d*K+p*tt+m*ot,r[2]=g*C+y*_+f*I+u*q,r[6]=g*T+y*E+f*Y+u*Z,r[10]=g*L+y*j+f*V+u*et,r[14]=g*W+y*K+f*tt+u*ot,r[3]=S*C+v*_+b*I+R*q,r[7]=S*T+v*E+b*Y+R*Z,r[11]=S*L+v*j+b*V+R*et,r[15]=S*W+v*K+b*tt+R*ot,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],a=t[1],o=t[5],c=t[9],l=t[13],h=t[2],d=t[6],p=t[10],m=t[14],g=t[3],y=t[7],f=t[11],u=t[15];return g*(+r*c*d-s*l*d-r*o*p+n*l*p+s*o*m-n*c*m)+y*(+e*c*m-e*l*p+r*a*p-s*a*m+s*l*h-r*c*h)+f*(+e*l*d-e*o*m-r*a*d+n*a*m+r*o*h-n*l*h)+u*(-s*o*h-e*c*d+e*o*p+s*a*d-n*a*p+n*c*h)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],c=t[6],l=t[7],h=t[8],d=t[9],p=t[10],m=t[11],g=t[12],y=t[13],f=t[14],u=t[15],S=d*f*l-y*p*l+y*c*m-o*f*m-d*c*u+o*p*u,v=g*p*l-h*f*l-g*c*m+a*f*m+h*c*u-a*p*u,b=h*y*l-g*d*l+g*o*m-a*y*m-h*o*u+a*d*u,R=g*d*c-h*y*c-g*o*p+a*y*p+h*o*f-a*d*f,C=e*S+n*v+s*b+r*R;if(C===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const T=1/C;return t[0]=S*T,t[1]=(y*p*r-d*f*r-y*s*m+n*f*m+d*s*u-n*p*u)*T,t[2]=(o*f*r-y*c*r+y*s*l-n*f*l-o*s*u+n*c*u)*T,t[3]=(d*c*r-o*p*r-d*s*l+n*p*l+o*s*m-n*c*m)*T,t[4]=v*T,t[5]=(h*f*r-g*p*r+g*s*m-e*f*m-h*s*u+e*p*u)*T,t[6]=(g*c*r-a*f*r-g*s*l+e*f*l+a*s*u-e*c*u)*T,t[7]=(a*p*r-h*c*r+h*s*l-e*p*l-a*s*m+e*c*m)*T,t[8]=b*T,t[9]=(g*d*r-h*y*r-g*n*m+e*y*m+h*n*u-e*d*u)*T,t[10]=(a*y*r-g*o*r+g*n*l-e*y*l-a*n*u+e*o*u)*T,t[11]=(h*o*r-a*d*r-h*n*l+e*d*l+a*n*m-e*o*m)*T,t[12]=R*T,t[13]=(h*y*s-g*d*s+g*n*p-e*y*p-h*n*f+e*d*f)*T,t[14]=(g*o*s-a*y*s-g*n*c+e*y*c+a*n*f-e*o*f)*T,t[15]=(a*d*s-h*o*s+h*n*c-e*d*c-a*n*p+e*o*p)*T,this}scale(t){const e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),s=Math.sin(e),r=1-n,a=t.x,o=t.y,c=t.z,l=r*a,h=r*o;return this.set(l*a+n,l*o-s*c,l*c+s*o,0,l*o+s*c,h*o+n,h*c-s*a,0,l*c-s*o,h*c+s*a,r*c*c+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,a){return this.set(1,n,r,0,t,1,a,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){const s=this.elements,r=e._x,a=e._y,o=e._z,c=e._w,l=r+r,h=a+a,d=o+o,p=r*l,m=r*h,g=r*d,y=a*h,f=a*d,u=o*d,S=c*l,v=c*h,b=c*d,R=n.x,C=n.y,T=n.z;return s[0]=(1-(y+u))*R,s[1]=(m+b)*R,s[2]=(g-v)*R,s[3]=0,s[4]=(m-b)*C,s[5]=(1-(p+u))*C,s[6]=(f+S)*C,s[7]=0,s[8]=(g+v)*T,s[9]=(f-S)*T,s[10]=(1-(p+y))*T,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){const s=this.elements;let r=ei.set(s[0],s[1],s[2]).length();const a=ei.set(s[4],s[5],s[6]).length(),o=ei.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),t.x=s[12],t.y=s[13],t.z=s[14],qe.copy(this);const l=1/r,h=1/a,d=1/o;return qe.elements[0]*=l,qe.elements[1]*=l,qe.elements[2]*=l,qe.elements[4]*=h,qe.elements[5]*=h,qe.elements[6]*=h,qe.elements[8]*=d,qe.elements[9]*=d,qe.elements[10]*=d,e.setFromRotationMatrix(qe),n.x=r,n.y=a,n.z=o,this}makePerspective(t,e,n,s,r,a,o=fn){const c=this.elements,l=2*r/(e-t),h=2*r/(n-s),d=(e+t)/(e-t),p=(n+s)/(n-s);let m,g;if(o===fn)m=-(a+r)/(a-r),g=-2*a*r/(a-r);else if(o===_s)m=-a/(a-r),g=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=l,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=h,c[9]=p,c[13]=0,c[2]=0,c[6]=0,c[10]=m,c[14]=g,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,e,n,s,r,a,o=fn){const c=this.elements,l=1/(e-t),h=1/(n-s),d=1/(a-r),p=(e+t)*l,m=(n+s)*h;let g,y;if(o===fn)g=(a+r)*d,y=-2*d;else if(o===_s)g=r*d,y=-1*d;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=2*l,c[4]=0,c[8]=0,c[12]=-p,c[1]=0,c[5]=2*h,c[9]=0,c[13]=-m,c[2]=0,c[6]=0,c[10]=y,c[14]=-g,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}}const ei=new A,qe=new le,El=new A(0,0,0),Tl=new A(1,1,1),vn=new A,ji=new A,ze=new A,Ao=new le,Co=new Fi;class sn{constructor(t=0,e=0,n=0,s=sn.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const s=t.elements,r=s[0],a=s[4],o=s[8],c=s[1],l=s[5],h=s[9],d=s[2],p=s[6],m=s[10];switch(e){case"XYZ":this._y=Math.asin(Ie(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,m),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(p,l),this._z=0);break;case"YXZ":this._x=Math.asin(-Ie(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,m),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-d,r),this._z=0);break;case"ZXY":this._x=Math.asin(Ie(p,-1,1)),Math.abs(p)<.9999999?(this._y=Math.atan2(-d,m),this._z=Math.atan2(-a,l)):(this._y=0,this._z=Math.atan2(c,r));break;case"ZYX":this._y=Math.asin(-Ie(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(p,m),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-a,l));break;case"YZX":this._z=Math.asin(Ie(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-h,l),this._y=Math.atan2(-d,r)):(this._x=0,this._y=Math.atan2(o,m));break;case"XZY":this._z=Math.asin(-Ie(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(p,l),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,m),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return Ao.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Ao,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return Co.setFromEuler(this),this.setFromQuaternion(Co,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}sn.DEFAULT_ORDER="XYZ";class Oa{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let Al=0;const Ro=new A,ni=new Fi,cn=new le,Ki=new A,Ri=new A,Cl=new A,Rl=new Fi,Po=new A(1,0,0),Lo=new A(0,1,0),Io=new A(0,0,1),Pl={type:"added"},Ll={type:"removed"},Ys={type:"childadded",child:null},js={type:"childremoved",child:null};class pe extends bi{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Al++}),this.uuid=wi(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=pe.DEFAULT_UP.clone();const t=new A,e=new sn,n=new Fi,s=new A(1,1,1);function r(){n.setFromEuler(e,!1)}function a(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new le},normalMatrix:{value:new Vt}}),this.matrix=new le,this.matrixWorld=new le,this.matrixAutoUpdate=pe.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=pe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Oa,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return ni.setFromAxisAngle(t,e),this.quaternion.multiply(ni),this}rotateOnWorldAxis(t,e){return ni.setFromAxisAngle(t,e),this.quaternion.premultiply(ni),this}rotateX(t){return this.rotateOnAxis(Po,t)}rotateY(t){return this.rotateOnAxis(Lo,t)}rotateZ(t){return this.rotateOnAxis(Io,t)}translateOnAxis(t,e){return Ro.copy(t).applyQuaternion(this.quaternion),this.position.add(Ro.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Po,t)}translateY(t){return this.translateOnAxis(Lo,t)}translateZ(t){return this.translateOnAxis(Io,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(cn.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?Ki.copy(t):Ki.set(t,e,n);const s=this.parent;this.updateWorldMatrix(!0,!1),Ri.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?cn.lookAt(Ri,Ki,this.up):cn.lookAt(Ki,Ri,this.up),this.quaternion.setFromRotationMatrix(cn),s&&(cn.extractRotation(s.matrixWorld),ni.setFromRotationMatrix(cn),this.quaternion.premultiply(ni.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.parent!==null&&t.parent.remove(t),t.parent=this,this.children.push(t),t.dispatchEvent(Pl),Ys.child=t,this.dispatchEvent(Ys),Ys.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Ll),js.child=t,this.dispatchEvent(js),js.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),cn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),cn.multiply(t.parent.matrixWorld)),t.applyMatrix4(cn),this.add(t),t.updateWorldMatrix(!1,!0),this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){const a=this.children[n].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ri,t,Cl),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ri,Rl,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,s=e.length;n<s;n++){const r=e[n];(r.matrixWorldAutoUpdate===!0||t===!0)&&r.updateMatrixWorld(t)}}updateWorldMatrix(t,e){const n=this.parent;if(t===!0&&n!==null&&n.matrixWorldAutoUpdate===!0&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),e===!0){const s=this.children;for(let r=0,a=s.length;r<a;r++){const o=s[r];o.matrixWorldAutoUpdate===!0&&o.updateWorldMatrix(!1,!0)}}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),s.maxGeometryCount=this._maxGeometryCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(t),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(o,c){return o[c.uuid]===void 0&&(o[c.uuid]=c.toJSON(t)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const c=o.shapes;if(Array.isArray(c))for(let l=0,h=c.length;l<h;l++){const d=c[l];r(t.shapes,d)}else r(t.shapes,c)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let c=0,l=this.material.length;c<l;c++)o.push(r(t.materials,this.material[c]));s.material=o}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){const c=this.animations[o];s.animations.push(r(t.animations,c))}}if(e){const o=a(t.geometries),c=a(t.materials),l=a(t.textures),h=a(t.images),d=a(t.shapes),p=a(t.skeletons),m=a(t.animations),g=a(t.nodes);o.length>0&&(n.geometries=o),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),h.length>0&&(n.images=h),d.length>0&&(n.shapes=d),p.length>0&&(n.skeletons=p),m.length>0&&(n.animations=m),g.length>0&&(n.nodes=g)}return n.object=s,n;function a(o){const c=[];for(const l in o){const h=o[l];delete h.metadata,c.push(h)}return c}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const s=t.children[n];this.add(s.clone())}return this}}pe.DEFAULT_UP=new A(0,1,0);pe.DEFAULT_MATRIX_AUTO_UPDATE=!0;pe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const $e=new A,ln=new A,Ks=new A,hn=new A,ii=new A,si=new A,Do=new A,Zs=new A,Js=new A,Qs=new A;class tn{constructor(t=new A,e=new A,n=new A){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),$e.subVectors(t,e),s.cross($e);const r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){$e.subVectors(s,e),ln.subVectors(n,e),Ks.subVectors(t,e);const a=$e.dot($e),o=$e.dot(ln),c=$e.dot(Ks),l=ln.dot(ln),h=ln.dot(Ks),d=a*l-o*o;if(d===0)return r.set(0,0,0),null;const p=1/d,m=(l*c-o*h)*p,g=(a*h-o*c)*p;return r.set(1-m-g,g,m)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,hn)===null?!1:hn.x>=0&&hn.y>=0&&hn.x+hn.y<=1}static getInterpolation(t,e,n,s,r,a,o,c){return this.getBarycoord(t,e,n,s,hn)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(r,hn.x),c.addScaledVector(a,hn.y),c.addScaledVector(o,hn.z),c)}static isFrontFacing(t,e,n,s){return $e.subVectors(n,e),ln.subVectors(t,e),$e.cross(ln).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return $e.subVectors(this.c,this.b),ln.subVectors(this.a,this.b),$e.cross(ln).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return tn.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return tn.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return tn.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return tn.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return tn.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,s=this.b,r=this.c;let a,o;ii.subVectors(s,n),si.subVectors(r,n),Zs.subVectors(t,n);const c=ii.dot(Zs),l=si.dot(Zs);if(c<=0&&l<=0)return e.copy(n);Js.subVectors(t,s);const h=ii.dot(Js),d=si.dot(Js);if(h>=0&&d<=h)return e.copy(s);const p=c*d-h*l;if(p<=0&&c>=0&&h<=0)return a=c/(c-h),e.copy(n).addScaledVector(ii,a);Qs.subVectors(t,r);const m=ii.dot(Qs),g=si.dot(Qs);if(g>=0&&m<=g)return e.copy(r);const y=m*l-c*g;if(y<=0&&l>=0&&g<=0)return o=l/(l-g),e.copy(n).addScaledVector(si,o);const f=h*g-m*d;if(f<=0&&d-h>=0&&m-g>=0)return Do.subVectors(r,s),o=(d-h)/(d-h+(m-g)),e.copy(s).addScaledVector(Do,o);const u=1/(f+y+p);return a=y*u,o=p*u,e.copy(n).addScaledVector(ii,a).addScaledVector(si,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const za={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},yn={h:0,s:0,l:0},Zi={h:0,s:0,l:0};function tr(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}class Ct{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Ye){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Qt.toWorkingColorSpace(this,e),this}setRGB(t,e,n,s=Qt.workingColorSpace){return this.r=t,this.g=e,this.b=n,Qt.toWorkingColorSpace(this,s),this}setHSL(t,e,n,s=Qt.workingColorSpace){if(t=Ar(t,1),e=Ie(e,0,1),n=Ie(n,0,1),e===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+e):n+e-n*e,a=2*n-r;this.r=tr(a,r,t+1/3),this.g=tr(a,r,t),this.b=tr(a,r,t-1/3)}return Qt.toWorkingColorSpace(this,s),this}setStyle(t,e=Ye){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r;const a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){const r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(r,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Ye){const n=za[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=gi(t.r),this.g=gi(t.g),this.b=gi(t.b),this}copyLinearToSRGB(t){return this.r=Bs(t.r),this.g=Bs(t.g),this.b=Bs(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Ye){return Qt.fromWorkingColorSpace(Ae.copy(this),t),Math.round(Ie(Ae.r*255,0,255))*65536+Math.round(Ie(Ae.g*255,0,255))*256+Math.round(Ie(Ae.b*255,0,255))}getHexString(t=Ye){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Qt.workingColorSpace){Qt.fromWorkingColorSpace(Ae.copy(this),e);const n=Ae.r,s=Ae.g,r=Ae.b,a=Math.max(n,s,r),o=Math.min(n,s,r);let c,l;const h=(o+a)/2;if(o===a)c=0,l=0;else{const d=a-o;switch(l=h<=.5?d/(a+o):d/(2-a-o),a){case n:c=(s-r)/d+(s<r?6:0);break;case s:c=(r-n)/d+2;break;case r:c=(n-s)/d+4;break}c/=6}return t.h=c,t.s=l,t.l=h,t}getRGB(t,e=Qt.workingColorSpace){return Qt.fromWorkingColorSpace(Ae.copy(this),e),t.r=Ae.r,t.g=Ae.g,t.b=Ae.b,t}getStyle(t=Ye){Qt.fromWorkingColorSpace(Ae.copy(this),t);const e=Ae.r,n=Ae.g,s=Ae.b;return t!==Ye?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(yn),this.setHSL(yn.h+t,yn.s+e,yn.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(yn),t.getHSL(Zi);const n=Di(yn.h,Zi.h,e),s=Di(yn.s,Zi.s,e),r=Di(yn.l,Zi.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Ae=new Ct;Ct.NAMES=za;let Il=0;class Yn extends bi{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Il++}),this.uuid=wi(),this.name="",this.type="Material",this.blending=mi,this.side=nn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=fr,this.blendDst=pr,this.blendEquation=Hn,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ct(0,0,0),this.blendAlpha=0,this.depthFunc=ps,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=vo,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Kn,this.stencilZFail=Kn,this.stencilZPass=Kn,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const s=this[e];if(s===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==mi&&(n.blending=this.blending),this.side!==nn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==fr&&(n.blendSrc=this.blendSrc),this.blendDst!==pr&&(n.blendDst=this.blendDst),this.blendEquation!==Hn&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==ps&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==vo&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Kn&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Kn&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Kn&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){const a=[];for(const o in r){const c=r[o];delete c.metadata,a.push(c)}return a}if(e){const r=s(t.textures),a=s(t.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}}class Jt extends Yn{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ct(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new sn,this.combine=Sr,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const ge=new A,Ji=new qt;class Zt{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=yo,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=un,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}get updateRange(){return _l("THREE.BufferAttribute: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)Ji.fromBufferAttribute(this,e),Ji.applyMatrix3(t),this.setXY(e,Ji.x,Ji.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)ge.fromBufferAttribute(this,e),ge.applyMatrix3(t),this.setXYZ(e,ge.x,ge.y,ge.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)ge.fromBufferAttribute(this,e),ge.applyMatrix4(t),this.setXYZ(e,ge.x,ge.y,ge.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)ge.fromBufferAttribute(this,e),ge.applyNormalMatrix(t),this.setXYZ(e,ge.x,ge.y,ge.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)ge.fromBufferAttribute(this,e),ge.transformDirection(t),this.setXYZ(e,ge.x,ge.y,ge.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=ui(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=Re(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=ui(e,this.array)),e}setX(t,e){return this.normalized&&(e=Re(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=ui(e,this.array)),e}setY(t,e){return this.normalized&&(e=Re(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=ui(e,this.array)),e}setZ(t,e){return this.normalized&&(e=Re(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=ui(e,this.array)),e}setW(t,e){return this.normalized&&(e=Re(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=Re(e,this.array),n=Re(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=Re(e,this.array),n=Re(n,this.array),s=Re(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=Re(e,this.array),n=Re(n,this.array),s=Re(s,this.array),r=Re(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==yo&&(t.usage=this.usage),t}}class ka extends Zt{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class Ba extends Zt{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class xe extends Zt{constructor(t,e,n){super(new Float32Array(t),e,n)}}let Dl=0;const He=new le,er=new pe,ri=new A,ke=new Oi,Pi=new Oi,Me=new A;class ee extends bi{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Dl++}),this.uuid=wi(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Da(t)?Ba:ka)(t,1):this.index=t,this}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new Vt().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return He.makeRotationFromQuaternion(t),this.applyMatrix4(He),this}rotateX(t){return He.makeRotationX(t),this.applyMatrix4(He),this}rotateY(t){return He.makeRotationY(t),this.applyMatrix4(He),this}rotateZ(t){return He.makeRotationZ(t),this.applyMatrix4(He),this}translate(t,e,n){return He.makeTranslation(t,e,n),this.applyMatrix4(He),this}scale(t,e,n){return He.makeScale(t,e,n),this.applyMatrix4(He),this}lookAt(t){return er.lookAt(t),er.updateMatrix(),this.applyMatrix4(er.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ri).negate(),this.translate(ri.x,ri.y,ri.z),this}setFromPoints(t){const e=[];for(let n=0,s=t.length;n<s;n++){const r=t[n];e.push(r.x,r.y,r.z||0)}return this.setAttribute("position",new xe(e,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Oi);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new A(-1/0,-1/0,-1/0),new A(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){const r=e[n];ke.setFromBufferAttribute(r),this.morphTargetsRelative?(Me.addVectors(this.boundingBox.min,ke.min),this.boundingBox.expandByPoint(Me),Me.addVectors(this.boundingBox.max,ke.max),this.boundingBox.expandByPoint(Me)):(this.boundingBox.expandByPoint(ke.min),this.boundingBox.expandByPoint(ke.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new zi);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new A,1/0);return}if(t){const n=this.boundingSphere.center;if(ke.setFromBufferAttribute(t),e)for(let r=0,a=e.length;r<a;r++){const o=e[r];Pi.setFromBufferAttribute(o),this.morphTargetsRelative?(Me.addVectors(ke.min,Pi.min),ke.expandByPoint(Me),Me.addVectors(ke.max,Pi.max),ke.expandByPoint(Me)):(ke.expandByPoint(Pi.min),ke.expandByPoint(Pi.max))}ke.getCenter(n);let s=0;for(let r=0,a=t.count;r<a;r++)Me.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(Me));if(e)for(let r=0,a=e.length;r<a;r++){const o=e[r],c=this.morphTargetsRelative;for(let l=0,h=o.count;l<h;l++)Me.fromBufferAttribute(o,l),c&&(ri.fromBufferAttribute(t,l),Me.add(ri)),s=Math.max(s,n.distanceToSquared(Me))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,s=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Zt(new Float32Array(4*n.count),4));const a=this.getAttribute("tangent"),o=[],c=[];for(let L=0;L<n.count;L++)o[L]=new A,c[L]=new A;const l=new A,h=new A,d=new A,p=new qt,m=new qt,g=new qt,y=new A,f=new A;function u(L,W,_){l.fromBufferAttribute(n,L),h.fromBufferAttribute(n,W),d.fromBufferAttribute(n,_),p.fromBufferAttribute(r,L),m.fromBufferAttribute(r,W),g.fromBufferAttribute(r,_),h.sub(l),d.sub(l),m.sub(p),g.sub(p);const E=1/(m.x*g.y-g.x*m.y);isFinite(E)&&(y.copy(h).multiplyScalar(g.y).addScaledVector(d,-m.y).multiplyScalar(E),f.copy(d).multiplyScalar(m.x).addScaledVector(h,-g.x).multiplyScalar(E),o[L].add(y),o[W].add(y),o[_].add(y),c[L].add(f),c[W].add(f),c[_].add(f))}let S=this.groups;S.length===0&&(S=[{start:0,count:t.count}]);for(let L=0,W=S.length;L<W;++L){const _=S[L],E=_.start,j=_.count;for(let K=E,I=E+j;K<I;K+=3)u(t.getX(K+0),t.getX(K+1),t.getX(K+2))}const v=new A,b=new A,R=new A,C=new A;function T(L){R.fromBufferAttribute(s,L),C.copy(R);const W=o[L];v.copy(W),v.sub(R.multiplyScalar(R.dot(W))).normalize(),b.crossVectors(C,W);const E=b.dot(c[L])<0?-1:1;a.setXYZW(L,v.x,v.y,v.z,E)}for(let L=0,W=S.length;L<W;++L){const _=S[L],E=_.start,j=_.count;for(let K=E,I=E+j;K<I;K+=3)T(t.getX(K+0)),T(t.getX(K+1)),T(t.getX(K+2))}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Zt(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let p=0,m=n.count;p<m;p++)n.setXYZ(p,0,0,0);const s=new A,r=new A,a=new A,o=new A,c=new A,l=new A,h=new A,d=new A;if(t)for(let p=0,m=t.count;p<m;p+=3){const g=t.getX(p+0),y=t.getX(p+1),f=t.getX(p+2);s.fromBufferAttribute(e,g),r.fromBufferAttribute(e,y),a.fromBufferAttribute(e,f),h.subVectors(a,r),d.subVectors(s,r),h.cross(d),o.fromBufferAttribute(n,g),c.fromBufferAttribute(n,y),l.fromBufferAttribute(n,f),o.add(h),c.add(h),l.add(h),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(y,c.x,c.y,c.z),n.setXYZ(f,l.x,l.y,l.z)}else for(let p=0,m=e.count;p<m;p+=3)s.fromBufferAttribute(e,p+0),r.fromBufferAttribute(e,p+1),a.fromBufferAttribute(e,p+2),h.subVectors(a,r),d.subVectors(s,r),h.cross(d),n.setXYZ(p+0,h.x,h.y,h.z),n.setXYZ(p+1,h.x,h.y,h.z),n.setXYZ(p+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Me.fromBufferAttribute(t,e),Me.normalize(),t.setXYZ(e,Me.x,Me.y,Me.z)}toNonIndexed(){function t(o,c){const l=o.array,h=o.itemSize,d=o.normalized,p=new l.constructor(c.length*h);let m=0,g=0;for(let y=0,f=c.length;y<f;y++){o.isInterleavedBufferAttribute?m=c[y]*o.data.stride+o.offset:m=c[y]*h;for(let u=0;u<h;u++)p[g++]=l[m++]}return new Zt(p,h,d)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new ee,n=this.index.array,s=this.attributes;for(const o in s){const c=s[o],l=t(c,n);e.setAttribute(o,l)}const r=this.morphAttributes;for(const o in r){const c=[],l=r[o];for(let h=0,d=l.length;h<d;h++){const p=l[h],m=t(p,n);c.push(m)}e.morphAttributes[o]=c}e.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,c=a.length;o<c;o++){const l=a[o];e.addGroup(l.start,l.count,l.materialIndex)}return e}toJSON(){const t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const c=this.parameters;for(const l in c)c[l]!==void 0&&(t[l]=c[l]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const c in n){const l=n[c];t.data.attributes[c]=l.toJSON(t.data)}const s={};let r=!1;for(const c in this.morphAttributes){const l=this.morphAttributes[c],h=[];for(let d=0,p=l.length;d<p;d++){const m=l[d];h.push(m.toJSON(t.data))}h.length>0&&(s[c]=h,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(t.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone(e));const s=t.attributes;for(const l in s){const h=s[l];this.setAttribute(l,h.clone(e))}const r=t.morphAttributes;for(const l in r){const h=[],d=r[l];for(let p=0,m=d.length;p<m;p++)h.push(d[p].clone(e));this.morphAttributes[l]=h}this.morphTargetsRelative=t.morphTargetsRelative;const a=t.groups;for(let l=0,h=a.length;l<h;l++){const d=a[l];this.addGroup(d.start,d.count,d.materialIndex)}const o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());const c=t.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Uo=new le,Nn=new Cr,Qi=new zi,No=new A,oi=new A,ai=new A,ci=new A,nr=new A,ts=new A,es=new qt,ns=new qt,is=new qt,Fo=new A,Oo=new A,zo=new A,ss=new A,rs=new A;class P extends pe{constructor(t=new ee,e=new Jt){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){const o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(t,e){const n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;e.fromBufferAttribute(s,t);const o=this.morphTargetInfluences;if(r&&o){ts.set(0,0,0);for(let c=0,l=r.length;c<l;c++){const h=o[c],d=r[c];h!==0&&(nr.fromBufferAttribute(d,t),a?ts.addScaledVector(nr,h):ts.addScaledVector(nr.sub(e),h))}e.add(ts)}return e}raycast(t,e){const n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Qi.copy(n.boundingSphere),Qi.applyMatrix4(r),Nn.copy(t.ray).recast(t.near),!(Qi.containsPoint(Nn.origin)===!1&&(Nn.intersectSphere(Qi,No)===null||Nn.origin.distanceToSquared(No)>(t.far-t.near)**2))&&(Uo.copy(r).invert(),Nn.copy(t.ray).applyMatrix4(Uo),!(n.boundingBox!==null&&Nn.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,Nn)))}_computeIntersections(t,e,n){let s;const r=this.geometry,a=this.material,o=r.index,c=r.attributes.position,l=r.attributes.uv,h=r.attributes.uv1,d=r.attributes.normal,p=r.groups,m=r.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,y=p.length;g<y;g++){const f=p[g],u=a[f.materialIndex],S=Math.max(f.start,m.start),v=Math.min(o.count,Math.min(f.start+f.count,m.start+m.count));for(let b=S,R=v;b<R;b+=3){const C=o.getX(b),T=o.getX(b+1),L=o.getX(b+2);s=os(this,u,t,n,l,h,d,C,T,L),s&&(s.faceIndex=Math.floor(b/3),s.face.materialIndex=f.materialIndex,e.push(s))}}else{const g=Math.max(0,m.start),y=Math.min(o.count,m.start+m.count);for(let f=g,u=y;f<u;f+=3){const S=o.getX(f),v=o.getX(f+1),b=o.getX(f+2);s=os(this,a,t,n,l,h,d,S,v,b),s&&(s.faceIndex=Math.floor(f/3),e.push(s))}}else if(c!==void 0)if(Array.isArray(a))for(let g=0,y=p.length;g<y;g++){const f=p[g],u=a[f.materialIndex],S=Math.max(f.start,m.start),v=Math.min(c.count,Math.min(f.start+f.count,m.start+m.count));for(let b=S,R=v;b<R;b+=3){const C=b,T=b+1,L=b+2;s=os(this,u,t,n,l,h,d,C,T,L),s&&(s.faceIndex=Math.floor(b/3),s.face.materialIndex=f.materialIndex,e.push(s))}}else{const g=Math.max(0,m.start),y=Math.min(c.count,m.start+m.count);for(let f=g,u=y;f<u;f+=3){const S=f,v=f+1,b=f+2;s=os(this,a,t,n,l,h,d,S,v,b),s&&(s.faceIndex=Math.floor(f/3),e.push(s))}}}}function Ul(i,t,e,n,s,r,a,o){let c;if(t.side===be?c=n.intersectTriangle(a,r,s,!0,o):c=n.intersectTriangle(s,r,a,t.side===nn,o),c===null)return null;rs.copy(o),rs.applyMatrix4(i.matrixWorld);const l=e.ray.origin.distanceTo(rs);return l<e.near||l>e.far?null:{distance:l,point:rs.clone(),object:i}}function os(i,t,e,n,s,r,a,o,c,l){i.getVertexPosition(o,oi),i.getVertexPosition(c,ai),i.getVertexPosition(l,ci);const h=Ul(i,t,e,n,oi,ai,ci,ss);if(h){s&&(es.fromBufferAttribute(s,o),ns.fromBufferAttribute(s,c),is.fromBufferAttribute(s,l),h.uv=tn.getInterpolation(ss,oi,ai,ci,es,ns,is,new qt)),r&&(es.fromBufferAttribute(r,o),ns.fromBufferAttribute(r,c),is.fromBufferAttribute(r,l),h.uv1=tn.getInterpolation(ss,oi,ai,ci,es,ns,is,new qt)),a&&(Fo.fromBufferAttribute(a,o),Oo.fromBufferAttribute(a,c),zo.fromBufferAttribute(a,l),h.normal=tn.getInterpolation(ss,oi,ai,ci,Fo,Oo,zo,new A),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));const d={a:o,b:c,c:l,normal:new A,materialIndex:0};tn.getNormal(oi,ai,ci,d.normal),h.face=d}return h}class dt extends ee{constructor(t=1,e=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};const o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);const c=[],l=[],h=[],d=[];let p=0,m=0;g("z","y","x",-1,-1,n,e,t,a,r,0),g("z","y","x",1,-1,n,e,-t,a,r,1),g("x","z","y",1,1,t,n,e,s,a,2),g("x","z","y",1,-1,t,n,-e,s,a,3),g("x","y","z",1,-1,t,e,n,s,r,4),g("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(c),this.setAttribute("position",new xe(l,3)),this.setAttribute("normal",new xe(h,3)),this.setAttribute("uv",new xe(d,2));function g(y,f,u,S,v,b,R,C,T,L,W){const _=b/T,E=R/L,j=b/2,K=R/2,I=C/2,Y=T+1,V=L+1;let tt=0,q=0;const Z=new A;for(let et=0;et<V;et++){const ot=et*E-K;for(let xt=0;xt<Y;xt++){const Pt=xt*_-j;Z[y]=Pt*S,Z[f]=ot*v,Z[u]=I,l.push(Z.x,Z.y,Z.z),Z[y]=0,Z[f]=0,Z[u]=C>0?1:-1,h.push(Z.x,Z.y,Z.z),d.push(xt/T),d.push(1-et/L),tt+=1}}for(let et=0;et<L;et++)for(let ot=0;ot<T;ot++){const xt=p+ot+Y*et,Pt=p+ot+Y*(et+1),G=p+(ot+1)+Y*(et+1),nt=p+(ot+1)+Y*et;c.push(xt,Pt,nt),c.push(Pt,G,nt),q+=6}o.addGroup(m,q,W),m+=q,p+=tt}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new dt(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function Mi(i){const t={};for(const e in i){t[e]={};for(const n in i[e]){const s=i[e][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone():Array.isArray(s)?t[e][n]=s.slice():t[e][n]=s}}return t}function Pe(i){const t={};for(let e=0;e<i.length;e++){const n=Mi(i[e]);for(const s in n)t[s]=n[s]}return t}function Nl(i){const t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function Ga(i){return i.getRenderTarget()===null?i.outputColorSpace:Qt.workingColorSpace}const Fl={clone:Mi,merge:Pe};var Ol=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,zl=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class pn extends Yn{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Ol,this.fragmentShader=zl,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1,clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Mi(t.uniforms),this.uniformsGroups=Nl(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const s in this.uniforms){const a=this.uniforms[s].value;a&&a.isTexture?e.uniforms[s]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[s]={type:"m4",value:a.toArray()}:e.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}}class Ha extends pe{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new le,this.projectionMatrix=new le,this.projectionMatrixInverse=new le,this.coordinateSystem=fn}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const Mn=new A,ko=new qt,Bo=new qt;class de extends Ha{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=yi*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(Ii*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return yi*2*Math.atan(Math.tan(Ii*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){Mn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(Mn.x,Mn.y).multiplyScalar(-t/Mn.z),Mn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Mn.x,Mn.y).multiplyScalar(-t/Mn.z)}getViewSize(t,e){return this.getViewBounds(t,ko,Bo),e.subVectors(Bo,ko)}setViewOffset(t,e,n,s,r,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(Ii*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s;const a=this.view;if(this.view!==null&&this.view.enabled){const c=a.fullWidth,l=a.fullHeight;r+=a.offsetX*s/c,e-=a.offsetY*n/l,s*=a.width/c,n*=a.height/l}const o=this.filmOffset;o!==0&&(r+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const li=-90,hi=1;class kl extends pe{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new de(li,hi,t,e);s.layers=this.layers,this.add(s);const r=new de(li,hi,t,e);r.layers=this.layers,this.add(r);const a=new de(li,hi,t,e);a.layers=this.layers,this.add(a);const o=new de(li,hi,t,e);o.layers=this.layers,this.add(o);const c=new de(li,hi,t,e);c.layers=this.layers,this.add(c);const l=new de(li,hi,t,e);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,s,r,a,o,c]=e;for(const l of e)this.remove(l);if(t===fn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(t===_s)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const l of e)this.add(l),l.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[r,a,o,c,l,h]=this.children,d=t.getRenderTarget(),p=t.getActiveCubeFace(),m=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;const y=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,s),t.render(e,r),t.setRenderTarget(n,1,s),t.render(e,a),t.setRenderTarget(n,2,s),t.render(e,o),t.setRenderTarget(n,3,s),t.render(e,c),t.setRenderTarget(n,4,s),t.render(e,l),n.texture.generateMipmaps=y,t.setRenderTarget(n,5,s),t.render(e,h),t.setRenderTarget(d,p,m),t.xr.enabled=g,n.texture.needsPMREMUpdate=!0}}class Va extends De{constructor(t,e,n,s,r,a,o,c,l,h){t=t!==void 0?t:[],e=e!==void 0?e:xi,super(t,e,n,s,r,a,o,c,l,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class Bl extends $n{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new Va(s,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:Ne}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new dt(5,5,5),r=new pn({name:"CubemapFromEquirect",uniforms:Mi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:be,blending:Sn});r.uniforms.tEquirect.value=e;const a=new P(s,r),o=e.minFilter;return e.minFilter===Wn&&(e.minFilter=Ne),new kl(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e,n,s){const r=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,n,s);t.setRenderTarget(r)}}const ir=new A,Gl=new A,Hl=new Vt;class Bn{constructor(t=new A(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const s=ir.subVectors(n,e).cross(Gl.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const n=t.delta(ir),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const r=-(t.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:e.copy(t.start).addScaledVector(n,r)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||Hl.getNormalMatrix(t),s=this.coplanarPoint(ir).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const Fn=new zi,as=new A;class Rr{constructor(t=new Bn,e=new Bn,n=new Bn,s=new Bn,r=new Bn,a=new Bn){this.planes=[t,e,n,s,r,a]}set(t,e,n,s,r,a){const o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=fn){const n=this.planes,s=t.elements,r=s[0],a=s[1],o=s[2],c=s[3],l=s[4],h=s[5],d=s[6],p=s[7],m=s[8],g=s[9],y=s[10],f=s[11],u=s[12],S=s[13],v=s[14],b=s[15];if(n[0].setComponents(c-r,p-l,f-m,b-u).normalize(),n[1].setComponents(c+r,p+l,f+m,b+u).normalize(),n[2].setComponents(c+a,p+h,f+g,b+S).normalize(),n[3].setComponents(c-a,p-h,f-g,b-S).normalize(),n[4].setComponents(c-o,p-d,f-y,b-v).normalize(),e===fn)n[5].setComponents(c+o,p+d,f+y,b+v).normalize();else if(e===_s)n[5].setComponents(o,d,y,v).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Fn.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Fn.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Fn)}intersectsSprite(t){return Fn.center.set(0,0,0),Fn.radius=.7071067811865476,Fn.applyMatrix4(t.matrixWorld),this.intersectsSphere(Fn)}intersectsSphere(t){const e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const s=e[n];if(as.x=s.normal.x>0?t.max.x:t.min.x,as.y=s.normal.y>0?t.max.y:t.min.y,as.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(as)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function Wa(){let i=null,t=!1,e=null,n=null;function s(r,a){e(r,a),n=i.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function Vl(i,t){const e=t.isWebGL2,n=new WeakMap;function s(l,h){const d=l.array,p=l.usage,m=d.byteLength,g=i.createBuffer();i.bindBuffer(h,g),i.bufferData(h,d,p),l.onUploadCallback();let y;if(d instanceof Float32Array)y=i.FLOAT;else if(d instanceof Uint16Array)if(l.isFloat16BufferAttribute)if(e)y=i.HALF_FLOAT;else throw new Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");else y=i.UNSIGNED_SHORT;else if(d instanceof Int16Array)y=i.SHORT;else if(d instanceof Uint32Array)y=i.UNSIGNED_INT;else if(d instanceof Int32Array)y=i.INT;else if(d instanceof Int8Array)y=i.BYTE;else if(d instanceof Uint8Array)y=i.UNSIGNED_BYTE;else if(d instanceof Uint8ClampedArray)y=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+d);return{buffer:g,type:y,bytesPerElement:d.BYTES_PER_ELEMENT,version:l.version,size:m}}function r(l,h,d){const p=h.array,m=h._updateRange,g=h.updateRanges;if(i.bindBuffer(d,l),m.count===-1&&g.length===0&&i.bufferSubData(d,0,p),g.length!==0){for(let y=0,f=g.length;y<f;y++){const u=g[y];e?i.bufferSubData(d,u.start*p.BYTES_PER_ELEMENT,p,u.start,u.count):i.bufferSubData(d,u.start*p.BYTES_PER_ELEMENT,p.subarray(u.start,u.start+u.count))}h.clearUpdateRanges()}m.count!==-1&&(e?i.bufferSubData(d,m.offset*p.BYTES_PER_ELEMENT,p,m.offset,m.count):i.bufferSubData(d,m.offset*p.BYTES_PER_ELEMENT,p.subarray(m.offset,m.offset+m.count)),m.count=-1),h.onUploadCallback()}function a(l){return l.isInterleavedBufferAttribute&&(l=l.data),n.get(l)}function o(l){l.isInterleavedBufferAttribute&&(l=l.data);const h=n.get(l);h&&(i.deleteBuffer(h.buffer),n.delete(l))}function c(l,h){if(l.isGLBufferAttribute){const p=n.get(l);(!p||p.version<l.version)&&n.set(l,{buffer:l.buffer,type:l.type,bytesPerElement:l.elementSize,version:l.version});return}l.isInterleavedBufferAttribute&&(l=l.data);const d=n.get(l);if(d===void 0)n.set(l,s(l,h));else if(d.version<l.version){if(d.size!==l.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");r(d.buffer,l,h),d.version=l.version}}return{get:a,remove:o,update:c}}class Ve extends ee{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};const r=t/2,a=e/2,o=Math.floor(n),c=Math.floor(s),l=o+1,h=c+1,d=t/o,p=e/c,m=[],g=[],y=[],f=[];for(let u=0;u<h;u++){const S=u*p-a;for(let v=0;v<l;v++){const b=v*d-r;g.push(b,-S,0),y.push(0,0,1),f.push(v/o),f.push(1-u/c)}}for(let u=0;u<c;u++)for(let S=0;S<o;S++){const v=S+l*u,b=S+l*(u+1),R=S+1+l*(u+1),C=S+1+l*u;m.push(v,b,C),m.push(b,R,C)}this.setIndex(m),this.setAttribute("position",new xe(g,3)),this.setAttribute("normal",new xe(y,3)),this.setAttribute("uv",new xe(f,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ve(t.width,t.height,t.widthSegments,t.heightSegments)}}var Wl=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Xl=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,ql=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,$l=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Yl=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,jl=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Kl=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Zl=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Jl=`#ifdef USE_BATCHING
	attribute float batchId;
	uniform highp sampler2D batchingTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Ql=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( batchId );
#endif`,th=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,eh=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,nh=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,ih=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,sh=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,rh=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,oh=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,ah=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,ch=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,lh=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,hh=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,dh=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	varying vec3 vColor;
#endif`,uh=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif`,fh=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
float luminance( const in vec3 rgb ) {
	const vec3 weights = vec3( 0.2126729, 0.7151522, 0.0721750 );
	return dot( weights, rgb );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,ph=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,mh=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,gh=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,xh=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,_h=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,vh=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,yh="gl_FragColor = linearToOutputTexel( gl_FragColor );",Mh=`
const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}
vec4 LinearToLinear( in vec4 value ) {
	return value;
}
vec4 LinearTosRGB( in vec4 value ) {
	return sRGBTransferOETF( value );
}`,bh=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,wh=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Sh=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Eh=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Th=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Ah=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Ch=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Rh=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Ph=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Lh=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Ih=`#ifdef USE_LIGHTMAP
	vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
	vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
	reflectedLight.indirectDiffuse += lightMapIrradiance;
#endif`,Dh=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Uh=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Nh=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Fh=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	#if defined ( LEGACY_LIGHTS )
		if ( cutoffDistance > 0.0 && decayExponent > 0.0 ) {
			return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );
		}
		return 1.0;
	#else
		float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
		if ( cutoffDistance > 0.0 ) {
			distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
		}
		return distanceFalloff;
	#endif
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Oh=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,zh=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,kh=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Bh=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Gh=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Hh=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Vh=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Wh=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Xh=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,qh=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,$h=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Yh=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,jh=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
		varying float vIsPerspective;
	#else
		uniform float logDepthBufFC;
	#endif
#endif`,Kh=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
	#else
		if ( isPerspectiveMatrix( projectionMatrix ) ) {
			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
			gl_Position.z *= gl_Position.w;
		}
	#endif
#endif`,Zh=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Jh=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Qh=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,td=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,ed=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,nd=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,id=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[MORPHTARGETS_COUNT];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,sd=`#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,rd=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		objectNormal += morphNormal0 * morphTargetInfluences[ 0 ];
		objectNormal += morphNormal1 * morphTargetInfluences[ 1 ];
		objectNormal += morphNormal2 * morphTargetInfluences[ 2 ];
		objectNormal += morphNormal3 * morphTargetInfluences[ 3 ];
	#endif
#endif`,od=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
	#endif
	#ifdef MORPHTARGETS_TEXTURE
		#ifndef USE_INSTANCING_MORPH
			uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
		#endif
		uniform sampler2DArray morphTargetsTexture;
		uniform ivec2 morphTargetsTextureSize;
		vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
			int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
			int y = texelIndex / morphTargetsTextureSize.x;
			int x = texelIndex - y * morphTargetsTextureSize.x;
			ivec3 morphUV = ivec3( x, y, morphTargetIndex );
			return texelFetch( morphTargetsTexture, morphUV, 0 );
		}
	#else
		#ifndef USE_MORPHNORMALS
			uniform float morphTargetInfluences[ 8 ];
		#else
			uniform float morphTargetInfluences[ 4 ];
		#endif
	#endif
#endif`,ad=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		transformed += morphTarget0 * morphTargetInfluences[ 0 ];
		transformed += morphTarget1 * morphTargetInfluences[ 1 ];
		transformed += morphTarget2 * morphTargetInfluences[ 2 ];
		transformed += morphTarget3 * morphTargetInfluences[ 3 ];
		#ifndef USE_MORPHNORMALS
			transformed += morphTarget4 * morphTargetInfluences[ 4 ];
			transformed += morphTarget5 * morphTargetInfluences[ 5 ];
			transformed += morphTarget6 * morphTargetInfluences[ 6 ];
			transformed += morphTarget7 * morphTargetInfluences[ 7 ];
		#endif
	#endif
#endif`,cd=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,ld=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,hd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,dd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,ud=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,fd=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,pd=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,md=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,gd=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,xd=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,_d=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,vd=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
const float ShiftRight8 = 1. / 256.;
vec4 packDepthToRGBA( const in float v ) {
	vec4 r = vec4( fract( v * PackFactors ), v );
	r.yzw -= r.xyz * ShiftRight8;	return r * PackUpscale;
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors );
}
vec2 packDepthToRG( in highp float v ) {
	return packDepthToRGBA( v ).yx;
}
float unpackRGToDepth( const in highp vec2 v ) {
	return unpackRGBAToDepth( vec4( v.xy, 0.0, 0.0 ) );
}
vec4 pack2HalfToRGBA( vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,yd=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Md=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,bd=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,wd=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Sd=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Ed=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Td=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return shadow;
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
		vec3 lightToPosition = shadowCoord.xyz;
		float dp = ( length( lightToPosition ) - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );		dp += shadowBias;
		vec3 bd3D = normalize( lightToPosition );
		#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
			vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
			return (
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
			) * ( 1.0 / 9.0 );
		#else
			return texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
		#endif
	}
#endif`,Ad=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Cd=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Rd=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Pd=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Ld=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Id=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Dd=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Ud=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Nd=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Fd=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Od=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 OptimizedCineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	float startCompression = 0.8 - 0.04;
	float desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min(color.r, min(color.g, color.b));
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max(color.r, max(color.g, color.b));
	if (peak < startCompression) return color;
	float d = 1. - startCompression;
	float newPeak = 1. - d * d / (peak + d - startCompression);
	color *= newPeak / peak;
	float g = 1. - 1. / (desaturation * (peak - newPeak) + 1.);
	return mix(color, vec3(1, 1, 1), g);
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,zd=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,kd=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
		vec3 refractedRayExit = position + transmissionRay;
		vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
		vec2 refractionCoords = ndcPos.xy / ndcPos.w;
		refractionCoords += 1.0;
		refractionCoords /= 2.0;
		vec4 transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
		vec3 transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Bd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Gd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Hd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Vd=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Wd=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Xd=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,qd=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,$d=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Yd=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,jd=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Kd=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Zd=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#endif
}`,Jd=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Qd=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,tu=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,eu=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,nu=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,iu=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,su=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,ru=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ou=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,au=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,cu=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,lu=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,hu=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,du=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,uu=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,fu=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,pu=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,mu=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,gu=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,xu=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,_u=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,vu=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,yu=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Mu=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,bu=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
	vec2 scale;
	scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
	scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,wu=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ht={alphahash_fragment:Wl,alphahash_pars_fragment:Xl,alphamap_fragment:ql,alphamap_pars_fragment:$l,alphatest_fragment:Yl,alphatest_pars_fragment:jl,aomap_fragment:Kl,aomap_pars_fragment:Zl,batching_pars_vertex:Jl,batching_vertex:Ql,begin_vertex:th,beginnormal_vertex:eh,bsdfs:nh,iridescence_fragment:ih,bumpmap_pars_fragment:sh,clipping_planes_fragment:rh,clipping_planes_pars_fragment:oh,clipping_planes_pars_vertex:ah,clipping_planes_vertex:ch,color_fragment:lh,color_pars_fragment:hh,color_pars_vertex:dh,color_vertex:uh,common:fh,cube_uv_reflection_fragment:ph,defaultnormal_vertex:mh,displacementmap_pars_vertex:gh,displacementmap_vertex:xh,emissivemap_fragment:_h,emissivemap_pars_fragment:vh,colorspace_fragment:yh,colorspace_pars_fragment:Mh,envmap_fragment:bh,envmap_common_pars_fragment:wh,envmap_pars_fragment:Sh,envmap_pars_vertex:Eh,envmap_physical_pars_fragment:Oh,envmap_vertex:Th,fog_vertex:Ah,fog_pars_vertex:Ch,fog_fragment:Rh,fog_pars_fragment:Ph,gradientmap_pars_fragment:Lh,lightmap_fragment:Ih,lightmap_pars_fragment:Dh,lights_lambert_fragment:Uh,lights_lambert_pars_fragment:Nh,lights_pars_begin:Fh,lights_toon_fragment:zh,lights_toon_pars_fragment:kh,lights_phong_fragment:Bh,lights_phong_pars_fragment:Gh,lights_physical_fragment:Hh,lights_physical_pars_fragment:Vh,lights_fragment_begin:Wh,lights_fragment_maps:Xh,lights_fragment_end:qh,logdepthbuf_fragment:$h,logdepthbuf_pars_fragment:Yh,logdepthbuf_pars_vertex:jh,logdepthbuf_vertex:Kh,map_fragment:Zh,map_pars_fragment:Jh,map_particle_fragment:Qh,map_particle_pars_fragment:td,metalnessmap_fragment:ed,metalnessmap_pars_fragment:nd,morphinstance_vertex:id,morphcolor_vertex:sd,morphnormal_vertex:rd,morphtarget_pars_vertex:od,morphtarget_vertex:ad,normal_fragment_begin:cd,normal_fragment_maps:ld,normal_pars_fragment:hd,normal_pars_vertex:dd,normal_vertex:ud,normalmap_pars_fragment:fd,clearcoat_normal_fragment_begin:pd,clearcoat_normal_fragment_maps:md,clearcoat_pars_fragment:gd,iridescence_pars_fragment:xd,opaque_fragment:_d,packing:vd,premultiplied_alpha_fragment:yd,project_vertex:Md,dithering_fragment:bd,dithering_pars_fragment:wd,roughnessmap_fragment:Sd,roughnessmap_pars_fragment:Ed,shadowmap_pars_fragment:Td,shadowmap_pars_vertex:Ad,shadowmap_vertex:Cd,shadowmask_pars_fragment:Rd,skinbase_vertex:Pd,skinning_pars_vertex:Ld,skinning_vertex:Id,skinnormal_vertex:Dd,specularmap_fragment:Ud,specularmap_pars_fragment:Nd,tonemapping_fragment:Fd,tonemapping_pars_fragment:Od,transmission_fragment:zd,transmission_pars_fragment:kd,uv_pars_fragment:Bd,uv_pars_vertex:Gd,uv_vertex:Hd,worldpos_vertex:Vd,background_vert:Wd,background_frag:Xd,backgroundCube_vert:qd,backgroundCube_frag:$d,cube_vert:Yd,cube_frag:jd,depth_vert:Kd,depth_frag:Zd,distanceRGBA_vert:Jd,distanceRGBA_frag:Qd,equirect_vert:tu,equirect_frag:eu,linedashed_vert:nu,linedashed_frag:iu,meshbasic_vert:su,meshbasic_frag:ru,meshlambert_vert:ou,meshlambert_frag:au,meshmatcap_vert:cu,meshmatcap_frag:lu,meshnormal_vert:hu,meshnormal_frag:du,meshphong_vert:uu,meshphong_frag:fu,meshphysical_vert:pu,meshphysical_frag:mu,meshtoon_vert:gu,meshtoon_frag:xu,points_vert:_u,points_frag:vu,shadow_vert:yu,shadow_frag:Mu,sprite_vert:bu,sprite_frag:wu},lt={common:{diffuse:{value:new Ct(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Vt},alphaMap:{value:null},alphaMapTransform:{value:new Vt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Vt}},envmap:{envMap:{value:null},envMapRotation:{value:new Vt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Vt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Vt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Vt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Vt},normalScale:{value:new qt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Vt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Vt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Vt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Vt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ct(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Ct(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Vt},alphaTest:{value:0},uvTransform:{value:new Vt}},sprite:{diffuse:{value:new Ct(16777215)},opacity:{value:1},center:{value:new qt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Vt},alphaMap:{value:null},alphaMapTransform:{value:new Vt},alphaTest:{value:0}}},Qe={basic:{uniforms:Pe([lt.common,lt.specularmap,lt.envmap,lt.aomap,lt.lightmap,lt.fog]),vertexShader:Ht.meshbasic_vert,fragmentShader:Ht.meshbasic_frag},lambert:{uniforms:Pe([lt.common,lt.specularmap,lt.envmap,lt.aomap,lt.lightmap,lt.emissivemap,lt.bumpmap,lt.normalmap,lt.displacementmap,lt.fog,lt.lights,{emissive:{value:new Ct(0)}}]),vertexShader:Ht.meshlambert_vert,fragmentShader:Ht.meshlambert_frag},phong:{uniforms:Pe([lt.common,lt.specularmap,lt.envmap,lt.aomap,lt.lightmap,lt.emissivemap,lt.bumpmap,lt.normalmap,lt.displacementmap,lt.fog,lt.lights,{emissive:{value:new Ct(0)},specular:{value:new Ct(1118481)},shininess:{value:30}}]),vertexShader:Ht.meshphong_vert,fragmentShader:Ht.meshphong_frag},standard:{uniforms:Pe([lt.common,lt.envmap,lt.aomap,lt.lightmap,lt.emissivemap,lt.bumpmap,lt.normalmap,lt.displacementmap,lt.roughnessmap,lt.metalnessmap,lt.fog,lt.lights,{emissive:{value:new Ct(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ht.meshphysical_vert,fragmentShader:Ht.meshphysical_frag},toon:{uniforms:Pe([lt.common,lt.aomap,lt.lightmap,lt.emissivemap,lt.bumpmap,lt.normalmap,lt.displacementmap,lt.gradientmap,lt.fog,lt.lights,{emissive:{value:new Ct(0)}}]),vertexShader:Ht.meshtoon_vert,fragmentShader:Ht.meshtoon_frag},matcap:{uniforms:Pe([lt.common,lt.bumpmap,lt.normalmap,lt.displacementmap,lt.fog,{matcap:{value:null}}]),vertexShader:Ht.meshmatcap_vert,fragmentShader:Ht.meshmatcap_frag},points:{uniforms:Pe([lt.points,lt.fog]),vertexShader:Ht.points_vert,fragmentShader:Ht.points_frag},dashed:{uniforms:Pe([lt.common,lt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ht.linedashed_vert,fragmentShader:Ht.linedashed_frag},depth:{uniforms:Pe([lt.common,lt.displacementmap]),vertexShader:Ht.depth_vert,fragmentShader:Ht.depth_frag},normal:{uniforms:Pe([lt.common,lt.bumpmap,lt.normalmap,lt.displacementmap,{opacity:{value:1}}]),vertexShader:Ht.meshnormal_vert,fragmentShader:Ht.meshnormal_frag},sprite:{uniforms:Pe([lt.sprite,lt.fog]),vertexShader:Ht.sprite_vert,fragmentShader:Ht.sprite_frag},background:{uniforms:{uvTransform:{value:new Vt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ht.background_vert,fragmentShader:Ht.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Vt}},vertexShader:Ht.backgroundCube_vert,fragmentShader:Ht.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ht.cube_vert,fragmentShader:Ht.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ht.equirect_vert,fragmentShader:Ht.equirect_frag},distanceRGBA:{uniforms:Pe([lt.common,lt.displacementmap,{referencePosition:{value:new A},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ht.distanceRGBA_vert,fragmentShader:Ht.distanceRGBA_frag},shadow:{uniforms:Pe([lt.lights,lt.fog,{color:{value:new Ct(0)},opacity:{value:1}}]),vertexShader:Ht.shadow_vert,fragmentShader:Ht.shadow_frag}};Qe.physical={uniforms:Pe([Qe.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Vt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Vt},clearcoatNormalScale:{value:new qt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Vt},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Vt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Vt},sheen:{value:0},sheenColor:{value:new Ct(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Vt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Vt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Vt},transmissionSamplerSize:{value:new qt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Vt},attenuationDistance:{value:0},attenuationColor:{value:new Ct(0)},specularColor:{value:new Ct(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Vt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Vt},anisotropyVector:{value:new qt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Vt}}]),vertexShader:Ht.meshphysical_vert,fragmentShader:Ht.meshphysical_frag};const cs={r:0,b:0,g:0},On=new sn,Su=new le;function Eu(i,t,e,n,s,r,a){const o=new Ct(0);let c=r===!0?0:1,l,h,d=null,p=0,m=null;function g(f,u){let S=!1,v=u.isScene===!0?u.background:null;v&&v.isTexture&&(v=(u.backgroundBlurriness>0?e:t).get(v)),v===null?y(o,c):v&&v.isColor&&(y(v,1),S=!0);const b=i.xr.getEnvironmentBlendMode();b==="additive"?n.buffers.color.setClear(0,0,0,1,a):b==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(i.autoClear||S)&&i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil),v&&(v.isCubeTexture||v.mapping===ws)?(h===void 0&&(h=new P(new dt(1,1,1),new pn({name:"BackgroundCubeMaterial",uniforms:Mi(Qe.backgroundCube.uniforms),vertexShader:Qe.backgroundCube.vertexShader,fragmentShader:Qe.backgroundCube.fragmentShader,side:be,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(R,C,T){this.matrixWorld.copyPosition(T.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),On.copy(u.backgroundRotation),On.x*=-1,On.y*=-1,On.z*=-1,v.isCubeTexture&&v.isRenderTargetTexture===!1&&(On.y*=-1,On.z*=-1),h.material.uniforms.envMap.value=v,h.material.uniforms.flipEnvMap.value=v.isCubeTexture&&v.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=u.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=u.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(Su.makeRotationFromEuler(On)),h.material.toneMapped=Qt.getTransfer(v.colorSpace)!==re,(d!==v||p!==v.version||m!==i.toneMapping)&&(h.material.needsUpdate=!0,d=v,p=v.version,m=i.toneMapping),h.layers.enableAll(),f.unshift(h,h.geometry,h.material,0,0,null)):v&&v.isTexture&&(l===void 0&&(l=new P(new Ve(2,2),new pn({name:"BackgroundMaterial",uniforms:Mi(Qe.background.uniforms),vertexShader:Qe.background.vertexShader,fragmentShader:Qe.background.fragmentShader,side:nn,depthTest:!1,depthWrite:!1,fog:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(l)),l.material.uniforms.t2D.value=v,l.material.uniforms.backgroundIntensity.value=u.backgroundIntensity,l.material.toneMapped=Qt.getTransfer(v.colorSpace)!==re,v.matrixAutoUpdate===!0&&v.updateMatrix(),l.material.uniforms.uvTransform.value.copy(v.matrix),(d!==v||p!==v.version||m!==i.toneMapping)&&(l.material.needsUpdate=!0,d=v,p=v.version,m=i.toneMapping),l.layers.enableAll(),f.unshift(l,l.geometry,l.material,0,0,null))}function y(f,u){f.getRGB(cs,Ga(i)),n.buffers.color.setClear(cs.r,cs.g,cs.b,u,a)}return{getClearColor:function(){return o},setClearColor:function(f,u=1){o.set(f),c=u,y(o,c)},getClearAlpha:function(){return c},setClearAlpha:function(f){c=f,y(o,c)},render:g}}function Tu(i,t,e,n){const s=i.getParameter(i.MAX_VERTEX_ATTRIBS),r=n.isWebGL2?null:t.get("OES_vertex_array_object"),a=n.isWebGL2||r!==null,o={},c=f(null);let l=c,h=!1;function d(I,Y,V,tt,q){let Z=!1;if(a){const et=y(tt,V,Y);l!==et&&(l=et,m(l.object)),Z=u(I,tt,V,q),Z&&S(I,tt,V,q)}else{const et=Y.wireframe===!0;(l.geometry!==tt.id||l.program!==V.id||l.wireframe!==et)&&(l.geometry=tt.id,l.program=V.id,l.wireframe=et,Z=!0)}q!==null&&e.update(q,i.ELEMENT_ARRAY_BUFFER),(Z||h)&&(h=!1,L(I,Y,V,tt),q!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(q).buffer))}function p(){return n.isWebGL2?i.createVertexArray():r.createVertexArrayOES()}function m(I){return n.isWebGL2?i.bindVertexArray(I):r.bindVertexArrayOES(I)}function g(I){return n.isWebGL2?i.deleteVertexArray(I):r.deleteVertexArrayOES(I)}function y(I,Y,V){const tt=V.wireframe===!0;let q=o[I.id];q===void 0&&(q={},o[I.id]=q);let Z=q[Y.id];Z===void 0&&(Z={},q[Y.id]=Z);let et=Z[tt];return et===void 0&&(et=f(p()),Z[tt]=et),et}function f(I){const Y=[],V=[],tt=[];for(let q=0;q<s;q++)Y[q]=0,V[q]=0,tt[q]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:Y,enabledAttributes:V,attributeDivisors:tt,object:I,attributes:{},index:null}}function u(I,Y,V,tt){const q=l.attributes,Z=Y.attributes;let et=0;const ot=V.getAttributes();for(const xt in ot)if(ot[xt].location>=0){const G=q[xt];let nt=Z[xt];if(nt===void 0&&(xt==="instanceMatrix"&&I.instanceMatrix&&(nt=I.instanceMatrix),xt==="instanceColor"&&I.instanceColor&&(nt=I.instanceColor)),G===void 0||G.attribute!==nt||nt&&G.data!==nt.data)return!0;et++}return l.attributesNum!==et||l.index!==tt}function S(I,Y,V,tt){const q={},Z=Y.attributes;let et=0;const ot=V.getAttributes();for(const xt in ot)if(ot[xt].location>=0){let G=Z[xt];G===void 0&&(xt==="instanceMatrix"&&I.instanceMatrix&&(G=I.instanceMatrix),xt==="instanceColor"&&I.instanceColor&&(G=I.instanceColor));const nt={};nt.attribute=G,G&&G.data&&(nt.data=G.data),q[xt]=nt,et++}l.attributes=q,l.attributesNum=et,l.index=tt}function v(){const I=l.newAttributes;for(let Y=0,V=I.length;Y<V;Y++)I[Y]=0}function b(I){R(I,0)}function R(I,Y){const V=l.newAttributes,tt=l.enabledAttributes,q=l.attributeDivisors;V[I]=1,tt[I]===0&&(i.enableVertexAttribArray(I),tt[I]=1),q[I]!==Y&&((n.isWebGL2?i:t.get("ANGLE_instanced_arrays"))[n.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](I,Y),q[I]=Y)}function C(){const I=l.newAttributes,Y=l.enabledAttributes;for(let V=0,tt=Y.length;V<tt;V++)Y[V]!==I[V]&&(i.disableVertexAttribArray(V),Y[V]=0)}function T(I,Y,V,tt,q,Z,et){et===!0?i.vertexAttribIPointer(I,Y,V,q,Z):i.vertexAttribPointer(I,Y,V,tt,q,Z)}function L(I,Y,V,tt){if(n.isWebGL2===!1&&(I.isInstancedMesh||tt.isInstancedBufferGeometry)&&t.get("ANGLE_instanced_arrays")===null)return;v();const q=tt.attributes,Z=V.getAttributes(),et=Y.defaultAttributeValues;for(const ot in Z){const xt=Z[ot];if(xt.location>=0){let Pt=q[ot];if(Pt===void 0&&(ot==="instanceMatrix"&&I.instanceMatrix&&(Pt=I.instanceMatrix),ot==="instanceColor"&&I.instanceColor&&(Pt=I.instanceColor)),Pt!==void 0){const G=Pt.normalized,nt=Pt.itemSize,mt=e.get(Pt);if(mt===void 0)continue;const Tt=mt.buffer,yt=mt.type,vt=mt.bytesPerElement,zt=n.isWebGL2===!0&&(yt===i.INT||yt===i.UNSIGNED_INT||Pt.gpuType===Sa);if(Pt.isInterleavedBufferAttribute){const Lt=Pt.data,N=Lt.stride,Kt=Pt.offset;if(Lt.isInstancedInterleavedBuffer){for(let ut=0;ut<xt.locationSize;ut++)R(xt.location+ut,Lt.meshPerAttribute);I.isInstancedMesh!==!0&&tt._maxInstanceCount===void 0&&(tt._maxInstanceCount=Lt.meshPerAttribute*Lt.count)}else for(let ut=0;ut<xt.locationSize;ut++)b(xt.location+ut);i.bindBuffer(i.ARRAY_BUFFER,Tt);for(let ut=0;ut<xt.locationSize;ut++)T(xt.location+ut,nt/xt.locationSize,yt,G,N*vt,(Kt+nt/xt.locationSize*ut)*vt,zt)}else{if(Pt.isInstancedBufferAttribute){for(let Lt=0;Lt<xt.locationSize;Lt++)R(xt.location+Lt,Pt.meshPerAttribute);I.isInstancedMesh!==!0&&tt._maxInstanceCount===void 0&&(tt._maxInstanceCount=Pt.meshPerAttribute*Pt.count)}else for(let Lt=0;Lt<xt.locationSize;Lt++)b(xt.location+Lt);i.bindBuffer(i.ARRAY_BUFFER,Tt);for(let Lt=0;Lt<xt.locationSize;Lt++)T(xt.location+Lt,nt/xt.locationSize,yt,G,nt*vt,nt/xt.locationSize*Lt*vt,zt)}}else if(et!==void 0){const G=et[ot];if(G!==void 0)switch(G.length){case 2:i.vertexAttrib2fv(xt.location,G);break;case 3:i.vertexAttrib3fv(xt.location,G);break;case 4:i.vertexAttrib4fv(xt.location,G);break;default:i.vertexAttrib1fv(xt.location,G)}}}}C()}function W(){j();for(const I in o){const Y=o[I];for(const V in Y){const tt=Y[V];for(const q in tt)g(tt[q].object),delete tt[q];delete Y[V]}delete o[I]}}function _(I){if(o[I.id]===void 0)return;const Y=o[I.id];for(const V in Y){const tt=Y[V];for(const q in tt)g(tt[q].object),delete tt[q];delete Y[V]}delete o[I.id]}function E(I){for(const Y in o){const V=o[Y];if(V[I.id]===void 0)continue;const tt=V[I.id];for(const q in tt)g(tt[q].object),delete tt[q];delete V[I.id]}}function j(){K(),h=!0,l!==c&&(l=c,m(l.object))}function K(){c.geometry=null,c.program=null,c.wireframe=!1}return{setup:d,reset:j,resetDefaultState:K,dispose:W,releaseStatesOfGeometry:_,releaseStatesOfProgram:E,initAttributes:v,enableAttribute:b,disableUnusedAttributes:C}}function Au(i,t,e,n){const s=n.isWebGL2;let r;function a(h){r=h}function o(h,d){i.drawArrays(r,h,d),e.update(d,r,1)}function c(h,d,p){if(p===0)return;let m,g;if(s)m=i,g="drawArraysInstanced";else if(m=t.get("ANGLE_instanced_arrays"),g="drawArraysInstancedANGLE",m===null){console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}m[g](r,h,d,p),e.update(d,r,p)}function l(h,d,p){if(p===0)return;const m=t.get("WEBGL_multi_draw");if(m===null)for(let g=0;g<p;g++)this.render(h[g],d[g]);else{m.multiDrawArraysWEBGL(r,h,0,d,0,p);let g=0;for(let y=0;y<p;y++)g+=d[y];e.update(g,r,1)}}this.setMode=a,this.render=o,this.renderInstances=c,this.renderMultiDraw=l}function Cu(i,t,e){let n;function s(){if(n!==void 0)return n;if(t.has("EXT_texture_filter_anisotropic")===!0){const T=t.get("EXT_texture_filter_anisotropic");n=i.getParameter(T.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else n=0;return n}function r(T){if(T==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";T="mediump"}return T==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}const a=typeof WebGL2RenderingContext<"u"&&i.constructor.name==="WebGL2RenderingContext";let o=e.precision!==void 0?e.precision:"highp";const c=r(o);c!==o&&(console.warn("THREE.WebGLRenderer:",o,"not supported, using",c,"instead."),o=c);const l=a||t.has("WEBGL_draw_buffers"),h=e.logarithmicDepthBuffer===!0,d=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),p=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),m=i.getParameter(i.MAX_TEXTURE_SIZE),g=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),y=i.getParameter(i.MAX_VERTEX_ATTRIBS),f=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),u=i.getParameter(i.MAX_VARYING_VECTORS),S=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),v=p>0,b=a||t.has("OES_texture_float"),R=v&&b,C=a?i.getParameter(i.MAX_SAMPLES):0;return{isWebGL2:a,drawBuffers:l,getMaxAnisotropy:s,getMaxPrecision:r,precision:o,logarithmicDepthBuffer:h,maxTextures:d,maxVertexTextures:p,maxTextureSize:m,maxCubemapSize:g,maxAttributes:y,maxVertexUniforms:f,maxVaryings:u,maxFragmentUniforms:S,vertexTextures:v,floatFragmentTextures:b,floatVertexTextures:R,maxSamples:C}}function Ru(i){const t=this;let e=null,n=0,s=!1,r=!1;const a=new Bn,o=new Vt,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(d,p){const m=d.length!==0||p||n!==0||s;return s=p,n=d.length,m},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(d,p){e=h(d,p,0)},this.setState=function(d,p,m){const g=d.clippingPlanes,y=d.clipIntersection,f=d.clipShadows,u=i.get(d);if(!s||g===null||g.length===0||r&&!f)r?h(null):l();else{const S=r?0:n,v=S*4;let b=u.clippingState||null;c.value=b,b=h(g,p,v,m);for(let R=0;R!==v;++R)b[R]=e[R];u.clippingState=b,this.numIntersection=y?this.numPlanes:0,this.numPlanes+=S}};function l(){c.value!==e&&(c.value=e,c.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(d,p,m,g){const y=d!==null?d.length:0;let f=null;if(y!==0){if(f=c.value,g!==!0||f===null){const u=m+y*4,S=p.matrixWorldInverse;o.getNormalMatrix(S),(f===null||f.length<u)&&(f=new Float32Array(u));for(let v=0,b=m;v!==y;++v,b+=4)a.copy(d[v]).applyMatrix4(S,o),a.normal.toArray(f,b),f[b+3]=a.constant}c.value=f,c.needsUpdate=!0}return t.numPlanes=y,t.numIntersection=0,f}}function Pu(i){let t=new WeakMap;function e(a,o){return o===mr?a.mapping=xi:o===gr&&(a.mapping=_i),a}function n(a){if(a&&a.isTexture){const o=a.mapping;if(o===mr||o===gr)if(t.has(a)){const c=t.get(a).texture;return e(c,a.mapping)}else{const c=a.image;if(c&&c.height>0){const l=new Bl(c.height);return l.fromEquirectangularTexture(i,a),t.set(a,l),a.addEventListener("dispose",s),e(l.texture,a.mapping)}else return null}}return a}function s(a){const o=a.target;o.removeEventListener("dispose",s);const c=t.get(o);c!==void 0&&(t.delete(o),c.dispose())}function r(){t=new WeakMap}return{get:n,dispose:r}}class Xa extends Ha{constructor(t=-1,e=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let r=n-t,a=n+t,o=s+e,c=s-e;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=l*this.view.offsetX,a=r+l*this.view.width,o-=h*this.view.offsetY,c=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,c,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}const fi=4,Go=[.125,.215,.35,.446,.526,.582],Vn=20,sr=new Xa,Ho=new Ct;let rr=null,or=0,ar=0;const Gn=(1+Math.sqrt(5))/2,di=1/Gn,Vo=[new A(1,1,1),new A(-1,1,1),new A(1,1,-1),new A(-1,1,-1),new A(0,Gn,di),new A(0,Gn,-di),new A(di,0,Gn),new A(-di,0,Gn),new A(Gn,di,0),new A(-Gn,di,0)];class Wo{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,s=100){rr=this._renderer.getRenderTarget(),or=this._renderer.getActiveCubeFace(),ar=this._renderer.getActiveMipmapLevel(),this._setSize(256);const r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(t,n,s,r),e>0&&this._blur(r,0,0,e),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=$o(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=qo(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(rr,or,ar),t.scissorTest=!1,ls(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===xi||t.mapping===_i?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),rr=this._renderer.getRenderTarget(),or=this._renderer.getActiveCubeFace(),ar=this._renderer.getActiveMipmapLevel();const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:Ne,minFilter:Ne,generateMipmaps:!1,type:Ui,format:Ke,colorSpace:Rn,depthBuffer:!1},s=Xo(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Xo(t,e,n);const{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Lu(r)),this._blurMaterial=Iu(r,t,e)}return s}_compileMaterial(t){const e=new P(this._lodPlanes[0],t);this._renderer.compile(e,sr)}_sceneToCubeUV(t,e,n,s){const o=new de(90,1,e,n),c=[1,-1,1,1,1,1],l=[1,1,1,-1,-1,-1],h=this._renderer,d=h.autoClear,p=h.toneMapping;h.getClearColor(Ho),h.toneMapping=En,h.autoClear=!1;const m=new Jt({name:"PMREM.Background",side:be,depthWrite:!1,depthTest:!1}),g=new P(new dt,m);let y=!1;const f=t.background;f?f.isColor&&(m.color.copy(f),t.background=null,y=!0):(m.color.copy(Ho),y=!0);for(let u=0;u<6;u++){const S=u%3;S===0?(o.up.set(0,c[u],0),o.lookAt(l[u],0,0)):S===1?(o.up.set(0,0,c[u]),o.lookAt(0,l[u],0)):(o.up.set(0,c[u],0),o.lookAt(0,0,l[u]));const v=this._cubeSize;ls(s,S*v,u>2?v:0,v,v),h.setRenderTarget(s),y&&h.render(g,o),h.render(t,o)}g.geometry.dispose(),g.material.dispose(),h.toneMapping=p,h.autoClear=d,t.background=f}_textureToCubeUV(t,e){const n=this._renderer,s=t.mapping===xi||t.mapping===_i;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=$o()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=qo());const r=s?this._cubemapMaterial:this._equirectMaterial,a=new P(this._lodPlanes[0],r),o=r.uniforms;o.envMap.value=t;const c=this._cubeSize;ls(e,0,0,3*c,2*c),n.setRenderTarget(e),n.render(a,sr)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;for(let s=1;s<this._lodPlanes.length;s++){const r=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),a=Vo[(s-1)%Vo.length];this._blur(t,s-1,s,r,a)}e.autoClear=n}_blur(t,e,n,s,r){const a=this._pingPongRenderTarget;this._halfBlur(t,a,e,n,s,"latitudinal",r),this._halfBlur(a,t,n,n,s,"longitudinal",r)}_halfBlur(t,e,n,s,r,a,o){const c=this._renderer,l=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const h=3,d=new P(this._lodPlanes[s],l),p=l.uniforms,m=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*m):2*Math.PI/(2*Vn-1),y=r/g,f=isFinite(r)?1+Math.floor(h*y):Vn;f>Vn&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${f} samples when the maximum is set to ${Vn}`);const u=[];let S=0;for(let T=0;T<Vn;++T){const L=T/y,W=Math.exp(-L*L/2);u.push(W),T===0?S+=W:T<f&&(S+=2*W)}for(let T=0;T<u.length;T++)u[T]=u[T]/S;p.envMap.value=t.texture,p.samples.value=f,p.weights.value=u,p.latitudinal.value=a==="latitudinal",o&&(p.poleAxis.value=o);const{_lodMax:v}=this;p.dTheta.value=g,p.mipInt.value=v-n;const b=this._sizeLods[s],R=3*b*(s>v-fi?s-v+fi:0),C=4*(this._cubeSize-b);ls(e,R,C,3*b,2*b),c.setRenderTarget(e),c.render(d,sr)}}function Lu(i){const t=[],e=[],n=[];let s=i;const r=i-fi+1+Go.length;for(let a=0;a<r;a++){const o=Math.pow(2,s);e.push(o);let c=1/o;a>i-fi?c=Go[a-i+fi-1]:a===0&&(c=0),n.push(c);const l=1/(o-2),h=-l,d=1+l,p=[h,h,d,h,d,d,h,h,d,d,h,d],m=6,g=6,y=3,f=2,u=1,S=new Float32Array(y*g*m),v=new Float32Array(f*g*m),b=new Float32Array(u*g*m);for(let C=0;C<m;C++){const T=C%3*2/3-1,L=C>2?0:-1,W=[T,L,0,T+2/3,L,0,T+2/3,L+1,0,T,L,0,T+2/3,L+1,0,T,L+1,0];S.set(W,y*g*C),v.set(p,f*g*C);const _=[C,C,C,C,C,C];b.set(_,u*g*C)}const R=new ee;R.setAttribute("position",new Zt(S,y)),R.setAttribute("uv",new Zt(v,f)),R.setAttribute("faceIndex",new Zt(b,u)),t.push(R),s>fi&&s--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function Xo(i,t,e){const n=new $n(i,t,e);return n.texture.mapping=ws,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function ls(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function Iu(i,t,e){const n=new Float32Array(Vn),s=new A(0,1,0);return new pn({name:"SphericalGaussianBlur",defines:{n:Vn,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Pr(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Sn,depthTest:!1,depthWrite:!1})}function qo(){return new pn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Pr(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Sn,depthTest:!1,depthWrite:!1})}function $o(){return new pn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Pr(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Sn,depthTest:!1,depthWrite:!1})}function Pr(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Du(i){let t=new WeakMap,e=null;function n(o){if(o&&o.isTexture){const c=o.mapping,l=c===mr||c===gr,h=c===xi||c===_i;if(l||h)if(o.isRenderTargetTexture&&o.needsPMREMUpdate===!0){o.needsPMREMUpdate=!1;let d=t.get(o);return e===null&&(e=new Wo(i)),d=l?e.fromEquirectangular(o,d):e.fromCubemap(o,d),t.set(o,d),d.texture}else{if(t.has(o))return t.get(o).texture;{const d=o.image;if(l&&d&&d.height>0||h&&d&&s(d)){e===null&&(e=new Wo(i));const p=l?e.fromEquirectangular(o):e.fromCubemap(o);return t.set(o,p),o.addEventListener("dispose",r),p.texture}else return null}}}return o}function s(o){let c=0;const l=6;for(let h=0;h<l;h++)o[h]!==void 0&&c++;return c===l}function r(o){const c=o.target;c.removeEventListener("dispose",r);const l=t.get(c);l!==void 0&&(t.delete(c),l.dispose())}function a(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:a}}function Uu(i){const t={};function e(n){if(t[n]!==void 0)return t[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(n){n.isWebGL2?(e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance")):(e("WEBGL_depth_texture"),e("OES_texture_float"),e("OES_texture_half_float"),e("OES_texture_half_float_linear"),e("OES_standard_derivatives"),e("OES_element_index_uint"),e("OES_vertex_array_object"),e("ANGLE_instanced_arrays")),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture")},get:function(n){const s=e(n);return s===null&&console.warn("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function Nu(i,t,e,n){const s={},r=new WeakMap;function a(d){const p=d.target;p.index!==null&&t.remove(p.index);for(const g in p.attributes)t.remove(p.attributes[g]);for(const g in p.morphAttributes){const y=p.morphAttributes[g];for(let f=0,u=y.length;f<u;f++)t.remove(y[f])}p.removeEventListener("dispose",a),delete s[p.id];const m=r.get(p);m&&(t.remove(m),r.delete(p)),n.releaseStatesOfGeometry(p),p.isInstancedBufferGeometry===!0&&delete p._maxInstanceCount,e.memory.geometries--}function o(d,p){return s[p.id]===!0||(p.addEventListener("dispose",a),s[p.id]=!0,e.memory.geometries++),p}function c(d){const p=d.attributes;for(const g in p)t.update(p[g],i.ARRAY_BUFFER);const m=d.morphAttributes;for(const g in m){const y=m[g];for(let f=0,u=y.length;f<u;f++)t.update(y[f],i.ARRAY_BUFFER)}}function l(d){const p=[],m=d.index,g=d.attributes.position;let y=0;if(m!==null){const S=m.array;y=m.version;for(let v=0,b=S.length;v<b;v+=3){const R=S[v+0],C=S[v+1],T=S[v+2];p.push(R,C,C,T,T,R)}}else if(g!==void 0){const S=g.array;y=g.version;for(let v=0,b=S.length/3-1;v<b;v+=3){const R=v+0,C=v+1,T=v+2;p.push(R,C,C,T,T,R)}}else return;const f=new(Da(p)?Ba:ka)(p,1);f.version=y;const u=r.get(d);u&&t.remove(u),r.set(d,f)}function h(d){const p=r.get(d);if(p){const m=d.index;m!==null&&p.version<m.version&&l(d)}else l(d);return r.get(d)}return{get:o,update:c,getWireframeAttribute:h}}function Fu(i,t,e,n){const s=n.isWebGL2;let r;function a(m){r=m}let o,c;function l(m){o=m.type,c=m.bytesPerElement}function h(m,g){i.drawElements(r,g,o,m*c),e.update(g,r,1)}function d(m,g,y){if(y===0)return;let f,u;if(s)f=i,u="drawElementsInstanced";else if(f=t.get("ANGLE_instanced_arrays"),u="drawElementsInstancedANGLE",f===null){console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}f[u](r,g,o,m*c,y),e.update(g,r,y)}function p(m,g,y){if(y===0)return;const f=t.get("WEBGL_multi_draw");if(f===null)for(let u=0;u<y;u++)this.render(m[u]/c,g[u]);else{f.multiDrawElementsWEBGL(r,g,0,o,m,0,y);let u=0;for(let S=0;S<y;S++)u+=g[S];e.update(u,r,1)}}this.setMode=a,this.setIndex=l,this.render=h,this.renderInstances=d,this.renderMultiDraw=p}function Ou(i){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(e.calls++,a){case i.TRIANGLES:e.triangles+=o*(r/3);break;case i.LINES:e.lines+=o*(r/2);break;case i.LINE_STRIP:e.lines+=o*(r-1);break;case i.LINE_LOOP:e.lines+=o*r;break;case i.POINTS:e.points+=o*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function zu(i,t){return i[0]-t[0]}function ku(i,t){return Math.abs(t[1])-Math.abs(i[1])}function Bu(i,t,e){const n={},s=new Float32Array(8),r=new WeakMap,a=new ce,o=[];for(let l=0;l<8;l++)o[l]=[l,0];function c(l,h,d){const p=l.morphTargetInfluences;if(t.isWebGL2===!0){const g=h.morphAttributes.position||h.morphAttributes.normal||h.morphAttributes.color,y=g!==void 0?g.length:0;let f=r.get(h);if(f===void 0||f.count!==y){let K=function(){E.dispose(),r.delete(h),h.removeEventListener("dispose",K)};var m=K;f!==void 0&&f.texture.dispose();const u=h.morphAttributes.position!==void 0,S=h.morphAttributes.normal!==void 0,v=h.morphAttributes.color!==void 0,b=h.morphAttributes.position||[],R=h.morphAttributes.normal||[],C=h.morphAttributes.color||[];let T=0;u===!0&&(T=1),S===!0&&(T=2),v===!0&&(T=3);let L=h.attributes.position.count*T,W=1;L>t.maxTextureSize&&(W=Math.ceil(L/t.maxTextureSize),L=t.maxTextureSize);const _=new Float32Array(L*W*4*y),E=new Fa(_,L,W,y);E.type=un,E.needsUpdate=!0;const j=T*4;for(let I=0;I<y;I++){const Y=b[I],V=R[I],tt=C[I],q=L*W*4*I;for(let Z=0;Z<Y.count;Z++){const et=Z*j;u===!0&&(a.fromBufferAttribute(Y,Z),_[q+et+0]=a.x,_[q+et+1]=a.y,_[q+et+2]=a.z,_[q+et+3]=0),S===!0&&(a.fromBufferAttribute(V,Z),_[q+et+4]=a.x,_[q+et+5]=a.y,_[q+et+6]=a.z,_[q+et+7]=0),v===!0&&(a.fromBufferAttribute(tt,Z),_[q+et+8]=a.x,_[q+et+9]=a.y,_[q+et+10]=a.z,_[q+et+11]=tt.itemSize===4?a.w:1)}}f={count:y,texture:E,size:new qt(L,W)},r.set(h,f),h.addEventListener("dispose",K)}if(l.isInstancedMesh===!0&&l.morphTexture!==null)d.getUniforms().setValue(i,"morphTexture",l.morphTexture,e);else{let u=0;for(let v=0;v<p.length;v++)u+=p[v];const S=h.morphTargetsRelative?1:1-u;d.getUniforms().setValue(i,"morphTargetBaseInfluence",S),d.getUniforms().setValue(i,"morphTargetInfluences",p)}d.getUniforms().setValue(i,"morphTargetsTexture",f.texture,e),d.getUniforms().setValue(i,"morphTargetsTextureSize",f.size)}else{const g=p===void 0?0:p.length;let y=n[h.id];if(y===void 0||y.length!==g){y=[];for(let b=0;b<g;b++)y[b]=[b,0];n[h.id]=y}for(let b=0;b<g;b++){const R=y[b];R[0]=b,R[1]=p[b]}y.sort(ku);for(let b=0;b<8;b++)b<g&&y[b][1]?(o[b][0]=y[b][0],o[b][1]=y[b][1]):(o[b][0]=Number.MAX_SAFE_INTEGER,o[b][1]=0);o.sort(zu);const f=h.morphAttributes.position,u=h.morphAttributes.normal;let S=0;for(let b=0;b<8;b++){const R=o[b],C=R[0],T=R[1];C!==Number.MAX_SAFE_INTEGER&&T?(f&&h.getAttribute("morphTarget"+b)!==f[C]&&h.setAttribute("morphTarget"+b,f[C]),u&&h.getAttribute("morphNormal"+b)!==u[C]&&h.setAttribute("morphNormal"+b,u[C]),s[b]=T,S+=T):(f&&h.hasAttribute("morphTarget"+b)===!0&&h.deleteAttribute("morphTarget"+b),u&&h.hasAttribute("morphNormal"+b)===!0&&h.deleteAttribute("morphNormal"+b),s[b]=0)}const v=h.morphTargetsRelative?1:1-S;d.getUniforms().setValue(i,"morphTargetBaseInfluence",v),d.getUniforms().setValue(i,"morphTargetInfluences",s)}}return{update:c}}function Gu(i,t,e,n){let s=new WeakMap;function r(c){const l=n.render.frame,h=c.geometry,d=t.get(c,h);if(s.get(d)!==l&&(t.update(d),s.set(d,l)),c.isInstancedMesh&&(c.hasEventListener("dispose",o)===!1&&c.addEventListener("dispose",o),s.get(c)!==l&&(e.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&e.update(c.instanceColor,i.ARRAY_BUFFER),s.set(c,l))),c.isSkinnedMesh){const p=c.skeleton;s.get(p)!==l&&(p.update(),s.set(p,l))}return d}function a(){s=new WeakMap}function o(c){const l=c.target;l.removeEventListener("dispose",o),e.remove(l.instanceMatrix),l.instanceColor!==null&&e.remove(l.instanceColor)}return{update:r,dispose:a}}class qa extends De{constructor(t,e,n,s,r,a,o,c,l,h){if(h=h!==void 0?h:qn,h!==qn&&h!==vi)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&h===qn&&(n=wn),n===void 0&&h===vi&&(n=Xn),super(null,s,r,a,o,c,h,n,l),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=o!==void 0?o:Le,this.minFilter=c!==void 0?c:Le,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}const $a=new De,Ya=new qa(1,1);Ya.compareFunction=Ia;const ja=new Fa,Ka=new wl,Za=new Va,Yo=[],jo=[],Ko=new Float32Array(16),Zo=new Float32Array(9),Jo=new Float32Array(4);function Si(i,t,e){const n=i[0];if(n<=0||n>0)return i;const s=t*e;let r=Yo[s];if(r===void 0&&(r=new Float32Array(s),Yo[s]=r),t!==0){n.toArray(r,0);for(let a=1,o=0;a!==t;++a)o+=e,i[a].toArray(r,o)}return r}function _e(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function ve(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function Es(i,t){let e=jo[t];e===void 0&&(e=new Int32Array(t),jo[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function Hu(i,t){const e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function Vu(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(_e(e,t))return;i.uniform2fv(this.addr,t),ve(e,t)}}function Wu(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(_e(e,t))return;i.uniform3fv(this.addr,t),ve(e,t)}}function Xu(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(_e(e,t))return;i.uniform4fv(this.addr,t),ve(e,t)}}function qu(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(_e(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),ve(e,t)}else{if(_e(e,n))return;Jo.set(n),i.uniformMatrix2fv(this.addr,!1,Jo),ve(e,n)}}function $u(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(_e(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),ve(e,t)}else{if(_e(e,n))return;Zo.set(n),i.uniformMatrix3fv(this.addr,!1,Zo),ve(e,n)}}function Yu(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(_e(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),ve(e,t)}else{if(_e(e,n))return;Ko.set(n),i.uniformMatrix4fv(this.addr,!1,Ko),ve(e,n)}}function ju(i,t){const e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function Ku(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(_e(e,t))return;i.uniform2iv(this.addr,t),ve(e,t)}}function Zu(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(_e(e,t))return;i.uniform3iv(this.addr,t),ve(e,t)}}function Ju(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(_e(e,t))return;i.uniform4iv(this.addr,t),ve(e,t)}}function Qu(i,t){const e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function tf(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(_e(e,t))return;i.uniform2uiv(this.addr,t),ve(e,t)}}function ef(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(_e(e,t))return;i.uniform3uiv(this.addr,t),ve(e,t)}}function nf(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(_e(e,t))return;i.uniform4uiv(this.addr,t),ve(e,t)}}function sf(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);const r=this.type===i.SAMPLER_2D_SHADOW?Ya:$a;e.setTexture2D(t||r,s)}function rf(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||Ka,s)}function of(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||Za,s)}function af(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||ja,s)}function cf(i){switch(i){case 5126:return Hu;case 35664:return Vu;case 35665:return Wu;case 35666:return Xu;case 35674:return qu;case 35675:return $u;case 35676:return Yu;case 5124:case 35670:return ju;case 35667:case 35671:return Ku;case 35668:case 35672:return Zu;case 35669:case 35673:return Ju;case 5125:return Qu;case 36294:return tf;case 36295:return ef;case 36296:return nf;case 35678:case 36198:case 36298:case 36306:case 35682:return sf;case 35679:case 36299:case 36307:return rf;case 35680:case 36300:case 36308:case 36293:return of;case 36289:case 36303:case 36311:case 36292:return af}}function lf(i,t){i.uniform1fv(this.addr,t)}function hf(i,t){const e=Si(t,this.size,2);i.uniform2fv(this.addr,e)}function df(i,t){const e=Si(t,this.size,3);i.uniform3fv(this.addr,e)}function uf(i,t){const e=Si(t,this.size,4);i.uniform4fv(this.addr,e)}function ff(i,t){const e=Si(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function pf(i,t){const e=Si(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function mf(i,t){const e=Si(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function gf(i,t){i.uniform1iv(this.addr,t)}function xf(i,t){i.uniform2iv(this.addr,t)}function _f(i,t){i.uniform3iv(this.addr,t)}function vf(i,t){i.uniform4iv(this.addr,t)}function yf(i,t){i.uniform1uiv(this.addr,t)}function Mf(i,t){i.uniform2uiv(this.addr,t)}function bf(i,t){i.uniform3uiv(this.addr,t)}function wf(i,t){i.uniform4uiv(this.addr,t)}function Sf(i,t,e){const n=this.cache,s=t.length,r=Es(e,s);_e(n,r)||(i.uniform1iv(this.addr,r),ve(n,r));for(let a=0;a!==s;++a)e.setTexture2D(t[a]||$a,r[a])}function Ef(i,t,e){const n=this.cache,s=t.length,r=Es(e,s);_e(n,r)||(i.uniform1iv(this.addr,r),ve(n,r));for(let a=0;a!==s;++a)e.setTexture3D(t[a]||Ka,r[a])}function Tf(i,t,e){const n=this.cache,s=t.length,r=Es(e,s);_e(n,r)||(i.uniform1iv(this.addr,r),ve(n,r));for(let a=0;a!==s;++a)e.setTextureCube(t[a]||Za,r[a])}function Af(i,t,e){const n=this.cache,s=t.length,r=Es(e,s);_e(n,r)||(i.uniform1iv(this.addr,r),ve(n,r));for(let a=0;a!==s;++a)e.setTexture2DArray(t[a]||ja,r[a])}function Cf(i){switch(i){case 5126:return lf;case 35664:return hf;case 35665:return df;case 35666:return uf;case 35674:return ff;case 35675:return pf;case 35676:return mf;case 5124:case 35670:return gf;case 35667:case 35671:return xf;case 35668:case 35672:return _f;case 35669:case 35673:return vf;case 5125:return yf;case 36294:return Mf;case 36295:return bf;case 36296:return wf;case 35678:case 36198:case 36298:case 36306:case 35682:return Sf;case 35679:case 36299:case 36307:return Ef;case 35680:case 36300:case 36308:case 36293:return Tf;case 36289:case 36303:case 36311:case 36292:return Af}}class Rf{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=cf(e.type)}}class Pf{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=Cf(e.type)}}class Lf{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const s=this.seq;for(let r=0,a=s.length;r!==a;++r){const o=s[r];o.setValue(t,e[o.id],n)}}}const cr=/(\w+)(\])?(\[|\.)?/g;function Qo(i,t){i.seq.push(t),i.map[t.id]=t}function If(i,t,e){const n=i.name,s=n.length;for(cr.lastIndex=0;;){const r=cr.exec(n),a=cr.lastIndex;let o=r[1];const c=r[2]==="]",l=r[3];if(c&&(o=o|0),l===void 0||l==="["&&a+2===s){Qo(e,l===void 0?new Rf(o,i,t):new Pf(o,i,t));break}else{let d=e.map[o];d===void 0&&(d=new Lf(o),Qo(e,d)),e=d}}}class fs{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){const r=t.getActiveUniform(e,s),a=t.getUniformLocation(e,r.name);If(r,a,this)}}setValue(t,e,n,s){const r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){const s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,a=e.length;r!==a;++r){const o=e[r],c=n[o.id];c.needsUpdate!==!1&&o.setValue(t,c.value,s)}}static seqWithValue(t,e){const n=[];for(let s=0,r=t.length;s!==r;++s){const a=t[s];a.id in e&&n.push(a)}return n}}function ta(i,t,e){const n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}const Df=37297;let Uf=0;function Nf(i,t){const e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let a=s;a<r;a++){const o=a+1;n.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return n.join(`
`)}function Ff(i){const t=Qt.getPrimaries(Qt.workingColorSpace),e=Qt.getPrimaries(i);let n;switch(t===e?n="":t===xs&&e===gs?n="LinearDisplayP3ToLinearSRGB":t===gs&&e===xs&&(n="LinearSRGBToLinearDisplayP3"),i){case Rn:case Ss:return[n,"LinearTransferOETF"];case Ye:case Tr:return[n,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",i),[n,"LinearTransferOETF"]}}function ea(i,t,e){const n=i.getShaderParameter(t,i.COMPILE_STATUS),s=i.getShaderInfoLog(t).trim();if(n&&s==="")return"";const r=/ERROR: 0:(\d+)/.exec(s);if(r){const a=parseInt(r[1]);return e.toUpperCase()+`

`+s+`

`+Nf(i.getShaderSource(t),a)}else return s}function Of(i,t){const e=Ff(t);return`vec4 ${i}( vec4 value ) { return ${e[0]}( ${e[1]}( value ) ); }`}function zf(i,t){let e;switch(t){case Dc:e="Linear";break;case Uc:e="Reinhard";break;case Nc:e="OptimizedCineon";break;case ba:e="ACESFilmic";break;case Oc:e="AgX";break;case zc:e="Neutral";break;case Fc:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}function kf(i){return[i.extensionDerivatives||i.envMapCubeUVHeight||i.bumpMap||i.normalMapTangentSpace||i.clearcoatNormalMap||i.flatShading||i.alphaToCoverage||i.shaderID==="physical"?"#extension GL_OES_standard_derivatives : enable":"",(i.extensionFragDepth||i.logarithmicDepthBuffer)&&i.rendererExtensionFragDepth?"#extension GL_EXT_frag_depth : enable":"",i.extensionDrawBuffers&&i.rendererExtensionDrawBuffers?"#extension GL_EXT_draw_buffers : require":"",(i.extensionShaderTextureLOD||i.envMap||i.transmission)&&i.rendererExtensionShaderTextureLod?"#extension GL_EXT_shader_texture_lod : enable":""].filter(pi).join(`
`)}function Bf(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(pi).join(`
`)}function Gf(i){const t=[];for(const e in i){const n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function Hf(i,t){const e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){const r=i.getActiveAttrib(t,s),a=r.name;let o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),e[a]={type:r.type,location:i.getAttribLocation(t,a),locationSize:o}}return e}function pi(i){return i!==""}function na(i,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function ia(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const Vf=/^[ \t]*#include +<([\w\d./]+)>/gm;function Mr(i){return i.replace(Vf,Xf)}const Wf=new Map([["encodings_fragment","colorspace_fragment"],["encodings_pars_fragment","colorspace_pars_fragment"],["output_fragment","opaque_fragment"]]);function Xf(i,t){let e=Ht[t];if(e===void 0){const n=Wf.get(t);if(n!==void 0)e=Ht[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return Mr(e)}const qf=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function sa(i){return i.replace(qf,$f)}function $f(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function ra(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	`;return i.isWebGL2&&(t+=`precision ${i.precision} sampler3D;
		precision ${i.precision} sampler2DArray;
		precision ${i.precision} sampler2DShadow;
		precision ${i.precision} samplerCubeShadow;
		precision ${i.precision} sampler2DArrayShadow;
		precision ${i.precision} isampler2D;
		precision ${i.precision} isampler3D;
		precision ${i.precision} isamplerCube;
		precision ${i.precision} isampler2DArray;
		precision ${i.precision} usampler2D;
		precision ${i.precision} usampler3D;
		precision ${i.precision} usamplerCube;
		precision ${i.precision} usampler2DArray;
		`),i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function Yf(i){let t="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===ya?t="SHADOWMAP_TYPE_PCF":i.shadowMapType===Ma?t="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===dn&&(t="SHADOWMAP_TYPE_VSM"),t}function jf(i){let t="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case xi:case _i:t="ENVMAP_TYPE_CUBE";break;case ws:t="ENVMAP_TYPE_CUBE_UV";break}return t}function Kf(i){let t="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case _i:t="ENVMAP_MODE_REFRACTION";break}return t}function Zf(i){let t="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case Sr:t="ENVMAP_BLENDING_MULTIPLY";break;case Lc:t="ENVMAP_BLENDING_MIX";break;case Ic:t="ENVMAP_BLENDING_ADD";break}return t}function Jf(i){const t=i.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),7*16)),texelHeight:n,maxMip:e}}function Qf(i,t,e,n){const s=i.getContext(),r=e.defines;let a=e.vertexShader,o=e.fragmentShader;const c=Yf(e),l=jf(e),h=Kf(e),d=Zf(e),p=Jf(e),m=e.isWebGL2?"":kf(e),g=Bf(e),y=Gf(r),f=s.createProgram();let u,S,v=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(u=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,y].filter(pi).join(`
`),u.length>0&&(u+=`
`),S=[m,"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,y].filter(pi).join(`
`),S.length>0&&(S+=`
`)):(u=[ra(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,y,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors&&e.isWebGL2?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0&&e.isWebGL2?"#define MORPHTARGETS_TEXTURE":"",e.morphTargetsCount>0&&e.isWebGL2?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0&&e.isWebGL2?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.useLegacyLights?"#define LEGACY_LIGHTS":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.logarithmicDepthBuffer&&e.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )","	attribute vec3 morphTarget0;","	attribute vec3 morphTarget1;","	attribute vec3 morphTarget2;","	attribute vec3 morphTarget3;","	#ifdef USE_MORPHNORMALS","		attribute vec3 morphNormal0;","		attribute vec3 morphNormal1;","		attribute vec3 morphNormal2;","		attribute vec3 morphNormal3;","	#else","		attribute vec3 morphTarget4;","		attribute vec3 morphTarget5;","		attribute vec3 morphTarget6;","		attribute vec3 morphTarget7;","	#endif","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(pi).join(`
`),S=[m,ra(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,y,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+l:"",e.envMap?"#define "+h:"",e.envMap?"#define "+d:"",p?"#define CUBEUV_TEXEL_WIDTH "+p.texelWidth:"",p?"#define CUBEUV_TEXEL_HEIGHT "+p.texelHeight:"",p?"#define CUBEUV_MAX_MIP "+p.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.useLegacyLights?"#define LEGACY_LIGHTS":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.logarithmicDepthBuffer&&e.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==En?"#define TONE_MAPPING":"",e.toneMapping!==En?Ht.tonemapping_pars_fragment:"",e.toneMapping!==En?zf("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Ht.colorspace_pars_fragment,Of("linearToOutputTexel",e.outputColorSpace),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(pi).join(`
`)),a=Mr(a),a=na(a,e),a=ia(a,e),o=Mr(o),o=na(o,e),o=ia(o,e),a=sa(a),o=sa(o),e.isWebGL2&&e.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,u=[g,"precision mediump sampler2DArray;","#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+u,S=["precision mediump sampler2DArray;","#define varying in",e.glslVersion===Mo?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Mo?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+S);const b=v+u+a,R=v+S+o,C=ta(s,s.VERTEX_SHADER,b),T=ta(s,s.FRAGMENT_SHADER,R);s.attachShader(f,C),s.attachShader(f,T),e.index0AttributeName!==void 0?s.bindAttribLocation(f,0,e.index0AttributeName):e.morphTargets===!0&&s.bindAttribLocation(f,0,"position"),s.linkProgram(f);function L(j){if(i.debug.checkShaderErrors){const K=s.getProgramInfoLog(f).trim(),I=s.getShaderInfoLog(C).trim(),Y=s.getShaderInfoLog(T).trim();let V=!0,tt=!0;if(s.getProgramParameter(f,s.LINK_STATUS)===!1)if(V=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,f,C,T);else{const q=ea(s,C,"vertex"),Z=ea(s,T,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(f,s.VALIDATE_STATUS)+`

Material Name: `+j.name+`
Material Type: `+j.type+`

Program Info Log: `+K+`
`+q+`
`+Z)}else K!==""?console.warn("THREE.WebGLProgram: Program Info Log:",K):(I===""||Y==="")&&(tt=!1);tt&&(j.diagnostics={runnable:V,programLog:K,vertexShader:{log:I,prefix:u},fragmentShader:{log:Y,prefix:S}})}s.deleteShader(C),s.deleteShader(T),W=new fs(s,f),_=Hf(s,f)}let W;this.getUniforms=function(){return W===void 0&&L(this),W};let _;this.getAttributes=function(){return _===void 0&&L(this),_};let E=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return E===!1&&(E=s.getProgramParameter(f,Df)),E},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(f),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=Uf++,this.cacheKey=t,this.usedTimes=1,this.program=f,this.vertexShader=C,this.fragmentShader=T,this}let tp=0;class ep{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,n=t.fragmentShader,s=this._getShaderStage(e),r=this._getShaderStage(n),a=this._getShaderCacheForMaterial(t);return a.has(s)===!1&&(a.add(s),s.usedTimes++),a.has(r)===!1&&(a.add(r),r.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new np(t),e.set(t,n)),n}}class np{constructor(t){this.id=tp++,this.code=t,this.usedTimes=0}}function ip(i,t,e,n,s,r,a){const o=new Oa,c=new ep,l=new Set,h=[],d=s.isWebGL2,p=s.logarithmicDepthBuffer,m=s.vertexTextures;let g=s.precision;const y={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function f(_){return l.add(_),_===0?"uv":`uv${_}`}function u(_,E,j,K,I){const Y=K.fog,V=I.geometry,tt=_.isMeshStandardMaterial?K.environment:null,q=(_.isMeshStandardMaterial?e:t).get(_.envMap||tt),Z=q&&q.mapping===ws?q.image.height:null,et=y[_.type];_.precision!==null&&(g=s.getMaxPrecision(_.precision),g!==_.precision&&console.warn("THREE.WebGLProgram.getParameters:",_.precision,"not supported, using",g,"instead."));const ot=V.morphAttributes.position||V.morphAttributes.normal||V.morphAttributes.color,xt=ot!==void 0?ot.length:0;let Pt=0;V.morphAttributes.position!==void 0&&(Pt=1),V.morphAttributes.normal!==void 0&&(Pt=2),V.morphAttributes.color!==void 0&&(Pt=3);let G,nt,mt,Tt;if(et){const ne=Qe[et];G=ne.vertexShader,nt=ne.fragmentShader}else G=_.vertexShader,nt=_.fragmentShader,c.update(_),mt=c.getVertexShaderID(_),Tt=c.getFragmentShaderID(_);const yt=i.getRenderTarget(),vt=I.isInstancedMesh===!0,zt=I.isBatchedMesh===!0,Lt=!!_.map,N=!!_.matcap,Kt=!!q,ut=!!_.aoMap,At=!!_.lightMap,U=!!_.bumpMap,st=!!_.normalMap,$=!!_.displacementMap,J=!!_.emissiveMap,bt=!!_.metalnessMap,w=!!_.roughnessMap,x=_.anisotropy>0,X=_.clearcoat>0,Q=_.iridescence>0,rt=_.sheen>0,it=_.transmission>0,kt=x&&!!_.anisotropyMap,Dt=X&&!!_.clearcoatMap,ht=X&&!!_.clearcoatNormalMap,pt=X&&!!_.clearcoatRoughnessMap,Bt=Q&&!!_.iridescenceMap,at=Q&&!!_.iridescenceThicknessMap,me=rt&&!!_.sheenColorMap,Xt=rt&&!!_.sheenRoughnessMap,Rt=!!_.specularMap,wt=!!_.specularColorMap,St=!!_.specularIntensityMap,jt=it&&!!_.transmissionMap,Ft=it&&!!_.thicknessMap,oe=!!_.gradientMap,D=!!_.alphaMap,ft=_.alphaTest>0,z=!!_.alphaHash,ct=!!_.extensions;let gt=En;_.toneMapped&&(yt===null||yt.isXRRenderTarget===!0)&&(gt=i.toneMapping);const $t={isWebGL2:d,shaderID:et,shaderType:_.type,shaderName:_.name,vertexShader:G,fragmentShader:nt,defines:_.defines,customVertexShaderID:mt,customFragmentShaderID:Tt,isRawShaderMaterial:_.isRawShaderMaterial===!0,glslVersion:_.glslVersion,precision:g,batching:zt,instancing:vt,instancingColor:vt&&I.instanceColor!==null,instancingMorph:vt&&I.morphTexture!==null,supportsVertexTextures:m,outputColorSpace:yt===null?i.outputColorSpace:yt.isXRRenderTarget===!0?yt.texture.colorSpace:Rn,alphaToCoverage:!!_.alphaToCoverage,map:Lt,matcap:N,envMap:Kt,envMapMode:Kt&&q.mapping,envMapCubeUVHeight:Z,aoMap:ut,lightMap:At,bumpMap:U,normalMap:st,displacementMap:m&&$,emissiveMap:J,normalMapObjectSpace:st&&_.normalMapType===jc,normalMapTangentSpace:st&&_.normalMapType===La,metalnessMap:bt,roughnessMap:w,anisotropy:x,anisotropyMap:kt,clearcoat:X,clearcoatMap:Dt,clearcoatNormalMap:ht,clearcoatRoughnessMap:pt,iridescence:Q,iridescenceMap:Bt,iridescenceThicknessMap:at,sheen:rt,sheenColorMap:me,sheenRoughnessMap:Xt,specularMap:Rt,specularColorMap:wt,specularIntensityMap:St,transmission:it,transmissionMap:jt,thicknessMap:Ft,gradientMap:oe,opaque:_.transparent===!1&&_.blending===mi&&_.alphaToCoverage===!1,alphaMap:D,alphaTest:ft,alphaHash:z,combine:_.combine,mapUv:Lt&&f(_.map.channel),aoMapUv:ut&&f(_.aoMap.channel),lightMapUv:At&&f(_.lightMap.channel),bumpMapUv:U&&f(_.bumpMap.channel),normalMapUv:st&&f(_.normalMap.channel),displacementMapUv:$&&f(_.displacementMap.channel),emissiveMapUv:J&&f(_.emissiveMap.channel),metalnessMapUv:bt&&f(_.metalnessMap.channel),roughnessMapUv:w&&f(_.roughnessMap.channel),anisotropyMapUv:kt&&f(_.anisotropyMap.channel),clearcoatMapUv:Dt&&f(_.clearcoatMap.channel),clearcoatNormalMapUv:ht&&f(_.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:pt&&f(_.clearcoatRoughnessMap.channel),iridescenceMapUv:Bt&&f(_.iridescenceMap.channel),iridescenceThicknessMapUv:at&&f(_.iridescenceThicknessMap.channel),sheenColorMapUv:me&&f(_.sheenColorMap.channel),sheenRoughnessMapUv:Xt&&f(_.sheenRoughnessMap.channel),specularMapUv:Rt&&f(_.specularMap.channel),specularColorMapUv:wt&&f(_.specularColorMap.channel),specularIntensityMapUv:St&&f(_.specularIntensityMap.channel),transmissionMapUv:jt&&f(_.transmissionMap.channel),thicknessMapUv:Ft&&f(_.thicknessMap.channel),alphaMapUv:D&&f(_.alphaMap.channel),vertexTangents:!!V.attributes.tangent&&(st||x),vertexColors:_.vertexColors,vertexAlphas:_.vertexColors===!0&&!!V.attributes.color&&V.attributes.color.itemSize===4,pointsUvs:I.isPoints===!0&&!!V.attributes.uv&&(Lt||D),fog:!!Y,useFog:_.fog===!0,fogExp2:!!Y&&Y.isFogExp2,flatShading:_.flatShading===!0,sizeAttenuation:_.sizeAttenuation===!0,logarithmicDepthBuffer:p,skinning:I.isSkinnedMesh===!0,morphTargets:V.morphAttributes.position!==void 0,morphNormals:V.morphAttributes.normal!==void 0,morphColors:V.morphAttributes.color!==void 0,morphTargetsCount:xt,morphTextureStride:Pt,numDirLights:E.directional.length,numPointLights:E.point.length,numSpotLights:E.spot.length,numSpotLightMaps:E.spotLightMap.length,numRectAreaLights:E.rectArea.length,numHemiLights:E.hemi.length,numDirLightShadows:E.directionalShadowMap.length,numPointLightShadows:E.pointShadowMap.length,numSpotLightShadows:E.spotShadowMap.length,numSpotLightShadowsWithMaps:E.numSpotLightShadowsWithMaps,numLightProbes:E.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:_.dithering,shadowMapEnabled:i.shadowMap.enabled&&j.length>0,shadowMapType:i.shadowMap.type,toneMapping:gt,useLegacyLights:i._useLegacyLights,decodeVideoTexture:Lt&&_.map.isVideoTexture===!0&&Qt.getTransfer(_.map.colorSpace)===re,premultipliedAlpha:_.premultipliedAlpha,doubleSided:_.side===ue,flipSided:_.side===be,useDepthPacking:_.depthPacking>=0,depthPacking:_.depthPacking||0,index0AttributeName:_.index0AttributeName,extensionDerivatives:ct&&_.extensions.derivatives===!0,extensionFragDepth:ct&&_.extensions.fragDepth===!0,extensionDrawBuffers:ct&&_.extensions.drawBuffers===!0,extensionShaderTextureLOD:ct&&_.extensions.shaderTextureLOD===!0,extensionClipCullDistance:ct&&_.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:ct&&_.extensions.multiDraw===!0&&n.has("WEBGL_multi_draw"),rendererExtensionFragDepth:d||n.has("EXT_frag_depth"),rendererExtensionDrawBuffers:d||n.has("WEBGL_draw_buffers"),rendererExtensionShaderTextureLod:d||n.has("EXT_shader_texture_lod"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:_.customProgramCacheKey()};return $t.vertexUv1s=l.has(1),$t.vertexUv2s=l.has(2),$t.vertexUv3s=l.has(3),l.clear(),$t}function S(_){const E=[];if(_.shaderID?E.push(_.shaderID):(E.push(_.customVertexShaderID),E.push(_.customFragmentShaderID)),_.defines!==void 0)for(const j in _.defines)E.push(j),E.push(_.defines[j]);return _.isRawShaderMaterial===!1&&(v(E,_),b(E,_),E.push(i.outputColorSpace)),E.push(_.customProgramCacheKey),E.join()}function v(_,E){_.push(E.precision),_.push(E.outputColorSpace),_.push(E.envMapMode),_.push(E.envMapCubeUVHeight),_.push(E.mapUv),_.push(E.alphaMapUv),_.push(E.lightMapUv),_.push(E.aoMapUv),_.push(E.bumpMapUv),_.push(E.normalMapUv),_.push(E.displacementMapUv),_.push(E.emissiveMapUv),_.push(E.metalnessMapUv),_.push(E.roughnessMapUv),_.push(E.anisotropyMapUv),_.push(E.clearcoatMapUv),_.push(E.clearcoatNormalMapUv),_.push(E.clearcoatRoughnessMapUv),_.push(E.iridescenceMapUv),_.push(E.iridescenceThicknessMapUv),_.push(E.sheenColorMapUv),_.push(E.sheenRoughnessMapUv),_.push(E.specularMapUv),_.push(E.specularColorMapUv),_.push(E.specularIntensityMapUv),_.push(E.transmissionMapUv),_.push(E.thicknessMapUv),_.push(E.combine),_.push(E.fogExp2),_.push(E.sizeAttenuation),_.push(E.morphTargetsCount),_.push(E.morphAttributeCount),_.push(E.numDirLights),_.push(E.numPointLights),_.push(E.numSpotLights),_.push(E.numSpotLightMaps),_.push(E.numHemiLights),_.push(E.numRectAreaLights),_.push(E.numDirLightShadows),_.push(E.numPointLightShadows),_.push(E.numSpotLightShadows),_.push(E.numSpotLightShadowsWithMaps),_.push(E.numLightProbes),_.push(E.shadowMapType),_.push(E.toneMapping),_.push(E.numClippingPlanes),_.push(E.numClipIntersection),_.push(E.depthPacking)}function b(_,E){o.disableAll(),E.isWebGL2&&o.enable(0),E.supportsVertexTextures&&o.enable(1),E.instancing&&o.enable(2),E.instancingColor&&o.enable(3),E.instancingMorph&&o.enable(4),E.matcap&&o.enable(5),E.envMap&&o.enable(6),E.normalMapObjectSpace&&o.enable(7),E.normalMapTangentSpace&&o.enable(8),E.clearcoat&&o.enable(9),E.iridescence&&o.enable(10),E.alphaTest&&o.enable(11),E.vertexColors&&o.enable(12),E.vertexAlphas&&o.enable(13),E.vertexUv1s&&o.enable(14),E.vertexUv2s&&o.enable(15),E.vertexUv3s&&o.enable(16),E.vertexTangents&&o.enable(17),E.anisotropy&&o.enable(18),E.alphaHash&&o.enable(19),E.batching&&o.enable(20),_.push(o.mask),o.disableAll(),E.fog&&o.enable(0),E.useFog&&o.enable(1),E.flatShading&&o.enable(2),E.logarithmicDepthBuffer&&o.enable(3),E.skinning&&o.enable(4),E.morphTargets&&o.enable(5),E.morphNormals&&o.enable(6),E.morphColors&&o.enable(7),E.premultipliedAlpha&&o.enable(8),E.shadowMapEnabled&&o.enable(9),E.useLegacyLights&&o.enable(10),E.doubleSided&&o.enable(11),E.flipSided&&o.enable(12),E.useDepthPacking&&o.enable(13),E.dithering&&o.enable(14),E.transmission&&o.enable(15),E.sheen&&o.enable(16),E.opaque&&o.enable(17),E.pointsUvs&&o.enable(18),E.decodeVideoTexture&&o.enable(19),E.alphaToCoverage&&o.enable(20),_.push(o.mask)}function R(_){const E=y[_.type];let j;if(E){const K=Qe[E];j=Fl.clone(K.uniforms)}else j=_.uniforms;return j}function C(_,E){let j;for(let K=0,I=h.length;K<I;K++){const Y=h[K];if(Y.cacheKey===E){j=Y,++j.usedTimes;break}}return j===void 0&&(j=new Qf(i,E,_,r),h.push(j)),j}function T(_){if(--_.usedTimes===0){const E=h.indexOf(_);h[E]=h[h.length-1],h.pop(),_.destroy()}}function L(_){c.remove(_)}function W(){c.dispose()}return{getParameters:u,getProgramCacheKey:S,getUniforms:R,acquireProgram:C,releaseProgram:T,releaseShaderCache:L,programs:h,dispose:W}}function sp(){let i=new WeakMap;function t(r){let a=i.get(r);return a===void 0&&(a={},i.set(r,a)),a}function e(r){i.delete(r)}function n(r,a,o){i.get(r)[a]=o}function s(){i=new WeakMap}return{get:t,remove:e,update:n,dispose:s}}function rp(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.z!==t.z?i.z-t.z:i.id-t.id}function oa(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function aa(){const i=[];let t=0;const e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function a(d,p,m,g,y,f){let u=i[t];return u===void 0?(u={id:d.id,object:d,geometry:p,material:m,groupOrder:g,renderOrder:d.renderOrder,z:y,group:f},i[t]=u):(u.id=d.id,u.object=d,u.geometry=p,u.material=m,u.groupOrder=g,u.renderOrder=d.renderOrder,u.z=y,u.group=f),t++,u}function o(d,p,m,g,y,f){const u=a(d,p,m,g,y,f);m.transmission>0?n.push(u):m.transparent===!0?s.push(u):e.push(u)}function c(d,p,m,g,y,f){const u=a(d,p,m,g,y,f);m.transmission>0?n.unshift(u):m.transparent===!0?s.unshift(u):e.unshift(u)}function l(d,p){e.length>1&&e.sort(d||rp),n.length>1&&n.sort(p||oa),s.length>1&&s.sort(p||oa)}function h(){for(let d=t,p=i.length;d<p;d++){const m=i[d];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:o,unshift:c,finish:h,sort:l}}function op(){let i=new WeakMap;function t(n,s){const r=i.get(n);let a;return r===void 0?(a=new aa,i.set(n,[a])):s>=r.length?(a=new aa,r.push(a)):a=r[s],a}function e(){i=new WeakMap}return{get:t,dispose:e}}function ap(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new A,color:new Ct};break;case"SpotLight":e={position:new A,direction:new A,color:new Ct,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new A,color:new Ct,distance:0,decay:0};break;case"HemisphereLight":e={direction:new A,skyColor:new Ct,groundColor:new Ct};break;case"RectAreaLight":e={color:new Ct,position:new A,halfWidth:new A,halfHeight:new A};break}return i[t.id]=e,e}}}function cp(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new qt};break;case"SpotLight":e={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new qt};break;case"PointLight":e={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new qt,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}let lp=0;function hp(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function dp(i,t){const e=new ap,n=cp(),s={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let h=0;h<9;h++)s.probe.push(new A);const r=new A,a=new le,o=new le;function c(h,d){let p=0,m=0,g=0;for(let j=0;j<9;j++)s.probe[j].set(0,0,0);let y=0,f=0,u=0,S=0,v=0,b=0,R=0,C=0,T=0,L=0,W=0;h.sort(hp);const _=d===!0?Math.PI:1;for(let j=0,K=h.length;j<K;j++){const I=h[j],Y=I.color,V=I.intensity,tt=I.distance,q=I.shadow&&I.shadow.map?I.shadow.map.texture:null;if(I.isAmbientLight)p+=Y.r*V*_,m+=Y.g*V*_,g+=Y.b*V*_;else if(I.isLightProbe){for(let Z=0;Z<9;Z++)s.probe[Z].addScaledVector(I.sh.coefficients[Z],V);W++}else if(I.isDirectionalLight){const Z=e.get(I);if(Z.color.copy(I.color).multiplyScalar(I.intensity*_),I.castShadow){const et=I.shadow,ot=n.get(I);ot.shadowBias=et.bias,ot.shadowNormalBias=et.normalBias,ot.shadowRadius=et.radius,ot.shadowMapSize=et.mapSize,s.directionalShadow[y]=ot,s.directionalShadowMap[y]=q,s.directionalShadowMatrix[y]=I.shadow.matrix,b++}s.directional[y]=Z,y++}else if(I.isSpotLight){const Z=e.get(I);Z.position.setFromMatrixPosition(I.matrixWorld),Z.color.copy(Y).multiplyScalar(V*_),Z.distance=tt,Z.coneCos=Math.cos(I.angle),Z.penumbraCos=Math.cos(I.angle*(1-I.penumbra)),Z.decay=I.decay,s.spot[u]=Z;const et=I.shadow;if(I.map&&(s.spotLightMap[T]=I.map,T++,et.updateMatrices(I),I.castShadow&&L++),s.spotLightMatrix[u]=et.matrix,I.castShadow){const ot=n.get(I);ot.shadowBias=et.bias,ot.shadowNormalBias=et.normalBias,ot.shadowRadius=et.radius,ot.shadowMapSize=et.mapSize,s.spotShadow[u]=ot,s.spotShadowMap[u]=q,C++}u++}else if(I.isRectAreaLight){const Z=e.get(I);Z.color.copy(Y).multiplyScalar(V),Z.halfWidth.set(I.width*.5,0,0),Z.halfHeight.set(0,I.height*.5,0),s.rectArea[S]=Z,S++}else if(I.isPointLight){const Z=e.get(I);if(Z.color.copy(I.color).multiplyScalar(I.intensity*_),Z.distance=I.distance,Z.decay=I.decay,I.castShadow){const et=I.shadow,ot=n.get(I);ot.shadowBias=et.bias,ot.shadowNormalBias=et.normalBias,ot.shadowRadius=et.radius,ot.shadowMapSize=et.mapSize,ot.shadowCameraNear=et.camera.near,ot.shadowCameraFar=et.camera.far,s.pointShadow[f]=ot,s.pointShadowMap[f]=q,s.pointShadowMatrix[f]=I.shadow.matrix,R++}s.point[f]=Z,f++}else if(I.isHemisphereLight){const Z=e.get(I);Z.skyColor.copy(I.color).multiplyScalar(V*_),Z.groundColor.copy(I.groundColor).multiplyScalar(V*_),s.hemi[v]=Z,v++}}S>0&&(t.isWebGL2?i.has("OES_texture_float_linear")===!0?(s.rectAreaLTC1=lt.LTC_FLOAT_1,s.rectAreaLTC2=lt.LTC_FLOAT_2):(s.rectAreaLTC1=lt.LTC_HALF_1,s.rectAreaLTC2=lt.LTC_HALF_2):i.has("OES_texture_float_linear")===!0?(s.rectAreaLTC1=lt.LTC_FLOAT_1,s.rectAreaLTC2=lt.LTC_FLOAT_2):i.has("OES_texture_half_float_linear")===!0?(s.rectAreaLTC1=lt.LTC_HALF_1,s.rectAreaLTC2=lt.LTC_HALF_2):console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.")),s.ambient[0]=p,s.ambient[1]=m,s.ambient[2]=g;const E=s.hash;(E.directionalLength!==y||E.pointLength!==f||E.spotLength!==u||E.rectAreaLength!==S||E.hemiLength!==v||E.numDirectionalShadows!==b||E.numPointShadows!==R||E.numSpotShadows!==C||E.numSpotMaps!==T||E.numLightProbes!==W)&&(s.directional.length=y,s.spot.length=u,s.rectArea.length=S,s.point.length=f,s.hemi.length=v,s.directionalShadow.length=b,s.directionalShadowMap.length=b,s.pointShadow.length=R,s.pointShadowMap.length=R,s.spotShadow.length=C,s.spotShadowMap.length=C,s.directionalShadowMatrix.length=b,s.pointShadowMatrix.length=R,s.spotLightMatrix.length=C+T-L,s.spotLightMap.length=T,s.numSpotLightShadowsWithMaps=L,s.numLightProbes=W,E.directionalLength=y,E.pointLength=f,E.spotLength=u,E.rectAreaLength=S,E.hemiLength=v,E.numDirectionalShadows=b,E.numPointShadows=R,E.numSpotShadows=C,E.numSpotMaps=T,E.numLightProbes=W,s.version=lp++)}function l(h,d){let p=0,m=0,g=0,y=0,f=0;const u=d.matrixWorldInverse;for(let S=0,v=h.length;S<v;S++){const b=h[S];if(b.isDirectionalLight){const R=s.directional[p];R.direction.setFromMatrixPosition(b.matrixWorld),r.setFromMatrixPosition(b.target.matrixWorld),R.direction.sub(r),R.direction.transformDirection(u),p++}else if(b.isSpotLight){const R=s.spot[g];R.position.setFromMatrixPosition(b.matrixWorld),R.position.applyMatrix4(u),R.direction.setFromMatrixPosition(b.matrixWorld),r.setFromMatrixPosition(b.target.matrixWorld),R.direction.sub(r),R.direction.transformDirection(u),g++}else if(b.isRectAreaLight){const R=s.rectArea[y];R.position.setFromMatrixPosition(b.matrixWorld),R.position.applyMatrix4(u),o.identity(),a.copy(b.matrixWorld),a.premultiply(u),o.extractRotation(a),R.halfWidth.set(b.width*.5,0,0),R.halfHeight.set(0,b.height*.5,0),R.halfWidth.applyMatrix4(o),R.halfHeight.applyMatrix4(o),y++}else if(b.isPointLight){const R=s.point[m];R.position.setFromMatrixPosition(b.matrixWorld),R.position.applyMatrix4(u),m++}else if(b.isHemisphereLight){const R=s.hemi[f];R.direction.setFromMatrixPosition(b.matrixWorld),R.direction.transformDirection(u),f++}}}return{setup:c,setupView:l,state:s}}function ca(i,t){const e=new dp(i,t),n=[],s=[];function r(){n.length=0,s.length=0}function a(d){n.push(d)}function o(d){s.push(d)}function c(d){e.setup(n,d)}function l(d){e.setupView(n,d)}return{init:r,state:{lightsArray:n,shadowsArray:s,lights:e},setupLights:c,setupLightsView:l,pushLight:a,pushShadow:o}}function up(i,t){let e=new WeakMap;function n(r,a=0){const o=e.get(r);let c;return o===void 0?(c=new ca(i,t),e.set(r,[c])):a>=o.length?(c=new ca(i,t),o.push(c)):c=o[a],c}function s(){e=new WeakMap}return{get:n,dispose:s}}class fp extends Yn{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=$c,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class pp extends Yn{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}const mp=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,gp=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function xp(i,t,e){let n=new Rr;const s=new qt,r=new qt,a=new ce,o=new fp({depthPacking:Yc}),c=new pp,l={},h=e.maxTextureSize,d={[nn]:be,[be]:nn,[ue]:ue},p=new pn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new qt},radius:{value:4}},vertexShader:mp,fragmentShader:gp}),m=p.clone();m.defines.HORIZONTAL_PASS=1;const g=new ee;g.setAttribute("position",new Zt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const y=new P(g,p),f=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=ya;let u=this.type;this.render=function(C,T,L){if(f.enabled===!1||f.autoUpdate===!1&&f.needsUpdate===!1||C.length===0)return;const W=i.getRenderTarget(),_=i.getActiveCubeFace(),E=i.getActiveMipmapLevel(),j=i.state;j.setBlending(Sn),j.buffers.color.setClear(1,1,1,1),j.buffers.depth.setTest(!0),j.setScissorTest(!1);const K=u!==dn&&this.type===dn,I=u===dn&&this.type!==dn;for(let Y=0,V=C.length;Y<V;Y++){const tt=C[Y],q=tt.shadow;if(q===void 0){console.warn("THREE.WebGLShadowMap:",tt,"has no shadow.");continue}if(q.autoUpdate===!1&&q.needsUpdate===!1)continue;s.copy(q.mapSize);const Z=q.getFrameExtents();if(s.multiply(Z),r.copy(q.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/Z.x),s.x=r.x*Z.x,q.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/Z.y),s.y=r.y*Z.y,q.mapSize.y=r.y)),q.map===null||K===!0||I===!0){const ot=this.type!==dn?{minFilter:Le,magFilter:Le}:{};q.map!==null&&q.map.dispose(),q.map=new $n(s.x,s.y,ot),q.map.texture.name=tt.name+".shadowMap",q.camera.updateProjectionMatrix()}i.setRenderTarget(q.map),i.clear();const et=q.getViewportCount();for(let ot=0;ot<et;ot++){const xt=q.getViewport(ot);a.set(r.x*xt.x,r.y*xt.y,r.x*xt.z,r.y*xt.w),j.viewport(a),q.updateMatrices(tt,ot),n=q.getFrustum(),b(T,L,q.camera,tt,this.type)}q.isPointLightShadow!==!0&&this.type===dn&&S(q,L),q.needsUpdate=!1}u=this.type,f.needsUpdate=!1,i.setRenderTarget(W,_,E)};function S(C,T){const L=t.update(y);p.defines.VSM_SAMPLES!==C.blurSamples&&(p.defines.VSM_SAMPLES=C.blurSamples,m.defines.VSM_SAMPLES=C.blurSamples,p.needsUpdate=!0,m.needsUpdate=!0),C.mapPass===null&&(C.mapPass=new $n(s.x,s.y)),p.uniforms.shadow_pass.value=C.map.texture,p.uniforms.resolution.value=C.mapSize,p.uniforms.radius.value=C.radius,i.setRenderTarget(C.mapPass),i.clear(),i.renderBufferDirect(T,null,L,p,y,null),m.uniforms.shadow_pass.value=C.mapPass.texture,m.uniforms.resolution.value=C.mapSize,m.uniforms.radius.value=C.radius,i.setRenderTarget(C.map),i.clear(),i.renderBufferDirect(T,null,L,m,y,null)}function v(C,T,L,W){let _=null;const E=L.isPointLight===!0?C.customDistanceMaterial:C.customDepthMaterial;if(E!==void 0)_=E;else if(_=L.isPointLight===!0?c:o,i.localClippingEnabled&&T.clipShadows===!0&&Array.isArray(T.clippingPlanes)&&T.clippingPlanes.length!==0||T.displacementMap&&T.displacementScale!==0||T.alphaMap&&T.alphaTest>0||T.map&&T.alphaTest>0){const j=_.uuid,K=T.uuid;let I=l[j];I===void 0&&(I={},l[j]=I);let Y=I[K];Y===void 0&&(Y=_.clone(),I[K]=Y,T.addEventListener("dispose",R)),_=Y}if(_.visible=T.visible,_.wireframe=T.wireframe,W===dn?_.side=T.shadowSide!==null?T.shadowSide:T.side:_.side=T.shadowSide!==null?T.shadowSide:d[T.side],_.alphaMap=T.alphaMap,_.alphaTest=T.alphaTest,_.map=T.map,_.clipShadows=T.clipShadows,_.clippingPlanes=T.clippingPlanes,_.clipIntersection=T.clipIntersection,_.displacementMap=T.displacementMap,_.displacementScale=T.displacementScale,_.displacementBias=T.displacementBias,_.wireframeLinewidth=T.wireframeLinewidth,_.linewidth=T.linewidth,L.isPointLight===!0&&_.isMeshDistanceMaterial===!0){const j=i.properties.get(_);j.light=L}return _}function b(C,T,L,W,_){if(C.visible===!1)return;if(C.layers.test(T.layers)&&(C.isMesh||C.isLine||C.isPoints)&&(C.castShadow||C.receiveShadow&&_===dn)&&(!C.frustumCulled||n.intersectsObject(C))){C.modelViewMatrix.multiplyMatrices(L.matrixWorldInverse,C.matrixWorld);const K=t.update(C),I=C.material;if(Array.isArray(I)){const Y=K.groups;for(let V=0,tt=Y.length;V<tt;V++){const q=Y[V],Z=I[q.materialIndex];if(Z&&Z.visible){const et=v(C,Z,W,_);C.onBeforeShadow(i,C,T,L,K,et,q),i.renderBufferDirect(L,null,K,et,C,q),C.onAfterShadow(i,C,T,L,K,et,q)}}}else if(I.visible){const Y=v(C,I,W,_);C.onBeforeShadow(i,C,T,L,K,Y,null),i.renderBufferDirect(L,null,K,Y,C,null),C.onAfterShadow(i,C,T,L,K,Y,null)}}const j=C.children;for(let K=0,I=j.length;K<I;K++)b(j[K],T,L,W,_)}function R(C){C.target.removeEventListener("dispose",R);for(const L in l){const W=l[L],_=C.target.uuid;_ in W&&(W[_].dispose(),delete W[_])}}}function _p(i,t,e){const n=e.isWebGL2;function s(){let D=!1;const ft=new ce;let z=null;const ct=new ce(0,0,0,0);return{setMask:function(gt){z!==gt&&!D&&(i.colorMask(gt,gt,gt,gt),z=gt)},setLocked:function(gt){D=gt},setClear:function(gt,$t,ne,we,Be){Be===!0&&(gt*=we,$t*=we,ne*=we),ft.set(gt,$t,ne,we),ct.equals(ft)===!1&&(i.clearColor(gt,$t,ne,we),ct.copy(ft))},reset:function(){D=!1,z=null,ct.set(-1,0,0,0)}}}function r(){let D=!1,ft=null,z=null,ct=null;return{setTest:function(gt){gt?vt(i.DEPTH_TEST):zt(i.DEPTH_TEST)},setMask:function(gt){ft!==gt&&!D&&(i.depthMask(gt),ft=gt)},setFunc:function(gt){if(z!==gt){switch(gt){case Sc:i.depthFunc(i.NEVER);break;case Ec:i.depthFunc(i.ALWAYS);break;case Tc:i.depthFunc(i.LESS);break;case ps:i.depthFunc(i.LEQUAL);break;case Ac:i.depthFunc(i.EQUAL);break;case Cc:i.depthFunc(i.GEQUAL);break;case Rc:i.depthFunc(i.GREATER);break;case Pc:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}z=gt}},setLocked:function(gt){D=gt},setClear:function(gt){ct!==gt&&(i.clearDepth(gt),ct=gt)},reset:function(){D=!1,ft=null,z=null,ct=null}}}function a(){let D=!1,ft=null,z=null,ct=null,gt=null,$t=null,ne=null,we=null,Be=null;return{setTest:function(ie){D||(ie?vt(i.STENCIL_TEST):zt(i.STENCIL_TEST))},setMask:function(ie){ft!==ie&&!D&&(i.stencilMask(ie),ft=ie)},setFunc:function(ie,Ce,Je){(z!==ie||ct!==Ce||gt!==Je)&&(i.stencilFunc(ie,Ce,Je),z=ie,ct=Ce,gt=Je)},setOp:function(ie,Ce,Je){($t!==ie||ne!==Ce||we!==Je)&&(i.stencilOp(ie,Ce,Je),$t=ie,ne=Ce,we=Je)},setLocked:function(ie){D=ie},setClear:function(ie){Be!==ie&&(i.clearStencil(ie),Be=ie)},reset:function(){D=!1,ft=null,z=null,ct=null,gt=null,$t=null,ne=null,we=null,Be=null}}}const o=new s,c=new r,l=new a,h=new WeakMap,d=new WeakMap;let p={},m={},g=new WeakMap,y=[],f=null,u=!1,S=null,v=null,b=null,R=null,C=null,T=null,L=null,W=new Ct(0,0,0),_=0,E=!1,j=null,K=null,I=null,Y=null,V=null;const tt=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let q=!1,Z=0;const et=i.getParameter(i.VERSION);et.indexOf("WebGL")!==-1?(Z=parseFloat(/^WebGL (\d)/.exec(et)[1]),q=Z>=1):et.indexOf("OpenGL ES")!==-1&&(Z=parseFloat(/^OpenGL ES (\d)/.exec(et)[1]),q=Z>=2);let ot=null,xt={};const Pt=i.getParameter(i.SCISSOR_BOX),G=i.getParameter(i.VIEWPORT),nt=new ce().fromArray(Pt),mt=new ce().fromArray(G);function Tt(D,ft,z,ct){const gt=new Uint8Array(4),$t=i.createTexture();i.bindTexture(D,$t),i.texParameteri(D,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(D,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let ne=0;ne<z;ne++)n&&(D===i.TEXTURE_3D||D===i.TEXTURE_2D_ARRAY)?i.texImage3D(ft,0,i.RGBA,1,1,ct,0,i.RGBA,i.UNSIGNED_BYTE,gt):i.texImage2D(ft+ne,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,gt);return $t}const yt={};yt[i.TEXTURE_2D]=Tt(i.TEXTURE_2D,i.TEXTURE_2D,1),yt[i.TEXTURE_CUBE_MAP]=Tt(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),n&&(yt[i.TEXTURE_2D_ARRAY]=Tt(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),yt[i.TEXTURE_3D]=Tt(i.TEXTURE_3D,i.TEXTURE_3D,1,1)),o.setClear(0,0,0,1),c.setClear(1),l.setClear(0),vt(i.DEPTH_TEST),c.setFunc(ps),$(!1),J(Gr),vt(i.CULL_FACE),U(Sn);function vt(D){p[D]!==!0&&(i.enable(D),p[D]=!0)}function zt(D){p[D]!==!1&&(i.disable(D),p[D]=!1)}function Lt(D,ft){return m[D]!==ft?(i.bindFramebuffer(D,ft),m[D]=ft,n&&(D===i.DRAW_FRAMEBUFFER&&(m[i.FRAMEBUFFER]=ft),D===i.FRAMEBUFFER&&(m[i.DRAW_FRAMEBUFFER]=ft)),!0):!1}function N(D,ft){let z=y,ct=!1;if(D){z=g.get(ft),z===void 0&&(z=[],g.set(ft,z));const gt=D.textures;if(z.length!==gt.length||z[0]!==i.COLOR_ATTACHMENT0){for(let $t=0,ne=gt.length;$t<ne;$t++)z[$t]=i.COLOR_ATTACHMENT0+$t;z.length=gt.length,ct=!0}}else z[0]!==i.BACK&&(z[0]=i.BACK,ct=!0);if(ct)if(e.isWebGL2)i.drawBuffers(z);else if(t.has("WEBGL_draw_buffers")===!0)t.get("WEBGL_draw_buffers").drawBuffersWEBGL(z);else throw new Error("THREE.WebGLState: Usage of gl.drawBuffers() require WebGL2 or WEBGL_draw_buffers extension")}function Kt(D){return f!==D?(i.useProgram(D),f=D,!0):!1}const ut={[Hn]:i.FUNC_ADD,[lc]:i.FUNC_SUBTRACT,[hc]:i.FUNC_REVERSE_SUBTRACT};if(n)ut[Wr]=i.MIN,ut[Xr]=i.MAX;else{const D=t.get("EXT_blend_minmax");D!==null&&(ut[Wr]=D.MIN_EXT,ut[Xr]=D.MAX_EXT)}const At={[dc]:i.ZERO,[uc]:i.ONE,[fc]:i.SRC_COLOR,[fr]:i.SRC_ALPHA,[vc]:i.SRC_ALPHA_SATURATE,[xc]:i.DST_COLOR,[mc]:i.DST_ALPHA,[pc]:i.ONE_MINUS_SRC_COLOR,[pr]:i.ONE_MINUS_SRC_ALPHA,[_c]:i.ONE_MINUS_DST_COLOR,[gc]:i.ONE_MINUS_DST_ALPHA,[yc]:i.CONSTANT_COLOR,[Mc]:i.ONE_MINUS_CONSTANT_COLOR,[bc]:i.CONSTANT_ALPHA,[wc]:i.ONE_MINUS_CONSTANT_ALPHA};function U(D,ft,z,ct,gt,$t,ne,we,Be,ie){if(D===Sn){u===!0&&(zt(i.BLEND),u=!1);return}if(u===!1&&(vt(i.BLEND),u=!0),D!==cc){if(D!==S||ie!==E){if((v!==Hn||C!==Hn)&&(i.blendEquation(i.FUNC_ADD),v=Hn,C=Hn),ie)switch(D){case mi:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Se:i.blendFunc(i.ONE,i.ONE);break;case Hr:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Vr:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",D);break}else switch(D){case mi:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Se:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case Hr:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Vr:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",D);break}b=null,R=null,T=null,L=null,W.set(0,0,0),_=0,S=D,E=ie}return}gt=gt||ft,$t=$t||z,ne=ne||ct,(ft!==v||gt!==C)&&(i.blendEquationSeparate(ut[ft],ut[gt]),v=ft,C=gt),(z!==b||ct!==R||$t!==T||ne!==L)&&(i.blendFuncSeparate(At[z],At[ct],At[$t],At[ne]),b=z,R=ct,T=$t,L=ne),(we.equals(W)===!1||Be!==_)&&(i.blendColor(we.r,we.g,we.b,Be),W.copy(we),_=Be),S=D,E=!1}function st(D,ft){D.side===ue?zt(i.CULL_FACE):vt(i.CULL_FACE);let z=D.side===be;ft&&(z=!z),$(z),D.blending===mi&&D.transparent===!1?U(Sn):U(D.blending,D.blendEquation,D.blendSrc,D.blendDst,D.blendEquationAlpha,D.blendSrcAlpha,D.blendDstAlpha,D.blendColor,D.blendAlpha,D.premultipliedAlpha),c.setFunc(D.depthFunc),c.setTest(D.depthTest),c.setMask(D.depthWrite),o.setMask(D.colorWrite);const ct=D.stencilWrite;l.setTest(ct),ct&&(l.setMask(D.stencilWriteMask),l.setFunc(D.stencilFunc,D.stencilRef,D.stencilFuncMask),l.setOp(D.stencilFail,D.stencilZFail,D.stencilZPass)),w(D.polygonOffset,D.polygonOffsetFactor,D.polygonOffsetUnits),D.alphaToCoverage===!0?vt(i.SAMPLE_ALPHA_TO_COVERAGE):zt(i.SAMPLE_ALPHA_TO_COVERAGE)}function $(D){j!==D&&(D?i.frontFace(i.CW):i.frontFace(i.CCW),j=D)}function J(D){D!==oc?(vt(i.CULL_FACE),D!==K&&(D===Gr?i.cullFace(i.BACK):D===ac?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):zt(i.CULL_FACE),K=D}function bt(D){D!==I&&(q&&i.lineWidth(D),I=D)}function w(D,ft,z){D?(vt(i.POLYGON_OFFSET_FILL),(Y!==ft||V!==z)&&(i.polygonOffset(ft,z),Y=ft,V=z)):zt(i.POLYGON_OFFSET_FILL)}function x(D){D?vt(i.SCISSOR_TEST):zt(i.SCISSOR_TEST)}function X(D){D===void 0&&(D=i.TEXTURE0+tt-1),ot!==D&&(i.activeTexture(D),ot=D)}function Q(D,ft,z){z===void 0&&(ot===null?z=i.TEXTURE0+tt-1:z=ot);let ct=xt[z];ct===void 0&&(ct={type:void 0,texture:void 0},xt[z]=ct),(ct.type!==D||ct.texture!==ft)&&(ot!==z&&(i.activeTexture(z),ot=z),i.bindTexture(D,ft||yt[D]),ct.type=D,ct.texture=ft)}function rt(){const D=xt[ot];D!==void 0&&D.type!==void 0&&(i.bindTexture(D.type,null),D.type=void 0,D.texture=void 0)}function it(){try{i.compressedTexImage2D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function kt(){try{i.compressedTexImage3D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Dt(){try{i.texSubImage2D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function ht(){try{i.texSubImage3D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function pt(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Bt(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function at(){try{i.texStorage2D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function me(){try{i.texStorage3D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Xt(){try{i.texImage2D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Rt(){try{i.texImage3D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function wt(D){nt.equals(D)===!1&&(i.scissor(D.x,D.y,D.z,D.w),nt.copy(D))}function St(D){mt.equals(D)===!1&&(i.viewport(D.x,D.y,D.z,D.w),mt.copy(D))}function jt(D,ft){let z=d.get(ft);z===void 0&&(z=new WeakMap,d.set(ft,z));let ct=z.get(D);ct===void 0&&(ct=i.getUniformBlockIndex(ft,D.name),z.set(D,ct))}function Ft(D,ft){const ct=d.get(ft).get(D);h.get(ft)!==ct&&(i.uniformBlockBinding(ft,ct,D.__bindingPointIndex),h.set(ft,ct))}function oe(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),n===!0&&(i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null)),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),p={},ot=null,xt={},m={},g=new WeakMap,y=[],f=null,u=!1,S=null,v=null,b=null,R=null,C=null,T=null,L=null,W=new Ct(0,0,0),_=0,E=!1,j=null,K=null,I=null,Y=null,V=null,nt.set(0,0,i.canvas.width,i.canvas.height),mt.set(0,0,i.canvas.width,i.canvas.height),o.reset(),c.reset(),l.reset()}return{buffers:{color:o,depth:c,stencil:l},enable:vt,disable:zt,bindFramebuffer:Lt,drawBuffers:N,useProgram:Kt,setBlending:U,setMaterial:st,setFlipSided:$,setCullFace:J,setLineWidth:bt,setPolygonOffset:w,setScissorTest:x,activeTexture:X,bindTexture:Q,unbindTexture:rt,compressedTexImage2D:it,compressedTexImage3D:kt,texImage2D:Xt,texImage3D:Rt,updateUBOMapping:jt,uniformBlockBinding:Ft,texStorage2D:at,texStorage3D:me,texSubImage2D:Dt,texSubImage3D:ht,compressedTexSubImage2D:pt,compressedTexSubImage3D:Bt,scissor:wt,viewport:St,reset:oe}}function vp(i,t,e,n,s,r,a){const o=s.isWebGL2,c=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),h=new qt,d=new WeakMap;let p;const m=new WeakMap;let g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function y(w,x){return g?new OffscreenCanvas(w,x):ys("canvas")}function f(w,x,X,Q){let rt=1;const it=bt(w);if((it.width>Q||it.height>Q)&&(rt=Q/Math.max(it.width,it.height)),rt<1||x===!0)if(typeof HTMLImageElement<"u"&&w instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&w instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&w instanceof ImageBitmap||typeof VideoFrame<"u"&&w instanceof VideoFrame){const kt=x?vs:Math.floor,Dt=kt(rt*it.width),ht=kt(rt*it.height);p===void 0&&(p=y(Dt,ht));const pt=X?y(Dt,ht):p;return pt.width=Dt,pt.height=ht,pt.getContext("2d").drawImage(w,0,0,Dt,ht),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+it.width+"x"+it.height+") to ("+Dt+"x"+ht+")."),pt}else return"data"in w&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+it.width+"x"+it.height+")."),w;return w}function u(w){const x=bt(w);return yr(x.width)&&yr(x.height)}function S(w){return o?!1:w.wrapS!==je||w.wrapT!==je||w.minFilter!==Le&&w.minFilter!==Ne}function v(w,x){return w.generateMipmaps&&x&&w.minFilter!==Le&&w.minFilter!==Ne}function b(w){i.generateMipmap(w)}function R(w,x,X,Q,rt=!1){if(o===!1)return x;if(w!==null){if(i[w]!==void 0)return i[w];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+w+"'")}let it=x;if(x===i.RED&&(X===i.FLOAT&&(it=i.R32F),X===i.HALF_FLOAT&&(it=i.R16F),X===i.UNSIGNED_BYTE&&(it=i.R8)),x===i.RED_INTEGER&&(X===i.UNSIGNED_BYTE&&(it=i.R8UI),X===i.UNSIGNED_SHORT&&(it=i.R16UI),X===i.UNSIGNED_INT&&(it=i.R32UI),X===i.BYTE&&(it=i.R8I),X===i.SHORT&&(it=i.R16I),X===i.INT&&(it=i.R32I)),x===i.RG&&(X===i.FLOAT&&(it=i.RG32F),X===i.HALF_FLOAT&&(it=i.RG16F),X===i.UNSIGNED_BYTE&&(it=i.RG8)),x===i.RG_INTEGER&&(X===i.UNSIGNED_BYTE&&(it=i.RG8UI),X===i.UNSIGNED_SHORT&&(it=i.RG16UI),X===i.UNSIGNED_INT&&(it=i.RG32UI),X===i.BYTE&&(it=i.RG8I),X===i.SHORT&&(it=i.RG16I),X===i.INT&&(it=i.RG32I)),x===i.RGBA){const kt=rt?ms:Qt.getTransfer(Q);X===i.FLOAT&&(it=i.RGBA32F),X===i.HALF_FLOAT&&(it=i.RGBA16F),X===i.UNSIGNED_BYTE&&(it=kt===re?i.SRGB8_ALPHA8:i.RGBA8),X===i.UNSIGNED_SHORT_4_4_4_4&&(it=i.RGBA4),X===i.UNSIGNED_SHORT_5_5_5_1&&(it=i.RGB5_A1)}return(it===i.R16F||it===i.R32F||it===i.RG16F||it===i.RG32F||it===i.RGBA16F||it===i.RGBA32F)&&t.get("EXT_color_buffer_float"),it}function C(w,x,X){return v(w,X)===!0||w.isFramebufferTexture&&w.minFilter!==Le&&w.minFilter!==Ne?Math.log2(Math.max(x.width,x.height))+1:w.mipmaps!==void 0&&w.mipmaps.length>0?w.mipmaps.length:w.isCompressedTexture&&Array.isArray(w.image)?x.mipmaps.length:1}function T(w){return w===Le||w===qr||w===Ti?i.NEAREST:i.LINEAR}function L(w){const x=w.target;x.removeEventListener("dispose",L),_(x),x.isVideoTexture&&d.delete(x)}function W(w){const x=w.target;x.removeEventListener("dispose",W),j(x)}function _(w){const x=n.get(w);if(x.__webglInit===void 0)return;const X=w.source,Q=m.get(X);if(Q){const rt=Q[x.__cacheKey];rt.usedTimes--,rt.usedTimes===0&&E(w),Object.keys(Q).length===0&&m.delete(X)}n.remove(w)}function E(w){const x=n.get(w);i.deleteTexture(x.__webglTexture);const X=w.source,Q=m.get(X);delete Q[x.__cacheKey],a.memory.textures--}function j(w){const x=n.get(w);if(w.depthTexture&&w.depthTexture.dispose(),w.isWebGLCubeRenderTarget)for(let Q=0;Q<6;Q++){if(Array.isArray(x.__webglFramebuffer[Q]))for(let rt=0;rt<x.__webglFramebuffer[Q].length;rt++)i.deleteFramebuffer(x.__webglFramebuffer[Q][rt]);else i.deleteFramebuffer(x.__webglFramebuffer[Q]);x.__webglDepthbuffer&&i.deleteRenderbuffer(x.__webglDepthbuffer[Q])}else{if(Array.isArray(x.__webglFramebuffer))for(let Q=0;Q<x.__webglFramebuffer.length;Q++)i.deleteFramebuffer(x.__webglFramebuffer[Q]);else i.deleteFramebuffer(x.__webglFramebuffer);if(x.__webglDepthbuffer&&i.deleteRenderbuffer(x.__webglDepthbuffer),x.__webglMultisampledFramebuffer&&i.deleteFramebuffer(x.__webglMultisampledFramebuffer),x.__webglColorRenderbuffer)for(let Q=0;Q<x.__webglColorRenderbuffer.length;Q++)x.__webglColorRenderbuffer[Q]&&i.deleteRenderbuffer(x.__webglColorRenderbuffer[Q]);x.__webglDepthRenderbuffer&&i.deleteRenderbuffer(x.__webglDepthRenderbuffer)}const X=w.textures;for(let Q=0,rt=X.length;Q<rt;Q++){const it=n.get(X[Q]);it.__webglTexture&&(i.deleteTexture(it.__webglTexture),a.memory.textures--),n.remove(X[Q])}n.remove(w)}let K=0;function I(){K=0}function Y(){const w=K;return w>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+w+" texture units while this GPU supports only "+s.maxTextures),K+=1,w}function V(w){const x=[];return x.push(w.wrapS),x.push(w.wrapT),x.push(w.wrapR||0),x.push(w.magFilter),x.push(w.minFilter),x.push(w.anisotropy),x.push(w.internalFormat),x.push(w.format),x.push(w.type),x.push(w.generateMipmaps),x.push(w.premultiplyAlpha),x.push(w.flipY),x.push(w.unpackAlignment),x.push(w.colorSpace),x.join()}function tt(w,x){const X=n.get(w);if(w.isVideoTexture&&$(w),w.isRenderTargetTexture===!1&&w.version>0&&X.__version!==w.version){const Q=w.image;if(Q===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(Q.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{mt(X,w,x);return}}e.bindTexture(i.TEXTURE_2D,X.__webglTexture,i.TEXTURE0+x)}function q(w,x){const X=n.get(w);if(w.version>0&&X.__version!==w.version){mt(X,w,x);return}e.bindTexture(i.TEXTURE_2D_ARRAY,X.__webglTexture,i.TEXTURE0+x)}function Z(w,x){const X=n.get(w);if(w.version>0&&X.__version!==w.version){mt(X,w,x);return}e.bindTexture(i.TEXTURE_3D,X.__webglTexture,i.TEXTURE0+x)}function et(w,x){const X=n.get(w);if(w.version>0&&X.__version!==w.version){Tt(X,w,x);return}e.bindTexture(i.TEXTURE_CUBE_MAP,X.__webglTexture,i.TEXTURE0+x)}const ot={[xr]:i.REPEAT,[je]:i.CLAMP_TO_EDGE,[_r]:i.MIRRORED_REPEAT},xt={[Le]:i.NEAREST,[qr]:i.NEAREST_MIPMAP_NEAREST,[Ti]:i.NEAREST_MIPMAP_LINEAR,[Ne]:i.LINEAR,[Ds]:i.LINEAR_MIPMAP_NEAREST,[Wn]:i.LINEAR_MIPMAP_LINEAR},Pt={[Kc]:i.NEVER,[nl]:i.ALWAYS,[Zc]:i.LESS,[Ia]:i.LEQUAL,[Jc]:i.EQUAL,[el]:i.GEQUAL,[Qc]:i.GREATER,[tl]:i.NOTEQUAL};function G(w,x,X){if(x.type===un&&t.has("OES_texture_float_linear")===!1&&(x.magFilter===Ne||x.magFilter===Ds||x.magFilter===Ti||x.magFilter===Wn||x.minFilter===Ne||x.minFilter===Ds||x.minFilter===Ti||x.minFilter===Wn)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),X?(i.texParameteri(w,i.TEXTURE_WRAP_S,ot[x.wrapS]),i.texParameteri(w,i.TEXTURE_WRAP_T,ot[x.wrapT]),(w===i.TEXTURE_3D||w===i.TEXTURE_2D_ARRAY)&&i.texParameteri(w,i.TEXTURE_WRAP_R,ot[x.wrapR]),i.texParameteri(w,i.TEXTURE_MAG_FILTER,xt[x.magFilter]),i.texParameteri(w,i.TEXTURE_MIN_FILTER,xt[x.minFilter])):(i.texParameteri(w,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(w,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE),(w===i.TEXTURE_3D||w===i.TEXTURE_2D_ARRAY)&&i.texParameteri(w,i.TEXTURE_WRAP_R,i.CLAMP_TO_EDGE),(x.wrapS!==je||x.wrapT!==je)&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping."),i.texParameteri(w,i.TEXTURE_MAG_FILTER,T(x.magFilter)),i.texParameteri(w,i.TEXTURE_MIN_FILTER,T(x.minFilter)),x.minFilter!==Le&&x.minFilter!==Ne&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.")),x.compareFunction&&(i.texParameteri(w,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(w,i.TEXTURE_COMPARE_FUNC,Pt[x.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(x.magFilter===Le||x.minFilter!==Ti&&x.minFilter!==Wn||x.type===un&&t.has("OES_texture_float_linear")===!1||o===!1&&x.type===Ui&&t.has("OES_texture_half_float_linear")===!1)return;if(x.anisotropy>1||n.get(x).__currentAnisotropy){const Q=t.get("EXT_texture_filter_anisotropic");i.texParameterf(w,Q.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(x.anisotropy,s.getMaxAnisotropy())),n.get(x).__currentAnisotropy=x.anisotropy}}}function nt(w,x){let X=!1;w.__webglInit===void 0&&(w.__webglInit=!0,x.addEventListener("dispose",L));const Q=x.source;let rt=m.get(Q);rt===void 0&&(rt={},m.set(Q,rt));const it=V(x);if(it!==w.__cacheKey){rt[it]===void 0&&(rt[it]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,X=!0),rt[it].usedTimes++;const kt=rt[w.__cacheKey];kt!==void 0&&(rt[w.__cacheKey].usedTimes--,kt.usedTimes===0&&E(x)),w.__cacheKey=it,w.__webglTexture=rt[it].texture}return X}function mt(w,x,X){let Q=i.TEXTURE_2D;(x.isDataArrayTexture||x.isCompressedArrayTexture)&&(Q=i.TEXTURE_2D_ARRAY),x.isData3DTexture&&(Q=i.TEXTURE_3D);const rt=nt(w,x),it=x.source;e.bindTexture(Q,w.__webglTexture,i.TEXTURE0+X);const kt=n.get(it);if(it.version!==kt.__version||rt===!0){e.activeTexture(i.TEXTURE0+X);const Dt=Qt.getPrimaries(Qt.workingColorSpace),ht=x.colorSpace===bn?null:Qt.getPrimaries(x.colorSpace),pt=x.colorSpace===bn||Dt===ht?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,x.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,x.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,pt);const Bt=S(x)&&u(x.image)===!1;let at=f(x.image,Bt,!1,s.maxTextureSize);at=J(x,at);const me=u(at)||o,Xt=r.convert(x.format,x.colorSpace);let Rt=r.convert(x.type),wt=R(x.internalFormat,Xt,Rt,x.colorSpace,x.isVideoTexture);G(Q,x,me);let St;const jt=x.mipmaps,Ft=o&&x.isVideoTexture!==!0&&wt!==Pa,oe=kt.__version===void 0||rt===!0,D=it.dataReady,ft=C(x,at,me);if(x.isDepthTexture)wt=i.DEPTH_COMPONENT,o?x.type===un?wt=i.DEPTH_COMPONENT32F:x.type===wn?wt=i.DEPTH_COMPONENT24:x.type===Xn?wt=i.DEPTH24_STENCIL8:wt=i.DEPTH_COMPONENT16:x.type===un&&console.error("WebGLRenderer: Floating point depth texture requires WebGL2."),x.format===qn&&wt===i.DEPTH_COMPONENT&&x.type!==Er&&x.type!==wn&&(console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture."),x.type=wn,Rt=r.convert(x.type)),x.format===vi&&wt===i.DEPTH_COMPONENT&&(wt=i.DEPTH_STENCIL,x.type!==Xn&&(console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture."),x.type=Xn,Rt=r.convert(x.type))),oe&&(Ft?e.texStorage2D(i.TEXTURE_2D,1,wt,at.width,at.height):e.texImage2D(i.TEXTURE_2D,0,wt,at.width,at.height,0,Xt,Rt,null));else if(x.isDataTexture)if(jt.length>0&&me){Ft&&oe&&e.texStorage2D(i.TEXTURE_2D,ft,wt,jt[0].width,jt[0].height);for(let z=0,ct=jt.length;z<ct;z++)St=jt[z],Ft?D&&e.texSubImage2D(i.TEXTURE_2D,z,0,0,St.width,St.height,Xt,Rt,St.data):e.texImage2D(i.TEXTURE_2D,z,wt,St.width,St.height,0,Xt,Rt,St.data);x.generateMipmaps=!1}else Ft?(oe&&e.texStorage2D(i.TEXTURE_2D,ft,wt,at.width,at.height),D&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,at.width,at.height,Xt,Rt,at.data)):e.texImage2D(i.TEXTURE_2D,0,wt,at.width,at.height,0,Xt,Rt,at.data);else if(x.isCompressedTexture)if(x.isCompressedArrayTexture){Ft&&oe&&e.texStorage3D(i.TEXTURE_2D_ARRAY,ft,wt,jt[0].width,jt[0].height,at.depth);for(let z=0,ct=jt.length;z<ct;z++)St=jt[z],x.format!==Ke?Xt!==null?Ft?D&&e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,z,0,0,0,St.width,St.height,at.depth,Xt,St.data,0,0):e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,z,wt,St.width,St.height,at.depth,0,St.data,0,0):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ft?D&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,z,0,0,0,St.width,St.height,at.depth,Xt,Rt,St.data):e.texImage3D(i.TEXTURE_2D_ARRAY,z,wt,St.width,St.height,at.depth,0,Xt,Rt,St.data)}else{Ft&&oe&&e.texStorage2D(i.TEXTURE_2D,ft,wt,jt[0].width,jt[0].height);for(let z=0,ct=jt.length;z<ct;z++)St=jt[z],x.format!==Ke?Xt!==null?Ft?D&&e.compressedTexSubImage2D(i.TEXTURE_2D,z,0,0,St.width,St.height,Xt,St.data):e.compressedTexImage2D(i.TEXTURE_2D,z,wt,St.width,St.height,0,St.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ft?D&&e.texSubImage2D(i.TEXTURE_2D,z,0,0,St.width,St.height,Xt,Rt,St.data):e.texImage2D(i.TEXTURE_2D,z,wt,St.width,St.height,0,Xt,Rt,St.data)}else if(x.isDataArrayTexture)Ft?(oe&&e.texStorage3D(i.TEXTURE_2D_ARRAY,ft,wt,at.width,at.height,at.depth),D&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,at.width,at.height,at.depth,Xt,Rt,at.data)):e.texImage3D(i.TEXTURE_2D_ARRAY,0,wt,at.width,at.height,at.depth,0,Xt,Rt,at.data);else if(x.isData3DTexture)Ft?(oe&&e.texStorage3D(i.TEXTURE_3D,ft,wt,at.width,at.height,at.depth),D&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,at.width,at.height,at.depth,Xt,Rt,at.data)):e.texImage3D(i.TEXTURE_3D,0,wt,at.width,at.height,at.depth,0,Xt,Rt,at.data);else if(x.isFramebufferTexture){if(oe)if(Ft)e.texStorage2D(i.TEXTURE_2D,ft,wt,at.width,at.height);else{let z=at.width,ct=at.height;for(let gt=0;gt<ft;gt++)e.texImage2D(i.TEXTURE_2D,gt,wt,z,ct,0,Xt,Rt,null),z>>=1,ct>>=1}}else if(jt.length>0&&me){if(Ft&&oe){const z=bt(jt[0]);e.texStorage2D(i.TEXTURE_2D,ft,wt,z.width,z.height)}for(let z=0,ct=jt.length;z<ct;z++)St=jt[z],Ft?D&&e.texSubImage2D(i.TEXTURE_2D,z,0,0,Xt,Rt,St):e.texImage2D(i.TEXTURE_2D,z,wt,Xt,Rt,St);x.generateMipmaps=!1}else if(Ft){if(oe){const z=bt(at);e.texStorage2D(i.TEXTURE_2D,ft,wt,z.width,z.height)}D&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,Xt,Rt,at)}else e.texImage2D(i.TEXTURE_2D,0,wt,Xt,Rt,at);v(x,me)&&b(Q),kt.__version=it.version,x.onUpdate&&x.onUpdate(x)}w.__version=x.version}function Tt(w,x,X){if(x.image.length!==6)return;const Q=nt(w,x),rt=x.source;e.bindTexture(i.TEXTURE_CUBE_MAP,w.__webglTexture,i.TEXTURE0+X);const it=n.get(rt);if(rt.version!==it.__version||Q===!0){e.activeTexture(i.TEXTURE0+X);const kt=Qt.getPrimaries(Qt.workingColorSpace),Dt=x.colorSpace===bn?null:Qt.getPrimaries(x.colorSpace),ht=x.colorSpace===bn||kt===Dt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,x.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,x.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,ht);const pt=x.isCompressedTexture||x.image[0].isCompressedTexture,Bt=x.image[0]&&x.image[0].isDataTexture,at=[];for(let z=0;z<6;z++)!pt&&!Bt?at[z]=f(x.image[z],!1,!0,s.maxCubemapSize):at[z]=Bt?x.image[z].image:x.image[z],at[z]=J(x,at[z]);const me=at[0],Xt=u(me)||o,Rt=r.convert(x.format,x.colorSpace),wt=r.convert(x.type),St=R(x.internalFormat,Rt,wt,x.colorSpace),jt=o&&x.isVideoTexture!==!0,Ft=it.__version===void 0||Q===!0,oe=rt.dataReady;let D=C(x,me,Xt);G(i.TEXTURE_CUBE_MAP,x,Xt);let ft;if(pt){jt&&Ft&&e.texStorage2D(i.TEXTURE_CUBE_MAP,D,St,me.width,me.height);for(let z=0;z<6;z++){ft=at[z].mipmaps;for(let ct=0;ct<ft.length;ct++){const gt=ft[ct];x.format!==Ke?Rt!==null?jt?oe&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+z,ct,0,0,gt.width,gt.height,Rt,gt.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+z,ct,St,gt.width,gt.height,0,gt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):jt?oe&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+z,ct,0,0,gt.width,gt.height,Rt,wt,gt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+z,ct,St,gt.width,gt.height,0,Rt,wt,gt.data)}}}else{if(ft=x.mipmaps,jt&&Ft){ft.length>0&&D++;const z=bt(at[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,D,St,z.width,z.height)}for(let z=0;z<6;z++)if(Bt){jt?oe&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+z,0,0,0,at[z].width,at[z].height,Rt,wt,at[z].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+z,0,St,at[z].width,at[z].height,0,Rt,wt,at[z].data);for(let ct=0;ct<ft.length;ct++){const $t=ft[ct].image[z].image;jt?oe&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+z,ct+1,0,0,$t.width,$t.height,Rt,wt,$t.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+z,ct+1,St,$t.width,$t.height,0,Rt,wt,$t.data)}}else{jt?oe&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+z,0,0,0,Rt,wt,at[z]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+z,0,St,Rt,wt,at[z]);for(let ct=0;ct<ft.length;ct++){const gt=ft[ct];jt?oe&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+z,ct+1,0,0,Rt,wt,gt.image[z]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+z,ct+1,St,Rt,wt,gt.image[z])}}}v(x,Xt)&&b(i.TEXTURE_CUBE_MAP),it.__version=rt.version,x.onUpdate&&x.onUpdate(x)}w.__version=x.version}function yt(w,x,X,Q,rt,it){const kt=r.convert(X.format,X.colorSpace),Dt=r.convert(X.type),ht=R(X.internalFormat,kt,Dt,X.colorSpace);if(!n.get(x).__hasExternalTextures){const Bt=Math.max(1,x.width>>it),at=Math.max(1,x.height>>it);rt===i.TEXTURE_3D||rt===i.TEXTURE_2D_ARRAY?e.texImage3D(rt,it,ht,Bt,at,x.depth,0,kt,Dt,null):e.texImage2D(rt,it,ht,Bt,at,0,kt,Dt,null)}e.bindFramebuffer(i.FRAMEBUFFER,w),st(x)?c.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,Q,rt,n.get(X).__webglTexture,0,U(x)):(rt===i.TEXTURE_2D||rt>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&rt<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,Q,rt,n.get(X).__webglTexture,it),e.bindFramebuffer(i.FRAMEBUFFER,null)}function vt(w,x,X){if(i.bindRenderbuffer(i.RENDERBUFFER,w),x.depthBuffer&&!x.stencilBuffer){let Q=o===!0?i.DEPTH_COMPONENT24:i.DEPTH_COMPONENT16;if(X||st(x)){const rt=x.depthTexture;rt&&rt.isDepthTexture&&(rt.type===un?Q=i.DEPTH_COMPONENT32F:rt.type===wn&&(Q=i.DEPTH_COMPONENT24));const it=U(x);st(x)?c.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,it,Q,x.width,x.height):i.renderbufferStorageMultisample(i.RENDERBUFFER,it,Q,x.width,x.height)}else i.renderbufferStorage(i.RENDERBUFFER,Q,x.width,x.height);i.framebufferRenderbuffer(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.RENDERBUFFER,w)}else if(x.depthBuffer&&x.stencilBuffer){const Q=U(x);X&&st(x)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,Q,i.DEPTH24_STENCIL8,x.width,x.height):st(x)?c.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Q,i.DEPTH24_STENCIL8,x.width,x.height):i.renderbufferStorage(i.RENDERBUFFER,i.DEPTH_STENCIL,x.width,x.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.RENDERBUFFER,w)}else{const Q=x.textures;for(let rt=0;rt<Q.length;rt++){const it=Q[rt],kt=r.convert(it.format,it.colorSpace),Dt=r.convert(it.type),ht=R(it.internalFormat,kt,Dt,it.colorSpace),pt=U(x);X&&st(x)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,pt,ht,x.width,x.height):st(x)?c.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,pt,ht,x.width,x.height):i.renderbufferStorage(i.RENDERBUFFER,ht,x.width,x.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function zt(w,x){if(x&&x.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(i.FRAMEBUFFER,w),!(x.depthTexture&&x.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!n.get(x.depthTexture).__webglTexture||x.depthTexture.image.width!==x.width||x.depthTexture.image.height!==x.height)&&(x.depthTexture.image.width=x.width,x.depthTexture.image.height=x.height,x.depthTexture.needsUpdate=!0),tt(x.depthTexture,0);const Q=n.get(x.depthTexture).__webglTexture,rt=U(x);if(x.depthTexture.format===qn)st(x)?c.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,Q,0,rt):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,Q,0);else if(x.depthTexture.format===vi)st(x)?c.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,Q,0,rt):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,Q,0);else throw new Error("Unknown depthTexture format")}function Lt(w){const x=n.get(w),X=w.isWebGLCubeRenderTarget===!0;if(w.depthTexture&&!x.__autoAllocateDepthBuffer){if(X)throw new Error("target.depthTexture not supported in Cube render targets");zt(x.__webglFramebuffer,w)}else if(X){x.__webglDepthbuffer=[];for(let Q=0;Q<6;Q++)e.bindFramebuffer(i.FRAMEBUFFER,x.__webglFramebuffer[Q]),x.__webglDepthbuffer[Q]=i.createRenderbuffer(),vt(x.__webglDepthbuffer[Q],w,!1)}else e.bindFramebuffer(i.FRAMEBUFFER,x.__webglFramebuffer),x.__webglDepthbuffer=i.createRenderbuffer(),vt(x.__webglDepthbuffer,w,!1);e.bindFramebuffer(i.FRAMEBUFFER,null)}function N(w,x,X){const Q=n.get(w);x!==void 0&&yt(Q.__webglFramebuffer,w,w.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),X!==void 0&&Lt(w)}function Kt(w){const x=w.texture,X=n.get(w),Q=n.get(x);w.addEventListener("dispose",W);const rt=w.textures,it=w.isWebGLCubeRenderTarget===!0,kt=rt.length>1,Dt=u(w)||o;if(kt||(Q.__webglTexture===void 0&&(Q.__webglTexture=i.createTexture()),Q.__version=x.version,a.memory.textures++),it){X.__webglFramebuffer=[];for(let ht=0;ht<6;ht++)if(o&&x.mipmaps&&x.mipmaps.length>0){X.__webglFramebuffer[ht]=[];for(let pt=0;pt<x.mipmaps.length;pt++)X.__webglFramebuffer[ht][pt]=i.createFramebuffer()}else X.__webglFramebuffer[ht]=i.createFramebuffer()}else{if(o&&x.mipmaps&&x.mipmaps.length>0){X.__webglFramebuffer=[];for(let ht=0;ht<x.mipmaps.length;ht++)X.__webglFramebuffer[ht]=i.createFramebuffer()}else X.__webglFramebuffer=i.createFramebuffer();if(kt)if(s.drawBuffers)for(let ht=0,pt=rt.length;ht<pt;ht++){const Bt=n.get(rt[ht]);Bt.__webglTexture===void 0&&(Bt.__webglTexture=i.createTexture(),a.memory.textures++)}else console.warn("THREE.WebGLRenderer: WebGLMultipleRenderTargets can only be used with WebGL2 or WEBGL_draw_buffers extension.");if(o&&w.samples>0&&st(w)===!1){X.__webglMultisampledFramebuffer=i.createFramebuffer(),X.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,X.__webglMultisampledFramebuffer);for(let ht=0;ht<rt.length;ht++){const pt=rt[ht];X.__webglColorRenderbuffer[ht]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,X.__webglColorRenderbuffer[ht]);const Bt=r.convert(pt.format,pt.colorSpace),at=r.convert(pt.type),me=R(pt.internalFormat,Bt,at,pt.colorSpace,w.isXRRenderTarget===!0),Xt=U(w);i.renderbufferStorageMultisample(i.RENDERBUFFER,Xt,me,w.width,w.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ht,i.RENDERBUFFER,X.__webglColorRenderbuffer[ht])}i.bindRenderbuffer(i.RENDERBUFFER,null),w.depthBuffer&&(X.__webglDepthRenderbuffer=i.createRenderbuffer(),vt(X.__webglDepthRenderbuffer,w,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(it){e.bindTexture(i.TEXTURE_CUBE_MAP,Q.__webglTexture),G(i.TEXTURE_CUBE_MAP,x,Dt);for(let ht=0;ht<6;ht++)if(o&&x.mipmaps&&x.mipmaps.length>0)for(let pt=0;pt<x.mipmaps.length;pt++)yt(X.__webglFramebuffer[ht][pt],w,x,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ht,pt);else yt(X.__webglFramebuffer[ht],w,x,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ht,0);v(x,Dt)&&b(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(kt){for(let ht=0,pt=rt.length;ht<pt;ht++){const Bt=rt[ht],at=n.get(Bt);e.bindTexture(i.TEXTURE_2D,at.__webglTexture),G(i.TEXTURE_2D,Bt,Dt),yt(X.__webglFramebuffer,w,Bt,i.COLOR_ATTACHMENT0+ht,i.TEXTURE_2D,0),v(Bt,Dt)&&b(i.TEXTURE_2D)}e.unbindTexture()}else{let ht=i.TEXTURE_2D;if((w.isWebGL3DRenderTarget||w.isWebGLArrayRenderTarget)&&(o?ht=w.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY:console.error("THREE.WebGLTextures: THREE.Data3DTexture and THREE.DataArrayTexture only supported with WebGL2.")),e.bindTexture(ht,Q.__webglTexture),G(ht,x,Dt),o&&x.mipmaps&&x.mipmaps.length>0)for(let pt=0;pt<x.mipmaps.length;pt++)yt(X.__webglFramebuffer[pt],w,x,i.COLOR_ATTACHMENT0,ht,pt);else yt(X.__webglFramebuffer,w,x,i.COLOR_ATTACHMENT0,ht,0);v(x,Dt)&&b(ht),e.unbindTexture()}w.depthBuffer&&Lt(w)}function ut(w){const x=u(w)||o,X=w.textures;for(let Q=0,rt=X.length;Q<rt;Q++){const it=X[Q];if(v(it,x)){const kt=w.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:i.TEXTURE_2D,Dt=n.get(it).__webglTexture;e.bindTexture(kt,Dt),b(kt),e.unbindTexture()}}}function At(w){if(o&&w.samples>0&&st(w)===!1){const x=w.textures,X=w.width,Q=w.height;let rt=i.COLOR_BUFFER_BIT;const it=[],kt=w.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Dt=n.get(w),ht=x.length>1;if(ht)for(let pt=0;pt<x.length;pt++)e.bindFramebuffer(i.FRAMEBUFFER,Dt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+pt,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,Dt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+pt,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,Dt.__webglMultisampledFramebuffer),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,Dt.__webglFramebuffer);for(let pt=0;pt<x.length;pt++){it.push(i.COLOR_ATTACHMENT0+pt),w.depthBuffer&&it.push(kt);const Bt=Dt.__ignoreDepthValues!==void 0?Dt.__ignoreDepthValues:!1;if(Bt===!1&&(w.depthBuffer&&(rt|=i.DEPTH_BUFFER_BIT),w.stencilBuffer&&(rt|=i.STENCIL_BUFFER_BIT)),ht&&i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,Dt.__webglColorRenderbuffer[pt]),Bt===!0&&(i.invalidateFramebuffer(i.READ_FRAMEBUFFER,[kt]),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[kt])),ht){const at=n.get(x[pt]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,at,0)}i.blitFramebuffer(0,0,X,Q,0,0,X,Q,rt,i.NEAREST),l&&i.invalidateFramebuffer(i.READ_FRAMEBUFFER,it)}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),ht)for(let pt=0;pt<x.length;pt++){e.bindFramebuffer(i.FRAMEBUFFER,Dt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+pt,i.RENDERBUFFER,Dt.__webglColorRenderbuffer[pt]);const Bt=n.get(x[pt]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,Dt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+pt,i.TEXTURE_2D,Bt,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,Dt.__webglMultisampledFramebuffer)}}function U(w){return Math.min(s.maxSamples,w.samples)}function st(w){const x=n.get(w);return o&&w.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&x.__useRenderToTexture!==!1}function $(w){const x=a.render.frame;d.get(w)!==x&&(d.set(w,x),w.update())}function J(w,x){const X=w.colorSpace,Q=w.format,rt=w.type;return w.isCompressedTexture===!0||w.isVideoTexture===!0||w.format===vr||X!==Rn&&X!==bn&&(Qt.getTransfer(X)===re?o===!1?t.has("EXT_sRGB")===!0&&Q===Ke?(w.format=vr,w.minFilter=Ne,w.generateMipmaps=!1):x=Ua.sRGBToLinear(x):(Q!==Ke||rt!==Tn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",X)),x}function bt(w){return typeof HTMLImageElement<"u"&&w instanceof HTMLImageElement?(h.width=w.naturalWidth||w.width,h.height=w.naturalHeight||w.height):typeof VideoFrame<"u"&&w instanceof VideoFrame?(h.width=w.displayWidth,h.height=w.displayHeight):(h.width=w.width,h.height=w.height),h}this.allocateTextureUnit=Y,this.resetTextureUnits=I,this.setTexture2D=tt,this.setTexture2DArray=q,this.setTexture3D=Z,this.setTextureCube=et,this.rebindTextures=N,this.setupRenderTarget=Kt,this.updateRenderTargetMipmap=ut,this.updateMultisampleRenderTarget=At,this.setupDepthRenderbuffer=Lt,this.setupFrameBufferTexture=yt,this.useMultisampledRTT=st}function yp(i,t,e){const n=e.isWebGL2;function s(r,a=bn){let o;const c=Qt.getTransfer(a);if(r===Tn)return i.UNSIGNED_BYTE;if(r===Ea)return i.UNSIGNED_SHORT_4_4_4_4;if(r===Ta)return i.UNSIGNED_SHORT_5_5_5_1;if(r===kc)return i.BYTE;if(r===Bc)return i.SHORT;if(r===Er)return i.UNSIGNED_SHORT;if(r===Sa)return i.INT;if(r===wn)return i.UNSIGNED_INT;if(r===un)return i.FLOAT;if(r===Ui)return n?i.HALF_FLOAT:(o=t.get("OES_texture_half_float"),o!==null?o.HALF_FLOAT_OES:null);if(r===Gc)return i.ALPHA;if(r===Ke)return i.RGBA;if(r===Hc)return i.LUMINANCE;if(r===Vc)return i.LUMINANCE_ALPHA;if(r===qn)return i.DEPTH_COMPONENT;if(r===vi)return i.DEPTH_STENCIL;if(r===vr)return o=t.get("EXT_sRGB"),o!==null?o.SRGB_ALPHA_EXT:null;if(r===Wc)return i.RED;if(r===Aa)return i.RED_INTEGER;if(r===Xc)return i.RG;if(r===Ca)return i.RG_INTEGER;if(r===Ra)return i.RGBA_INTEGER;if(r===Us||r===Ns||r===Fs||r===Os)if(c===re)if(o=t.get("WEBGL_compressed_texture_s3tc_srgb"),o!==null){if(r===Us)return o.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(r===Ns)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(r===Fs)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(r===Os)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(o=t.get("WEBGL_compressed_texture_s3tc"),o!==null){if(r===Us)return o.COMPRESSED_RGB_S3TC_DXT1_EXT;if(r===Ns)return o.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(r===Fs)return o.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(r===Os)return o.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(r===$r||r===Yr||r===jr||r===Kr)if(o=t.get("WEBGL_compressed_texture_pvrtc"),o!==null){if(r===$r)return o.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(r===Yr)return o.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(r===jr)return o.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(r===Kr)return o.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(r===Pa)return o=t.get("WEBGL_compressed_texture_etc1"),o!==null?o.COMPRESSED_RGB_ETC1_WEBGL:null;if(r===Zr||r===Jr)if(o=t.get("WEBGL_compressed_texture_etc"),o!==null){if(r===Zr)return c===re?o.COMPRESSED_SRGB8_ETC2:o.COMPRESSED_RGB8_ETC2;if(r===Jr)return c===re?o.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:o.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(r===Qr||r===to||r===eo||r===no||r===io||r===so||r===ro||r===oo||r===ao||r===co||r===lo||r===ho||r===uo||r===fo)if(o=t.get("WEBGL_compressed_texture_astc"),o!==null){if(r===Qr)return c===re?o.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:o.COMPRESSED_RGBA_ASTC_4x4_KHR;if(r===to)return c===re?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:o.COMPRESSED_RGBA_ASTC_5x4_KHR;if(r===eo)return c===re?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:o.COMPRESSED_RGBA_ASTC_5x5_KHR;if(r===no)return c===re?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:o.COMPRESSED_RGBA_ASTC_6x5_KHR;if(r===io)return c===re?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:o.COMPRESSED_RGBA_ASTC_6x6_KHR;if(r===so)return c===re?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:o.COMPRESSED_RGBA_ASTC_8x5_KHR;if(r===ro)return c===re?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:o.COMPRESSED_RGBA_ASTC_8x6_KHR;if(r===oo)return c===re?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:o.COMPRESSED_RGBA_ASTC_8x8_KHR;if(r===ao)return c===re?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:o.COMPRESSED_RGBA_ASTC_10x5_KHR;if(r===co)return c===re?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:o.COMPRESSED_RGBA_ASTC_10x6_KHR;if(r===lo)return c===re?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:o.COMPRESSED_RGBA_ASTC_10x8_KHR;if(r===ho)return c===re?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:o.COMPRESSED_RGBA_ASTC_10x10_KHR;if(r===uo)return c===re?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:o.COMPRESSED_RGBA_ASTC_12x10_KHR;if(r===fo)return c===re?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:o.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(r===zs||r===po||r===mo)if(o=t.get("EXT_texture_compression_bptc"),o!==null){if(r===zs)return c===re?o.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:o.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(r===po)return o.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(r===mo)return o.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(r===qc||r===go||r===xo||r===_o)if(o=t.get("EXT_texture_compression_rgtc"),o!==null){if(r===zs)return o.COMPRESSED_RED_RGTC1_EXT;if(r===go)return o.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(r===xo)return o.COMPRESSED_RED_GREEN_RGTC2_EXT;if(r===_o)return o.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return r===Xn?n?i.UNSIGNED_INT_24_8:(o=t.get("WEBGL_depth_texture"),o!==null?o.UNSIGNED_INT_24_8_WEBGL:null):i[r]!==void 0?i[r]:null}return{convert:s}}class Mp extends de{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}}class te extends pe{constructor(){super(),this.isGroup=!0,this.type="Group"}}const bp={type:"move"};class lr{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new te,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new te,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new A,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new A),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new te,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new A,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new A),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,a=null;const o=this._targetRay,c=this._grip,l=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(l&&t.hand){a=!0;for(const y of t.hand.values()){const f=e.getJointPose(y,n),u=this._getHandJoint(l,y);f!==null&&(u.matrix.fromArray(f.transform.matrix),u.matrix.decompose(u.position,u.rotation,u.scale),u.matrixWorldNeedsUpdate=!0,u.jointRadius=f.radius),u.visible=f!==null}const h=l.joints["index-finger-tip"],d=l.joints["thumb-tip"],p=h.position.distanceTo(d.position),m=.02,g=.005;l.inputState.pinching&&p>m+g?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!l.inputState.pinching&&p<=m-g&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else c!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1));o!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(bp)))}return o!==null&&(o.visible=s!==null),c!==null&&(c.visible=r!==null),l!==null&&(l.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new te;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}const wp=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Sp=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepthEXT = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepthEXT = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class Ep{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,n){if(this.texture===null){const s=new De,r=t.properties.get(s);r.__webglTexture=e.texture,(e.depthNear!=n.depthNear||e.depthFar!=n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=s}}render(t,e){if(this.texture!==null){if(this.mesh===null){const n=e.cameras[0].viewport,s=new pn({extensions:{fragDepth:!0},vertexShader:wp,fragmentShader:Sp,uniforms:{depthColor:{value:this.texture},depthWidth:{value:n.z},depthHeight:{value:n.w}}});this.mesh=new P(new Ve(20,20),s)}t.render(this.mesh,e)}}reset(){this.texture=null,this.mesh=null}}class Tp extends bi{constructor(t,e){super();const n=this;let s=null,r=1,a=null,o="local-floor",c=1,l=null,h=null,d=null,p=null,m=null,g=null;const y=new Ep,f=e.getContextAttributes();let u=null,S=null;const v=[],b=[],R=new qt;let C=null;const T=new de;T.layers.enable(1),T.viewport=new ce;const L=new de;L.layers.enable(2),L.viewport=new ce;const W=[T,L],_=new Mp;_.layers.enable(1),_.layers.enable(2);let E=null,j=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(G){let nt=v[G];return nt===void 0&&(nt=new lr,v[G]=nt),nt.getTargetRaySpace()},this.getControllerGrip=function(G){let nt=v[G];return nt===void 0&&(nt=new lr,v[G]=nt),nt.getGripSpace()},this.getHand=function(G){let nt=v[G];return nt===void 0&&(nt=new lr,v[G]=nt),nt.getHandSpace()};function K(G){const nt=b.indexOf(G.inputSource);if(nt===-1)return;const mt=v[nt];mt!==void 0&&(mt.update(G.inputSource,G.frame,l||a),mt.dispatchEvent({type:G.type,data:G.inputSource}))}function I(){s.removeEventListener("select",K),s.removeEventListener("selectstart",K),s.removeEventListener("selectend",K),s.removeEventListener("squeeze",K),s.removeEventListener("squeezestart",K),s.removeEventListener("squeezeend",K),s.removeEventListener("end",I),s.removeEventListener("inputsourceschange",Y);for(let G=0;G<v.length;G++){const nt=b[G];nt!==null&&(b[G]=null,v[G].disconnect(nt))}E=null,j=null,y.reset(),t.setRenderTarget(u),m=null,p=null,d=null,s=null,S=null,Pt.stop(),n.isPresenting=!1,t.setPixelRatio(C),t.setSize(R.width,R.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(G){r=G,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(G){o=G,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||a},this.setReferenceSpace=function(G){l=G},this.getBaseLayer=function(){return p!==null?p:m},this.getBinding=function(){return d},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(G){if(s=G,s!==null){if(u=t.getRenderTarget(),s.addEventListener("select",K),s.addEventListener("selectstart",K),s.addEventListener("selectend",K),s.addEventListener("squeeze",K),s.addEventListener("squeezestart",K),s.addEventListener("squeezeend",K),s.addEventListener("end",I),s.addEventListener("inputsourceschange",Y),f.xrCompatible!==!0&&await e.makeXRCompatible(),C=t.getPixelRatio(),t.getSize(R),s.renderState.layers===void 0||t.capabilities.isWebGL2===!1){const nt={antialias:s.renderState.layers===void 0?f.antialias:!0,alpha:!0,depth:f.depth,stencil:f.stencil,framebufferScaleFactor:r};m=new XRWebGLLayer(s,e,nt),s.updateRenderState({baseLayer:m}),t.setPixelRatio(1),t.setSize(m.framebufferWidth,m.framebufferHeight,!1),S=new $n(m.framebufferWidth,m.framebufferHeight,{format:Ke,type:Tn,colorSpace:t.outputColorSpace,stencilBuffer:f.stencil})}else{let nt=null,mt=null,Tt=null;f.depth&&(Tt=f.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,nt=f.stencil?vi:qn,mt=f.stencil?Xn:wn);const yt={colorFormat:e.RGBA8,depthFormat:Tt,scaleFactor:r};d=new XRWebGLBinding(s,e),p=d.createProjectionLayer(yt),s.updateRenderState({layers:[p]}),t.setPixelRatio(1),t.setSize(p.textureWidth,p.textureHeight,!1),S=new $n(p.textureWidth,p.textureHeight,{format:Ke,type:Tn,depthTexture:new qa(p.textureWidth,p.textureHeight,mt,void 0,void 0,void 0,void 0,void 0,void 0,nt),stencilBuffer:f.stencil,colorSpace:t.outputColorSpace,samples:f.antialias?4:0});const vt=t.properties.get(S);vt.__ignoreDepthValues=p.ignoreDepthValues}S.isXRRenderTarget=!0,this.setFoveation(c),l=null,a=await s.requestReferenceSpace(o),Pt.setContext(s),Pt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode};function Y(G){for(let nt=0;nt<G.removed.length;nt++){const mt=G.removed[nt],Tt=b.indexOf(mt);Tt>=0&&(b[Tt]=null,v[Tt].disconnect(mt))}for(let nt=0;nt<G.added.length;nt++){const mt=G.added[nt];let Tt=b.indexOf(mt);if(Tt===-1){for(let vt=0;vt<v.length;vt++)if(vt>=b.length){b.push(mt),Tt=vt;break}else if(b[vt]===null){b[vt]=mt,Tt=vt;break}if(Tt===-1)break}const yt=v[Tt];yt&&yt.connect(mt)}}const V=new A,tt=new A;function q(G,nt,mt){V.setFromMatrixPosition(nt.matrixWorld),tt.setFromMatrixPosition(mt.matrixWorld);const Tt=V.distanceTo(tt),yt=nt.projectionMatrix.elements,vt=mt.projectionMatrix.elements,zt=yt[14]/(yt[10]-1),Lt=yt[14]/(yt[10]+1),N=(yt[9]+1)/yt[5],Kt=(yt[9]-1)/yt[5],ut=(yt[8]-1)/yt[0],At=(vt[8]+1)/vt[0],U=zt*ut,st=zt*At,$=Tt/(-ut+At),J=$*-ut;nt.matrixWorld.decompose(G.position,G.quaternion,G.scale),G.translateX(J),G.translateZ($),G.matrixWorld.compose(G.position,G.quaternion,G.scale),G.matrixWorldInverse.copy(G.matrixWorld).invert();const bt=zt+$,w=Lt+$,x=U-J,X=st+(Tt-J),Q=N*Lt/w*bt,rt=Kt*Lt/w*bt;G.projectionMatrix.makePerspective(x,X,Q,rt,bt,w),G.projectionMatrixInverse.copy(G.projectionMatrix).invert()}function Z(G,nt){nt===null?G.matrixWorld.copy(G.matrix):G.matrixWorld.multiplyMatrices(nt.matrixWorld,G.matrix),G.matrixWorldInverse.copy(G.matrixWorld).invert()}this.updateCamera=function(G){if(s===null)return;y.texture!==null&&(G.near=y.depthNear,G.far=y.depthFar),_.near=L.near=T.near=G.near,_.far=L.far=T.far=G.far,(E!==_.near||j!==_.far)&&(s.updateRenderState({depthNear:_.near,depthFar:_.far}),E=_.near,j=_.far,T.near=E,T.far=j,L.near=E,L.far=j,T.updateProjectionMatrix(),L.updateProjectionMatrix(),G.updateProjectionMatrix());const nt=G.parent,mt=_.cameras;Z(_,nt);for(let Tt=0;Tt<mt.length;Tt++)Z(mt[Tt],nt);mt.length===2?q(_,T,L):_.projectionMatrix.copy(T.projectionMatrix),et(G,_,nt)};function et(G,nt,mt){mt===null?G.matrix.copy(nt.matrixWorld):(G.matrix.copy(mt.matrixWorld),G.matrix.invert(),G.matrix.multiply(nt.matrixWorld)),G.matrix.decompose(G.position,G.quaternion,G.scale),G.updateMatrixWorld(!0),G.projectionMatrix.copy(nt.projectionMatrix),G.projectionMatrixInverse.copy(nt.projectionMatrixInverse),G.isPerspectiveCamera&&(G.fov=yi*2*Math.atan(1/G.projectionMatrix.elements[5]),G.zoom=1)}this.getCamera=function(){return _},this.getFoveation=function(){if(!(p===null&&m===null))return c},this.setFoveation=function(G){c=G,p!==null&&(p.fixedFoveation=G),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=G)},this.hasDepthSensing=function(){return y.texture!==null};let ot=null;function xt(G,nt){if(h=nt.getViewerPose(l||a),g=nt,h!==null){const mt=h.views;m!==null&&(t.setRenderTargetFramebuffer(S,m.framebuffer),t.setRenderTarget(S));let Tt=!1;mt.length!==_.cameras.length&&(_.cameras.length=0,Tt=!0);for(let vt=0;vt<mt.length;vt++){const zt=mt[vt];let Lt=null;if(m!==null)Lt=m.getViewport(zt);else{const Kt=d.getViewSubImage(p,zt);Lt=Kt.viewport,vt===0&&(t.setRenderTargetTextures(S,Kt.colorTexture,p.ignoreDepthValues?void 0:Kt.depthStencilTexture),t.setRenderTarget(S))}let N=W[vt];N===void 0&&(N=new de,N.layers.enable(vt),N.viewport=new ce,W[vt]=N),N.matrix.fromArray(zt.transform.matrix),N.matrix.decompose(N.position,N.quaternion,N.scale),N.projectionMatrix.fromArray(zt.projectionMatrix),N.projectionMatrixInverse.copy(N.projectionMatrix).invert(),N.viewport.set(Lt.x,Lt.y,Lt.width,Lt.height),vt===0&&(_.matrix.copy(N.matrix),_.matrix.decompose(_.position,_.quaternion,_.scale)),Tt===!0&&_.cameras.push(N)}const yt=s.enabledFeatures;if(yt&&yt.includes("depth-sensing")){const vt=d.getDepthInformation(mt[0]);vt&&vt.isValid&&vt.texture&&y.init(t,vt,s.renderState)}}for(let mt=0;mt<v.length;mt++){const Tt=b[mt],yt=v[mt];Tt!==null&&yt!==void 0&&yt.update(Tt,nt,l||a)}y.render(t,_),ot&&ot(G,nt),nt.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:nt}),g=null}const Pt=new Wa;Pt.setAnimationLoop(xt),this.setAnimationLoop=function(G){ot=G},this.dispose=function(){}}}const zn=new sn,Ap=new le;function Cp(i,t){function e(f,u){f.matrixAutoUpdate===!0&&f.updateMatrix(),u.value.copy(f.matrix)}function n(f,u){u.color.getRGB(f.fogColor.value,Ga(i)),u.isFog?(f.fogNear.value=u.near,f.fogFar.value=u.far):u.isFogExp2&&(f.fogDensity.value=u.density)}function s(f,u,S,v,b){u.isMeshBasicMaterial||u.isMeshLambertMaterial?r(f,u):u.isMeshToonMaterial?(r(f,u),d(f,u)):u.isMeshPhongMaterial?(r(f,u),h(f,u)):u.isMeshStandardMaterial?(r(f,u),p(f,u),u.isMeshPhysicalMaterial&&m(f,u,b)):u.isMeshMatcapMaterial?(r(f,u),g(f,u)):u.isMeshDepthMaterial?r(f,u):u.isMeshDistanceMaterial?(r(f,u),y(f,u)):u.isMeshNormalMaterial?r(f,u):u.isLineBasicMaterial?(a(f,u),u.isLineDashedMaterial&&o(f,u)):u.isPointsMaterial?c(f,u,S,v):u.isSpriteMaterial?l(f,u):u.isShadowMaterial?(f.color.value.copy(u.color),f.opacity.value=u.opacity):u.isShaderMaterial&&(u.uniformsNeedUpdate=!1)}function r(f,u){f.opacity.value=u.opacity,u.color&&f.diffuse.value.copy(u.color),u.emissive&&f.emissive.value.copy(u.emissive).multiplyScalar(u.emissiveIntensity),u.map&&(f.map.value=u.map,e(u.map,f.mapTransform)),u.alphaMap&&(f.alphaMap.value=u.alphaMap,e(u.alphaMap,f.alphaMapTransform)),u.bumpMap&&(f.bumpMap.value=u.bumpMap,e(u.bumpMap,f.bumpMapTransform),f.bumpScale.value=u.bumpScale,u.side===be&&(f.bumpScale.value*=-1)),u.normalMap&&(f.normalMap.value=u.normalMap,e(u.normalMap,f.normalMapTransform),f.normalScale.value.copy(u.normalScale),u.side===be&&f.normalScale.value.negate()),u.displacementMap&&(f.displacementMap.value=u.displacementMap,e(u.displacementMap,f.displacementMapTransform),f.displacementScale.value=u.displacementScale,f.displacementBias.value=u.displacementBias),u.emissiveMap&&(f.emissiveMap.value=u.emissiveMap,e(u.emissiveMap,f.emissiveMapTransform)),u.specularMap&&(f.specularMap.value=u.specularMap,e(u.specularMap,f.specularMapTransform)),u.alphaTest>0&&(f.alphaTest.value=u.alphaTest);const S=t.get(u),v=S.envMap,b=S.envMapRotation;if(v&&(f.envMap.value=v,zn.copy(b),zn.x*=-1,zn.y*=-1,zn.z*=-1,v.isCubeTexture&&v.isRenderTargetTexture===!1&&(zn.y*=-1,zn.z*=-1),f.envMapRotation.value.setFromMatrix4(Ap.makeRotationFromEuler(zn)),f.flipEnvMap.value=v.isCubeTexture&&v.isRenderTargetTexture===!1?-1:1,f.reflectivity.value=u.reflectivity,f.ior.value=u.ior,f.refractionRatio.value=u.refractionRatio),u.lightMap){f.lightMap.value=u.lightMap;const R=i._useLegacyLights===!0?Math.PI:1;f.lightMapIntensity.value=u.lightMapIntensity*R,e(u.lightMap,f.lightMapTransform)}u.aoMap&&(f.aoMap.value=u.aoMap,f.aoMapIntensity.value=u.aoMapIntensity,e(u.aoMap,f.aoMapTransform))}function a(f,u){f.diffuse.value.copy(u.color),f.opacity.value=u.opacity,u.map&&(f.map.value=u.map,e(u.map,f.mapTransform))}function o(f,u){f.dashSize.value=u.dashSize,f.totalSize.value=u.dashSize+u.gapSize,f.scale.value=u.scale}function c(f,u,S,v){f.diffuse.value.copy(u.color),f.opacity.value=u.opacity,f.size.value=u.size*S,f.scale.value=v*.5,u.map&&(f.map.value=u.map,e(u.map,f.uvTransform)),u.alphaMap&&(f.alphaMap.value=u.alphaMap,e(u.alphaMap,f.alphaMapTransform)),u.alphaTest>0&&(f.alphaTest.value=u.alphaTest)}function l(f,u){f.diffuse.value.copy(u.color),f.opacity.value=u.opacity,f.rotation.value=u.rotation,u.map&&(f.map.value=u.map,e(u.map,f.mapTransform)),u.alphaMap&&(f.alphaMap.value=u.alphaMap,e(u.alphaMap,f.alphaMapTransform)),u.alphaTest>0&&(f.alphaTest.value=u.alphaTest)}function h(f,u){f.specular.value.copy(u.specular),f.shininess.value=Math.max(u.shininess,1e-4)}function d(f,u){u.gradientMap&&(f.gradientMap.value=u.gradientMap)}function p(f,u){f.metalness.value=u.metalness,u.metalnessMap&&(f.metalnessMap.value=u.metalnessMap,e(u.metalnessMap,f.metalnessMapTransform)),f.roughness.value=u.roughness,u.roughnessMap&&(f.roughnessMap.value=u.roughnessMap,e(u.roughnessMap,f.roughnessMapTransform)),t.get(u).envMap&&(f.envMapIntensity.value=u.envMapIntensity)}function m(f,u,S){f.ior.value=u.ior,u.sheen>0&&(f.sheenColor.value.copy(u.sheenColor).multiplyScalar(u.sheen),f.sheenRoughness.value=u.sheenRoughness,u.sheenColorMap&&(f.sheenColorMap.value=u.sheenColorMap,e(u.sheenColorMap,f.sheenColorMapTransform)),u.sheenRoughnessMap&&(f.sheenRoughnessMap.value=u.sheenRoughnessMap,e(u.sheenRoughnessMap,f.sheenRoughnessMapTransform))),u.clearcoat>0&&(f.clearcoat.value=u.clearcoat,f.clearcoatRoughness.value=u.clearcoatRoughness,u.clearcoatMap&&(f.clearcoatMap.value=u.clearcoatMap,e(u.clearcoatMap,f.clearcoatMapTransform)),u.clearcoatRoughnessMap&&(f.clearcoatRoughnessMap.value=u.clearcoatRoughnessMap,e(u.clearcoatRoughnessMap,f.clearcoatRoughnessMapTransform)),u.clearcoatNormalMap&&(f.clearcoatNormalMap.value=u.clearcoatNormalMap,e(u.clearcoatNormalMap,f.clearcoatNormalMapTransform),f.clearcoatNormalScale.value.copy(u.clearcoatNormalScale),u.side===be&&f.clearcoatNormalScale.value.negate())),u.iridescence>0&&(f.iridescence.value=u.iridescence,f.iridescenceIOR.value=u.iridescenceIOR,f.iridescenceThicknessMinimum.value=u.iridescenceThicknessRange[0],f.iridescenceThicknessMaximum.value=u.iridescenceThicknessRange[1],u.iridescenceMap&&(f.iridescenceMap.value=u.iridescenceMap,e(u.iridescenceMap,f.iridescenceMapTransform)),u.iridescenceThicknessMap&&(f.iridescenceThicknessMap.value=u.iridescenceThicknessMap,e(u.iridescenceThicknessMap,f.iridescenceThicknessMapTransform))),u.transmission>0&&(f.transmission.value=u.transmission,f.transmissionSamplerMap.value=S.texture,f.transmissionSamplerSize.value.set(S.width,S.height),u.transmissionMap&&(f.transmissionMap.value=u.transmissionMap,e(u.transmissionMap,f.transmissionMapTransform)),f.thickness.value=u.thickness,u.thicknessMap&&(f.thicknessMap.value=u.thicknessMap,e(u.thicknessMap,f.thicknessMapTransform)),f.attenuationDistance.value=u.attenuationDistance,f.attenuationColor.value.copy(u.attenuationColor)),u.anisotropy>0&&(f.anisotropyVector.value.set(u.anisotropy*Math.cos(u.anisotropyRotation),u.anisotropy*Math.sin(u.anisotropyRotation)),u.anisotropyMap&&(f.anisotropyMap.value=u.anisotropyMap,e(u.anisotropyMap,f.anisotropyMapTransform))),f.specularIntensity.value=u.specularIntensity,f.specularColor.value.copy(u.specularColor),u.specularColorMap&&(f.specularColorMap.value=u.specularColorMap,e(u.specularColorMap,f.specularColorMapTransform)),u.specularIntensityMap&&(f.specularIntensityMap.value=u.specularIntensityMap,e(u.specularIntensityMap,f.specularIntensityMapTransform))}function g(f,u){u.matcap&&(f.matcap.value=u.matcap)}function y(f,u){const S=t.get(u).light;f.referencePosition.value.setFromMatrixPosition(S.matrixWorld),f.nearDistance.value=S.shadow.camera.near,f.farDistance.value=S.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function Rp(i,t,e,n){let s={},r={},a=[];const o=e.isWebGL2?i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS):0;function c(S,v){const b=v.program;n.uniformBlockBinding(S,b)}function l(S,v){let b=s[S.id];b===void 0&&(g(S),b=h(S),s[S.id]=b,S.addEventListener("dispose",f));const R=v.program;n.updateUBOMapping(S,R);const C=t.render.frame;r[S.id]!==C&&(p(S),r[S.id]=C)}function h(S){const v=d();S.__bindingPointIndex=v;const b=i.createBuffer(),R=S.__size,C=S.usage;return i.bindBuffer(i.UNIFORM_BUFFER,b),i.bufferData(i.UNIFORM_BUFFER,R,C),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,v,b),b}function d(){for(let S=0;S<o;S++)if(a.indexOf(S)===-1)return a.push(S),S;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function p(S){const v=s[S.id],b=S.uniforms,R=S.__cache;i.bindBuffer(i.UNIFORM_BUFFER,v);for(let C=0,T=b.length;C<T;C++){const L=Array.isArray(b[C])?b[C]:[b[C]];for(let W=0,_=L.length;W<_;W++){const E=L[W];if(m(E,C,W,R)===!0){const j=E.__offset,K=Array.isArray(E.value)?E.value:[E.value];let I=0;for(let Y=0;Y<K.length;Y++){const V=K[Y],tt=y(V);typeof V=="number"||typeof V=="boolean"?(E.__data[0]=V,i.bufferSubData(i.UNIFORM_BUFFER,j+I,E.__data)):V.isMatrix3?(E.__data[0]=V.elements[0],E.__data[1]=V.elements[1],E.__data[2]=V.elements[2],E.__data[3]=0,E.__data[4]=V.elements[3],E.__data[5]=V.elements[4],E.__data[6]=V.elements[5],E.__data[7]=0,E.__data[8]=V.elements[6],E.__data[9]=V.elements[7],E.__data[10]=V.elements[8],E.__data[11]=0):(V.toArray(E.__data,I),I+=tt.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,j,E.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function m(S,v,b,R){const C=S.value,T=v+"_"+b;if(R[T]===void 0)return typeof C=="number"||typeof C=="boolean"?R[T]=C:R[T]=C.clone(),!0;{const L=R[T];if(typeof C=="number"||typeof C=="boolean"){if(L!==C)return R[T]=C,!0}else if(L.equals(C)===!1)return L.copy(C),!0}return!1}function g(S){const v=S.uniforms;let b=0;const R=16;for(let T=0,L=v.length;T<L;T++){const W=Array.isArray(v[T])?v[T]:[v[T]];for(let _=0,E=W.length;_<E;_++){const j=W[_],K=Array.isArray(j.value)?j.value:[j.value];for(let I=0,Y=K.length;I<Y;I++){const V=K[I],tt=y(V),q=b%R;q!==0&&R-q<tt.boundary&&(b+=R-q),j.__data=new Float32Array(tt.storage/Float32Array.BYTES_PER_ELEMENT),j.__offset=b,b+=tt.storage}}}const C=b%R;return C>0&&(b+=R-C),S.__size=b,S.__cache={},this}function y(S){const v={boundary:0,storage:0};return typeof S=="number"||typeof S=="boolean"?(v.boundary=4,v.storage=4):S.isVector2?(v.boundary=8,v.storage=8):S.isVector3||S.isColor?(v.boundary=16,v.storage=12):S.isVector4?(v.boundary=16,v.storage=16):S.isMatrix3?(v.boundary=48,v.storage=48):S.isMatrix4?(v.boundary=64,v.storage=64):S.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",S),v}function f(S){const v=S.target;v.removeEventListener("dispose",f);const b=a.indexOf(v.__bindingPointIndex);a.splice(b,1),i.deleteBuffer(s[v.id]),delete s[v.id],delete r[v.id]}function u(){for(const S in s)i.deleteBuffer(s[S]);a=[],s={},r={}}return{bind:c,update:l,dispose:u}}class Ja{constructor(t={}){const{canvas:e=xl(),context:n=null,depth:s=!0,stencil:r=!0,alpha:a=!1,antialias:o=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:d=!1}=t;this.isWebGLRenderer=!0;let p;n!==null?p=n.getContextAttributes().alpha:p=a;const m=new Uint32Array(4),g=new Int32Array(4);let y=null,f=null;const u=[],S=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Ye,this._useLegacyLights=!1,this.toneMapping=En,this.toneMappingExposure=1;const v=this;let b=!1,R=0,C=0,T=null,L=-1,W=null;const _=new ce,E=new ce;let j=null;const K=new Ct(0);let I=0,Y=e.width,V=e.height,tt=1,q=null,Z=null;const et=new ce(0,0,Y,V),ot=new ce(0,0,Y,V);let xt=!1;const Pt=new Rr;let G=!1,nt=!1,mt=null;const Tt=new le,yt=new qt,vt=new A,zt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};function Lt(){return T===null?tt:1}let N=n;function Kt(M,F){for(let k=0;k<M.length;k++){const H=M[k],O=e.getContext(H,F);if(O!==null)return O}return null}try{const M={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:h,failIfMajorPerformanceCaveat:d};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${wr}`),e.addEventListener("webglcontextlost",oe,!1),e.addEventListener("webglcontextrestored",D,!1),e.addEventListener("webglcontextcreationerror",ft,!1),N===null){const F=["webgl2","webgl","experimental-webgl"];if(v.isWebGL1Renderer===!0&&F.shift(),N=Kt(F,M),N===null)throw Kt(F)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}typeof WebGLRenderingContext<"u"&&N instanceof WebGLRenderingContext&&console.warn("THREE.WebGLRenderer: WebGL 1 support was deprecated in r153 and will be removed in r163."),N.getShaderPrecisionFormat===void 0&&(N.getShaderPrecisionFormat=function(){return{rangeMin:1,rangeMax:1,precision:1}})}catch(M){throw console.error("THREE.WebGLRenderer: "+M.message),M}let ut,At,U,st,$,J,bt,w,x,X,Q,rt,it,kt,Dt,ht,pt,Bt,at,me,Xt,Rt,wt,St;function jt(){ut=new Uu(N),At=new Cu(N,ut,t),ut.init(At),Rt=new yp(N,ut,At),U=new _p(N,ut,At),st=new Ou(N),$=new sp,J=new vp(N,ut,U,$,At,Rt,st),bt=new Pu(v),w=new Du(v),x=new Vl(N,At),wt=new Tu(N,ut,x,At),X=new Nu(N,x,st,wt),Q=new Gu(N,X,x,st),at=new Bu(N,At,J),ht=new Ru($),rt=new ip(v,bt,w,ut,At,wt,ht),it=new Cp(v,$),kt=new op,Dt=new up(ut,At),Bt=new Eu(v,bt,w,U,Q,p,c),pt=new xp(v,Q,At),St=new Rp(N,st,At,U),me=new Au(N,ut,st,At),Xt=new Fu(N,ut,st,At),st.programs=rt.programs,v.capabilities=At,v.extensions=ut,v.properties=$,v.renderLists=kt,v.shadowMap=pt,v.state=U,v.info=st}jt();const Ft=new Tp(v,N);this.xr=Ft,this.getContext=function(){return N},this.getContextAttributes=function(){return N.getContextAttributes()},this.forceContextLoss=function(){const M=ut.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){const M=ut.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return tt},this.setPixelRatio=function(M){M!==void 0&&(tt=M,this.setSize(Y,V,!1))},this.getSize=function(M){return M.set(Y,V)},this.setSize=function(M,F,k=!0){if(Ft.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}Y=M,V=F,e.width=Math.floor(M*tt),e.height=Math.floor(F*tt),k===!0&&(e.style.width=M+"px",e.style.height=F+"px"),this.setViewport(0,0,M,F)},this.getDrawingBufferSize=function(M){return M.set(Y*tt,V*tt).floor()},this.setDrawingBufferSize=function(M,F,k){Y=M,V=F,tt=k,e.width=Math.floor(M*k),e.height=Math.floor(F*k),this.setViewport(0,0,M,F)},this.getCurrentViewport=function(M){return M.copy(_)},this.getViewport=function(M){return M.copy(et)},this.setViewport=function(M,F,k,H){M.isVector4?et.set(M.x,M.y,M.z,M.w):et.set(M,F,k,H),U.viewport(_.copy(et).multiplyScalar(tt).round())},this.getScissor=function(M){return M.copy(ot)},this.setScissor=function(M,F,k,H){M.isVector4?ot.set(M.x,M.y,M.z,M.w):ot.set(M,F,k,H),U.scissor(E.copy(ot).multiplyScalar(tt).round())},this.getScissorTest=function(){return xt},this.setScissorTest=function(M){U.setScissorTest(xt=M)},this.setOpaqueSort=function(M){q=M},this.setTransparentSort=function(M){Z=M},this.getClearColor=function(M){return M.copy(Bt.getClearColor())},this.setClearColor=function(){Bt.setClearColor.apply(Bt,arguments)},this.getClearAlpha=function(){return Bt.getClearAlpha()},this.setClearAlpha=function(){Bt.setClearAlpha.apply(Bt,arguments)},this.clear=function(M=!0,F=!0,k=!0){let H=0;if(M){let O=!1;if(T!==null){const _t=T.texture.format;O=_t===Ra||_t===Ca||_t===Aa}if(O){const _t=T.texture.type,Et=_t===Tn||_t===wn||_t===Er||_t===Xn||_t===Ea||_t===Ta,It=Bt.getClearColor(),Ut=Bt.getClearAlpha(),Wt=It.r,Nt=It.g,Ot=It.b;Et?(m[0]=Wt,m[1]=Nt,m[2]=Ot,m[3]=Ut,N.clearBufferuiv(N.COLOR,0,m)):(g[0]=Wt,g[1]=Nt,g[2]=Ot,g[3]=Ut,N.clearBufferiv(N.COLOR,0,g))}else H|=N.COLOR_BUFFER_BIT}F&&(H|=N.DEPTH_BUFFER_BIT),k&&(H|=N.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),N.clear(H)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",oe,!1),e.removeEventListener("webglcontextrestored",D,!1),e.removeEventListener("webglcontextcreationerror",ft,!1),kt.dispose(),Dt.dispose(),$.dispose(),bt.dispose(),w.dispose(),Q.dispose(),wt.dispose(),St.dispose(),rt.dispose(),Ft.dispose(),Ft.removeEventListener("sessionstart",Be),Ft.removeEventListener("sessionend",ie),mt&&(mt.dispose(),mt=null),Ce.stop()};function oe(M){M.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),b=!0}function D(){console.log("THREE.WebGLRenderer: Context Restored."),b=!1;const M=st.autoReset,F=pt.enabled,k=pt.autoUpdate,H=pt.needsUpdate,O=pt.type;jt(),st.autoReset=M,pt.enabled=F,pt.autoUpdate=k,pt.needsUpdate=H,pt.type=O}function ft(M){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function z(M){const F=M.target;F.removeEventListener("dispose",z),ct(F)}function ct(M){gt(M),$.remove(M)}function gt(M){const F=$.get(M).programs;F!==void 0&&(F.forEach(function(k){rt.releaseProgram(k)}),M.isShaderMaterial&&rt.releaseShaderCache(M))}this.renderBufferDirect=function(M,F,k,H,O,_t){F===null&&(F=zt);const Et=O.isMesh&&O.matrixWorld.determinant()<0,It=nc(M,F,k,H,O);U.setMaterial(H,Et);let Ut=k.index,Wt=1;if(H.wireframe===!0){if(Ut=X.getWireframeAttribute(k),Ut===void 0)return;Wt=2}const Nt=k.drawRange,Ot=k.attributes.position;let fe=Nt.start*Wt,Oe=(Nt.start+Nt.count)*Wt;_t!==null&&(fe=Math.max(fe,_t.start*Wt),Oe=Math.min(Oe,(_t.start+_t.count)*Wt)),Ut!==null?(fe=Math.max(fe,0),Oe=Math.min(Oe,Ut.count)):Ot!=null&&(fe=Math.max(fe,0),Oe=Math.min(Oe,Ot.count));const ye=Oe-fe;if(ye<0||ye===1/0)return;wt.setup(O,H,It,k,Ut);let rn,he=me;if(Ut!==null&&(rn=x.get(Ut),he=Xt,he.setIndex(rn)),O.isMesh)H.wireframe===!0?(U.setLineWidth(H.wireframeLinewidth*Lt()),he.setMode(N.LINES)):he.setMode(N.TRIANGLES);else if(O.isLine){let Gt=H.linewidth;Gt===void 0&&(Gt=1),U.setLineWidth(Gt*Lt()),O.isLineSegments?he.setMode(N.LINES):O.isLineLoop?he.setMode(N.LINE_LOOP):he.setMode(N.LINE_STRIP)}else O.isPoints?he.setMode(N.POINTS):O.isSprite&&he.setMode(N.TRIANGLES);if(O.isBatchedMesh)he.renderMultiDraw(O._multiDrawStarts,O._multiDrawCounts,O._multiDrawCount);else if(O.isInstancedMesh)he.renderInstances(fe,ye,O.count);else if(k.isInstancedBufferGeometry){const Gt=k._maxInstanceCount!==void 0?k._maxInstanceCount:1/0,Rs=Math.min(k.instanceCount,Gt);he.renderInstances(fe,ye,Rs)}else he.render(fe,ye)};function $t(M,F,k){M.transparent===!0&&M.side===ue&&M.forceSinglePass===!1?(M.side=be,M.needsUpdate=!0,Hi(M,F,k),M.side=nn,M.needsUpdate=!0,Hi(M,F,k),M.side=ue):Hi(M,F,k)}this.compile=function(M,F,k=null){k===null&&(k=M),f=Dt.get(k),f.init(),S.push(f),k.traverseVisible(function(O){O.isLight&&O.layers.test(F.layers)&&(f.pushLight(O),O.castShadow&&f.pushShadow(O))}),M!==k&&M.traverseVisible(function(O){O.isLight&&O.layers.test(F.layers)&&(f.pushLight(O),O.castShadow&&f.pushShadow(O))}),f.setupLights(v._useLegacyLights);const H=new Set;return M.traverse(function(O){const _t=O.material;if(_t)if(Array.isArray(_t))for(let Et=0;Et<_t.length;Et++){const It=_t[Et];$t(It,k,O),H.add(It)}else $t(_t,k,O),H.add(_t)}),S.pop(),f=null,H},this.compileAsync=function(M,F,k=null){const H=this.compile(M,F,k);return new Promise(O=>{function _t(){if(H.forEach(function(Et){$.get(Et).currentProgram.isReady()&&H.delete(Et)}),H.size===0){O(M);return}setTimeout(_t,10)}ut.get("KHR_parallel_shader_compile")!==null?_t():setTimeout(_t,10)})};let ne=null;function we(M){ne&&ne(M)}function Be(){Ce.stop()}function ie(){Ce.start()}const Ce=new Wa;Ce.setAnimationLoop(we),typeof self<"u"&&Ce.setContext(self),this.setAnimationLoop=function(M){ne=M,Ft.setAnimationLoop(M),M===null?Ce.stop():Ce.start()},Ft.addEventListener("sessionstart",Be),Ft.addEventListener("sessionend",ie),this.render=function(M,F){if(F!==void 0&&F.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(b===!0)return;M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),F.parent===null&&F.matrixWorldAutoUpdate===!0&&F.updateMatrixWorld(),Ft.enabled===!0&&Ft.isPresenting===!0&&(Ft.cameraAutoUpdate===!0&&Ft.updateCamera(F),F=Ft.getCamera()),M.isScene===!0&&M.onBeforeRender(v,M,F,T),f=Dt.get(M,S.length),f.init(),S.push(f),Tt.multiplyMatrices(F.projectionMatrix,F.matrixWorldInverse),Pt.setFromProjectionMatrix(Tt),nt=this.localClippingEnabled,G=ht.init(this.clippingPlanes,nt),y=kt.get(M,u.length),y.init(),u.push(y),Je(M,F,0,v.sortObjects),y.finish(),v.sortObjects===!0&&y.sort(q,Z),this.info.render.frame++,G===!0&&ht.beginShadows();const k=f.state.shadowsArray;if(pt.render(k,M,F),G===!0&&ht.endShadows(),this.info.autoReset===!0&&this.info.reset(),(Ft.enabled===!1||Ft.isPresenting===!1||Ft.hasDepthSensing()===!1)&&Bt.render(y,M),f.setupLights(v._useLegacyLights),F.isArrayCamera){const H=F.cameras;for(let O=0,_t=H.length;O<_t;O++){const Et=H[O];Nr(y,M,Et,Et.viewport)}}else Nr(y,M,F);T!==null&&(J.updateMultisampleRenderTarget(T),J.updateRenderTargetMipmap(T)),M.isScene===!0&&M.onAfterRender(v,M,F),wt.resetDefaultState(),L=-1,W=null,S.pop(),S.length>0?f=S[S.length-1]:f=null,u.pop(),u.length>0?y=u[u.length-1]:y=null};function Je(M,F,k,H){if(M.visible===!1)return;if(M.layers.test(F.layers)){if(M.isGroup)k=M.renderOrder;else if(M.isLOD)M.autoUpdate===!0&&M.update(F);else if(M.isLight)f.pushLight(M),M.castShadow&&f.pushShadow(M);else if(M.isSprite){if(!M.frustumCulled||Pt.intersectsSprite(M)){H&&vt.setFromMatrixPosition(M.matrixWorld).applyMatrix4(Tt);const Et=Q.update(M),It=M.material;It.visible&&y.push(M,Et,It,k,vt.z,null)}}else if((M.isMesh||M.isLine||M.isPoints)&&(!M.frustumCulled||Pt.intersectsObject(M))){const Et=Q.update(M),It=M.material;if(H&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),vt.copy(M.boundingSphere.center)):(Et.boundingSphere===null&&Et.computeBoundingSphere(),vt.copy(Et.boundingSphere.center)),vt.applyMatrix4(M.matrixWorld).applyMatrix4(Tt)),Array.isArray(It)){const Ut=Et.groups;for(let Wt=0,Nt=Ut.length;Wt<Nt;Wt++){const Ot=Ut[Wt],fe=It[Ot.materialIndex];fe&&fe.visible&&y.push(M,Et,fe,k,vt.z,Ot)}}else It.visible&&y.push(M,Et,It,k,vt.z,null)}}const _t=M.children;for(let Et=0,It=_t.length;Et<It;Et++)Je(_t[Et],F,k,H)}function Nr(M,F,k,H){const O=M.opaque,_t=M.transmissive,Et=M.transparent;f.setupLightsView(k),G===!0&&ht.setGlobalState(v.clippingPlanes,k),_t.length>0&&ec(O,_t,F,k),H&&U.viewport(_.copy(H)),O.length>0&&Gi(O,F,k),_t.length>0&&Gi(_t,F,k),Et.length>0&&Gi(Et,F,k),U.buffers.depth.setTest(!0),U.buffers.depth.setMask(!0),U.buffers.color.setMask(!0),U.setPolygonOffset(!1)}function ec(M,F,k,H){if((k.isScene===!0?k.overrideMaterial:null)!==null)return;const _t=At.isWebGL2;mt===null&&(mt=new $n(1,1,{generateMipmaps:!0,type:ut.has("EXT_color_buffer_half_float")?Ui:Tn,minFilter:Wn,samples:_t?4:0})),v.getDrawingBufferSize(yt),_t?mt.setSize(yt.x,yt.y):mt.setSize(vs(yt.x),vs(yt.y));const Et=v.getRenderTarget();v.setRenderTarget(mt),v.getClearColor(K),I=v.getClearAlpha(),I<1&&v.setClearColor(16777215,.5),v.clear();const It=v.toneMapping;v.toneMapping=En,Gi(M,k,H),J.updateMultisampleRenderTarget(mt),J.updateRenderTargetMipmap(mt);let Ut=!1;for(let Wt=0,Nt=F.length;Wt<Nt;Wt++){const Ot=F[Wt],fe=Ot.object,Oe=Ot.geometry,ye=Ot.material,rn=Ot.group;if(ye.side===ue&&fe.layers.test(H.layers)){const he=ye.side;ye.side=be,ye.needsUpdate=!0,Fr(fe,k,H,Oe,ye,rn),ye.side=he,ye.needsUpdate=!0,Ut=!0}}Ut===!0&&(J.updateMultisampleRenderTarget(mt),J.updateRenderTargetMipmap(mt)),v.setRenderTarget(Et),v.setClearColor(K,I),v.toneMapping=It}function Gi(M,F,k){const H=F.isScene===!0?F.overrideMaterial:null;for(let O=0,_t=M.length;O<_t;O++){const Et=M[O],It=Et.object,Ut=Et.geometry,Wt=H===null?Et.material:H,Nt=Et.group;It.layers.test(k.layers)&&Fr(It,F,k,Ut,Wt,Nt)}}function Fr(M,F,k,H,O,_t){M.onBeforeRender(v,F,k,H,O,_t),M.modelViewMatrix.multiplyMatrices(k.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),O.onBeforeRender(v,F,k,H,M,_t),O.transparent===!0&&O.side===ue&&O.forceSinglePass===!1?(O.side=be,O.needsUpdate=!0,v.renderBufferDirect(k,F,H,O,M,_t),O.side=nn,O.needsUpdate=!0,v.renderBufferDirect(k,F,H,O,M,_t),O.side=ue):v.renderBufferDirect(k,F,H,O,M,_t),M.onAfterRender(v,F,k,H,O,_t)}function Hi(M,F,k){F.isScene!==!0&&(F=zt);const H=$.get(M),O=f.state.lights,_t=f.state.shadowsArray,Et=O.state.version,It=rt.getParameters(M,O.state,_t,F,k),Ut=rt.getProgramCacheKey(It);let Wt=H.programs;H.environment=M.isMeshStandardMaterial?F.environment:null,H.fog=F.fog,H.envMap=(M.isMeshStandardMaterial?w:bt).get(M.envMap||H.environment),H.envMapRotation=H.environment!==null&&M.envMap===null?F.environmentRotation:M.envMapRotation,Wt===void 0&&(M.addEventListener("dispose",z),Wt=new Map,H.programs=Wt);let Nt=Wt.get(Ut);if(Nt!==void 0){if(H.currentProgram===Nt&&H.lightsStateVersion===Et)return zr(M,It),Nt}else It.uniforms=rt.getUniforms(M),M.onBuild(k,It,v),M.onBeforeCompile(It,v),Nt=rt.acquireProgram(It,Ut),Wt.set(Ut,Nt),H.uniforms=It.uniforms;const Ot=H.uniforms;return(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)&&(Ot.clippingPlanes=ht.uniform),zr(M,It),H.needsLights=sc(M),H.lightsStateVersion=Et,H.needsLights&&(Ot.ambientLightColor.value=O.state.ambient,Ot.lightProbe.value=O.state.probe,Ot.directionalLights.value=O.state.directional,Ot.directionalLightShadows.value=O.state.directionalShadow,Ot.spotLights.value=O.state.spot,Ot.spotLightShadows.value=O.state.spotShadow,Ot.rectAreaLights.value=O.state.rectArea,Ot.ltc_1.value=O.state.rectAreaLTC1,Ot.ltc_2.value=O.state.rectAreaLTC2,Ot.pointLights.value=O.state.point,Ot.pointLightShadows.value=O.state.pointShadow,Ot.hemisphereLights.value=O.state.hemi,Ot.directionalShadowMap.value=O.state.directionalShadowMap,Ot.directionalShadowMatrix.value=O.state.directionalShadowMatrix,Ot.spotShadowMap.value=O.state.spotShadowMap,Ot.spotLightMatrix.value=O.state.spotLightMatrix,Ot.spotLightMap.value=O.state.spotLightMap,Ot.pointShadowMap.value=O.state.pointShadowMap,Ot.pointShadowMatrix.value=O.state.pointShadowMatrix),H.currentProgram=Nt,H.uniformsList=null,Nt}function Or(M){if(M.uniformsList===null){const F=M.currentProgram.getUniforms();M.uniformsList=fs.seqWithValue(F.seq,M.uniforms)}return M.uniformsList}function zr(M,F){const k=$.get(M);k.outputColorSpace=F.outputColorSpace,k.batching=F.batching,k.instancing=F.instancing,k.instancingColor=F.instancingColor,k.instancingMorph=F.instancingMorph,k.skinning=F.skinning,k.morphTargets=F.morphTargets,k.morphNormals=F.morphNormals,k.morphColors=F.morphColors,k.morphTargetsCount=F.morphTargetsCount,k.numClippingPlanes=F.numClippingPlanes,k.numIntersection=F.numClipIntersection,k.vertexAlphas=F.vertexAlphas,k.vertexTangents=F.vertexTangents,k.toneMapping=F.toneMapping}function nc(M,F,k,H,O){F.isScene!==!0&&(F=zt),J.resetTextureUnits();const _t=F.fog,Et=H.isMeshStandardMaterial?F.environment:null,It=T===null?v.outputColorSpace:T.isXRRenderTarget===!0?T.texture.colorSpace:Rn,Ut=(H.isMeshStandardMaterial?w:bt).get(H.envMap||Et),Wt=H.vertexColors===!0&&!!k.attributes.color&&k.attributes.color.itemSize===4,Nt=!!k.attributes.tangent&&(!!H.normalMap||H.anisotropy>0),Ot=!!k.morphAttributes.position,fe=!!k.morphAttributes.normal,Oe=!!k.morphAttributes.color;let ye=En;H.toneMapped&&(T===null||T.isXRRenderTarget===!0)&&(ye=v.toneMapping);const rn=k.morphAttributes.position||k.morphAttributes.normal||k.morphAttributes.color,he=rn!==void 0?rn.length:0,Gt=$.get(H),Rs=f.state.lights;if(G===!0&&(nt===!0||M!==W)){const Ge=M===W&&H.id===L;ht.setState(H,M,Ge)}let ae=!1;H.version===Gt.__version?(Gt.needsLights&&Gt.lightsStateVersion!==Rs.state.version||Gt.outputColorSpace!==It||O.isBatchedMesh&&Gt.batching===!1||!O.isBatchedMesh&&Gt.batching===!0||O.isInstancedMesh&&Gt.instancing===!1||!O.isInstancedMesh&&Gt.instancing===!0||O.isSkinnedMesh&&Gt.skinning===!1||!O.isSkinnedMesh&&Gt.skinning===!0||O.isInstancedMesh&&Gt.instancingColor===!0&&O.instanceColor===null||O.isInstancedMesh&&Gt.instancingColor===!1&&O.instanceColor!==null||O.isInstancedMesh&&Gt.instancingMorph===!0&&O.morphTexture===null||O.isInstancedMesh&&Gt.instancingMorph===!1&&O.morphTexture!==null||Gt.envMap!==Ut||H.fog===!0&&Gt.fog!==_t||Gt.numClippingPlanes!==void 0&&(Gt.numClippingPlanes!==ht.numPlanes||Gt.numIntersection!==ht.numIntersection)||Gt.vertexAlphas!==Wt||Gt.vertexTangents!==Nt||Gt.morphTargets!==Ot||Gt.morphNormals!==fe||Gt.morphColors!==Oe||Gt.toneMapping!==ye||At.isWebGL2===!0&&Gt.morphTargetsCount!==he)&&(ae=!0):(ae=!0,Gt.__version=H.version);let Ln=Gt.currentProgram;ae===!0&&(Ln=Hi(H,F,O));let kr=!1,Ei=!1,Ps=!1;const Ee=Ln.getUniforms(),In=Gt.uniforms;if(U.useProgram(Ln.program)&&(kr=!0,Ei=!0,Ps=!0),H.id!==L&&(L=H.id,Ei=!0),kr||W!==M){Ee.setValue(N,"projectionMatrix",M.projectionMatrix),Ee.setValue(N,"viewMatrix",M.matrixWorldInverse);const Ge=Ee.map.cameraPosition;Ge!==void 0&&Ge.setValue(N,vt.setFromMatrixPosition(M.matrixWorld)),At.logarithmicDepthBuffer&&Ee.setValue(N,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2)),(H.isMeshPhongMaterial||H.isMeshToonMaterial||H.isMeshLambertMaterial||H.isMeshBasicMaterial||H.isMeshStandardMaterial||H.isShaderMaterial)&&Ee.setValue(N,"isOrthographic",M.isOrthographicCamera===!0),W!==M&&(W=M,Ei=!0,Ps=!0)}if(O.isSkinnedMesh){Ee.setOptional(N,O,"bindMatrix"),Ee.setOptional(N,O,"bindMatrixInverse");const Ge=O.skeleton;Ge&&(At.floatVertexTextures?(Ge.boneTexture===null&&Ge.computeBoneTexture(),Ee.setValue(N,"boneTexture",Ge.boneTexture,J)):console.warn("THREE.WebGLRenderer: SkinnedMesh can only be used with WebGL 2. With WebGL 1 OES_texture_float and vertex textures support is required."))}O.isBatchedMesh&&(Ee.setOptional(N,O,"batchingTexture"),Ee.setValue(N,"batchingTexture",O._matricesTexture,J));const Ls=k.morphAttributes;if((Ls.position!==void 0||Ls.normal!==void 0||Ls.color!==void 0&&At.isWebGL2===!0)&&at.update(O,k,Ln),(Ei||Gt.receiveShadow!==O.receiveShadow)&&(Gt.receiveShadow=O.receiveShadow,Ee.setValue(N,"receiveShadow",O.receiveShadow)),H.isMeshGouraudMaterial&&H.envMap!==null&&(In.envMap.value=Ut,In.flipEnvMap.value=Ut.isCubeTexture&&Ut.isRenderTargetTexture===!1?-1:1),Ei&&(Ee.setValue(N,"toneMappingExposure",v.toneMappingExposure),Gt.needsLights&&ic(In,Ps),_t&&H.fog===!0&&it.refreshFogUniforms(In,_t),it.refreshMaterialUniforms(In,H,tt,V,mt),fs.upload(N,Or(Gt),In,J)),H.isShaderMaterial&&H.uniformsNeedUpdate===!0&&(fs.upload(N,Or(Gt),In,J),H.uniformsNeedUpdate=!1),H.isSpriteMaterial&&Ee.setValue(N,"center",O.center),Ee.setValue(N,"modelViewMatrix",O.modelViewMatrix),Ee.setValue(N,"normalMatrix",O.normalMatrix),Ee.setValue(N,"modelMatrix",O.matrixWorld),H.isShaderMaterial||H.isRawShaderMaterial){const Ge=H.uniformsGroups;for(let Is=0,rc=Ge.length;Is<rc;Is++)if(At.isWebGL2){const Br=Ge[Is];St.update(Br,Ln),St.bind(Br,Ln)}else console.warn("THREE.WebGLRenderer: Uniform Buffer Objects can only be used with WebGL 2.")}return Ln}function ic(M,F){M.ambientLightColor.needsUpdate=F,M.lightProbe.needsUpdate=F,M.directionalLights.needsUpdate=F,M.directionalLightShadows.needsUpdate=F,M.pointLights.needsUpdate=F,M.pointLightShadows.needsUpdate=F,M.spotLights.needsUpdate=F,M.spotLightShadows.needsUpdate=F,M.rectAreaLights.needsUpdate=F,M.hemisphereLights.needsUpdate=F}function sc(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}this.getActiveCubeFace=function(){return R},this.getActiveMipmapLevel=function(){return C},this.getRenderTarget=function(){return T},this.setRenderTargetTextures=function(M,F,k){$.get(M.texture).__webglTexture=F,$.get(M.depthTexture).__webglTexture=k;const H=$.get(M);H.__hasExternalTextures=!0,H.__autoAllocateDepthBuffer=k===void 0,H.__autoAllocateDepthBuffer||ut.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),H.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(M,F){const k=$.get(M);k.__webglFramebuffer=F,k.__useDefaultFramebuffer=F===void 0},this.setRenderTarget=function(M,F=0,k=0){T=M,R=F,C=k;let H=!0,O=null,_t=!1,Et=!1;if(M){const Ut=$.get(M);Ut.__useDefaultFramebuffer!==void 0?(U.bindFramebuffer(N.FRAMEBUFFER,null),H=!1):Ut.__webglFramebuffer===void 0?J.setupRenderTarget(M):Ut.__hasExternalTextures&&J.rebindTextures(M,$.get(M.texture).__webglTexture,$.get(M.depthTexture).__webglTexture);const Wt=M.texture;(Wt.isData3DTexture||Wt.isDataArrayTexture||Wt.isCompressedArrayTexture)&&(Et=!0);const Nt=$.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(Array.isArray(Nt[F])?O=Nt[F][k]:O=Nt[F],_t=!0):At.isWebGL2&&M.samples>0&&J.useMultisampledRTT(M)===!1?O=$.get(M).__webglMultisampledFramebuffer:Array.isArray(Nt)?O=Nt[k]:O=Nt,_.copy(M.viewport),E.copy(M.scissor),j=M.scissorTest}else _.copy(et).multiplyScalar(tt).floor(),E.copy(ot).multiplyScalar(tt).floor(),j=xt;if(U.bindFramebuffer(N.FRAMEBUFFER,O)&&At.drawBuffers&&H&&U.drawBuffers(M,O),U.viewport(_),U.scissor(E),U.setScissorTest(j),_t){const Ut=$.get(M.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_CUBE_MAP_POSITIVE_X+F,Ut.__webglTexture,k)}else if(Et){const Ut=$.get(M.texture),Wt=F||0;N.framebufferTextureLayer(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,Ut.__webglTexture,k||0,Wt)}L=-1},this.readRenderTargetPixels=function(M,F,k,H,O,_t,Et){if(!(M&&M.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let It=$.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&Et!==void 0&&(It=It[Et]),It){U.bindFramebuffer(N.FRAMEBUFFER,It);try{const Ut=M.texture,Wt=Ut.format,Nt=Ut.type;if(Wt!==Ke&&Rt.convert(Wt)!==N.getParameter(N.IMPLEMENTATION_COLOR_READ_FORMAT)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}const Ot=Nt===Ui&&(ut.has("EXT_color_buffer_half_float")||At.isWebGL2&&ut.has("EXT_color_buffer_float"));if(Nt!==Tn&&Rt.convert(Nt)!==N.getParameter(N.IMPLEMENTATION_COLOR_READ_TYPE)&&!(Nt===un&&(At.isWebGL2||ut.has("OES_texture_float")||ut.has("WEBGL_color_buffer_float")))&&!Ot){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}F>=0&&F<=M.width-H&&k>=0&&k<=M.height-O&&N.readPixels(F,k,H,O,Rt.convert(Wt),Rt.convert(Nt),_t)}finally{const Ut=T!==null?$.get(T).__webglFramebuffer:null;U.bindFramebuffer(N.FRAMEBUFFER,Ut)}}},this.copyFramebufferToTexture=function(M,F,k=0){const H=Math.pow(2,-k),O=Math.floor(F.image.width*H),_t=Math.floor(F.image.height*H);J.setTexture2D(F,0),N.copyTexSubImage2D(N.TEXTURE_2D,k,0,0,M.x,M.y,O,_t),U.unbindTexture()},this.copyTextureToTexture=function(M,F,k,H=0){const O=F.image.width,_t=F.image.height,Et=Rt.convert(k.format),It=Rt.convert(k.type);J.setTexture2D(k,0),N.pixelStorei(N.UNPACK_FLIP_Y_WEBGL,k.flipY),N.pixelStorei(N.UNPACK_PREMULTIPLY_ALPHA_WEBGL,k.premultiplyAlpha),N.pixelStorei(N.UNPACK_ALIGNMENT,k.unpackAlignment),F.isDataTexture?N.texSubImage2D(N.TEXTURE_2D,H,M.x,M.y,O,_t,Et,It,F.image.data):F.isCompressedTexture?N.compressedTexSubImage2D(N.TEXTURE_2D,H,M.x,M.y,F.mipmaps[0].width,F.mipmaps[0].height,Et,F.mipmaps[0].data):N.texSubImage2D(N.TEXTURE_2D,H,M.x,M.y,Et,It,F.image),H===0&&k.generateMipmaps&&N.generateMipmap(N.TEXTURE_2D),U.unbindTexture()},this.copyTextureToTexture3D=function(M,F,k,H,O=0){if(v.isWebGL1Renderer){console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: can only be used with WebGL2.");return}const _t=Math.round(M.max.x-M.min.x),Et=Math.round(M.max.y-M.min.y),It=M.max.z-M.min.z+1,Ut=Rt.convert(H.format),Wt=Rt.convert(H.type);let Nt;if(H.isData3DTexture)J.setTexture3D(H,0),Nt=N.TEXTURE_3D;else if(H.isDataArrayTexture||H.isCompressedArrayTexture)J.setTexture2DArray(H,0),Nt=N.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}N.pixelStorei(N.UNPACK_FLIP_Y_WEBGL,H.flipY),N.pixelStorei(N.UNPACK_PREMULTIPLY_ALPHA_WEBGL,H.premultiplyAlpha),N.pixelStorei(N.UNPACK_ALIGNMENT,H.unpackAlignment);const Ot=N.getParameter(N.UNPACK_ROW_LENGTH),fe=N.getParameter(N.UNPACK_IMAGE_HEIGHT),Oe=N.getParameter(N.UNPACK_SKIP_PIXELS),ye=N.getParameter(N.UNPACK_SKIP_ROWS),rn=N.getParameter(N.UNPACK_SKIP_IMAGES),he=k.isCompressedTexture?k.mipmaps[O]:k.image;N.pixelStorei(N.UNPACK_ROW_LENGTH,he.width),N.pixelStorei(N.UNPACK_IMAGE_HEIGHT,he.height),N.pixelStorei(N.UNPACK_SKIP_PIXELS,M.min.x),N.pixelStorei(N.UNPACK_SKIP_ROWS,M.min.y),N.pixelStorei(N.UNPACK_SKIP_IMAGES,M.min.z),k.isDataTexture||k.isData3DTexture?N.texSubImage3D(Nt,O,F.x,F.y,F.z,_t,Et,It,Ut,Wt,he.data):H.isCompressedArrayTexture?N.compressedTexSubImage3D(Nt,O,F.x,F.y,F.z,_t,Et,It,Ut,he.data):N.texSubImage3D(Nt,O,F.x,F.y,F.z,_t,Et,It,Ut,Wt,he),N.pixelStorei(N.UNPACK_ROW_LENGTH,Ot),N.pixelStorei(N.UNPACK_IMAGE_HEIGHT,fe),N.pixelStorei(N.UNPACK_SKIP_PIXELS,Oe),N.pixelStorei(N.UNPACK_SKIP_ROWS,ye),N.pixelStorei(N.UNPACK_SKIP_IMAGES,rn),O===0&&H.generateMipmaps&&N.generateMipmap(Nt),U.unbindTexture()},this.initTexture=function(M){M.isCubeTexture?J.setTextureCube(M,0):M.isData3DTexture?J.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?J.setTexture2DArray(M,0):J.setTexture2D(M,0),U.unbindTexture()},this.resetState=function(){R=0,C=0,T=null,U.reset(),wt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return fn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorSpace=t===Tr?"display-p3":"srgb",e.unpackColorSpace=Qt.workingColorSpace===Ss?"display-p3":"srgb"}get useLegacyLights(){return console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights}set useLegacyLights(t){console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights=t}}class Pp extends Ja{}Pp.prototype.isWebGL1Renderer=!0;class Lr{constructor(t,e=25e-5){this.isFogExp2=!0,this.name="",this.color=new Ct(t),this.density=e}clone(){return new Lr(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}}class mn extends pe{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new sn,this.environmentRotation=new sn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),e.object.environmentRotation=this.environmentRotation.toArray(),e}}class Ni extends Yn{constructor(t){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Ct(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}}const la=new A,ha=new A,da=new le,hr=new Cr,hs=new zi;class Ms extends pe{constructor(t=new ee,e=new Ni){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[0];for(let s=1,r=e.count;s<r;s++)la.fromBufferAttribute(e,s-1),ha.fromBufferAttribute(e,s),n[s]=n[s-1],n[s]+=la.distanceTo(ha);t.setAttribute("lineDistance",new xe(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(t,e){const n=this.geometry,s=this.matrixWorld,r=t.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),hs.copy(n.boundingSphere),hs.applyMatrix4(s),hs.radius+=r,t.ray.intersectsSphere(hs)===!1)return;da.copy(s).invert(),hr.copy(t.ray).applyMatrix4(da);const o=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=o*o,l=new A,h=new A,d=new A,p=new A,m=this.isLineSegments?2:1,g=n.index,f=n.attributes.position;if(g!==null){const u=Math.max(0,a.start),S=Math.min(g.count,a.start+a.count);for(let v=u,b=S-1;v<b;v+=m){const R=g.getX(v),C=g.getX(v+1);if(l.fromBufferAttribute(f,R),h.fromBufferAttribute(f,C),hr.distanceSqToSegment(l,h,p,d)>c)continue;p.applyMatrix4(this.matrixWorld);const L=t.ray.origin.distanceTo(p);L<t.near||L>t.far||e.push({distance:L,point:d.clone().applyMatrix4(this.matrixWorld),index:v,face:null,faceIndex:null,object:this})}}else{const u=Math.max(0,a.start),S=Math.min(f.count,a.start+a.count);for(let v=u,b=S-1;v<b;v+=m){if(l.fromBufferAttribute(f,v),h.fromBufferAttribute(f,v+1),hr.distanceSqToSegment(l,h,p,d)>c)continue;p.applyMatrix4(this.matrixWorld);const C=t.ray.origin.distanceTo(p);C<t.near||C>t.far||e.push({distance:C,point:d.clone().applyMatrix4(this.matrixWorld),index:v,face:null,faceIndex:null,object:this})}}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){const o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}class Ze extends Yn{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Ct(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}const ua=new le,br=new Cr,ds=new zi,us=new A;class en extends pe{constructor(t=new ee,e=new Ze){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){const n=this.geometry,s=this.matrixWorld,r=t.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),ds.copy(n.boundingSphere),ds.applyMatrix4(s),ds.radius+=r,t.ray.intersectsSphere(ds)===!1)return;ua.copy(s).invert(),br.copy(t.ray).applyMatrix4(ua);const o=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=o*o,l=n.index,d=n.attributes.position;if(l!==null){const p=Math.max(0,a.start),m=Math.min(l.count,a.start+a.count);for(let g=p,y=m;g<y;g++){const f=l.getX(g);us.fromBufferAttribute(d,f),fa(us,f,c,s,t,e,this)}}else{const p=Math.max(0,a.start),m=Math.min(d.count,a.start+a.count);for(let g=p,y=m;g<y;g++)us.fromBufferAttribute(d,g),fa(us,g,c,s,t,e,this)}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){const o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}function fa(i,t,e,n,s,r,a){const o=br.distanceSqToPoint(i);if(o<e){const c=new A;br.closestPointToPoint(i,c),c.applyMatrix4(n);const l=s.ray.origin.distanceTo(c);if(l<s.near||l>s.far)return;r.push({distance:l,distanceToRay:Math.sqrt(o),point:c,index:t,face:null,object:a})}}class Ts extends De{constructor(t,e,n,s,r,a,o,c,l){super(t,e,n,s,r,a,o,c,l),this.isCanvasTexture=!0,this.needsUpdate=!0}}class Ue extends ee{constructor(t=1,e=32,n=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:t,segments:e,thetaStart:n,thetaLength:s},e=Math.max(3,e);const r=[],a=[],o=[],c=[],l=new A,h=new qt;a.push(0,0,0),o.push(0,0,1),c.push(.5,.5);for(let d=0,p=3;d<=e;d++,p+=3){const m=n+d/e*s;l.x=t*Math.cos(m),l.y=t*Math.sin(m),a.push(l.x,l.y,l.z),o.push(0,0,1),h.x=(a[p]/t+1)/2,h.y=(a[p+1]/t+1)/2,c.push(h.x,h.y)}for(let d=1;d<=e;d++)r.push(d,d+1,0);this.setIndex(r),this.setAttribute("position",new xe(a,3)),this.setAttribute("normal",new xe(o,3)),this.setAttribute("uv",new xe(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ue(t.radius,t.segments,t.thetaStart,t.thetaLength)}}class Mt extends ee{constructor(t=1,e=1,n=1,s=32,r=1,a=!1,o=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:s,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:c};const l=this;s=Math.floor(s),r=Math.floor(r);const h=[],d=[],p=[],m=[];let g=0;const y=[],f=n/2;let u=0;S(),a===!1&&(t>0&&v(!0),e>0&&v(!1)),this.setIndex(h),this.setAttribute("position",new xe(d,3)),this.setAttribute("normal",new xe(p,3)),this.setAttribute("uv",new xe(m,2));function S(){const b=new A,R=new A;let C=0;const T=(e-t)/n;for(let L=0;L<=r;L++){const W=[],_=L/r,E=_*(e-t)+t;for(let j=0;j<=s;j++){const K=j/s,I=K*c+o,Y=Math.sin(I),V=Math.cos(I);R.x=E*Y,R.y=-_*n+f,R.z=E*V,d.push(R.x,R.y,R.z),b.set(Y,T,V).normalize(),p.push(b.x,b.y,b.z),m.push(K,1-_),W.push(g++)}y.push(W)}for(let L=0;L<s;L++)for(let W=0;W<r;W++){const _=y[W][L],E=y[W+1][L],j=y[W+1][L+1],K=y[W][L+1];h.push(_,E,K),h.push(E,j,K),C+=6}l.addGroup(u,C,0),u+=C}function v(b){const R=g,C=new qt,T=new A;let L=0;const W=b===!0?t:e,_=b===!0?1:-1;for(let j=1;j<=s;j++)d.push(0,f*_,0),p.push(0,_,0),m.push(.5,.5),g++;const E=g;for(let j=0;j<=s;j++){const I=j/s*c+o,Y=Math.cos(I),V=Math.sin(I);T.x=W*V,T.y=f*_,T.z=W*Y,d.push(T.x,T.y,T.z),p.push(0,_,0),C.x=Y*.5+.5,C.y=V*.5*_+.5,m.push(C.x,C.y),g++}for(let j=0;j<s;j++){const K=R+j,I=E+j;b===!0?h.push(I,I+1,K):h.push(I+1,I,K),L+=3}l.addGroup(u,L,b===!0?1:2),u+=L}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Mt(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class An extends Mt{constructor(t=1,e=1,n=32,s=1,r=!1,a=0,o=Math.PI*2){super(0,t,e,n,s,r,a,o),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:a,thetaLength:o}}static fromJSON(t){return new An(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Yt extends ee{constructor(t=1,e=32,n=16,s=0,r=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:s,phiLength:r,thetaStart:a,thetaLength:o},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));const c=Math.min(a+o,Math.PI);let l=0;const h=[],d=new A,p=new A,m=[],g=[],y=[],f=[];for(let u=0;u<=n;u++){const S=[],v=u/n;let b=0;u===0&&a===0?b=.5/e:u===n&&c===Math.PI&&(b=-.5/e);for(let R=0;R<=e;R++){const C=R/e;d.x=-t*Math.cos(s+C*r)*Math.sin(a+v*o),d.y=t*Math.cos(a+v*o),d.z=t*Math.sin(s+C*r)*Math.sin(a+v*o),g.push(d.x,d.y,d.z),p.copy(d).normalize(),y.push(p.x,p.y,p.z),f.push(C+b,1-v),S.push(l++)}h.push(S)}for(let u=0;u<n;u++)for(let S=0;S<e;S++){const v=h[u][S+1],b=h[u][S],R=h[u+1][S],C=h[u+1][S+1];(u!==0||a>0)&&m.push(v,b,C),(u!==n-1||c<Math.PI)&&m.push(b,R,C)}this.setIndex(m),this.setAttribute("position",new xe(g,3)),this.setAttribute("normal",new xe(y,3)),this.setAttribute("uv",new xe(f,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Yt(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class Fe extends ee{constructor(t=1,e=.4,n=12,s=48,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:n,tubularSegments:s,arc:r},n=Math.floor(n),s=Math.floor(s);const a=[],o=[],c=[],l=[],h=new A,d=new A,p=new A;for(let m=0;m<=n;m++)for(let g=0;g<=s;g++){const y=g/s*r,f=m/n*Math.PI*2;d.x=(t+e*Math.cos(f))*Math.cos(y),d.y=(t+e*Math.cos(f))*Math.sin(y),d.z=e*Math.sin(f),o.push(d.x,d.y,d.z),h.x=t*Math.cos(y),h.y=t*Math.sin(y),p.subVectors(d,h).normalize(),c.push(p.x,p.y,p.z),l.push(g/s),l.push(m/n)}for(let m=1;m<=n;m++)for(let g=1;g<=s;g++){const y=(s+1)*m+g-1,f=(s+1)*(m-1)+g-1,u=(s+1)*(m-1)+g,S=(s+1)*m+g;a.push(y,f,S),a.push(f,u,S)}this.setIndex(a),this.setAttribute("position",new xe(o,3)),this.setAttribute("normal",new xe(c,3)),this.setAttribute("uv",new xe(l,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Fe(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc)}}class B extends Yn{constructor(t){super(),this.isMeshPhongMaterial=!0,this.type="MeshPhongMaterial",this.color=new Ct(16777215),this.specular=new Ct(1118481),this.shininess=30,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ct(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=La,this.normalScale=new qt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new sn,this.combine=Sr,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.specular.copy(t.specular),this.shininess=t.shininess,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class ki extends pe{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new Ct(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),e}}class Ir extends ki{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(pe.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Ct(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}}const dr=new le,pa=new A,ma=new A;class Dr{constructor(t){this.camera=t,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new qt(512,512),this.map=null,this.mapPass=null,this.matrix=new le,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Rr,this._frameExtents=new qt(1,1),this._viewportCount=1,this._viewports=[new ce(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,n=this.matrix;pa.setFromMatrixPosition(t.matrixWorld),e.position.copy(pa),ma.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(ma),e.updateMatrixWorld(),dr.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(dr),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(dr)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}class Lp extends Dr{constructor(){super(new de(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1}updateMatrices(t){const e=this.camera,n=yi*2*t.angle*this.focus,s=this.mapSize.width/this.mapSize.height,r=t.distance||e.far;(n!==e.fov||s!==e.aspect||r!==e.far)&&(e.fov=n,e.aspect=s,e.far=r,e.updateProjectionMatrix()),super.updateMatrices(t)}copy(t){return super.copy(t),this.focus=t.focus,this}}class Ip extends ki{constructor(t,e,n=0,s=Math.PI/3,r=0,a=2){super(t,e),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(pe.DEFAULT_UP),this.updateMatrix(),this.target=new pe,this.distance=n,this.angle=s,this.penumbra=r,this.decay=a,this.map=null,this.shadow=new Lp}get power(){return this.intensity*Math.PI}set power(t){this.intensity=t/Math.PI}dispose(){this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.angle=t.angle,this.penumbra=t.penumbra,this.decay=t.decay,this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}const ga=new le,Li=new A,ur=new A;class Dp extends Dr{constructor(){super(new de(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new qt(4,2),this._viewportCount=6,this._viewports=[new ce(2,1,1,1),new ce(0,1,1,1),new ce(3,1,1,1),new ce(1,1,1,1),new ce(3,0,1,1),new ce(1,0,1,1)],this._cubeDirections=[new A(1,0,0),new A(-1,0,0),new A(0,0,1),new A(0,0,-1),new A(0,1,0),new A(0,-1,0)],this._cubeUps=[new A(0,1,0),new A(0,1,0),new A(0,1,0),new A(0,1,0),new A(0,0,1),new A(0,0,-1)]}updateMatrices(t,e=0){const n=this.camera,s=this.matrix,r=t.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),Li.setFromMatrixPosition(t.matrixWorld),n.position.copy(Li),ur.copy(n.position),ur.add(this._cubeDirections[e]),n.up.copy(this._cubeUps[e]),n.lookAt(ur),n.updateMatrixWorld(),s.makeTranslation(-Li.x,-Li.y,-Li.z),ga.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(ga)}}class We extends ki{constructor(t,e,n=0,s=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new Dp}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}}class Up extends Dr{constructor(){super(new Xa(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class As extends ki{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(pe.DEFAULT_UP),this.updateMatrix(),this.target=new pe,this.shadow=new Up}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}class Pn extends ki{constructor(t,e){super(t,e),this.isAmbientLight=!0,this.type="AmbientLight"}}class Np{constructor(t=!0){this.autoStart=t,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=xa(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let t=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const e=xa();t=(e-this.oldTime)/1e3,this.oldTime=e,this.elapsedTime+=t}return t}}function xa(){return(typeof performance>"u"?Date:performance).now()}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:wr}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=wr);class Fp{constructor(t){this.canvas=t,this.renderer=new Ja({canvas:t,antialias:!0,alpha:!1,powerPreference:"high-performance"}),this.renderer.setSize(window.innerWidth,window.innerHeight),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2)),this.renderer.shadowMap.enabled=!0,this.renderer.shadowMap.type=Ma,this.renderer.toneMapping=ba,this.renderer.toneMappingExposure=1,this.renderer.outputColorSpace=Ye,window.addEventListener("resize",()=>this.onResize())}onResize(){this.renderer.setSize(window.innerWidth,window.innerHeight)}}class Op{constructor(){this.ctx=null,this.sounds={},this.musicGain=null,this.sfxGain=null,this.masterGain=null,this.initialized=!1}init(){this.initialized||(this.ctx=new(window.AudioContext||window.webkitAudioContext),this.masterGain=this.ctx.createGain(),this.masterGain.connect(this.ctx.destination),this.musicGain=this.ctx.createGain(),this.musicGain.gain.value=.3,this.musicGain.connect(this.masterGain),this.sfxGain=this.ctx.createGain(),this.sfxGain.gain.value=.5,this.sfxGain.connect(this.masterGain),this.initialized=!0)}ensureInit(){this.initialized||this.init()}playTone(t,e,n="sine",s=.3,r=null){this.ensureInit();const a=this.ctx.createOscillator(),o=this.ctx.createGain();return a.type=n,a.frequency.value=t,o.gain.setValueAtTime(s,this.ctx.currentTime),o.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+e),a.connect(o),o.connect(r||this.sfxGain),a.start(),a.stop(this.ctx.currentTime+e),a}playBeep(){this.playTone(880,.15,"sine",.2)}playConfirm(){this.playTone(523,.1,"sine",.2),setTimeout(()=>this.playTone(659,.1,"sine",.2),100),setTimeout(()=>this.playTone(784,.15,"sine",.2),200)}playAlert(){this.playTone(440,.3,"square",.15),setTimeout(()=>this.playTone(440,.3,"square",.15),400)}playCountdown(){this.playTone(600,.2,"sine",.3)}playLaunchRumble(t=5){this.ensureInit();const e=this.ctx.sampleRate*t,n=this.ctx.createBuffer(1,e,this.ctx.sampleRate),s=n.getChannelData(0);for(let c=0;c<e;c++)s[c]=(Math.random()*2-1)*.5;const r=this.ctx.createBufferSource();r.buffer=n;const a=this.ctx.createBiquadFilter();a.type="lowpass",a.frequency.value=150;const o=this.ctx.createGain();return o.gain.setValueAtTime(0,this.ctx.currentTime),o.gain.linearRampToValueAtTime(.6,this.ctx.currentTime+1),o.gain.linearRampToValueAtTime(.4,this.ctx.currentTime+t-1),o.gain.linearRampToValueAtTime(0,this.ctx.currentTime+t),r.connect(a),a.connect(o),o.connect(this.sfxGain),r.start(),{source:r,gain:o,filter:a}}playEngineHum(){this.ensureInit();const t=this.ctx.createOscillator();t.type="sawtooth",t.frequency.value=60;const e=this.ctx.createGain();e.gain.value=.08;const n=this.ctx.createBiquadFilter();return n.type="lowpass",n.frequency.value=200,t.connect(n),n.connect(e),e.connect(this.sfxGain),t.start(),{osc:t,gain:e}}playDockingBeep(){this.playTone(1200,.05,"sine",.15)}playSuccess(){[523,659,784,1047].forEach((e,n)=>{setTimeout(()=>this.playTone(e,.3,"sine",.2),n*150)})}playWarning(){this.ensureInit();const t=this.ctx.createOscillator();t.type="square",t.frequency.value=800;const e=this.ctx.createGain();e.gain.value=.15;const n=this.ctx.createOscillator();n.frequency.value=4;const s=this.ctx.createGain();s.gain.value=.15,n.connect(s),s.connect(e.gain),t.connect(e),e.connect(this.sfxGain),t.start(),n.start(),setTimeout(()=>{t.stop(),n.stop()},2e3)}playReEntryRumble(t=10){this.ensureInit();const e=this.ctx.sampleRate*t,n=this.ctx.createBuffer(2,e,this.ctx.sampleRate);for(let o=0;o<2;o++){const c=n.getChannelData(o);for(let l=0;l<e;l++){const h=l/this.ctx.sampleRate;c[l]=(Math.random()*2-1)*(.3+.4*Math.sin(h*.5))}}const s=this.ctx.createBufferSource();s.buffer=n;const r=this.ctx.createBiquadFilter();r.type="lowpass",r.frequency.value=300;const a=this.ctx.createGain();return a.gain.setValueAtTime(.1,this.ctx.currentTime),a.gain.linearRampToValueAtTime(.7,this.ctx.currentTime+3),a.gain.linearRampToValueAtTime(.3,this.ctx.currentTime+t-2),a.gain.linearRampToValueAtTime(0,this.ctx.currentTime+t),s.connect(r),r.connect(a),a.connect(this.sfxGain),s.start(),{source:s,gain:a}}playSpaceAmbience(){this.ensureInit();const t=this.ctx.createOscillator();t.type="sine",t.frequency.value=40;const e=this.ctx.createOscillator();e.type="sine",e.frequency.value=55;const n=this.ctx.createGain();return n.gain.value=.04,t.connect(n),e.connect(n),n.connect(this.musicGain),t.start(),e.start(),{osc1:t,osc2:e,gain:n}}playRadioStatic(t=1){this.ensureInit();const e=this.ctx.sampleRate*t,n=this.ctx.createBuffer(1,e,this.ctx.sampleRate),s=n.getChannelData(0);for(let c=0;c<e;c++)s[c]=(Math.random()*2-1)*.1;const r=this.ctx.createBufferSource();r.buffer=n;const a=this.ctx.createBiquadFilter();a.type="bandpass",a.frequency.value=2e3,a.Q.value=5;const o=this.ctx.createGain();o.gain.setValueAtTime(.1,this.ctx.currentTime),o.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+t),r.connect(a),a.connect(o),o.connect(this.sfxGain),r.start()}setMusicVolume(t){this.ensureInit(),this.musicGain.gain.value=t}setSFXVolume(t){this.ensureInit(),this.sfxGain.gain.value=t}setMasterVolume(t){this.ensureInit(),this.masterGain.gain.value=t}}class zp{constructor(){this.keys={},this.mouseX=0,this.mouseY=0,this.mouseDX=0,this.mouseDY=0,this.mouseDown=!1,this.pointerLocked=!1,this.callbacks={},window.addEventListener("keydown",t=>{this.keys[t.code]=!0,this.emit("keydown",t.code)}),window.addEventListener("keyup",t=>{this.keys[t.code]=!1,this.emit("keyup",t.code)}),window.addEventListener("mousemove",t=>{this.mouseDX+=t.movementX||0,this.mouseDY+=t.movementY||0,this.mouseX=t.clientX,this.mouseY=t.clientY}),window.addEventListener("mousedown",()=>{this.mouseDown=!0}),window.addEventListener("mouseup",()=>{this.mouseDown=!1}),document.addEventListener("pointerlockchange",()=>{this.pointerLocked=!!document.pointerLockElement})}isKey(t){return!!this.keys[t]}isForward(){return this.keys.KeyW||this.keys.ArrowUp}isBackward(){return this.keys.KeyS||this.keys.ArrowDown}isLeft(){return this.keys.KeyA||this.keys.ArrowLeft}isRight(){return this.keys.KeyD||this.keys.ArrowRight}isUp(){return this.keys.KeyQ||this.keys.Space}isDown(){return this.keys.KeyE||this.keys.ShiftLeft}requestPointerLock(t){t.requestPointerLock()}resetMouseDelta(){this.mouseDX=0,this.mouseDY=0}on(t,e){this.callbacks[t]||(this.callbacks[t]=[]),this.callbacks[t].push(e)}off(t,e){this.callbacks[t]&&(this.callbacks[t]=this.callbacks[t].filter(n=>n!==e))}emit(t,e){this.callbacks[t]&&this.callbacks[t].forEach(n=>n(e))}}class kp{constructor(){this.overlay=document.getElementById("ui-overlay"),this.activeElements={},this.chatMessages=[],this.chatOpen=!1,this.chatVisible=!1,this._chatResponseTimer=null,this._chatResponses={"حالة المحطة":{sender:"HOUSTON — مركز التحكم",msg:"جميع أنظمة المحطة تعمل بشكل طبيعي. الضغط 14.7 PSI. درجة الحرارة 22°C. المدار مستقر على ارتفاع 408 كم. لا توجد تنبيهات نشطة."},"تقرير الوقود":{sender:"HOUSTON — مركز التحكم",msg:"مستوى الوقود في المركبة: 78%. وقود المناورة: 92%. الاحتياطي كافٍ لـ 3 مناورات تصحيحية. استهلاك الوقود ضمن المعدل الطبيعي."},"حالة الطاقم":{sender:"FLIGHT SURGEON — د. سميث",msg:"العلامات الحيوية لجميع أفراد الطاقم طبيعية. معدل ضربات القلب: 72/دقيقة. ضغط الدم: 120/80. مستوى الأكسجين في الدم: 98%. لا توجد أعراض دوار الفضاء. جلسة التمارين القادمة في ساعتين."},"تحديث الطقس":{sender:"HOUSTON — مركز التحكم",msg:"طقس منطقة الهبوط الأساسية (المحيط الهادئ): رياح خفيفة 12 عقدة. ارتفاع الموج: 1.2 متر. الرؤية: ممتازة. الظروف مثالية للهبوط. المنطقة البديلة جاهزة أيضاً."},"جدول المهام":{sender:"HOUSTON — مركز التحكم",msg:`المهام المتبقية اليوم:
• 14:00 — تجربة نمو البلورات في المختبر
• 16:00 — صيانة نظام التبريد الخارجي
• 18:00 — اتصال مرئي مع المدارس
• 19:30 — تمارين رياضية (ساعتان)
استراحة الغداء في 30 دقيقة.`},"طلب إمدادات":{sender:"HOUSTON — مركز التحكم",msg:"تم تسجيل طلبك في نظام اللوجستيات. مركبة الشحن SpaceX Dragon CRS-29 القادمة ستحمل الإمدادات المطلوبة. موعد الإطلاق: 12 يوماً. الوصول المتوقع: 14 يوماً. الحمولة: 2,500 كغ معدات وطعام."},"تقرير المدار":{sender:"HOUSTON — مركز التحكم",msg:"المدار الحالي: 408 × 410 كم. الميل المداري: 51.6°. السرعة المدارية: 7.66 كم/ث (27,576 كم/ساعة). الدورة الكاملة: 92 دقيقة. شروق الشمس القادم خلال 23 دقيقة. عدد الدورات اليوم: 16."},"حالة الاتصالات":{sender:"HOUSTON — مركز التحكم",msg:`جميع قنوات الاتصال تعمل بكفاءة:
• إشارة TDRS: قوية (99.2%)
• S-Band: نشط
• Ku-Band: نشط
• الاتصال مع هيوستن: مستقر
• القمر الصناعي التالي خلال 8 دقائق.`},"تقرير طبي":{sender:"FLIGHT SURGEON — د. سميث",msg:`التقرير الطبي اليومي:
• الإشعاع المتراكم: 0.8 mSv (ضمن الحد الآمن)
• كثافة العظام: مستقرة
• حجم السوائل: طبيعي
• النوم: 7.5 ساعات
• التوصية: الاستمرار في جدول التمارين اليومي.`},"حالة الطوارئ":{sender:"HOUSTON — مركز التحكم",msg:`⚠️ لا توجد حالات طوارئ نشطة حالياً.
آخر تدريب طوارئ: قبل 48 ساعة.
إجراءات الإخلاء: مراجعة مكتملة.
مركبة سويوز الإنقاذ: جاهزة في أي وقت.
مسار الإخلاء السريع: 3 دقائق و 20 ثانية.`},"تحديث علمي":{sender:"MARSHALL — مركز الأبحاث",msg:`نتائج التجارب الأخيرة:
• نمو البلورات: تقدم بنسبة 73%
• تجربة الجاذبية الصغرى: بيانات ممتازة
• مراقبة النباتات: نمو 2.3 سم خلال 24 ساعة
• تحليل العينات: جارٍ الإرسال للأرض عبر القمر الصناعي.`}},this._quickMessages=["حالة المحطة","تقرير الوقود","حالة الطاقم","تحديث الطقس","جدول المهام","طلب إمدادات","تقرير المدار","حالة الاتصالات","تقرير طبي","حالة الطوارئ","تحديث علمي"]}clear(){this.overlay.innerHTML="",this.activeElements={}}addElement(t,e,n={}){const s=document.createElement("div");return s.id=t,s.innerHTML=e,Object.assign(s.style,n),this.overlay.appendChild(s),this.activeElements[t]=s,s}removeElement(t){const e=this.activeElements[t];e&&(e.remove(),delete this.activeElements[t])}updateElement(t,e){const n=this.activeElements[t];n&&(n.innerHTML=e)}showHUD(t){const e=`
      <div style="position:fixed;top:0;left:0;right:0;padding:8px 12px;
        display:flex;justify-content:space-between;align-items:flex-start;pointer-events:none;z-index:20;direction:rtl;">
        
        <!-- Left instruments -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-start;">
          ${t.fuel!==void 0?this.createGauge("الوقود",t.fuel,"#00ff88","FUEL"):""}
          ${t.oxygen!==void 0?this.createGauge("O₂",t.oxygen,"#00bbff","O2"):""}
          ${t.energy!==void 0?this.createGauge("الطاقة",t.energy,"#ff9500","PWR"):""}
          ${t.health!==void 0?this.createGauge("الصحة",t.health,"#ff3355","VIT"):""}
        </div>

        <!-- Right telemetry -->
        <div style="background:rgba(0,0,0,0.85);border:1px solid rgba(255,149,0,0.3);
          border-radius:2px;padding:8px 12px;font-family:'Share Tech Mono','Orbitron',monospace;min-width:155px;">
          <div style="color:rgba(255,149,0,0.5);font-size:0.55rem;letter-spacing:2px;margin-bottom:4px;
            border-bottom:1px solid rgba(255,149,0,0.15);padding-bottom:3px;">TELEMETRY</div>
          ${t.speed!==void 0?`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 0;">
              <span style="color:rgba(255,149,0,0.6);font-size:0.6rem;">SPD</span>
              <span style="color:#00ff88;font-size:0.8rem;font-weight:700;">${t.speed} <span style="color:rgba(255,149,0,0.3);font-size:0.5rem;">كم/ث</span></span>
            </div>`:""}
          ${t.altitude!==void 0?`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 0;">
              <span style="color:rgba(255,149,0,0.6);font-size:0.6rem;">ALT</span>
              <span style="color:#00ff88;font-size:0.8rem;font-weight:700;">${t.altitude} <span style="color:rgba(255,149,0,0.3);font-size:0.5rem;">كم</span></span>
            </div>`:""}
          ${t.distance!==void 0?`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 0;">
              <span style="color:rgba(255,149,0,0.6);font-size:0.6rem;">DST</span>
              <span style="color:#00ff88;font-size:0.8rem;font-weight:700;">${t.distance} <span style="color:rgba(255,149,0,0.3);font-size:0.5rem;">كم</span></span>
            </div>`:""}
          ${t.gForce!==void 0?`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 0;">
              <span style="color:rgba(255,149,0,0.6);font-size:0.6rem;">G-FORCE</span>
              <span style="color:${t.gForce>4?"#ff3344":t.gForce>3?"#ffb800":"#00ff88"};font-size:0.8rem;font-weight:700;">${t.gForce}</span>
            </div>`:""}
          ${t.heat!==void 0?`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 0;">
              <span style="color:rgba(255,100,0,0.7);font-size:0.6rem;">TEMP</span>
              <span style="color:${t.heat>1e3?"#ff2200":t.heat>500?"#ff8800":"#ffb800"};font-size:0.8rem;font-weight:700;">${t.heat}°C</span>
            </div>`:""}
        </div>
      </div>
    `;this.removeElement("hud"),this.addElement("hud",e)}createGauge(t,e,n,s=""){const r=Math.max(0,Math.min(100,e)),a=r<25,o=r<10,c=o?"#ff2222":a?"#ffb800":n;return`
      <div style="background:rgba(0,0,0,0.85);border:1px solid ${o?"rgba(255,30,30,0.5)":"rgba(255,149,0,0.2)"};
        border-radius:2px;padding:6px 10px;min-width:105px;
        ${o?"animation:criticalPulse 1s infinite;":""}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
          <span style="color:rgba(255,149,0,0.5);font-size:0.55rem;font-family:'Share Tech Mono',monospace;letter-spacing:1px;">
            ${s}
          </span>
          <span style="color:${c};font-size:0.75rem;font-family:'Share Tech Mono',monospace;font-weight:700;">
            ${Math.round(r)}%
          </span>
        </div>
        <div style="background:rgba(255,255,255,0.05);height:3px;border-radius:1px;overflow:hidden;">
          <div style="width:${r}%;height:100%;background:${c};
            border-radius:1px;transition:width 0.4s ease;
            box-shadow:0 0 6px ${c}66;"></div>
        </div>
        <div style="color:rgba(255,149,0,0.35);font-size:0.5rem;font-family:'Tajawal',sans-serif;margin-top:2px;text-align:right;">
          ${t}
        </div>
      </div>
    `}showMessage(t,e=3e3,n="info"){const s={info:{bg:"rgba(255,149,0,0.08)",border:"rgba(255,149,0,0.3)",text:"#ffb800",icon:"▸"},warning:{bg:"rgba(255,180,0,0.08)",border:"rgba(255,180,0,0.4)",text:"#ffdd00",icon:"⚠"},danger:{bg:"rgba(255,30,30,0.08)",border:"rgba(255,50,50,0.4)",text:"#ff4444",icon:"✖"},success:{bg:"rgba(0,255,100,0.06)",border:"rgba(0,255,100,0.3)",text:"#00ff88",icon:"✓"}},r=s[n]||s.info,a=this.addElement("msg-"+Date.now(),`
      <div style="position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
        background:${r.bg};border:1px solid ${r.border};
        padding:10px 24px;border-radius:2px;color:${r.text};font-size:0.85rem;
        text-align:center;max-width:520px;font-family:'Tajawal',sans-serif;
        animation:msgSlideUp 0.3s ease;
        box-shadow:0 0 20px rgba(0,0,0,0.4), inset 0 0 30px rgba(0,0,0,0.2);">
        <span style="font-family:'Share Tech Mono',monospace;margin-left:8px;font-size:0.7rem;">${r.icon}</span>
        ${t}
      </div>
    `);return e>0&&setTimeout(()=>{a.remove(),delete this.activeElements[a.id]},e),a}showObjective(t){this.removeElement("objective"),this.addElement("objective",`
      <div style="position:fixed;top:50px;left:50%;transform:translateX(-50%);
        background:rgba(0,0,0,0.8);border:1px solid rgba(255,149,0,0.25);
        border-left:3px solid #ff9500;
        padding:6px 20px;border-radius:2px;color:rgba(255,200,100,0.9);font-size:0.78rem;
        text-align:center;font-family:'Tajawal',sans-serif;font-weight:500;
        box-shadow:0 2px 15px rgba(0,0,0,0.3);">
        <span style="color:#ff9500;font-family:'Share Tech Mono',monospace;font-size:0.6rem;margin-left:8px;">OBJ</span>
        ${t}
      </div>
    `)}showComm(t,e,n=5e3){this.removeElement("comm"),this.addElement("comm",`
      <div style="position:fixed;bottom:14px;right:14px;
        background:rgba(0,0,0,0.9);border:1px solid rgba(255,149,0,0.2);
        border-top:2px solid #ff9500;
        padding:12px 16px;border-radius:2px;max-width:340px;
        direction:rtl;animation:commSlideIn 0.4s ease;
        box-shadow:0 4px 25px rgba(0,0,0,0.5);">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
          <span style="color:#00ff88;font-size:0.4rem;">●</span>
          <span style="color:#ff9500;font-size:0.6rem;font-family:'Share Tech Mono',monospace;letter-spacing:1px;">
            ${t}
          </span>
        </div>
        <div style="color:rgba(200,210,220,0.85);font-size:0.82rem;line-height:1.6;
          font-family:'Tajawal',sans-serif;white-space:pre-line;">${e}</div>
        <div style="margin-top:6px;text-align:left;">
          <span style="color:rgba(255,149,0,0.25);font-size:0.5rem;font-family:'Share Tech Mono',monospace;">
            SECURE CHANNEL — ENCRYPTED
          </span>
        </div>
      </div>
    `),n>0&&setTimeout(()=>this.removeElement("comm"),n)}showCenterText(t,e="",n=3e3){this.removeElement("center-text"),this.addElement("center-text",`
      <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;
        animation:centerZoomIn 0.6s ease;">
        <div style="font-family:'Orbitron',sans-serif;font-size:2.6rem;color:#ff9500;
          text-shadow:0 0 40px rgba(255,149,0,0.4), 0 0 80px rgba(255,149,0,0.15);
          margin-bottom:8px;font-weight:700;letter-spacing:3px;">${t}</div>
        ${e?`<div style="color:rgba(200,210,220,0.6);font-size:0.9rem;
          font-family:'Tajawal',sans-serif;font-weight:300;letter-spacing:1px;">${e}</div>`:""}
      </div>
    `),n>0&&setTimeout(()=>this.removeElement("center-text"),n)}showControls(t){this.removeElement("controls");const e=t.map(n=>`<div style="display:flex;align-items:center;gap:6px;margin:2px 0;">
        <span style="background:rgba(255,149,0,0.1);border:1px solid rgba(255,149,0,0.25);
          padding:2px 7px;border-radius:2px;font-family:'Share Tech Mono',monospace;font-size:0.6rem;
          color:#ff9500;min-width:36px;text-align:center;">${n.key}</span>
        <span style="color:rgba(200,210,220,0.6);font-size:0.7rem;font-family:'Tajawal',sans-serif;">${n.action}</span>
      </div>`).join("");this.addElement("controls",`
      <div style="position:fixed;bottom:14px;left:14px;
        background:rgba(0,0,0,0.85);border:1px solid rgba(255,149,0,0.15);
        padding:8px 12px;border-radius:2px;direction:rtl;
        box-shadow:0 2px 12px rgba(0,0,0,0.3);">
        <div style="color:rgba(255,149,0,0.4);font-size:0.5rem;margin-bottom:3px;
          font-family:'Share Tech Mono',monospace;letter-spacing:2px;">CONTROLS</div>
        ${e}
      </div>
    `)}showChatButton(){this.chatVisible=!0,this.removeElement("chat-btn"),this.addElement("chat-btn",`
      <div style="position:fixed;bottom:60px;left:14px;pointer-events:auto;z-index:30;">
        <button id="toggle-chat-btn" style="
          background:rgba(0,0,0,0.9);border:1px solid rgba(255,149,0,0.3);
          color:#ff9500;padding:8px 14px;border-radius:2px;
          font-family:'Share Tech Mono',monospace;font-size:0.75rem;
          cursor:pointer;display:flex;align-items:center;gap:6px;
          box-shadow:0 2px 15px rgba(0,0,0,0.4);transition:all 0.3s;
          letter-spacing:1px;">
          <span style="color:#00ff88;font-size:0.45rem;">●</span>
          <span>HOUSTON COMM</span>
          ${this.chatMessages.length>0?`<span style="background:rgba(255,149,0,0.15);color:#ff9500;
            border:1px solid rgba(255,149,0,0.3);border-radius:2px;width:18px;height:18px;
            display:flex;align-items:center;justify-content:center;font-size:0.55rem;font-weight:700;">
            ${this.chatMessages.length}</span>`:""}
        </button>
      </div>
    `),setTimeout(()=>{var t;(t=document.getElementById("toggle-chat-btn"))==null||t.addEventListener("click",()=>{this.chatOpen?this.hideChat():this.showChat()})},50)}showChat(){this.chatOpen=!0,this.removeElement("chat-panel");const t=this.chatMessages.map(n=>`
      <div style="margin-bottom:8px;display:flex;flex-direction:column;align-items:${n.fromPlayer?"flex-end":"flex-start"};">
        <div style="font-size:0.55rem;color:${n.fromPlayer?"#00ff88":"#ff9500"};margin-bottom:2px;
          font-family:'Share Tech Mono',monospace;letter-spacing:1px;">
          ${n.fromPlayer?"CREW":n.sender}
          <span style="color:rgba(255,149,0,0.25);margin-right:5px;">${n.time}</span>
        </div>
        <div style="background:${n.fromPlayer?"rgba(0,255,100,0.05)":"rgba(255,149,0,0.05)"};
          border:1px solid ${n.fromPlayer?"rgba(0,255,100,0.15)":"rgba(255,149,0,0.15)"};
          ${n.fromPlayer?"border-right:2px solid rgba(0,255,100,0.3)":"border-left:2px solid rgba(255,149,0,0.3)"};
          padding:7px 11px;border-radius:2px;max-width:270px;
          color:rgba(200,210,220,0.85);font-size:0.78rem;line-height:1.5;
          font-family:'Tajawal',sans-serif;white-space:pre-line;">
          ${n.text}
        </div>
      </div>
    `).join(""),e=this._quickMessages.map(n=>`
      <button class="chat-quick-btn" data-msg="${n}" style="
        background:rgba(255,149,0,0.05);border:1px solid rgba(255,149,0,0.15);
        color:rgba(255,200,100,0.6);padding:3px 9px;border-radius:2px;font-size:0.65rem;
        cursor:pointer;font-family:'Tajawal',sans-serif;transition:all 0.2s;
        white-space:nowrap;">
        ${n}
      </button>
    `).join("");this.addElement("chat-panel",`
      <div style="position:fixed;bottom:100px;left:14px;width:360px;max-height:460px;
        background:rgba(0,0,0,0.95);border:1px solid rgba(255,149,0,0.2);
        border-top:2px solid #ff9500;
        border-radius:2px;direction:rtl;
        display:flex;flex-direction:column;z-index:31;pointer-events:auto;
        box-shadow:0 8px 40px rgba(0,0,0,0.6);">
        
        <div style="padding:10px 14px;border-bottom:1px solid rgba(255,149,0,0.1);
          display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="color:#00ff88;font-size:0.4rem;">●</span>
            <span style="color:#ff9500;font-size:0.7rem;font-family:'Share Tech Mono',monospace;
              font-weight:700;letter-spacing:2px;">HOUSTON UPLINK</span>
          </div>
          <button id="close-chat-btn" style="background:none;border:none;color:rgba(255,149,0,0.3);
            cursor:pointer;font-size:1rem;transition:color 0.2s;font-family:'Share Tech Mono',monospace;">✕</button>
        </div>

        <div id="chat-messages" style="flex:1;overflow-y:auto;padding:10px 14px;max-height:250px;
          scrollbar-width:thin;scrollbar-color:rgba(255,149,0,0.15) transparent;">
          ${t||`
            <div style="text-align:center;color:rgba(255,149,0,0.3);font-size:0.75rem;padding:20px 8px;
              font-family:'Share Tech Mono',monospace;">
              <div style="font-size:0.6rem;letter-spacing:2px;margin-bottom:8px;">COMM CHANNEL OPEN</div>
              <div style="font-family:'Tajawal',sans-serif;color:rgba(200,210,220,0.4);">اتصال مباشر مع مركز التحكم</div>
              <div style="font-size:0.6rem;margin-top:4px;color:rgba(255,149,0,0.2);">اختر رسالة سريعة أو اكتب رسالتك</div>
            </div>
          `}
        </div>

        <div style="padding:6px 10px;border-top:1px solid rgba(255,149,0,0.06);
          display:flex;flex-wrap:wrap;gap:3px;max-height:80px;overflow-y:auto;">
          ${e}
        </div>

        <div style="padding:8px 10px;border-top:1px solid rgba(255,149,0,0.1);
          display:flex;gap:6px;align-items:center;">
          <input id="chat-input" type="text" placeholder="اكتب رسالة..." style="
            flex:1;background:rgba(255,149,0,0.03);border:1px solid rgba(255,149,0,0.15);
            color:rgba(200,210,220,0.9);padding:7px 12px;border-radius:2px;
            font-family:'Tajawal',sans-serif;font-size:0.78rem;outline:none;direction:rtl;">
          <button id="chat-send-btn" style="
            background:rgba(255,149,0,0.15);border:1px solid rgba(255,149,0,0.3);
            color:#ff9500;width:32px;height:32px;border-radius:2px;cursor:pointer;
            display:flex;align-items:center;justify-content:center;font-size:0.85rem;
            font-family:'Share Tech Mono',monospace;transition:all 0.2s;">
            ↑
          </button>
        </div>
      </div>
    `),setTimeout(()=>{var a;(a=document.getElementById("close-chat-btn"))==null||a.addEventListener("click",()=>this.hideChat()),document.querySelectorAll(".chat-quick-btn").forEach(o=>{o.addEventListener("click",()=>{const c=o.getAttribute("data-msg");this._sendChatMessage(c)}),o.addEventListener("mouseenter",()=>{o.style.background="rgba(255,149,0,0.12)",o.style.borderColor="rgba(255,149,0,0.3)",o.style.color="#ff9500"}),o.addEventListener("mouseleave",()=>{o.style.background="rgba(255,149,0,0.05)",o.style.borderColor="rgba(255,149,0,0.15)",o.style.color="rgba(255,200,100,0.6)"})});const n=document.getElementById("chat-input"),s=document.getElementById("chat-send-btn");s==null||s.addEventListener("click",()=>{n&&n.value.trim()&&(this._sendChatMessage(n.value.trim()),n.value="")}),n==null||n.addEventListener("keydown",o=>{o.stopPropagation(),o.key==="Enter"&&n.value.trim()&&(this._sendChatMessage(n.value.trim()),n.value="")}),n==null||n.addEventListener("keyup",o=>o.stopPropagation()),n==null||n.addEventListener("keypress",o=>o.stopPropagation());const r=document.getElementById("chat-messages");r&&(r.scrollTop=r.scrollHeight)},50)}hideChat(){this.chatOpen=!1,this.removeElement("chat-panel")}_sendChatMessage(t){const e=new Date,n=`${e.getHours().toString().padStart(2,"0")}:${e.getMinutes().toString().padStart(2,"0")}`;this.chatMessages.push({text:t,sender:"أنت",fromPlayer:!0,time:n}),this.chatOpen&&this.showChat(),this._chatResponseTimer&&clearTimeout(this._chatResponseTimer),this._chatResponseTimer=setTimeout(()=>{this._generateResponse(t,n)},1200+Math.random()*1500)}_generateResponse(t,e){const n=new Date,s=`${n.getHours().toString().padStart(2,"0")}:${n.getMinutes().toString().padStart(2,"0")}`;let r=null;for(const a of Object.keys(this._chatResponses))if(t.includes(a)||a.includes(t)){r=this._chatResponses[a];break}if(!r){const a=[{sender:"HOUSTON — مركز التحكم",msg:`استلمنا رسالتك: "${t}". الفريق يعمل على الرد. جميع الأنظمة تعمل بشكل طبيعي. هل تحتاج مساعدة في شيء محدد؟`},{sender:"HOUSTON — مركز التحكم",msg:"شكراً على التحديث. نحن نتابع جميع البيانات من المحطة. لا توجد مشاكل مسجلة حالياً. استمر في عملك الممتاز يا رائد الفضاء!"},{sender:"CAPCOM — هيوستن",msg:"تلقينا رسالتك. فريق المهمة على اطلاع. تذكر أن تأخذ استراحة قريباً. صحتك أولوية. هيوستن تراقب جميع المؤشرات."},{sender:"HOUSTON — مركز التحكم",msg:"مفهوم. نؤكد استلام رسالتك. جميع المعلمات ضمن النطاق الطبيعي. المسار المداري مستقر. القمر الصناعي التالي للاتصال خلال 12 دقيقة."}];r=a[Math.floor(Math.random()*a.length)]}this.chatMessages.push({text:r.msg,sender:r.sender,fromPlayer:!1,time:s}),this.chatOpen&&this.showChat(),this.showChatButton()}showGameEnding(t={}){this.clear(),this.addGlobalStyles();const e=t.missionTime||"4 ساعات و 23 دقيقة",n=t.maxAltitude||"408 كم",s=t.maxSpeed||"27,576 كم/ساعة",r=t.maxGForce||"4.2G",a=t.maxHeat||"1,600°C";t.experiments;const o=t.evaTime||"45 دقيقة";this.addElement("game-ending",`
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;
        background:rgba(0,0,0,0.97);
        display:flex;align-items:center;justify-content:center;direction:rtl;z-index:50;
        animation:fadeIn 1.5s ease;">
        
        <div style="max-width:600px;width:92%;max-height:88vh;overflow-y:auto;padding:20px;">
          
          <!-- Title -->
          <div style="text-align:center;margin-bottom:24px;animation:slideDown 1s ease;">
            <div style="font-family:'Orbitron',sans-serif;font-size:0.7rem;color:rgba(255,149,0,0.4);
              letter-spacing:4px;margin-bottom:8px;">MISSION STATUS</div>
            <div style="font-family:'Orbitron',sans-serif;font-size:1.8rem;color:#ff9500;
              text-shadow:0 0 30px rgba(255,149,0,0.3);margin-bottom:4px;font-weight:700;letter-spacing:2px;">
              المهمة مكتملة بنجاح
            </div>
            <div style="width:120px;height:2px;background:linear-gradient(90deg,transparent,#ff9500,transparent);
              margin:0 auto 6px;"></div>
            <div style="color:#00ff88;font-size:0.7rem;font-family:'Share Tech Mono',monospace;
              letter-spacing:2px;">MISSION COMPLETE — ALL OBJECTIVES MET</div>
          </div>

          <!-- Stats -->
          <div style="background:rgba(255,149,0,0.03);border:1px solid rgba(255,149,0,0.15);
            border-radius:2px;padding:18px;margin-bottom:14px;">
            <div style="color:rgba(255,149,0,0.5);font-size:0.6rem;font-family:'Share Tech Mono',monospace;
              margin-bottom:12px;text-align:center;letter-spacing:3px;">MISSION DATA</div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
              ${[{label:"مدة المهمة",value:e,tag:"TIME"},{label:"أقصى ارتفاع",value:n,tag:"ALT"},{label:"أقصى سرعة",value:s,tag:"VEL"},{label:"أقصى قوة G",value:r,tag:"G-MAX"},{label:"حرارة الدرع",value:a,tag:"TEMP"},{label:"وقت EVA",value:o,tag:"EVA"}].map(c=>`
                <div style="background:rgba(0,0,0,0.5);padding:10px;border-radius:2px;text-align:center;
                  border:1px solid rgba(255,149,0,0.08);">
                  <div style="color:rgba(255,149,0,0.4);font-size:0.5rem;font-family:'Share Tech Mono',monospace;
                    letter-spacing:1px;margin-bottom:4px;">${c.tag}</div>
                  <div style="color:#ff9500;font-size:0.8rem;margin-top:2px;font-weight:600;
                    font-family:'Tajawal',sans-serif;">${c.value}</div>
                  <div style="color:rgba(200,210,220,0.35);font-size:0.55rem;font-family:'Tajawal',sans-serif;
                    margin-top:2px;">${c.label}</div>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- Achievements -->
          <div style="background:rgba(255,149,0,0.03);border:1px solid rgba(255,149,0,0.15);
            border-radius:2px;padding:18px;margin-bottom:14px;">
            <div style="color:rgba(255,149,0,0.5);font-size:0.6rem;font-family:'Share Tech Mono',monospace;
              margin-bottom:12px;text-align:center;letter-spacing:3px;">ACHIEVEMENTS UNLOCKED</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;">
              ${["إطلاق ناجح","التحام دقيق","سير فضائي","عالم فضاء","نجوت من الاحتراق","هبوط آمن"].map(c=>`
                <div style="background:rgba(0,255,100,0.05);border:1px solid rgba(0,255,100,0.15);
                  padding:5px 12px;border-radius:2px;color:rgba(0,255,136,0.8);font-size:0.7rem;
                  font-family:'Tajawal',sans-serif;display:flex;align-items:center;gap:4px;">
                  <span style="color:#00ff88;font-size:0.5rem;">■</span> ${c}
                </div>
              `).join("")}
            </div>
          </div>

          <!-- Post-landing -->
          <div style="background:rgba(255,149,0,0.03);border:1px solid rgba(255,149,0,0.15);
            border-radius:2px;padding:18px;margin-bottom:20px;">
            <div style="color:rgba(255,149,0,0.5);font-size:0.6rem;font-family:'Share Tech Mono',monospace;
              margin-bottom:12px;text-align:center;letter-spacing:3px;">POST-LANDING REPORT</div>
            <div style="color:rgba(200,210,220,0.65);font-size:0.8rem;line-height:2;font-family:'Tajawal',sans-serif;">
              <div><span style="color:#ff9500;font-size:0.5rem;margin-left:6px;">▸</span> الهبوط: المحيط الهادئ — سفن الإنقاذ وصلت</div>
              <div><span style="color:#ff9500;font-size:0.5rem;margin-left:6px;">▸</span> الفحص الطبي: العلامات الحيوية طبيعية</div>
              <div><span style="color:#ff9500;font-size:0.5rem;margin-left:6px;">▸</span> النقل: بطائرة هليكوبتر إلى سفينة الإنقاذ</div>
              <div><span style="color:#ff9500;font-size:0.5rem;margin-left:6px;">▸</span> المؤتمر الصحفي: مركز جونسون الفضائي</div>
              <div><span style="color:#ff9500;font-size:0.5rem;margin-left:6px;">▸</span> التكريم: وسام ناسا للخدمة المتميزة</div>
            </div>
          </div>

          <!-- Buttons -->
          <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
            <button class="cmd-btn cmd-btn-primary" id="btn-new-mission">
              <span class="cmd-btn-tag">NEW</span> مهمة جديدة
            </button>
            <button class="cmd-btn" id="btn-free-mode">
              <span class="cmd-btn-tag">FREE</span> نمط حر
            </button>
            <button class="cmd-btn" id="btn-main-menu">
              <span class="cmd-btn-tag">MENU</span> القائمة
            </button>
          </div>
        </div>
      </div>
      <style>
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-15px); } to { opacity:1; transform:translateY(0); } }
      </style>
    `)}addGlobalStyles(){if(document.getElementById("game-styles"))return;const t=document.createElement("style");t.id="game-styles",t.textContent=`
      @keyframes fadeInUp { from { opacity:0; transform:translate(-50%,-50%) translateY(15px); } to { opacity:1; transform:translate(-50%,-50%); } }
      @keyframes msgSlideUp { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%); } }
      @keyframes centerZoomIn { from { opacity:0; transform:translate(-50%,-50%) scale(0.85); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }
      @keyframes commSlideIn { from { opacity:0; transform:translateX(10px); } to { opacity:1; transform:translateX(0); } }
      @keyframes criticalPulse { 0%,100% { opacity:1; border-color:rgba(255,30,30,0.5); } 50% { opacity:0.7; border-color:rgba(255,30,30,0.8); } }
      @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      @keyframes glow { 0%,100% { box-shadow:0 0 5px rgba(255,149,0,0.2); } 50% { box-shadow:0 0 15px rgba(255,149,0,0.4); } }
      @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
      @keyframes scanline { 0% { transform:translateY(-100%); } 100% { transform:translateY(100vh); } }

      /* ===== COMMAND BUTTONS (cockpit style) ===== */
      .cmd-btn {
        display: inline-flex; align-items: center; gap: 8px;
        background: rgba(0,0,0,0.8); border: 1px solid rgba(255,149,0,0.2);
        color: rgba(200,210,220,0.8); padding: 10px 20px; border-radius: 2px;
        font-family: 'Tajawal', sans-serif; font-size: 0.9rem;
        cursor: pointer; transition: all 0.2s; pointer-events: auto;
        text-align: right; direction: rtl;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      }
      .cmd-btn:hover {
        background: rgba(255,149,0,0.1);
        border-color: rgba(255,149,0,0.4);
        color: #fff;
        box-shadow: 0 0 20px rgba(255,149,0,0.15);
      }
      .cmd-btn-primary {
        border-color: rgba(255,149,0,0.4);
        color: #ff9500;
        box-shadow: 0 0 15px rgba(255,149,0,0.1);
      }
      .cmd-btn-primary:hover {
        background: rgba(255,149,0,0.15);
        border-color: #ff9500;
        box-shadow: 0 0 25px rgba(255,149,0,0.2);
      }
      .cmd-btn-tag {
        font-family: 'Share Tech Mono', monospace;
        font-size: 0.55rem; letter-spacing: 2px;
        color: rgba(255,149,0,0.5);
        background: rgba(255,149,0,0.06);
        border: 1px solid rgba(255,149,0,0.12);
        padding: 2px 6px; border-radius: 2px;
      }
      .cmd-btn-danger {
        border-color: rgba(255,50,50,0.3);
        color: rgba(255,100,100,0.8);
      }
      .cmd-btn-danger:hover {
        background: rgba(255,50,50,0.1);
        border-color: rgba(255,50,50,0.5);
      }

      /* ===== MENU BUTTONS (mission control panels) ===== */
      .menu-btn {
        display: flex; align-items: center; gap: 12px; width: 100%;
        background: rgba(0,0,0,0.7); border: 1px solid rgba(255,149,0,0.15);
        border-left: 3px solid rgba(255,149,0,0.3);
        color: #fff; padding: 12px 16px; border-radius: 2px;
        font-family: 'Tajawal', sans-serif; font-size: 1rem;
        cursor: pointer; transition: all 0.2s; pointer-events: auto;
        text-align: right; direction: rtl;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      }
      .menu-btn:hover {
        background: rgba(255,149,0,0.08);
        border-color: rgba(255,149,0,0.3);
        border-left-color: #ff9500;
        box-shadow: 0 0 20px rgba(255,149,0,0.1);
        transform: translateX(-2px);
      }
      .menu-btn-primary {
        border-left-color: #ff9500;
        background: rgba(255,149,0,0.05);
      }
      .menu-btn-primary:hover {
        background: rgba(255,149,0,0.12);
        box-shadow: 0 0 25px rgba(255,149,0,0.15);
      }
      .menu-btn-icon {
        font-size: 1.3rem; min-width: 32px; text-align: center;
      }
      .menu-btn-text { flex: 1; }
      .menu-btn-title {
        font-weight: 600; font-size: 0.95rem; color: rgba(255,220,180,0.9);
        margin-bottom: 2px;
      }
      .menu-btn-desc {
        font-size: 0.68rem; color: rgba(200,180,150,0.4);
        font-weight: 300;
      }
      .menu-btn-small {
        background: rgba(0,0,0,0.7); border: 1px solid rgba(255,149,0,0.15);
        color: rgba(255,200,150,0.6); padding: 6px 16px; border-radius: 2px;
        font-family: 'Tajawal', sans-serif; font-size: 0.78rem;
        cursor: pointer; transition: all 0.2s; pointer-events: auto;
      }
      .menu-btn-small:hover {
        background: rgba(255,149,0,0.08);
        border-color: rgba(255,149,0,0.3);
        color: #ff9500;
      }

      /* ===== LEGACY BTN-SPACE ===== */
      .btn-space {
        background: rgba(0,0,0,0.7); border: 1px solid rgba(255,149,0,0.2);
        color: #fff; padding: 10px 26px; border-radius: 2px;
        font-family: 'Tajawal', sans-serif; font-size: 1rem;
        cursor: pointer; transition: all 0.2s; pointer-events: auto;
      }
      .btn-space:hover {
        background: rgba(255,149,0,0.1);
        border-color: rgba(255,149,0,0.4);
        box-shadow: 0 0 20px rgba(255,149,0,0.1);
      }
      .btn-space-primary {
        border-color: rgba(255,149,0,0.35);
        color: #ff9500;
      }
      .btn-space-primary:hover {
        background: rgba(255,149,0,0.12);
      }
      .btn-space-danger {
        border-color: rgba(255,50,50,0.3);
        color: rgba(255,100,100,0.8);
      }
      .btn-space-danger:hover {
        background: rgba(255,50,50,0.1);
      }

      /* ===== SCROLLBAR ===== */
      ::-webkit-scrollbar { width: 3px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(255,149,0,0.15); border-radius: 1px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(255,149,0,0.3); }
    `,document.head.appendChild(t)}}function Bp(i=50){const t=new te,e=new Yt(i,64,64),n=document.createElement("canvas");n.width=2048,n.height=1024;const s=n.getContext("2d"),r=s.createLinearGradient(0,0,0,1024);r.addColorStop(0,"#0a1e3d"),r.addColorStop(.15,"#0d2847"),r.addColorStop(.3,"#164773"),r.addColorStop(.45,"#1a5a8a"),r.addColorStop(.55,"#1a5a8a"),r.addColorStop(.7,"#164773"),r.addColorStop(.85,"#0d2847"),r.addColorStop(1,"#0a1e3d"),s.fillStyle=r,s.fillRect(0,0,2048,1024),[{points:[[280,180],[320,170],[400,180],[440,220],[450,280],[440,340],[400,370],[350,380],[300,360],[250,300],[240,250],[260,200]],color:"#2d5a3a"},{points:[[420,400],[450,380],[480,400],[490,450],[500,520],[490,580],[460,640],[430,680],[400,650],[380,580],[370,500],[390,430]],color:"#3a6b44"},{points:[[900,180],[950,170],[1e3,180],[1020,200],[1010,240],[980,260],[940,250],[920,230],[900,210]],color:"#4a7a4a"},{points:[[900,280],[960,270],[1020,290],[1050,340],[1060,400],[1050,460],[1020,520],[980,560],[940,560],[910,520],[890,460],[880,400],[880,340],[890,300]],color:"#5a8040"},{points:[[1020,140],[1100,120],[1200,130],[1350,150],[1450,180],[1500,220],[1520,280],[1480,320],[1400,340],[1300,350],[1200,330],[1100,300],[1050,260],[1030,220],[1020,180]],color:"#3d6b3d"},{points:[[1200,320],[1240,310],[1270,340],[1260,400],[1230,440],[1200,420],[1190,370]],color:"#4a7540"},{points:[[1350,340],[1400,330],[1440,350],[1460,380],[1440,400],[1400,390],[1360,370]],color:"#3a6838"},{points:[[1450,480],[1520,470],[1580,490],[1600,530],[1590,570],[1550,590],[1490,580],[1460,550],[1450,510]],color:"#7a6830"},{points:[[560,100],[620,90],[670,100],[680,140],[660,170],[610,170],[570,150],[560,120]],color:"#d8dce0"},{points:[[100,900],[400,890],[700,895],[1e3,890],[1300,895],[1600,890],[1900,900],[1900,1024],[100,1024]],color:"#e0e8f0"},{points:[[800,0],[1200,0],[1400,20],[1200,50],[800,40],[600,20]],color:"#dde5ed"},{points:[[1480,220],[1500,210],[1510,240],[1500,270],[1485,260]],color:"#4a7a4a"},{points:[[880,180],[900,175],[910,195],[900,210],[885,205]],color:"#4a7a50"},{points:[[1060,500],[1075,490],[1080,530],[1070,550],[1058,530]],color:"#4a7540"},{points:[[1650,560],[1665,550],[1670,580],[1660,600],[1648,585]],color:"#3a6838"}].forEach(f=>{s.fillStyle=f.color,s.beginPath(),f.points.forEach((u,S)=>{const v=u[0]+(Math.random()-.5)*8,b=u[1]+(Math.random()-.5)*6;if(S===0)s.moveTo(v,b);else{const R=f.points[S-1],C=(R[0]+v)/2+(Math.random()-.5)*15,T=(R[1]+b)/2+(Math.random()-.5)*10;s.quadraticCurveTo(C,T,v,b)}}),s.closePath(),s.fill(),s.save(),s.clip();for(let u=0;u<30;u++){const S=Math.random()>.5?"rgba(0,0,0,0.06)":"rgba(255,255,255,0.04)";s.fillStyle=S,s.beginPath();const v=f.points[0][0]+(Math.random()-.3)*200,b=f.points[0][1]+(Math.random()-.3)*200;s.ellipse(v,b,10+Math.random()*40,8+Math.random()*25,Math.random()*Math.PI,0,Math.PI*2),s.fill()}if(s.restore(),f.points.length>5&&Math.random()>.3){s.strokeStyle="rgba(30,50,30,0.15)",s.lineWidth=3,s.beginPath();const u=f.points[Math.floor(Math.random()*f.points.length)],S=f.points[Math.floor(Math.random()*f.points.length)];s.moveTo(u[0],u[1]),s.quadraticCurveTo((u[0]+S[0])/2+(Math.random()-.5)*30,(u[1]+S[1])/2+(Math.random()-.5)*20,S[0],S[1]),s.stroke()}}),[{x:920,y:320,w:120,h:60},{x:1150,y:300,w:80,h:50},{x:1480,y:510,w:80,h:40}].forEach(f=>{s.fillStyle="rgba(180,150,80,0.25)",s.beginPath(),s.ellipse(f.x,f.y,f.w,f.h,0,0,Math.PI*2),s.fill()});for(let f=0;f<200;f++){const u=.06+Math.random()*.18;s.fillStyle=`rgba(255,255,255,${u})`;const S=Math.random()*2048,v=Math.random()*1024;s.beginPath(),s.ellipse(S,v,15+Math.random()*80,5+Math.random()*20,Math.random()*Math.PI,0,Math.PI*2),s.fill()}for(let f=0;f<3;f++){const u=200+Math.random()*1600,S=350+Math.random()*300;for(let v=0;v<12;v++){const b=v/12*Math.PI*2,R=15+v*3;s.fillStyle=`rgba(255,255,255,${.04+Math.random()*.06})`,s.beginPath(),s.ellipse(u+Math.cos(b)*R,S+Math.sin(b)*R,8+Math.random()*15,4+Math.random()*8,b,0,Math.PI*2),s.fill()}}const c=new Ts(n),l=new B({map:c,specular:new Ct(2236996),shininess:20,bumpScale:.5}),h=new P(e,l);t.add(h);const d=new Yt(i*1.015,64,64),p=new pn({transparent:!0,side:nn,depthWrite:!1,uniforms:{glowColor:{value:new Ct(4491519)},viewVector:{value:new A(0,0,1)}},vertexShader:`
      varying float intensity;
      uniform vec3 viewVector;
      void main() {
        vec3 vNormal = normalize(normalMatrix * normal);
        vec3 vNormel = normalize(normalMatrix * viewVector);
        intensity = pow(0.65 - dot(vNormal, vNormel), 3.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      uniform vec3 glowColor;
      varying float intensity;
      void main() {
        vec3 glow = glowColor * intensity;
        gl_FragColor = vec4(glow, intensity * 0.55);
      }
    `}),m=new P(d,p);t.add(m);const g=new Yt(i*1.04,32,32),y=new Jt({color:3368618,transparent:!0,opacity:.04,blending:Se,depthWrite:!1,side:nn});return t.add(new P(g,y)),t.userData.earthMesh=h,t.userData.atmosMesh=m,t.userData.atmosMat=p,t}function jn(i=50){const t=Bp(i),e=document.createElement("canvas");e.width=2048,e.height=1024;const n=e.getContext("2d");n.fillStyle="#000",n.fillRect(0,0,2048,1024),[{x:310,y:240,density:70,spread:100},{x:250,y:260,density:40,spread:60},{x:200,y:250,density:50,spread:50},{x:920,y:210,density:90,spread:80},{x:980,y:200,density:60,spread:70},{x:1040,y:200,density:40,spread:50},{x:1200,y:250,density:50,spread:80},{x:1300,y:280,density:80,spread:100},{x:1420,y:230,density:100,spread:90},{x:1490,y:240,density:70,spread:40},{x:1400,y:280,density:50,spread:60},{x:430,y:550,density:40,spread:50},{x:960,y:370,density:25,spread:40},{x:1020,y:500,density:20,spread:30},{x:1530,y:540,density:30,spread:40}].forEach(a=>{for(let o=0;o<a.density;o++){const c=a.x+(Math.random()-.5)*a.spread,l=a.y+(Math.random()-.5)*a.spread*.6,h=.4+Math.random()*.6,d=255,p=180+Math.floor(Math.random()*50),m=80+Math.floor(Math.random()*40);n.fillStyle=`rgba(${d},${p},${m},${h})`;const g=1+Math.random()*2.5;n.fillRect(c,l,g,g)}});const r=new Ts(e);return t.userData.earthMesh.material.emissiveMap=r,t.userData.earthMesh.material.emissive=new Ct(16764006),t.userData.earthMesh.material.emissiveIntensity=.25,t}function Cn(i=8e3,t=500){const e=new ee,n=new Float32Array(i*3),s=new Float32Array(i*3);for(let a=0;a<i;a++){const o=Math.random()*Math.PI*2,c=Math.acos(2*Math.random()-1),l=t*(.85+Math.random()*.15);n[a*3]=l*Math.sin(c)*Math.cos(o),n[a*3+1]=l*Math.sin(c)*Math.sin(o),n[a*3+2]=l*Math.cos(c);const h=Math.random();if(h<.55){const p=Math.random()*.15;s[a*3]=.85+p,s[a*3+1]=.88+p,s[a*3+2]=1}else h<.75?(s[a*3]=1,s[a*3+1]=.92+Math.random()*.08,s[a*3+2]=.75+Math.random()*.15):h<.88?(s[a*3]=.6+Math.random()*.15,s[a*3+1]=.7+Math.random()*.15,s[a*3+2]=1):h<.96?(s[a*3]=1,s[a*3+1]=.65+Math.random()*.15,s[a*3+2]=.3+Math.random()*.15):(s[a*3]=1,s[a*3+1]=.35+Math.random()*.15,s[a*3+2]=.2+Math.random()*.1);const d=Math.random();if(d>.97)s[a*3]*=1.2,s[a*3+1]*=1.2,s[a*3+2]*=1.2;else{const p=.3+d*.7;s[a*3]*=p,s[a*3+1]*=p,s[a*3+2]*=p}}e.setAttribute("position",new Zt(n,3)),e.setAttribute("color",new Zt(s,3));const r=new Ze({size:1.2,vertexColors:!0,transparent:!0,opacity:.95,sizeAttenuation:!0,blending:Se,depthWrite:!1});return new en(e,r)}function Bi(){const i=new te,t=new Yt(20,32,32),e=new Jt({color:16774368});i.add(new P(t,e));const n=new Yt(24,32,32),s=new Jt({color:16768358,transparent:!0,opacity:.35,blending:Se,depthWrite:!1});i.add(new P(n,s));const r=new Yt(35,32,32),a=new Jt({color:16755234,transparent:!0,opacity:.12,blending:Se,depthWrite:!1});i.add(new P(r,a));const o=new Yt(50,32,32),c=new Jt({color:16746496,transparent:!0,opacity:.04,blending:Se,depthWrite:!1});i.add(new P(o,c));const l=new As(16774630,2.2);return l.castShadow=!0,i.add(l),i.add(new Pn(657944,.25)),i.userData.sunLight=l,i}function Qa(i=490){const t=new ee,e=5e3,n=new Float32Array(e*3),s=new Float32Array(e*3);for(let a=0;a<e;a++){const o=Math.random()*Math.PI*2,c=.12+Math.pow(Math.random(),2)*.25,l=Math.PI/2+(Math.random()-.5)*c,h=i*(.95+Math.random()*.05);n[a*3]=h*Math.sin(l)*Math.cos(o),n[a*3+1]=h*Math.sin(l)*Math.sin(o),n[a*3+2]=h*Math.cos(l);const d=Math.abs(l-Math.PI/2)/.3,p=(.15+Math.random()*.25)*(1-d*.5);s[a*3]=p*(.75+Math.random()*.2),s[a*3+1]=p*(.7+Math.random()*.2),s[a*3+2]=p*(.9+Math.random()*.1)}t.setAttribute("position",new Zt(n,3)),t.setAttribute("color",new Zt(s,3));const r=new Ze({size:.7,vertexColors:!0,transparent:!0,opacity:.5,blending:Se,depthWrite:!1});return new en(t,r)}class Gp{constructor(t){this.gs=t,this.scene=null,this.camera=null,this.earth=null,this.time=0,this.iss=null,this.issOrbitAngle=0,this.shootingStars=[],this.nebulaClouds=[]}async init(){this.scene=new mn,this.camera=new de(50,window.innerWidth/window.innerHeight,.1,5e3),this.camera.position.set(0,30,120),this.camera.lookAt(0,0,0),window.addEventListener("resize",this._onResize=()=>{this.camera.aspect=window.innerWidth/window.innerHeight,this.camera.updateProjectionMatrix()}),this.scene.background=new Ct(132104),this.scene.add(Cn(12e3,1500)),this.scene.add(Cn(4e3,800)),this.scene.add(Qa()),this._createNebulaClouds();const t=Bi();t.position.set(300,150,-500),this.scene.add(t),this.earth=jn(50),this.earth.position.set(0,-25,0),this.scene.add(this.earth),this._createMiniISS(),this._initShootingStars(),this.scene.fog=new Lr(132104,6e-4),this.gs.ui.addGlobalStyles(),this.gs.ui.clear(),this._showMenu(),this.time=0}_createNebulaClouds(){[{color:1705248,pos:[200,100,-400]},{color:660768,pos:[-300,-50,-500]},{color:1378821,pos:[100,-100,-600]}].forEach(e=>{const n=new Yt(80,16,16),s=new Jt({color:e.color,transparent:!0,opacity:.12,blending:Se,depthWrite:!1,side:ue}),r=new P(n,s);r.position.set(...e.pos),r.scale.set(2,1,1.5),this.scene.add(r),this.nebulaClouds.push(r)})}_createMiniISS(){this.iss=new te;const t=new B({color:13421772,specular:6710886,shininess:60}),e=new P(new dt(6,.15,.15),t);this.iss.add(e);const n=new B({color:15658717,specular:4473924,shininess:40});[0,-.5,.5].forEach(a=>{const o=new P(new Mt(.15,.15,.8,8),n);o.position.set(0,0,a),o.rotation.x=Math.PI/2,this.iss.add(o)});const s=new B({color:2245802,specular:8956671,shininess:100,emissive:1118515,emissiveIntensity:.3});[-2.5,-1.5,1.5,2.5].forEach(a=>{const o=new P(new dt(.8,.02,.5),s);o.position.set(a,0,0),this.iss.add(o)});const r=new B({color:16777215,emissive:2236962});[-1,1].forEach(a=>{const o=new P(new dt(.4,.01,.3),r);o.position.set(a,.1,0),this.iss.add(o)}),this.iss.scale.setScalar(.6),this.scene.add(this.iss)}_initShootingStars(){for(let t=0;t<3;t++)this._addShootingStar()}_addShootingStar(){const t=new ee,e=new Float32Array(6);t.setAttribute("position",new Zt(e,3));const n=new Ni({color:16749824,transparent:!0,opacity:0,blending:Se}),s=new Ms(t,n);this.scene.add(s),this.shootingStars.push({line:s,timer:Math.random()*20+5,active:!1,life:0,maxLife:.8+Math.random()*.5,startPos:new A,dir:new A,speed:200+Math.random()*300})}_showMenu(){this.gs.ui.clear(),this.gs.ui.addElement("main-menu",`
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;
        align-items:center;justify-content:center;direction:rtl;">
        
        <!-- Top bar -->
        <div style="position:fixed;top:0;left:0;right:0;height:36px;background:rgba(0,0,0,0.85);
          border-bottom:1px solid rgba(255,149,0,0.15);display:flex;align-items:center;
          justify-content:space-between;padding:0 20px;z-index:5;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="color:#00ff88;font-size:0.4rem;">●</span>
            <span style="font-family:'Share Tech Mono',monospace;font-size:0.6rem;color:rgba(255,149,0,0.5);
              letter-spacing:2px;">SYSTEM ONLINE</span>
          </div>
          <div style="font-family:'Share Tech Mono',monospace;font-size:0.6rem;color:rgba(255,149,0,0.3);
            letter-spacing:1px;">ISS EXPEDITION 72 — v3.0</div>
          <div style="font-family:'Share Tech Mono',monospace;font-size:0.6rem;color:rgba(255,149,0,0.3);
            letter-spacing:1px;">ALT: 408km — INC: 51.6°</div>
        </div>

        <!-- Title -->
        <div style="text-align:center;margin-bottom:40px;position:relative;z-index:2;">
          <div style="font-family:'Share Tech Mono',monospace;font-size:0.65rem;color:rgba(255,149,0,0.3);
            letter-spacing:4px;margin-bottom:6px;">INTERNATIONAL SPACE STATION</div>
          <div style="font-family:'Orbitron',sans-serif;font-size:3rem;color:#ff9500;
            text-shadow:0 0 50px rgba(255,149,0,0.3), 0 0 100px rgba(255,149,0,0.1);
            letter-spacing:8px;margin-bottom:6px;font-weight:900;">
            ISS MISSION
          </div>
          <div style="width:180px;height:2px;background:linear-gradient(90deg,transparent,#ff9500,transparent);
            margin:0 auto 10px;"></div>
          <div style="font-family:'Tajawal',sans-serif;font-size:1.3rem;color:rgba(200,180,150,0.6);
            font-weight:300;letter-spacing:1px;">
            رحلة إلى محطة الفضاء الدولية
          </div>
        </div>

        <!-- Mission select buttons -->
        <div style="display:flex;flex-direction:column;gap:8px;align-items:center;width:380px;position:relative;z-index:2;">
          <button class="menu-btn menu-btn-primary" id="btn-story">
            <div class="menu-btn-icon">🚀</div>
            <div class="menu-btn-text">
              <div class="menu-btn-title">نمط القصة</div>
              <div class="menu-btn-desc">رحلة متكاملة من الأرض إلى الفضاء والعودة</div>
            </div>
            <span style="font-family:'Share Tech Mono',monospace;font-size:0.5rem;color:rgba(255,149,0,0.3);letter-spacing:1px;">STORY</span>
          </button>
          <button class="menu-btn" id="btn-missions">
            <div class="menu-btn-icon">🎯</div>
            <div class="menu-btn-text">
              <div class="menu-btn-title">نمط المهمات</div>
              <div class="menu-btn-desc">6 مهمات مستقلة متنوعة الصعوبة</div>
            </div>
            <span style="font-family:'Share Tech Mono',monospace;font-size:0.5rem;color:rgba(255,149,0,0.3);letter-spacing:1px;">MISSIONS</span>
          </button>
          <button class="menu-btn" id="btn-free">
            <div class="menu-btn-icon">🌍</div>
            <div class="menu-btn-text">
              <div class="menu-btn-title">المحاكاة الحرة</div>
              <div class="menu-btn-desc">استكشف الفضاء والمحطة بحرية كاملة</div>
            </div>
            <span style="font-family:'Share Tech Mono',monospace;font-size:0.5rem;color:rgba(255,149,0,0.3);letter-spacing:1px;">FREE</span>
          </button>
          <button class="menu-btn" id="btn-challenge">
            <div class="menu-btn-icon">🏆</div>
            <div class="menu-btn-text">
              <div class="menu-btn-title">نمط التحديات</div>
              <div class="menu-btn-desc">التحام دقيق • إصلاح سريع • هبوط آمن</div>
            </div>
            <span style="font-family:'Share Tech Mono',monospace;font-size:0.5rem;color:rgba(255,149,0,0.3);letter-spacing:1px;">CHALLENGE</span>
          </button>
        </div>

        <!-- Bottom controls -->
        <div style="margin-top:20px;display:flex;gap:10px;position:relative;z-index:2;">
          <button class="menu-btn-small" id="btn-settings">⚙ الإعدادات</button>
          <button class="menu-btn-small" id="btn-help">◈ دليل اللعبة</button>
        </div>

        <!-- Footer -->
        <div style="position:fixed;bottom:10px;left:0;right:0;display:flex;justify-content:center;z-index:2;">
          <div style="background:rgba(0,0,0,0.7);border:1px solid rgba(255,149,0,0.08);border-radius:2px;
            padding:5px 15px;display:flex;gap:15px;">
            <span style="color:rgba(255,149,0,0.25);font-size:0.55rem;font-family:'Share Tech Mono',monospace;letter-spacing:1px;">
              WASD MOVE</span>
            <span style="color:rgba(255,149,0,0.15);font-size:0.55rem;">|</span>
            <span style="color:rgba(255,149,0,0.25);font-size:0.55rem;font-family:'Share Tech Mono',monospace;letter-spacing:1px;">
              SPACE/Q UP</span>
            <span style="color:rgba(255,149,0,0.15);font-size:0.55rem;">|</span>
            <span style="color:rgba(255,149,0,0.25);font-size:0.55rem;font-family:'Share Tech Mono',monospace;letter-spacing:1px;">
              SHIFT/E DOWN</span>
            <span style="color:rgba(255,149,0,0.15);font-size:0.55rem;">|</span>
            <span style="color:rgba(255,149,0,0.25);font-size:0.55rem;font-family:'Share Tech Mono',monospace;letter-spacing:1px;">
              F INTERACT</span>
          </div>
        </div>
      </div>
    `),setTimeout(()=>{var t,e,n,s,r,a;(t=document.getElementById("btn-story"))==null||t.addEventListener("click",()=>{this.gs.audio.init(),this.gs.audio.playConfirm(),this.gs.switchScene("preLaunch",{mode:"story"})}),(e=document.getElementById("btn-missions"))==null||e.addEventListener("click",()=>{this.gs.audio.init(),this.gs.audio.playConfirm(),this._showMissions()}),(n=document.getElementById("btn-free"))==null||n.addEventListener("click",()=>{this.gs.audio.init(),this.gs.audio.playConfirm(),this.gs.switchScene("preLaunch",{mode:"free"})}),(s=document.getElementById("btn-challenge"))==null||s.addEventListener("click",()=>{this.gs.audio.init(),this.gs.audio.playConfirm(),this._showChallenges()}),(r=document.getElementById("btn-settings"))==null||r.addEventListener("click",()=>{this.gs.audio.init(),this._showSettings()}),(a=document.getElementById("btn-help"))==null||a.addEventListener("click",()=>{this.gs.audio.init(),this._showHelp()})},100)}_showMissions(){this.gs.ui.clear(),this.gs.ui.addElement("missions-menu",`
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;direction:rtl;">
        <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.7) 100%);pointer-events:none;"></div>
        
        <div style="text-align:center;margin-bottom:20px;position:relative;z-index:2;">
          <div style="font-family:'Share Tech Mono',monospace;font-size:0.55rem;color:rgba(255,149,0,0.3);
            letter-spacing:3px;margin-bottom:4px;">SELECT MISSION</div>
          <h2 style="font-family:'Orbitron',sans-serif;color:#ff9500;font-size:1.5rem;
            text-shadow:0 0 20px rgba(255,149,0,0.2);letter-spacing:3px;font-weight:700;">
            اختر المهمة
          </h2>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;width:420px;max-height:60vh;overflow-y:auto;padding:8px;position:relative;z-index:2;">
          ${[{id:"mission-1",name:"مهمة التدريب الأولى",desc:"تعلم أساسيات الطيران والالتحام",diff:"سهل",icon:"🎓",tag:"TRAINING"},{id:"mission-2",name:"إصلاح الألواح الشمسية",desc:"خروج إلى الفضاء لإصلاح لوح شمسي",diff:"متوسط",icon:"🔧",tag:"REPAIR"},{id:"mission-3",name:"تجربة نمو النباتات",desc:"إجراء تجارب في مختبر المحطة",diff:"سهل",icon:"🌱",tag:"SCIENCE"},{id:"mission-4",name:"إنقاذ المحطة",desc:"التعامل مع تسرب هواء طارئ",diff:"صعب",icon:"⚠️",tag:"EMERGENCY"},{id:"mission-5",name:"مهمة الإمداد",desc:"استقبال وتفريغ مركبة شحن",diff:"متوسط",icon:"📦",tag:"LOGISTICS"},{id:"mission-6",name:"العودة الطارئة",desc:"هبوط اضطراري في ظروف صعبة",diff:"صعب",icon:"🔥",tag:"ABORT"}].map(t=>`
            <button class="menu-btn" style="width:100%;" id="${t.id}">
              <div class="menu-btn-icon">${t.icon}</div>
              <div class="menu-btn-text" style="flex:1;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span class="menu-btn-title">${t.name}</span>
                  <span style="font-size:0.55rem;padding:2px 8px;border-radius:2px;
                    font-family:'Share Tech Mono',monospace;letter-spacing:1px;
                    background:${t.diff==="سهل"?"rgba(0,255,100,0.06)":t.diff==="متوسط"?"rgba(255,180,0,0.06)":"rgba(255,50,50,0.06)"};
                    color:${t.diff==="سهل"?"#00ff88":t.diff==="متوسط"?"#ffb800":"#ff4444"};
                    border:1px solid ${t.diff==="سهل"?"rgba(0,255,100,0.15)":t.diff==="متوسط"?"rgba(255,180,0,0.15)":"rgba(255,50,50,0.15)"};">
                    ${t.diff}</span>
                </div>
                <div class="menu-btn-desc">${t.desc}</div>
              </div>
              <span style="font-family:'Share Tech Mono',monospace;font-size:0.45rem;color:rgba(255,149,0,0.2);letter-spacing:1px;">${t.tag}</span>
            </button>
          `).join("")}
        </div>
        <button class="menu-btn-small" style="margin-top:14px;position:relative;z-index:2;" id="btn-back-missions">↩ العودة</button>
      </div>
    `),setTimeout(()=>{var t;(t=document.getElementById("btn-back-missions"))==null||t.addEventListener("click",()=>{this.gs.audio.playBeep(),this._showMenu()}),["mission-1","mission-2","mission-3","mission-4","mission-5","mission-6"].forEach((e,n)=>{var s;(s=document.getElementById(e))==null||s.addEventListener("click",()=>{this.gs.audio.playConfirm(),this.gs.switchScene("preLaunch",{mode:"mission",missionId:n+1})})})},100)}_showChallenges(){this.gs.ui.clear(),this.gs.ui.addElement("challenges-menu",`
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;direction:rtl;">
        <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.7) 100%);pointer-events:none;"></div>

        <div style="text-align:center;margin-bottom:20px;position:relative;z-index:2;">
          <div style="font-family:'Share Tech Mono',monospace;font-size:0.55rem;color:rgba(255,149,0,0.3);
            letter-spacing:3px;margin-bottom:4px;">SELECT CHALLENGE</div>
          <h2 style="font-family:'Orbitron',sans-serif;color:#ff9500;font-size:1.5rem;
            text-shadow:0 0 20px rgba(255,149,0,0.2);letter-spacing:3px;font-weight:700;">
            التحديات
          </h2>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;width:380px;position:relative;z-index:2;">
          <button class="menu-btn" style="width:100%;" id="ch-dock">
            <div class="menu-btn-icon">🎯</div>
            <div class="menu-btn-text">
              <div class="menu-btn-title">تحدي الالتحام الدقيق</div>
              <div class="menu-btn-desc">التحم بالمحطة بأعلى دقة ممكنة</div>
            </div>
            <span style="font-family:'Share Tech Mono',monospace;font-size:0.45rem;color:rgba(255,149,0,0.2);letter-spacing:1px;">DOCK</span>
          </button>
          <button class="menu-btn" style="width:100%;" id="ch-repair">
            <div class="menu-btn-icon">🔧</div>
            <div class="menu-btn-text">
              <div class="menu-btn-title">تحدي أسرع إصلاح</div>
              <div class="menu-btn-desc">أكمل إصلاحات المحطة بأسرع وقت</div>
            </div>
            <span style="font-family:'Share Tech Mono',monospace;font-size:0.45rem;color:rgba(255,149,0,0.2);letter-spacing:1px;">REPAIR</span>
          </button>
          <button class="menu-btn" style="width:100%;" id="ch-land">
            <div class="menu-btn-icon">🪂</div>
            <div class="menu-btn-text">
              <div class="menu-btn-title">تحدي الهبوط الناجح</div>
              <div class="menu-btn-desc">اهبط بأمان على سطح المحيط</div>
            </div>
            <span style="font-family:'Share Tech Mono',monospace;font-size:0.45rem;color:rgba(255,149,0,0.2);letter-spacing:1px;">LAND</span>
          </button>
          <button class="menu-btn" style="width:100%;" id="ch-crisis">
            <div class="menu-btn-icon">⚠️</div>
            <div class="menu-btn-text">
              <div class="menu-btn-title">تحدي إدارة الأزمات</div>
              <div class="menu-btn-desc">تعامل مع حالة طوارئ على المحطة</div>
            </div>
            <span style="font-family:'Share Tech Mono',monospace;font-size:0.45rem;color:rgba(255,149,0,0.2);letter-spacing:1px;">CRISIS</span>
          </button>
        </div>
        <button class="menu-btn-small" style="margin-top:14px;position:relative;z-index:2;" id="btn-back-ch">↩ العودة</button>
      </div>
    `),setTimeout(()=>{var t,e,n,s,r;(t=document.getElementById("btn-back-ch"))==null||t.addEventListener("click",()=>{this.gs.audio.playBeep(),this._showMenu()}),(e=document.getElementById("ch-dock"))==null||e.addEventListener("click",()=>{this.gs.audio.playConfirm(),this.gs.switchScene("docking",{mode:"challenge"})}),(n=document.getElementById("ch-repair"))==null||n.addEventListener("click",()=>{this.gs.audio.playConfirm(),this.gs.switchScene("issInterior",{mode:"challenge",task:"repair"})}),(s=document.getElementById("ch-land"))==null||s.addEventListener("click",()=>{this.gs.audio.playConfirm(),this.gs.switchScene("reEntry",{mode:"challenge"})}),(r=document.getElementById("ch-crisis"))==null||r.addEventListener("click",()=>{this.gs.audio.playConfirm(),this.gs.switchScene("issInterior",{mode:"challenge",task:"crisis"})})},100)}_showSettings(){this.gs.ui.clear(),this.gs.ui.addElement("settings-menu",`
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;direction:rtl;">
        <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.7) 100%);pointer-events:none;"></div>

        <div style="text-align:center;margin-bottom:20px;position:relative;z-index:2;">
          <div style="font-family:'Share Tech Mono',monospace;font-size:0.55rem;color:rgba(255,149,0,0.3);
            letter-spacing:3px;margin-bottom:4px;">CONFIGURATION</div>
          <h2 style="font-family:'Orbitron',sans-serif;color:#ff9500;font-size:1.4rem;
            text-shadow:0 0 20px rgba(255,149,0,0.2);letter-spacing:3px;font-weight:700;">
            الإعدادات
          </h2>
        </div>
        <div style="display:flex;flex-direction:column;gap:14px;width:350px;
          background:rgba(0,0,0,0.85);border:1px solid rgba(255,149,0,0.15);
          padding:24px;border-radius:2px;position:relative;z-index:2;
          box-shadow:0 4px 30px rgba(0,0,0,0.5);">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="color:rgba(200,180,150,0.7);font-family:'Tajawal',sans-serif;font-size:0.9rem;">المؤثرات الصوتية</span>
            <button class="menu-btn-small" id="toggle-sfx">${this.gs.settings.soundEnabled?"🔊 مفعّل":"🔇 مغلق"}</button>
          </div>
          <div style="height:1px;background:rgba(255,149,0,0.08);"></div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="color:rgba(200,180,150,0.7);font-family:'Tajawal',sans-serif;font-size:0.9rem;">الصعوبة</span>
            <button class="menu-btn-small" id="toggle-diff">${this.gs.settings.difficulty==="easy"?"سهل":this.gs.settings.difficulty==="normal"?"عادي":"صعب"}</button>
          </div>
        </div>
        <button class="menu-btn-small" style="margin-top:14px;position:relative;z-index:2;" id="btn-back-settings">↩ العودة</button>
      </div>
    `),setTimeout(()=>{var t,e,n;(t=document.getElementById("btn-back-settings"))==null||t.addEventListener("click",()=>{this.gs.audio.playBeep(),this._showMenu()}),(e=document.getElementById("toggle-sfx"))==null||e.addEventListener("click",()=>{this.gs.settings.soundEnabled=!this.gs.settings.soundEnabled,this.gs.audio.setMasterVolume(this.gs.settings.soundEnabled?1:0),this._showSettings()}),(n=document.getElementById("toggle-diff"))==null||n.addEventListener("click",()=>{const s=["easy","normal","hard"],r=s.indexOf(this.gs.settings.difficulty);this.gs.settings.difficulty=s[(r+1)%3],this._showSettings()})},100)}_showHelp(){this.gs.ui.clear(),this.gs.ui.addElement("help-menu",`
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;direction:rtl;">
        <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.7) 100%);pointer-events:none;"></div>

        <div style="text-align:center;margin-bottom:16px;position:relative;z-index:2;">
          <div style="font-family:'Share Tech Mono',monospace;font-size:0.55rem;color:rgba(255,149,0,0.3);
            letter-spacing:3px;margin-bottom:4px;">MISSION GUIDE</div>
          <h2 style="font-family:'Orbitron',sans-serif;color:#ff9500;font-size:1.4rem;
            text-shadow:0 0 20px rgba(255,149,0,0.2);letter-spacing:3px;font-weight:700;">
            دليل اللعبة
          </h2>
        </div>
        <div style="max-width:520px;max-height:60vh;overflow-y:auto;
          background:rgba(0,0,0,0.85);border:1px solid rgba(255,149,0,0.15);
          padding:24px;border-radius:2px;
          line-height:1.9;color:rgba(200,210,220,0.7);position:relative;z-index:2;
          box-shadow:0 4px 30px rgba(0,0,0,0.5);font-family:'Tajawal',sans-serif;">
          
          <h3 style="color:#ff9500;margin-bottom:10px;font-size:0.95rem;font-weight:600;">
            <span style="font-family:'Share Tech Mono',monospace;font-size:0.55rem;color:rgba(255,149,0,0.4);margin-left:8px;">CTRL</span>
            التحكم
          </h3>
          <div style="background:rgba(255,149,0,0.03);padding:10px 14px;border-radius:2px;margin-bottom:16px;font-size:0.82rem;
            border:1px solid rgba(255,149,0,0.08);">
            <div style="display:grid;grid-template-columns:70px 1fr;gap:5px 10px;">
              <span style="color:#ff9500;font-family:'Share Tech Mono',monospace;font-size:0.7rem;">W / ↑</span><span>التحرك للأمام</span>
              <span style="color:#ff9500;font-family:'Share Tech Mono',monospace;font-size:0.7rem;">S / ↓</span><span>التحرك للخلف</span>
              <span style="color:#ff9500;font-family:'Share Tech Mono',monospace;font-size:0.7rem;">A / ←</span><span>التحرك لليسار</span>
              <span style="color:#ff9500;font-family:'Share Tech Mono',monospace;font-size:0.7rem;">D / →</span><span>التحرك لليمين</span>
              <span style="color:#ff9500;font-family:'Share Tech Mono',monospace;font-size:0.7rem;">Q / Space</span><span>الصعود</span>
              <span style="color:#ff9500;font-family:'Share Tech Mono',monospace;font-size:0.7rem;">E / Shift</span><span>النزول</span>
              <span style="color:#ff9500;font-family:'Share Tech Mono',monospace;font-size:0.7rem;">F</span><span>التفاعل</span>
              <span style="color:#ff9500;font-family:'Share Tech Mono',monospace;font-size:0.7rem;">الفأرة</span><span>توجيه الكاميرا</span>
            </div>
          </div>

          <h3 style="color:#ff9500;margin-bottom:10px;font-size:0.95rem;font-weight:600;">
            <span style="font-family:'Share Tech Mono',monospace;font-size:0.55rem;color:rgba(255,149,0,0.4);margin-left:8px;">PHASES</span>
            مراحل المهمة
          </h3>
          <div style="font-size:0.82rem;margin-bottom:16px;">
            <div style="padding:3px 0;border-bottom:1px solid rgba(255,149,0,0.05);">
              <span style="color:rgba(255,149,0,0.4);font-family:'Share Tech Mono',monospace;font-size:0.6rem;margin-left:6px;">01</span>
              الاستعداد والتوجه لمنصة الإطلاق</div>
            <div style="padding:3px 0;border-bottom:1px solid rgba(255,149,0,0.05);">
              <span style="color:rgba(255,149,0,0.4);font-family:'Share Tech Mono',monospace;font-size:0.6rem;margin-left:6px;">02</span>
              الإقلاع وصعود الصاروخ</div>
            <div style="padding:3px 0;border-bottom:1px solid rgba(255,149,0,0.05);">
              <span style="color:rgba(255,149,0,0.4);font-family:'Share Tech Mono',monospace;font-size:0.6rem;margin-left:6px;">03</span>
              الملاحة في الفضاء نحو المحطة</div>
            <div style="padding:3px 0;border-bottom:1px solid rgba(255,149,0,0.05);">
              <span style="color:rgba(255,149,0,0.4);font-family:'Share Tech Mono',monospace;font-size:0.6rem;margin-left:6px;">04</span>
              الالتحام بمحطة الفضاء الدولية</div>
            <div style="padding:3px 0;border-bottom:1px solid rgba(255,149,0,0.05);">
              <span style="color:rgba(255,149,0,0.4);font-family:'Share Tech Mono',monospace;font-size:0.6rem;margin-left:6px;">05</span>
              استكشاف المحطة وتنفيذ المهام</div>
            <div style="padding:3px 0;border-bottom:1px solid rgba(255,149,0,0.05);">
              <span style="color:rgba(255,149,0,0.4);font-family:'Share Tech Mono',monospace;font-size:0.6rem;margin-left:6px;">06</span>
              ارتداء بدلة EVA والخروج للفضاء</div>
            <div style="padding:3px 0;border-bottom:1px solid rgba(255,149,0,0.05);">
              <span style="color:rgba(255,149,0,0.4);font-family:'Share Tech Mono',monospace;font-size:0.6rem;margin-left:6px;">07</span>
              دخول الغلاف الجوي والاحتراق</div>
            <div style="padding:3px 0;">
              <span style="color:rgba(255,149,0,0.4);font-family:'Share Tech Mono',monospace;font-size:0.6rem;margin-left:6px;">08</span>
              الهبوط في المحيط والإنقاذ</div>
          </div>

          <h3 style="color:#ff9500;margin-bottom:10px;font-size:0.95rem;font-weight:600;">
            <span style="font-family:'Share Tech Mono',monospace;font-size:0.55rem;color:rgba(255,149,0,0.4);margin-left:8px;">TIPS</span>
            نصائح
          </h3>
          <div style="font-size:0.82rem;">
            <div style="padding:2px 0;"><span style="color:#ff9500;font-size:0.5rem;margin-left:6px;">▸</span> راقب الأكسجين والوقود باستمرار</div>
            <div style="padding:2px 0;"><span style="color:#ff9500;font-size:0.5rem;margin-left:6px;">▸</span> اتبع تعليمات مركز التحكم في هيوستن</div>
            <div style="padding:2px 0;"><span style="color:#ff9500;font-size:0.5rem;margin-left:6px;">▸</span> اقترب ببطء أثناء الالتحام</div>
            <div style="padding:2px 0;"><span style="color:#ff9500;font-size:0.5rem;margin-left:6px;">▸</span> حافظ على زاوية الدخول الصحيحة عند العودة</div>
          </div>
        </div>
        <button class="menu-btn-small" style="margin-top:14px;position:relative;z-index:2;" id="btn-back-help">↩ العودة</button>
      </div>
    `),setTimeout(()=>{var t;(t=document.getElementById("btn-back-help"))==null||t.addEventListener("click",()=>{this.gs.audio.playBeep(),this._showMenu()})},100)}update(t){if(this.time+=t,this.earth&&(this.earth.rotation.y+=t*.03),this.iss){this.issOrbitAngle+=t*.15;const s=58;this.iss.position.set(Math.cos(this.issOrbitAngle)*s,-25+Math.sin(this.issOrbitAngle*.7)*5+8,Math.sin(this.issOrbitAngle)*s*.6),this.iss.rotation.y=-this.issOrbitAngle+Math.PI/2}const e=120,n=this.time*.04;this.camera.position.x=Math.sin(n)*e*.15,this.camera.position.y=30+Math.sin(this.time*.08)*8,this.camera.position.z=e+Math.sin(this.time*.06)*10,this.camera.lookAt(0,-10,0),this.nebulaClouds.forEach((s,r)=>{s.rotation.y+=t*.005*(r+1),s.material.opacity=.1+Math.sin(this.time*.3+r*2)*.03}),this.shootingStars.forEach(s=>{if(!s.active)s.timer-=t,s.timer<=0&&(s.active=!0,s.life=0,s.startPos.set((Math.random()-.5)*600,100+Math.random()*200,-200-Math.random()*300),s.dir.set((Math.random()-.5)*.5,-.5-Math.random()*.5,(Math.random()-.5)*.3).normalize());else if(s.life+=t,s.life>s.maxLife)s.active=!1,s.timer=5+Math.random()*15,s.line.material.opacity=0;else{const r=s.life/s.maxLife;s.line.material.opacity=r<.3?r/.3:(1-r)/.7,s.line.material.opacity*=.6;const a=s.startPos.clone().add(s.dir.clone().multiplyScalar(s.speed*s.life)),o=a.clone().sub(s.dir.clone().multiplyScalar(30)),c=s.line.geometry.attributes.position.array;c[0]=a.x,c[1]=a.y,c[2]=a.z,c[3]=o.x,c[4]=o.y,c[5]=o.z,s.line.geometry.attributes.position.needsUpdate=!0}})}render(t){t.render(this.scene,this.camera)}async cleanup(){window.removeEventListener("resize",this._onResize),this.gs.ui.clear()}}function tc(){const i=new te,t=new Mt(1.2,1.5,18,16),e=new B({color:15658734,specular:4473924,shininess:60}),n=new P(t,e);n.position.y=9,i.add(n);const s=new An(1.2,5,16),r=new B({color:16724736,specular:3355443,shininess:40}),a=new P(s,r);a.position.y=20.5,i.add(a);const o=new Mt(1.55,1.55,.5,16),c=new B({color:3355443});[4,8,12,16].forEach(b=>{const R=new P(o,c);R.position.y=b,i.add(R)});const l=new Mt(1.3,1.8,3,16),h=new B({color:5592405,specular:2236962}),d=new P(l,h);d.position.y=-.5,i.add(d);const p=new Mt(.8,1.2,2,12),m=new B({color:3355443,emissive:1114112});for(let b=0;b<3;b++){const R=new P(p,m),C=b/3*Math.PI*2;R.position.set(Math.cos(C)*.6,-1.5,Math.sin(C)*.6),i.add(R)}const g=new dt(.15,5,3),y=new B({color:13378048});for(let b=0;b<4;b++){const R=new P(g,y),C=b/4*Math.PI*2;R.position.set(Math.cos(C)*1.6,1.5,Math.sin(C)*1.6),R.rotation.y=C,i.add(R)}const f=new Mt(.6,.7,14,12),u=new B({color:14540253}),S=new An(.6,2,12),v=[];for(let b=0;b<2;b++){const R=new te,C=new P(f,u);C.position.y=7,R.add(C);const T=new P(S,r);T.position.y=15,R.add(T);const L=b===0?-Math.PI/2:Math.PI/2;R.position.set(Math.cos(L)*2.5,0,Math.sin(L)*2.5),i.add(R),v.push(R)}return i.userData.boosters=v,i.userData.body=n,i.userData.nose=a,i.userData.engine=d,i}function Cs(){const i=new te,t=new An(2.5,3.5,32),e=new B({color:14540253,specular:6710886,shininess:80}),n=new P(t,e);n.position.y=1.75,i.add(n);const s=new Mt(2.5,2.5,1.2,32),r=new B({color:10066329,specular:3355443}),a=new P(s,r);a.position.y=-.6,i.add(a);const o=new B({color:5592405});[.5,1.5,2.5].forEach(L=>{const W=new Fe(1.2+(3.5-L)*.37,.04,8,32),_=new P(W,o);_.position.y=L,_.rotation.x=Math.PI/2,i.add(_)});const c=new Mt(2.5,2.2,.4,32),l=new B({color:4469538,emissive:1114112,emissiveIntensity:.2}),h=new P(c,l);h.position.y=-1.4,i.add(h);const d=new Ue(2.2,32),p=new B({color:3351057,side:ue}),m=new P(d,p);m.position.y=-1.6,m.rotation.x=Math.PI/2,i.add(m);const g=new Ue(.35,16),y=new B({color:8965375,emissive:3368584,transparent:!0,opacity:.85});for(let L=0;L<3;L++){const W=new P(g,y),_=L/3*Math.PI*2;W.position.set(Math.cos(_)*1.8,1.2,Math.sin(_)*1.8),W.lookAt(W.position.clone().multiplyScalar(2)),i.add(W)}const f=new Mt(.5,.5,.8,16),u=new B({color:6710886}),S=new P(f,u);S.position.y=3.9,i.add(S);const v=new B({color:4473924});for(let L=0;L<4;L++){const W=new Mt(.08,.12,.2,8),_=new P(W,v),E=L/4*Math.PI*2;_.position.set(Math.cos(E)*2.6,-.3,Math.sin(E)*2.6),_.rotation.z=Math.PI/2,i.add(_)}const b=new dt(4,.05,1.5),R=new B({color:1713022,specular:4474111,shininess:100}),C=new P(b,R);C.position.set(3.5,.5,0),i.add(C);const T=new P(b,R);return T.position.set(-3.5,.5,0),i.add(T),i.userData.shield=h,i.userData.shieldMat=l,i.userData.solarPanels=[C,T],i}function Hp(i=500){const t=new ee,e=new Float32Array(i*3),n=new Float32Array(i*3),s=new Float32Array(i),r=[];for(let c=0;c<i;c++){e[c*3]=(Math.random()-.5)*2,e[c*3+1]=-Math.random()*10,e[c*3+2]=(Math.random()-.5)*2;const l=Math.random();n[c*3]=1,n[c*3+1]=.3+l*.5,n[c*3+2]=l*.2,s[c]=.5+Math.random()*1.5,r.push({x:(Math.random()-.5)*2,y:-5-Math.random()*15,z:(Math.random()-.5)*2})}t.setAttribute("position",new Zt(e,3)),t.setAttribute("color",new Zt(n,3)),t.setAttribute("size",new Zt(s,1));const a=new Ze({size:1,vertexColors:!0,transparent:!0,opacity:.8,blending:Se,depthWrite:!1}),o=new en(t,a);return o.userData.velocities=r,o.userData.count=i,o}function Vp(i,t,e=1){const n=i.geometry.attributes.position.array,s=i.geometry.attributes.color.array,r=i.userData.velocities,a=i.userData.count;for(let o=0;o<a;o++)n[o*3]+=r[o].x*t*e,n[o*3+1]+=r[o].y*t*e,n[o*3+2]+=r[o].z*t*e,n[o*3+1]<-20*e?(n[o*3]=(Math.random()-.5)*2,n[o*3+1]=0,n[o*3+2]=(Math.random()-.5)*2,s[o*3]=1,s[o*3+1]=.5+Math.random()*.5,s[o*3+2]=Math.random()*.3):(s[o*3+1]*=.99,s[o*3+2]*=.98);i.geometry.attributes.position.needsUpdate=!0,i.geometry.attributes.color.needsUpdate=!0}class Wp{constructor(t){this.gs=t,this.scene=null,this.camera=null,this.rocket=null,this.phase="walking",this.countdownValue=10,this.countdownTimer=0,this.time=0,this.mode="story",this.astronaut=null,this.walkProgress=0,this.walkPath=[],this.boardingProgress=0,this.boardingPhase="elevator",this._groundOffset=1.87,this.cameraShake=0,this.engineGlow=null,this.smokeParticles=[],this.launchPadLights=[]}async init(t={}){this.mode=t.mode||"story",this.scene=new mn,this.camera=new de(60,window.innerWidth/window.innerHeight,.1,2e3),this.camera.position.set(25,8,30),this.camera.lookAt(0,5,0),window.addEventListener("resize",this._onResize=()=>{this.camera.aspect=window.innerWidth/window.innerHeight,this.camera.updateProjectionMatrix()});const e=document.createElement("canvas");e.width=2,e.height=512;const n=e.getContext("2d"),s=n.createLinearGradient(0,0,0,512);s.addColorStop(0,"#000011"),s.addColorStop(.2,"#001133"),s.addColorStop(.4,"#003366"),s.addColorStop(.6,"#1a5276"),s.addColorStop(.75,"#d35400"),s.addColorStop(.85,"#ff6600"),s.addColorStop(1,"#ff8833"),n.fillStyle=s,n.fillRect(0,0,2,512);const r=new Ts(e);this.scene.background=r;const a=new As(16772829,1.5);a.position.set(50,30,20),a.castShadow=!0,this.scene.add(a),this.scene.add(new Pn(3359829,.6)),this.scene.add(new Ir(8956620,4469538,.4));const o=new Ve(400,400,20,20),c=new B({color:5592388}),l=new P(o,c);l.rotation.x=-Math.PI/2,l.receiveShadow=!0,this.scene.add(l);const h=new Ve(6,120),d=new B({color:4473924}),p=new P(h,d);p.rotation.x=-Math.PI/2,p.position.set(0,.02,30),this.scene.add(p);for(let J=-25;J<=85;J+=6){const bt=new Ve(.3,3),w=new Jt({color:16776960}),x=new P(bt,w);x.rotation.x=-Math.PI/2,x.position.set(0,.03,J),this.scene.add(x)}const m=new dt(20,2,20),g=new B({color:7829350}),y=new P(m,g);y.position.set(0,1,-25),this.scene.add(y);const f=new dt(22,.3,22),u=new B({color:8947831}),S=new P(f,u);S.position.set(0,2.15,-25),this.scene.add(S);const v=new dt(6,3,15),b=new B({color:3355426,side:be}),R=new P(v,b);R.position.set(0,.5,-25),this.scene.add(R);const C=new dt(2,50,2),T=new B({color:10044450}),L=new P(C,T);L.position.set(10,25,-25),this.scene.add(L);for(let J=5;J<50;J+=8){const bt=new dt(10,.5,.5),w=new P(bt,T);w.position.set(5,J,-25),this.scene.add(w)}const W=new dt(10,1,2),_=new P(W,new B({color:8939059}));_.position.set(5,35,-25),this.scene.add(_),this.swingArm=_;const E=new dt(8,.8,1.5),j=new B({color:14540236}),K=new P(E,j);K.position.set(4,32,-25),this.scene.add(K);const I=new Mt(.2,.3,60,6),Y=new B({color:11184810});[[-15,-15],[15,-15],[-15,-35],[15,-35]].forEach(([J,bt])=>{const w=new P(I,Y);w.position.set(J,30,bt),this.scene.add(w)});const V=new Yt(.3,8,8),tt=new Jt({color:16711680});[[-10,2.5,-15],[10,2.5,-15],[-10,2.5,-35],[10,2.5,-35]].forEach(([J,bt,w])=>{const x=new P(V,tt);x.position.set(J,bt,w),this.scene.add(x),this.launchPadLights.push(x)}),this.rocket=tc(),this.rocket.position.set(0,2.5,-25),this.rocket.scale.setScalar(1.3),this.scene.add(this.rocket);for(let J=-1;J<=1;J+=2){const bt=new Mt(.3,.3,15,8),w=new B({color:4487082}),x=new P(bt,w);x.position.set(J*8,7.5,-25),this.scene.add(x)}const q=new dt(15,8,12),Z=new B({color:13421755}),et=new P(q,Z);et.position.set(0,4,75),this.scene.add(et);const ot=new dt(3,4,.2),xt=new B({color:6710869}),Pt=new P(ot,xt);Pt.position.set(0,2.5,69),this.scene.add(Pt);const G=new Ue(2,24),nt=new Jt({color:13226}),mt=new P(G,nt);mt.position.set(0,6,68.9),this.scene.add(mt);const Tt=new te,yt=new dt(3,2,5),vt=new B({color:15658734}),zt=new P(yt,vt);zt.position.y=1.5,Tt.add(zt);const Lt=new Mt(.4,.4,.3,12),N=new B({color:2236962});[[-1.2,.4,-1.8],[1.2,.4,-1.8],[-1.2,.4,1.8],[1.2,.4,1.8]].forEach(([J,bt,w])=>{const x=new P(Lt,N);x.position.set(J,bt,w),x.rotation.z=Math.PI/2,Tt.add(x)}),Tt.position.set(5,0,60),this.scene.add(Tt);for(let J=40;J<=80;J+=5){const bt=new dt(.2,1,.2),w=new B({color:8947848}),x=new P(bt,w);x.position.set(15,.5,J),this.scene.add(x)}for(let J=0;J<6;J++){const bt=new Ip(16777181,2,80,Math.PI/6,.5),w=J/6*Math.PI*2;bt.position.set(Math.cos(w)*30,15,-25+Math.sin(w)*30),bt.target.position.set(0,10,-25),this.scene.add(bt),this.scene.add(bt.target)}const Kt=new dt(25,40,20),ut=new B({color:15658734}),At=new P(Kt,ut);At.position.set(-60,20,30),this.scene.add(At);const U=new Ve(8,5),st=new Jt({color:13226,side:ue}),$=new P(U,st);$.position.set(-47.4,30,30),$.rotation.y=Math.PI/2,this.scene.add($);for(let J=0;J<6;J++){const bt=new dt(8+Math.random()*10,4+Math.random()*8,8+Math.random()*10),w=new B({color:4473907+Math.floor(Math.random()*2236962)}),x=new P(bt,w),X=J/6*Math.PI*2;x.position.set(Math.cos(X)*(60+Math.random()*30),bt.parameters.height/2,Math.sin(X)*(60+Math.random()*30)),this.scene.add(x)}this.walkPath=[new A(0,0,65),new A(0,0,50),new A(0,0,35),new A(0,0,15),new A(0,0,0),new A(0,0,-10),new A(2,2.5,-20),new A(5,2.5,-25),new A(10,2.5,-25)],this._createAstronaut(),this.phase="walking",this.walkProgress=0,this.boardingProgress=0,this.time=0,this._walkMsg1=!1,this._walkMsg2=!1,this._boardMsg1=!1,this._boardMsg2=!1,this._boardMsg3=!1,this.boardingPhase="elevator",this.gs.ui.clear(),this.gs.ui.addGlobalStyles(),this.gs.ui.showCenterText("مركز كينيدي للفضاء","يوم الإطلاق — التوجه إلى منصة الإطلاق",4e3),setTimeout(()=>{this.gs.ui.showComm("مركز التحكم","صباح الخير يا رائد الفضاء! حان وقت التوجه إلى منصة الإطلاق. الصاروخ جاهز ومنتظرك.",6e3)},2e3),this.gs.ui.showControls([{key:"W/↑",action:"المشي للأمام"},{key:"تلقائي",action:"التوجه للصاروخ"}])}_createAstronaut(){this.astronaut=new te;const t=16737792,e=new B({color:t,specular:8930304,shininess:30}),n=new B({color:3355443}),s=new Mt(.32,.28,.85,12),r=new P(s,e);this.astronaut.add(r);const a=new Fe(.2,.04,8,16),o=new B({color:13421772,metalness:.8}),c=new P(a,o);c.position.y=.42,c.rotation.x=Math.PI/2,this.astronaut.add(c);const l=new Yt(.24,16,16),h=new B({color:15790320,specular:11184810,shininess:120}),d=new P(l,h);d.position.y=.58,this.astronaut.add(d);const p=new Yt(.21,16,10,0,Math.PI*2,0,Math.PI*.5),m=new B({color:2241348,specular:8956620,shininess:150,transparent:!0,opacity:.55,envMapIntensity:.8}),g=new P(p,m);g.position.y=.6,g.rotation.x=Math.PI*.25,this.astronaut.add(g);const y=new Yt(.16,8,8),f=new B({color:5583633}),u=new P(y,f);u.position.set(0,.56,-.02),this.astronaut.add(u),this._arms=[],[-1,1].forEach(Kt=>{const ut=new te;ut.position.set(Kt*.35,.15,0),ut.userData.side=Kt,ut.userData.isArm=!0;const At=new Mt(.09,.08,.32,8),U=new P(At,e);U.position.y=-.16,ut.add(U);const st=new Mt(.075,.065,.3,8),$=new P(st,e);$.position.y=-.4,ut.add($);const J=new Yt(.065,8,8),bt=new P(J,n);bt.position.y=-.55,ut.add(bt);const w=new Fe(.06,.015,6,12),x=new P(w,o);x.position.y=-.47,x.rotation.x=Math.PI/2,ut.add(x),this.astronaut.add(ut),this._arms.push(ut)}),this._legs=[],[-1,1].forEach(Kt=>{const ut=new te;ut.position.set(Kt*.14,-.42,0),ut.userData.side=Kt,ut.userData.isLeg=!0;const At=new Mt(.11,.1,.35,8),U=new P(At,e);U.position.y=-.17,ut.add(U);const st=new Mt(.095,.085,.35,8),$=new P(st,e);$.position.y=-.5,ut.add($);const J=new dt(.14,.1,.22),bt=new P(J,n);bt.position.set(0,-.7,.02),ut.add(bt),this.astronaut.add(ut),this._legs.push(ut)});const S=new dt(.06,.04,.04),v=new Jt({color:65280}),b=new P(S,v);b.position.set(-.45,-.25,.06),this.astronaut.add(b);const R=new Ue(.07,16),C=new Jt({color:13226}),T=new P(R,C);T.position.set(.15,.18,-.28),this.astronaut.add(T);const L=new Ve(.08,.05),W=new Jt({color:13369344,side:ue}),_=new P(L,W);_.position.set(-.42,.08,0),_.rotation.y=Math.PI/2,this.astronaut.add(_);const E=new Ue(.05,12),j=new Jt({color:16763904}),K=new P(E,j);K.position.set(.42,.08,0),K.rotation.y=-Math.PI/2,this.astronaut.add(K);const I=new Mt(.03,.03,.06,8),Y=new B({color:8947848}),V=new P(I,Y);V.position.set(-.1,.05,-.3),V.rotation.x=Math.PI/2,this.astronaut.add(V);const tt=new Yt(.16,12,12,0,Math.PI*2,0,Math.PI*.55),q=new B({color:13935988}),Z=new P(tt,q);Z.position.set(0,.56,.04),Z.rotation.x=Math.PI*.15,this.astronaut.add(Z);const et=new dt(.38,.42,.16),ot=new B({color:14505216}),xt=new P(et,ot);xt.position.set(0,.1,.27),this.astronaut.add(xt),[-1,1].forEach(Kt=>{const ut=new dt(.03,.55,.025),At=new P(ut,n);At.position.set(Kt*.12,.15,.12),this.astronaut.add(At)});const Pt=new Fe(.06,.015,6,12,Math.PI),G=new P(Pt,o);G.position.set(0,.33,.27),this.astronaut.add(G);const nt=new Fe(.27,.025,6,24),mt=new B({color:4473924}),Tt=new P(nt,mt);Tt.position.y=-.3,Tt.rotation.x=Math.PI/2,this.astronaut.add(Tt),[-1,1].forEach(Kt=>{const ut=new dt(.06,.08,.05),At=new P(ut,n);At.position.set(Kt*.25,-.3,-.08),this.astronaut.add(At)});const yt=new Mt(.008,.008,.15,6),vt=new B({color:11184810}),zt=new P(yt,vt);zt.position.set(-.3,.5,0),zt.rotation.z=Math.PI*.15,this.astronaut.add(zt);const Lt=new Yt(.015,6,6),N=new P(Lt,new Jt({color:16711680}));N.position.set(-.32,.57,0),this.astronaut.add(N),this.astronaut.scale.setScalar(1.6),this.astronaut.position.copy(this.walkPath[0]),this.astronaut.position.y+=this._groundOffset,this.scene.add(this.astronaut)}_getPathPosition(t){t=Math.max(0,Math.min(1,t));const e=this.walkPath.length-1,n=Math.min(Math.floor(t*e),e-1),s=t*e-n,r=this.walkPath[n],a=this.walkPath[n+1];return new A().lerpVectors(r,a,s)}_showBriefing(){this.gs.ui.clear();const t=this.mode==="free"?"مهمة حرة — استكشاف المحطة":"المهمة: رحلة إلى محطة الفضاء الدولية";this.gs.ui.addElement("briefing",`
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;direction:rtl;">
        <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.5) 100%);pointer-events:none;"></div>
        <div style="background:rgba(0,0,0,0.9);border:1px solid rgba(255,149,0,0.2);
          border-top:2px solid #ff9500;border-radius:2px;
          padding:28px 36px;max-width:520px;color:rgba(200,210,220,0.85);position:relative;z-index:2;
          box-shadow:0 8px 40px rgba(0,0,0,0.5);">
          <div style="font-family:'Orbitron',sans-serif;color:#ff9500;font-size:1.3rem;margin-bottom:14px;
            text-align:center;letter-spacing:2px;text-shadow:0 0 30px rgba(255,149,0,0.3);">
            📋 إحاطة المهمة
          </div>
          <div style="font-size:1.05rem;color:#fff;margin-bottom:10px;text-align:center;
            font-family:'Tajawal',sans-serif;font-weight:600;">${t}</div>
          <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,149,0,0.15),transparent);margin:14px 0;"></div>
          <div style="line-height:1.9;font-size:0.88rem;font-family:'Tajawal',sans-serif;">
            <div>🎯 <strong>الهدف:</strong> الوصول إلى محطة الفضاء الدولية وتنفيذ المهام العلمية</div>
            <div>🚀 <strong>المركبة:</strong> كبسولة فضائية متعددة المراحل</div>
            <div>⏱️ <strong>مدة المهمة:</strong> ${this.mode==="free"?"غير محددة":"72 ساعة"}</div>
            <div>👨‍🚀 <strong>رائد الفضاء:</strong> ${this.gs.playerData.name}</div>
          </div>
          <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,149,0,0.15),transparent);margin:14px 0;"></div>
          <div style="font-size:0.8rem;color:rgba(0,255,120,0.6);">
            <div>✓ البدلة — تم الارتداء</div>
            <div>✓ الفحص الطبي — مكتمل</div>
            <div>✓ الحقيبة المدارية — جاهزة</div>
            <div>✓ أنظمة المركبة — فحص أرضي مكتمل</div>
          </div>
          <div style="text-align:center;margin-top:18px;">
            <button class="menu-btn menu-btn-primary" style="display:inline-flex;width:auto;padding:11px 32px;" id="btn-start-boarding">
              <div class="menu-btn-icon" style="font-size:1rem;">🛗</div>
              <div class="menu-btn-text"><div class="menu-btn-title" style="font-size:0.95rem;">ركوب المصعد إلى الكبسولة</div></div>
            </button>
          </div>
        </div>
      </div>
    `),setTimeout(()=>{var e;(e=document.getElementById("btn-start-boarding"))==null||e.addEventListener("click",()=>{this.gs.audio.playConfirm(),this._startBoarding()})},100)}_startBoarding(){this.gs.ui.clear(),this.phase="boarding",this.boardingProgress=0,this.gs.ui.showCenterText("ركوب المصعد","الصعود إلى مستوى ذراع الوصول...",3e3),this.gs.ui.showComm("فني المنصة","المصعد جاهز. سنصعد إلى ذراع الوصول — ارتفاع 65 متر.",5e3),this._elevatorCage=new te;const t=new P(new dt(3,.1,3),new B({color:6710869}));this._elevatorCage.add(t);const e=new B({color:8947831});[[-1.4,0],[1.4,0],[-1.4,-1.4],[1.4,-1.4],[-1.4,1.4],[1.4,1.4]].forEach(([s,r])=>{const a=new P(new Mt(.05,.05,3,6),e);a.position.set(s,1.5,r),this._elevatorCage.add(a)});const n=new P(new dt(3,.08,3),new B({color:6710869}));n.position.y=3,this._elevatorCage.add(n),this._elevatorCage.position.set(10,2.5,-25),this.scene.add(this._elevatorCage)}_startSystemsCheck(){this.gs.ui.clear(),this.phase="systems";let t=0;const e=[{name:"أنظمة الملاحة",status:"جاهز",icon:"🧭"},{name:"أنظمة الاتصالات",status:"جاهز",icon:"📡"},{name:"نظام دعم الحياة",status:"جاهز",icon:"🫁"},{name:"المحركات الرئيسية",status:"جاهز",icon:"⚙️"},{name:"المعززات الجانبية",status:"جاهز",icon:"🔥"},{name:"نظام الوقود (LOX/RP-1)",status:"مكتمل 100%",icon:"⛽"},{name:"الدرع الحراري (PICA-X)",status:"سليم",icon:"🛡️"},{name:"مظلات الهبوط (3 رئيسية + 2 كبح)",status:"جاهز",icon:"🪂"},{name:"نظام الطوارئ (LES)",status:"مسلح",icon:"🚨"},{name:"كبسولة الطاقم — ضغط المقصورة",status:"14.7 PSI",icon:"🔒"}];this.gs.ui.addElement("systems-check",`
      <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
        background:rgba(0,0,0,0.9);border:1px solid rgba(255,149,0,0.2);
        border-top:2px solid #ff9500;border-radius:2px;
        padding:24px 32px;min-width:420px;direction:rtl;
        box-shadow:0 8px 40px rgba(0,0,0,0.5);">
        <div style="font-family:'Orbitron',sans-serif;color:#ff9500;font-size:1.1rem;margin-bottom:14px;
          text-align:center;letter-spacing:2px;text-shadow:0 0 30px rgba(255,149,0,0.3);">
          🔍 فحص أنظمة ما قبل الإطلاق
        </div>
        <div id="check-list" style="font-size:0.85rem;line-height:2;font-family:'Tajawal',sans-serif;"></div>
        <div id="check-status" style="text-align:center;margin-top:10px;color:rgba(100,150,200,0.5);font-size:0.78rem;
          font-family:'Tajawal',sans-serif;">جاري الفحص...</div>
      </div>
    `),this._systemsCheckInterval=setInterval(()=>{if(t>=e.length){clearInterval(this._systemsCheckInterval),this._systemsCheckInterval=null;const r=document.getElementById("check-status");r&&(r.innerHTML='<span style="color:rgba(0,255,120,0.8);">جميع الأنظمة جاهزة للإطلاق ✓</span>'),setTimeout(()=>{this.gs.audio.playConfirm(),this.gs.ui.showComm("مدير الإطلاق","جميع الأنظمة GO. بدء العد التنازلي النهائي!",4e3),this._startCountdown()},1500);return}const n=e[t];this.gs.audio.playBeep();const s=document.getElementById("check-list");s&&(s.innerHTML+=`<div style="color:rgba(0,255,120,0.7);">${n.icon} ${n.name} — <span style="color:rgba(100,255,150,0.8);">${n.status}</span></div>`),t++},400)}_startCountdown(){this.gs.ui.clear(),this.phase="countdown",this.countdownValue=10,this.countdownTimer=0,this.gs.ui.addElement("countdown",`
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;">
        <div style="font-family:'Orbitron',sans-serif;color:rgba(255,120,0,0.7);font-size:0.8rem;margin-bottom:10px;
          letter-spacing:4px;text-transform:uppercase;">LAUNCH COUNTDOWN</div>
        <div style="font-family:'Tajawal',sans-serif;color:rgba(255,200,100,0.6);font-size:0.85rem;margin-bottom:15px;">
          العد التنازلي للإقلاع
        </div>
        <div id="countdown-num" style="font-family:'Orbitron',sans-serif;font-size:9rem;color:#fff;font-weight:900;
          text-shadow:0 0 80px rgba(255,100,0,0.6), 0 0 160px rgba(255,50,0,0.3);">10</div>
        <div id="countdown-status" style="color:rgba(255,200,80,0.8);font-size:0.9rem;margin-top:12px;
          font-family:'Tajawal',sans-serif;">T-10 — جميع الأنظمة GO</div>
      </div>
    `),this.gs.ui.showComm("مركز التحكم","T-10 ثوانٍ. حظاً سعيداً يا رائد الفضاء! نراك في المدار.",4e3)}update(t){if(this.time+=t,this.launchPadLights.forEach(e=>{e.material.opacity=Math.sin(this.time*4)>0?1:.2,e.material.transparent=!0}),this.phase==="walking"){const e=this.gs.input.isForward()?.08:.04;this.walkProgress=Math.min(1,this.walkProgress+t*e);const n=this._getPathPosition(this.walkProgress);this.astronaut.position.copy(n),this.astronaut.position.y=n.y+this._groundOffset+Math.abs(Math.sin(this.time*5))*.05;const s=this.time*4.5;if(this._legs&&this._legs.forEach(o=>{const c=o.userData.side*Math.PI;o.rotation.x=Math.sin(s+c)*.35}),this._arms&&this._arms.forEach(o=>{const c=o.userData.side*Math.PI+Math.PI;o.rotation.x=Math.sin(s+c)*.25,o.rotation.z=o.userData.side*.08}),this.astronaut.rotation.z=Math.sin(s)*.02,this.walkProgress<.99){const c=this._getPathPosition(Math.min(1,this.walkProgress+.02)).clone().sub(n);c.length()>.01&&(this.astronaut.rotation.y=Math.atan2(c.x,c.z))}const r=new A(8,4,12),a=n.clone().add(r);this.camera.position.lerp(a,t*2),this.camera.lookAt(n.clone().add(new A(0,2,0))),this.walkProgress>.3&&!this._walkMsg1&&(this._walkMsg1=!0,this.gs.ui.showComm("مركز التحكم","رائد الفضاء في الطريق إلى المنصة. الطقس مثالي للإطلاق.",4e3)),this.walkProgress>.6&&!this._walkMsg2&&(this._walkMsg2=!0,this.gs.ui.showComm("مركز التحكم","اقتربت من منصة الإطلاق. الصاروخ بانتظارك.",4e3)),this.gs.ui.removeElement("walk-progress"),this.gs.ui.addElement("walk-progress",`
        <div style="position:fixed;bottom:80px;left:50%;transform:translateX(-50%);text-align:center;direction:rtl;">
          <div style="background:rgba(0,0,0,0.85);padding:10px 20px;border-radius:2px;border:1px solid rgba(255,149,0,0.15);">
            <div style="color:rgba(255,200,150,0.7);font-size:0.8rem;margin-bottom:6px;
              font-family:'Tajawal',sans-serif;">المسافة إلى منصة الإطلاق</div>
            <div style="width:220px;height:3px;background:rgba(255,255,255,0.06);border-radius:2px;margin:0 auto;">
              <div style="width:${this.walkProgress*100}%;height:100%;
                background:linear-gradient(90deg,rgba(255,149,0,0.3),#ff9500,rgba(255,149,0,0.3));
                border-radius:2px;transition:width 0.3s;box-shadow:0 0 8px rgba(255,149,0,0.4);"></div>
            </div>
            <div style="color:rgba(255,149,0,0.3);font-size:0.65rem;margin-top:5px;
              font-family:'Tajawal',sans-serif;">اضغط W للمشي أسرع</div>
          </div>
        </div>
      `),this.walkProgress>=1&&(this.gs.ui.removeElement("walk-progress"),this.gs.audio.playConfirm(),this.gs.ui.showCenterText("وصلت إلى برج الإطلاق","جاري تحضير إحاطة المهمة...",3e3),this.phase="arrived",setTimeout(()=>{this._showBriefing()},3500))}if(this.phase==="boarding"){if(this.boardingProgress+=t*.12,this.boardingPhase==="elevator"){const s=Math.min(1,this.boardingProgress),r=s<.5?2*s*s:1-Math.pow(-2*s+2,2)/2,a=se.lerp(2.5,32,r);this.astronaut.position.set(10,a+this._groundOffset,-25),this.astronaut.rotation.y=-Math.PI/2,this._elevatorCage&&(this._elevatorCage.position.y=a),this._legs&&this._legs.forEach(o=>{o.rotation.x=0}),this._arms&&this._arms.forEach(o=>{o.rotation.x=0,o.rotation.z=o.userData.side*.05}),this.camera.position.lerp(new A(22,a+5,-15),t*2),this.camera.lookAt(new A(10,a,-25)),!this._boardMsg1&&this.boardingProgress>.2&&(this._boardMsg1=!0,this.gs.ui.showComm("فني المنصة","نصعد الآن... الارتفاع "+Math.floor(a)+" متر. منظر رائع من هنا!",4e3)),this.gs.ui.removeElement("boarding-progress"),this.gs.ui.addElement("boarding-progress",`
          <div style="position:fixed;bottom:80px;left:50%;transform:translateX(-50%);text-align:center;direction:rtl;">
            <div style="background:rgba(0,0,0,0.85);padding:10px 20px;border-radius:2px;border:1px solid rgba(255,149,0,0.15);">
              <div style="color:rgba(255,200,150,0.7);font-size:0.8rem;margin-bottom:6px;
                font-family:'Tajawal',sans-serif;">🛗 المصعد — الارتفاع: ${Math.floor(a)} متر</div>
              <div style="width:220px;height:3px;background:rgba(255,255,255,0.06);border-radius:2px;margin:0 auto;">
                <div style="width:${s*100}%;height:100%;
                  background:linear-gradient(90deg,rgba(255,149,0,0.3),#ff9500,rgba(255,149,0,0.3));
                  border-radius:2px;box-shadow:0 0 8px rgba(255,149,0,0.4);"></div>
              </div>
            </div>
          </div>
        `),this.boardingProgress>=1&&(this.boardingPhase="access_arm",this.boardingProgress=0,this.gs.ui.removeElement("boarding-progress"),this.gs.audio.playConfirm(),this.gs.ui.showCenterText("ذراع الوصول","المشي عبر ذراع الوصول إلى فتحة الكبسولة",3e3),this._elevatorCage&&(this.scene.remove(this._elevatorCage),this._elevatorCage=null))}else if(this.boardingPhase==="access_arm"){const e=Math.min(1,this.boardingProgress*1.5),n=se.lerp(10,2,e);this.astronaut.position.set(n,32+this._groundOffset,-25),this.astronaut.rotation.y=Math.PI;const s=this.time*4.5;this._legs&&this._legs.forEach(r=>{r.rotation.x=Math.sin(s+r.userData.side*Math.PI)*.3}),this._arms&&this._arms.forEach(r=>{r.rotation.x=Math.sin(s+r.userData.side*Math.PI+Math.PI)*.2,r.rotation.z=r.userData.side*.08}),this.astronaut.rotation.z=Math.sin(s)*.015,this.camera.position.lerp(new A(15,35,-18),t*1.5),this.camera.lookAt(new A(5,32,-25)),!this._boardMsg2&&this.boardingProgress>.3&&(this._boardMsg2=!0,this.gs.ui.showComm("فني المنصة","الكبسولة أمامك مباشرة. استعد لدخول الفتحة.",4e3)),this.boardingProgress>=.7&&(this.boardingPhase="entering",this.boardingProgress=0,this.gs.ui.showCenterText("دخول الكبسولة","الدخول عبر فتحة الكبسولة وتأمين المقعد",3e3))}else if(this.boardingPhase==="entering"){const e=Math.min(1,this.boardingProgress*1.5),n=se.lerp(1.6,.3,e);this.astronaut.position.set(se.lerp(2,0,e),se.lerp(32+this._groundOffset,33,e*.5),-25),this.astronaut.scale.setScalar(n),this.astronaut.rotation.x=e*-.6,this.astronaut.rotation.z=0,this._legs&&this._legs.forEach(s=>{s.rotation.x=0}),this._arms&&this._arms.forEach(s=>{s.rotation.x=-.3*e,s.rotation.z=s.userData.side*.15}),this.camera.position.lerp(new A(8,34,-20),t*2),this.camera.lookAt(new A(1,32,-25)),!this._boardMsg3&&this.boardingProgress>.2&&(this._boardMsg3=!0,this.gs.ui.showComm("فني المنصة","مرحباً بك في الكبسولة! سأساعدك في تأمين أحزمة الأمان.",5e3)),this.boardingProgress>=.7&&(this.astronaut.visible=!1,this.astronaut.scale.setScalar(1.6),this.astronaut.rotation.x=0,this.gs.audio.playConfirm(),this.gs.ui.showCenterText("داخل الكبسولة","إغلاق الفتحة — بدء فحص الأنظمة",3e3),this.phase="seated",setTimeout(()=>{this.gs.ui.showComm("مركز التحكم","الفتحة مغلقة ومؤمنة. بدء فحص أنظمة ما قبل الإطلاق.",5e3),this._startSystemsCheck()},4e3))}}if(this.phase==="countdown"){if(this.countdownTimer+=t,this.countdownTimer>=1){this.countdownTimer=0,this.countdownValue--,this.gs.audio.playCountdown();const e=document.getElementById("countdown-num"),n=document.getElementById("countdown-status");e&&(e.textContent=Math.max(0,this.countdownValue)),this.countdownValue===7&&n&&(n.textContent="T-7 — سحب ذراع الوصول"),this.countdownValue===5&&n&&(n.textContent="T-5 — تشغيل المحركات الرئيسية",n.style.color="#ff8800",this.cameraShake=.3),this.countdownValue===3&&n&&(n.textContent="T-3 — المحركات بالطاقة الكاملة",n.style.color="#ff4400",this.cameraShake=.8),this.countdownValue===1&&n&&(n.textContent="T-1 — إطلاق المشابك!",n.style.color="#ff0000",this.cameraShake=1.5),this.countdownValue<=0&&(this.gs.audio.playConfirm(),setTimeout(()=>{this.gs.switchScene("launch",{mode:this.mode})},500))}this.cameraShake>0&&(this.camera.position.x=15+(Math.random()-.5)*this.cameraShake,this.camera.position.y=12+(Math.random()-.5)*this.cameraShake)}this.phase==="briefing"||this.phase==="systems"||this.phase==="arrived"||this.phase==="seated"?(this.camera.position.lerp(new A(15,14,20),t*.5),this.camera.lookAt(0,10,-25)):this.phase==="countdown"&&(this.countdownValue>5?(this.camera.position.lerp(new A(10,10,-10),t*.5),this.camera.lookAt(0,12,-25)):(this.camera.position.lerp(new A(20,5,-10),t*.8),this.camera.lookAt(0,8,-25))),this.swingArm&&this.phase==="countdown"&&this.countdownValue<=7&&(this.swingArm.rotation.y=se.lerp(this.swingArm.rotation.y,Math.PI/3,t*.5))}render(t){t.render(this.scene,this.camera)}async cleanup(){window.removeEventListener("resize",this._onResize),this._systemsCheckInterval&&(clearInterval(this._systemsCheckInterval),this._systemsCheckInterval=null),this._elevatorCage&&(this.scene.remove(this._elevatorCage),this._elevatorCage=null),this.gs.ui.clear()}}class Xp{constructor(t){this.gs=t,this.scene=null,this.camera=null,this.rocket=null,this.exhaust=null,this.earth=null,this.phase="liftoff",this.time=0,this.altitude=0,this.speed=0,this.rocketY=0,this.shakeIntensity=0,this.rumbleSound=null,this.mode="story",this.boostersSeparated=!1}async init(t={}){this.mode=t.mode||"story",this.scene=new mn,this.camera=new de(70,window.innerWidth/window.innerHeight,.1,5e3),this.camera.position.set(10,5,20),window.addEventListener("resize",this._onResize=()=>{this.camera.aspect=window.innerWidth/window.innerHeight,this.camera.updateProjectionMatrix()}),this.stars=Cn(6e3),this.scene.add(this.stars),this.earth=jn(200),this.earth.position.set(0,-200,0),this.scene.add(this.earth);const e=new As(16772829,2);e.position.set(100,100,50),this.scene.add(e),this.scene.add(new Pn(3359829,.4)),this.rocket=tc(),this.scene.add(this.rocket),this.exhaust=Hp(800),this.exhaust.position.copy(this.rocket.position),this.exhaust.position.y-=2,this.scene.add(this.exhaust),this.smokeParticles=this._createSmoke(),this.scene.add(this.smokeParticles),this.phase="liftoff",this.time=0,this.altitude=0,this.speed=0,this.rocketY=0,this.shakeIntensity=1,this.boostersSeparated=!1,this.scene.background=new Ct(1297),this.rumbleSound=this.gs.audio.playLaunchRumble(30),this.gs.ui.clear(),this.gs.ui.addGlobalStyles(),this.gs.ui.showCenterText("إطلاق!","بدء الصعود",2e3),setTimeout(()=>{this.gs.ui.showComm("مركز التحكم","الإقلاع تم بنجاح! جميع المحركات تعمل بكامل طاقتها.",4e3)},2500)}_createSmoke(){const e=new ee,n=new Float32Array(300*3),s=new Float32Array(300*3);for(let a=0;a<300;a++)n[a*3]=(Math.random()-.5)*20,n[a*3+1]=Math.random()*5,n[a*3+2]=(Math.random()-.5)*20,s[a*3]=.7,s[a*3+1]=.7,s[a*3+2]=.7;e.setAttribute("position",new Zt(n,3)),e.setAttribute("color",new Zt(s,3));const r=new Ze({size:3,vertexColors:!0,transparent:!0,opacity:.5,depthWrite:!1});return new en(e,r)}update(t){this.time+=t;const e=this.phase==="liftoff"?15:this.phase==="ascending"?25:30;if(this.speed+=e*t,this.speed=Math.min(this.speed,300),this.rocketY+=this.speed*t,this.altitude=this.rocketY*.1,this.rocket.position.y=this.rocketY,this.exhaust.position.x=this.rocket.position.x,this.exhaust.position.y=this.rocket.position.y-3,this.exhaust.position.z=this.rocket.position.z,Vp(this.exhaust,t,1+this.speed*.01),this.smokeParticles){const a=this.smokeParticles.geometry.attributes.position.array;for(let o=0;o<a.length;o+=3)a[o]+=(Math.random()-.5)*t*5,a[o+1]+=t*2;this.smokeParticles.geometry.attributes.position.needsUpdate=!0,this.smokeParticles.material.opacity=Math.max(0,.5-this.time*.05)}if(this.altitude>5&&this.phase==="liftoff"&&(this.phase="ascending",this.gs.ui.showComm("مركز التحكم","الصعود مستمر. سرعة وارتفاع في ازدياد.",3e3)),this.altitude>12&&this.phase==="ascending"&&(this.phase="maxq",this.shakeIntensity=2,this.gs.ui.showCenterText("Max-Q","أقصى ضغط ديناميكي",2e3),this.gs.ui.showComm("مركز التحكم","Max-Q! اجتياز أقصى ضغط ديناميكي.",3e3)),this.altitude>25&&!this.boostersSeparated){this.boostersSeparated=!0,this.phase="separation",this.gs.audio.playConfirm(),this.gs.ui.showCenterText("انفصال المعززات","Booster Separation",2500);const a=this.rocket.userData.boosters;a&&a.forEach((o,c)=>{const l=c===0?-1:1,h=()=>{o.position.x+=l*.5,o.position.y-=.3,o.rotation.z+=l*.02,Math.abs(o.position.x)<30?requestAnimationFrame(h):o.visible=!1};h()})}this.altitude>60&&this.phase==="separation"&&(this.phase="orbit",this.shakeIntensity=.3,this.gs.ui.showCenterText("الوصول إلى المدار","انعدام الجاذبية",3e3),this.gs.ui.showComm("مركز التحكم","إيقاف المحركات الرئيسية. أنت الآن في المدار! استعد للملاحة نحو المحطة.",5e3),setTimeout(()=>{this.gs.switchScene("spaceNavigation",{mode:this.mode})},5e3));const n=this.rocketY+5;this.camera.position.y=se.lerp(this.camera.position.y,n,t*2),this.shakeIntensity>0&&(this.camera.position.x=10+(Math.random()-.5)*this.shakeIntensity,this.camera.position.z=20+(Math.random()-.5)*this.shakeIntensity,this.phase==="orbit"&&(this.shakeIntensity*=.98)),this.camera.lookAt(this.rocket.position);const s=Math.min(1,this.altitude/80),r=new Ct().lerpColors(new Ct(4403),new Ct(5),s);this.scene.background=r,this.gs.ui.showHUD({fuel:Math.max(0,100-this.time*2),oxygen:100,energy:100,speed:Math.round(this.speed*10),altitude:Math.round(this.altitude)}),this.earth.position.y=-200-this.rocketY*.5,this.earth.rotation.y+=t*.01}render(t){t.render(this.scene,this.camera)}async cleanup(){if(window.removeEventListener("resize",this._onResize),this.rumbleSound)try{this.rumbleSound.source.stop()}catch{}this.gs.ui.clear()}}function Ur(){const i=new te,t=new B({color:13421772,specular:4473924,shininess:60}),e=new B({color:8947848}),n=new B({color:13412932,specular:16768392,shininess:80}),s=new dt(50,1.2,1.2),r=new P(s,e);i.add(r),[{l:8,r:2,y:0,z:0,x:0,color:14540253},{l:6,r:1.8,y:0,z:0,x:-5,color:13421772},{l:7,r:1.8,y:0,z:0,x:5,color:12303291},{l:6,r:1.8,y:0,z:3.5,x:0,color:14540236},{l:6,r:1.8,y:0,z:-3.5,x:0,color:13426124},{l:5,r:1.6,y:0,z:0,x:-9,color:13421755},{l:5,r:1.6,y:0,z:0,x:-13,color:12303274},{l:4,r:1.5,y:0,z:3,x:-5,color:14535867},{l:4,r:1.5,y:2.5,z:0,x:2,color:13426141}].forEach(L=>{const W=new Mt(L.r,L.r,L.l,16),_=new B({color:L.color,specular:4473924,shininess:50}),E=new P(W,_);E.rotation.z=Math.PI/2,E.position.set(L.x,L.y,L.z),i.add(E);const j=new Yt(L.r*.6,12,12);if(L.z!==0||L.y!==0){const K=new P(j,e);K.position.set(L.x,0,0),i.add(K)}});const o=new dt(6,.05,15),c=new B({color:1713022,specular:3355647,shininess:100,emissive:657982,emissiveIntensity:.1});[{x:-20,z:0},{x:-14,z:0},{x:14,z:0},{x:20,z:0}].forEach(L=>{const W=new P(o,c);W.position.set(L.x,1,L.z+8),i.add(W);const _=new P(o,c);_.position.set(L.x,1,L.z-8),i.add(_);const E=new Mt(.1,.1,16,6),j=new P(E,e);j.position.set(L.x,1,L.z),j.rotation.x=Math.PI/2,i.add(j)});const h=new dt(4,.05,8);[{x:-10,y:-1.5},{x:10,y:-1.5}].forEach(L=>{const W=new P(h,n);W.position.set(L.x,L.y,0),i.add(W)});const d=new Yt(1,16,16,0,Math.PI*2,0,Math.PI*.5),p=new B({color:8961023,transparent:!0,opacity:.5,specular:16777215,shininess:100}),m=new P(d,p);m.position.set(2,-2.5,0),m.rotation.x=Math.PI,i.add(m);const g=new Mt(.5,.5,1.5,12),y=new B({color:6710886,emissive:1118481}),f=[{x:8.5,y:0,z:0,rx:0,rz:Math.PI/2},{x:-16,y:0,z:0,rx:0,rz:Math.PI/2},{x:2,y:3.5,z:0,rx:0,rz:0}],u=[];f.forEach(L=>{const W=new P(g,y);W.position.set(L.x,L.y,L.z),W.rotation.set(L.rx,0,L.rz),i.add(W),u.push(W);const _=new Fe(.5,.08,8,16),E=new P(_,new B({color:65280,emissive:17408}));E.position.copy(W.position),L.rz?(E.rotation.y=Math.PI/2,E.position.x+=L.x>0?.8:-.8):(E.rotation.x=Math.PI/2,E.position.y+=.8),i.add(E)});const S=new Mt(.08,.08,8,6),v=new B({color:15658734}),b=new P(S,v);b.position.set(5,2,2),b.rotation.z=Math.PI/6,i.add(b);const R=new P(S,v);R.position.set(8,4,2),R.rotation.z=-Math.PI/4,i.add(R);const C=new Mt(.03,.03,3,6),T=new B({color:14540253});for(let L=0;L<4;L++){const W=new P(C,T);W.position.set(-5+L*3,3,0),i.add(W);const _=new Ue(.4,12),E=new P(_,t);E.position.set(-5+L*3,4.5,0),i.add(E)}return i.userData.dockPorts=u,i}function qp(){const i=new te,t=new B({color:14540236,side:be}),e=new B({color:4478310}),n=new B({color:1122867,emissive:13158,emissiveIntensity:.5}),s=new B({color:8947848}),r=new B({color:3359829}),a=new B({color:6710869}),o=new Mt(3,3,56,16,1,!0),c=new P(o,t);c.rotation.z=Math.PI/2,i.add(c);const l=new Ue(3,16),h=new B({color:12303274,side:ue}),d=new P(l,h);d.position.set(-28,0,0),d.rotation.y=Math.PI/2,i.add(d);const p=new P(l,h);p.position.set(28,0,0),p.rotation.y=-Math.PI/2,i.add(p);const m=new Mt(3,3,24,16,1,!0),g=new P(m,t);g.rotation.x=Math.PI/2,i.add(g);const y=new P(l,h);y.position.set(0,0,12),i.add(y);const f=new P(l,h);f.position.set(0,0,-12),f.rotation.y=Math.PI,i.add(f);const u=new B({color:8947831,emissive:1118464,emissiveIntensity:.1});[[-3,0],[3,0]].forEach(([U])=>{const st=new Fe(2.5,.15,8,16),$=new P(st,u);$.position.set(U,0,0),$.rotation.y=Math.PI/2,i.add($)}),[[0,-3],[0,3]].forEach(([U,st])=>{const $=new Fe(2.5,.15,8,16),J=new P($,u);J.position.set(0,0,st),i.add(J)});for(let U=-26;U<=26;U+=2){const st=new dt(.05,.01,5),$=new P(st,a);$.position.set(U,-2.9,0),i.add($)}for(let U=-11;U<=11;U+=2){const st=new dt(5,.01,.05),$=new P(st,a);$.position.set(0,-2.9,U),i.add($)}const S=new B({color:13421568});for(let U=-1;U<=1;U+=2){const st=new Mt(.04,.04,54,6),$=new P(st,S);$.rotation.z=Math.PI/2,$.position.set(0,0,U*2.8),i.add($)}for(let U=-1;U<=1;U+=2){const st=new Mt(.04,.04,22,6),$=new P(st,S);$.rotation.x=Math.PI/2,$.position.set(U*2.8,0,0),i.add($)}for(let U=-2;U<=2;U+=1.5){const st=new Mt(.05,.05,54,6),$=new P(st,s);$.rotation.z=Math.PI/2,$.position.set(0,2.7,U),i.add($)}for(let U=-2;U<=2;U+=1.5){const st=new Mt(.05,.05,22,6),$=new P(st,s);$.rotation.x=Math.PI/2,$.position.set(U,2.7,0),i.add($)}for(let U=0;U<6;U++){const st=new Mt(.08,.08,54,6),$=new P(st,r);$.rotation.z=Math.PI/2,$.position.set(0,-2.7+U%2*.2,-2+U*.8),i.add($)}const v=new Jt({color:16777215});for(let U=-26;U<=26;U+=4){const st=new dt(3,.05,.4),$=new P(st,v);$.position.set(U,2.95,0),i.add($);const J=new We(16772829,.8,10);J.position.set(U,2.5,0),i.add(J);const bt=new We(11193599,.3,6);bt.position.set(U,0,2.8),i.add(bt)}for(let U=-10;U<=10;U+=4){if(Math.abs(U)<3)continue;const st=new dt(.4,.05,3),$=new P(st,v);$.position.set(0,2.95,U),i.add($);const J=new We(16772829,.8,10);J.position.set(0,2.5,U),i.add(J)}for(let U=-24;U<=24;U+=4){if(Math.abs(U)<4)continue;const st=new dt(3.5,.3,2);if([-1,1].forEach($=>{const J=new P(st,e);J.position.set(U,$*2.5,0),J.rotation.z=$*.2,i.add(J);for(let bt=0;bt<3;bt++){const w=new dt(.8,.1,.4),x=new P(w,new B({color:[13158,3368448,6697728][bt],emissive:[8772,2245632,4465152][bt],emissiveIntensity:.5}));x.position.set(U-1+bt,$*2.3,.3),i.add(x)}}),U%8===0){const $=new dt(1.5,.05,1),J=new P($,n);J.position.set(U,0,2.8),J.rotation.x=.1,i.add(J)}}for(let U=16;U<=24;U+=4){const st=new dt(3,.06,1.8),$=new P(st,new B({color:662058,emissive:17544,emissiveIntensity:.6}));$.position.set(U,.5,2.75),i.add($);const J=new We(26316,.4,4);J.position.set(U,.5,2.2),i.add(J)}const b=new dt(8,.8,2),R=new P(b,new B({color:3359829}));R.position.set(20,-1.5,0),R.rotation.x=-.2,i.add(R);for(let U=0;U<12;U++){const st=new Yt(.08,8,8),$=new B({color:[16724787,3407667,3355647,16777011][U%4],emissive:[4456448,17408,68,4473856][U%4],emissiveIntensity:.5}),J=new P(st,$);J.position.set(17+U%6,-1.1,-.5+Math.floor(U/6)*.4),i.add(J)}const C=new dt(4,.1,2.5),T=new B({color:5596791});[-22,-18].forEach(U=>{const st=new P(C,T);st.position.set(U,-1,0),i.add(st)});const L=new P(new dt(.5,.4,.4),new B({color:3355443}));L.position.set(-22,-.7,0),i.add(L);const W=new P(new Mt(.06,.06,1,8),new B({color:4473924}));W.position.set(-22,-.1,0),i.add(W);const _=new P(new Mt(.12,.08,.3,8),new B({color:2236962}));_.position.set(-22,.5,.1),_.rotation.x=-.5,i.add(_);const E=new dt(1.2,.8,.8),j=new B({color:4876097,emissive:1122833,emissiveIntensity:.3}),K=new P(E,j);K.position.set(-18,-.5,.5),i.add(K);const I=new We(8978244,.5,3);I.position.set(-18,.2,.5),i.add(I);for(let U=0;U<4;U++){const st=new Mt(.02,.02,.3,4),$=new P(st,new B({color:3385907}));$.position.set(-18.3+U*.2,-.05,.5),i.add($)}for(let U=0;U<3;U++){const st=new Mt(.12,.12,.3,8),$=new B({color:[3368618,11154278,6728243][U],transparent:!0,opacity:.7}),J=new P(st,$);J.position.set(-21+U*.5,-.7,-.5),i.add(J)}const Y=new B({color:4478310});[-6,-2,2,6].forEach((U,st)=>{const $=new dt(1.5,.3,2),J=new P($,Y);J.position.set(U,st%2===0?2.3:-2.3,0),i.add(J);const bt=new dt(1.2,.15,1.8),w=new P(bt,new B({color:[3368601,10053171,3381606,6697881][st]}));w.position.set(U,st%2===0?2.1:-2.1,0),i.add(w)});for(let U=5;U<=10;U+=2.5){const st=new dt(2,.3,2);[-1,1].forEach($=>{const J=new P(st,e);J.position.set($*2.5,0,U),J.rotation.y=$*.2,i.add(J)})}const V=new dt(2,1.5,2),tt=new B({color:5596774,emissive:1122850,emissiveIntensity:.2}),q=new P(V,tt);q.position.set(0,-1.2,8),i.add(q);const Z=new dt(1,.05,.6),et=new P(Z,new B({color:666138,emissive:43588,emissiveIntensity:.4}));et.position.set(0,-.3,8),i.add(et);const ot=new Ue(2,24),xt=new B({color:8965375,transparent:!0,opacity:.3,emissive:2245734,emissiveIntensity:.3,side:ue}),Pt=new P(ot,xt);Pt.position.set(0,-2.95,-8),Pt.rotation.x=Math.PI/2,i.add(Pt);const G=new Fe(2.1,.1,8,24),nt=new P(G,new B({color:5592405}));nt.position.set(0,-2.93,-8),nt.rotation.x=Math.PI/2,i.add(nt);const mt=new dt(1.5,2,.5),Tt=new B({color:4473941,emissive:1118498,emissiveIntensity:.2});[-2,2].forEach(U=>{const st=new P(mt,Tt);st.position.set(U,0,-10),i.add(st);const $=new Yt(.08,8,8),J=new P($,new B({color:65280,emissive:65280,emissiveIntensity:.8}));J.position.set(U,.8,-9.7),i.add(J)});const yt=new te,vt=new P(new dt(.4,.3,.5),new B({color:2236962}));yt.add(vt);const zt=new P(new Mt(.1,.15,.3,12),new B({color:1118481,specular:4473924}));zt.rotation.x=Math.PI/2,zt.position.z=-.35,yt.add(zt),yt.position.set(0,-1,-7),yt.rotation.x=Math.PI/4,i.add(yt);const Lt=new dt(.3,2,1.5),N=new P(Lt,new B({color:5588019}));N.position.set(12,0,2.7),i.add(N);for(let U=0;U<5;U++){const st=new Mt(.03,.03,.8,6),$=new P(st,new B({color:[13421568,16737792,52428,16711782,6749952][U]}));$.position.set(12.2,-.6+U*.3,2.7),$.rotation.z=Math.PI/2,i.add($)}for(let U=0;U<4;U++){const st=new dt(.6,.4,.4),$=new P(st,new B({color:[10048819,5609779,3364249,10040149][U]}));$.position.set(10+U*1.5,-2.2,2),i.add($)}for(let U=0;U<8;U++){const st=new dt(.5,.5,.3),$=new B({color:[3368601,10053171,3381606,10040166,6723891,6697881,3381657,10066227][U]}),J=new P(st,$);J.position.set(-20+U*5,2,2.5),i.add(J)}const Kt=[{x:-20,z:0,color:13158,label:"مختبر"},{x:-5,z:0,color:3368448,label:"معيشة"},{x:5,z:0,color:6697728,label:"صيانة"},{x:20,z:0,color:3342438,label:"تحكم"},{x:0,z:8,color:26163,label:"أبحاث"},{x:0,z:-8,color:6684723,label:"مراقبة"}];Kt.forEach(U=>{const st=new dt(U.z===0?.1:.5,.5,U.z===0?.5:.1),$=new P(st,new B({color:U.color,emissive:U.color,emissiveIntensity:.5}));$.position.set(U.x,2.7,U.z),i.add($)});for(let U=0;U<3;U++){const st=new dt(.2,.15,.1),$=new P(st,new B({color:[13404211,8965171,3377356][U]}));$.position.set(-4+U*.4,-.8,2.3),i.add($)}const ut=new Mt(.15,.15,.5,8),At=new P(ut,new B({color:4491468,transparent:!0,opacity:.6}));return At.position.set(-3,-.6,2.3),i.add(At),i.userData.sections=Kt,i}class $p{constructor(t){this.gs=t,this.scene=null,this.camera=null,this.spacecraft=null,this.iss=null,this.earth=null,this.time=0,this.distanceToISS=50,this.spacecraftSpeed=new A,this.mode="story",this.ambience=null}async init(t={}){this.mode=t.mode||"story",this.scene=new mn,this.scene.background=new Ct(5),this.camera=new de(60,window.innerWidth/window.innerHeight,.1,5e3),this.camera.position.set(0,5,15),window.addEventListener("resize",this._onResize=()=>{this.camera.aspect=window.innerWidth/window.innerHeight,this.camera.updateProjectionMatrix()}),this.scene.add(Cn(8e3)),this.scene.add(Qa());const e=Bi();e.position.set(300,100,-400),this.scene.add(e),this.earth=jn(150),this.earth.position.set(0,-180,0),this.scene.add(this.earth),this.spacecraft=Cs(),this.spacecraft.position.set(0,0,0),this.scene.add(this.spacecraft),this.iss=Ur(),this.iss.position.set(0,0,-this.distanceToISS*5),this.iss.scale.setScalar(.3),this.scene.add(this.iss),this.scene.add(new Pn(2241348,.3)),this.time=0,this.distanceToISS=50,this.spacecraftSpeed=new A,this._transitioning=!1,this._msg30Shown=!1,this._msg10Shown=!1,this.ambience=this.gs.audio.playSpaceAmbience(),this.engineHum=this.gs.audio.playEngineHum(),this.gs.ui.clear(),this.gs.ui.addGlobalStyles(),this.gs.ui.showChatButton(),this.gs.ui.showCenterText("الملاحة الفضائية","التوجه نحو محطة الفضاء الدولية",3e3),this.gs.ui.showObjective("اقترب من محطة الفضاء الدولية"),this.gs.ui.showControls([{key:"W/↑",action:"تسريع"},{key:"S/↓",action:"إبطاء"},{key:"A/←",action:"يسار"},{key:"D/→",action:"يمين"},{key:"Q/مسافة",action:"أعلى"},{key:"E/Shift",action:"أسفل"}]),setTimeout(()=>{this.gs.ui.showComm("مركز التحكم","محطة الفضاء الدولية على مسافة 50 كم. عدّل مسارك واقترب بحذر.",5e3)},3500)}update(t){this.time+=t;const e=this.gs.input,n=5;e.isForward()&&(this.spacecraftSpeed.z-=n*t),e.isBackward()&&(this.spacecraftSpeed.z+=n*t),e.isLeft()&&(this.spacecraftSpeed.x-=n*t),e.isRight()&&(this.spacecraftSpeed.x+=n*t),e.isUp()&&(this.spacecraftSpeed.y+=n*t),e.isDown()&&(this.spacecraftSpeed.y-=n*t),this.spacecraftSpeed.multiplyScalar(.98),this.distanceToISS-=t*2,this.spacecraftSpeed.z-=t*.5,this.spacecraft.position.add(this.spacecraftSpeed.clone().multiplyScalar(t)),this.spacecraft.rotation.z=se.lerp(this.spacecraft.rotation.z,-this.spacecraftSpeed.x*.1,t*2),this.spacecraft.rotation.x=se.lerp(this.spacecraft.rotation.x,this.spacecraftSpeed.z*.05,t*2);const s=-this.distanceToISS*5;this.iss.position.z=se.lerp(this.iss.position.z,s,t*.5),this.iss.rotation.y+=t*.02;const r=se.lerp(.1,1,Math.max(0,1-this.distanceToISS/50));this.iss.scale.setScalar(Math.max(.1,r));const a=new A(this.spacecraft.position.x*.5,this.spacecraft.position.y*.5+3,this.spacecraft.position.z+12);this.camera.position.lerp(a,t*2),this.camera.lookAt(this.spacecraft.position.x,this.spacecraft.position.y,this.spacecraft.position.z-10),this.earth.rotation.y+=t*.01,this.gs.ui.showHUD({fuel:Math.max(0,this.gs.playerData.fuel-this.time*.3),oxygen:100,energy:98,speed:Math.round(Math.abs(this.spacecraftSpeed.z)*100+200),altitude:408,distance:Math.max(0,Math.round(this.distanceToISS*10)/10)}),this.distanceToISS<30&&!this._msg30Shown&&(this._msg30Shown=!0,this.gs.ui.showComm("مركز التحكم","المحطة على بعد 30 كم. استمر في الاقتراب.",3e3)),this.distanceToISS<10&&!this._msg10Shown&&(this._msg10Shown=!0,this.gs.ui.showComm("مركز التحكم","المحطة قريبة! ابدأ إجراءات الالتحام.",4e3),this.gs.ui.showObjective("استعد للالتحام بالمحطة")),this.distanceToISS<=2&&!this._transitioning&&(this._transitioning=!0,this.gs.audio.playConfirm(),this.gs.ui.showCenterText("بدء الالتحام","Docking Sequence Initiated",2e3),setTimeout(()=>{this.gs.switchScene("docking",{mode:this.mode})},2500))}render(t){t.render(this.scene,this.camera)}async cleanup(){window.removeEventListener("resize",this._onResize);try{this.ambience&&(this.ambience.osc1.stop(),this.ambience.osc2.stop()),this.engineHum&&this.engineHum.osc.stop()}catch{}this.gs.ui.clear()}}class Yp{constructor(t){this.gs=t,this.scene=null,this.camera=null,this.spacecraft=null,this.iss=null,this.time=0,this.dockingProgress=0,this.alignment={x:0,y:0,rotation:0},this.approachSpeed=.5,this.distance=30,this.docked=!1,this.failed=!1,this.mode="story",this.attempts=0}async init(t={}){this.mode=t.mode||"story",this.scene=new mn,this.scene.background=new Ct(5),this.camera=new de(60,window.innerWidth/window.innerHeight,.1,3e3),window.addEventListener("resize",this._onResize=()=>{this.camera.aspect=window.innerWidth/window.innerHeight,this.camera.updateProjectionMatrix()}),this.scene.add(Cn(5e3));const e=Bi();e.position.set(200,80,-300),this.scene.add(e);const n=jn(150);n.position.set(0,-180,50),this.scene.add(n),this.earthRef=n,this.iss=Ur(),this.iss.position.set(0,0,-50),this.scene.add(this.iss),this.spacecraft=Cs(),this.spacecraft.position.set(0,0,0),this.scene.add(this.spacecraft),this.scene.add(new Pn(2241348,.4)),this.guideLight1=new We(65280,1,20),this.guideLight1.position.set(0,0,-50),this.scene.add(this.guideLight1),this.guideLight2=new We(16711680,.5,15),this.guideLight2.position.set(2,2,-50),this.scene.add(this.guideLight2);const s=new Fe(1,.02,8,32),r=new Jt({color:65280,transparent:!0,opacity:.5});this.targetRing=new P(s,r),this.targetRing.position.set(0,0,-48),this.scene.add(this.targetRing),this.distance=30,this.alignment={x:0,y:0,rotation:0},this.approachSpeed=.3,this.docked=!1,this.failed=!1,this.time=0,this.attempts=0,this.camera.position.set(0,2,5),this.camera.lookAt(0,0,-50),this.gs.ui.clear(),this.gs.ui.addGlobalStyles(),this.gs.ui.showCenterText("الالتحام بالمحطة","محاذاة المركبة مع نقطة الالتحام",3e3),this.gs.ui.showObjective("وجّه المركبة نحو نقطة الالتحام الخضراء"),this.gs.ui.showControls([{key:"W/↑",action:"أعلى"},{key:"S/↓",action:"أسفل"},{key:"A/←",action:"يسار"},{key:"D/→",action:"يمين"},{key:"Q",action:"تسريع الاقتراب"},{key:"E",action:"إبطاء الاقتراب"}]),this._showDockingHUD(),setTimeout(()=>{this.gs.ui.showComm("مركز التحكم","بدء إجراءات الالتحام. حافظ على المحاذاة مع الحلقة الخضراء واقترب ببطء.",5e3)},3500)}_showDockingHUD(){this.gs.ui.removeElement("dock-hud");const t=this._getAlignmentQuality(),e=t>.8?"#00ff88":t>.5?"#ffcc00":"#ff4444",n=t>.8?"ممتاز":t>.5?"مقبول":"غير متحاذي";this.gs.ui.addElement("dock-hud",`
      <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;">
        <div style="width:200px;height:200px;border:1px solid ${e}88;border-radius:50%;position:relative;
          box-shadow:0 0 30px ${e}18, inset 0 0 15px ${e}08;">
          <div style="position:absolute;top:50%;left:50%;width:3px;height:3px;background:${e};
            border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 0 12px ${e};"></div>
          <div style="position:absolute;top:50%;left:0;width:100%;height:1px;background:${e}22;"></div>
          <div style="position:absolute;left:50%;top:0;width:1px;height:100%;background:${e}22;"></div>
          <div style="position:absolute;border:1px solid ${e}33;border-radius:50%;
            width:100px;height:100px;top:50px;left:50px;"></div>
          <div style="position:absolute;width:6px;height:6px;background:rgba(255,149,0,0.8);border-radius:50%;
            top:${50-this.alignment.y*5}%;left:${50+this.alignment.x*5}%;
            transform:translate(-50%,-50%);box-shadow:0 0 12px rgba(255,149,0,0.4);transition:all 0.1s;"></div>
        </div>
      </div>
      <div style="position:fixed;top:12px;left:50%;transform:translateX(-50%);text-align:center;direction:rtl;">
        <div style="background:rgba(0,0,0,0.85);padding:10px 24px;border-radius:2px;border:1px solid rgba(255,149,0,0.2);box-shadow:0 2px 15px rgba(0,0,0,0.4);">
          <div style="font-family:'Orbitron',sans-serif;color:${e};font-size:0.85rem;letter-spacing:1px;">
            ALIGNMENT: <span style="color:#fff;">${Math.round(t*100)}%</span>
            <span style="font-family:'Tajawal',sans-serif;font-size:0.8rem;color:rgba(200,220,240,0.6);margin-right:8px;">${n}</span>
          </div>
          <div style="font-family:'Share Tech Mono',monospace;color:rgba(255,149,0,0.5);font-size:0.75rem;margin-top:5px;letter-spacing:1px;">
            DIST: <span style="color:rgba(255,255,255,0.9);">${this.distance.toFixed(1)}m</span>
            &nbsp;&nbsp;|&nbsp;&nbsp;
            SPD: <span style="color:rgba(255,255,255,0.9);">${this.approachSpeed.toFixed(2)}m/s</span>
          </div>
        </div>
      </div>
    `)}_getAlignmentQuality(){const t=Math.sqrt(this.alignment.x*this.alignment.x+this.alignment.y*this.alignment.y);return Math.max(0,1-t/10)}update(t){if(this.docked||this.failed)return;this.time+=t;const e=this.gs.input,n=3;e.isLeft()&&(this.alignment.x-=n*t),e.isRight()&&(this.alignment.x+=n*t),e.isForward()&&(this.alignment.y+=n*t),e.isBackward()&&(this.alignment.y-=n*t),e.isUp()&&(this.approachSpeed=Math.min(1.5,this.approachSpeed+t*.3)),e.isDown()&&(this.approachSpeed=Math.max(.05,this.approachSpeed-t*.3)),this.alignment.x+=(Math.random()-.5)*t*.3,this.alignment.y+=(Math.random()-.5)*t*.3,this.alignment.x=se.clamp(this.alignment.x,-10,10),this.alignment.y=se.clamp(this.alignment.y,-10,10),this.distance-=this.approachSpeed*t,this.spacecraft.position.x=this.alignment.x*.5,this.spacecraft.position.y=this.alignment.y*.5,this.spacecraft.position.z=-this.distance*.5,this.camera.position.set(this.spacecraft.position.x*.3,this.spacecraft.position.y*.3+2,this.spacecraft.position.z+8),this.camera.lookAt(0,0,-50),this.targetRing.material.opacity=.3+Math.sin(this.time*3)*.2;const s=this._getAlignmentQuality();this.targetRing.material.color.setHex(s>.8?65280:s>.5?16763904:16729156),this.distance<15&&Math.floor(this.time*(2+(15-this.distance)*.5))>Math.floor((this.time-t)*(2+(15-this.distance)*.5))&&this.gs.audio.playDockingBeep(),this._showDockingHUD(),this.approachSpeed>1&&this.distance<10&&(!this._speedWarnTime||this.time-this._speedWarnTime>1.5)&&(this._speedWarnTime=this.time,this.gs.ui.showMessage("⚠️ سرعة الاقتراب عالية! أبطئ!",1e3,"warning")),this.distance<=.5&&(s>.6&&this.approachSpeed<1?this._dockSuccess():this._dockFail()),this.earthRef&&(this.earthRef.rotation.y+=t*.005)}_dockSuccess(){this.docked=!0,this.gs.audio.playSuccess(),this.gs.ui.clear(),this.gs.ui.showCenterText("التحام ناجح!","أحسنت! تم الالتحام بمحطة الفضاء الدولية بنجاح",0),setTimeout(()=>{this.gs.ui.showComm("مركز التحكم","عمل ممتاز! الالتحام تم بنجاح. يمكنك الآن دخول المحطة.",5e3)},2e3),setTimeout(()=>{this.gs.ui.addElement("dock-continue",`
        <div style="position:fixed;bottom:50px;left:50%;transform:translateX(-50%);">
          <button class="menu-btn menu-btn-primary" style="display:inline-flex;width:auto;padding:11px 28px;" id="btn-enter-iss">
            <div class="menu-btn-icon">🚪</div>
            <div class="menu-btn-text"><div class="menu-btn-title" style="font-size:0.95rem;">دخول محطة الفضاء الدولية</div></div>
          </button>
        </div>
      `),setTimeout(()=>{var t;(t=document.getElementById("btn-enter-iss"))==null||t.addEventListener("click",()=>{this.gs.audio.playConfirm(),this.gs.switchScene("issInterior",{mode:this.mode})})},100)},3e3)}_dockFail(){this.failed=!0,this.attempts++,this.gs.audio.playAlert();const t=this.approachSpeed>=1?"سرعة اقتراب عالية جداً":"محاذاة غير كافية";this.gs.ui.clear(),this.gs.ui.showCenterText("فشل الالتحام",t,0),this.gs.ui.showMessage(`محاولة ${this.attempts} — ${t}`,3e3,"danger"),setTimeout(()=>{this.gs.ui.addElement("retry",`
        <div style="position:fixed;bottom:50px;left:50%;transform:translateX(-50%);display:flex;gap:12px;">
          <button class="menu-btn menu-btn-primary" style="display:inline-flex;width:auto;padding:10px 24px;" id="btn-retry">
            <div class="menu-btn-icon">🔄</div>
            <div class="menu-btn-text"><div class="menu-btn-title" style="font-size:0.9rem;">إعادة المحاولة</div></div>
          </button>
          <button class="menu-btn" style="display:inline-flex;width:auto;padding:10px 24px;" id="btn-auto-dock">
            <div class="menu-btn-icon">🤖</div>
            <div class="menu-btn-text"><div class="menu-btn-title" style="font-size:0.9rem;">التحام تلقائي</div></div>
          </button>
        </div>
      `),setTimeout(()=>{var e,n;(e=document.getElementById("btn-retry"))==null||e.addEventListener("click",()=>{this.gs.audio.playBeep(),this.distance=30,this.alignment={x:0,y:0,rotation:0},this.approachSpeed=.3,this.docked=!1,this.failed=!1,this.gs.ui.clear(),this.gs.ui.addGlobalStyles(),this.gs.ui.showObjective("وجّه المركبة نحو نقطة الالتحام"),this.gs.ui.showControls([{key:"W/↑",action:"أعلى"},{key:"S/↓",action:"أسفل"},{key:"A/←",action:"يسار"},{key:"D/→",action:"يمين"},{key:"Q",action:"تسريع الاقتراب"},{key:"E",action:"إبطاء الاقتراب"}])}),(n=document.getElementById("btn-auto-dock"))==null||n.addEventListener("click",()=>{this.gs.audio.playConfirm(),this._dockSuccess()})},100)},2e3)}render(t){t.render(this.scene,this.camera)}async cleanup(){window.removeEventListener("resize",this._onResize),this.gs.ui.clear()}}class jp{constructor(t){this.gs=t,this.scene=null,this.camera=null,this.interior=null,this.time=0,this.mode="story",this.playerPos=new A(0,0,0),this.playerVel=new A,this.yaw=0,this.pitch=0,this.currentSection=0,this.tasksCompleted=0,this.totalTasks=5,this.activeTask=null,this.currentTaskData=null,this.dailySchedule=[],this.scheduleIndex=0,this.dayTime=0,this.emergencyActive=!1,this.floatingObjects=[],this.astronaut=null,this.currentRoom="",this.suitEquipped=!1,this.airlockPhase=null,this.suitUpProgress=0,this.prebreathTimer=0,this.depressureTimer=0,this.interactionPoints=[],this._fKeyWasDown=!1}async init(t={}){var n;this.mode=t.mode||"story",this.scene=new mn,this.scene.background=new Ct(1118485),this.camera=new de(75,window.innerWidth/window.innerHeight,.05,500),window.addEventListener("resize",this._onResize=()=>{this.camera.aspect=window.innerWidth/window.innerHeight,this.camera.updateProjectionMatrix()}),this.interior=qp(),this.scene.add(this.interior),this.scene.add(new Pn(8952490,.7)),this.scene.add(new Ir(14544639,5596774,.4)),[[-20,2.5,0],[-10,2.5,0],[0,2.5,0],[10,2.5,0],[20,2.5,0],[0,2.5,6],[0,2.5,-6]].forEach(([s,r,a])=>{const o=new We(14544639,.5,15);o.position.set(s,r,a),this.scene.add(o)}),this.starsOutside=Cn(3e3,200),this.scene.add(this.starsOutside),this.earthOutside=jn(80),this.earthOutside.position.set(50,-100,-50),this.scene.add(this.earthOutside),this.floatingObjects=[],this._createFloatingObjects(),this._createAstronaut(),this._createInteractionPoints(),this._createAirlockVisual(),this.playerPos.set(0,0,0),this.playerVel.set(0,0,0),this.yaw=Math.PI,this.pitch=0,this.tasksCompleted=0,this.time=0,this.dayTime=0,this.emergencyActive=!1,this.activeTask=null,this.currentTaskData=null,this.currentRoom="معيشة",this.suitEquipped=!1,this.airlockPhase=null,this.suitUpProgress=0,this.prebreathTimer=0,this.depressureTimer=0,this._fKeyWasDown=!1,this.dailySchedule=[{name:"الاستيقاظ والاستعداد",icon:"☀️",duration:5},{name:"فحص الأنظمة الصباحي",icon:"🔍",duration:8,task:"systemCheck"},{name:"تجربة نمو النباتات",icon:"🌱",duration:10,task:"plantExperiment"},{name:"اتصال مع مركز التحكم",icon:"📡",duration:5},{name:"استراحة وتناول الطعام",icon:"🍽️",duration:5},{name:"إصلاح وحدة الطاقة",icon:"🔧",duration:10,task:"powerRepair"},{name:"إصلاح الأسلاك الكهربائية",icon:"⚡",duration:10,task:"wiringRepair"},{name:"تصوير الأرض",icon:"📸",duration:8,task:"earthPhoto"},{name:"ترتيب المعدات",icon:"📦",duration:8,task:"organizeEquipment"},{name:"مراقبة الأرض من النافذة",icon:"🌍",duration:5},{name:"نهاية اليوم",icon:"🌙",duration:0}],this.scheduleIndex=0,this._onClickLock=()=>{this.gs.input.requestPointerLock(document.getElementById("game-canvas"))},(n=document.getElementById("game-canvas"))==null||n.addEventListener("click",this._onClickLock),this.gs.ui.clear(),this.gs.ui.addGlobalStyles(),this.gs.ui.showChatButton(),this.gs.ui.showCenterText("محطة الفضاء الدولية","مرحباً بك على متن المحطة",3e3),setTimeout(()=>{this.gs.ui.showComm("مركز التحكم","مرحباً بك في المحطة! استكشف الأقسام المختلفة. استخدم F للتفاعل مع الأجهزة والأزرار. للخروج للفضاء توجه لغرفة القفل الهوائي (Quest Airlock) في نهاية الممر العرضي.",8e3),this._showSchedule(),this._showISSSections()},3500),this.gs.ui.showControls([{key:"W/↑",action:"أمام"},{key:"S/↓",action:"خلف"},{key:"A/←",action:"يسار"},{key:"D/→",action:"يمين"},{key:"Q/مسافة",action:"أعلى (انعدام الجاذبية)"},{key:"E/Shift",action:"أسفل"},{key:"F",action:"تفاعل / تشغيل"}]),t.task==="repair"?setTimeout(()=>this._startTask("powerRepair"),4e3):t.task==="crisis"&&setTimeout(()=>this._startEmergency(),4e3)}_createAstronaut(){this.astronaut=new te;const t=new B({color:15658734,specular:4473924,shininess:40}),e=new Mt(.25,.22,.6,8),n=new P(e,t);this.astronaut.add(n);const s=new Yt(.2,12,12),r=new B({color:14540253,specular:8947848,shininess:100}),a=new P(s,r);a.position.y=.45,this.astronaut.add(a);const o=new Yt(.18,12,8,0,Math.PI*2,0,Math.PI*.5),c=new B({color:13404160,specular:16755200,shininess:150,transparent:!0,opacity:.7}),l=new P(o,c);l.position.y=.48,l.rotation.x=Math.PI*.3,this.astronaut.add(l);const h=new dt(.3,.4,.15),d=new B({color:13421772}),p=new P(h,d);p.position.set(0,.05,.2),this.astronaut.add(p);const m=new Mt(.07,.06,.5,6);[-1,1].forEach(S=>{const v=new P(m,t);v.position.set(S*.32,-.05,0),v.rotation.z=S*.3,this.astronaut.add(v);const b=new Yt(.06,6,6),R=new B({color:11184810}),C=new P(b,R);C.position.set(S*.4,-.28,0),this.astronaut.add(C)});const g=new Mt(.08,.07,.5,6);[-1,1].forEach(S=>{const v=new P(g,t);v.position.set(S*.12,-.52,0),this.astronaut.add(v);const b=new dt(.1,.06,.15),R=new B({color:6710886}),C=new P(b,R);C.position.set(S*.12,-.78,.02),this.astronaut.add(C)});const y=new dt(.08,.05,.01),f=new B({color:26163,emissive:13073,emissiveIntensity:.3}),u=new P(y,f);u.position.set(.35,.1,-.07),this.astronaut.add(u),this.astronaut.scale.setScalar(1.2),this.scene.add(this.astronaut)}_createInteractionPoints(){this.interactionPoints=[],[{pos:new A(20,0,0),name:"لوحة التحكم الرئيسية",type:"panel",section:"تحكم",actions:["فحص حالة المحطة","مراقبة المدار","التواصل مع الأرض","ضبط الملاحة"]},{pos:new A(22,.5,1.5),name:"نظام الاتصالات",type:"comms",section:"تحكم",actions:["إرسال تقرير للأرض","استقبال تعليمات","فحص الإشارة"]},{pos:new A(-20,0,0),name:"محطة المجهر",type:"microscope",section:"مختبر",actions:["فحص عينة بيولوجية","تسجيل النتائج","إعداد شريحة جديدة"]},{pos:new A(-18,0,2),name:"حاضنة التجارب",type:"incubator",section:"مختبر",actions:["فحص درجة الحرارة","مراقبة النمو","تعديل الإعدادات"]},{pos:new A(-5,0,0),name:"منطقة الطعام",type:"food",section:"معيشة",actions:["تناول وجبة","إعداد مشروب","فحص المخزون"]},{pos:new A(-3,0,2),name:"نظام إعادة تدوير المياه",type:"water",section:"معيشة",actions:["فحص جودة المياه","تنظيف الفلتر","قراءة المؤشرات"]},{pos:new A(5,0,0),name:"صندوق الأدوات",type:"tools",section:"صيانة",actions:["اختيار أداة","فحص المعدات","ترتيب الأدوات"]},{pos:new A(7,0,-2),name:"لوحة الكهرباء",type:"electrical",section:"صيانة",actions:["فحص الدوائر","إصلاح الأسلاك","اختبار التوصيلات"]},{pos:new A(10,-1,1),name:"نظام تنقية الهواء",type:"airSystem",section:"صيانة",actions:["فحص الفلتر","تبديل الفلتر","قراءة مستوى CO2"]},{pos:new A(0,0,8),name:"محطة الزراعة الفضائية",type:"plants",section:"أبحاث",actions:["سقي النباتات","قياس النمو","أخذ عينات"]},{pos:new A(2,0,9),name:"جهاز الطرد المركزي",type:"centrifuge",section:"أبحاث",actions:["تشغيل الجهاز","فحص العينات","ضبط السرعة"]},{pos:new A(0,0,-8),name:"قبة المراقبة (كوبولا)",type:"cupola",section:"مراقبة",actions:["مراقبة الأرض","التقاط صور","رصد الطقس","تحديد المواقع الجغرافية"]},{pos:new A(0,0,-10.5),name:"القفل الهوائي (Quest Airlock)",type:"airlock",section:"مراقبة",actions:["دخول القفل الهوائي"]}].forEach(e=>{const n=new Yt(.15,8,8),s=new Jt({color:e.type==="airlock"?16746496:43775,transparent:!0,opacity:.6}),r=new P(n,s);r.position.copy(e.pos),this.scene.add(r),e.marker=r;const a=new Fe(.25,.02,6,16),o=new Jt({color:e.type==="airlock"?16737792:35071,transparent:!0,opacity:.4}),c=new P(a,o);c.position.copy(e.pos),this.scene.add(c),e.ring=c,this.interactionPoints.push(e)})}_createAirlockVisual(){const t=new te,e=new Mt(2.5,2.5,4,12,1,!0),n=new B({color:5596791,side:be}),s=new P(e,n);s.rotation.x=Math.PI/2,s.position.set(0,0,-12),t.add(s),[-1,1].forEach(y=>{const f=new te,u=new dt(.6,.8,.3),S=new B({color:15658734});f.add(new P(u,S));const v=new Yt(.2,8,8),b=new P(v,new B({color:14540253}));b.position.y=.55,f.add(b);const R=new dt(.5,.6,.25),C=new P(R,new B({color:13421772}));C.position.set(0,.05,-.25),f.add(C),f.position.set(y*1.5,0,-12.5),f.rotation.y=y>0?-Math.PI/6:Math.PI/6,t.add(f)});const r=new Mt(2,2,3,12,1,!0),a=new B({color:4478310,side:be}),o=new P(r,a);o.rotation.x=Math.PI/2,o.position.set(0,0,-15),t.add(o);const c=new Ue(1.5,16),l=new B({color:6715272,side:ue,emissive:1122867,emissiveIntensity:.2}),h=new P(c,l);h.position.set(0,0,-16.5),t.add(h);const d=new We(65280,.5,5);d.position.set(0,2,-12),t.add(d),this.airlockStatusLight=d;const p=new Ue(.2,16),m=new Jt({color:65416}),g=new P(p,m);g.position.set(1.8,1,-12),g.rotation.y=-Math.PI/4,t.add(g),this.scene.add(t)}_createFloatingObjects(){[{geo:new Yt(.05,8,8),color:3368703,pos:[2,.5,1]},{geo:new dt(.08,.08,.08),color:16737843,pos:[-3,1,-.5]},{geo:new Yt(.04,6,6),color:3407718,pos:[5,-.3,.8]},{geo:new Mt(.02,.02,.15,6),color:16777011,pos:[-8,.8,-1]},{geo:new dt(.1,.06,.03),color:13421772,pos:[10,.2,.5]},{geo:new Yt(.03,6,6),color:16724991,pos:[0,.4,6]},{geo:new dt(.06,.06,.06),color:3407871,pos:[1,-.2,-5]},{geo:new Mt(.03,.03,.12,6),color:16750899,pos:[-1,.6,8]}].forEach(e=>{const n=new P(e.geo,new B({color:e.color}));n.position.set(...e.pos),n.userData.floatSpeed={x:Math.random()*.3,y:Math.random()*.2,z:Math.random()*.3},n.userData.floatPhase=Math.random()*Math.PI*2,this.scene.add(n),this.floatingObjects.push(n)})}_showSchedule(){this.gs.ui.removeElement("schedule");const t=this.dailySchedule.map((e,n)=>{const s=n<this.scheduleIndex?"done":n===this.scheduleIndex?"current":"pending",r=s==="done"?"rgba(0,255,120,0.6)":s==="current"?"rgba(255,149,0,0.8)":"rgba(80,110,140,0.4)",a=s==="done"?"✓":e.icon;return`<div style="color:${r};font-size:0.7rem;padding:2px 0;${s==="current"?"font-weight:bold;":""}">${a} ${e.name}</div>`}).join("");this.gs.ui.addElement("schedule",`
      <div style="position:fixed;top:70px;right:15px;background:rgba(0,0,0,0.85);
        border:1px solid rgba(255,149,0,0.15);border-radius:2px;padding:10px 14px;
        max-width:200px;direction:rtl;">
        <div style="color:rgba(255,149,0,0.7);font-size:0.7rem;margin-bottom:5px;
          font-family:'Orbitron',monospace;letter-spacing:1px;">📋 جدول اليوم</div>
        ${t}
      </div>
    `)}_showISSSections(){this.gs.ui.removeElement("sections-bar");const t=[{label:"مختبر",x:-20,z:0},{label:"معيشة",x:-5,z:0},{label:"صيانة",x:5,z:0},{label:"تحكم",x:20,z:0},{label:"أبحاث",x:0,z:8},{label:"مراقبة / قفل هوائي",x:0,z:-8}];let e=0,n=1/0;t.forEach((r,a)=>{const o=Math.sqrt(Math.pow(this.playerPos.x-r.x,2)+Math.pow(this.playerPos.z-r.z,2));o<n&&(n=o,e=a)}),this.currentSection=e,this.currentRoom=t[e].label;const s=t.map((r,a)=>`<span style="padding:4px 10px;border-radius:2px;font-size:0.7rem;font-family:'Tajawal',sans-serif;
        ${a===e?"background:rgba(255,149,0,0.1);color:#ff9500;border:1px solid rgba(255,149,0,0.2);":"color:rgba(255,149,0,0.3);"}">${r.label}</span>`).join("");this.gs.ui.addElement("sections-bar",`
      <div style="position:fixed;bottom:60px;left:50%;transform:translateX(-50%);
        display:flex;gap:6px;background:rgba(0,0,0,0.85);
        padding:5px 10px;border-radius:2px;border:1px solid rgba(255,149,0,0.1);
        direction:rtl;flex-wrap:wrap;justify-content:center;">${s}</div>
    `)}_showAirlockUI(){this.gs.ui.removeElement("airlock-panel");const t=this.suitEquipped?'<span style="color:#00ff88;">✓ البدلة مرتداة</span>':'<span style="color:#ff6644;">✗ البدلة غير مرتداة</span>';let e="";if(!this.airlockPhase)e=`
        <div style="font-family:'Orbitron',sans-serif;color:rgba(255,136,0,0.85);font-size:1rem;margin-bottom:12px;text-align:center;
          letter-spacing:1px;text-shadow:0 0 20px rgba(255,100,0,0.2);">
          🚪 القفل الهوائي — Quest Airlock
        </div>
        <div style="color:rgba(200,220,240,0.8);font-size:0.82rem;margin-bottom:8px;font-family:'Tajawal',sans-serif;">حالة البدلة: ${t}</div>
        <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,136,0,0.15),transparent);margin:10px 0;"></div>
        <div style="color:rgba(120,160,190,0.6);font-size:0.72rem;line-height:1.8;margin-bottom:12px;font-family:'Tajawal',sans-serif;">
          القفل الهوائي يتكون من قسمين:<br>
          1. غرفة المعدات (Equipment Lock) — لارتداء بدلة EMU<br>
          2. غرفة الطاقم (Crew Lock) — لتفريغ الضغط قبل الخروج
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${this.suitEquipped?`
            <button class="menu-btn menu-btn-primary" style="width:100%;padding:8px 18px;" id="btn-enter-crewlock">
              <div class="menu-btn-icon">🚀</div>
              <div class="menu-btn-text"><div class="menu-btn-title" style="font-size:0.88rem;">دخول غرفة الطاقم وبدء التفريغ</div></div>
            </button>
          `:`
            <button class="menu-btn menu-btn-primary" style="width:100%;padding:8px 18px;" id="btn-suit-up">
              <div class="menu-btn-icon">🧑‍🚀</div>
              <div class="menu-btn-text"><div class="menu-btn-title" style="font-size:0.88rem;">ارتداء بدلة EMU</div></div>
            </button>
          `}
          <button class="menu-btn" style="width:100%;padding:8px 18px;" id="btn-close-airlock">
            <div class="menu-btn-icon">❌</div>
            <div class="menu-btn-text"><div class="menu-btn-title" style="font-size:0.85rem;">إغلاق</div></div>
          </button>
        </div>
      `;else if(this.airlockPhase==="suitingUp")e=`
        <div style="font-family:'Orbitron',sans-serif;color:#ff8800;font-size:1rem;margin-bottom:12px;text-align:center;">
          🧑‍🚀 ارتداء بدلة EMU
        </div>
        <div style="color:#cceeff;font-size:0.8rem;line-height:1.8;margin-bottom:10px;">
          <div id="suit-step" style="color:#00d4ff;">جاري ارتداء البدلة...</div>
        </div>
        <div style="width:100%;height:8px;background:rgba(255,255,255,0.1);border-radius:4px;">
          <div id="suit-progress-bar" style="width:${this.suitUpProgress}%;height:100%;background:linear-gradient(90deg,#ff8800,#ffaa00);border-radius:4px;transition:width 0.3s;"></div>
        </div>
        <div style="text-align:center;color:#88aabb;font-size:0.7rem;margin-top:5px;">${Math.round(this.suitUpProgress)}%</div>
      `;else if(this.airlockPhase==="prebreathing"){const n=Math.max(0,15-this.prebreathTimer);e=`
        <div style="font-family:'Orbitron',sans-serif;color:#ff8800;font-size:1rem;margin-bottom:12px;text-align:center;">
          🫁 تنفس الأكسجين النقي
        </div>
        <div style="color:#cceeff;font-size:0.8rem;margin-bottom:10px;">
          لمنع مرض تخفيف الضغط، يجب تنفس أكسجين نقي قبل EVA
        </div>
        <div style="text-align:center;font-family:'Orbitron',monospace;color:#00d4ff;font-size:2rem;">
          ${Math.ceil(n)} ث
        </div>
        <div style="color:#557799;font-size:0.7rem;text-align:center;">متبقي من إجراء التنفس المسبق</div>
      `}else if(this.airlockPhase==="depressurizing"){const n=Math.max(0,10-this.depressureTimer);e=`
        <div style="font-family:'Orbitron',sans-serif;color:#ff4400;font-size:1rem;margin-bottom:12px;text-align:center;">
          🔻 تفريغ الضغط
        </div>
        <div style="color:#cceeff;font-size:0.8rem;margin-bottom:10px;">
          غرفة الطاقم — جاري إزالة الهواء
        </div>
        <div style="text-align:center;font-family:'Orbitron',monospace;color:#ff6600;font-size:1.5rem;">
          ${Math.max(0,14.7*(1-this.depressureTimer/10)).toFixed(1)} PSI
        </div>
        <div style="width:100%;height:8px;background:rgba(255,255,255,0.1);border-radius:4px;margin-top:8px;">
          <div style="width:${this.depressureTimer/10*100}%;height:100%;background:linear-gradient(90deg,#00ff88,#ff4400);border-radius:4px;transition:width 0.3s;"></div>
        </div>
        <div style="color:#557799;font-size:0.7rem;text-align:center;margin-top:5px;">متبقي: ${Math.ceil(n)} ث</div>
      `}else this.airlockPhase==="ready"&&(e=`
        <div style="font-family:'Orbitron',sans-serif;color:#00ff88;font-size:1rem;margin-bottom:12px;text-align:center;">
          ✓ القفل الهوائي مفتوح!
        </div>
        <div style="color:#cceeff;font-size:0.8rem;margin-bottom:12px;">
          الضغط صفر — الفتحة الخارجية مفتوحة. جاهز للخروج إلى الفضاء!
        </div>
        <button class="menu-btn menu-btn-primary" style="width:100%;padding:10px 20px;" id="btn-start-eva">
          <div class="menu-btn-icon">🧑‍🚀</div>
          <div class="menu-btn-text"><div class="menu-btn-title" style="font-size:0.9rem;">خروج إلى الفضاء (EVA)</div></div>
        </button>
      `);this.gs.ui.addElement("airlock-panel",`
      <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
        background:rgba(0,0,0,0.9);
        border:1px solid rgba(255,136,0,0.1);border-radius:2px;
        padding:20px 28px;min-width:360px;direction:rtl;
        box-shadow:0 8px 40px rgba(0,0,0,0.4);">
        ${e}
      </div>
    `),setTimeout(()=>{var n,s,r,a;(n=document.getElementById("btn-suit-up"))==null||n.addEventListener("click",()=>{this.gs.audio.playBeep(),this._startSuitingUp()}),(s=document.getElementById("btn-enter-crewlock"))==null||s.addEventListener("click",()=>{this.gs.audio.playBeep(),this._startPrebreathing()}),(r=document.getElementById("btn-close-airlock"))==null||r.addEventListener("click",()=>{this.gs.audio.playBeep(),this.gs.ui.removeElement("airlock-panel"),this.airlockPhase=null}),(a=document.getElementById("btn-start-eva"))==null||a.addEventListener("click",()=>{this.gs.audio.playConfirm(),this.gs.ui.removeElement("airlock-panel"),this.gs.switchScene("eva",{mode:this.mode,suitEquipped:!0})})},100)}_startSuitingUp(){this.airlockPhase="suitingUp",this.suitUpProgress=0,this._showAirlockUI();const t=["ارتداء طبقة التبريد الداخلية (LCVG)","دخول الجزء السفلي من البدلة","تركيب الجزء العلوي الصلب (HUT)","توصيل خراطيم الأكسجين والمياه","ارتداء القفازات وتأمينها","تركيب الخوذة وإغلاقها","فحص نظام دعم الحياة (PLSS)","اختبار ضغط البدلة — 4.3 PSI"];let e=0;this._suitingInterval=setInterval(()=>{if(e>=t.length){clearInterval(this._suitingInterval),this._suitingInterval=null,this.suitEquipped=!0,this.suitUpProgress=100,this.airlockPhase=null,this.gs.audio.playSuccess(),this.gs.ui.showMessage("✓ بدلة EMU مرتداة بالكامل!",3e3,"success"),this.gs.ui.showComm("مركز التحكم","بدلة EMU جاهزة. جميع الأنظمة تعمل. يمكنك الآن دخول غرفة الطاقم لبدء التفريغ.",5e3),this._showAirlockUI();return}this.suitUpProgress=(e+1)/t.length*100;const n=document.getElementById("suit-step"),s=document.getElementById("suit-progress-bar");n&&(n.textContent=t[e]),s&&(s.style.width=`${this.suitUpProgress}%`),this.gs.audio.playBeep(),e++},1200)}_startPrebreathing(){this.airlockPhase="prebreathing",this.prebreathTimer=0,this._showAirlockUI(),this.gs.ui.showComm("مركز التحكم","بدء إجراء التنفس المسبق بالأكسجين النقي. هذا يمنع مرض تخفيف الضغط عند الانتقال من 14.7 PSI إلى 4.3 PSI.",6e3)}_startDepressurization(){this.airlockPhase="depressurizing",this.depressureTimer=0,this._showAirlockUI(),this.gs.audio.playWarning(),this.gs.ui.showComm("مركز التحكم","بدء تفريغ ضغط غرفة الطاقم. الضغط ينخفض من 14.7 PSI إلى الفراغ. لا تقلق — البدلة تحميك!",6e3)}_showInteractionMenu(t){this.gs.ui.removeElement("interact-menu");const e=t.actions.map((n,s)=>`<button class="menu-btn" style="width:100%;padding:5px 14px;" id="interact-btn-${s}">
        <div class="menu-btn-text"><div class="menu-btn-title" style="font-size:0.78rem;text-align:right;">${n}</div></div>
      </button>`).join("");this.gs.ui.addElement("interact-menu",`
      <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
        background:rgba(0,0,0,0.9);
        border:1px solid rgba(255,149,0,0.15);border-radius:2px;
        padding:18px 24px;min-width:280px;direction:rtl;
        box-shadow:0 8px 40px rgba(0,0,0,0.4);">
        <div style="font-family:'Orbitron',sans-serif;color:#ff9500;font-size:0.9rem;margin-bottom:10px;
          text-align:center;letter-spacing:1px;text-shadow:0 0 20px rgba(255,149,0,0.2);">
          ${t.name}
        </div>
        <div style="color:rgba(100,150,200,0.4);font-size:0.68rem;margin-bottom:10px;
          font-family:'Tajawal',sans-serif;">القسم: ${t.section}</div>
        <div style="display:flex;flex-direction:column;gap:5px;">
          ${e}
        </div>
        <div style="text-align:center;margin-top:10px;">
          <button class="menu-btn" style="display:inline-flex;width:auto;padding:5px 18px;" id="interact-close">
            <div class="menu-btn-text"><div class="menu-btn-title" style="font-size:0.72rem;">إغلاق</div></div>
          </button>
        </div>
      </div>
    `),setTimeout(()=>{var n;t.actions.forEach((s,r)=>{var a;(a=document.getElementById(`interact-btn-${r}`))==null||a.addEventListener("click",()=>{this.gs.audio.playBeep(),this.gs.ui.removeElement("interact-menu"),this.gs.ui.showMessage(`⚙️ ${s} — جاري التنفيذ...`,2e3,"info"),setTimeout(()=>{this.gs.audio.playConfirm(),this.gs.ui.showMessage(`✓ ${s} — تم بنجاح!`,2e3,"success")},2e3)})}),(n=document.getElementById("interact-close"))==null||n.addEventListener("click",()=>{this.gs.audio.playBeep(),this.gs.ui.removeElement("interact-menu")})},100)}_startTask(t){this.activeTask=t,this.gs.ui.removeElement("task-panel");const n={systemCheck:{title:"🔍 فحص الأنظمة",steps:["فحص ضغط الهواء","فحص مستوى الأكسجين","فحص درجة الحرارة","فحص الاتصالات"],current:0},plantExperiment:{title:"🌱 تجربة النباتات",steps:["سقي النباتات","قياس النمو","تسجيل الملاحظات","التقاط صور"],current:0},powerRepair:{title:"🔧 إصلاح وحدة الطاقة",steps:["تحديد العطل","فصل الوحدة المعطلة","تركيب البديل","اختبار التشغيل"],current:0},wiringRepair:{title:"⚡ إصلاح الأسلاك الكهربائية",steps:["تحديد الدائرة المعطلة","قطع التيار عن القسم","فصل الأسلاك التالفة","توصيل أسلاك جديدة","اختبار التوصيل","إعادة التيار"],current:0},earthPhoto:{title:"📸 تصوير الأرض",steps:["التوجه للنافذة","ضبط الكاميرا","التقاط الصور","إرسال للأرض"],current:0},organizeEquipment:{title:"📦 ترتيب المعدات",steps:["فرز المعدات","تخزين العينات","تحديث السجل","تأمين الحمولة"],current:0}}[t];n&&(this.currentTaskData=n,this._renderTaskPanel(n))}_renderTaskPanel(t){this.gs.ui.removeElement("task-panel");const e=t.steps.map((n,s)=>{const r=s<t.current?"✓":s===t.current?"▶":"○";return`<div style="color:${s<t.current?"#00ff88":s===t.current?"#00d4ff":"#556677"};font-size:0.85rem;padding:3px 0;">${r} ${n}</div>`}).join("");this.gs.ui.addElement("task-panel",`
      <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
        background:rgba(0,0,0,0.9);
        border:1px solid rgba(255,149,0,0.15);border-radius:2px;
        padding:20px 28px;min-width:320px;direction:rtl;
        box-shadow:0 8px 40px rgba(0,0,0,0.4);">
        <div style="font-family:'Orbitron',sans-serif;color:#ff9500;font-size:1rem;margin-bottom:12px;
          text-align:center;letter-spacing:1px;text-shadow:0 0 20px rgba(255,149,0,0.2);">
          ${t.title}
        </div>
        ${e}
        <div style="text-align:center;margin-top:15px;">
          ${t.current<t.steps.length?`<button class="menu-btn menu-btn-primary" style="width:100%;padding:8px 20px;" id="btn-do-step">
              <div class="menu-btn-text"><div class="menu-btn-title" style="font-size:0.85rem;">تنفيذ: ${t.steps[t.current]}</div></div>
            </button>`:`<div style="color:rgba(0,255,120,0.7);font-size:0.95rem;margin:10px 0;">✓ المهمة مكتملة!</div>
            <button class="menu-btn" style="width:100%;padding:8px 20px;" id="btn-close-task">
              <div class="menu-btn-text"><div class="menu-btn-title" style="font-size:0.82rem;">إغلاق</div></div>
            </button>`}
        </div>
      </div>
    `),setTimeout(()=>{var n,s;(n=document.getElementById("btn-do-step"))==null||n.addEventListener("click",()=>{this.gs.audio.playBeep(),t.current++,t.current>=t.steps.length&&(this.tasksCompleted++,this.gs.audio.playSuccess(),this.gs.ui.showMessage("✓ تم إكمال المهمة بنجاح!",2e3,"success"),this.emergencyActive&&(this.emergencyActive=!1,this.gs.playerData.oxygen=Math.max(this.gs.playerData.oxygen,70),this.gs.ui.showComm("مركز التحكم","تم إصلاح التسرب بنجاح! مستوى الأكسجين مستقر.",4e3)),this._advanceSchedule()),this._renderTaskPanel(t)}),(s=document.getElementById("btn-close-task"))==null||s.addEventListener("click",()=>{this.gs.ui.removeElement("task-panel"),this.activeTask=null})},100)}_advanceSchedule(){for(this.scheduleIndex++;this.scheduleIndex<this.dailySchedule.length-1&&!this.dailySchedule[this.scheduleIndex].task;){const t=this.dailySchedule[this.scheduleIndex];this.gs.ui.showMessage(`${t.icon} ${t.name}`,1500,"info"),this.scheduleIndex++}if(this.scheduleIndex>=this.dailySchedule.length-1)this._showDayComplete();else{this._showSchedule();const t=this.dailySchedule[this.scheduleIndex];t.task&&setTimeout(()=>{this.gs.ui.showComm("مركز التحكم",`المهمة التالية: ${t.name}. اضغط F للتفاعل.`,4e3)},1e3)}}_showDayComplete(){this.gs.ui.removeElement("schedule"),this.gs.ui.showCenterText("انتهى اليوم",`أكملت ${this.tasksCompleted} مهام`,0),setTimeout(()=>{this.gs.ui.addElement("day-end",`
        <div style="position:fixed;bottom:50px;left:50%;transform:translateX(-50%);display:flex;gap:10px;flex-wrap:wrap;justify-content:center;">
          <button class="menu-btn menu-btn-primary" style="display:inline-flex;width:auto;padding:10px 20px;" id="btn-eva">
            <div class="menu-btn-icon">🧑‍🚀</div>
            <div class="menu-btn-text"><div class="menu-btn-title" style="font-size:0.85rem;">القفل الهوائي (EVA)</div></div>
          </button>
          <button class="menu-btn" style="display:inline-flex;width:auto;padding:10px 20px;" id="btn-return">
            <div class="menu-btn-icon">🌍</div>
            <div class="menu-btn-text"><div class="menu-btn-title" style="font-size:0.85rem;">بدء العودة إلى الأرض</div></div>
          </button>
          <button class="menu-btn" style="display:inline-flex;width:auto;padding:10px 20px;" id="btn-explore">
            <div class="menu-btn-icon">🔭</div>
            <div class="menu-btn-text"><div class="menu-btn-title" style="font-size:0.85rem;">استمرار الاستكشاف</div></div>
          </button>
        </div>
      `),setTimeout(()=>{var t,e,n;(t=document.getElementById("btn-eva"))==null||t.addEventListener("click",()=>{this.gs.audio.playConfirm(),this.gs.ui.removeElement("day-end"),this.gs.ui.removeElement("center-text"),this.playerPos.set(0,0,-9),this._showAirlockUI()}),(e=document.getElementById("btn-return"))==null||e.addEventListener("click",()=>{this.gs.audio.playConfirm(),this.gs.switchScene("reEntry",{mode:this.mode})}),(n=document.getElementById("btn-explore"))==null||n.addEventListener("click",()=>{this.gs.audio.playBeep(),this.gs.ui.removeElement("day-end"),this.gs.ui.removeElement("center-text"),this.scheduleIndex=0,this.tasksCompleted=0,this._showSchedule()})},100)},2e3)}_startEmergency(){this.emergencyActive=!0,this.gs.audio.playWarning(),this.gs.ui.showMessage("⚠️ تنبيه! تسرب هواء في قسم الصيانة!",5e3,"danger"),this.gs.ui.showObjective("أصلح التسرب قبل انخفاض الأكسجين!"),this.gs.playerData.oxygen=85,setTimeout(()=>{this.gs.ui.showComm("مركز التحكم","تسرب هواء! توجه فوراً إلى قسم الصيانة واستخدم مجموعة الإصلاح!",5e3)},1e3),this._startTask("powerRepair")}_clampPlayerPosition(){const t=this.playerPos,e=Math.abs(t.z)<=2.8,n=Math.abs(t.x)<=2.8;if(e&&(t.x=se.clamp(t.x,-26,26)),n&&(t.z=se.clamp(t.z,-11,11)),!e&&!n){const s=Math.abs(t.z)-2.8,r=Math.abs(t.x)-2.8;s<r?t.z=se.clamp(t.z,-2.8,2.8):t.x=se.clamp(t.x,-2.8,2.8)}t.y=se.clamp(t.y,-2.5,2.5)}update(t){this.time+=t,this.dayTime+=t;const e=this.gs.input,n=3,s=new A(-Math.sin(this.yaw),0,-Math.cos(this.yaw)),r=new A(Math.cos(this.yaw),0,-Math.sin(this.yaw));e.isForward()&&this.playerVel.add(s.clone().multiplyScalar(n*t)),e.isBackward()&&this.playerVel.add(s.clone().multiplyScalar(-n*t)),e.isLeft()&&this.playerVel.add(r.clone().multiplyScalar(-n*t)),e.isRight()&&this.playerVel.add(r.clone().multiplyScalar(n*t)),e.isUp()&&(this.playerVel.y+=n*t),e.isDown()&&(this.playerVel.y-=n*t),this.playerVel.multiplyScalar(.95),this.playerPos.add(this.playerVel.clone().multiplyScalar(t*10)),this._clampPlayerPosition(),this.gs.input.pointerLocked&&(this.yaw-=this.gs.input.mouseDX*.002,this.pitch-=this.gs.input.mouseDY*.002,this.pitch=se.clamp(this.pitch,-Math.PI/3,Math.PI/3),this.gs.input.resetMouseDelta()),this.astronaut&&(this.astronaut.position.copy(this.playerPos),this.astronaut.rotation.y=this.yaw+Math.PI,this.astronaut.position.y+=Math.sin(this.time*1.5)*.02,this.astronaut.rotation.z=Math.sin(this.time*.8)*.03);const a=2,o=.8,c=new A(-Math.sin(this.yaw),0,-Math.cos(this.yaw)),l=this.playerPos.clone().sub(c.clone().multiplyScalar(a)).add(new A(0,o,0)),h=Math.abs(l.z)<=2.8,d=Math.abs(l.x)<=2.8;h&&(l.x=se.clamp(l.x,-26,26)),d&&(l.z=se.clamp(l.z,-11,11)),!h&&!d&&(Math.abs(l.z)-2.8<Math.abs(l.x)-2.8?l.z=se.clamp(l.z,-2.8,2.8):l.x=se.clamp(l.x,-2.8,2.8)),l.y=se.clamp(l.y,-2.3,2.5),this.camera.position.lerp(l,t*8);const p=this.playerPos.clone().add(new A(0,.3,0));this.camera.lookAt(p),this.camera.rotation.x+=this.pitch*.5,this.floatingObjects.forEach(f=>{const u=f.userData.floatSpeed,S=f.userData.floatPhase;f.position.y+=Math.sin(this.time*u.y+S)*.001,f.position.x+=Math.sin(this.time*u.x+S)*5e-4,f.rotation.x+=t*u.x,f.rotation.z+=t*u.z}),this.earthOutside&&(this.earthOutside.rotation.y+=t*.01),Math.floor(this.time*2)%3===0&&this._showISSSections(),this.interactionPoints.forEach(f=>{f.marker&&(f.marker.material.opacity=.4+Math.sin(this.time*3)*.2),f.ring&&(f.ring.rotation.x=this.time,f.ring.rotation.z=this.time*.5)});let m=null,g=1/0;this.interactionPoints.forEach(f=>{const u=this.playerPos.distanceTo(f.pos);u<3&&u<g&&(g=u,m=f)}),this.gs.ui.removeElement("interact-hint"),m&&!this.activeTask&&!this.airlockPhase&&this.gs.ui.addElement("interact-hint",`
        <div style="position:fixed;bottom:120px;left:50%;transform:translateX(-50%);
          background:rgba(0,15,30,0.8);border:1px solid rgba(0,212,255,0.3);border-radius:2px;
          padding:8px 15px;direction:rtl;">
          <span style="color:#00d4ff;font-size:0.8rem;">اضغط F — ${m.name}</span>
        </div>
      `);const y=e.isKey("KeyF");if(y&&!this._fKeyWasDown&&!this.activeTask)if(m)m.type==="airlock"?this._showAirlockUI():this._showInteractionMenu(m);else{const f=this.dailySchedule[this.scheduleIndex];f&&f.task?this._startTask(f.task):f&&!f.task&&(this.gs.ui.showMessage(`${f.icon} ${f.name}`,1500,"info"),this._advanceSchedule())}this._fKeyWasDown=y,this.airlockPhase==="prebreathing"&&(this.prebreathTimer+=t,Math.floor(this.prebreathTimer)%3===0&&Math.floor(this.prebreathTimer)!==Math.floor(this.prebreathTimer-t)&&this._showAirlockUI(),this.prebreathTimer>=15&&(this.gs.audio.playConfirm(),this.gs.ui.showMessage("✓ إجراء التنفس المسبق مكتمل!",2e3,"success"),this._startDepressurization())),this.airlockPhase==="depressurizing"&&(this.depressureTimer+=t,Math.floor(this.depressureTimer)%2===0&&Math.floor(this.depressureTimer)!==Math.floor(this.depressureTimer-t)&&this._showAirlockUI(),this.airlockStatusLight&&this.airlockStatusLight.color.setHex(16711680),this.depressureTimer>=10&&(this.airlockPhase="ready",this.gs.audio.playSuccess(),this.gs.ui.showComm("مركز التحكم","الضغط صفر! الفتحة الخارجية مفتوحة. يمكنك الخروج الآن. حظاً سعيداً!",5e3),this._showAirlockUI())),this.emergencyActive&&(this.gs.playerData.oxygen-=t*.5,this.gs.playerData.oxygen<=0&&(this.gs.playerData.oxygen=0,(!this._oxygenCriticalWarnTime||this.time-this._oxygenCriticalWarnTime>3)&&(this._oxygenCriticalWarnTime=this.time,this.gs.ui.showMessage("⚠️ مستوى الأكسجين حرج!",2e3,"danger")))),this.gs.ui.removeElement("suit-status"),this.suitEquipped&&this.gs.ui.addElement("suit-status",`
        <div style="position:fixed;top:70px;left:15px;background:rgba(0,50,0,0.5);
          border:1px solid rgba(0,255,0,0.3);border-radius:6px;padding:5px 10px;">
          <span style="color:#00ff88;font-size:0.7rem;">🧑‍🚀 بدلة EMU — نشطة</span>
        </div>
      `),this.gs.ui.showHUD({oxygen:this.gs.playerData.oxygen,energy:95,health:this.gs.playerData.health,section:this.currentRoom})}render(t){t.render(this.scene,this.camera)}async cleanup(){var t;window.removeEventListener("resize",this._onResize),(t=document.getElementById("game-canvas"))==null||t.removeEventListener("click",this._onClickLock),this._suitingInterval&&(clearInterval(this._suitingInterval),this._suitingInterval=null),document.pointerLockElement&&document.exitPointerLock(),this.gs.ui.clear()}}class Kp{constructor(t){this.gs=t,this.scene=null,this.camera=null,this.iss=null,this.time=0,this.playerPos=new A(12,5,5),this.playerVel=new A,this.yaw=0,this.pitch=0,this.oxygenTimer=100,this.tethered=!0,this.repairTarget=null,this.repairProgress=0,this.tasksCompleted=0,this.totalTasks=5,this.mode="story",this.evaTaskList=[],this.suitEquipped=!0,this.suitPressure=4.3,this.suitBattery=100,this.suitCO2=0,this.currentTool="wrench"}async init(t={}){var s;this.mode=t.mode||"story",this.suitEquipped=t.suitEquipped??!0,this.scene=new mn,this.scene.background=new Ct(3),this.camera=new de(80,window.innerWidth/window.innerHeight,.05,3e3),window.addEventListener("resize",this._onResize=()=>{this.camera.aspect=window.innerWidth/window.innerHeight,this.camera.updateProjectionMatrix()}),this.scene.add(Cn(1e4));const e=Bi();e.position.set(300,100,-400),this.scene.add(e),this.earth=jn(150),this.earth.position.set(0,-180,50),this.scene.add(this.earth),this.iss=Ur(),this.iss.scale.setScalar(1),this.scene.add(this.iss),this.evaTaskList=[{name:"إصلاح اللوح الشمسي — أسلاك مقطوعة",type:"wiring",pos:new A(18,2,8),done:!1,steps:["فحص الأسلاك التالفة","قص الأسلاك المحروقة","تعرية الأطراف الجديدة","توصيل الأسلاك","اختبار التيار"],currentStep:0,tool:"wire_cutter"},{name:"استبدال وحدة الاتصال — لوحة إلكترونية",type:"electronics",pos:new A(-5,4,0),done:!1,steps:["فك البراغي","سحب اللوحة القديمة","تنظيف الموصلات","تركيب اللوحة الجديدة","تأمين البراغي"],currentStep:0,tool:"screwdriver"},{name:"تركيب مستشعر حراري جديد",type:"sensor",pos:new A(10,3,-5),done:!1,steps:["إزالة المستشعر القديم","تنظيف نقطة التركيب","تركيب المستشعر الجديد","توصيل الكابل","معايرة المستشعر"],currentStep:0,tool:"wrench"},{name:"إصلاح أنبوب تبريد — تسرب سائل",type:"plumbing",pos:new A(5,-2,10),done:!1,steps:["تحديد موقع التسرب","إغلاق صمام السائل","تطبيق مادة لاصقة فضائية","انتظار التجفيف","فتح الصمام واختبار"],currentStep:0,tool:"sealant"},{name:"تبديل بطارية خارجية",type:"battery",pos:new A(-12,1,-3),done:!1,steps:["فصل كابلات الطاقة","فك مشابك التثبيت","سحب البطارية القديمة","إدخال البطارية الجديدة","توصيل الكابلات","اختبار الجهد"],currentStep:0,tool:"wrench"}],this.totalTasks=this.evaTaskList.length,this.evaTaskList.forEach(r=>{const a=new Yt(.5,12,12),o={wiring:16737792,electronics:26367,sensor:65382,plumbing:16711782,battery:16776960}[r.type]||16724736,c=new Jt({color:o,transparent:!0,opacity:.7,blending:Se}),l=new P(a,c);l.position.copy(r.pos),this.scene.add(l),r.marker=l;const h=new Fe(.8,.05,8,24),d=new Jt({color:o,transparent:!0,opacity:.4}),p=new P(h,d);if(p.position.copy(r.pos),this.scene.add(p),r.ring=p,r.type==="wiring")for(let m=0;m<5;m++){const g=new Mt(.02,.02,1.5,4),y=[16711680,65280,255,16776960,16711935],f=new B({color:y[m]}),u=new P(g,f);u.position.set(r.pos.x+(m-2)*.1,r.pos.y+.5,r.pos.z),u.rotation.z=Math.PI/2,this.scene.add(u)}}),this.tetherGeo=new ee;const n=new Ni({color:16776960,transparent:!0,opacity:.6});this.tether=new Ms(this.tetherGeo,n),this.scene.add(this.tether),this.astronaut=this._createAstronaut(),this.scene.add(this.astronaut),this.toolbox=this._createToolbox(),this.scene.add(this.toolbox),this.playerPos.set(12,5,5),this.playerVel.set(0,0,0),this.yaw=-Math.PI/2,this.pitch=0,this.oxygenTimer=100,this.suitBattery=100,this.suitCO2=0,this.tasksCompleted=0,this.time=0,this.repairProgress=0,this._onClickLock=()=>{this.gs.input.requestPointerLock(document.getElementById("game-canvas"))},(s=document.getElementById("game-canvas"))==null||s.addEventListener("click",this._onClickLock),this.gs.ui.clear(),this.gs.ui.addGlobalStyles(),this.gs.ui.showChatButton(),this.gs.ui.showCenterText("خروج إلى الفضاء","EVA — نشاط خارج المركبة",3e3),this.gs.ui.showObjective("أصلح المواقع المحددة على المحطة — أسلاك، إلكترونيات، مستشعرات"),this.gs.ui.showControls([{key:"W/↑",action:"أمام"},{key:"S/↓",action:"خلف"},{key:"A/←",action:"يسار"},{key:"D/→",action:"يمين"},{key:"Q/مسافة",action:"أعلى"},{key:"E/Shift",action:"أسفل"},{key:"F (مع الاستمرار)",action:"إصلاح (عند الهدف)"}]),setTimeout(()=>{this.gs.ui.showComm("مركز التحكم","بدء نشاط خارج المركبة. لديك 5 مهام إصلاح. كل مهمة تتطلب عدة خطوات. راقب الأكسجين والبطارية. حظاً سعيداً!",7e3)},3500)}_createAstronaut(){const t=new te,e=new B({color:15658734,specular:4473924}),n=new dt(.9,1.1,.6),s=new P(n,e);t.add(s);const r=new Yt(.35,12,12),a=new B({color:14540253,specular:16777215,shininess:100}),o=new P(r,a);o.position.y=.7,t.add(o);const c=new Yt(.28,12,8,0,Math.PI*2,0,Math.PI*.5),l=new B({color:13404160,transparent:!0,opacity:.5,specular:16755200}),h=new P(c,l);h.position.set(0,.7,.15),h.rotation.x=Math.PI/4,t.add(h);const d=new dt(.7,.9,.35),p=new P(d,e);p.position.set(0,0,-.45),t.add(p);const m=new Mt(.08,.08,.6,8),g=new B({color:11189196});[-.2,.2].forEach(T=>{const L=new P(m,g);L.position.set(T,-.1,-.65),t.add(L)});const y=new Mt(.1,.09,.6,6);[-1,1].forEach(T=>{const L=new P(y,e);L.position.set(T*.55,-.1,0),L.rotation.z=T*.2,t.add(L)});const f=new Mt(.12,.11,.7,6);[-1,1].forEach(T=>{const L=new P(f,e);L.position.set(T*.2,-.85,0),t.add(L)});const u=new dt(.8,.2,.1),S=new B({color:8947848}),v=new P(u,S);v.position.set(0,-.5,-.65),t.add(v);const b=new Ue(.08,12),R=new Jt({color:13226}),C=new P(b,R);return C.position.set(.2,.3,.31),t.add(C),t.scale.setScalar(.8),t}_createToolbox(){const t=new te,e=new dt(.3,.15,.15),n=new B({color:6710886});t.add(new P(e,n));const s=new Mt(.015,.015,.25,4),r=new B({color:13421772});for(let a=0;a<3;a++){const o=new P(s,r);o.position.set(-.1+a*.1,.1,0),o.rotation.z=(Math.random()-.5)*.5,t.add(o)}return t}update(t){this.time+=t;const e=this.gs.input;this.oxygenTimer=Math.max(0,this.oxygenTimer-t*.25),this.suitBattery=Math.max(0,this.suitBattery-t*.08),this.suitCO2=Math.min(5,this.suitCO2+t*.03),this.suitCO2>3&&(this.suitCO2=Math.max(0,this.suitCO2-t*.5)),this.oxygenTimer<20&&(!this._oxygenWarnTime||this.time-this._oxygenWarnTime>3)&&(this._oxygenWarnTime=this.time,this.gs.ui.showMessage("⚠️ أكسجين منخفض! عد إلى المحطة!",2e3,"danger")),this.suitBattery<15&&(!this._batteryWarnTime||this.time-this._batteryWarnTime>5)&&(this._batteryWarnTime=this.time,this.gs.ui.showMessage("🔋 بطارية البدلة منخفضة!",2e3,"warning"));const n=2,s=new A(-Math.sin(this.yaw),0,-Math.cos(this.yaw)),r=new A(Math.cos(this.yaw),0,-Math.sin(this.yaw));e.isForward()&&this.playerVel.add(s.clone().multiplyScalar(n*t)),e.isBackward()&&this.playerVel.add(s.clone().multiplyScalar(-n*t)),e.isLeft()&&this.playerVel.add(r.clone().multiplyScalar(-n*t)),e.isRight()&&this.playerVel.add(r.clone().multiplyScalar(n*t)),e.isUp()&&(this.playerVel.y+=n*t),e.isDown()&&(this.playerVel.y-=n*t),this.playerVel.multiplyScalar(.97),this.playerPos.add(this.playerVel.clone().multiplyScalar(t*5)),this.playerPos.length()>40&&(this.playerPos.normalize().multiplyScalar(40),this.playerVel.multiplyScalar(-.5),this.gs.ui.showMessage("⚠️ أقصى طول للحبل! لا يمكنك الابتعاد أكثر",2e3,"warning")),this.gs.input.pointerLocked&&(this.yaw-=this.gs.input.mouseDX*.002,this.pitch-=this.gs.input.mouseDY*.002,this.pitch=se.clamp(this.pitch,-Math.PI/2,Math.PI/2),this.gs.input.resetMouseDelta()),this.astronaut.position.copy(this.playerPos),this.astronaut.rotation.y=this.yaw+Math.PI,this.astronaut.visible=!0,this.astronaut.rotation.z=Math.sin(this.time*.8)*.05,this.toolbox.position.copy(this.playerPos).add(new A(.5,-.3,0)),this.toolbox.rotation.y=this.yaw;const o=3,c=1.5,l=this.playerPos.clone().sub(s.clone().multiplyScalar(o)).add(new A(0,c,0));this.camera.position.lerp(l,t*6),this.camera.lookAt(this.playerPos.clone().add(new A(0,.3,0))),this.camera.rotation.x+=this.pitch*.5;const h=[new A(0,0,0),this.playerPos.clone()];this.tetherGeo.setFromPoints(h);let d=null;if(this.evaTaskList.forEach(p=>{if(p.done)return;const m=this.playerPos.distanceTo(p.pos);p.marker.material.opacity=.5+Math.sin(this.time*3)*.3,p.ring.rotation.x=this.time,p.ring.rotation.y=this.time*.5,m<3&&(d=p)}),this.gs.ui.removeElement("eva-hint"),d&&!d.done){const p=d.steps[d.currentStep];this.gs.ui.addElement("eva-hint",`
        <div style="position:fixed;bottom:130px;left:50%;transform:translateX(-50%);
          background:rgba(0,0,0,0.85);
          border:1px solid rgba(255,136,0,0.08);border-radius:2px;
          padding:8px 16px;direction:rtl;text-align:center;">
          <div style="color:rgba(255,136,0,0.85);font-size:0.78rem;font-family:'Tajawal',sans-serif;">${d.name}</div>
          <div style="color:rgba(255,149,0,0.7);font-size:0.72rem;margin-top:3px;">استمر بالضغط على F — ${p}</div>
          <div style="color:rgba(255,149,0,0.3);font-size:0.62rem;">خطوة ${d.currentStep+1} من ${d.steps.length}</div>
        </div>
      `)}if(d!==this._activeRepairTask&&(this.repairProgress=0,this._activeRepairTask=d),e.isKey("KeyF")&&d&&!d.done){this.repairProgress+=t*25,this.gs.ui.removeElement("repair-bar");const p=this.repairProgress%100;this.gs.ui.addElement("repair-bar",`
        <div style="position:fixed;top:60%;left:50%;transform:translateX(-50%);text-align:center;">
          <div style="color:#ffcc00;font-size:0.85rem;margin-bottom:5px;">
            ${d.steps[d.currentStep]} — ${Math.round(p)}%
          </div>
          <div style="width:200px;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;">
            <div style="width:${p}%;height:100%;background:linear-gradient(90deg,#ff8800,#ffcc00);border-radius:3px;transition:width 0.1s;"></div>
          </div>
          <div style="color:#557799;font-size:0.65rem;margin-top:3px;">
            🔧 أداة: ${this._getToolName(d.tool)}
          </div>
        </div>
      `),this.repairProgress>=100&&(this.repairProgress=0,d.currentStep++,this.gs.audio.playBeep(),d.currentStep>=d.steps.length?(d.done=!0,d.marker.material.color.setHex(65280),d.marker.material.opacity=.3,d.ring.material.color.setHex(65280),this.tasksCompleted++,this.gs.audio.playSuccess(),this.gs.ui.removeElement("repair-bar"),this.gs.ui.showMessage(`✓ ${d.name} — تم بنجاح!`,3e3,"success"),this.gs.ui.showComm("مركز التحكم",`إصلاح ممتاز! ${this.tasksCompleted}/${this.totalTasks} مهام مكتملة.`,4e3),this.tasksCompleted>=this.totalTasks&&this._evaComplete()):this.gs.ui.showMessage(`✓ ${d.steps[d.currentStep-1]} — تمت الخطوة`,1500,"info"))}else this.repairProgress=Math.max(0,this.repairProgress-t*10),this.gs.ui.removeElement("repair-bar");this.earth&&(this.earth.rotation.y+=t*.005),this.gs.ui.showHUD({oxygen:Math.max(0,this.oxygenTimer),energy:Math.max(0,this.suitBattery),health:this.gs.playerData.health}),this.gs.ui.removeElement("eva-tasks"),this.gs.ui.addElement("eva-tasks",`
      <div style="position:fixed;top:70px;right:15px;background:rgba(0,0,0,0.85);
        border:1px solid rgba(255,149,0,0.15);border-radius:2px;padding:10px 14px;direction:rtl;max-width:220px;">
        <div style="color:rgba(255,149,0,0.7);font-size:0.7rem;margin-bottom:5px;
          font-family:'Orbitron',monospace;letter-spacing:1px;">🧑‍🚀 مهام EVA (${this.tasksCompleted}/${this.totalTasks})</div>
        ${this.evaTaskList.map(p=>{const g={wiring:"⚡",electronics:"🔌",sensor:"📡",plumbing:"🔧",battery:"🔋"}[p.type]||"○";return`<div style="color:${p.done?"rgba(0,255,120,0.6)":"rgba(255,100,60,0.7)"};font-size:0.68rem;padding:1px 0;font-family:'Tajawal',sans-serif;">
            ${p.done?"✓":g} ${p.name.split("—")[0].trim()}
            ${!p.done&&p.currentStep>0?`<span style="color:#ffaa00;font-size:0.6rem;">(${p.currentStep}/${p.steps.length})</span>`:""}
          </div>`}).join("")}
      </div>
    `),this.gs.ui.removeElement("suit-systems"),this.gs.ui.addElement("suit-systems",`
      <div style="position:fixed;top:70px;left:15px;background:rgba(0,0,0,0.85);
        border:1px solid rgba(0,255,100,0.1);border-radius:2px;padding:10px 14px;direction:rtl;">
        <div style="color:rgba(0,255,120,0.7);font-size:0.68rem;margin-bottom:5px;
          font-family:'Orbitron',monospace;letter-spacing:1px;">🧑‍🚀 أنظمة البدلة (EMU)</div>
        <div style="color:${this.oxygenTimer>30?"#88ff88":"#ff4444"};font-size:0.65rem;">O₂: ${Math.round(this.oxygenTimer)}%</div>
        <div style="color:${this.suitBattery>20?"#88ff88":"#ff4444"};font-size:0.65rem;">🔋 بطارية: ${Math.round(this.suitBattery)}%</div>
        <div style="color:${this.suitCO2<3?"#88ff88":"#ffaa00"};font-size:0.65rem;">CO₂: ${this.suitCO2.toFixed(1)}%</div>
        <div style="color:#88aabb;font-size:0.65rem;">الضغط: ${this.suitPressure} PSI</div>
        <div style="color:#88aabb;font-size:0.65rem;">الحبل: ${this.tethered?"✓ متصل":"✗ منفصل"}</div>
      </div>
    `)}_getToolName(t){return{wrench:"مفتاح ربط",wire_cutter:"قاطعة أسلاك",screwdriver:"مفك براغي",sealant:"مادة لاصقة فضائية"}[t]||t}_evaComplete(){this.gs.ui.showCenterText("EVA مكتملة!","جميع الإصلاحات تمت بنجاح — عمل ممتاز!",0),this.gs.ui.showComm("مركز التحكم","عمل رائع يا رائد الفضاء! جميع الإصلاحات الخارجية اكتملت. الألواح الشمسية والاتصالات والمستشعرات تعمل بشكل مثالي. عد إلى القفل الهوائي.",7e3),setTimeout(()=>{this.gs.ui.addElement("eva-continue",`
        <div style="position:fixed;bottom:50px;left:50%;transform:translateX(-50%);display:flex;gap:10px;">
          <button class="menu-btn menu-btn-primary" style="display:inline-flex;width:auto;padding:10px 22px;" id="btn-to-return">
            <div class="menu-btn-icon">🌍</div>
            <div class="menu-btn-text"><div class="menu-btn-title" style="font-size:0.88rem;">العودة إلى الأرض</div></div>
          </button>
          <button class="menu-btn" style="display:inline-flex;width:auto;padding:10px 22px;" id="btn-back-iss">
            <div class="menu-btn-icon">🏠</div>
            <div class="menu-btn-text"><div class="menu-btn-title" style="font-size:0.88rem;">العودة للمحطة</div></div>
          </button>
        </div>
      `),setTimeout(()=>{var t,e;(t=document.getElementById("btn-to-return"))==null||t.addEventListener("click",()=>{this.gs.audio.playConfirm(),this.gs.switchScene("reEntry",{mode:this.mode})}),(e=document.getElementById("btn-back-iss"))==null||e.addEventListener("click",()=>{this.gs.audio.playConfirm(),this.gs.switchScene("issInterior",{mode:this.mode})})},100)},3e3)}render(t){t.render(this.scene,this.camera)}async cleanup(){var t;window.removeEventListener("resize",this._onResize),(t=document.getElementById("game-canvas"))==null||t.removeEventListener("click",this._onClickLock),document.pointerLockElement&&document.exitPointerLock(),this.gs.ui.clear()}}class Zp{constructor(t){this.gs=t,this.scene=null,this.camera=null,this.spacecraft=null,this.earth=null,this.time=0,this.phase="undocking",this.altitude=408,this.speed=7.66,this.entryAngle=0,this.heatLevel=0,this.shakeIntensity=0,this.mode="story",this.fireParticles=null,this.rumbleSound=null,this.warningShown=!1,this.gForce=1,this.blackoutTimer=0,this.isBlackout=!1,this.heatShieldTemp=20,this.modulesSeparated=!1,this.drogueDeployed=!1,this.ionTrail=null,this.shockwave=null}async init(t={}){this.mode=t.mode||"story",this.scene=new mn,this.scene.background=new Ct(3),this.camera=new de(65,window.innerWidth/window.innerHeight,.1,5e3),this.camera.position.set(0,5,16),window.addEventListener("resize",this._onResize=()=>{this.camera.aspect=window.innerWidth/window.innerHeight,this.camera.updateProjectionMatrix()}),this.scene.add(Cn(6e3));const e=Bi();e.position.set(200,100,-300),this.scene.add(e),this.earth=jn(200),this.earth.position.set(0,-250,-100),this.scene.add(this.earth),this.spacecraft=Cs(),this.spacecraft.scale.setScalar(1.5),this.scene.add(this.spacecraft),this.serviceModule=this._createServiceModule(),this.serviceModule.position.set(0,-4,0),this.scene.add(this.serviceModule),this.heatGlow=new We(16729088,0,25),this.heatGlow.position.set(0,-2,0),this.scene.add(this.heatGlow),this.heatGlow2=new We(16746496,0,15),this.heatGlow2.position.set(0,-3,0),this.scene.add(this.heatGlow2),this.fireParticles=this._createFireParticles(),this.fireParticles.visible=!1,this.scene.add(this.fireParticles),this.plasmaTrail=this._createPlasmaTrail(),this.plasmaTrail.visible=!1,this.scene.add(this.plasmaTrail),this.ionTrail=this._createIonTrail(),this.ionTrail.visible=!1,this.scene.add(this.ionTrail),this.shockwave=this._createShockwave(),this.shockwave.visible=!1,this.scene.add(this.shockwave),this.debrisParticles=this._createDebris(),this.debrisParticles.visible=!1,this.scene.add(this.debrisParticles),this.scene.add(new Pn(2241348,.3)),this.phase="undocking",this.altitude=408,this.speed=7.66,this.entryAngle=0,this.heatLevel=0,this.shakeIntensity=0,this.time=0,this.warningShown=!1,this.gForce=1,this.blackoutTimer=0,this.isBlackout=!1,this.heatShieldTemp=20,this.modulesSeparated=!1,this.drogueDeployed=!1,this._transitioning=!1,this.gs.ui.clear(),this.gs.ui.addGlobalStyles(),this.gs.ui.showChatButton(),this.mode==="challenge"?(this.phase="deorbit",this.altitude=200,this.gs.ui.showCenterText("تحدي الهبوط","حافظ على زاوية الدخول الصحيحة!",3e3)):this.gs.ui.showCenterText("العودة إلى الأرض","بدء إجراءات الانفصال عن المحطة",3e3),this.gs.ui.showControls([{key:"W/↑",action:"رفع المقدمة"},{key:"S/↓",action:"خفض المقدمة"}]),this._timeouts=[],this.phase==="undocking"&&(this._timeouts.push(setTimeout(()=>{this.gs.ui.showComm("مركز التحكم","بدء إجراءات الانفصال. فتح المشابك... فصل خراطيم الأمبيليكال.",5e3)},2e3)),this._timeouts.push(setTimeout(()=>{this.gs.audio.playConfirm(),this.gs.ui.showCenterText("انفصال عن المحطة","Undocking Complete",2500),this.phase="separation",this.gs.ui.showComm("مركز التحكم","الانفصال ناجح. ابتعاد 20 متر عن المحطة. استعداد لحرق الكبح.",5e3)},6e3)),this._timeouts.push(setTimeout(()=>{this.phase="deorbit",this.gs.audio.playBeep(),this.gs.ui.showCenterText("حرق الكبح","Deorbit Burn — تخفيض السرعة المدارية",3e3),this.gs.ui.showComm("مركز التحكم","حرق الكبح لمدة 4 دقائق و 40 ثانية. تخفيض السرعة بـ 128 م/ث. مسار الدخول محسوب.",6e3)},13e3)),this._timeouts.push(setTimeout(()=>{this.modulesSeparated=!0,this.gs.audio.playConfirm(),this.gs.ui.showCenterText("فصل الوحدات","انفصال وحدة الخدمة ووحدة المدار",3e3),this.gs.ui.showComm("مركز التحكم","وحدة الخدمة والوحدة المدارية انفصلتا. كبسولة الهبوط وحدها الآن. توجيه الدرع الحراري للأمام.",6e3)},2e4)),this._timeouts.push(setTimeout(()=>{this.phase="reentry",this.gs.audio.playWarning(),this.gs.ui.showCenterText("⚠️ دخول الغلاف الجوي","ارتفاع 122 كم — بداية الاحتكاك",3e3),this.gs.ui.showComm("مركز التحكم","بداية الدخول في الغلاف الجوي! السرعة 28,000 كم/ساعة. حافظ على زاوية الدخول بين -1° و -3°! زاوية خاطئة قد تؤدي للارتداد عن الغلاف أو الاحتراق!",8e3),this.rumbleSound=this.gs.audio.playReEntryRumble(30)},26e3)))}_createServiceModule(){const t=new te,e=new Mt(1.2,1.2,3,12),n=new B({color:8947848});t.add(new P(e,n));const s=new dt(4,.05,1),r=new B({color:1713022,specular:3355647});[-1,1].forEach(l=>{const h=new P(s,r);h.position.set(l*3,0,0),t.add(h)});const a=new Mt(.4,.6,.8,12),o=new B({color:5592405}),c=new P(a,o);return c.position.y=-1.8,t.add(c),t}_createFireParticles(){const e=new ee,n=new Float32Array(1200*3),s=new Float32Array(1200*3),r=new Float32Array(1200),a=[];for(let l=0;l<1200;l++){n[l*3]=(Math.random()-.5)*8,n[l*3+1]=-2+Math.random()*-12,n[l*3+2]=(Math.random()-.5)*8;const h=Math.random();h<.3?(s[l*3]=1,s[l*3+1]=.95,s[l*3+2]=.8):h<.6?(s[l*3]=1,s[l*3+1]=.4+h*.4,s[l*3+2]=h*.1):(s[l*3]=.8+h*.2,s[l*3+1]=.1+h*.2,s[l*3+2]=0),r[l]=.3+Math.random()*1.2,a.push({x:(Math.random()-.5)*4,y:6+Math.random()*14,z:(Math.random()-.5)*4})}e.setAttribute("position",new Zt(n,3)),e.setAttribute("color",new Zt(s,3));const o=new Ze({size:.8,vertexColors:!0,transparent:!0,opacity:.85,blending:Se,depthWrite:!1}),c=new en(e,o);return c.userData.velocities=a,c.userData.count=1200,c}_createPlasmaTrail(){const e=new ee,n=new Float32Array(600*3),s=new Float32Array(600*3);for(let r=0;r<600;r++)n[r*3]=(Math.random()-.5)*5,n[r*3+1]=3+Math.random()*25,n[r*3+2]=(Math.random()-.5)*5,s[r*3]=1,s[r*3+1]=.4+Math.random()*.3,s[r*3+2]=.1;return e.setAttribute("position",new Zt(n,3)),e.setAttribute("color",new Zt(s,3)),new en(e,new Ze({size:.5,vertexColors:!0,transparent:!0,opacity:.6,blending:Se,depthWrite:!1}))}_createIonTrail(){const e=new ee,n=new Float32Array(400*3),s=new Float32Array(400*3);for(let r=0;r<400;r++)n[r*3]=(Math.random()-.5)*3,n[r*3+1]=5+Math.random()*30,n[r*3+2]=(Math.random()-.5)*3,s[r*3]=.3+Math.random()*.3,s[r*3+1]=.2+Math.random()*.4,s[r*3+2]=.8+Math.random()*.2;return e.setAttribute("position",new Zt(n,3)),e.setAttribute("color",new Zt(s,3)),new en(e,new Ze({size:.3,vertexColors:!0,transparent:!0,opacity:.5,blending:Se,depthWrite:!1}))}_createShockwave(){const t=new An(5,8,16,1,!0),e=new Jt({color:16737792,transparent:!0,opacity:.15,side:ue,blending:Se}),n=new P(t,e);return n.rotation.x=Math.PI,n.position.y=-5,n}_createDebris(){const e=new ee,n=new Float32Array(100*3),s=new Float32Array(100*3);for(let r=0;r<100;r++){n[r*3]=(Math.random()-.5)*10,n[r*3+1]=Math.random()*20,n[r*3+2]=(Math.random()-.5)*10;const a=.5+Math.random()*.5;s[r*3]=a,s[r*3+1]=a*.8,s[r*3+2]=a*.5}return e.setAttribute("position",new Zt(n,3)),e.setAttribute("color",new Zt(s,3)),new en(e,new Ze({size:.15,vertexColors:!0,transparent:!0,opacity:.7}))}_updateFireParticles(t){const e=this.fireParticles.geometry.attributes.position.array,n=this.fireParticles.geometry.attributes.color.array,s=this.fireParticles.userData.velocities,r=this.fireParticles.userData.count;for(let a=0;a<r;a++)if(e[a*3]+=s[a].x*t,e[a*3+1]+=s[a].y*t*this.heatLevel,e[a*3+2]+=s[a].z*t,e[a*3+1]>20){e[a*3]=(Math.random()-.5)*5*this.heatLevel,e[a*3+1]=-2,e[a*3+2]=(Math.random()-.5)*5*this.heatLevel;const o=Math.random();this.heatLevel>.7?(n[a*3]=1,n[a*3+1]=.9,n[a*3+2]=.7):(n[a*3]=1,n[a*3+1]=.3+Math.random()*.5,n[a*3+2]=o*.2)}this.fireParticles.geometry.attributes.position.needsUpdate=!0,this.fireParticles.geometry.attributes.color.needsUpdate=!0}_updateIonTrail(t){const e=this.ionTrail.geometry.attributes.position.array,n=e.length/3;for(let s=0;s<n;s++)e[s*3+1]+=(8+Math.random()*5)*t*this.heatLevel,e[s*3+1]>35&&(e[s*3]=(Math.random()-.5)*3*this.heatLevel,e[s*3+1]=5,e[s*3+2]=(Math.random()-.5)*3*this.heatLevel);this.ionTrail.geometry.attributes.position.needsUpdate=!0}update(t){this.time+=t;const e=this.gs.input;if(this.modulesSeparated&&this.serviceModule.visible&&(this.serviceModule.position.y-=t*3,this.serviceModule.rotation.x+=t*.5,this.serviceModule.rotation.z+=t*.3,this.serviceModule.position.y<-30&&(this.serviceModule.visible=!1)),this.phase==="separation"&&(this.altitude-=t*.5),this.phase==="deorbit"&&(this.altitude-=t*8,this.speed=7.66,this.altitude<=122&&(this.phase="reentry",this.gs.audio.playWarning(),this.gs.ui.showCenterText("⚠️ دخول الغلاف الجوي","Entry Interface — 122 كم",3e3),this.rumbleSound=this.gs.audio.playReEntryRumble(25))),this.phase==="reentry"||this.phase==="heating"||this.phase==="blackout"){e.isForward()&&(this.entryAngle=Math.min(5,this.entryAngle+t*2)),e.isBackward()&&(this.entryAngle=Math.max(-8,this.entryAngle-t*2));const a=5+Math.abs(this.entryAngle)*4;if(this.altitude-=t*a,this.speed=Math.max(0,this.speed-t*.4),this.altitude<100&&this.altitude>25){const o=1-Math.abs(this.altitude-55)/45;this.gForce=1+o*4.5*(this.speed/7)}else this.gForce=Math.max(1,this.gForce-t*.5);if(this.altitude<100&&this.altitude>25){if(this.heatLevel=Math.min(1,(100-this.altitude)/45*(this.speed/5)),this.heatShieldTemp=20+this.heatLevel*1580,this.phase!=="blackout"&&(this.phase="heating"),this.fireParticles.visible=!0,this.plasmaTrail.visible=!0,this.ionTrail.visible=this.heatLevel>.3,this.shockwave.visible=this.heatLevel>.4,this.debrisParticles.visible=this.heatLevel>.2,this.shakeIntensity=this.heatLevel*4,this.heatGlow.intensity=this.heatLevel*6,this.heatGlow2.intensity=this.heatLevel*3,this.heatGlow.color.setHex(this.heatLevel>.7?16720384:16737792),this.shockwave.visible&&(this.shockwave.scale.setScalar(this.heatLevel*1.5),this.shockwave.material.opacity=this.heatLevel*.2),this.spacecraft.userData.shield){const l=this.spacecraft.userData.shieldMat;this.heatLevel>.7?l.emissive.setHex(16720384):this.heatLevel>.4?l.emissive.setHex(16737792):l.emissive.setHex(16746496),l.emissiveIntensity=this.heatLevel*1.2}this.heatLevel>.6&&!this.isBlackout&&(this.isBlackout=!0,this.phase="blackout",this.gs.ui.showMessage("📡 انقطاع الاتصال — بلازما مؤينة تحجب الإشارات",5e3,"warning"),this.gs.ui.showCenterText("انقطاع الاتصال","Communications Blackout",4e3)),this.isBlackout&&this.heatLevel<.4&&(this.isBlackout=!1,this.phase="heating",this.gs.audio.playConfirm(),this.gs.ui.showMessage("📡 استعادة الاتصال!",3e3,"success"),this.gs.ui.showComm("مركز التحكم","نسمعك مجدداً! أنت على المسار الصحيح. الدرع الحراري يعمل بشكل مثالي!",5e3)),!(this.entryAngle>=-4&&this.entryAngle<=-.5)&&!this.warningShown&&(this.warningShown=!0,this.entryAngle>-.5?this.gs.ui.showMessage("⚠️ زاوية ضحلة جداً! المركبة سترتد عن الغلاف! اخفض المقدمة (S)",3e3,"danger"):this.gs.ui.showMessage("⚠️ زاوية حادة جداً! حرارة مفرطة! ارفع المقدمة (W)",3e3,"danger"),setTimeout(()=>{this.warningShown=!1},4e3))}this.altitude<=25&&this.phase!=="descent"&&(this.phase="descent",this.heatLevel=0,this.isBlackout=!1,this.fireParticles.visible=!1,this.plasmaTrail.visible=!1,this.ionTrail.visible=!1,this.shockwave.visible=!1,this.debrisParticles.visible=!1,this.heatGlow.intensity=0,this.heatGlow2.intensity=0,this.shakeIntensity=.5,this.gForce=1,this.gs.audio.playConfirm(),this.gs.ui.showCenterText("اجتياز منطقة التسخين","Peak Heating Passed — مرحلة المظلات",3e3),this.gs.ui.showComm("مركز التحكم","أحسنت! اجتزت منطقة الاحتكاك. درجة حرارة الدرع 1600 درجة! بدء تسلسل المظلات في 10 كم.",6e3))}if(this.phase==="descent"&&(this.altitude-=t*5,this.speed=Math.max(0,this.speed-t*.8),this.shakeIntensity=Math.max(0,this.shakeIntensity-t*.1),this.altitude<=10&&!this.drogueDeployed&&(this.drogueDeployed=!0,this.gs.audio.playConfirm(),this.gs.ui.showCenterText("مظلات الكبح","Drogue Chutes — إبطاء من 230 م/ث إلى 80 م/ث",3e3),this.gs.ui.showComm("مركز التحكم","مظلات الكبح مفتوحة! السرعة تنخفض. بدء فتح المظلات الرئيسية على ارتفاع 5 كم.",5e3)),this.altitude<=5&&!this._transitioning&&(this._transitioning=!0,this.gs.ui.showCenterText("المظلات الرئيسية","Main Chutes Deployed",2e3),setTimeout(()=>{this.gs.switchScene("landing",{mode:this.mode,entryAngle:this.entryAngle})},2500))),this.fireParticles.visible&&this._updateFireParticles(t),this.ionTrail&&this.ionTrail.visible&&this._updateIonTrail(t),this.spacecraft.rotation.x=se.lerp(this.spacecraft.rotation.x,this.entryAngle*.1,t*2),this.shakeIntensity>0){const a=(Math.random()-.5)*this.shakeIntensity,o=(Math.random()-.5)*this.shakeIntensity,c=(Math.random()-.5)*this.shakeIntensity*.5;this.camera.position.x=a,this.camera.position.y=5+o,this.camera.position.z=16+c}this.camera.lookAt(this.spacecraft.position);const n=1+(408-this.altitude)/408*3;if(this.earth.scale.setScalar(n),this.earth.position.y=-250+(408-this.altitude)*.6,this.earth.rotation.y+=t*.005,this.altitude<100){const a=Math.max(0,(100-this.altitude)/100),o=new Ct().lerpColors(new Ct(3),new Ct(1122884),a);if(this.altitude<40){const c=(40-this.altitude)/40;o.lerpColors(o,new Ct(3368618),c*.5)}this.scene.background=o}if(this.gs.ui.removeElement("g-vignette"),this.gForce>2){const a=Math.min(.6,(this.gForce-2)/5);this.gs.ui.addElement("g-vignette",`
        <div style="position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;
          background:radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${a}) 100%);z-index:5;"></div>
      `)}this.gs.ui.removeElement("blackout-static"),this.isBlackout&&this.gs.ui.addElement("blackout-static",`
        <div style="position:fixed;top:70px;right:15px;background:rgba(255,0,0,0.2);border:1px solid rgba(255,0,0,0.5);
          border-radius:2px;padding:8px 15px;direction:rtl;animation:blink 1s infinite;">
          <div style="color:#ff4444;font-size:0.8rem;">📡 انقطاع الاتصال</div>
          <div style="color:#ff6666;font-size:0.65rem;">بلازما مؤينة — لا يمكن الاتصال بالأرض</div>
        </div>
        <style>@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}</style>
      `),this.gs.ui.showHUD({fuel:30,oxygen:85,energy:70,speed:Math.round(this.speed*1e3),altitude:Math.round(this.altitude)}),this.gs.ui.removeElement("angle-display");const s=this.entryAngle>=-4&&this.entryAngle<=-.5?"#00ff88":"#ff4444",r=this.gForce>4?"#ff4444":this.gForce>3?"#ffaa00":"#00ff88";this.gs.ui.addElement("angle-display",`
      <div style="position:fixed;bottom:100px;left:50%;transform:translateX(-50%);text-align:center;direction:rtl;">
        <div style="font-family:'Orbitron',monospace;color:${s};font-size:1.2rem;">
          زاوية الدخول: ${this.entryAngle.toFixed(1)}°
        </div>
        <div style="color:#557799;font-size:0.7rem;">المطلوب: من -0.5° إلى -4.0°</div>
        ${this.heatLevel>0?`
          <div style="margin-top:8px;">
            <div style="color:#ff6600;font-size:0.8rem;">حرارة الدرع: ${Math.round(this.heatShieldTemp)}°C</div>
            <div style="width:200px;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;margin:3px auto;">
              <div style="width:${this.heatLevel*100}%;height:100%;background:linear-gradient(90deg,#ff8800,#ff2200);border-radius:3px;"></div>
            </div>
          </div>
        `:""}
        <div style="margin-top:6px;">
          <div style="color:${r};font-size:0.8rem;">قوة G: ${this.gForce.toFixed(1)}G</div>
        </div>
        ${this.phase==="descent"&&this.drogueDeployed?`
          <div style="margin-top:6px;color:#88ff88;font-size:0.8rem;">🪂 مظلات الكبح — نشطة</div>
        `:""}
      </div>
    `)}render(t){t.render(this.scene,this.camera)}async cleanup(){window.removeEventListener("resize",this._onResize),this._timeouts&&(this._timeouts.forEach(t=>clearTimeout(t)),this._timeouts=[]);try{this.rumbleSound&&this.rumbleSound.source.stop()}catch{}this.gs.ui.clear()}}class Jp{constructor(t){this.gs=t,this.scene=null,this.camera=null,this.spacecraft=null,this.time=0,this.altitude=1e4,this.verticalSpeed=-230,this.phase="drogue",this.parachutes=[],this.drogueChutes=[],this.landed=!1,this.mode="story",this.swayAngle=0,this.windEffect=0,this.splashParticles=null,this.recoveryHelicopters=[],this.dyeMarkerActive=!1,this.retroFired=!1,this.retroParticles=null,this.divers=[],this.missionStartTime=Date.now(),this.bobbingPhase=0,this._timeouts=[]}async init(t={}){this.mode=t.mode||"story",this.scene=new mn,this.parachutes=[],this.drogueChutes=[],this.recoveryHelicopters=[],this.divers=[];const e=document.createElement("canvas");e.width=2,e.height=512;const n=e.getContext("2d"),s=n.createLinearGradient(0,0,0,512);s.addColorStop(0,"#1a3a6e"),s.addColorStop(.2,"#2a5aaa"),s.addColorStop(.4,"#3a7bd5"),s.addColorStop(.6,"#5b9ce6"),s.addColorStop(.8,"#87ceeb"),s.addColorStop(1,"#b0d4f1"),n.fillStyle=s,n.fillRect(0,0,2,512),this.scene.background=new Ts(e),this.camera=new de(60,window.innerWidth/window.innerHeight,.1,5e4),this.camera.position.set(12,8,18),window.addEventListener("resize",this._onResize=()=>{this.camera.aspect=window.innerWidth/window.innerHeight,this.camera.updateProjectionMatrix()});const r=new As(16774630,1.5);r.position.set(50,100,30),this.scene.add(r),this.scene.add(new Pn(8956620,.5)),this.scene.add(new Ir(8961023,4482696,.3));const a=new Ve(1e4,1e4,150,150),o=new B({color:27028,specular:4491434,shininess:60,transparent:!0,opacity:.9}),c=a.attributes.position.array;for(let l=0;l<c.length;l+=3)c[l+2]=Math.sin(c[l]*.05)*Math.cos(c[l+1]*.05)*2;a.computeVertexNormals(),this.ocean=new P(a,o),this.ocean.rotation.x=-Math.PI/2,this.ocean.position.y=-5,this.scene.add(this.ocean),this.spacecraft=Cs(),this.spacecraft.scale.setScalar(1.8),this.spacecraft.position.set(0,50,0),this.spacecraft.userData.solarPanels&&this.spacecraft.userData.solarPanels.forEach(l=>{l.visible=!1}),this.scene.add(this.spacecraft),this._createDrogueChutes(),this._createMainParachutes(),this._createClouds(),this._createRecoveryFleet(),this.splashParticles=this._createSplashParticles(),this.splashParticles.visible=!1,this.scene.add(this.splashParticles),this.retroParticles=this._createRetroParticles(),this.retroParticles.visible=!1,this.scene.add(this.retroParticles),this.altitude=1e4,this.verticalSpeed=-230,this.phase="drogue",this.landed=!1,this.time=0,this.swayAngle=0,this.retroFired=!1,this.dyeMarkerActive=!1,this.bobbingPhase=0,this.missionStartTime=Date.now(),this.gs.ui.clear(),this.gs.ui.addGlobalStyles(),this.gs.ui.showCenterText("مظلات الكبح","Drogue Chutes — إبطاء السرعة",2500),this.gs.ui.showObjective("الهبوط بسلام في المحيط الهادئ"),setTimeout(()=>{this.gs.ui.showComm("مركز التحكم — هيوستن","مظلات الكبح مفتوحة بنجاح! السرعة تنخفض من 230 م/ث إلى 80 م/ث. فتح المظلات الرئيسية على ارتفاع 3 كم.",6e3)},3e3),this.gs.ui.showChatButton()}_createDrogueChutes(){[16737792,16777215].forEach((e,n)=>{const s=new An(2,3.5,12,1,!0),r=new B({color:e,side:ue,transparent:!0,opacity:.8}),a=new P(s,r),o=n/2*Math.PI*2;a.position.set(Math.cos(o)*1.5,60,Math.sin(o)*1.5),a.rotation.x=Math.PI,this.scene.add(a),this.drogueChutes.push(a);for(let c=0;c<6;c++){const l=c/6*Math.PI*2,h=new ee().setFromPoints([new A(Math.cos(l)*1.8,3.5,Math.sin(l)*1.8),new A(0,-2,0)]),d=new Ms(h,new Ni({color:4473924}));d.position.copy(a.position),this.scene.add(d),a.userData.lines=a.userData.lines||[],a.userData.lines.push(d)}})}_createMainParachutes(){[16729156,16777215,16729156].forEach((e,n)=>{const s=new An(5,7,20,1,!0),r=new B({color:e,side:ue,transparent:!0,opacity:0}),a=new P(s,r),o=n/3*Math.PI*2;a.position.set(Math.cos(o)*4,65,Math.sin(o)*4),a.rotation.x=Math.PI,a.scale.setScalar(.1),this.scene.add(a),this.parachutes.push(a);for(let c=0;c<12;c++){const l=c/12*Math.PI*2,h=new ee().setFromPoints([new A(Math.cos(l)*4.5,7,Math.sin(l)*4.5),new A(0,-4,0)]),d=new Ms(h,new Ni({color:3355443,transparent:!0,opacity:0}));d.position.copy(a.position),this.scene.add(d),a.userData.lines=a.userData.lines||[],a.userData.lines.push(d)}})}_createClouds(){for(let t=0;t<40;t++){const e=new Yt(25+Math.random()*50,8,8),n=new B({color:16777215,transparent:!0,opacity:.3+Math.random()*.3}),s=new P(e,n);s.position.set((Math.random()-.5)*3e3,15+Math.random()*35,(Math.random()-.5)*3e3),s.scale.set(1+Math.random(),.3,1+Math.random()),this.scene.add(s)}}_createRecoveryFleet(){for(let n=0;n<3;n++){const s=new te,r=new dt(4,1.2,10),a=new B({color:4478310});s.add(new P(r,a));const o=new dt(4.5,.2,11),c=new B({color:6715272}),l=new P(o,c);l.position.y=.7,s.add(l);const h=new dt(2.5,2,2.5),d=new P(h,new B({color:7833753}));if(d.position.set(0,1.8,-3),s.add(d),n===0){const g=new Mt(.15,.15,6,6),y=new P(g,new B({color:13404160}));y.position.set(-1,3.5,2),s.add(y);const f=new dt(.15,.15,5),u=new P(f,new B({color:13404160}));u.position.set(-1,6.5,4),s.add(u);const S=new Ue(2,16),v=new Jt({color:8947848}),b=new P(S,v);b.rotation.x=-Math.PI/2,b.position.set(0,.8,3),s.add(b);const R=new Ve(1,.2),C=new Jt({color:16776960,side:ue}),T=new P(R,C);T.rotation.x=-Math.PI/2,T.position.set(0,.81,3),s.add(T);const L=new Ve(.8,.5),W=new Jt({color:13226,side:ue}),_=new P(L,W);_.position.set(0,3.2,-3),s.add(_)}const p=n/3*Math.PI*2+.5,m=80+n*30;s.position.set(Math.cos(p)*m,-4.5,Math.sin(p)*m),s.rotation.y=p+Math.PI,this.scene.add(s)}const t=this._createHelicopter();t.position.set(60,20,40),this.scene.add(t),this.recoveryHelicopters.push(t);const e=this._createHelicopter();e.position.set(-50,25,30),this.scene.add(e),this.recoveryHelicopters.push(e)}_createHelicopter(){const t=new te,e=new dt(1,.8,3),n=new B({color:4478310});t.add(new P(e,n));const s=new Yt(.6,8,8,0,Math.PI*2,0,Math.PI*.6),r=new B({color:8956620,transparent:!0,opacity:.5}),a=new P(s,r);a.position.set(0,.2,1.2),t.add(a);const o=new dt(6,.05,.3),c=new B({color:3355443}),l=new P(o,c);l.position.y=.8,l.userData.isRotor=!0,t.add(l);const h=new P(o,c);h.position.y=.8,h.rotation.y=Math.PI/2,h.userData.isRotor=!0,t.add(h);const d=new Mt(.15,.1,3,6),p=new P(d,n);p.position.set(0,0,-2.5),p.rotation.x=Math.PI/2,t.add(p);const m=new dt(1.5,.03,.15),g=new P(m,c);return g.position.set(0,.3,-4),g.userData.isRotor=!0,t.add(g),t}_createSplashParticles(){const e=new ee,n=new Float32Array(500*3),s=[];for(let o=0;o<500;o++)n[o*3]=(Math.random()-.5)*2,n[o*3+1]=-4,n[o*3+2]=(Math.random()-.5)*2,s.push({x:(Math.random()-.5)*12,y:4+Math.random()*10,z:(Math.random()-.5)*12});e.setAttribute("position",new Zt(n,3));const r=new Ze({size:.35,color:11197951,transparent:!0,opacity:.8}),a=new en(e,r);return a.userData.velocities=s,a}_createRetroParticles(){const e=new ee,n=new Float32Array(200*3),s=new Float32Array(200*3);for(let a=0;a<200;a++)n[a*3]=(Math.random()-.5)*1.5,n[a*3+1]=-3,n[a*3+2]=(Math.random()-.5)*1.5,s[a*3]=1,s[a*3+1]=.4+Math.random()*.5,s[a*3+2]=Math.random()*.2;e.setAttribute("position",new Zt(n,3)),e.setAttribute("color",new Zt(s,3));const r=new Ze({size:.5,vertexColors:!0,transparent:!0,opacity:.9,blending:Se,depthWrite:!1});return new en(e,r)}_createDivers(){for(let t=0;t<4;t++){const e=new te,n=new Mt(.12,.1,.5,6),s=new B({color:1118481});e.add(new P(n,s));const r=new Yt(.1,6,6),a=new B({color:14531464}),o=new P(r,a);o.position.y=.35,e.add(o);const c=new dt(.12,.06,.08),l=new B({color:2236962,specular:8947848}),h=new P(c,l);h.position.set(0,.35,-.08),e.add(h),[-1,1].forEach(m=>{const g=new Mt(.04,.04,.3,4),y=new P(g,s);y.position.set(m*.15,.1,0),y.rotation.z=m*.5,e.add(y)});const d=t/4*Math.PI*2,p=5+Math.random()*3;e.position.set(Math.cos(d)*p,-4.3,Math.sin(d)*p),e.visible=!1,this.scene.add(e),this.divers.push(e)}}update(t){if(this.phase==="recovery"){if(this.time+=t,this.bobbingPhase+=t,this.spacecraft.position.y=-3.5+Math.sin(this.bobbingPhase*1.5)*.3,this.spacecraft.rotation.z=Math.sin(this.bobbingPhase*.8)*.05,this.spacecraft.rotation.x=Math.cos(this.bobbingPhase*.6)*.03,this.recoveryHelicopters.forEach((o,c)=>{o.children.forEach(h=>{h.userData.isRotor&&(h.rotation.y+=t*25)});const l=c===0?new A(5,8,5):new A(-8,12,-5);o.position.lerp(l,t*.3)}),this.divers.forEach((o,c)=>{if(!o.visible)return;const l=2+c*.5,h=c/4*Math.PI*2+this.time*.1,d=new A(this.spacecraft.position.x+Math.cos(h)*l,-4.3+Math.sin(this.time*2+c)*.1,this.spacecraft.position.z+Math.sin(h)*l);o.position.lerp(d,t*.5),o.rotation.y=h+Math.PI}),this.splashParticles&&this.splashParticles.visible){const o=this.splashParticles.geometry.attributes.position.array,c=this.splashParticles.userData.velocities;let l=!0;for(let h=0;h<c.length;h++)o[h*3]+=c[h].x*t,o[h*3+1]+=c[h].y*t,o[h*3+2]+=c[h].z*t,c[h].y-=9.8*t,o[h*3+1]>-5&&(l=!1);this.splashParticles.geometry.attributes.position.needsUpdate=!0,this.splashParticles.material.opacity=Math.max(0,this.splashParticles.material.opacity-t*.3),(l||this.splashParticles.material.opacity<=0)&&(this.splashParticles.visible=!1)}this.camera.position.lerp(new A(15,3,20),t*.5),this.camera.lookAt(this.spacecraft.position),this._animateOcean(t);return}if(this.landed){if(this.time+=t,this._animateOcean(t),this.splashParticles&&this.splashParticles.visible){const o=this.splashParticles.geometry.attributes.position.array,c=this.splashParticles.userData.velocities;for(let l=0;l<c.length;l++)o[l*3]+=c[l].x*t,o[l*3+1]+=c[l].y*t,o[l*3+2]+=c[l].z*t,c[l].y-=9.8*t;this.splashParticles.geometry.attributes.position.needsUpdate=!0,this.splashParticles.material.opacity=Math.max(0,this.splashParticles.material.opacity-t*.3),this.splashParticles.material.opacity<=0&&(this.splashParticles.visible=!1)}this.bobbingPhase+=t,this.spacecraft.position.y=-3.5+Math.sin(this.bobbingPhase*1.5)*.3,this.spacecraft.rotation.z=Math.sin(this.bobbingPhase*.8)*.05,this.recoveryHelicopters.forEach(o=>{o.children.forEach(c=>{c.userData.isRotor&&(c.rotation.y+=t*25)})});return}this.time+=t,this.altitude<3e3&&this.phase==="drogue"&&(this.phase="main",this.gs.audio.playConfirm(),this.gs.ui.showCenterText("فتح المظلات الرئيسية","3 مظلات رئيسية — إبطاء إلى 7 م/ث",3e3),this.gs.ui.showComm("مركز التحكم — هيوستن","المظلات الرئيسية الثلاث مفتوحة بنجاح! انفصال مظلات الكبح. السرعة تنخفض إلى 7 م/ث. الكبسولة مستقرة.",5e3),this.drogueChutes.forEach(o=>{o.visible=!1,o.userData.lines&&o.userData.lines.forEach(c=>c.visible=!1)}),this.parachutes.forEach(o=>{o.material.opacity=.9,o.userData.lines&&o.userData.lines.forEach(c=>c.material.opacity=.6)}),this.verticalSpeed=-25),this.altitude<300&&this.phase==="main"&&(this.phase="final",this.verticalSpeed=-8,this.gs.ui.showComm("مركز التحكم — هيوستن","الارتفاع أقل من 300 متر! استعد للاصطدام بالماء. إطلاق 6 صواريخ هبوط ناعم على ارتفاع متر واحد فوق السطح.",5e3)),this.phase==="main"&&(this.verticalSpeed+=t*3,this.verticalSpeed>-8&&(this.verticalSpeed=-8)),this.altitude+=this.verticalSpeed*t;const e=Math.max(0,Math.round(this.altitude));(this.phase==="main"||this.phase==="final")&&this.parachutes.forEach(o=>{o.scale.lerp(new A(1.8,1.8,1.8),t*2)});const n=Math.max(-4,this.altitude*.005);this.spacecraft.position.y=n,this.swayAngle+=t*(this.phase==="main"?1.8:1.2),this.spacecraft.rotation.z=Math.sin(this.swayAngle)*(this.phase==="drogue"?.08:.04),this.spacecraft.rotation.x=Math.cos(this.swayAngle*.7)*.03,this.spacecraft.position.x=Math.sin(this.swayAngle*.3)*(this.phase==="drogue"?3:1.5),this.drogueChutes.forEach((o,c)=>{if(!o.visible)return;const l=c/2*Math.PI*2+this.swayAngle*.3;o.position.set(this.spacecraft.position.x+Math.cos(l)*1.5,n+8,Math.sin(l)*1.5),o.rotation.z=Math.sin(this.swayAngle+c)*.1,o.userData.lines&&o.userData.lines.forEach(h=>h.position.copy(o.position))}),this.parachutes.forEach((o,c)=>{const l=c/3*Math.PI*2+this.swayAngle*.15;o.position.set(this.spacecraft.position.x+Math.cos(l)*4,n+14,Math.sin(l)*4),o.rotation.z=Math.sin(this.swayAngle+c*2)*.06,o.userData.lines&&o.userData.lines.forEach(h=>h.position.copy(o.position))});const s=this.phase==="final"?8:12,r=this.phase==="final"?3:6;if(this.camera.position.set(s+Math.sin(this.time*.15)*2,n+r,s+Math.cos(this.time*.12)*2),this.camera.lookAt(this.spacecraft.position),this.recoveryHelicopters.forEach((o,c)=>{if(o.children.forEach(l=>{l.userData.isRotor&&(l.rotation.y+=t*20)}),this.altitude<2e3){const l=this.time*.3+c*Math.PI,h=35+c*15;o.position.set(Math.cos(l)*h,12+Math.sin(this.time+c)*3+c*5,Math.sin(l)*h),o.rotation.y=l+Math.PI/2}}),this._animateOcean(t),this.altitude<=5&&!this.retroFired&&this.phase==="final"&&(this.retroFired=!0,this.verticalSpeed=-1.5,this.gs.audio.playConfirm(),this.gs.ui.showCenterText("صواريخ الهبوط الناعم","6 محركات — إبطاء إلى 1.5 م/ث",2e3),this.gs.ui.showComm("مركز التحكم — هيوستن","صواريخ الهبوط الناعم أُطلقت! 6 محركات صلبة أبطأت السرعة إلى 5 كم/ساعة. استعد للاصطدام!",3e3),this.retroParticles.visible=!0,this.retroParticles.position.copy(this.spacecraft.position),this.retroParticles.position.y-=2,this.retroLight=new We(16737792,5,15),this.retroLight.position.copy(this.spacecraft.position),this.retroLight.position.y-=3,this.scene.add(this.retroLight)),this.retroParticles.visible){const o=this.retroParticles.geometry.attributes.position.array;for(let c=0;c<o.length;c+=3)o[c]+=(Math.random()-.5)*.3,o[c+1]-=t*(8+Math.random()*5),o[c+2]+=(Math.random()-.5)*.3,o[c+1]<-8&&(o[c]=this.spacecraft.position.x+(Math.random()-.5)*1.5,o[c+1]=this.spacecraft.position.y-2,o[c+2]=this.spacecraft.position.z+(Math.random()-.5)*1.5);this.retroParticles.geometry.attributes.position.needsUpdate=!0,this.retroParticles.position.set(0,0,0)}this.gs.ui.showHUD({speed:Math.round(Math.abs(this.verticalSpeed)),altitude:e}),this.gs.ui.removeElement("landing-phase");const a={drogue:"🪂 مظلات الكبح — 2 مظلات",main:"🪂🪂🪂 المظلات الرئيسية — 3 مظلات",final:"⚡ الهبوط النهائي"}[this.phase]||"";if(a&&this.gs.ui.addElement("landing-phase",`
        <div style="position:fixed;top:70px;right:15px;background:rgba(0,0,0,0.85);
          border:1px solid rgba(255,149,0,0.15);border-radius:2px;padding:10px 14px;direction:rtl;">
          <div style="color:rgba(255,149,0,0.7);font-size:0.8rem;font-family:'Tajawal',sans-serif;">${a}</div>
          <div style="color:rgba(140,170,200,0.5);font-size:0.68rem;">السرعة: ${Math.abs(this.verticalSpeed).toFixed(1)} م/ث</div>
          <div style="color:rgba(140,170,200,0.5);font-size:0.68rem;">الارتفاع: ${e} م</div>
          ${this.retroFired?'<div style="color:rgba(255,136,0,0.85);font-size:0.68rem;animation:pulse 0.5s infinite;">🔥 صواريخ الكبح — نشطة</div>':""}
        </div>
      `),this.altitude<=0){this.landed=!0,this.altitude=0,this.spacecraft.position.y=-3.5,this.gs.audio.playSuccess(),this.retroParticles.visible=!1,this.retroLight&&(this.retroLight.intensity=0),this.splashParticles.visible=!0,this.splashParticles.position.copy(this.spacecraft.position),this.dyeMarkerActive=!0;const o=new Ue(8,24),c=new Jt({color:65348,transparent:!0,opacity:.3,side:ue}),l=new P(o,c);l.rotation.x=-Math.PI/2,l.position.set(this.spacecraft.position.x,-4.9,this.spacecraft.position.z),this.scene.add(l),this._createDivers(),setTimeout(()=>{this.parachutes.forEach(h=>{h.scale.setScalar(.5),h.position.y=-4,h.material.opacity=.4})},2e3),this._showLandingSequence()}}_animateOcean(t){if(!this.ocean)return;const e=this.ocean.geometry.attributes.position.array;for(let n=0;n<e.length;n+=3)e[n+2]=Math.sin(e[n]*.05+this.time)*Math.cos(e[n+1]*.05+this.time*.7)*1.5+Math.sin(e[n]*.02+this.time*.3)*.8;this.ocean.geometry.attributes.position.needsUpdate=!0,this.ocean.geometry.computeVertexNormals()}_showLandingSequence(){this.gs.ui.clear(),this.gs.ui.addGlobalStyles(),this.gs.ui.showCenterText("هبوط ناجح!","Splashdown — المحيط الهادئ",0),this._timeouts.push(setTimeout(()=>{this.gs.ui.showComm("مركز التحكم — هيوستن","هيوستن تؤكد: هبوط ناجح! الكبسولة مستقرة في وضع عمودي. إشارة البيكون نشطة. سفن الإنقاذ USS تتجه إليك.",7e3)},2e3)),this._timeouts.push(setTimeout(()=>{this.divers.forEach(t=>{t.visible=!0}),this.gs.ui.showComm("قائد فريق الإنقاذ","فريق الغطاسين البحرية في الماء! نقترب من الكبسولة. تأمين طوق الطفو حول الكبسولة.",6e3)},8e3)),this._timeouts.push(setTimeout(()=>{this.gs.ui.showComm("سفينة الإنقاذ USS","الرافعة جاهزة لسحب الكبسولة. فتح الفتحة خلال دقائق. الفريق الطبي على أهبة الاستعداد.",6e3)},14e3)),this._timeouts.push(setTimeout(()=>{this.gs.ui.showComm("وكالة ناسا — مدير المهمة","مبروك يا رائد الفضاء! مهمة ناجحة بالكامل. أنت بطل! فريق الاستقبال الطبي جاهز على سطح السفينة. أحسنت!",8e3)},2e4)),this._timeouts.push(setTimeout(()=>{this.phase="recovery"},5e3)),this._timeouts.push(setTimeout(()=>{const t=Math.round((Date.now()-this.missionStartTime)/6e4);this.gs.ui.showGameEnding({missionTime:t>0?`${t} دقيقة`:"4 ساعات و 23 دقيقة",maxAltitude:"408 كم",maxSpeed:"27,576 كم/ساعة",maxGForce:"4.2G",maxHeat:"1,600°C",experiments:3,evaTime:"45 دقيقة"}),this._timeouts.push(setTimeout(()=>{var e,n,s;(e=document.getElementById("btn-new-mission"))==null||e.addEventListener("click",()=>{this.gs.audio.playConfirm(),this.gs.switchScene("preLaunch",{mode:"story"})}),(n=document.getElementById("btn-free-mode"))==null||n.addEventListener("click",()=>{this.gs.audio.playConfirm(),this.gs.switchScene("preLaunch",{mode:"free"})}),(s=document.getElementById("btn-main-menu"))==null||s.addEventListener("click",()=>{this.gs.audio.playConfirm(),this.gs.switchScene("mainMenu")})},100))},28e3))}render(t){t.render(this.scene,this.camera)}async cleanup(){window.removeEventListener("resize",this._onResize),this._timeouts.forEach(t=>clearTimeout(t)),this._timeouts=[],this.gs.ui.clear()}}const _a=document.getElementById("loading-bar"),bs=document.getElementById("loading-text"),va=document.getElementById("loading-screen");function kn(i,t){_a&&(_a.style.width=i+"%"),bs&&(bs.textContent=t)}async function Qp(){kn(10,"تهيئة محرك الرسومات...");const i=document.getElementById("game-canvas"),t=new Fp(i);kn(20,"تحميل نظام الصوت...");const e=new Op;kn(30,"تهيئة نظام التحكم...");const n=new zp;kn(40,"تحميل واجهة المستخدم...");const s=new kp,r={engine:t,audio:e,input:n,ui:s,currentScene:null,playerData:{name:"رائد الفضاء",fuel:100,oxygen:100,energy:100,health:100,skills:{navigation:1,repair:1,research:1,resource:1,docking:1},completedMissions:[],currentMission:null,score:0},missionData:{type:"standard",objectives:[],timeLimit:0},settings:{soundEnabled:!0,musicEnabled:!0,difficulty:"normal",language:"ar"}},a={mainMenu:new Gp(r),preLaunch:new Wp(r),launch:new Xp(r),spaceNavigation:new $p(r),docking:new Yp(r),issInterior:new jp(r),eva:new Kp(r),reEntry:new Zp(r),landing:new Jp(r)};r.scenes=a,r.switchScene=async(l,h)=>{r.currentScene&&await r.currentScene.cleanup();const d=a[l];d&&(r.currentScene=d,await d.init(h))},kn(60,"تحميل النماذج ثلاثية الأبعاد..."),await new Promise(l=>setTimeout(l,300)),kn(80,"تحميل المؤثرات البصرية..."),await new Promise(l=>setTimeout(l,300)),kn(100,"جاهز للإطلاق!"),await new Promise(l=>setTimeout(l,500)),va.style.opacity="0",setTimeout(()=>{va.style.display="none"},1e3),await r.switchScene("mainMenu");const o=new Np;function c(){requestAnimationFrame(c);const l=Math.min(o.getDelta(),.05);r.currentScene&&(r.currentScene.update(l),r.currentScene.render(t.renderer))}c()}Qp().catch(i=>{console.error("Game init error:",i),bs&&(bs.textContent="خطأ في التحميل: "+i.message)});
