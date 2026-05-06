/**
 * 材料声学预设
 * 每种材料 = 一组声学参数，决定敲击音的音色特征
 */
const MATERIAL_PRESETS = {
  wood: {
    name: '木头',
    emoji: '🪵',
    baseFreq: 200,
    harmonics: [1, 2.3, 4.1],
    harmonicAmp: [1.0, 0.5, 0.2],
    attack: 0.002,
    decay: 0.12,
    filterFreq: 2000,
    filterQ: 1.5,
    noiseMix: 0.35,
    noiseColor: 'pink',
    description: '低沉温暖，衰减快'
  },
  glass: {
    name: '玻璃',
    emoji: '🫙',
    baseFreq: 800,
    harmonics: [1, 2.0, 3.0, 5.0, 7.0],
    harmonicAmp: [1.0, 0.7, 0.5, 0.3, 0.15],
    attack: 0.001,
    decay: 0.8,
    filterFreq: 6000,
    filterQ: 3.0,
    noiseMix: 0.08,
    noiseColor: 'white',
    description: '清脆明亮，共鸣长'
  },
  metal: {
    name: '金属',
    emoji: '🔩',
    baseFreq: 400,
    harmonics: [1, 1.5, 2.0, 3.0, 4.5],
    harmonicAmp: [1.0, 0.85, 0.6, 0.4, 0.25],
    attack: 0.001,
    decay: 1.2,
    filterFreq: 4000,
    filterQ: 4.0,
    noiseMix: 0.05,
    noiseColor: 'white',
    description: '响亮锐利，余音绕梁'
  },
  ceramic: {
    name: '陶瓷',
    emoji: '🏺',
    baseFreq: 350,
    harmonics: [1, 2.5, 5.0, 8.0],
    harmonicAmp: [1.0, 0.6, 0.3, 0.1],
    attack: 0.001,
    decay: 0.4,
    filterFreq: 3500,
    filterQ: 2.5,
    noiseMix: 0.15,
    noiseColor: 'pink',
    description: '清脆厚实，中等衰减'
  },
  stone: {
    name: '石头',
    emoji: '🪨',
    baseFreq: 150,
    harmonics: [1, 1.8, 3.2],
    harmonicAmp: [1.0, 0.4, 0.15],
    attack: 0.003,
    decay: 0.08,
    filterFreq: 1200,
    filterQ: 1.0,
    noiseMix: 0.5,
    noiseColor: 'brown',
    description: '沉闷厚重，极短衰减'
  },
  bamboo: {
    name: '竹子',
    emoji: '🎋',
    baseFreq: 500,
    harmonics: [1, 2.8, 5.5, 9.0],
    harmonicAmp: [1.0, 0.7, 0.35, 0.12],
    attack: 0.001,
    decay: 0.2,
    filterFreq: 4500,
    filterQ: 2.0,
    noiseMix: 0.25,
    noiseColor: 'pink',
    description: '清亮空灵，干脆利落'
  }
};

// 导出
if (typeof module !== 'undefined') module.exports = MATERIAL_PRESETS;
