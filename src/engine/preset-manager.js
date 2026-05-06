/**
 * 预设管理器 (Preset Manager)
 * 内置推荐预设 + 用户自定义预设的 CRUD
 */

class PresetManager {
  constructor() {
    this.presets = new Map();
    this._loadBuiltIn();
  }

  _loadBuiltIn() {
    // === 助眠 (sleep) ===
    this.presets.set('sleep', {
      id: 'sleep',
      name: '深度助眠',
      nameEn: 'Deep Sleep',
      description: '低频、慢节奏、长衰减，帮助放松入睡',
      tags: ['sleep', 'relax', 'calm'],
      timeline: {
        loop: true,
        crossfade: 1.0,
        clips: [
          { startTime: 0,  clipDef: { material: 'wood',   region: 'back',   velocity: 0.3, duration: 3.0 } },
          { startTime: 4,  clipDef: { material: 'stone',  region: 'neck',   velocity: 0.2, duration: 2.5 } },
          { startTime: 8,  clipDef: { material: 'wood',   region: 'crown',  velocity: 0.25, duration: 3.0 } },
          { startTime: 13, clipDef: { material: 'bamboo', region: 'back',   velocity: 0.2, duration: 2.0 } },
          { startTime: 17, clipDef: { material: 'stone',  region: 'temple', velocity: 0.2, duration: 3.0 } },
          { startTime: 22, clipDef: { material: 'wood',   region: 'forehead', velocity: 0.2, duration: 2.5 } }
        ]
      }
    });

    // === 学习 (study) ===
    this.presets.set('study', {
      id: 'study',
      name: '学习专注',
      nameEn: 'Study Focus',
      description: '中频、均匀节奏、不干扰注意力',
      tags: ['study', 'focus', 'concentration'],
      timeline: {
        loop: true,
        crossfade: 0.5,
        clips: [
          { startTime: 0,  clipDef: { material: 'wood',    region: 'forehead', velocity: 0.4, duration: 2.0 } },
          { startTime: 5,  clipDef: { material: 'ceramic', region: 'cheek',    velocity: 0.35, duration: 1.8 } },
          { startTime: 10, clipDef: { material: 'wood',    region: 'temple',   velocity: 0.3, duration: 2.0 } },
          { startTime: 15, clipDef: { material: 'bamboo',  region: 'crown',    velocity: 0.35, duration: 1.5 } }
        ]
      }
    });

    // === 运动恢复 (exercise) ===
    this.presets.set('exercise', {
      id: 'exercise',
      name: '运动恢复',
      nameEn: 'Exercise Recovery',
      description: '中低频、有力度变化、帮助肌肉放松',
      tags: ['exercise', 'recovery', 'muscle'],
      timeline: {
        loop: true,
        crossfade: 0.8,
        clips: [
          { startTime: 0,  clipDef: { material: 'metal', region: 'temple', velocity: 0.5, duration: 2.0 } },
          { startTime: 3,  clipDef: { material: 'glass', region: 'ear',    velocity: 0.4, duration: 2.5 } },
          { startTime: 7,  clipDef: { material: 'wood',  region: 'back',   velocity: 0.5, duration: 2.0 } },
          { startTime: 11, clipDef: { material: 'metal', region: 'crown',  velocity: 0.45, duration: 2.0 } },
          { startTime: 15, clipDef: { material: 'ceramic', region: 'cheek', velocity: 0.35, duration: 2.0 } }
        ]
      }
    });

    // === 专注 (focus) ===
    this.presets.set('focus', {
      id: 'focus',
      name: '深度专注',
      nameEn: 'Deep Focus',
      description: '低频、极慢、单材料，减少干扰',
      tags: ['focus', 'deep', 'minimal'],
      timeline: {
        loop: true,
        crossfade: 1.5,
        clips: [
          { startTime: 0,  clipDef: { material: 'stone', region: 'back', velocity: 0.25, duration: 3.0 } },
          { startTime: 10, clipDef: { material: 'stone', region: 'back', velocity: 0.2, duration: 3.0 } },
          { startTime: 20, clipDef: { material: 'stone', region: 'neck', velocity: 0.2, duration: 3.0 } }
        ]
      }
    });

    // === 缓解焦虑 (anxiety) ===
    this.presets.set('anxiety', {
      id: 'anxiety',
      name: '缓解焦虑',
      nameEn: 'Anxiety Relief',
      description: '低频、渐慢、渐弱，帮助平静下来',
      tags: ['anxiety', 'calm', 'peace'],
      timeline: {
        loop: true,
        crossfade: 1.2,
        clips: [
          { startTime: 0,  clipDef: { material: 'wood',  region: 'neck',   velocity: 0.4, duration: 2.5 } },
          { startTime: 4,  clipDef: { material: 'wood',  region: 'back',   velocity: 0.35, duration: 2.5 } },
          { startTime: 9,  clipDef: { material: 'stone', region: 'back',   velocity: 0.3, duration: 3.0 } },
          { startTime: 15, clipDef: { material: 'stone', region: 'crown',  velocity: 0.25, duration: 3.0 } },
          { startTime: 21, clipDef: { material: 'stone', region: 'forehead', velocity: 0.2, duration: 3.5 } }
        ]
      }
    });
  }

  /**
   * 获取预设
   */
  get(id) {
    return this.presets.get(id) || null;
  }

  /**
   * 列出所有预设
   */
  list() {
    return Array.from(this.presets.values()).map(p => ({
      id: p.id,
      name: p.name,
      nameEn: p.nameEn,
      description: p.description,
      tags: p.tags
    }));
  }

  /**
   * 按用途搜索
   */
  search(query) {
    const q = query.toLowerCase();
    return this.list().filter(p =>
      p.name.includes(q) ||
      p.nameEn.toLowerCase().includes(q) ||
      p.tags.some(t => t.includes(q))
    );
  }

  /**
   * 保存自定义预设
   */
  save(id, name, timeline, description = '') {
    this.presets.set(id, {
      id,
      name,
      nameEn: name,
      description,
      tags: ['custom'],
      timeline: timeline.toJSON ? timeline.toJSON() : timeline
    });
  }

  /**
   * 删除自定义预设（内置预设不可删除）
   */
  delete(id) {
    const builtIn = ['sleep', 'study', 'exercise', 'focus', 'anxiety'];
    if (builtIn.includes(id)) return false;
    return this.presets.delete(id);
  }

  /**
   * 导出所有自定义预设
   */
  exportCustom() {
    const builtIn = ['sleep', 'study', 'exercise', 'focus', 'anxiety'];
    const custom = [];
    for (const [id, preset] of this.presets) {
      if (!builtIn.includes(id)) custom.push(preset);
    }
    return custom;
  }

  /**
   * 导入预设
   */
  import(data) {
    for (const preset of data) {
      this.presets.set(preset.id, preset);
    }
  }
}

if (typeof module !== 'undefined') module.exports = PresetManager;
