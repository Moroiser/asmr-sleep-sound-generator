/**
 * 节奏引擎
 * 支持随机节奏和手动敲击两种模式
 */

class RhythmEngine {
  constructor() {
    this.isPlaying = false;
    this.timerId = null;
    this.onBeat = null; // 回调：每次敲击时调用
    this.mode = 'random'; // 'random' | 'manual'
    this.bpm = 60; // 每分钟敲击次数（手动模式参考）
    this.variance = 0.3; // 随机波动范围（0~1）
    this.minInterval = 200; // 最小间隔 ms
    this.maxInterval = 5000; // 最大间隔 ms
  }

  /**
   * 设置模式
   * @param {'random'|'manual'} mode
   */
  setMode(mode) {
    this.mode = mode;
    if (mode === 'manual') {
      this.stop();
    }
  }

  /**
   * 设置 BPM（随机模式的平均速度参考）
   * @param {number} bpm - 20~150
   */
  setBPM(bpm) {
    this.bpm = Math.max(20, Math.min(150, bpm));
  }

  /**
   * 设置随机波动范围
   * @param {number} variance - 0~1，0=完全均匀，1=最大随机
   */
  setVariance(variance) {
    this.variance = Math.max(0, Math.min(1, variance));
  }

  /**
   * 生成下一个随机间隔
   * @returns {number} 毫秒
   */
  _nextInterval() {
    const avgMs = 60000 / this.bpm;
    const v = this.variance;
    // 在 avgMs * (1-v) 到 avgMs * (1+v) 之间随机
    const min = avgMs * (1 - v);
    const max = avgMs * (1 + v);
    const interval = min + Math.random() * (max - min);
    return Math.max(this.minInterval, Math.min(this.maxInterval, interval));
  }

  /**
   * 生成随机力度（自然敲击的力度变化）
   * @param {number} baseVelocity - 基础力度
   * @returns {number} 0~1
   */
  _randomVelocity(baseVelocity = 0.7) {
    // 正态分布近似：大部分在中间，偶尔重/轻
    const u1 = Math.random();
    const u2 = Math.random();
    const gaussian = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    // 映射到 0.3~1.0 范围
    const vel = baseVelocity + gaussian * 0.15;
    return Math.max(0.3, Math.min(1.0, vel));
  }

  /**
   * 生成随机位置（声源在空间中漂移）
   * @returns {{x: number, y: number, z: number}}
   */
  _randomPosition() {
    return {
      x: (Math.random() - 0.5) * 1.6, // -0.8 ~ 0.8
      y: (Math.random() - 0.5) * 0.8, // -0.4 ~ 0.4
      z: 0.5 + Math.random() * 1.5    // 0.5 ~ 2.0
    };
  }

  /**
   * 启动随机节奏
   * @param {Function} onBeat - 回调 (velocity, position) => void
   */
  startRandom(onBeat) {
    this.onBeat = onBeat;
    this.isPlaying = true;
    this._scheduleNext();
  }

  _scheduleNext() {
    if (!this.isPlaying) return;
    
    const interval = this._nextInterval();
    
    this.timerId = setTimeout(() => {
      if (!this.isPlaying) return;
      
      const velocity = this._randomVelocity();
      const position = this._randomPosition();
      
      if (this.onBeat) {
        this.onBeat(velocity, position);
      }
      
      this._scheduleNext();
    }, interval);
  }

  /**
   * 手动触发一次敲击
   * @param {Function} onBeat - 回调
   * @param {number} velocity - 力度
   */
  triggerManual(onBeat, velocity = 0.8) {
    if (this.mode !== 'manual') return;
    const position = { x: 0, y: 0, z: 1 }; // 中心位置
    if (onBeat) onBeat(velocity, position);
  }

  /**
   * 停止
   */
  stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * 销毁
   */
  destroy() {
    this.stop();
    this.onBeat = null;
  }
}

// 导出
if (typeof module !== 'undefined') module.exports = RhythmEngine;
