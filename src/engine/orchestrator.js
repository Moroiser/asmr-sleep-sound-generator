/**
 * 编排引擎 (Orchestrator)
 * 统一接口：预设播放 / 自然语言 / 手动编排 / 实时调整
 * 
 * 使用方式：
 *   const orch = new Orchestrator(synth, regionSystem);
 *   await orch.init();
 *   orch.playPreset('sleep');
 *   orch.playNatural('轻柔的后脑勺木头敲击');
 *   orch.adjust({ tempo: 0.7 });
 *   orch.stop();
 */

class Orchestrator {
  constructor(synth, regionSystem) {
    this.synth = synth;                    // MaterialSynth 实例
    this.regions = regionSystem;           // { HEAD_REGIONS, getRegionFromPosition }
    this.clipLibrary = new ClipLibrary();
    this.presetManager = new PresetManager();
    this.isPlaying = false;
    this._currentTimeline = null;
    this._playTimer = null;
    this._playStartTime = 0;
    this._currentClipIndex = 0;
    this._loopCount = 0;
    this._adjustments = { tempo: 1.0, volume: 1.0, material: null };
    this._onClipPlay = null;  // 回调：每次播放片段时
    this._onStop = null;      // 回调：播放结束时
  }

  async init() {
    if (!this.synth.isInitialized) {
      await this.synth.init();
    }
  }

  /**
   * 设置回调
   */
  on(event, callback) {
    if (event === 'clipPlay') this._onClipPlay = callback;
    if (event === 'stop') this._onStop = callback;
  }

  // ==================== 播放控制 ====================

  /**
   * 播放预设
   * @param {string} presetId - 预设 ID（sleep/study/exercise/focus/anxiety）
   */
  playPreset(presetId) {
    const preset = this.presetManager.get(presetId);
    if (!preset) {
      console.error(`[Orchestrator] Preset not found: ${presetId}`);
      return;
    }
    this.stop();
    this._buildAndPlay(preset.timeline);
    console.log(`[Orchestrator] Playing preset: ${preset.name}`);
  }

  /**
   * 播放时间线
   * @param {object} timelineData - Timeline JSON 或 Timeline 实例
   */
  playTimeline(timelineData) {
    this.stop();
    const data = timelineData.toJSON ? timelineData.toJSON() : timelineData;
    this._buildAndPlay(data);
  }

  /**
   * 自然语言播放
   * @param {string} text - 用户输入的自然语言
   */
  playNatural(text) {
    this.stop();
    const timeline = this._parseNaturalLanguage(text);
    this._buildAndPlay(timeline);
    console.log(`[Orchestrator] Playing natural: "${text}"`);
  }

  /**
   * 播放单个片段（即时）
   * @param {object} params - { material, region, velocity, position }
   */
  playClip(params) {
    const regionKey = params.region || 'forehead';
    const region = this.regions.HEAD_REGIONS[regionKey];
    const material = params.material || this._adjustments.material || 'wood';
    const velocity = (params.velocity || 0.7) * this._adjustments.volume;
    const pan = params.position ? params.position.x * 0.8 : 0;

    this.synth.play(material, velocity, region, pan);

    if (this._onClipPlay) {
      this._onClipPlay({ type: 'single', material, region: regionKey, velocity });
    }
  }

  /**
   * 停止播放
   */
  stop() {
    this.isPlaying = false;
    if (this._playTimer) {
      clearTimeout(this._playTimer);
      this._playTimer = null;
    }
    this._currentTimeline = null;
    this._currentClipIndex = 0;
    this._loopCount = 0;
    if (this._onStop) this._onStop();
    console.log('[Orchestrator] Stopped');
  }

  /**
   * 实时调整
   * @param {object} adj - { tempo?, volume?, material? }
   */
  adjust(adj) {
    if (adj.tempo !== undefined) this._adjustments.tempo = Math.max(0.1, Math.min(3.0, adj.tempo));
    if (adj.volume !== undefined) this._adjustments.volume = Math.max(0, Math.min(1.0, adj.volume));
    if (adj.material !== undefined) this._adjustments.material = adj.material;
    console.log('[Orchestrator] Adjustments:', this._adjustments);
  }

  /**
   * 保存当前或指定时间线为预设
   */
  savePreset(id, name, timeline = null) {
    const tl = timeline || this._currentTimeline;
    if (!tl) {
      console.error('[Orchestrator] No timeline to save');
      return;
    }
    this.presetManager.save(id, name, tl);
    console.log(`[Orchestrator] Saved preset: ${id}`);
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      isPlaying: this.isPlaying,
      currentPreset: this._currentTimeline ? 'playing' : null,
      adjustments: { ...this._adjustments },
      loopCount: this._loopCount,
      clipCount: this.clipLibrary.list().length
    };
  }

  // ==================== 内部实现 ====================

  /**
   * 构建时间线并开始播放
   */
  _buildAndPlay(timelineData) {
    // 从预设的 clipDef 创建实际 clip 并加入 clipLibrary
    const entries = [];
    for (const entry of (timelineData.clips || [])) {
      let clipId = entry.clipId;
      if (!clipId && entry.clipDef) {
        // 从 clipDef 即时创建片段
        const clip = this.clipLibrary.createSynth(entry.clipDef);
        clipId = clip.id;
      }
      entries.push({
        clipId,
        startTime: entry.startTime,
        fadeIn: entry.fadeIn || 0.1,
        gain: entry.gain || 1.0
      });
    }

    this._currentTimeline = {
      entries,
      loop: timelineData.loop || false,
      crossfade: timelineData.crossfade || 0.3
    };

    this.isPlaying = true;
    this._currentClipIndex = 0;
    this._playStartTime = performance.now() / 1000;
    this._scheduleNext();
  }

  /**
   * 调度下一个片段
   */
  _scheduleNext() {
    if (!this.isPlaying || !this._currentTimeline) return;

    const entries = this._currentTimeline.entries;
    if (this._currentClipIndex >= entries.length) {
      if (this._currentTimeline.loop) {
        this._currentClipIndex = 0;
        this._loopCount++;
        this._playStartTime = performance.now() / 1000;
        console.log(`[Orchestrator] Loop ${this._loopCount + 1}`);
      } else {
        this.stop();
        return;
      }
    }

    const entry = entries[this._currentClipIndex];
    const clip = this.clipLibrary.get(entry.clipId);
    if (!clip) {
      this._currentClipIndex++;
      this._scheduleNext();
      return;
    }

    const now = performance.now() / 1000;
    const elapsed = now - this._playStartTime;
    const delay = Math.max(0, (entry.startTime - elapsed) * 1000 / this._adjustments.tempo);

    this._playTimer = setTimeout(() => {
      if (!this.isPlaying) return;

      // 应用调整
      const region = this.regions.HEAD_REGIONS[clip.source.region];
      const material = this._adjustments.material || clip.source.material;
      const velocity = clip.source.velocity * this._adjustments.volume;
      const pan = clip.source.position ? clip.source.position.x * 0.8 : 0;

      this.synth.play(material, velocity, region, pan);

      if (this._onClipPlay) {
        this._onClipPlay({
          type: 'timeline',
          clipId: clip.id,
          material,
          region: clip.source.region,
          velocity,
          loop: this._loopCount
        });
      }

      this._currentClipIndex++;
      this._scheduleNext();
    }, delay);
  }

  // ==================== 自然语言解析 ====================

  /**
   * 解析自然语言为时间线数据
   */
  _parseNaturalLanguage(text) {
    const t = text.toLowerCase();
    
    // 提取材料
    const materials = ['wood', 'glass', 'metal', 'ceramic', 'stone', 'bamboo',
                       '木头', '玻璃', '金属', '陶瓷', '石头', '竹子'];
    let material = 'wood';
    for (const m of materials) {
      if (t.includes(m)) {
        material = this._normalizeMaterial(m);
        break;
      }
    }

    // 提取区域
    const regionMap = {
      '后脑勺': 'back', '后脑': 'back', '枕骨': 'back',
      '额头': 'forehead', '前额': 'forehead',
      '头顶': 'crown', '头顶尖': 'crown',
      '太阳穴': 'temple', '颞骨': 'temple',
      '耳朵': 'ear', '耳': 'ear', '耳旁': 'ear',
      '脸颊': 'cheek', '脸': 'cheek',
      '下巴': 'chin', '下颌': 'chin',
      '颈部': 'neck', '脖子': 'neck',
      '左边': null, '右边': null, '上方': null, '下方': null
    };
    let region = 'forehead';
    let positionMod = { x: 0, y: 0 };
    for (const [key, val] of Object.entries(regionMap)) {
      if (t.includes(key)) {
        if (val) { region = val; break; }
      }
    }
    // 位置微调
    if (t.includes('左边')) positionMod.x -= 0.3;
    if (t.includes('右边')) positionMod.x += 0.3;
    if (t.includes('上方') || t.includes('上面')) positionMod.y += 0.3;
    if (t.includes('下方') || t.includes('下面')) positionMod.y -= 0.3;

    // 提取力度
    let velocity = 0.5;
    if (t.includes('轻') || t.includes('柔') || t.includes('轻柔')) velocity = 0.3;
    if (t.includes('重') || t.includes('用力') || t.includes('有力')) velocity = 0.8;

    // 提取节奏
    let interval = 3.0;
    if (t.includes('慢')) interval = 6.0;
    if (t.includes('快')) interval = 1.5;
    if (t.includes('极慢') || t.includes('非常慢')) interval = 10.0;

    // 提取时长
    let duration = 60; // 默认 1 分钟
    const durationMatch = t.match(/(\d+)\s*(分钟|分|min)/);
    if (durationMatch) duration = parseInt(durationMatch[1]) * 60;

    // 构建时间线
    const clipCount = Math.max(3, Math.floor(duration / interval));
    const clips = [];
    for (let i = 0; i < clipCount; i++) {
      clips.push({
        startTime: i * interval,
        clipDef: {
          material,
          region,
          velocity: velocity * (0.8 + Math.random() * 0.4), // 自然随机
          duration: 2.0 + Math.random()
        }
      });
    }

    return {
      loop: true,
      crossfade: 0.5,
      clips
    };
  }

  _normalizeMaterial(m) {
    const map = {
      '木头': 'wood', '木': 'wood',
      '玻璃': 'glass',
      '金属': 'metal', '铁': 'metal', '钢': 'metal',
      '陶瓷': 'ceramic', '瓷': 'ceramic',
      '石头': 'stone', '石': 'stone',
      '竹子': 'bamboo', '竹': 'bamboo'
    };
    return map[m] || m;
  }
}

if (typeof module !== 'undefined') module.exports = Orchestrator;
