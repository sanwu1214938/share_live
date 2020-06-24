var myPlayer;
// 此方法可区分
var ua = navigator.userAgent.toLowerCase();
// svga礼物列表
var svgaList = [];
var giftTimer = null;
var smallGiftNum = {};

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
			liveTips: "", // 直播间提示标题
			liveM3u8: "", // 直播m3u8地址
			livePoster: "", // 直播封面
			showPlayBtn: true, // 是否显示中间播放按钮
			showLoadingBtn: false, // 是否显示中间正在加载按钮
			wxShowPlayBtn: true, // 微信中监听canplay真他妈有病(解决微信中监听canplay事件的奇葩毛病)

			language: {}, // 语言
			languageType: '',
			landScape: 0, // 横竖屏 默认竖屏
			smallGiftList: null, // 小礼物列表
			showSmallGift: false,
			smallGiftNum: 0, // 小礼物数量
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

		// 聊天消息列表自动滚动到底部
		this.chatListScroll();

		// 视频播放
		this.playVideo();

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
		playVideo: function() {
			var that = this;
			// 同层播放设置
			$('video').attr('webkit-playsinline', 'true');
			$('video').attr('playsinline', 'true');
			$('video').attr('x5-video-player-type', 'h5');
			$('video').attr('x5-video-orientation', 'portraint');
			$('video').attr('x5-video-player-fullscreen', 'true');
			$('video').attr('x-webkit-airplay', 'true');

			// 初始化
			var options = {
				muted: false,
				autoplay: false,
				preload: "auto",
				controls: false,
				height: "100%",
				width: "100%",
				loop: false,
				// poster: that.livePoster,
				poster: "../share_live_videojs/img/bg_download@2x.png",
				// children: [
				// 	{ name: 'playToggle' }, // 播放按钮
				// 	{ name: 'FullscreenToggle' } // 全屏
				// ]
			};
			myPlayer = videojs("xinyu_video", options, function onPlayerReady() {
				videojs.log("播放器已经准备好了!");
				// 注意，这个地方的上下文， `this` 指向的是Video.js的实例对像myPlayer
				// console.log("videojs:", this, that);
				// this.load();
				// this.play();
				// 如何使用事件监听？
				this.on('play', function() {
					console.log('开始/恢复播放');
					that.showPlayBtn = false;
					that.showLoadingBtn = false;
					that.wxShowPlayBtn = false;
				});
				this.on('pause', function() {
					// player.posterImage.setSrc('../share_live_videojs/img/bg_download@2x.png');
					console.log('暂停播放');
					that.showPlayBtn = true;
					that.showLoadingBtn = false;
				});
				this.on('ended', function() {
					console.log('结束播放');
					that.showPlayBtn = true;
					that.showLoadingBtn = false;
				});
				this.on('waiting', function() { //等待数据，并非错误
					console.log("等待数据");
					that.showPlayBtn = false;
					that.showLoadingBtn = true;
				});
				this.on('loadeddata', function() { //渲染画面
					console.log('loadeddata数据加载完成');
					that.showPlayBtn = false;
					that.showLoadingBtn = false;
				});
				this.on('canplay', function() { //canplay
					console.log("canplay!!!");
					// that.showPlayBtn = true;
					if (!that.wxShowPlayBtn) {
						that.showPlayBtn = false;
					} else {
						that.showPlayBtn = true;
					}
					that.showLoadingBtn = false;
				});
				this.on('error', function() { //请求数据时遇到错误
					console.log("请求数据时遇到错误");
				});
				
				// this.on('loadstart', function() { //客户端开始请求数据
				// 	console.log("客户端开始请求数据");
				// });
				// this.on('progress', function() { //客户端正在请求数据
				// 	console.log("客户端正在请求数据");
				// });
				// this.on('abort', function() { //客户端主动终止下载（不是因为错误引起）
				// 	console.log("客户端主动终止下载");
				// });
				// this.on('stalled', function() { //网速异常
				// 	console.log("网速异常");
				// });
				// //timeupdate 事件在音频/视频（audio/video）的播放位置发生改变时触发
				// this.on('timeupdate', function() {
				// 	console.log("当前播放的进度");
				// });
			});
		},
		// 播放
		userPlay: function() {
			this.showPlayBtn = false;
			myPlayer.play();
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
						_this.livePoster = _this.imgBaseUrl + res.data.avatar;
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
				var userConfirm = confirm(_this.language.comm.openApp);
				if (userConfirm == true) {
					window.location.href = '' + comm.wxTodown + '?lang=' + _this.languageType + '&type=live&dataId=' + _this.chatRoomID +
						'';
				} else {
					return;
				}
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
				}
				//ios端
				if (isIOS) {
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
				}
			}
		},
	}
});
