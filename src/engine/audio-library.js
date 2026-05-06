/**
 * ASMR 音频库
 * 预生成各区域×材料的音频片段，缓存为 AudioBuffer
 * 
 * 用法：
 *   const library = new AudioLibrary();
 *   await library.init(audioCtx);
 *   const buffer = library.get('forehead', 'wood');
 *   // 或通过 ID: library.getById('f_w_0')
 */

class AudioLibrary {
  constructor() {
    this.audioCtx = null;
    this.buffers = new Map();     // key: `${region}_${material}` → AudioBuffer[]
    this.clipIndex = [];          // 所有片段的索引 [{id, region, material, index, duration}]
    this.isReady = false;
    this._synth = null;           // 内部合成器（用于生成）
  }

  /**
   * 初始化并预生成所有音频片段
   * @param {AudioContext} audioCtx
   * @param {object} regions - HEAD_REGIONS 对象
   * @param {object} materials - 材料预设对象
   * @param {Function} onProgress - 进度回调 (current, total)
   */
  async init(audioCtx, regions, materials, onProgress) {
    this.audioCtx = audioCtx;
    this.regions = regions;
    this.materials = materials;

    // 创建内部合成引擎（复用 MaterialSynth 的逻辑）
    this._synth = new OfflineASRMSynth(audioCtx);

    const regionKeys = Object.keys(regions);
    const materialKeys = Object.keys(materials);
    const total = regionKeys.length * materialKeys.length * 3; // 每组合生成3个变体
    let current = 0;

    for (const regionKey of regionKeys) {
      for (const matKey of materialKeys) {
        const buffers = [];
        for (let variant = 0; variant < 3; variant++) {
          const buffer = await this._generateClip(regionKey, matKey, variant);
          buffers.push(buffer);
          
          // 索引
          const id = `${regionKey.charAt(0)}_${matKey.charAt(0)}_${variant}`;
          this.clipIndex.push({
            id,
            region: regionKey,
            material: matKey,
            variant,
            duration: buffer.duration,
            label: `${regions[regionKey].name} · ${materials[matKey].name} #${variant + 1}`
          });

          current++;
          if (onProgress) onProgress(current, total);
        }
        this.buffers.set(`${regionKey}_${matKey}`, buffers);
      }
    }

    this.isReady = true;
    console.log(`[AudioLibrary] Ready: ${this.clipIndex.length} clips generated`);
  }

  /**
   * 获取指定区域+材料的音频缓冲（随机变体）
   */
  get(regionKey, materialKey) {
    const key = `${regionKey}_${materialKey}`;
    const buffers = this.buffers.get(key);
    if (!buffers || buffers.length === 0) return null;
    return buffers[Math.floor(Math.random() * buffers.length)];
  }

  /**
   * 通过 ID 获取精确片段
   */
  getById(id) {
    const entry = this.clipIndex.find(c => c.id === id);
    if (!entry) return null;
    const key = `${entry.region}_${entry.material}`;
    const buffers = this.buffers.get(key);
    return buffers ? buffers[entry.variant] : null;
  }

  /**
   * 获取片段索引（用于 UI 显示）
   */
  getIndex(filter) {
    let list = [...this.clipIndex];
    if (filter?.region) list = list.filter(c => c.region === filter.region);
    if (filter?.material) list = list.filter(c => c.material === filter.material);
    return list;
  }

  /**
   * 获取所有片段的简要列表（按区域分组）
   */
  getGroupedIndex() {
    const groups = {};
    for (const clip of this.clipIndex) {
      if (!groups[clip.region]) groups[clip.region] = [];
      groups[clip.region].push(clip);
    }
    return groups;
  }

  /**
   * 内部：生成一个音频片段
   */
  async _generateClip(regionKey, materialKey, variant) {
    const ctx = this.audioCtx;
    const sampleRate = ctx.sampleRate;
    const duration = 0.8 + Math.random() * 0.4; // 0.8-1.2秒
    const length = Math.ceil(sampleRate * duration);
    
    const region = this.regions[regionKey];
    const material = this.materials[materialKey];

    // 使用 OfflineAudioContext 渲染
    const offlineCtx = new OfflineAudioContext(2, length, sampleRate);
    
    // 合成声音
    await this._synth.renderTo(offlineCtx, material, region, variant);
    
    return await offlineCtx.startRendering();
  }
}

/**
 * 离线 ASMR 合成引擎
 * 用于预生成音频片段
 */
class OfflineASRMSynth {
  constructor(mainCtx) {
    this.mainCtx = mainCtx;
  }

  /**
   * 在 OfflineAudioContext 中渲染一段 ASMR 声音
   */
  async renderTo(ctx, material, region, variant) {
    const now = 0;
    const attackTime = 0.005 + Math.random() * 0.01;
    const decayTime = 0.3 + Math.random() * 0.3 + variant * 0.1;
    const sustainLevel = 0.1 + Math.random() * 0.1;
    const releaseTime = 0.2 + Math.random() * 0.2;

    // === 主振荡器（泛音合成）===
    const baseFreq = (material.baseFreq || 400) * (region.baseFreqMod || 1.0);
    const harmonics = material.harmonics || [1, 2.1, 3.5];
    const gains = material.harmonicAmp || [1.0, 0.4, 0.15];

    for (let h = 0; h < harmonics.length; h++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const freq = baseFreq * harmonics[h] * (1 + (variant - 1) * 0.05);
      osc.frequency.value = freq;
      osc.type = h === 0 ? 'sine' : (h === 1 ? 'triangle' : 'sine');
      
      // 包络
      const peakGain = gains[h] * 0.3;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(peakGain, now + attackTime);
      gain.gain.exponentialRampToValueAtTime(peakGain * sustainLevel, now + attackTime + decayTime);
      gain.gain.exponentialRampToValueAtTime(0.001, now + attackTime + decayTime + releaseTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + attackTime + decayTime + releaseTime + 0.1);
    }

    // === 噪声层（材质质感）===
    const noiseBuffer = this._generateNoise(ctx, 0.15);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = material.filterFreq || 3000;
    noiseFilter.Q.value = material.filterQ || 1.5;
    
    const noiseGain = ctx.createGain();
    const noisePeak = (material.noiseMix || 0.15) * 0.5;
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(noisePeak, now + 0.003);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSource.start(now);
    noiseSource.stop(now + 0.2);

    // === 区域共鸣（混响模拟）===
    if (region.resonance > 0.3) {
      const resOsc = ctx.createOscillator();
      const resGain = ctx.createGain();
      resOsc.frequency.value = baseFreq * 0.5 * (1 + region.resonance);
      resOsc.type = 'sine';
      const resPeak = region.resonance * 0.08;
      resGain.gain.setValueAtTime(0, now + attackTime);
      resGain.gain.linearRampToValueAtTime(resPeak, now + attackTime + 0.05);
      resGain.gain.exponentialRampToValueAtTime(0.001, now + attackTime + decayTime + releaseTime);
      resOsc.connect(resGain);
      resGain.connect(ctx.destination);
      resOsc.start(now + attackTime);
      resOsc.stop(now + attackTime + decayTime + releaseTime + 0.2);
    }
  }

  _generateNoise(ctx, duration) {
    const sampleRate = ctx.sampleRate;
    const length = Math.ceil(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (length * 0.3));
    }
    return buffer;
  }
}

// 导出
if (typeof window !== 'undefined') {
  window.AudioLibrary = AudioLibrary;
}
