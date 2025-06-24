Page({
  data: {
    inputValue: '',
    // 将消息列表初始化为空数组
    messages: [],
    // 确保滚动到底部
    scrollTop: 0,
    isRequesting: false,  // 添加请求状态标记
    retryCount: 0,
    maxRetries: 3,
    system_prompt: `# 角色
你是一位专业、高效且人性化的个人计划制定专家。你的核心任务是根据用户需求，制定清晰、可行、个性化的计划方案，并主动引导用户完善模糊需求。

# 能力要求
1. **需求澄清**：当用户目标模糊时，通过提问明确关键要素（如领域、目标、截止日期、可用时间、优先级）。
2. **结构化拆分**：将大目标拆解为可执行的小任务，并合理分配时间资源。
3. **优先级管理**：自动识别任务紧急性/重要性，提供优先级建议（如 Eisenhower 矩阵）。
4. **弹性设计**：预留缓冲时间应对突发情况，避免计划过于僵化。
5. **进度追踪**：提供计划执行建议（如每日复盘节点、里程碑检查点）。
6. **激励引导**：用积极语言增强用户执行力（例："坚持3天就能养成习惯！"）。

# 输出规范
✅ **格式**：使用Markdown分段，包含以下模块：
  - **目标确认**：复述用户需求确保理解一致
  - **计划周期**：明确总时间跨度（如7天/1个月）
  - **每日任务表**：按时间顺序排列任务清单（含预估时长）
  - **优先级标签**：为任务标注[紧急/重要][可选]
  - **关键里程碑**：设定阶段性验收节点
  - **风险提示**：提前预警可能障碍及应对建议
❌ **禁止**：空洞建议（如"努力坚持"）、超负荷安排、忽略用户约束条件

# 交互原则
🔹 主动询问缺失信息（截止日/每日可用时间/偏好节奏）
🔹 提供2-3个细化方案让用户选择（例："您想侧重深度练习还是快速入门？"）
🔹 每次输出后询问："需要调整强度或补充细节吗？"
`
  },

  onInput: function(e) {
    this.setData({
      inputValue: e.detail.value
    });
  },

  sendMessage: function() {
    const text = this.data.inputValue.trim();
    if (!text) return;
    
    // 检查是否正在请求中
    if (this.data.isRequesting) {
      wx.showToast({
        title: '请等待上一条消息发送完成',
        icon: 'none'
      });
      return;
    }

    const userMsg = {
      from: 'user',
      avatar: '/时钟.png', // 可替换为用户头像
      text: text
    };
    const newMessages = this.data.messages.concat(userMsg);
    this.setData({
      messages: newMessages,
      inputValue: '',
      isRequesting: true,  // 设置请求状态为true
      retryCount: 0
    });
    this.scrollToBottom();
    this.sendToMoonshot(newMessages);
  },

  sendToMoonshot: function(messageList) {
    const that = this;
    
    // 首先检查网络状态
    wx.getNetworkType({
      success: function(res) {
        if (res.networkType === 'none') {
          that.handleError('网络连接不可用，请检查网络设置');
          return;
        }
        
        // 转换为Moonshot API格式
        const moonshotMessages = messageList.map(msg => {
          if (msg.from === 'user') {
            return { role: 'user', content: msg.text };
          } else if (msg.from === 'ai') {
            return { role: 'assistant', content: msg.text };
          }
          return null;
        }).filter(Boolean);

        // 添加系统提示
        const messagesWithSystemPrompt = [{
          role: 'system',
          content: that.data.system_prompt
        }].concat(moonshotMessages);

        // 使用备用API地址
        wx.request({
          url: 'https://api.moonshot.cn/v1/chat/completions',
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer sk-8t8msRqFogAQrEeXmWkfeUbPWNyGAnPeyJqjLEQ3PYKQxDj2'
          },
          timeout: 30000,
          data: {
            model: 'moonshot-v1-8k',
            messages: messagesWithSystemPrompt,
            temperature: 0.7,
            max_tokens: 800
          },
          success(res) {
            if (res.statusCode !== 200) {
              console.error('API响应异常:', res);
              if (that.data.retryCount < that.data.maxRetries) {
                that.setData({
                  retryCount: that.data.retryCount + 1
                });
                setTimeout(() => {
                  that.sendToMoonshot(messageList);
                }, 1000);
                return;
              }
              that.handleError('服务器响应异常：' + res.statusCode);
              return;
            }

            let aiText = '';
            if (res.data && res.data.choices && res.data.choices[0] && res.data.choices[0].message) {
              aiText = res.data.choices[0].message.content;
            } else {
              console.error('API响应格式异常:', res.data);
              aiText = '抱歉，AI响应格式异常，请重试。';
            }
            
            const aiMsg = {
              from: 'ai',
              avatar: '/时钟.png', // 可替换为AI头像
              text: aiText
            };
            that.setData({
              messages: that.data.messages.concat(aiMsg),
              isRequesting: false,
              retryCount: 0
            });
            that.scrollToBottom();
          },
          fail(error) {
            console.error('API请求失败：', error);
            if (that.data.retryCount < that.data.maxRetries) {
              that.setData({
                retryCount: that.data.retryCount + 1
              });
              setTimeout(() => {
                that.sendToMoonshot(messageList);
              }, 1000);
              return;
            }
            that.handleError('连接服务器失败，请稍后重试');
          }
        });
      },
      fail: function(error) {
        console.error('获取网络状态失败：', error);
        that.handleError('无法获取网络状态，请检查网络设置');
      }
    });
  },

  handleError: function(errorMessage) {
    const failMsg = {
      from: 'ai',
      avatar: '/时钟.png',
      text: errorMessage
    };
    this.setData({
      messages: this.data.messages.concat(failMsg),
      isRequesting: false,
      retryCount: 0
    });
    this.scrollToBottom();
    
    // 显示错误提示
    wx.showToast({
      title: errorMessage,
      icon: 'none',
      duration: 2000
    });
  },

  scrollToBottom: function() {
    this.setData({
      scrollTop: this.data.messages.length * 1000
    });
  },

  onLoad: function() {
    // 检查网络状态
    wx.getNetworkType({
      success: (res) => {
        if (res.networkType === 'none') {
          wx.showToast({
            title: '请检查网络连接',
            icon: 'none',
            duration: 2000
          });
        }
      }
    });
    
    this.scrollToBottom();
  }
}); 