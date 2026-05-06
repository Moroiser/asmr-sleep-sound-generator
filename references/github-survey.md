# GitHub 开源项目调研：ASMR 敲击音生成

> 调研日期：2026-05-06
> 目标：可交互的敲击音合成系统（材料/位置/音量可调）

---

## 一、直接相关项目

### 1. guzhiling/ASMR ⭐⭐⭐
- **GitHub**: https://github.com/guzhiling/ASMR
- **语言**: R
- **思路**: 用 R 的音频包（seewave、tuneR）生成可调长度的 ASMR 音频
- **状态**: 早期探索阶段，主要做素材收集和简单拼接
- **启发**: 需求跟我们完全一致——"生成随机 ASMR 音频，长度可调，音源可选"
- **局限**: 不是真正的合成，更像拼接；R 语言不适合做交互应用

### 2. DeepModal（北京大学）⭐⭐⭐⭐⭐ 【高度相关】
- **GitHub**: https://github.com/hellojxt/NeuralSound
- **论文**: ACM MM 2020
- **原理**: 基于物理的撞击音合成——输入 3D 物体形状 + 敲击位置 + 力度 → 实时输出声音
- **核心**: 用神经网络学习物体的模态数据（频率+振幅），支持任意形状
- **速度**: GTX 1080 Ti 上 ~0.01s 实时合成
- **材料**: 支持不同材料、不同大小的物体
- **评价**: 这是目前最接近我们需求的学术方案——给定形状和敲击点，实时合成声音

---

## 二、音频合成引擎/框架

### 3. Tone.js ⭐⭐⭐⭐⭐
- **GitHub**: https://github.com/Tonejs/Tone.js
- **语言**: JavaScript (Web Audio API)
- **特点**: 浏览器端交互式音频框架，内置多种合成器、效果器、调度系统
- **内置合成器**: MembraneSynth（打击乐）、MetalSynth（金属）、NoiseSynth（噪声）等
- **适用**: Web 端的敲击音合成首选框架
- **优势**: 无需安装，跨平台，实时交互，社区活跃

### 4. Pyo ⭐⭐⭐⭐
- **GitHub**: https://github.com/belangeo/pyo
- **语言**: Python (C 底层)
- **特点**: Python 实时音频信号处理库，支持振荡器、滤波器、包络、噪声等全套 DSP
- **适用**: 桌面端原型开发、算法验证
- **优势**: Python 生态，快速实验，实时交互

### 5. SuperCollider ⭐⭐⭐⭐
- **GitHub**: https://github.com/supercollider/supercollider
- **语言**: 自有语言 + C++
- **特点**: 专业级音频合成平台，数百种 UGen（单元生成器）
- **Python 绑定**: python-supercollider (pip install supercollider)
- **适用**: 高质量物理建模合成
- **优势**: 最强大的音频合成引擎，但学习曲线陡

### 6. Web Audio API（原生）⭐⭐⭐⭐
- **文档**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- **特点**: 浏览器内置，零依赖
- **关键节点**: OscillatorNode, GainNode, BiquadFilterNode, PannerNode (HRTF)
- **适用**: 最大灵活性，但需要自己搭建合成管线

---

## 三、空间音频（位置感）

### 7. binaural-position-simulator ⭐⭐⭐⭐
- **GitHub**: https://github.com/emstoo/binaural-position-simulator
- **原理**: Web Audio API 的 HRTF（头相关传递函数），拖拽改变声源位置
- **特点**: 2D 空间中拖拽声源，实时感受双耳音效变化
- **适用**: 实现"敲击位置"的空间感

### 8. spatial (3D Audio Designer) ⭐⭐⭐
- **GitHub**: https://github.com/maximesauvaget/spatial
- **原理**: Three.js 3D 视图 + HRTF 空间音频 + Glicol 实时合成
- **特点**: 可视化 3D 声源布局，实时合成
- **适用**: 高级空间音频设计

### 9. Listen2Scene ⭐⭐⭐
- **论文**: 材质感知的双耳音频传播
- **特点**: 考虑环境材质对声音传播的影响（反射、吸收）
- **适用**: 高级——让敲击音在不同空间（木屋 vs 石室）听起来不同

---

## 四、程序化声音生成

### 10. tiks ⭐⭐⭐⭐
- **GitHub**: https://github.com/rexa-developer/tiks
- **语言**: TypeScript (Web Audio API)
- **特点**: 零音频文件，纯合成——振荡器 + 噪声缓冲 + 增益包络
- **内置音效**: click, toggle, success, error, hover, pop 等
- **主题系统**: soft（温暖圆润）/ crisp（清脆机械）
- **启发**: 参数化主题设计思路——baseFreq, oscType, decay, brightness 等
- **评价**: 虽然是 UI 音效，但合成思路和参数设计完全可借鉴

---

## 五、AI 生成方案

### 11. HunyuanVideo-Foley ⭐⭐⭐
- **来源**: 腾讯混元
- **原理**: 多模态扩散模型，视频+文本 → Foley 音频
- **适用**: 后期——从视频自动生成匹配的敲击音

### 12. MambaFoley ⭐⭐
- **原理**: 状态空间模型生成 Foley 音频
- **适用**: 学术参考

### 13. AI ASMR Generator (aiasmrgenerator.com) ⭐⭐
- **类型**: 商业产品
- **特点**: AI 生成 ASMR 内容（主要是语音类）
- **局限**: 不是敲击音合成，更偏语音/耳语

---

## 六、推荐技术路线

### 核心问题分析

敲击音的声学特征主要由三个因素决定：
1. **材料** → 决定音色（频谱分布、共鸣频率）
2. **敲击位置** → 决定空间感（左右/远近/前后）
3. **力度** → 决定音量和衰减速度

### 路线 A：Web 端合成（推荐起步）⭐

```
技术栈: Tone.js + Web Audio API
架构:
  用户交互层 (React/Vue)
    ↓ 参数（材料、位置、力度、节奏）
  合成引擎层 (Tone.js)
    ├── 材料模型: 不同参数预设（频率、衰减、滤波）
    ├── 空间模型: PannerNode + HRTF
    ├── 力度模型: GainNode + 包络
    └── 节奏引擎: 随机/手动编排
    ↓ 音频流
  输出层 (AudioContext)
```

**优点**: 无需安装，跨平台，可直接做成小程序/网页
**材料实现**: 每种材料一套参数预设（基频、谐波比、衰减时间、滤波器 Q 值）

### 路线 B：物理建模合成（进阶）

```
技术栈: Python (Pyo) 或 SuperCollider
架构:
  输入: 材料属性 + 敲击位置 + 力度
    ↓
  物理模型: 模态合成（Modal Synthesis）
    ├── 计算物体固有频率（有限元/简化模型）
    ├── 材料阻尼系数
    └── 接触力模型
    ↓
  输出: 实时音频流 / WAV 文件
```

**优点**: 声学上更真实，理论上无限音色变化
**参考**: DeepModal 的方法

### 路线 C：ML 生成（远期）

```
技术栈: PyTorch + 预训练模型
架构:
  输入: 材料标签 + 位置参数 + 力度
    ↓
  模型: 条件音频生成（类似 DeepModal 的神经网络）
    ↓
  输出: 音频波形
```

---

## 七、输入输出格式建议

### 输入参数

| 参数 | 类型 | 范围 | 说明 |
|------|------|------|------|
| material | 枚举 | wood/glass/metal/ceramic/stone/plastic | 材料类型 |
| position_x | float | -1.0 ~ 1.0 | 左右位置（双耳） |
| position_y | float | 0.0 ~ 1.0 | 上下位置 |
| position_z | float | 0.0 ~ 3.0 | 距离（远近） |
| velocity | float | 0.0 ~ 1.0 | 敲击力度 |
| rhythm | 枚举/数组 | random/manual/pattern | 节奏模式 |
| tempo | float | 30 ~ 120 BPM | 节奏速度（手动模式） |
| duration | float | 1 ~ 120 min | 总时长 |

### 输出格式

| 格式 | 用途 | 说明 |
|------|------|------|
| 实时音频流 | 播放 | Web Audio API / AudioContext |
| WAV | 导出 | 44.1kHz/16bit，可离线渲染 |
| JSON 预设 | 保存/分享 | 材料参数、节奏模式的配置文件 |

### 材料参数预设示例

```json
{
  "wood": {
    "baseFreq": 200,
    "harmonics": [1, 2.3, 4.1, 6.7],
    "harmonicDecay": [1.0, 0.6, 0.3, 0.1],
    "attackTime": 0.002,
    "decayTime": 0.15,
    "filterFreq": 2000,
    "filterQ": 1.5,
    "noiseAmount": 0.3,
    "noiseColor": "pink"
  },
  "glass": {
    "baseFreq": 800,
    "harmonics": [1, 2.0, 3.0, 5.0, 7.0],
    "harmonicDecay": [1.0, 0.8, 0.6, 0.4, 0.2],
    "attackTime": 0.001,
    "decayTime": 0.8,
    "filterFreq": 6000,
    "filterQ": 3.0,
    "noiseAmount": 0.1,
    "noiseColor": "white"
  },
  "metal": {
    "baseFreq": 400,
    "harmonics": [1, 1.5, 2.0, 3.0, 4.5],
    "harmonicDecay": [1.0, 0.9, 0.7, 0.5, 0.3],
    "attackTime": 0.001,
    "decayTime": 1.5,
    "filterFreq": 4000,
    "filterQ": 5.0,
    "noiseAmount": 0.05,
    "noiseColor": "white"
  }
}
```

---

## 八、MVP 建议

**第一步**: 用 Tone.js 做一个 Web 原型
- 3 种材料（木/玻璃/金属）
- 点击屏幕不同位置 → 不同空间感
- 力度由点击速度/按压力度控制
- 随机节奏生成 + 手动敲击模式

**第二步**: 加入 HRTF 空间音频
- 用 Web Audio API 的 PannerNode
- 2D 平面拖拽声源位置

**第三步**: 丰富材料库 + 导出功能
- 更多材料预设
- 导出 WAV 文件
- 保存/分享参数预设
