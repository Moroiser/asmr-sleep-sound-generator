/**
 * 时间线调度器 (Timeline Scheduler)
 * 管理片段的有序编排和播放
 */

class Timeline {
  constructor() {
    this.clips = [];      // { clipId, startTime, fadeIn, gain, position }
    this.loop = false;
    this.totalDuration = 0;
    this.crossfade = 0.3;  // 默认交叉淡入淡出（秒）
  }

  /**
   * 添加片段到时间线
   * @param {object} entry - { clipId, startTime, fadeIn?, gain?, position? }
   */
  add(entry) {
    const item = {
      clipId: entry.clipId,
      startTime: entry.startTime ?? this._nextStartTime(),
      fadeIn: entry.fadeIn ?? 0.1,
      gain: entry.gain ?? 1.0,
      position: entry.position ?? null,
      ...entry
    };
    this.clips.push(item);
    this._recalcDuration();
    return item;
  }

  /**
   * 移除片段
   */
  remove(clipId) {
    this.clips = this.clips.filter(c => c.clipId !== clipId);
    this._recalcDuration();
  }

  /**
   * 在指定时间插入片段
   */
  insertAt(time, entry) {
    return this.add({ ...entry, startTime: time });
  }

  /**
   * 在末尾追加片段
   */
  append(entry) {
    return this.add({ ...entry, startTime: this._nextStartTime() });
  }

  /**
   * 设置循环
   */
  setLoop(loop) {
    this.loop = loop;
  }

  /**
   * 设置交叉淡入淡出
   */
  setCrossfade(seconds) {
    this.crossfade = Math.max(0, seconds);
  }

  /**
   * 获取排序后的片段
   */
  getOrdered() {
    return [...this.clips].sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * 计算总时长
   */
  _recalcDuration() {
    if (this.clips.length === 0) {
      this.totalDuration = 0;
      return;
    }
    // 需要知道每个 clip 的 duration，这里用 clipLibrary 查询
    // 暂时用 startTime 最大值 + 一个默认值
    const maxStart = Math.max(...this.clips.map(c => c.startTime));
    this.totalDuration = maxStart + 5; // 默认每个片段 5 秒
  }

  /**
   * 下一个片段的默认开始时间
   */
  _nextStartTime() {
    if (this.clips.length === 0) return 0;
    const maxStart = Math.max(...this.clips.map(c => c.startTime));
    return maxStart + 3; // 默认间隔 3 秒
  }

  /**
   * 更新总时长（需要 clipLibrary 提供片段时长）
   */
  updateDuration(clipLibrary) {
    if (this.clips.length === 0) {
      this.totalDuration = 0;
      return;
    }
    let maxEnd = 0;
    for (const entry of this.clips) {
      const clip = clipLibrary.get(entry.clipId);
      const clipDuration = clip ? clip.duration : 2.0;
      const endTime = entry.startTime + clipDuration;
      if (endTime > maxEnd) maxEnd = endTime;
    }
    this.totalDuration = maxEnd;
  }

  /**
   * 导出为 JSON
   */
  toJSON() {
    return {
      clips: [...this.clips],
      loop: this.loop,
      totalDuration: this.totalDuration,
      crossfade: this.crossfade
    };
  }

  /**
   * 从 JSON 导入
   */
  static fromJSON(data) {
    const tl = new Timeline();
    tl.clips = data.clips || [];
    tl.loop = data.loop || false;
    tl.totalDuration = data.totalDuration || 0;
    tl.crossfade = data.crossfade || 0.3;
    return tl;
  }
}

if (typeof module !== 'undefined') module.exports = Timeline;
