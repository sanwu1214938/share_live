// 浏览器环境
var ua = navigator.userAgent.toLowerCase();
var langInfo = langInfo;
var comm = {
	// "apiBaseUrl": "/",
	// "apiBaseUrl": "https://www.amm.tv/",
	"apiBaseUrl": "https://test.amm.tv/",
	"appVersion": "1.0.0",
	"languageType": "zh_HK",
	"androidDownload": "https://play.google.com/store/apps/details?id=tv.amm.app",
	"iosDownload": "https://apps.apple.com/app/id1517950229",
	"wxTodown": sourcesPath + "live/down.html",
	"pcSite": "https://www.amm.tv/?lang=" + langInfo + "",
	//获取url参数值
	getUrlData: function(paras) {
		var url = location.href;
		if (url.charAt(url.indexOf("?") + 1) == "&") {
			paraString = url.substring(url.indexOf("?") + 2, url.length).split("&");
		} else {
			paraString = url.substring(url.indexOf("?") + 1, url.length).split("&");
		}
		var paraObj = {};

		for (i = 0; j = paraString[i]; i++) {
			paraObj[j.substring(0, j.indexOf("=")).toLowerCase()] = j.substring(j.indexOf("=") + 1, j.length)
		}
		var returnValue = paraObj[paras.toLowerCase()];
		if (typeof(returnValue) == "undefined") {
			return ""
		} else {
			return returnValue
		}
	},
	// 获取语言文件
	getLanguageData: function(fun) {
		var str = (!comm.languageType || comm.languageType == "zh_HK") ? "zh_HK" : comm.languageType;
		$.ajax({
			url: sourcesPath + "lang/" + str + ".json",
			async: false,
			success: function(data) {
				fun(data, str);
			}
		});
	},
	// 系统信息
	sysTemInfo: function() {
		if ((ua.indexOf('android') > -1 || ua.indexOf('linux') > -1) || navigator.platform.toLowerCase().indexOf('linux') != -1) {
			return 'android';
		} else if (ua.indexOf('iphone') > -1 || ua.indexOf('ipad') > -1) {
			return 'ios';
		}
	},
	// 测试交互(与原生交互)
	getNativeUserInfo: function() {
		if (dsBridge.call('getUserInfo', "amm.tv")) {
			// alert(dsBridge.call('getUserInfo', "amm.tv"));
			return JSON.parse(dsBridge.call('getUserInfo', "amm.tv"));
		} else {
			return {};
		}
	},
	getNativeDeviceInfo: function() {
		if (dsBridge.call('getDeviceInfo', "amm.tv")) {
			// alert(dsBridge.call('getDeviceInfo', "amm.tv"));
			return JSON.parse(dsBridge.call('getDeviceInfo', "amm.tv"));
		} else {
			return {};
		}
	},
	jsBack: function() {
		setTimeout(() => {
			dsBridge.call('jsBack', "amm.tv");
		}, 500);
	}
}
