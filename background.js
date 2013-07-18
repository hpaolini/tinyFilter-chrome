/*
Copyright:

    Copyright (C) 2013 Hunter Paolini <me@hpaolini.com>

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

var tinyFilter_bg = {
	prefs : {
		content_filter : (function(){
			return (localStorage.getItem("content_filter")) ? JSON.parse(localStorage.getItem("content_filter")) : [];
		})(),
		profanity_filter : (function(){
			return (localStorage.getItem("profanity_filter")) ? JSON.parse(localStorage.getItem("profanity_filter")) : [];
		})(),
		subscriptions : (function(){
			return (localStorage.getItem("subscriptions")) ? JSON.parse(localStorage.getItem("subscriptions")) : [];
		})()
	},
	prepareHash : function(list){
		var hashMap = {};
		var l = list.length;
		while(l--){
			var keyword = list[l];
			if(keyword === undefined){
				continue;
			}
			
			keyword = escape(keyword.toLowerCase());
			keyword = keyword.split("%20");
			if(keyword.length == 1){
				hashMap[keyword[0]]=1;
			}else{
				var j = keyword.length;
				var multi = "";
				while(j--){
					var k = hashMap[keyword[j]];
					if(k === 1){
 						/* worthless adding |word1 word2| when |word1| is present as an individual pattern */
						break;
					}
					if(j === 0){
						if(k != undefined){
							if(!this.isDuplicate(k, multi)){
								hashMap[keyword[0]].push(multi);
							}
						}else{
							hashMap[keyword[0]]=[multi];
						}
					}else{
						multi = (multi != "") ? keyword[j] + " " + multi:keyword[j];
						if(k != undefined){
							if(!this.isDuplicate(k, 0)){
								hashMap[keyword[j]].push(0);
							}
						}else{
							hashMap[keyword[j]] = [0];
						}
					}
				}
			}
		}
		//alert(getKeys(hashMap));
		return hashMap;
	},

	isDuplicate : function(arr, key){
 		var len = arr.length;
 		while(len--){
			if(arr[len] == key){
				return true;
			}
 		}
 		return false;
	},

	generateSubscription : function(){
		var dataURI = "data:text/plain;charset=utf-8,%23 TINYFILTER EXTENSION%0A%23 LIST SUBSCRIPTION%0A%23 DATE: " +
			new Date() + "%0A%0A[tinyFilter]" +
			"%0A%0A%23 Block pages based on following criteria" +
			"%0ACONTENT_FILTER.BLOCK.SITES=" + this.prefs.content_filter.block.sites +
			"%0A%0ACONTENT_FILTER.BLOCK.WORDS=" + this.prefs.content_filter.block.words +
			"%0A%0A%23 Trust pages" +
			"%0ACONTENT_FILTER.TRUST.SITES=" + this.prefs.content_filter.trust.sites +
			"%0A%0A%23 Mask profanity" +
			"%0APROFANITY_FILTER.WORDS=" + this.prefs.profanity_filter.words;
		chrome.tabs.create({url:dataURI});
	},

	loadSubscription : function(url){
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url, false);
		xhr.send();

		var file = xhr.responseText.split(/[\n]+/);
		var legit = false;
		var re_comment = /^(#|\\s+#)/;		//comment preceded by #
		var re_legit = /^\[tinyFilter\]/i;
		var re_cfg_name = /.*\=/;
		var line;

		var subscriptions = {
			content_filter : {
				block : {},
				trust : {}
			},
			profanity_filter : {}
		};

		for(var i = 0, len = file.length; i < len; i++){
			line = file[i];
			
			if(re_comment.test(line)){
				continue;
			}
		
			if(re_legit.test(line)){
				legit = true;
				continue;
			}

			if(!legit){
				alert("Subscription file is not valid.");
				return false;
			}

			var cfg_found = re_cfg_name.test(line);
			if(cfg_found){
				var settings = line.replace(re_cfg_name, "");

				if(settings.length!=0){				
					if(line.indexOf("CONTENT_FILTER.BLOCK.SITES=")!=-1){
						subscriptions.content_filter.block.sites = settings.split(",");
					}else if(line.indexOf("CONTENT_FILTER.BLOCK.WORDS=")!=-1){
						subscriptions.content_filter.block.words = settings.split(",");
					}else if(line.indexOf("CONTENT_FILTER.TRUST.SITES=")!=-1){
						subscriptions.content_filter.trust.sites = settings.split(",");
					}else if(line.indexOf("PROFANITY_FILTER.WORDS=")!=-1){
						subscriptions.profanity_filter.words = settings.split(",");			
					}
				}
			}
		}
		return subscriptions;
	},

	/*replaces previous function |load_default()| which ran during first install only*/
	fixSettings : function(){
		if(localStorage.getItem('content_filter') == null){
			var default_lists = this.loadSubscription("default.txt");
			var content_filter = {
				enabled : true,
				advanced : {
					warning : "This page is unavailable due to policy restrictions.",
					stop_all : false,
					reason : true,
					redirect : ""
				},
				block : {
					sites : default_lists.content_filter.block.sites,
					words : default_lists.content_filter.block.words
				},
				trust	:	{
					sites : default_lists.content_filter.trust.sites
				}
			};
			localStorage.setItem('content_filter', JSON.stringify(content_filter));
			this.prefs.content_filter = content_filter;
		}

		if(localStorage.getItem('profanity_filter') == null){
			var default_lists = this.loadSubscription("default.txt");
			var profanity_filter = {
				enabled : true,
				words : default_lists.profanity_filter.words
			};
			localStorage.setItem('profanity_filter', JSON.stringify(profanity_filter));
			this.prefs.profanity_filter = profanity_filter;
		}

		if(localStorage.getItem('subscriptions') == null){
			var subscriptions = {
				enabled : false,
				url : ""
			};
			localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
			this.prefs.subscriptions = subscriptions;
		}

		if(localStorage.getItem('general_settings') == null){
			var general_settings = {
				password : {
					hash : ""
				}
			};
			localStorage.setItem('general_settings', JSON.stringify(general_settings));
		}
	},
	init : function(){
		//might as well as to run this sanity check to recover missing settings
		this.fixSettings();

		//append subscription lists to local settings
		if(this.prefs.subscriptions.enabled){
			this.prefs.content_filter.block.sites = 
				this.prefs.content_filter.block.sites.concat(this.prefs.subscriptions.content_filter.block.sites);

			this.prefs.content_filter.block.words = 
				this.prefs.content_filter.block.words.concat(this.prefs.subscriptions.content_filter.block.words);

			this.prefs.content_filter.trust.sites = 
				this.prefs.content_filter.trust.sites.concat(this.prefs.subscriptions.content_filter.trust.sites);

			this.prefs.profanity_filter.words =
				this.prefs.profanity_filter.words.concat(this.prefs.subscriptions.profanity_filter.words);
		}

		if(this.prefs.content_filter.advanced.redirect){
			this.prefs.content_filter.trust.sites = 
			this.prefs.content_filter.trust.sites.concat(this.prefs.content_filter.advanced.redirect.replace(/^https?:\/\//i,""));
		}

		this.prefs.hash_bw = this.prepareHash(this.prefs.content_filter.block.words);
		this.prefs.hash_pf = this.prepareHash(this.prefs.profanity_filter.words);
	}
};

(function(){
	// Update Subscription
	
	var tf_subs = tinyFilter_bg.prefs.subscriptions;
	if(!tf_subs){
		return;
	}
	
	var three_days = 259200000;
	var time_since_last_update = new Date().getTime() - tf_subs.last_update;
	
	if(tf_subs.enabled && time_since_last_update > three_days){
		var response = tinyFilter_bg.loadSubscription(tinyFilter_bg.prefs.subscriptions.url);
		if(response){
			tinyFilter_bg.prefs.subscriptions.content_filter.block.sites = (response.content_filter.block.sites) ? response.content_filter.block.sites : [];
			tinyFilter_bg.prefs.subscriptions.content_filter.block.words = (response.content_filter.block.words) ? response.content_filter.block.words : [];
			tinyFilter_bg.prefs.subscriptions.content_filter.trust.sites = (response.content_filter.trust.sites) ? response.content_filter.trust.sites : [];
			tinyFilter_bg.prefs.subscriptions.profanity_filter.words = (response.profanity_filter.words) ? response.profanity_filter.words : [];
			tinyFilter_bg.prefs.subscriptions.last_update = new Date().getTime();
			localStorage.setItem('subscriptions', JSON.stringify(tinyFilter_bg.prefs.subscriptions));
			//alert("subscription list updated");
		}
	}
})();

tinyFilter_bg.init();

chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse){
		switch (request.name){
			case "getPreferences":
				sendResponse(tinyFilter_bg.prefs);
				break;

			case "redirectPage":
				loadURI(sender.tab);
				break;

			default:
				break;
		}
	}
);

function loadURI(tab){
	var tabUrl = tinyFilter_bg.prefs.content_filter.advanced.redirect;
	chrome.tabs.update(tab.id, {url: tabUrl});
}
var popup = {
	getDomain: function(url){
		var link = document.createElement('a');
		link.href = url;
		return link.host.replace(/www\./i,'');
	},

	/*
		TODO: possibly join popup.filter() with onload event of options.html
			and use only one authentication check across the extension
	*/
	filter: function(action, tab){
		var domain=this.getDomain(tab.url);
			
		if(action === 0){
			var response = window.confirm("Block \""+domain+"\"?");
		}else{
			var response = window.confirm("Trust \"" + domain + "\"?");
		}
		if(response){
			var gs = JSON.parse(localStorage.getItem('general_settings'));
			if(gs.password.hash.length>0){
			var input = window.prompt("Please enter your password.", "");
				if(Crypto.SHA256(input) !== gs.password.hash){
					alert("Action denied: Password is incorrect.");
					return 0;
				}
			}
			var content_filter=tinyFilter_bg.prefs.content_filter;
			if(action === 0){
				content_filter.block.sites[content_filter.block.sites.length]=domain;
			}else if(action === 1){
				content_filter.trust.sites[content_filter.trust.sites.length]=domain;
			}
			localStorage.setItem('content_filter', JSON.stringify(content_filter));
			chrome.tabs.update(tab.id, {
				url: tab.url
			});
		}
	}
};

/*
var getKeys = function(obj){
	var v="";
	for(var key in obj){
		v=v+"\n"+key+": "+obj[key];
	}
	return v;
}
*/
