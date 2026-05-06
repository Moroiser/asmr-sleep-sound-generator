# Sound Orchestration Architecture | 声音编排架构

> 让 agent 通过自然语言自动组合和播放 ASMR 音频，无需手动碰电脑。

## 系统分层

```
┌─────────────────────────────────────────────────────────┐
│                     用户 / Agent 层                       │
│  自然语言："帮我来一段轻柔的后脑勺木头敲击，节奏慢一点"       │
│  Agent 上下文识别：用户刚运动完 → 推荐运动恢复组合           │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   编排引擎层 (Orchestrator)               │
│  ┌──────────┐ ┌───────────┐ ┌──────────────────────┐    │
│  │ 预设组合  │ │ 人工编排   │ │ Agent 智能编排        │    │
│  │ 助眠/学习 │ │ 拖拽/代码  │ │ 情绪识别+自动排程     │    │
│  │ 运动恢复  │ │           │ │ 上下文感知+偏好学习   │    │
│  └────┬─────┘ └─────┬─────┘ └──────────┬───────────┘    │
│       └─────────────┼──────────────────┘                │
│                     ▼                                    │
│            时间线调度器 (Timeline)                         │
│  [片段1 0-30s] → [片段2 30-60s] → [片段3 60-120s] → ...  │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   声音片段层 (Clips)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ 合成片段      │  │ 采样片段      │  │ 混合片段      │   │
│  │ 实时生成      │  │ 预录音频库    │  │ 合成+采样混合  │   │
│  │ 材料+位置+力度 │  │ WAV/MP3/OGG  │  │              │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   输出层 (Output)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │ 实时播放  │  │ 导出WAV  │  │ 后台播放(锁屏/息屏)  │   │
│  └──────────┘  └──────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 核心概念

### 1. 声音片段 (Sound Clip)

最小声音单元。每个片段包含：

```json
{
  "id": "clip_001",
  "type": "synth | sample | hybrid",
  "source": {
    "material": "wood",
    "region": "back_of_head",
    "position": { "x": 0, "y": -0.2, "z": -0.8 },
    "velocity": 0.6
  },
  "duration": 2.5,
  "audioBuffer": null,
  "metadata": {
    "tags": ["tapping", "wood", "back", "soft"],
    "mood": ["calm", "sleepy"],
    "intensity": "low"
  }
}
```

### 2. 时间线 (Timeline)

片段的有序编排：

```json
{
  "name": "助眠基础组合",
  "totalDuration": 600,
  "clips": [
    { "clipId": "clip_001", "startTime": 0, "fadeIn": 0.5 },
    { "clipId": "clip_002", "startTime": 3, "fadeIn": 0.3 },
    { "clipId": "clip_003", "startTime": 8, "fadeIn": 0.2 },
    { "clipId": "clip_001", "startTime": 12, "fadeIn": 0.3, "note": "repeat with variation" }
  ],
  "loop": true,
  "crossfade": 0.5
}
```

### 3. 预设 (Preset)

命名的编排方案：

| 预设名 | 用途 | 特征 | 典型组合 |
|--------|------|------|----------|
| `sleep` | 助眠 | 低频、慢节奏、长衰减 | 后脑勺木头 + 头顶竹子 + 颈部石头 |
| `study` | 学习 | 中频、均匀节奏、不干扰 | 额头木头 + 脸颊陶瓷 |
| `exercise` | 运动恢复 | 中低频、有力度变化 | 太阳穴金属 + 耳朵玻璃 |
| `focus` | 专注 | 低频、极慢、单材料 | 后脑勺石头，每10秒一次 |
| `anxiety` | 缓解焦虑 | 低频、渐慢、渐弱 | 颈部木头 → 后脑勺石头，逐渐变慢 |
| `custom_*` | 用户自定义 | — | 用户保存的任意组合 |

### 4. Agent 编排模式

Agent 根据上下文自动选择或生成编排：

```python
# Agent 决策流程
def agent_orchestrate(user_context):
    # 1. 识别用户状态
    mood = detect_mood(user_context)        # 疲惫/焦虑/兴奋/平静
    activity = detect_activity(user_context) # 运动后/学习中/睡前/工作间隙
    time_of_day = get_time_context()         # 深夜/午后/清晨
    
    # 2. 选择基础预设
    base_preset = select_preset(mood, activity, time_of_day)
    
    # 3. 根据偏好微调
    preferences = load_user_preferences()    # 喜欢的材料、位置、节奏
    timeline = customize(base_preset, preferences)
    
    # 4. 自然语言调整
    if user_has_specific_request():
        timeline = apply_natural_language(timeline, user_request)
        # "后脑勺的敲击再轻一点" → velocity *= 0.7
        # "节奏再慢一些" → interval *= 1.5
        # "加一点玻璃的声音" → insert glass clips
    
    # 5. 播放
    play(timeline)
```

## 自然语言位置映射

用户用自然语言描述位置，系统映射到 3D 坐标：

| 自然语言 | 映射结果 |
|---------|----------|
| "后脑勺" | region: back, z: -0.8 |
| "左边太阳穴" | region: temple, x: -0.7 |
| "头顶偏右" | region: crown, x: 0.3, y: 1.0 |
| "右耳附近" | region: ear, x: 0.9 |
| "再左边一点" | 当前 x -= 0.2 |
| "往下移" | 当前 y -= 0.2 |
| "远一点" | 当前 z += 0.5 |
| "近一点" | 当前 z -= 0.3 |

解析器维护一个"当前游标"状态，相对调整基于上一次位置。

## 接口设计

### Agent 调用接口

Agent 通过以下方式控制编排：

```
# 单次敲击测试
"播放一次木头敲击后脑勺"

# 组合播放
"播放助眠组合"

# 自然语言编排
"来一段3分钟的轻柔敲击，用木头和竹子，位置在头部后方，节奏慢一点"

# 保存预设
"把刚才的组合保存为'我的助眠方案'"

# 修改正在播放的
"把节奏再放慢一点"
"换玻璃材料"
"声音再小一点"
```

### 代码接口

```javascript
// 播放单个片段
orchestrator.playClip({
  material: 'wood',
  region: 'back',
  velocity: 0.6,
  duration: 2.0
});

// 播放预设
orchestrator.playPreset('sleep');

// 自定义编排
orchestrator.playTimeline({
  clips: [
    { material: 'wood', region: 'back', velocity: 0.5, time: 0 },
    { material: 'bamboo', region: 'crown', velocity: 0.4, time: 3 },
    { material: 'glass', region: 'ear', velocity: 0.3, time: 8 }
  ],
  loop: true,
  duration: 600
});

// 自然语言解析
orchestrator.playNatural("轻柔的后脑勺木头敲击，每5秒一次，持续5分钟");

// 实时调整
orchestrator.adjust({ tempo: 0.7 });      // 节奏放慢30%
orchestrator.adjust({ volume: 0.5 });     // 音量减半
orchestrator.adjust({ material: 'glass' }); // 换材料

// 保存/加载预设
orchestrator.savePreset('my_sleep', timeline);
orchestrator.loadPreset('my_sleep');

// 停止
orchestrator.stop();
```

## 文件结构

```
src/
├── index.html                 # 3D 交互界面（现有）
├── engine/
│   ├── presets.js             # 材料声学预设（现有）
│   ├── regions.js             # 头部区域定义（现有）
│   ├── material.js            # 合成引擎（现有）
│   ├── rhythm.js              # 节奏引擎（现有）
│   ├── orchestrator.js        # 编排引擎（新增）
│   ├── timeline.js            # 时间线调度器（新增）
│   ├── clip-library.js        # 片段库管理（新增）
│   ├── preset-manager.js      # 预设管理器（新增）
│   ├── nlp-parser.js          # 自然语言位置/指令解析（新增）
│   └── presets-data/
│       ├── sleep.json         # 助眠预设
│       ├── study.json         # 学习预设
│       ├── exercise.json      # 运动恢复预设
│       └── focus.json         # 专注预设
└── samples/                   # 采样音频库（可选）
    ├── wood/
    ├── glass/
    └── metal/
```

## 开发优先级

| 阶段 | 功能 | 依赖 |
|------|------|------|
| P0 | 片段库管理（合成片段 CRUD） | 现有 material.js |
| P0 | 时间线调度器（顺序播放片段） | — |
| P0 | 预设管理器（内置 4 个预设） | 时间线 |
| P1 | Agent 接口（playPreset / playNatural） | 编排引擎 |
| P1 | 自然语言位置解析 | — |
| P2 | 采样音频支持 | Web Audio API decodeAudioData |
| P2 | 一键组合 + 实时调整 | 时间线 + Agent 接口 |
| P3 | Agent 情绪识别 + 上下文感知 | P1 全部完成 |
| P3 | 用户偏好学习 | 播放历史 |
| P3 | 导出 WAV / 分享预设 | OfflineAudioContext |
