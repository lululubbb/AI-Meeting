<template>
  <div class="help-container">
    <h1 class="help-title">帮助页面</h1>
    <p class="help-intro">欢迎来到帮助页面，这里有一些常见问题的解答和使用指南，帮助你更好地了解和使用我们的产品</p>

    <!-- 产品概述 -->
    <section class="help-section">
      <h2 class="section-title">产品概述</h2>
      <p>我们的产品是一款专注于会议管理和协作的应用，旨在为用户提供高效、便捷的会议体验它具备多种实用的功能，可满足不同场景下的会议需求，包括智能会议记录、AI助手、会议数据统计、实时语音转录与翻译等</p>
    </section>

    <!-- 功能模块介绍 -->
    <section class="help-section">
      <h2 class="section-title">功能模块介绍</h2>

      <!-- 登录注册模块 -->
      <div class="module">
        <h3 class="module-title">登录注册模块</h3>
        <ul class="feature-list">
          <li>
            <h4>💡注册与登录</h4>
            <p>首次使用时，你需要注册一个账号在登录页面输入邮箱地址和密码，或者选择使用 Google 账号登录</p>
          </li>
        </ul>
      </div>

      <!-- 基础会议功能模块 -->
      <div class="module">
        <h3 class="module-title">基础会议功能模块</h3>
        <ul class="feature-list">
          <li>
            <h4>💡会议创建与加入</h4>
            <p>创建日程、生成房间号、邀请成员、加入会议</p>
          </li>
          <li>
            <h4>💡会议基础功能</h4>
            <p>支持音视频、视频共享、音频转录、文字聊天、文件传输等基础功能</p>
          </li>
          <li>
            <h4>💡会议预约</h4>
            <p>预约会议，到预约时间系统会提示是否需要创建会议</p>
          </li>
        </ul>
      </div>

      <!-- 智能会议记录分析模块 -->
      <div class="module">
        <h3 class="module-title">智能会议记录分析模块</h3>
        <ul class="feature-list">
          <li>
            <h4>💡会议内容记录</h4>
            <p>详细记录发言内容，可用于访谈、报告、复盘会议、回忆会议内容等</p>
          </li>
          <li>
            <h4>💡会议内容分析</h4>
            <p>按会议类型提取关键信息并进行总结等，可用于任务分配和执行、记录重要知识点、记录重要决策</p>
          </li>
        </ul>
      </div>

      <!-- AI助手模块 -->
      <div class="module">
        <h3 class="module-title">AI助手模块</h3>
        <ul class="feature-list">
          <li>
            <h4>💡AI会议创建</h4>
            <p>根据用户指令自动创建符合要求的会议安排，通过简短指令即可快速创建会议</p>
          </li>
          <li>
            <h4>💡AI+文档</h4>
            <p>使用AI对会议中上传的文档资料等进行润色检查以及摘要提取等，提炼文档关键信息并优化原有表述</p>
          </li>
          <li>
            <h4>💡AI聊天问答</h4>
            <p>提供AI聊天界面，用户可以与AI进行互动，询问不了解的知识和术语</p>
          </li>
        </ul>
      </div>

      <!-- 会议数据管理模块 -->
      <div class="module">
        <h3 class="module-title">会议数据管理模块</h3>
        <ul class="feature-list">
          <li>
            <h4>💡历史会议记录</h4>
            <p>自动生成参会者所参加过的会议及其相关信息</p>
          </li>
          <li>
            <h4>💡会议数据生成</h4>
            <p>自动统计参会者进出会议时间、时长，生成可导出的Excel表格</p>
          </li>
          <li>
            <h4>💡参会者行为分析</h4>
            <p>分析参会者行为，评估参会者参与度，生成可导出的Excel表格</p>
          </li>
          <li>
            <h4>💡最近会议统计</h4>
            <p>统计用户每日参加的会议次数以及会议时长分布，并可点击柱状图日期查询当日会议</p>
          </li>
        </ul>
      </div>

      <!-- 语言转录和翻译模块 -->
      <div class="module">
        <h3 class="module-title">语言转录模块</h3>
        <ul class="feature-list">
          <li>
            <h4>💡实时语言转录</h4>
            <p>可以识别发言人中英文发言内容，并将转录出来的文本显示在会议下方，方便交流探讨</p>
          </li>
        </ul>
      </div>

      <!-- 文件管理模块 -->
      <div class="module">
        <h3 class="module-title">文件管理模块</h3>
        <ul class="feature-list">
          <li>
            <h4>💡会议文件管理</h4>
            <p>存储用户在会议中得到的文件，并可以对文件进行智能分析</p>
          </li>
        </ul>
      </div>
    </section>

    <!-- 使用指南 -->
    <section class="help-section">
      <h2 class="section-title">使用指南</h2>
      <ol class="guide-list">
        <li>
          <h3>注册与登录</h3>
          <p>首次使用时，你需要注册一个账号在登录页面输入邮箱地址和密码，或者选择使用 Google 账号登录</p>
        </li>
        <li>
          <h3>创建会议</h3>
          <p>登录后，在首页点击“创建会议”按钮，填写会议的基本信息，如会议名称、用户名、会议密码等，然后点击“创建会议”即可，可以点击复制会议邀请，将会议内容复制到剪切板，发送给需要邀请的人</p>
        </li>
        <li>
          <h3>预约会议</h3>
          <p>在首页点击“预约会议”按钮，设置会议时间、主题等信息，系统会在预约时间提醒用户是否需要创建会议</p>
        </li>
        <li>
          <h3>加入会议</h3>
          <p>如果你收到了会议邀请，复制改会议邀请然后点击在首页点击“加入会议”按钮，系统会自动识别剪贴板的内容将其输入会议名称即可加入会议；若未识别成功可以手动将会议名称输入到表单中进行加入</p>
        </li>
        <li>
          <h3>使用智能会议笔记助手</h3>
          <p>在会议界面，点击“一键”按钮，系统会根据会议形式自动记录和优化会议内容</p>
        </li>
        <li>
          <h3>查看会议数据统计</h3>
          <p>在“会议统计”页面，查看参会者基础会议数据和计算出来的参与度得分数据，并导出Excel文件</p>
        </li>
        <li>
          <h3>管理会议文件</h3>
          <p>在“文件管理”页面，上传和检索会议文档，并利用AI功能进行摘要分析，方便文件的存储和阅读</p>
        </li>
      </ol>
    </section>

    <!-- 常见问题解答 -->
    <section class="help-section">
      <h2 class="section-title">常见问题解答</h2>
      <dl class="faq-list">
        <dt>🟣如何使用这个应用？</dt>
        <dd>请参考上述使用指南，按照步骤操作即可</dd>
        <dt>🟣遇到问题如何联系支持？</dt>
        <dd>您可以通过以下方式联系我们团队：<br>
          发送电子邮件至 <b>sky1470719422@gmail.com</b><br>
        </dd>
      </dl>
    </section>
  </div>
</template>

<script setup>
// 这里不需要额外的 JavaScript 代码
</script>

<style scoped>
/* 全局样式 */
.help-container {
  font-family: Arial, sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  line-height: 1.6;
}

.help-title {
  text-align: center;
  color: var(--text-color);
  margin-bottom: 20px;
}

.help-intro {
  text-align: center;
  color: var(--text-color);
  margin-bottom: 40px;
}

/* 每个帮助部分的样式 */
.help-section {
  margin-bottom: 40px;
}

.section-title {
  color: var(--text-color);
  border-bottom: 2px solid #ccc;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

/* 模块样式 */
.module {
  margin-bottom: 30px;
}

.module-title {
  color: var(--text-color);
  font-size: 20px;
  margin-bottom: 15px;
}

/* 功能列表样式 */
.feature-list {
  list-style-type: none;
  padding: 0;
}

.feature-list li {
  margin-bottom: 15px;
}

.feature-list h4 {
  color: var(--text-color);
  margin-bottom: 8px;
}

/* 使用指南列表样式 */
.guide-list {
  counter-reset: step;
  list-style-type: none;
  padding: 0;
}

.guide-list li {
  margin-bottom: 20px;
  position: relative;
  padding-left: 40px;
}

.guide-list li::before {
  content: counter(step);
  counter-increment: step;
  position: absolute;
  left: 0;
  top: 0;
  width: 30px;
  height: 30px;
  background-color: #007BFF;
  color: white;
  border-radius: 50%;
  text-align: center;
  line-height: 30px;
}

.guide-list h3 {
  color: var(--text-color);
  margin-bottom: 10px;
}

/* 常见问题解答列表样式 */
.faq-list {
  margin: 0;
  padding: 0;
}

.faq-list dt {
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 10px;
}

.faq-list dd {
  margin-bottom: 20px;
  color: var(--text-color);
}

/* 手机端样式（屏幕宽度小于 768px） */
@media (max-width: 768px) {
  /* 帮助容器样式调整 */
  .help-container {
    padding: 15px;
    max-width: 100%;
  }

  /* 帮助标题样式调整 */
  .help-title {
    font-size: 24px;
    margin-bottom: 15px;
  }

  /* 帮助介绍样式调整 */
  .help-intro {
    font-size: 14px;
    margin-bottom: 30px;
  }

  /* 每个帮助部分样式调整 */
  .help-section {
    margin-bottom: 30px;
  }

  .section-title {
    font-size: 20px;
    padding-bottom: 8px;
    margin-bottom: 15px;
  }

  /* 模块样式调整 */
  .module {
    margin-bottom: 20px;
  }

  .module-title {
    font-size: 18px;
    margin-bottom: 12px;
  }

  /* 功能列表样式调整 */
  .feature-list li {
    margin-bottom: 12px;
  }

  .feature-list h4 {
    font-size: 16px;
    margin-bottom: 6px;
  }

  .feature-list p {
    font-size: 14px;
  }

  /* 使用指南列表样式调整 */
  .guide-list li {
    margin-bottom: 15px;
    padding-left: 35px;
  }

  .guide-list li::before {
    width: 25px;
    height: 25px;
    line-height: 25px;
    font-size: 14px;
  }

  .guide-list h3 {
    font-size: 16px;
    margin-bottom: 8px;
  }

  .guide-list p {
    font-size: 14px;
  }

  /* 常见问题解答列表样式调整 */
  .faq-list dt {
    font-size: 16px;
    margin-bottom: 8px;
  }

  .faq-list dd {
    font-size: 14px;
    margin-bottom: 15px;
  }
}

/* 更小屏幕手机端样式（屏幕宽度小于 480px） */
@media (max-width: 480px) {
  /* 帮助容器样式进一步调整 */
  .help-container {
    padding: 10px;
  }

  /* 帮助标题样式进一步调整 */
  .help-title {
    font-size: 20px;
    margin-bottom: 12px;
  }

  /* 帮助介绍样式进一步调整 */
  .help-intro {
    font-size: 12px;
    margin-bottom: 20px;
  }

  /* 每个帮助部分样式进一步调整 */
  .help-section {
    margin-bottom: 20px;
  }

  .section-title {
    font-size: 18px;
    padding-bottom: 6px;
    margin-bottom: 12px;
  }

  /* 模块样式进一步调整 */
  .module {
    margin-bottom: 15px;
  }

  .module-title {
    font-size: 16px;
    margin-bottom: 10px;
  }

  /* 功能列表样式进一步调整 */
  .feature-list li {
    margin-bottom: 10px;
  }

  .feature-list h4 {
    font-size: 14px;
    margin-bottom: 5px;
  }

  .feature-list p {
    font-size: 12px;
  }

  /* 使用指南列表样式进一步调整 */
  .guide-list li {
    margin-bottom: 12px;
    padding-left: 30px;
  }

  .guide-list li::before {
    width: 20px;
    height: 20px;
    line-height: 20px;
    font-size: 12px;
  }

  .guide-list h3 {
    font-size: 14px;
    margin-bottom: 6px;
  }

  .guide-list p {
    font-size: 12px;
  }

  /* 常见问题解答列表样式进一步调整 */
  .faq-list dt {
    font-size: 14px;
    margin-bottom: 6px;
  }

  .faq-list dd {
    font-size: 12px;
    margin-bottom: 12px;
  }
}
</style>