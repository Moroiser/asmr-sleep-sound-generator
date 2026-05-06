/**
 * 材料合成引擎 v2
 * 支持头部区域声学调制
 * 
 * 合成链路：
 * 振荡器(泛音) → 区域滤波 → 包络 → 噪声(质感) → 区域混响 → 空间定位 → 输出
 */

class MaterialSynth {
  constructor() {
    this.audioCtx = null;
    this.masterGain = null;
    this.isInitialized = false;
    this.convolverBuffers = {}; // 预计算的混响 IR
  }

  async init() {
    if (this.isInitialized) return;
    
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.value = 0.7;
    this.masterGain.connect(this.audioCtx.destination);
    
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
    
    // 预生成不同混响量的 impulse response
    this._generateReverbIRs();
    
    this.isInitialized = true;
    console.log('[MaterialSynth] Initialized with region support');
  }

  /**
   * 预生成不同长度的混响 IR
   */
  _generateReverbIRs() {
    const ctx = this.audioCtx;
    const sampleRate = ctx.sampleRate;
    
    // 短混响（额头、下巴等实心区域）
    this._shortIR = this._createIR(sampleRate, 0.05, 0.3);
    // 中混响（太阳穴、脸颊）
    this._mediumIR = this._createIR(sampleRate, 0.1, 0.6);
    // 长混响（耳朵、后脑勺等空腔区域）
    this._longIR = this._createIR(sampleRate, 0.2, 1.0);
  }

  _createIR(sampleRate, preDelay, decayTime) {
    const length = sampleRate * (preDelay + decayTime);
    const buffer = this.audioCtx.createBuffer(2, length, sampleRate);
    
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      const preDelaySamples = Math.floor(preDelay * sampleRate);
      
      for (let i = 0; i < length; i++) {
        if (i < preDelaySamples) {
          data[i] = 0;
        } else {
          const t = (i - preDelaySamples) / sampleRate;
          data[i] = (Math.random() * 2 - 1) * Math.exp(-t / decayTime) * 0.3;
        }
      }
    }
    return buffer;
  }

  /**
   * 播放敲击音（带区域调制）
   * @param {string} materialKey - 材料键名
   * @param {number} velocity - 力度 0~1
   * @param {object} region - 头部区域参数
   * @param {number} stereoPan - 立体声位置 -1~1
   */
  play(materialKey, velocity = 0.7, region = null, stereoPan = 0) {
    if (!this.isInitialized) { console.warn('[Synth] Not initialized!'); return; }

    const preset = MATERIAL_PRESETS[materialKey];
    if (!preset) { console.warn('[Synth] Unknown material:', materialKey); return; }
    console.log('[Synth] Playing:', materialKey, 'vel:', velocity, 'pan:', stereoPan, 'region:', region?.name);

    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const vel = Math.max(0.05, Math.min(1.0, velocity));

    // 区域默认值（无区域时为中性）
    const reg = region || {
      baseFreqMod: 1.0,
      resonance: 0.3,
      damping: 0.4,
      reverb: 0.2
    };

    // === 1. 泛音振荡器组 ===
    const oscMix = ctx.createGain();
    oscMix.gain.value = 1.0;

    preset.harmonics.forEach((harmonic, i) => {
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      
      osc.type = 'sine';
      // 材料基频 × 区域频率修正 × 泛音比
      osc.frequency.value = preset.baseFreq * reg.baseFreqMod * harmonic;
      amp.gain.value = (preset.harmonicAmp[i] || 0) * vel;
      
      osc.connect(amp);
      amp.connect(oscMix);
      
      osc.start(now);
      osc.stop(now + preset.decay * (1 + reg.damping) + 0.2);
    });

    // === 2. 噪声（材料质感）===
    if (preset.noiseMix > 0) {
      const bufferSize = ctx.sampleRate * 0.5;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      
      if (preset.noiseColor === 'pink') {
        let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
        for (let i = 0; i < bufferSize; i++) {
          const w = Math.random()*2-1;
          b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759;
          b2=0.969*b2+w*0.153852; b3=0.8665*b3+w*0.3104856;
          b4=0.55*b4+w*0.5329522; b5=-0.7616*b5-w*0.016898;
          data[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11; b6=w*0.115926;
        }
      } else if (preset.noiseColor === 'brown') {
        let last = 0;
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (last + 0.02*(Math.random()*2-1))/1.02; last = data[i]; data[i]*=3.5;
        }
      } else {
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random()*2-1;
      }
      
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuffer;
      
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      // 噪声频率也受区域影响
      noiseFilter.frequency.value = preset.filterFreq * reg.baseFreqMod;
      noiseFilter.Q.value = preset.filterQ;
      
      const noiseGain = ctx.createGain();
      // 区域阻尼影响噪声衰减
      const noiseDecay = preset.decay * 0.5 * (1 + reg.damping * 0.5);
      noiseGain.gain.setValueAtTime(preset.noiseMix * vel, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseDecay);
      
      noiseSrc.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(oscMix);
      
      noiseSrc.start(now);
      noiseSrc.stop(now + noiseDecay + 0.1);
    }

    // === 3. 区域共鸣滤波器 ===
    const resonanceFilter = ctx.createBiquadFilter();
    resonanceFilter.type = 'bandpass';
    // 共鸣频率：材料基频 × 区域修正，Q 值由区域共鸣强度决定
    resonanceFilter.frequency.value = preset.baseFreq * reg.baseFreqMod * (1 + reg.resonance);
    resonanceFilter.Q.value = 1 + reg.resonance * 8; // 共鸣越强，Q 越高

    // === 4. 包络 ===
    const envelope = ctx.createGain();
    // 区域阻尼影响衰减时间
    const decayTime = preset.decay * (1 + reg.damping * 0.8);
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(vel, now + preset.attack);
    envelope.gain.exponentialRampToValueAtTime(0.001, now + decayTime);

    // === 5. 混响（区域空腔感）===
    let reverbNode = null;
    if (reg.reverb > 0.05) {
      reverbNode = ctx.createConvolver();
      // 根据混响量选择 IR
      if (reg.reverb < 0.3) {
        reverbNode.buffer = this._shortIR;
      } else if (reg.reverb < 0.6) {
        reverbNode.buffer = this._mediumIR;
      } else {
        reverbNode.buffer = this._longIR;
      }
    }

    // === 6. 立体声定位 ===
    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, stereoPan));

    // === 连接链路 ===
    // 干声路径：振荡器 → 共鸣滤波 → 包络 → 立体声 → 主输出
    oscMix.connect(resonanceFilter);
    resonanceFilter.connect(envelope);
    envelope.connect(panner);
    panner.connect(this.masterGain);

    // 混响路径：包络 → 混响 → 立体声 → 主输出
    if (reverbNode) {
      const reverbGain = ctx.createGain();
      reverbGain.gain.value = reg.reverb;
      envelope.connect(reverbNode);
      reverbNode.connect(reverbGain);
      reverbGain.connect(panner);
    }

    // 清理
    const totalTime = (decayTime + 0.5) * 1000;
    setTimeout(() => {
      try {
        oscMix.disconnect();
        resonanceFilter.disconnect();
        envelope.disconnect();
        panner.disconnect();
        if (reverbNode) reverbNode.disconnect();
      } catch(e) {}
    }, totalTime);
  }

  setVolume(vol) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, vol));
    }
  }

  getMaterials() {
    return Object.entries(MATERIAL_PRESETS).map(([key, p]) => ({
      key, name: p.name, emoji: p.emoji, description: p.description
    }));
  }

  destroy() {
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
      this.isInitialized = false;
    }
  }
}

if (typeof module !== 'undefined') module.exports = MaterialSynth;
