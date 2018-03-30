var webglWidth = window.innerWidth,
	webglHeight = window.innerHeight;
$("#app").width(webglWidth).height(webglHeight); 
$("#ob_app").width(webglWidth).height(webglHeight); 

$(window).resize(function() {
	webglWidth = window.innerWidth;
	webglHeight = window.innerHeight;
	$("#app").width(webglWidth).height(webglHeight);
	$("#ob_app").width(webglWidth).height(webglHeight);
});
