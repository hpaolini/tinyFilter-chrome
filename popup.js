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

function actionSite(id){
/* id = 0 --> block
			= 1 --> trust */
chrome.tabs.getSelected(null,function(tab){
	var background = chrome.extension.getBackgroundPage();
	window.close();
	background.popup.filter(id, tab);
});
}

window.addEventListener('DOMContentLoaded', function(e){
  document.getElementById("btn_ppbs").addEventListener("click", function(){
    actionSite(0);
  });
  document.getElementById("btn_ppts").addEventListener("click", function(){
    actionSite(1);
  });
  document.getElementById("btn_ppopt").addEventListener("click", function(){
    chrome.tabs.create({url:"options.html"});
    window.close();
 });
});
