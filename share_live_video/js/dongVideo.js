(function($) {
	var dongV = function(dom) {
		var that = this;
		$.ready(function() {
			// 获取视频元素
			that.video = document.querySelector(dom || 'video');
			// 获取视频父元素
			that.fuDOM = that.video.parentNode;
			// 元素初始化
			that.initCoverEm();
			//事件初始化
			that.initEvent();
			//记录信息
			that.initInfo();
			//当前播放模式 false 为 mini播放
			that.isMax = false;
		});
	};

	var pro = dongV.prototype;

	pro.initCoverEm = function() {
		var that = this;
		//先添加播放按钮
		this.vimg = document.createElement("img");
		this.vimg.src = 'img/play.png';
		this.vimg.className = 'playBtn';
		this.fuDOM.appendChild(this.vimg);

		//添加控制条
		this.vC = document.createElement("div");
		this.vC.classList.add('controls');
		this.vC.innerHTML = '<span class="fill">全屏</span>';
		this.fuDOM.appendChild(this.vC);
		//全屏按钮
		this.vC.querySelector('.fill').addEventListener('tap', function() {
			//that.nativeMax();
			that.switch();
			if (that.isMax) {
				app.landScape = true;
			} else {
				app.landScape = false;
			}
		});
	};

	pro.initEvent = function() {
		var that = this;
		//给播放按钮图片添加事件
		this.vimg.addEventListener('tap', function() {
			that.video.play();
		});

		//视频点击暂停或播放事件
		this.video.addEventListener('tap', function() {
			if (this.paused || this.ended) {
				//暂停时点击就播放
				if (this.ended) { //如果播放完毕，就重头开始播放
					this.currentTime = 0;
					that.vimg.style.display = 'block';
				}
				this.play();
			} else {
				//播放时点击就暂停
				this.pause();
				that.vimg.style.display = 'block';
			}
		});

		//视频播放事件
		this.video.addEventListener('play', function() {
			that.vimg.style.display = 'none';
		});
		//暂停or停止
		this.video.addEventListener('pause', function() {
			that.vimg.style.display = 'block';
		});
	};

	//记录信息
	pro.initInfo = function() {
		var that = this;
		//在onload状态下，offsetHeight才会获取到正确的值
		window.onload = function() {
			that.miniInfo = { //mini状态时的样式
				width: that.video.offsetWidth + 'px',
				height: that.video.offsetHeight + 'px',
				position: that.fuDOM.style.position,
				transform: 'translate(0,0) rotate(0deg)'
			};
			var info = [
					document.documentElement.clientWidth || document.body.clientWidth,
					document.documentElement.clientHeight || document.body.clientHeigth
				],
				w = info[0],
				h = info[1],
				cha = Math.abs(h - w) / 2;
			that.maxInfo = { //max状态时的样式
				width: h + 'px',
				height: w + 'px',
				position: 'fixed',
				transform: 'translate(-' + cha + 'px,' + cha + 'px) rotate(90deg)'
			};
		};
	};

	//全屏 mini 两种模式切换
	pro.switch = function() {
		var vR = this.fuDOM;
		//获取需要转换的样式信息
		var info = this.isMax ? this.miniInfo : this.maxInfo;
		for (var i in info) {
			vR.style[i] = info[i];
		}
		this.isMax = !this.isMax;
	};

	var nv = null;
	$.dongV = function(dom) {
		return nv || (nv = new dongV(dom));
	};
}(mui))
