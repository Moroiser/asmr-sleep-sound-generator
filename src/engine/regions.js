/**
 * 头部声学区域定义
 * 
 * 每个区域有不同的声学特征：
 * - 骨传导特性（密度、厚度）
 * - 空腔共鸣（鼻腔、口腔、耳道）
 * - 软组织吸收
 * 
 * 参数说明：
 * - baseFreqMod: 基频修正系数（越大越亮）
 * - resonance: 共鸣强度（空腔越大越强）
 * - damping: 阻尼系数（软组织越大越闷）
 * - reverb: 混响量（空腔越大越多）
 * - stereoBias: 左右偏移（-1=左耳, 0=中, 1=右耳）
 * - verticalBias: 上下偏移（-1=下巴, 0=中, 1=头顶）
 */

const HEAD_REGIONS = {
  forehead: {
    name: '额头',
    emoji: '🧠',
    description: '前额骨骼较厚，声音明亮清脆',
    baseFreqMod: 1.3,   // 高频增强
    resonance: 0.2,     // 共鸣少（实心骨骼）
    damping: 0.3,       // 中等阻尼
    reverb: 0.1,        // 几乎无混响
    stereoBias: 0,      // 正中
    verticalBias: 0.7,  // 偏上
    color: '#ffcc80'
  },
  crown: {
    name: '头顶',
    emoji: '👑',
    description: '头顶圆润，声音饱满',
    baseFreqMod: 1.1,
    resonance: 0.3,
    damping: 0.4,
    reverb: 0.15,
    stereoBias: 0,
    verticalBias: 1.0,
    color: '#ffe0a0'
  },
  temple: {
    name: '太阳穴',
    emoji: '⚡',
    description: '颞骨较薄，声音空灵',
    baseFreqMod: 1.0,
    resonance: 0.6,     // 较强共鸣（靠近耳道）
    damping: 0.2,       // 阻尼低
    reverb: 0.4,        // 混响明显
    stereoBias: 0.7,    // 偏一侧
    verticalBias: 0.3,
    color: '#b0d0ff'
  },
  ear: {
    name: '耳朵',
    emoji: '👂',
    description: '耳廓共鸣，声音空洞独特',
    baseFreqMod: 0.8,   // 低频增强
    resonance: 0.9,     // 强共鸣（耳道空腔）
    damping: 0.1,       // 低阻尼
    reverb: 0.7,        // 强混响
    stereoBias: 1.0,    // 完全偏一侧
    verticalBias: 0.2,
    color: '#ffc0c0'
  },
  back: {
    name: '后脑勺',
    emoji: '🫥',
    description: '枕骨区域，声音沉闷有共鸣',
    baseFreqMod: 0.7,   // 低频为主
    resonance: 0.5,     // 中等共鸣
    damping: 0.6,       // 较高阻尼
    reverb: 0.3,
    stereoBias: 0,
    verticalBias: 0.5,
    color: '#c0c0e0'
  },
  cheek: {
    name: '脸颊',
    emoji: '😊',
    description: '颧骨区域，声音清脆带肉感',
    baseFreqMod: 1.1,
    resonance: 0.4,
    damping: 0.5,       // 软组织阻尼
    reverb: 0.2,
    stereoBias: 0.6,
    verticalBias: -0.2,
    color: '#ffb0b0'
  },
  chin: {
    name: '下巴',
    emoji: '🫦',
    description: '下颌骨，声音较闷',
    baseFreqMod: 0.8,
    resonance: 0.3,
    damping: 0.5,
    reverb: 0.15,
    stereoBias: 0,
    verticalBias: -0.8,
    color: '#d0b0d0'
  },
  neck: {
    name: '颈部',
    emoji: '🧣',
    description: '颈部软组织，声音极闷极柔',
    baseFreqMod: 0.5,   // 很低频
    resonance: 0.2,
    damping: 0.9,       // 极高阻尼（全是软组织）
    reverb: 0.1,
    stereoBias: 0,
    verticalBias: -1.0,
    color: '#e0d0c0'
  }
};

// 根据 3D 坐标判断头部区域
// head 是一个以原点为中心的模型，radius ≈ 1
function getRegionFromPosition(point) {
  const { x, y, z } = point;
  const r = Math.sqrt(x * x + y * y + z * z);
  
  // 归一化
  const nx = x / r;
  const ny = y / r;
  const nz = z / r;
  
  // 判断区域
  // 头顶
  if (ny > 0.75) return 'crown';
  
  // 颈部（下方）
  if (ny < -0.6) return 'neck';
  
  // 下巴（前下方）
  if (ny < -0.2 && nz > 0.3) return 'chin';
  
  // 后脑勺
  if (nz < -0.4) return 'back';
  
  // 耳朵（两侧，y 在中间）
  if (Math.abs(nx) > 0.7 && Math.abs(ny) < 0.4) return 'ear';
  
  // 太阳穴（两侧偏上）
  if (Math.abs(nx) > 0.5 && ny > 0) return 'temple';
  
  // 脸颊（前侧）
  if (nz > 0.2 && Math.abs(nx) > 0.3) return 'cheek';
  
  // 额头（前上方）
  if (nz > 0.3 && ny > 0.2) return 'forehead';
  
  // 默认：额头
  return 'forehead';
}

if (typeof module !== 'undefined') module.exports = { HEAD_REGIONS, getRegionFromPosition };
