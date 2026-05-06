/**
 * LLM 解析器 (LLM Parser)
 * 将自然语言描述转换为编排指令
 * 
 * 支持 API 配置（用户自行提供 key）
 * 存储在 localStorage，不上传
 */

class LLMParser {
  constructor() {
    this.config = this._loadConfig();
  }

  /**
   * 加载配置（从 localStorage）
   */
  _loadConfig() {
    try {
      const saved = localStorage.getItem('tapsphere_llm_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      endpoint: '',
      apiKey: '',
      model: '',
      provider: 'openai' // openai 兼容格式
    };
  }

  /**
   * 保存配置
   */
  saveConfig(config) {
    this.config = { ...this.config, ...config };
    localStorage.setItem('tapsphere_llm_config', JSON.stringify(this.config));
  }

  /**
   * 是否已配置
   */
  isConfigured() {
    return !!(this.config.endpoint && this.config.apiKey);
  }

  /**
   * 解析自然语言 → 编排指令
   * @param {string} userText - 用户输入
   * @returns {object} - { clips: [...], description: string }
   */
  async parse(userText) {
    if (!this.isConfigured()) {
      throw new Error('LLM API 未配置。请点击⚙️设置 API。');
    }

    const systemPrompt = `你是一个 ASMR 声音编排助手。用户会描述想要的敲击音效果，你需要将其转换为 JSON 格式的编排指令。

可用材料：wood(木头), glass(玻璃), metal(金属), ceramic(陶瓷), stone(石头), bamboo(竹子)
可用区域：forehead(额头), crown(头顶), temple(太阳穴), ear(耳朵), back(后脑勺), cheek(脸颊), chin(下巴), neck(颈部)

请返回纯 JSON，格式如下：
{
  "description": "简短描述这个编排方案",
  "clips": [
    { "material": "wood", "region": "back", "velocity": 0.3, "startTime": 0, "duration": 3.0 },
    ...
  ],
  "loop": true,
  "crossfade": 0.5
}

规则：
- velocity 范围 0.1~1.0（轻柔=0.2~0.3，中等=0.4~0.6，有力=0.7~0.9）
- startTime 单位秒，按用户描述的节奏安排
- 如果用户没有指定具体数量，生成 4~8 个片段
- 如果用户说"慢节奏"，间隔 5~10 秒；"中等"间隔 3~5 秒；"快节奏"间隔 1~3 秒
- duration 每个片段 1.5~4.0 秒
- 只返回 JSON，不要其他文字`;

    const body = {
      model: this.config.model || 'MiniMax-M2.7',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText }
      ],
      temperature: 0.7,
      max_tokens: 1000
    };

    try {
      const resp = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(body)
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`API 错误 (${resp.status}): ${err}`);
      }

      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content || data.result || '';
      
      // 去掉 think 标签（部分模型会返回）
      let clean = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      // 去掉 markdown 代码块包裹
      clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      
      // 提取 JSON
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('LLM 返回格式异常，无法解析 JSON');
      
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('[LLMParser] Error:', e);
      throw e;
    }
  }
}

if (typeof module !== 'undefined') module.exports = LLMParser;
