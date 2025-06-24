Component({
  properties: {
    active: {
      type: Number,
      value: 0
    },
    theme: {
      type: String,
      value: 'work'
    }
  },
  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index;
      console.log("Clicked tab index:", index);
      
      // 如果点击的是当前页面，不做任何操作
      if (index === this.properties.active) {
        return;
      }
      
      const pages = ['index', 'stats', 'settings', 'ai-chat'];
      const url = `/pages/${pages[index]}/${pages[index]}`;
      
      // 使用redirectTo而不是navigateTo，避免页面堆栈过多
      wx.redirectTo({
        url: url
      });
    },
    sendMessage: function(e) {
      const input = this.data.inputValue;
      console.log("Sending message:", input); // 添加调试信息
      if (input) {
        this.setData({
          messages: this.data.messages.concat({ text: input, from: 'user' }),
          inputValue: '' // 清空输入框
        });
        // 这里可以添加与AI的对话逻辑
        this.setData({
          messages: this.data.messages.concat({ text: 'AI的中文回复', from: 'ai' })
        });
      }
    },
    onInput: function(e) {
      console.log("Input value:", e.detail.value); // 添加调试信息
      this.setData({
        inputValue: e.detail.value
      });
    }
  }
}); 