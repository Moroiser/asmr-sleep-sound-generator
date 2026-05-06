/**
 * 声音片段库 (Clip Library)
 * 管理合成片段和采样片段的 CRUD
 */

class ClipLibrary {
  constructor() {
    this.clips = new Map(); // id → clip
    this._nextId = 1;
  }

  /**
   * 创建合成片段
   * @param {object} params - { material, region, position, velocity, duration }
   * @returns {object} clip
   */
  createSynth(params) {
    const id = `clip_${String(this._nextId++).padStart(3, '0')}`;
    const clip = {
      id,
      type: 'synth',
      source: {
        material: params.material || 'wood',
        region: params.region || 'forehead',
        position: params.position || { x: 0, y: 0, z: 1 },
        velocity: params.velocity || 0.7
      },
      duration: params.duration || 2.0,
      audioBuffer: null,
      metadata: {
        tags: this._generateTags(params),
        mood: params.mood || ['calm'],
        intensity: params.intensity || 'medium'
      }
    };
    this.clips.set(id, clip);
    return { ...clip };
  }

  /**
   * 创建采样片段
   * @param {object} params - { audioBuffer, name, tags, duration }
   * @returns {object} clip
   */
  createSample(params) {
    const id = `clip_${String(this._nextId++).padStart(3, '0')}`;
    const clip = {
      id,
      type: 'sample',
      source: {
        name: params.name || 'sample',
        filePath: params.filePath || null
      },
      duration: params.duration || audioBufferDuration(params.audioBuffer),
      audioBuffer: params.audioBuffer || null,
      metadata: {
        tags: params.tags || ['sample'],
        mood: params.mood || ['neutral'],
        intensity: params.intensity || 'medium'
      }
    };
    this.clips.set(id, clip);
    return { ...clip };
  }

  /**
   * 获取片段
   */
  get(id) {
    const clip = this.clips.get(id);
    return clip ? { ...clip } : null;
  }

  /**
   * 更新片段
   */
  update(id, updates) {
    const clip = this.clips.get(id);
    if (!clip) return null;
    Object.assign(clip, updates);
    return { ...clip };
  }

  /**
   * 删除片段
   */
  delete(id) {
    return this.clips.delete(id);
  }

  /**
   * 列出所有片段
   */
  list(filter = {}) {
    let results = Array.from(this.clips.values());
    if (filter.material) {
      results = results.filter(c => c.source?.material === filter.material);
    }
    if (filter.region) {
      results = results.filter(c => c.source?.region === filter.region);
    }
    if (filter.type) {
      results = results.filter(c => c.type === filter.type);
    }
    if (filter.tag) {
      results = results.filter(c => c.metadata?.tags?.includes(filter.tag));
    }
    return results.map(c => ({ ...c }));
  }

  /**
   * 按标签搜索
   */
  search(query) {
    const q = query.toLowerCase();
    return Array.from(this.clips.values()).filter(clip => {
      const tags = clip.metadata?.tags || [];
      const name = clip.source?.name || clip.source?.material || '';
      return name.toLowerCase().includes(q) || tags.some(t => t.includes(q));
    }).map(c => ({ ...c }));
  }

  /**
   * 清空
   */
  clear() {
    this.clips.clear();
    this._nextId = 1;
  }

  /**
   * 导出为 JSON
   */
  export() {
    return Array.from(this.clips.values()).map(c => ({
      ...c,
      audioBuffer: null // 不导出音频数据
    }));
  }

  /**
   * 从 JSON 导入
   */
  import(data) {
    for (const clipData of data) {
      const id = clipData.id || `clip_${String(this._nextId++).padStart(3, '0')}`;
      this.clips.set(id, { ...clipData, id });
    }
  }

  _generateTags(params) {
    const tags = [];
    if (params.material) tags.push(params.material);
    if (params.region) tags.push(params.region);
    if (params.velocity) {
      if (params.velocity < 0.3) tags.push('soft');
      else if (params.velocity < 0.7) tags.push('medium');
      else tags.push('hard');
    }
    tags.push('tapping');
    return tags;
  }
}

function audioBufferDuration(buffer) {
  if (!buffer) return 0;
  return buffer.duration || 0;
}

if (typeof module !== 'undefined') module.exports = ClipLibrary;
