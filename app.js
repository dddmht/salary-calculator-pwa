// 监听PWA安装提示事件
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  // 阻止浏览器默认提示
  e.preventDefault();
  // 保存事件，以便稍后触发
  deferredPrompt = e;
  // 创建安装按钮（如果不存在）
  createInstallButton();
});

// 监听应用安装完成事件
window.addEventListener('appinstalled', () => {
  // 清除 deferredPrompt
  deferredPrompt = null;
  // 隐藏安装按钮
  hideInstallButton();
  console.log('应用已安装');
});

// 创建安装按钮函数
function createInstallButton() {
  if (document.getElementById('install-btn')) return;

  const installBtn = document.createElement('button');
  installBtn.id = 'install-btn';
  installBtn.textContent = '安装应用';
  installBtn.style.position = 'fixed';
  installBtn.style.bottom = '20px';
  installBtn.style.right = '20px';
  installBtn.style.padding = '10px 20px';
  installBtn.style.backgroundColor = '#317EFB';
  installBtn.style.color = 'white';
  installBtn.style.border = 'none';
  installBtn.style.borderRadius = '5px';
  installBtn.style.cursor = 'pointer';
  installBtn.style.zIndex = '1000';

  installBtn.addEventListener('click', () => {
    if (deferredPrompt) {
      // 显示安装提示
      deferredPrompt.prompt();
      // 等待用户选择
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('用户接受了安装提示');
        } else {
          console.log('用户拒绝了安装提示');
        }
        deferredPrompt = null;
        hideInstallButton();
      });
    }
  });

  document.body.appendChild(installBtn);
}

// 隐藏安装按钮函数
function hideInstallButton() {
  const installBtn = document.getElementById('install-btn');
  if (installBtn) {
    installBtn.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const userFormSection = document.getElementById('user-form-section');
    const resultSection = document.getElementById('result-section');
    const userForm = document.getElementById('user-form');
    const editSettingsBtn = document.getElementById('edit-settings');
    const greeting = document.getElementById('greeting');
    const todayEarned = document.getElementById('today-earned');
    const offWorkCountdown = document.getElementById('off-work-countdown');
    const paydayCountdown = document.getElementById('payday-countdown');

    // 声明定时器变量
    let calculationTimer = null;

    // 检查是否有保存的用户设置
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
        // 显示结果页面
        userFormSection.classList.add('hidden');
        resultSection.classList.remove('hidden');

        // 加载用户设置
        const userSettings = JSON.parse(savedSettings);
        displayGreeting(userSettings.name);

        // 初始化计算
        updateCalculations(userSettings);

        // 清除旧定时器并创建新定时器
        if (calculationTimer) {
            clearInterval(calculationTimer);
        }
        calculationTimer = setInterval(() => {
            updateCalculations(userSettings);
        }, 1000);
    }

    // 表单提交事件
    userForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // 获取表单数据
        const userSettings = {
            name: document.getElementById('name').value,
            workDays: parseInt(document.getElementById('work-days').value),
            startTime: document.getElementById('start-time').value,
            endTime: document.getElementById('end-time').value,
            monthlySalary: parseFloat(document.getElementById('monthly-salary').value),
            payday: parseInt(document.getElementById('payday').value)
        };

        // 保存到localStorage
        localStorage.setItem('userSettings', JSON.stringify(userSettings));

        // 切换到结果页面
        userFormSection.classList.add('hidden');
        resultSection.classList.remove('hidden');

        // 显示安装按钮（如果支持PWA）
        if ('serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window) {
          createInstallButton();
        }

        // 显示问候语
        displayGreeting(userSettings.name);

        // 初始化计算
        updateCalculations(userSettings);

        // 清除旧定时器并创建新定时器
        if (calculationTimer) {
            clearInterval(calculationTimer);
        }
        calculationTimer = setInterval(() => {
            updateCalculations(userSettings);
        }, 1000);
    });

    // 修改设置按钮事件
    editSettingsBtn.addEventListener('click', () => {
        // 切换到表单页面
        resultSection.classList.add('hidden');
        userFormSection.classList.remove('hidden');

        // 加载已保存的设置到表单
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
            const userSettings = JSON.parse(savedSettings);
            document.getElementById('name').value = userSettings.name;
            document.getElementById('work-days').value = userSettings.workDays;
            document.getElementById('start-time').value = userSettings.startTime;
            document.getElementById('end-time').value = userSettings.endTime;
            document.getElementById('monthly-salary').value = userSettings.monthlySalary;
            document.getElementById('payday').value = userSettings.payday;
        }
    });

    // 显示问候语
    function displayGreeting(name) {
        const now = new Date();
        const hour = now.getHours();
        let greetingText;

        if (hour < 6) {
            greetingText = '凌晨好';
        } else if (hour < 9) {
            greetingText = '早上好';
        } else if (hour < 12) {
            greetingText = '上午好';
        } else if (hour < 14) {
            greetingText = '中午好';
        } else if (hour < 18) {
            greetingText = '下午好';
        } else if (hour < 22) {
            greetingText = '晚上好';
        } else {
            greetingText = '夜深了';
        }

        greeting.textContent = `${greetingText}，${name}！`;
    }

    // 更新所有计算结果
    function updateCalculations(userSettings) {
        updateTodayEarned(userSettings);
        updateOffWorkCountdown(userSettings);
        updatePaydayCountdown(userSettings.payday);
    }

    // 更新今日已赚工资
    function updateTodayEarned(userSettings) {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0-6, 0是周日

        // 判断是否是工作日（周一到周五是工作日，根据用户设置的工作天数调整）
        const isWorkDay = dayOfWeek !== 0 && dayOfWeek <= userSettings.workDays;

        if (!isWorkDay) {
            todayEarned.textContent = '¥0.00';
            return;
        }

        // 解析上班和下班时间
        const [startHour, startMinute] = userSettings.startTime.split(':').map(Number);
        const [endHour, endMinute] = userSettings.endTime.split(':').map(Number);

        // 创建今天的上班和下班时间对象
        const startTimeToday = new Date();
        startTimeToday.setHours(startHour, startMinute, 0, 0);

        const endTimeToday = new Date();
        endTimeToday.setHours(endHour, endMinute, 0, 0);

        // 计算工作总时长（毫秒）
        const totalWorkDuration = endTimeToday - startTimeToday;

        // 如果当前时间早于上班时间
        if (now < startTimeToday) {
            todayEarned.textContent = '¥0.00';
            return;
        }

        // 如果当前时间晚于下班时间
        let workedDuration;
        if (now > endTimeToday) {
            workedDuration = totalWorkDuration;
        } else {
            workedDuration = now - startTimeToday;
        }

        // 计算每毫秒的工资
        const workDaysPerMonth = userSettings.workDays * 4; // 假设每月4周
        const dailySalary = userSettings.monthlySalary / workDaysPerMonth;
        const hourlySalary = dailySalary / (totalWorkDuration / (1000 * 60 * 60));
        const perMillisecondSalary = hourlySalary / (1000 * 60 * 60);

        // 计算今日已赚工资
        const earnedToday = workedDuration * perMillisecondSalary;

        // 显示结果
        todayEarned.textContent = `¥${earnedToday.toFixed(2)}`;
    }

    // 更新下班倒计时
    function updateOffWorkCountdown(userSettings) {
        const now = new Date();
        const dayOfWeek = now.getDay();

        // 判断是否是工作日
        const isWorkDay = dayOfWeek !== 0 && dayOfWeek <= userSettings.workDays;

        if (!isWorkDay) {
            offWorkCountdown.textContent = '今天不上班';
            return;
        }

        // 解析下班时间
        const [endHour, endMinute] = userSettings.endTime.split(':').map(Number);

        // 创建今天的下班时间对象
        const endTimeToday = new Date();
        endTimeToday.setHours(endHour, endMinute, 0, 0);

        // 如果当前时间晚于下班时间
        if (now > endTimeToday) {
            offWorkCountdown.textContent = '已下班';
            return;
        }

        // 计算剩余时间
        const timeLeft = endTimeToday - now;
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        // 格式化显示
        offWorkCountdown.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // 更新发薪日倒计时
    function updatePaydayCountdown(payday) {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentDay = now.getDate();

        let nextPayday;

        // 如果当前日期小于等于发薪日
        if (currentDay <= payday) {
            nextPayday = new Date(now.getFullYear(), currentMonth, payday);
        } else {
            // 否则，发薪日在 next month
            nextPayday = new Date(now.getFullYear(), currentMonth + 1, payday);
        }

        // 计算剩余天数
        const timeLeft = nextPayday - now;
        const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

        // 显示结果
        paydayCountdown.textContent = `${daysLeft}天`;
    }
});