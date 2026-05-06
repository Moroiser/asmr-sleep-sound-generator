# ASMR Sleep Sound Generator | ASMR助眠音生成器

> Generate customizable ASMR sleep sounds. 通过可定制参数生成 ASMR 助眠音，实现个性化助眠体验。

## 项目状态

- **阶段：** MVP 开发中
- **当前版本**: v0.3 — 声音编排系统（片段库+预设管理+编排引擎+自然语言解析+LLM API配置+3D头部交互）
- **创建时间：** 2026-05-06

## 核心想法

网上 ASMR 博主提供的敲击音都是固定录制的，无法自定义。本项目的目标是让用户可以通过参数调节，生成不同效果的敲击音：

- **位置**：不同敲击位置产生不同空间感
- **材料**：木头、玻璃、金属、陶瓷等不同材质的音色
- **音量**：轻柔到有力，可调节
- **音色**：频率、共鸣、衰减等参数
- **节奏**：随机或手动编排敲击节奏

## 项目目录

```
asmr-sleep-sound-generator/
├── README.md              # 项目总览（本文件）
├── docs/                  # 设计文档
│   └── orchestration-design.md  # 声音编排架构设计
├── references/            # 参考资料
│   └── github-survey.md   # GitHub 开源项目调研
└── src/                   # 源代码
    ├── index.html         # 主页面（3D 交互）
    ├── engine/
    │   ├── presets.js     # 材料声学预设（6种）
    │   ├── regions.js     # 头部区域定义（8个区域）
    │   ├── material.js    # 合成引擎（Web Audio API）
    │   └── rhythm.js      # 节奏引擎
    └── lib/
        ├── three.module.js    # Three.js 3D 引擎
        └── OrbitControls.js   # 轨道控制器
```

## 技术方向

### 推荐：Web 端合成（Tone.js + Web Audio API）

| 层次 | 技术 | 说明 |
|------|------|------|
| 合成引擎 | Tone.js | 内置打击乐/金属合成器，参数化音色 |
| 空间音频 | Web Audio PannerNode + HRTF | 双耳音效，拖拽改变声源位置 |
| 材料模型 | 参数预设 | 每种材料一套频率/衰减/滤波参数 |
| 前端 | React / Vue | 可视化交互界面 |

**为什么选 Web**: 无需安装、跨平台、可做成小程序/网页、实时交互能力强

### 进阶路线

| 阶段 | 方法 | 工具 |
|------|------|------|
| MVP | 参数化合成 | Tone.js，3-5 种材料预设 |
| 进阶 | 空间音频 | HRTF 双耳，位置可调 |
| 高级 | 物理建模 | DeepModal 方法，输入 3D 形状→合成声音 |
| 远期 | ML 生成 | 条件音频生成模型 |

## 关键参考项目

- **DeepModal** (北大): 输入 3D 形状+敲击位置，实时合成撞击音（~0.01s）
- **Tone.js**: 浏览器端交互式音频框架，内置多种合成器
- **tiks**: 零文件纯合成 UI 音效，参数化主题设计思路可借鉴
- **binaural-position-simulator**: HRTF 双耳空间音频，拖拽改变声源位置

## 待讨论

- [x] 调研现有 ASMR 音频生成工具 → 已完成
- [ ] 确定目标平台（建议 Web 起步）
- [ ] 确定 MVP 功能范围
- [ ] 确定材料种类和参数

## Agent Handoff Log

| 时间 | Agent | 操作 |
|------|-------|------|
| 2026-05-06 03:52 | 小H | 创建项目目录和 README |
| 2026-05-06 13:30 | 小H | GitHub 调研完成：13 个项目，推荐 Tone.js + Web Audio API 路线 |
| 2026-05-06 13:45 | 小H | MVP v0.1 完成：6 种材料 + 手动/随机模式 + 涟漪可视化 + 空间音频 |
| 2026-05-06 13:55 | 小H | 重构为 3D 头部交互：Three.js + 8 个头部区域声学模型 + 射线检测 |
| 2026-05-06 16:15 | 小H | 声音编排架构设计：片段库+时间线+预设+Agent智能编排 |
| 2026-05-06 16:30 | 小H | P0 代码完成：clip-library + preset-manager + orchestrator + 5个内置预设 + 自然语言解析 + UI集成 |
| 2026-05-06 16:35 | 小H | LLM API 集成：llm-parser + 设置弹窗 + MiniMax M2.7 测试通过（12 片段解析成功） |
| 2026-05-07 01:10 | 小H | 重写 `src/index.html`：集成 GLTFLoader 加载 `male_bust.glb` 3D 头部模型（支持降级参数化头部）、三灯布光、射线检测+区域判断、AudioLibrary 预生成音频库（显示加载进度）、Sequencer 序列播放（输入 `1,2,3,4,5` 或 `f_w_0,e_m_1` 格式）、序列步骤高亮、AudioExporter 导出WAV、新增「序列」模式UI（seq-bar + seq-steps）、保留所有原有模式（手动/随机/预设/自然语言）、保留设置弹窗LLM API配置。
