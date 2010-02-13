/*
Copyright:

    Copyright (C) 2010 Hunter Paolini <corvineum@hotmail.com>

License:

		This file is part of tinyFilter.

    tinyFilter is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    tinyFilter is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with tinyFilter; if not, write to the Free Software
    Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301 USA
*/
tinyFilter.punctuation= new RegExp(/[\s+\u0021-\u0023\u0025-\u002A\u002C-\u002F\u003A\u003B\u003F\u0040\u005B-\u005D\u005F\u007B\u007D\u00A1\u00AB\u00B7\u00BB\u00BF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0964\u0965\u0970\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u104A-\u104F\u10FB\u1361-\u1368\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u19DE\u19DF\u1A1E\u1A1F\u1B5A-\u1B60\u1C3B-\u1C3F\u1C7E\u1C7F\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2E00-\u2E2E\u2E30\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA60D-\uA60F\uA673\uA67E\uA874-\uA877\uA8CE\uA8CF\uA92E\uA92F\uA95F\uAA5C-\uAA5F\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]/);

tinyFilter.searchHash= function(t, H){
	//var k=t.match(/\w+/g); //useless for unicode characters
	var k=t.split(this.punctuation), that = this;
	if(k!==null){
		var l=k.length;
		while(l--){
			var keyword=escape(k[l]);
			if(keyword.length===0)
				continue;

			var m = H[keyword];
			if(m===undefined){
				that.temp = [];
				continue;
			}

			if(m===1){
				return keyword;
			}else{
				var i=m.length;
				/*reverse look-up best
					to add |keyword| to |temp|
					when |m[i]==0| -- which occurs
					when |i==m.length-1|*/
				while(i--){
					if(m[i]===0){
						that.temp[that.temp.length]=keyword;	
					}else{
						var c = that.temp.reverse().join(" ");
						//alert(keyword+"=>"+temp+": "+ c + ": " +m[i]+", "+c.indexOf(m[i]));
						if(c.indexOf(m[i])===0){
							return keyword+" "+m[i];
						}
					}
				}
			}
		}
	}
	return false;
};

tinyFilter.content_scan= function(list){
 var that = this;
 function F(n, t){
 	if(that.detection || n===null)
		return;

  if(n.nodeType === 3 || t === "TITLE"){
   	node = (t!=="TITLE")?n.data:n; 
    var u = that.searchHash(node.toLowerCase(), list);
		if(u){
			window.stop();
     	that.action("Detected: \""+u+"\" in the <code>"+t+"</code> of the document.");
			that.detection = true;
    }
  }else if(n.tagName != "STYLE" && n.tagName != "SCRIPT"){
		var i=n.childNodes, l=i.length; while(l--){F(i[l], t);}
	}
 }
 F(that.doc.title, "TITLE");
 F(that.doc.body, "BODY");
};

tinyFilter.content_start= function(){
 if(!this.loaded){
	chrome.extension.sendRequest({name: "getPreferences"},
 	 function(response){
  	tinyFilter.init(response);
		tinyFilter.content_start();
 	});
	return;
 }

 if(this.prefs.content_filter.enabled){
	this.content_scan(this.prefs.hash_bw);
 }

 if(this.prefs.profanity_filter.enabled){
	this.profanity_content_scan(this.prefs.hash_pf);
 }
};

tinyFilter.searchHash2 = function(t, H){
	var k=t.split(this.punctuation), reg=[], that=this;
	if(k!==null){
		var l=k.length;
		while(l--){
			var keyword=escape(k[l]);
			if(keyword.length===0)
				continue;

			var m = H[keyword];
			if(m===undefined){
				that.temp = [];
				continue;
			}

			if(m===1){
				reg[reg.length]=keyword;
			}else{
				var i=m.length;
				while(i--){
					if(m[i]===0){
						that.temp[that.temp.length]=keyword;	
					}else{
						var c = that.temp.reverse().join(" ");
						if(c.indexOf(m[i])===0){
							reg[reg.length]=keyword+" "+m[i];
							break;
						}
					}
				}
			}
		}
	}
	return (reg.length>0)?reg.join("|"):false;
};

tinyFilter.profanity_content_scan = function(list){
	var that = this;
	function F(n, t){
		/*if(that.detection)  //XXX: should i run this on a trusted site??
			return;*/

  	if(n.nodeType === 3 || t === "TITLE"){
			if(t!=="TITLE"){
				var u = that.searchHash2(n.data.toLowerCase(), list);
				if(u){
					u = new RegExp(u.replace(/\%/g,"\\"), ["ig"]);
      		n.data = n.data.replace(u, "***");
      	}
			}else{
				var u = that.searchHash2(n.toLowerCase(), list);
				if(u){
					u = new RegExp(u.replace(/\%/g,"\\"), ["ig"]);
      		that.doc.title = n.replace(u, "***");
      	}
			}
    }else if(n.tagName != "STYLE" && n.tagName != "SCRIPT"){
			var i=n.childNodes, l=i.length; while(l--){F(i[l], t);}
		}
  }
	F(that.doc.title, "TITLE");
  F(that.doc.body, "BODY");
};
