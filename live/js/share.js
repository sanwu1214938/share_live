// 此方法可区分
var ua = navigator.userAgent.toLowerCase();
// svga礼物列表
var svgaList = [];
var giftTimer = null;
var smallGiftNum = {};
// 定时器
var maskTimer;

var app = new Vue({
	el: '#app',
	data: function() {
		return {
			SDKAppID: 0, //腾讯云web端IM应用ID
			chatRoomID: 0, //测试群组ID
			currentAttentionState: 0, //关注状态:0=>未关注;1=>已关注
			diyChatList: [], //聊天列表(弹幕列表)
			imgBaseUrl: "",
			liveAudienceList: [], // 直播间观众列表
			liveMaster: {}, // 主播信息
			liveCover: "", // 直播封面
			liveTips: "", // 直播间提示标题
			liveM3u8: "", // 直播m3u8地址

			language: {}, // 语言
			languageType: '',
			isXfive: true, //判断是否是x5内核浏览器
			landScape: 0, // 横竖屏 默认竖屏
			smallGiftList: null, // 小礼物列表
			showSmallGift: false,
			smallGiftNum: 0, // 小礼物数量

			showMask: false,
			maskZoomIn: true,
			maskZoomOut: false
		}
	},
	created() {
		var _this = this;

		// 直播间ID
		this.chatRoomID = chatRoomID;
		// 直播m3u8地址
		this.liveM3u8 = liveM3u8;
		// 获取基本配置
		this.getAppConfig();
		// 进入直播间
		this.enterLive();

		// 获取多语言数据
		this.languageType = langInfo;
		comm.languageType = this.languageType;
		comm.getLanguageData((data, str) => {
			_this.language = data;
		});
		console.log("语言数据:", this.language);
		console.log("语言:", this.languageType);
	},
	mounted() {
		var _this = this;

		// 提示是否打开App
		// this.mountedToapp();

		// 聊天消息列表自动滚动到底部
		this.chatListScroll();

		// 视频播放
		this.playVideo(_this.liveM3u8);

		// 页面图片加载失败时 默认显示统一处理
		document.addEventListener("error", function(e) {
			var elem = e.target;
			if (elem.tagName.toLowerCase() == "img") {
				elem.src = sourcesPath + "img/icon_mine_data_head_default.png";
			}
		}, true);
	},
	methods: {
		// 时间转换
		getCommentTime: function(time) {
			return getTime.gettime(time);
		},
		// 关注操作
		payAttention: function() {
			this.currentAttentionState = !this.currentAttentionState;
		},
		// 聊天消息列表自动滚动到底部
		chatListScroll: function() {
			var chatItemContainer = document.getElementById('chat_item_container');
			$(".chat_list_container").stop().animate({
				'scrollTop': chatItemContainer.scrollHeight
			}, 400, function() {
				$(".chat_list_container").stop(true, true);
			});
			// console.log("评论列表的scrollHeight:", chatItemContainer.scrollHeight);
			// console.log("评论列表的height:", $(".chat_item_container").height());
		},

		// (初始化tim实例)-用户连接腾讯云,并加入音视频聊天室
		joinTIMChatRoom: function() {
			var _this = this;

			// 初始化tim实例
			var options = {
				SDKAppID: _this.SDKAppID // 接入时需要将0替换为您的即时通信 IM 应用的 SDKAppID
			};
			var tim = TIM.create(options);
			tim.setLogLevel(0); // 普通级别，日志量较多，接入时建议使用;生产环境建议使用1;

			// 匿名用户加入(无需登录，入群后仅能接收消息)(游客模式)
			let joinPromise = tim.joinGroup({
				groupID: _this.chatRoomID
			});
			joinPromise.then(function(imResponse) {
				switch (imResponse.data.status) {
					case TIM.TYPES.JOIN_STATUS_WAIT_APPROVAL: // 等待管理员同意
						break
					case TIM.TYPES.JOIN_STATUS_SUCCESS: // 加群成功
						console.log("加群成功", imResponse.data.group) // 加入的群组资料

						// 加群成功后 监听消息接收
						// 收到推送的单聊、群聊、群提示、群系统通知的新消息，可通过遍历 event.data 获取消息列表数据并渲染到页面
						// event.name - TIM.EVENT.MESSAGE_RECEIVED
						// event.data - 存储 Message 对象的数组 - [Message]
						tim.on(TIM.EVENT.MESSAGE_RECEIVED, function(event) {
							console.log("直播间消息:", event.data);
							const length = event.data.length;
							let message;
							for (let i = 0; i < length; i++) {
								// Message 实例的详细数据结构请参考 Message
								// 其中 type 和 payload 属性需要重点关注
								// 从v2.6.0起，AVChatRoom 内的群聊消息，进群退群等群提示消息，增加了 nick（昵称） 和 avatar（头像URL） 属性，便于接入侧做体验更好的展示
								// 前提您需要先调用 updateMyProfile 设置自己的 nick（昵称） 和 avatar（头像 URL），请参考 updateMyProfile 接口的说明
								message = event.data[i];
								switch (message.type) {
									case TIM.TYPES.MSG_TEXT:
										// 收到了文本消息
										console.log("收到了文本消息:", message);
										break
									case TIM.TYPES.MSG_CUSTOM:
										// 收到了自定义消息
										console.log("收到了自定义消息:", JSON.parse(message.payload.data));
										// 将消息加入消息队列
										var chatlist = JSON.parse(message.payload.data);
										if (chatlist.imCode == 322) {
											_this.diyChatList.push(chatlist);
										} else if (chatlist.imCode == 250) {
											var giftMsg = chatlist;
											giftMsg = Object.assign({}, giftMsg, {
												"msg": "送出 " + giftMsg.giftInfo.giftName
											});
											// console.log("拼接后的礼物信息: ", giftMsg);
											// 使用svga库播放礼物
											if (giftMsg.giftInfo.isBig) {
												_this.diyChatList.push(giftMsg);
												svgaList.push(giftMsg.giftInfo.showUrl);
												// 播放
												var SVGAPlayer = new SVGA.Player('#canvas');
												var SVGAParser = new SVGA.Parser('#canvas');
												// giftMsg.giftInfo.showUrl
												// ./svga/money-gun-music.svga
												SVGAParser.load(giftMsg.giftInfo.showUrl, function(videoItem) {
													SVGAPlayer.loops = 1;
													SVGAPlayer.clearsAfterStop = true;
													SVGAPlayer.setVideoItem(videoItem);
													SVGAPlayer.startAnimation();
													SVGAPlayer.onFrame(function(i) {
														console.log(i);
													});
												});
											} else {
												if (smallGiftNum[giftMsg.giftInfo.giftId]) {
													smallGiftNum[giftMsg.giftInfo.giftId] += 1;
												} else {
													smallGiftNum = {};
													smallGiftNum[giftMsg.giftInfo.giftId] = 1;
												}
												_this.smallGiftNum = smallGiftNum[giftMsg.giftInfo.giftId];
												// 小礼物单独展示
												clearTimeout(giftTimer);
												_this.showSmallGift = true;
												// 小礼物信息
												_this.smallGiftList = chatlist;
												giftTimer = setTimeout(() => {
													_this.showSmallGift = false;
													smallGiftNum = {};
												}, 6000);
											}
											console.log("svga礼物列表: ", svgaList);
										}
										// 聊天消息列表自动滚动到底部
										_this.chatListScroll();
										break
									case TIM.TYPES.MSG_GRP_TIP:
										// 收到了群提示消息，如成员进群、群成员退群
										console.log("收到了群提示消息:", message);
										break
									case TIM.TYPES.MSG_GRP_SYS_NOTICE:
										// 收到了群系统通知，通过 REST API 在群组中发送的系统通知请参考 在群组中发送系统通知 API
										console.log("收到了群系统通知消息:", message);
										break
									default:
										break
								}
							}
						})

						// 加群成功后 获取直播间观众列表
						// _this.getLiveAudienceList();
						break
					case TIM.TYPES.JOIN_STATUS_ALREADY_IN_GROUP: // 已经在群中
						break
					default:
						break
				}
			}).catch(function(imError) {
				console.warn('joinGroup error:', imError) // 申请加群失败的相关信息
				console.log("加群失败");
			});

			// 监听事件，例如：
			tim.on(TIM.EVENT.ERROR, function(event) {
				// 收到 SDK 发生错误通知，可以获取错误码和错误信息
				// event.name - TIM.EVENT.ERROR
				// event.data.code - 错误码
				// event.data.message - 错误信息
			});
			tim.on(TIM.EVENT.SDK_NOT_READY, function(event) {
				// 收到 SDK 进入 not ready 状态通知，此时 SDK 无法正常工作
				// event.name - TIM.EVENT.SDK_NOT_READY
			});
		},

		// 视频播放
		playVideo: function(videourl) {
			var _this = this;
			var player = new Aliplayer({
				'id': 'xinyu_video',
				'height': '100%',
				'width': '100%',
				'source': videourl,
				'autoplay': true,
				'isLive': true,
				'useH5Prism': true,
				'useFlashPrism': false,
				'playsinline': true,
				'x5_type': 'h5', //通过 video 属性 “x5-video-player-type” 声明启用同层H5播放器，支持的值：h5 https://x5.tencent.com/tbs/guide/video.html
				'x5_fullscreen': true, //通过 video 属性 “x5-video-player-fullscreen” 声明视频播放时是否进入到 TBS 的全屏模式，支持的值：true
				'x5_video_position': 'center',
				'cover': './img/bg_download@2x.png',
			}, function(player) {
				console.log("The player is created");
				$('#xinyu_video video').attr('poster', './img/bg_download@2x.png');
			});

			// 同层播放设置
			$('video').attr('webkit-playsinline', 'webkit-playsinline');
			$('video').attr('x5-video-player-type', 'h5');
			$('video').attr('x5-video-player-fullscreen', 'true');
			$('video').attr('x-webkit-airplay', 'true');
			$('video').attr('playsinline', 'true');
			$('video').attr('webkit-playsinline', 'true');
			// $("video")[0].style["object-fit"] = "fill";

			window.onresize = function() {
				$("video")[0].style.width = window.innerWidth + "px";
				$("video")[0].style.height = window.innerHeight + "px";
			};
			
			// 控制横竖屏(根据后台给的参数设置; 默认竖屏:portraint; 横屏:landscape)
			if (Number(landScape)) {
				$('video').attr('x5-video-orientation', 'landscape');
			} else {
				$('video').attr('x5-video-orientation', 'portraint');
			}
			
			$("video")[0].addEventListener("x5videoenterfullscreen", function() {
				// 横竖屏
				if (Number(landScape)) {
					_this.landScape = true;
				} else {
					_this.landScape = false;
				}
			});
			$("video")[0].addEventListener("x5videoexitfullscreen", function() {
				_this.landScape = false;
			});
		},

		// 进入直播间 /live/enter
		enterLive: function() {
			var _this = this;
			$.ajax({
				type: "post",
				url: comm.apiBaseUrl + "live/enter",
				data: {
					liveId: _this.chatRoomID
				},
				success: (res) => {
					if (res.code == 0) {
						console.log('请求主播信息:', res.data);
						// 初始化数据...
						_this.liveMaster = res.data;
						_this.liveAudienceList = res.data.audienceList;
						_this.liveTips = res.data.tips;
						_this.liveCover = _this.imgBaseUrl + res.data.avatar;
					} else {
						console.log("请求主播信息出错");
					}
				},
				error: (err) => {
					console.log(err);
				}
			});
		},

		// 直播间观众列表 /live/getLiveAudienceList
		getLiveAudienceList: function() {
			var _this = this;
			$.ajax({
				type: "get",
				url: comm.apiBaseUrl + "live/getLiveAudienceList",
				data: {
					liveId: _this.chatRoomID
				},
				success: (res) => {
					if (res.code == 0) {
						console.log('请求直播间观众列表:', res.data);
						// 初始化数据...
						_this.liveAudienceList = res.data;
					} else {
						console.log("请求直播间观众列表出错");
					}
				},
				error: (err) => {
					console.log(err);
				}
			});
		},

		// 获取基本配置信息,如图片地址域名...
		getAppConfig: function() {
			$.ajax({
				type: "get",
				url: comm.apiBaseUrl + "server/getAppConfig",
				data: {
					appVersion: comm.appVersion
				},
				success: (res) => {
					if (res.code == 0) {
						console.log('配置请求结果', res.data);
						// 初始化数据...
						this.imgBaseUrl = res.data.image_server;
						this.SDKAppID = res.data.timAppID;

						// 获取完SDKAppID (初始化im实例)-用户连接,并加入聊天室,并监听接收消息
						this.joinTIMChatRoom();
					} else {
						alert("请求配置出错!");
					}
				},
				error: (err) => {
					console.log(err);
				}
			});
		},

		// 跳转App
		// 安卓：http://d.7short.com/2s1z
		// iOS： http://d.7short.com/34q9
		// amm://app/live/detail?type=live&dataId=455
		toApp: function() {
			var _this = this;
			var u = navigator.userAgent;
			var isWeixin = u.toLowerCase().indexOf('micromessenger') !== -1; // 微信内
			var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Linux') > -1; //android终端
			var isIOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端

			// 微信内
			if (isWeixin) {
				// var userConfirm = confirm(_this.language.comm.openApp);
				// if (userConfirm == true) {
				// 	// window.location.href = '' + comm.wxTodown + '?lang=' + _this.languageType + '&type=live&dataId=' + _this.chatRoomID + '';
				// 	window.location.href = comm.pcSite;
				// } else {
				// 	return;
				// }
				_this.mountedToapp();
			} else {
				//android端
				if (isAndroid) {
					//安卓app的scheme协议
					window.location.href = 'amm://app/live/detail?type=live&dataId=' + _this.chatRoomID + '';
					setTimeout(function() {
						let hidden = window.document.hidden || window.document.mozHidden || window.document.msHidden || window.document
							.webkitHidden;
						if (typeof hidden == "undefined" || hidden == false) {
							//应用宝下载地址 (emmm 找不到淘宝应用宝的地址，这里放的是 lucky coffee 地址)
							window.location.href = comm.androidDownload;
						}
					}, 2000);
				} else if (isIOS) { //ios端
					//ios的scheme协议
					window.location.href = 'amm://app/live/detail?type=live&dataId=' + _this.chatRoomID + '';
					setTimeout(function() {
						let hidden = window.document.hidden || window.document.mozHidden || window.document.msHidden || window.document
							.webkitHidden;
						if (typeof hidden == "undefined" || hidden == false) {
							//App store下载地址
							window.location.href = comm.iosDownload;
						}
					}, 2000);
				} else {
					window.location.href = comm.pcSite;
				}
			}
		},
		// 页面刚打开就提示是否跳转App
		mountedToapp: function() {
			this.showMask = true;
			this.maskZoomIn = true;
			this.maskZoomOut = false;
		},
		// 隐藏遮罩层
		hideMask: function() {
			var that = this;
			this.maskZoomIn = false;
			this.maskZoomOut = true;
			clearTimeout(maskTimer);
			maskTimer = setTimeout(function() {
				that.showMask = false;
			}, 300)
		},
		// 确认
		confirm: function() {
			var u = navigator.userAgent;
			var isWeixin = u.toLowerCase().indexOf('micromessenger') !== -1; // 微信内

			this.hideMask();
			if (isWeixin) {
				window.location.href = comm.pcSite;
				// window.location.href = "https://fanyi.baidu.com/?aldtype=16047#zh/en/%E9%9A%90%E8%97%8F";
			} else {
				this.toApp();
			}
		},
		// 取消
		cancel: function() {
			this.hideMask();
		},
	}
});
