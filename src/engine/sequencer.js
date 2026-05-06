/**
 * 音频编排序列器
 * 支持输入序列号（1,2,3,4,5）按序播放
 * 
 * 用法：
 *   const sequencer = new Sequencer(audioLibrary);
 *   sequencer.play('1,2,3,4,5');
 *   sequencer.play('f_w_0,e_m_1,b_g_2'); // 用 ID
 *   sequencer.stop();
 */

class Sequencer {
  constructor(audioLibrary) {
    this.library = audioLibrary;
    this.audioCtx = null;
    this.isPlaying = false;
    this._stopFlag = false;
    this._currentSources = [];
    this._onStep = null; // 步进回调
    this._onComplete = null; // 完成回调
  }

  /**
   * 设置音频上下文
   */
  setAudioCtx(ctx) {
    this.audioCtx = ctx;
  }

  /**
   * 设置回调
   */
  on(event, callback) {
    if (event === 'step') this._onStep = callback;
    if (event === 'complete') this._onComplete = callback;
  }

  /**
   * 解析并播放序列
   * @param {string} input - 序列字符串
   *   - 数字模式: "1,2,3,4,5" → 按 clipIndex 顺序
   *   - ID 模式: "f_w_0,e_m_1" → 精确片段
   *   - 混合: "1,f_w_0,3" 
   * @param {object} options - {gap, loop, loopCount, panRandom}
   */
  async play(input, options = {}) {
    if (!this.audioCtx || !this.library.isReady) {
      throw new Error('AudioLibrary not ready');
    }

    const gap = options.gap ?? 0.15; // 默认 150ms 间隔
    const loop = options.loop ?? false;
    const loopCount = options.loopCount ?? 1;

    // 解析输入
    const clipIds = this._parseInput(input);
    if (clipIds.length === 0) {
      console.warn('[Sequencer] No valid clips in input:', input);
      return;
    }

    this.isPlaying = true;
    this._stopFlag = false;

    const renderLoop = loop ? loopCount : 1;

    for (let l = 0; l < renderLoop; l++) {
      if (this._stopFlag) break;

      for (let i = 0; i < clipIds.length; i++) {
        if (this._stopFlag) break;

        const clipId = clipIds[i];
        const buffer = this.library.getById(clipId);
        if (!buffer) {
          console.warn('[Sequencer] Clip not found:', clipId);
          continue;
        }

        // 播放
        const source = this.audioCtx.createBufferSource();
        source.buffer = buffer;

        // 立体声定位
        const panner = this.audioCtx.createStereoPanner();
        const entry = this.library.clipIndex.find(c => c.id === clipId);
        if (entry) {
          const region = this.library.regions[entry.region];
          if (region?.stereoBias !== undefined) {
            panner.pan.value = region.stereoBias * 0.8;
          }
        }

        const gainNode = this.audioCtx.createGain();
        gainNode.gain.value = 0.8;

        source.connect(gainNode);
        gainNode.connect(panner);
        panner.connect(this.audioCtx.destination);

        source.start();
        this._currentSources.push(source);

        source.onended = () => {
          const idx = this._currentSources.indexOf(source);
          if (idx >= 0) this._currentSources.splice(idx, 1);
        };

        // 回调
        if (this._onStep) {
          this._onStep({
            index: i,
            total: clipIds.length,
            clipId,
            entry,
            loop: l
          });
        }

        // 等待间隔
        if (i < clipIds.length - 1) {
          await this._sleep(gap * 1000);
        }
      }
    }

    this.isPlaying = false;
    if (this._onComplete) this._onComplete();
  }

  /**
   * 停止播放
   */
  stop() {
    this._stopFlag = true;
    for (const source of this._currentSources) {
      try { source.stop(); } catch (e) {}
    }
    this._currentSources = [];
    this.isPlaying = false;
  }

  /**
   * 解析输入为 clipId 数组
   */
  _parseInput(input) {
    const parts = input.split(/[,，\s]+/).map(s => s.trim()).filter(Boolean);
    const ids = [];

    for (const part of parts) {
      // 尝试作为数字（索引）
      const num = parseInt(part);
      if (!isNaN(num) && num >= 1 && num <= this.library.clipIndex.length) {
        ids.push(this.library.clipIndex[num - 1].id);
        continue;
      }

      // 尝试作为 ID
      if (this.library.clipIndex.find(c => c.id === part)) {
        ids.push(part);
        continue;
      }

      // 尝试作为 "区域_材料" 格式
      const match = part.match(/^(\w+)_(\w+)$/);
      if (match) {
        const [, region, material] = match;
        const entry = this.library.clipIndex.find(c => 
          c.region.startsWith(region) && c.material.startsWith(material)
        );
        if (entry) {
          ids.push(entry.id);
          continue;
        }
      }

      console.warn('[Sequencer] Unknown clip reference:', part);
    }

    return ids;
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

if (typeof window !== 'undefined') {
  window.Sequencer = Sequencer;
}
