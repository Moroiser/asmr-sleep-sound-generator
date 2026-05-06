/**
 * 音频导出器
 * 将编排好的音频序列渲染为 WAV 文件下载
 * 
 * 用法：
 *   const exporter = new AudioExporter();
 *   const blob = await exporter.renderSequence(audioLibrary, sequence);
 *   exporter.download(blob, 'asmr-sequence.wav');
 */

class AudioExporter {
  constructor() {
    this.sampleRate = 44100;
  }

  /**
   * 渲染音频序列为 WAV Blob
   * @param {AudioLibrary} library - 音频库实例
   * @param {Array} sequence - [{clipId, region, material, variant, delay}]
   * @param {object} options - {crossfade, loop, loopCount}
   * @returns {Blob} WAV 文件
   */
  async renderSequence(library, sequence, options = {}) {
    const crossfade = options.crossfade || 0.05; // 默认 50ms 交叉淡入淡出
    const loop = options.loop || false;
    const loopCount = options.loopCount || 1;

    // 计算总时长
    let totalDuration = 0;
    for (const item of sequence) {
      const buffer = this._getBuffer(library, item);
      if (!buffer) continue;
      totalDuration += (item.delay || 0) + buffer.duration;
    }
    totalDuration *= loop ? loopCount : 1;
    totalDuration += 1.0; // 尾部留白

    const sampleCount = Math.ceil(this.sampleRate * totalDuration);
    const offlineCtx = new OfflineAudioContext(2, sampleCount, this.sampleRate);

    // 渲染序列
    const renderLoop = loop ? loopCount : 1;
    let currentTime = 0.1; // 头部留白

    for (let loopIdx = 0; loopIdx < renderLoop; loopIdx++) {
      for (const item of sequence) {
        const buffer = this._getBuffer(library, item);
        if (!buffer) continue;

        const delay = item.delay || 0;
        currentTime += delay;

        const source = offlineCtx.createBufferSource();
        source.buffer = buffer;

        // 空间定位（左右声道）
        const panner = offlineCtx.createStereoPanner();
        panner.pan.value = item.pan || 0;

        // 交叉淡入淡出
        const gainNode = offlineCtx.createGain();
        const fadeIn = crossfade;
        const fadeOut = crossfade;
        const bufDuration = buffer.duration;

        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(1, currentTime + fadeIn);
        gainNode.gain.setValueAtTime(1, currentTime + bufDuration - fadeOut);
        gainNode.gain.linearRampToValueAtTime(0, currentTime + bufDuration);

        source.connect(gainNode);
        gainNode.connect(panner);
        panner.connect(offlineCtx.destination);

        source.start(currentTime);
        currentTime += bufDuration;
      }
    }

    // 渲染
    const renderedBuffer = await offlineCtx.startRendering();

    // 转为 WAV
    return this._bufferToWav(renderedBuffer);
  }

  /**
   * 快速渲染：从序列号数组生成
   * @param {AudioLibrary} library
   * @param {Array} clipIds - 片段 ID 列表，如 ['f_w_0', 'e_m_1', 'b_g_2']
   * @param {object} options
   */
  async renderByIds(library, clipIds, options = {}) {
    const sequence = clipIds.map(id => {
      const entry = library.clipIndex.find(c => c.id === id);
      if (!entry) return null;
      return {
        clipId: id,
        region: entry.region,
        material: entry.material,
        variant: entry.variant,
        delay: options.gap || 0.1,
        pan: this._regionToPan(entry.region)
      };
    }).filter(Boolean);

    return this.renderSequence(library, sequence, options);
  }

  /**
   * 区域 → 立体声偏移
   */
  _regionToPan(regionKey) {
    const panMap = {
      left_ear: -0.8, right_ear: 0.8,
      left_temple: -0.5, right_temple: 0.5,
      forehead: 0, crown: 0, back: 0, chin: 0
    };
    return panMap[regionKey] || 0;
  }

  _getBuffer(library, item) {
    if (item.clipId) return library.getById(item.clipId);
    return library.get(item.region, item.material);
  }

  /**
   * AudioBuffer → WAV Blob
   */
  _bufferToWav(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitsPerSample = 16;

    const channels = [];
    for (let i = 0; i < numChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    const blockAlign = numChannels * bitsPerSample / 8;
    const byteRate = sampleRate * blockAlign;
    const dataSize = channels[0].length * blockAlign;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;

    const arrayBuffer = new ArrayBuffer(totalSize);
    const view = new DataView(arrayBuffer);

    // WAV header
    this._writeString(view, 0, 'RIFF');
    view.setUint32(4, totalSize - 8, true);
    this._writeString(view, 8, 'WAVE');
    this._writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // chunk size
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    this._writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Interleaved samples
    let offset = 44;
    for (let i = 0; i < channels[0].length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, channels[ch][i]));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  _writeString(view, offset, str) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  /**
   * 触发下载
   */
  download(blob, filename = 'asmr-sequence.wav') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

if (typeof window !== 'undefined') {
  window.AudioExporter = AudioExporter;
}
