var comm = {
	"apiBaseUrl": "https://test.amm.tv/",
	// "apiBaseUrl": "https://www.amm.tv/",
	"appVersion": "1.0.0",
	"languageType": "zh_CN",
	"androidDownload": "http://d.7short.com/2s1z",
	"iosDownload": "http://d.7short.com/34q9",
	"wxTodown": "./down.html",
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
		var str = (!comm.languageType || comm.languageType == "zh_CN") ? "zh_CN" : comm.languageType;
		$.ajax({
			url: sourcesPath + "lang/" + str + ".json",
			async: false,
			success: function(data) {
				fun(data, str);
			}
		});
	}
}
