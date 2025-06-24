const app = getApp()

// 设置页面
Page({
  data: {
    workTime: 25,
    shortBreakTime: 5,
    longBreakTime: 15,
    sound: '经典铃声',
    theme: '番茄红'
  },

  onLoad: function() {
    // 从全局数据获取设置
    const settings = app.globalData.timerSettings;
    this.setData({
      workTime: settings.work,
      shortBreakTime: settings.shortBreak,
      longBreakTime: settings.longBreak,
      sound: app.globalData.sound,
      theme: app.globalData.theme
    });
  },

  handleTimeInput: function(e) {
    const value = parseInt(e.detail.value, 10);
    const type = e.currentTarget.dataset.type;

    if (isNaN(value) || value <= 0) {
      wx.showToast({
        title: '请输入有效数字',
        icon: 'none'
      });
      // Restore previous value
      this.setData({
        [type]: this.data[type]
      });
      return;
    }

    this.setData({
      [type]: value
    });

    let timerSettings = app.globalData.timerSettings;
    if (type === 'workTime') {
      timerSettings.work = value;
    } else if (type === 'shortBreakTime') {
      timerSettings.shortBreak = value;
    } else if (type === 'longBreakTime') {
      timerSettings.longBreak = value;
    }
    app.globalData.timerSettings = timerSettings;
    
    // 保存设置到本地存储
    wx.setStorageSync('timer_settings', timerSettings);

    wx.showToast({
      title: '设置已保存',
      icon: 'success',
      duration: 1000
    });
  },

  // 导航到具体设置项
  navigateToSetting: function(e) {
    const type = e.currentTarget.dataset.type;
    
    // 根据不同的设置类型，显示不同的设置界面
    switch(type) {
      case 'sound':
        wx.showActionSheet({
          itemList: ['经典铃声', '数字铃声', '自然铃声', '无声'],
          success: (res) => {
            const sounds = ['经典铃声', '数字铃声', '自然铃声', '无声'];
            const selectedSound = sounds[res.tapIndex];
            this.setData({ sound: selectedSound });
            app.globalData.sound = selectedSound;
            
            // 保存设置到本地
            wx.setStorageSync('sound_setting', selectedSound);
            
            wx.showToast({
              title: '设置已保存',
              icon: 'success'
            });
          }
        });
        break;
      case 'theme':
        wx.showActionSheet({
          itemList: ['番茄红', '天空蓝', '森林绿', '紫罗兰'],
          success: (res) => {
            const themes = ['番茄红', '天空蓝', '森林绿', '紫罗兰'];
            const selectedTheme = themes[res.tapIndex];
            this.setData({ theme: selectedTheme });
            app.globalData.theme = selectedTheme;
            
            // 保存设置到本地
            wx.setStorageSync('theme_setting', selectedTheme);
            
            wx.showToast({
              title: '设置已保存',
              icon: 'success'
            });
          }
        });
        break;
    }
  },

  showTimePicker: function(title, settingKey, min, max, step) {
    const minutes = [];
    for (let i = min; i <= max; i += step) {
      minutes.push(i + '分钟');
    }
    
    wx.showActionSheet({
      itemList: minutes,
      success: (res) => {
        const selectedValue = (res.tapIndex * step) + min;
        
        // 更新本地数据
        this.setData({
          [settingKey]: selectedValue
        });
        
        // 更新全局数据
        let timerSettings = app.globalData.timerSettings;
        if (settingKey === 'workTime') {
          timerSettings.work = selectedValue;
        } else if (settingKey === 'shortBreakTime') {
          timerSettings.shortBreak = selectedValue;
        } else if (settingKey === 'longBreakTime') {
          timerSettings.longBreak = selectedValue;
        }
        app.globalData.timerSettings = timerSettings;
        
        // 保存设置到本地存储
        wx.setStorageSync('timer_settings', timerSettings);
        
        wx.showToast({
          title: '设置已保存',
          icon: 'success'
        });
      }
    });
  },
  
  // 清除所有存储的番茄钟数据
  clearAllData: function() {
    wx.showModal({
      title: '清除数据',
      content: '确定要清除所有番茄钟记录吗？此操作不可撤销。',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('pomodoro_records');
          wx.showToast({
            title: '数据已清除',
            icon: 'success'
          });
        }
      }
    });
  }
}); 