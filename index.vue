<template>
  <div class="video-control-bar">
    <div ref="playControl" :class="{'play-control':true, playing:paused, paused: !paused}"></div>
    <div ref="current" class="current-time">{{currentTime}}</div>
    <div ref="progress" class="progress" @click="handleJumpProgress">
      <i ref="slider" :style="{width: progress*100 + '%'}"></i>
    </div>
    <div class="duration-time">{{totalTime}}</div>
  </div>
</template>

<script>
import Draggable from "@joyfulljs/draggable";
export default {
  name: "video-control-bar",
  props: {
    video: {
      type: HTMLVideoElement
    }
  },
  data() {
    return {
      paused: true,
      currentTime: "00:00",
      totalTime: "00:00",
      progress: 0
    };
  },
  methods: {
    handleJumpProgress,
    handleDragProgress,
    handleDurationChange,
    handleTimeUpdate,
    handleClickPlayControl
  },
  mounted() {
    this.draggable = Draggable(this.$refs.progress, this.handleDragProgress);
    this.video.addEventListener("durationchange", this.handleDurationChange);
    this.video.addEventListener("timeupdate", this.handleTimeUpdate);
    this.video.addEventListener("play", e => (this.paused = false));
    this.video.addEventListener("pause", e => (this.paused = true));
    this.$refs.playControl.addEventListener(
      "click",
      this.handleClickPlayControl
    );
  },
  destroyed() {
    this.draggable.destroy();
  }
};

function handleClickPlayControl(e) {
  if (this.paused) {
    this.video.play();
  } else {
    this.video.pause();
  }
}

function handleTimeUpdate(e) {
  this.currentTime = formatTime(e.target.currentTime);
  this.progress = e.target.currentTime / e.target.duration;
  this.paused = false;
}

function handleDurationChange(e) {
  this.totalTime = formatTime(e.target.duration);
}

function handleDragProgress(delt) {
  const { progress, slider } = this.$refs;
  let w = slider.offsetWidth + delt;
  if (w > progress.offsetWidth) {
    w = progress.offsetWidth;
  } else if (w < 0) {
    w = 0;
  }
  this.progress = w / progress.offsetWidth;
  this.video.currentTime = this.progress * this.video.duration;
}

function handleJumpProgress(e) {
  const target = e.currentTarget;
  const rect = target.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  this.progress = clickX / rect.width;
  this.video.currentTime = this.progress * this.video.duration;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.ceil(seconds % 60);
  return formatNumber(m) + ":" + formatNumber(s);
}

function formatNumber(num) {
  return num < 10 ? "0" + num : num;
}
</script>

<style lang="less">
.video-control-bar {
  position: absolute;
  display: flex;
  height: 40px;
  left: 20px;
  right: 20px;
  bottom: 20px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 2px;
  color: #fff;
  align-items: center;
  text-align: center;
  font-size: 14px;
  line-height: 18px;

  .play-control {
    width: 40px;
    padding-top: 1px;
  }

  .playing::after {
    content: "";
    display: inline-block;
    border-top: 8px solid transparent;
    border-left: 12px solid #fff;
    border-bottom: 8px solid transparent;
    vertical-align: top;
  }

  .paused::after {
    content: "";
    display: inline-block;
    width: 8px;
    height: 15px;
    border-left: 2px solid #fff;
    border-right: 2px solid #fff;
  }

  .progress {
    position: relative;
    flex: 1;
    height: 100%;

    &::before,
    i {
      content: "";
      position: absolute;
      width: 100%;
      height: 2px;
      left: 0;
      top: 50%;
      margin-top: -1px;
      background: #818a95;
      border-radius: 2px;
    }

    i {
      background-color: #fff;
      width: 0;
      z-index: 2;
    }

    i::after {
      content: "";
      position: absolute;
      top: -4px;
      right: -10px;
      width: 10px;
      height: 10px;
      border-radius: 100%;
      background-color: #fff;
    }
  }

  .current-time {
    width: 50px;
    text-align: left;
  }

  .duration-time {
    width: 60px;
  }
}
</style>