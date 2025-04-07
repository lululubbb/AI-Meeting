<!-- frontend\src\views\Login.vue -->
<template>
  <div class="login-wrapper">
    <!-- 登录和注册区域 -->
    <div class="login-section">
      <div class="brand-area">
        <h1 class="title">
          <span class="title-icon">🚀</span>
          智会西湖
        </h1>
        <h2 class="subtitle">AI Westlake</h2>
        <p class="welcome-text">欢迎回来！请登录您的账号</p>
      </div>

      <div class="form-container">
        <div class="input-group">
          <label for="email" class="label">邮箱地址</label>
          <input v-model="email" type="email" id="email" placeholder="请输入您的邮箱地址" class="input" @keyup.enter="handleEnter" />
          <span v-if="email && !isValidEmail(email)" class="input-error">邮箱格式不正确</span>
        </div>

        <div class="input-group">
          <label for="password" class="label">密码</label>
          <div class="password-container">
            <input :type="showPassword ? 'text' : 'password'" v-model="password" class="input password-input" placeholder="请输入您的密码" @keyup.enter="handleEnter" />
            <svg @click="toggleShow" :class="{ 'eye-icon': true, 'active': showPassword }" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path :d="showPassword ? openEyePath : closedEyePath" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span v-if="password && password.length < 8" class="input-error">密码长度至少8位</span>
        </div>
        <!-- 隐私政策同意 (仅注册时显示) -->
        <div v-if="!isLoginMode" class="privacy-consent">
          <input 
            type="checkbox" 
            id="privacy-accept" 
            v-model="privacyAccepted"
            class="privacy-checkbox"
          />
          <label for="privacy-accept" class="privacy-label">
            我已阅读并同意
            <!-- 修改这里：使用 a 标签或 span，添加 @click -->
            <a href="#" @click.prevent="showPrivacyModal" class="privacy-link">《隐私政策》</a>
             和 
            <a href="#" @click.prevent="showTermsModal" class="privacy-link">《用户服务协议》</a>
          </label>
        </div>
        <div class="button-section">
          <button @click="handleAuth" class="action-button" :disabled="!isFormValid">
            <span v-if="isSubmitting" class="loader"></span>
            {{ isLoginMode ? "邮箱登录" : "邮箱注册" }}
          </button>
          <button @click="toggleMode" class="toggle-button">
            {{ isLoginMode ? "没有账号？注册" : "已有账号？登录" }}
          </button>
        </div>

        <div class="social-login">
          <p class="social-login-text">或使用以下方式登录</p>
          <button @click="loginWithGoogle" class="social-button">
            <img src="@/assets/Google.png" alt="Google" class="social-icon" />
            <span class="social-button-text">Google 登录</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 介绍区域 (仅在较大屏幕上显示) -->
    <div class="intro-section" v-if="!isMobile">
      <img src="@/assets/intro1.png" alt="Illustration of modern meeting" class="intro-image animate-subtle-slide" />
      <div class="intro-text">
        <h3 class="intro-title">智会西湖，AI在慧议</h3>
        <p class="intro-description">大会讯息、实时转录、智能摘要、多语言支持，开启西湖论剑新篇章。</p>
      </div>
    </div>
        <!-- 隐私政策弹窗 -->
        <el-dialog
      v-model="privacyModalVisible"
      title="隐私政策"
      width="80%" 
      top="5vh" 
      :append-to-body="true"
      custom-class="policy-dialog"
    >
    <div class="policy-content">
            <!-- 隐私政策内容开始 -->
            <p class="update-date">最后更新日期：2024年5月 [请填写具体日期]</p>
            <p class="effective-date">生效日期：2024年5月 [请填写具体日期]</p>

            <h2>引言</h2>
            <p>欢迎使用 智会西湖云端论剑（AI Meeting）（以下简称“本服务”或“我们”）！本服务由 智会西湖云端论剑 团队提供。我们深知个人信息对您的重要性，并会尽全力保护您的个人信息安全可靠。我们致力于维持您对我们的信任，恪守以下原则，保护您的个人信息：权责一致原则、目的明确原则、选择同意原则、最小必要原则、确保安全原则、主体参与原则、公开透明原则等。</p>
            <p>本《隐私政策》（以下简称“本政策”）旨在帮助您了解我们会收集哪些个人信息、为什么收集这些信息、会利用这些信息做什么以及我们如何保护这些信息。请您在使用本服务前，仔细阅读并充分理解本政策各条款内容，特别是以粗体标识的条款，您应重点阅读，在确认充分理解并同意后再开始使用。如果您不同意本政策的内容，将可能导致本服务无法正常运行，或者无法达到我们拟达到的服务效果，您应立即停止访问/使用本服务。</p>
            <p>本政策将帮助您了解以下内容：</p>
            <ul>
              <li>一、我们如何收集和使用您的个人信息</li>
              <li>二、我们如何使用 Cookie 和同类技术</li>
              <li>三、我们如何共享、转让、公开披露您的个人信息</li>
              <li>四、我们如何存储和保护您的个人信息</li>
              <li>五、您管理个人信息的权利</li>
              <li>六、我们如何处理未成年人的个人信息</li>
              <li>七、本政策如何更新</li>
              <li>八、如何联系我们</li>
            </ul>

            <h2>一、我们如何收集和使用您的个人信息</h2>
            <p>个人信息是指以电子或者其他方式记录的与已识别或者可识别的自然人有关的各种信息，不包括匿名化处理后的信息。敏感个人信息是指一旦泄露或者非法使用，容易导致自然人的人格尊严受到侵害或者人身、财产安全受到危害的个人信息，<strong>例如：个人生物识别信息（声纹用于区分发言人时）、会议音视频内容、精确地理位置信息等。</strong></p>
            <p>我们会遵循正当、合法、必要的原则，出于本政策所述的以下目的，收集和使用您在使用服务过程中主动提供或因使用服务而产生的个人信息。如果我们要将您的个人信息用于本政策未载明的其它用途，或基于特定目的将收集而来的信息用于其他目的，我们将以合理的方式向您告知，并在使用前再次征得您的同意。</p>

            <h3>(一) 您需要授权我们收集和使用的个人信息</h3>
            <p>为实现向您提供本服务的基本功能，您须授权我们收集、使用的必要信息。如您拒绝提供相应信息，您将无法正常使用核心服务。</p>
            <ol>
              <li>
                <strong>账号注册与登录：</strong>
                <ul>
                  <li>当您使用邮箱注册 智会西湖云端论剑 账号时，您需要提供您的<strong>电子邮箱地址</strong>，并创建<strong>密码（加密存储）</strong>。我们收集这些信息是为了帮助您完成注册，确保账号安全，并识别用户身份。</li>
                  <li>您也可以选择使用第三方账号（如 <strong>Google</strong>）登录，在此情况下，我们会根据您的授权从第三方平台获取您的<strong>唯一标识符、昵称、头像</strong>等信息，用于快捷登录和身份识别。</li>
                  <li>为完善您的个人资料，您可能需要进一步提供<strong>姓名（或昵称）、头像URL、工作地点</strong>等信息。这些信息将用于在应用内展示您的身份，方便其他用户识别。</li>
                </ul>
              </li>
              <li>
                <strong>基础会议功能：</strong>
                <ul>
                  <li>当您创建或预约会议时，需要提供<strong>会议主题、会议密码（可选）、开始时间、结束时间</strong>。这些信息用于定义和安排会议。系统会为您生成唯一的<strong>会议ID</strong>。</li>
                  <li>为实现视频会议功能，本服务使用 <strong>Zoom Video SDK for Web</strong>。当您加入会议时，我们需要收集您的<strong>用户名（或邮箱）</strong>以在会议中标识您。会议期间，我们会处理您的<strong>音视频流</strong>，以实现通话、屏幕共享功能。我们会记录您的<strong>加入/离开时间、在线状态、角色（主持人/参与者）</strong>，并可能记录您的<strong>设备信息</strong>（用于问题排查和兼容性适配）。</li>
                  <li>为了提供聊天功能，我们会收集您在会议中发送的<strong>文本消息内容、发送时间、发送者和接收者信息</strong>。如果您传输文件，我们会收集<strong>文件本身、文件名、大小</strong>以及您的<strong>上传/下载状态和次数</strong>。</li>
                </ul>
              </li>
              <li>
                <strong>智能会议记录与分析：</strong>
                <ul>
                  <li>如果您启用会议录制或转录功能，我们会收集会议的<strong>音频流</strong>。音频流会实时传输至后端，通过语音识别服务（如 FunASR）处理生成带时间戳和发言人标识的<strong>文字记录 (transcriptionHistory)</strong>。这些记录会与对应的会议关联存储。</li>
                  <li>基于生成的文字记录，AI 分析功能（可能使用 讯飞星火、DeepSeek 或其他大语言模型）会处理这些<strong>文本内容</strong>，以提供文本优化、提取关键词、生成各类摘要（分段摘要、总摘要）、识别待办事项和扩展讨论点、绘制词云图等服务。</li>
                </ul>
              </li>
              <li>
                <strong>实时语言转录和翻译：</strong>
                <ul>
                  <li>如果您启用翻译功能，系统会使用已有的转录文本，调用机器翻译服务（如阿里云机器翻译）将<strong>源语言文本</strong>翻译成您选择的<strong>目标语言文本</strong>，并以字幕形式展示。此过程涉及转录文本和语言偏好的处理。</li>
                </ul>
              </li>
              <li>
                <strong>AI 助手功能（会议创建、文档助手、聊天问答）：</strong>
                <ul>
                  <li>当您使用 AI 创建会议时，我们会收集您的<strong>自然语言指令</strong>，并通过 AI 模型解析以提取会议信息。</li>
                  <li>当您使用 AI 文档助手时，您需要上传<strong>文档文件（PDF, Word）</strong>，我们会收集<strong>文件内容</strong>，并通过 AI 模型进行润色、检查或生成摘要。我们会记录您上传的<strong>文件名、类型、大小、上传日期</strong>。</li>
                  <li>当您在 AI 聊天窗口提问或进行交互时，我们会收集您的<strong>提问内容（文本或可能包含上传的文件信息）</strong>，并通过 AI 模型生成回答。</li>
                </ul>
              </li>
               <li>
                <strong>会议数据管理与分析：</strong>
                <ul>
                   <li>系统会自动汇总您的<strong>参会历史记录</strong>（会议ID、名称、时间、状态等）。</li>
                   <li>为了进行参会者行为分析和计算参与度，我们会收集您在会议中的一系列行为数据，包括<strong>参会时长、视频开启时长、音频开启时长、屏幕共享时长、发言时长（基于转录记录）、聊天消息发送数量、文件上传/下载次数</strong>等。部分数据（如发言内容）可能用于结合语义分析（如使用 Sentence-BERT 计算与主题相关性）来评估认知参与度。</li>
                   <li>我们会统计您的<strong>最近会议数量</strong>和<strong>会议时长分布</strong>，以图表形式展示。</li>
                </ul>
               </li>
               <li>
                 <strong>活动管理（如适用）：</strong>
                 <ul>
                   <li>如果您使用日历或待办事项功能记录活动，我们会收集您输入的<strong>活动日期、描述、类型</strong>等信息（activities 集合）。</li>
                 </ul>
               </li>
            </ol>

            <h3>(二) 您可选择是否授权我们收集和使用的个人信息</h3>
            <p>为提升您的使用体验，我们的一些扩展功能可能会收集和使用您的个人信息。您可以选择不开启这些功能或在设置中关闭，这不会影响您使用基本功能。</p>
            <ol>
              <li>
                <strong>用户状态显示：</strong>您可以选择设置并向他人展示您的在线状态（如在线、离线、忙碌）。
              </li>
              <li>
                <strong>个性化推荐：</strong>我们可能基于您的历史参会记录（如主题、参与的会议类型）向您推荐可能感兴趣的会议或功能。您可以选择关闭此功能。
              </li>
              <li>
                <strong>用户反馈：</strong>当您联系客服或提交反馈时，我们可能会收集您的<strong>联系方式（如邮箱）和反馈内容</strong>，以便与您沟通和改进服务。
              </li>
            </ol>

            <h3>(三) 设备权限调用</h3>
            <p>在提供服务的过程中，为实现音视频通话、文件上传下载等功能，我们可能需要您开启一些设备访问权限：</p>
            <ul>
              <li><strong>摄像头权限：</strong>用于在视频会议中采集您的视频画面。</li>
              <li><strong>麦克风权限：</strong>用于在会议中采集您的语音，进行通话、录制和语音转录。</li>
              <li><strong>存储权限（读/写）：</strong>用于读取您选择上传的文件，或将下载的文件、录制的音视频（如果本地录制）、缓存数据等写入您的设备。</li>
              <li><strong>网络访问权限：</strong>服务运行所必需，用于与服务器通信、传输数据。</li>
            </ul>
            <p>您可以在设备的设置中随时管理这些权限。请注意，关闭必要权限可能会导致相关功能无法正常使用。</p>

            <h3>(四) 收集和使用个人信息的例外</h3>
             <p>根据相关法律法规规定，在以下情形中，我们可能会依法收集并使用您的个人信息无需征得您的授权同意：</p>
            <ol>
              <li>与我们履行法律法规规定的义务相关的；</li>
              <li>与国家安全、国防安全直接相关的；</li>
              <li>与公共安全、公共卫生、重大公共利益直接相关的；</li>
              <li>与刑事侦查、起诉、审判和判决执行等直接相关的；</li>
              <li>出于维护您或其他个人的生命、财产等重大合法权益但又很难得到本人同意的；</li>
              <li>您自行向社会公众公开的个人信息；</li>
              <li>从合法公开披露的信息中收集个人信息的，如合法的新闻报道、政府信息公开等渠道；</li>
              <li>根据与您签订和履行相关协议或其他书面文件所必需的；</li>
              <li>用于维护所提供的产品或服务的安全稳定运行所必需的，例如发现、处置产品或服务的故障；</li>
              <li>法律法规规定的其他情形。</li>
            </ol>

            <h2>二、我们如何使用 Cookie 和同类技术</h2>
             <p>为确保网站正常运转、为您获得更轻松的访问体验，我们会在您的计算机或移动设备上存储名为 Cookie 的小数据文件。Cookie 通常包含标识符、站点名称以及一些号码和字符。借助于 Cookie，网站能够存储您的偏好或登录状态等数据。</p>
            <p>我们不会将 Cookie 用于本政策所述目的之外的任何用途。您可根据自己的偏好管理或删除 Cookie。您可以清除计算机上保存的所有 Cookie，大部分网络浏览器都设有阻止 Cookie 的功能。但如果您这么做，则可能需要在每一次访问我们的网站时亲自更改用户设置。</p>

            <h2>三、我们如何共享、转让、公开披露您的个人信息</h2>
            <h3>(一) 共享</h3>
            <p>我们不会与 智会西湖云端论剑 服务提供者以外的公司、组织和个人共享您的个人信息，但以下情况除外：</p>
            <ol>
              <li><strong>在获取明确同意的情况下共享：</strong>获得您的明确同意后，我们会与其他方共享您的个人信息。</li>
              <li><strong>为实现核心功能所必需的共享：</strong>为了提供您所使用的服务，我们可能需要与第三方合作伙伴共享您的部分个人信息。我们会对共享行为进行审慎评估，并要求合作伙伴采取严格的数据保护措施。主要的共享情况包括：
                  <ul>
                      <li><strong>视频会议服务：</strong>我们会与 <strong>Zoom (通过其Video SDK)</strong> 共享必要的会议信息（如会议ID、参会者标识）和<strong>音视频流</strong>，以实现视频会议功能。</li>
                      <li><strong>用户认证服务：</strong>如果您选择 <strong>Google</strong> 登录，我们会与其共享必要信息以完成身份验证。用户认证和数据库服务由 <strong>Firebase (Google Cloud Platform)</strong> 提供，我们会与其共享账号信息（如邮箱，加密密码）和应用数据。</li>
                      <li><strong>AI 处理服务：</strong>语音转录、文本分析、机器翻译、AI问答等功能可能需要将相关的<strong>音频数据、文本内容、用户指令、上传的文档内容</strong>共享给 AI 服务提供商（如 <strong>FunASR、阿里云机器翻译、讯飞星火、DeepSeek 或其他类似模型服务商</strong>）。我们仅共享处理所需的最少信息，并要求服务商对数据保密。</li>
                      <li><strong>应用托管与部署服务：</strong>我们的前后端应用部署在云平台（如 <strong>Render</strong>），平台可能会收集必要的运行日志和性能数据以保障服务稳定。</li>
                  </ul>
              </li>
              <li><strong>在法定情形下的共享：</strong>我们可能会根据法律法规规定、诉讼争议解决需要，或按行政、司法机关依法提出的要求，对外共享您的个人信息。</li>
            </ol>
            <p>对我们与之共享个人信息的公司、组织和个人，我们会与其签署严格的数据处理协议，要求他们按照我们的说明、本政策以及其他任何相关的保密和安全措施来处理个人信息。</p>
            <h3>(二) 转让</h3>
            <p>我们不会将您的个人信息转让给任何公司、组织和个人，但以下情况除外：</p>
            <ol>
              <li>在获取明确同意的情况下转让。</li>
              <li>在涉及合并、收购或破产清算情形，或其他涉及合并、收购或破产清算情形时，如涉及到个人信息转让，我们会要求新的持有您个人信息的公司、组织继续受本政策的约束，否则我们将要求该公司、组织和个人重新向您征求授权同意。</li>
            </ol>
            <h3>(三) 公开披露</h3>
            <p>我们仅会在以下情况下，公开披露您的个人信息：</p>
            <ol>
              <li>获得您明确同意或基于您的主动选择，我们可能会公开披露您的个人信息。</li>
              <li>基于法律法规、法律程序、诉讼或政府主管部门强制性要求的情况下，我们可能会公开披露您的个人信息。</li>
            </ol>
            <h3>(四) 共享、转让、公开披露个人信息时事先征得授权同意的例外</h3>
            <p>根据相关法律法规规定，在以下情形中，共享、转让、公开披露您的个人信息无需事先征得您的授权同意：</p>
            <ol>
                <li>与我们履行法律法规规定的义务相关的；</li>
                <li>与国家安全、国防安全直接相关的；</li>
                <li>与公共安全、公共卫生、重大公共利益直接相关的；</li>
                <li>与刑事侦查、起诉、审判和判决执行等直接相关的；</li>
                <li>出于维护您或其他个人的生命、财产等重大合法权益但又很难得到本人同意的；</li>
                <li>您自行向社会公众公开的个人信息；</li>
                <li>从合法公开披露的信息中收集个人信息的，如合法的新闻报道、政府信息公开等渠道。</li>
            </ol>

            <h2>四、我们如何存储和保护您的个人信息</h2>
            <h3>(一) 信息存储</h3>
            <ol>
              <li><strong>存储地点：</strong>我们在中华人民共和国境内运营中收集和产生的个人信息，原则上将存储在中国境内的数据中心（可能由 Firebase 等云服务商提供）。目前我们不涉及常态化的跨境数据传输，如未来业务需要将您的个人信息传输至境外，我们将严格遵守中国法律法规的要求，进行安全评估并另行征求您的授权同意。</li>
              <li><strong>存储期限：</strong>我们仅在为实现本政策所述目的所必需的期限内保留您的个人信息，除非法律法规有强制的留存要求。例如：您的账号信息将在您注销账户后删除或匿名化处理；会议记录、聊天记录等数据的具体保留期限将根据服务需要和法律规定确定，您也可以在系统中手动删除部分数据（如历史会议记录、上传的文件）。我们判断存储期限的标准包括：(1) 完成服务目的、维护记录的需要；(2) 保证服务安全和质量；(3) 您的同意；(4) 法律法规规定或监管要求。超过存储期限后，我们将对您的个人信息进行删除或匿名化处理。</li>
            </ol>
            <h3>(二) 信息保护</h3>
             <ol>
              <li>我们已采取符合业界标准的安全防护措施保护您的信息，防止数据遭到未经授权访问、公开披露、使用、修改、损坏或丢失。技术措施包括但不限于：使用 <strong>HTTPS</strong> 协议进行数据传输加密；对存储的敏感信息（如密码）进行<strong>加密处理</strong>；部署访问控制机制，确保只有授权人员才能访问个人信息；使用云服务商（如 <strong>Firebase, Render</strong>）提供的安全防护能力。</li>
              <li>我们建立了数据安全管理制度，明确了数据处理的操作规程，并定期对员工进行安全和隐私保护培训。</li>
              <li><strong>安全事件处置：</strong>若不幸发生个人信息安全事件，我们将按照法律法规的要求，及时向您告知基本情况、可能的影响、已采取的措施、您的风险防范建议、补救措施等，并上报监管部门。</li>
              <li>互联网环境并非绝对安全，请您务必妥善保管好您的账号密码，并警惕网络钓鱼、诈骗等风险。如发现账号异常，请立即联系我们。</li>
            </ol>

            <h2>五、您管理个人信息的权利</h2>
            <p>我们保障您对自己的个人信息行使以下权利：</p>
            <ol>
              <li><strong>访问和更正您的个人信息：</strong>您有权访问您的账号信息（如邮箱、昵称、头像等）。您可以通过应用的“设置”或“个人中心”（如有）或联系我们（见第八条）来访问和更正您的部分信息。对于其他信息，您可以联系我们请求访问或更正。</li>
              <li><strong>删除您的个人信息：</strong>在符合法律法规规定的情形下（如处理目的已实现、您撤回同意、账号已注销等），您可以请求删除您的个人信息。例如，您可以删除您上传的文件、历史会议记录（具体操作方式请参考应用内指引或联系我们）。</li>
              <li><strong>改变您授权同意的范围：</strong>您可以随时通过设备的系统设置管理您授予的设备权限（如摄像头、麦克风）。对于个性化推荐等可选功能，您可以在应用设置中关闭。</li>
              <li><strong>注销账户：</strong>您可以通过 [请说明用户注销账户的方式，例如：在‘设置’页面提供注销入口，或联系我们] 申请注销您的账号。注销后，我们将停止为您提供服务，并按法律规定删除或匿名化您的个人信息。</li>
              <li><strong>获取个人信息副本：</strong>您有权获取您的个人信息副本，可以通过联系我们提出请求。</li>
              <li><strong>响应您的上述请求：</strong>为保障安全，您可能需要提供书面请求，或以其他方式证明您的身份。我们可能会先要求您验证自己的身份，然后再处理您的请求。我们将在十五个工作日内做出答复。如您不满意，还可以通过[您的联系邮箱]进行投诉。对于您合理的请求，我们原则上不收取费用，但对多次重复、超出合理限度的请求，我们将视情收取一定成本费用。对于那些无端重复、需要过多技术手段（例如，需要开发新系统或从根本上改变现行惯例）、给他人合法权益带来风险或者非常不切实际的请求，我们可能会予以拒绝。</li>
            </ol>

            <h2>六、我们如何处理未成年人的个人信息</h2>
            <p>我们的服务主要面向成人。我们不面向未满14周岁的儿童提供服务。若您是未成年人，请在您的父母或监护人指导下仔细阅读本政策，并在征得同意后使用本服务。对于经父母或监护人同意而收集未成年人个人信息的情况，我们只会在受到法律允许、父母或监护人明确同意或者保护未成年人所必要的情况下使用或公开披露此信息。</p>
            <p>如果我们发现在未事先获得可证实的父母或法定监护人同意的情况下收集了未成年人的个人信息，则会设法尽快删除相关数据。</p>


            <h2>七、本政策如何更新</h2>
             <p>我们可能会适时对本政策进行修订。当政策发生变更时，我们会通过应用内通知、网站公告或您提供的联系方式（如邮件）通知您。对于重大变更（如处理目的、方式、信息种类发生重大变化），我们会再次征求您的明确同意。</p>
             <p>本政策所指的重大变更包括但不限于：</p>
            <ol>
              <li>我们的服务模式发生重大变化。如处理个人信息的目的、处理的个人信息类型、个人信息的使用方式等；</li>
              <li>我们在控制权等方面发生重大变化。如并购重组等引起的所有者变更等；</li>
              <li>个人信息共享、转让或公开披露的主要对象发生变化；</li>
              <li>您参与个人信息处理方面的权利及其行使方式发生重大变化；</li>
              <li>我们负责处理个人信息安全的责任部门、联络方式及投诉渠道发生变化；</li>
              <li>个人信息安全影响评估报告表明存在高风险。</li>
            </ol>

            <h2>八、如何联系我们</h2>
            <p>如果您对本隐私政策有任何疑问、意见或建议，或者希望行使您的个人信息权利，请通过以下方式与我们（智会西湖云端论剑 团队）联系：</p>
            <p>电子邮箱：sky1470719422@gmail.com</p>
            <p>我们将尽快审核所涉问题，并在验证您的用户身份后的十五个工作日内予以回复。</p>
            <!-- 隐私政策内容结束 -->
          </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="privacyModalVisible = false">我已阅读并了解</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 用户服务协议弹窗 -->
    <el-dialog
      v-model="termsModalVisible"
      title="用户服务协议"
      width="80%"
      top="5vh"
      :append-to-body="true"
      custom-class="policy-dialog"
    >
    <div class="policy-content">
            <!-- 用户协议内容开始 -->
            <p class="update-date">最后更新日期：2024年5月 [请填写具体日期]</p>
            <p class="effective-date">生效日期：2024年5月 [请填写具体日期]</p>

            <h2>引言与接受</h2>
            <p>欢迎您使用 智会西湖云端论剑（AI Meeting）（以下简称“本服务”）！本服务由 智会西湖云端论剑 团队（以下简称“我们”）提供。</p>
            <p>本《用户服务协议》（以下简称“本协议”）是您（以下简称“用户”）与我们之间关于注册、登录、使用本服务的法律协议。<strong>请您务必审慎阅读、充分理解各条款内容，特别是免除或者限制责任的条款、法律适用和争议解决条款（可能以加粗方式提示）。</strong></p>
            <p><strong>您通过网络页面点击确认、勾选“同意”或实际使用本服务的行为，即表示您已仔细阅读、充分理解并完全接受本协议的全部内容，并同意作为本协议的一方当事人接受本协议以及未来更新版本的约束。如果您不同意本协议的任何内容，或者无法准确理解相关条款的解释，请不要进行后续操作或使用本服务。</strong></p>

            <h2>一、服务内容与形式</h2>
            <ol>
              <li>本服务是 智会西湖云端论剑 平台提供的一款 AI 会议助手 Web 应用，旨在利用人工智能技术提升会议效率和体验。主要功能包括：
                  <ul>
                      <li><strong>基础会议管理：</strong>会议创建、预约、通过链接邀请与加入、音视频通话、屏幕共享、实时聊天、文件传输。</li>
                      <li><strong>智能会议记录分析：</strong>会议发言实时记录（语音转文字）、会议内容优化、关键词提取、生成各类摘要、绘制词云图。</li>
                      <li><strong>AI 助手：</strong>通过自然语言指令创建会议、对上传的文档进行 AI 处理（润色、检查、摘要等）、提供 AI 聊天问答。</li>
                      <li><strong>会议数据管理：</strong>查看历史会议记录、自动生成参会者数据统计（进出时间、时长等）、分析参会者行为与计算参与度、展示最近会议统计图表、支持数据导出（Excel/Word/CSV）。</li>
                      <li><strong>语言转录和翻译：</strong>实时语音转录，并将转录文本实时翻译成目标语言（以字幕形式显示）。</li>
                      <li><strong>文件管理：</strong>存储、搜索、下载、删除会议相关文件（PDF/Word），并支持对文件内容进行 AI 摘要。</li>
                      <li><strong>其他辅助功能：</strong>如日历待办事项管理、最近活动记录等。</li>
                  </ul>
                  （具体功能以实际提供的版本为准）。
              </li>
              <li>本服务通过 Web 浏览器提供，支持 PC、手机、平板等多种设备访问，采用响应式设计适配不同屏幕。</li>
              <li>我们有权根据业务发展需要，变更、增加、减少、中断或终止部分或全部服务内容，届时将尽可能提前以公告或通知等形式告知用户。</li>
              <li>使用本服务需要连接互联网，您需自行承担网络费用。部分高级功能或超出免费额度的使用可能需要付费，具体收费标准以届时公布为准。</li>
            </ol>

            <h2>二、账号注册与安全</h2>
            <ol>
              <li>您需要通过邮箱或支持的第三方账号（如 Google）注册并登录 智会西湖云端论剑 账号后方可使用本服务。您应保证注册信息的真实、准确、完整、合法有效，并及时更新。</li>
              <li><strong>您有责任妥善保管您的账号信息（包括邮箱、密码、第三方账号授权信息等）和登录设备。因您保管不善或主动泄露导致账号被盗用或密码遗失，责任由您自行承担。</strong></li>
              <li>您应对您账号下发生的所有活动承担法律责任。严禁将账号转让、出借、赠与或以其他方式许可他人使用。</li>
              <li>如发现账号异常或存在安全漏洞，应立即通知我们。</li>
            </ol>

            <h2>三、用户行为规范</h2>
            <p>您在使用本服务过程中，必须遵循国家相关法律法规及本协议约定，不得制作、复制、发布、传播含有下列内容的信息，或利用本服务从事相关行为：</p>
            <ol>
              <li>反对宪法所确定的基本原则的；</li>
              <li>危害国家安全，泄露国家秘密，颠覆国家政权，破坏国家统一的；</li>
              <li>损害国家荣誉和利益的；</li>
              <li>煽动民族仇恨、民族歧视，破坏民族团结的；</li>
              <li>破坏国家宗教政策，宣扬邪教和封建迷信的；</li>
              <li>散布谣言，扰乱社会秩序，破坏社会稳定的；</li>
              <li>散布淫秽、色情、赌博、暴力、凶杀、恐怖或者教唆犯罪的；</li>
              <li>侮辱或者诽谤他人，侵害他人名誉权、隐私权、知识产权等合法权益的；</li>
              <li><strong>侵害商业秘密的；</strong></li>
              <li><strong>在会议中未经其他参会者明确同意，擅自进行录音、录像、截屏或公开传播会议内容（尤其是涉及个人隐私或保密信息的）；</strong></li>
              <li><strong>利用 AI 功能生成、传播虚假有害信息、侵权内容，或用于欺诈、侵犯他人权益等非法目的；</strong></li>
              <li>上传、传播病毒、木马等恶意代码；</li>
              <li>对本服务进行反向工程、反编译、破解等；</li>
              <li>干扰或破坏本服务正常运行或网络安全；</li>
              <li>未经授权访问他人账号或数据；</li>
              <li>其他违反法律法规、公序良俗、社会公德或侵犯他人合法权益的行为。</li>
            </ol>
            <p><strong>我们有权对您使用本服务的行为及信息进行审查、监督。如我们发现或收到举报您存在违法违规行为，我们有权独立判断并采取警告、限制功能、删除内容、暂停服务、封禁账号直至终止协议等措施，并保留追究法律责任的权利。您应自行承担由此产生的一切法律后果。</strong></p>

            <h2>四、知识产权</h2>
            <ol>
              <li>我们是本服务及其相关内容（软件、技术、设计、文本、图像等，用户上传内容除外）的知识产权权利人。</li>
              <li>您在使用本服务过程中上传或产生的内容（如上传的文件、您主动输入的文本、您发言产生的转录文本等，“用户内容”），其知识产权归您或原始权利人所有。</li>
              <li><strong>为了向您提供存储、展示、转录、翻译、分析、生成摘要等服务，您在此授予我们一项全球范围内、免费、非独家、可再许可的权利（许可），允许我们根据服务功能需要，对您的用户内容进行使用、复制、存储、处理、修改、改编、翻译、分发（例如在会议中共享文件给其他参会者）、公开展示（例如在您的个人历史记录中展示）等操作。此授权仅限于提供、维护和改进本服务所必需的范围。</strong></li>
              <li><strong>请注意：由 AI 模型根据您的指令或输入生成的内容（如摘要、优化文本、翻译结果、AI 回答等），其知识产权归属和使用可能受到相关 AI 服务提供商的条款约束，且您应对使用这些生成内容的方式和后果负责。</strong></li>
              <li>我们尊重并保护知识产权。如您认为本服务侵犯了您的合法权益，请通过第八条联系我们。</li>
            </ol>

            <h2>五、第三方服务与链接</h2>
            <ol>
              <li>本服务集成了或可能链接至第三方提供的服务或资源，例如 <strong>Zoom Video SDK、Google 登录、Firebase 服务、Render 托管、AI 模型服务（如 FunASR、阿里云翻译、讯飞、DeepSeek 等）</strong>。</li>
              <li>这些第三方服务由对应第三方独立运营并承担责任。您在使用这些服务前应仔细阅读并遵守其服务协议和隐私政策。</li>
              <li><strong>我们不对任何第三方服务的内容、功能、安全、隐私或合规性作任何保证，也不承担任何直接或间接责任。您与第三方之间的互动或交易，由您自行负责。</strong></li>
            </ol>

            <h2>六、免责声明与责任限制</h2>
            <ol>
              <li><strong>本服务按“现状”和“可用”状态提供。我们不作任何明示或暗示的保证，包括但不限于服务的适销性、特定用途适用性、不侵权、不中断、及时性、安全性、准确性或无错误。</strong></li>
              <li><strong>您理解并同意，本服务提供的语音识别、机器翻译、AI 分析、内容生成（摘要、关键词、优化文本、参与度评分等）结果可能因技术限制、数据偏差、模型能力等因素存在误差或不准确，仅供您参考。您不应将这些结果作为唯一决策依据，并需自行判断其可靠性和适用性。我们不对因依赖这些结果造成的任何损失负责。</strong></li>
              <li>对于因不可抗力、第三方服务故障、黑客攻击、系统维护、网络中断、用户操作不当等非我们可控原因导致的服务中断或用户损失，我们在法律允许范围内不承担责任，但会尽力协助恢复服务和减少损失。</li>
              <li><strong>在任何情况下，我们及关联方对因本协议或使用本服务引起的任何间接性、后果性、惩罚性、偶然性、特殊性或刑罚性的损害，均不承担责任。</strong></li>
              <li><strong>在法律允许的最大范围内，我们对您的全部责任，无论何种原因或行为方式，累计不超过您在过去十二个月内因使用本服务而向我们支付的费用总额（如有），或人民币一百元（￥100）（以较高者为准）。</strong></li>
            </ol>

            <h2>七、协议的终止</h2>
            <ol>
              <li>您可随时停止使用本服务或通过我们提供的途径注销账号以终止本协议。</li>
              <li>若您违反本协议约定，或存在其他我们认为不适宜继续提供服务的情形，我们有权随时暂停、中断或终止向您提供部分或全部服务，并可能注销您的账号，无需承担责任。</li>
              <li>协议终止后，您将无法继续访问和使用本服务，我们没有义务保留或返还您的数据（法律法规另有规定的除外）。您授予的许可在终止后可能在合理范围内继续有效（例如为履行法律义务或解决争议）。</li>
            </ol>

            <h2>八、法律适用与争议解决</h2>
            <ol>
              <li>本协议的订立、效力、解释、履行及争议解决均适用中华人民共和国大陆地区法律。</li>
              <li>因本协议产生的任何争议，双方应友好协商解决；协商不成的，任何一方有权将争议提交至<strong>我们所在地</strong>有管辖权的人民法院诉讼解决。</li>
            </ol>

            <h2>九、协议的更新与通知</h2>
            <ol>
              <li>我们有权根据需要不时修订本协议，并通过应用内公告、页面提示、电子邮件等方式通知您。修订后的协议一经公布即生效。</li>
              <li><strong>您在协议更新后继续使用本服务的行为，视为您已接受修订后的协议。</strong>如您不同意，请立即停止使用。</li>
              <li>我们可能通过应用内消息、邮件等方式向您发送服务相关的通知。</li>
            </ol>

             <h2>十、联系我们</h2>
            <p>如果您对本协议内容有任何疑问、意见或建议，请通过以下方式与我们（智会西湖云端论剑 团队）联系：</p>
            <p>电子邮箱：sky1470719422@gmail.com</p>
            <!-- 用户协议内容结束 -->
          </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="termsModalVisible = false">我已阅读并同意</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import AuthService from '@/services/AuthService.js';
import { useRouter } from 'vue-router';
import { ElNotification,ElDialog, ElButton} from 'element-plus';

export default {
  name: 'Login',
  setup() {
    const email = ref('');
    const password = ref('');
    const isLoginMode = ref(true);
    const showPassword = ref(false);
    const router = useRouter();
    const isSubmitting = ref(false);
    const isMobile = ref(false); // 新增：是否为移动设备
    const privacyAccepted = ref(false); // <--- 新增：追踪隐私政策同意状态
    const privacyModalVisible = ref(false); // <--- 新增：隐私政策弹窗可见性
    const termsModalVisible = ref(false);   // <--- 新增：用户协议弹窗可见性
       // 检查是否是移动设备的函数
    const checkIfMobile = () => {
      isMobile.value = window.innerWidth <= 768;
       console.log("isMobile.value:", isMobile.value);
    };
    // 新增：显示隐私政策弹窗的方法
    const showPrivacyModal = () => {
      privacyModalVisible.value = true;
    };

    // 新增：显示用户协议弹窗的方法
    const showTermsModal = () => {
      termsModalVisible.value = true;
    };

    // 切换模式（登录/注册）
    const toggleMode = () => {
      isLoginMode.value = !isLoginMode.value;
      email.value = '';
      password.value = '';
      privacyAccepted.value = false; // <--- 切换模式时重置同意状态
    };

    // 切换密码可见性
    const toggleShow = () => {
      showPassword.value = !showPassword.value;
    };

    // SVG 路径 (闭眼)
    const closedEyePath = "M12 15C15.3137 15 18 12.3137 18 9C18 5.68629 15.3137 3 12 3C8.68629 3 6 5.68629 6 9C6 12.3137 8.68629 15 12 15ZM12 15C9.64749 15 7.58732 13.8299 6.17513 12C7.58732 10.1701 9.64749 9 12 9C14.3525 9 16.4127 10.1701 17.8249 12C16.4127 13.8299 14.3525 15 12 15ZM1 9C1.97275 6.35728 3.35523 4.31419 5.74658 3.34173C8.63918 2.19982 12 2.25 12 2.25C12 2.25 15.3608 2.19982 18.2534 3.34173C20.6448 4.31419 22.0273 6.35728 23 9C21.938 11.8752 20.3538 14.0947 18.2534 15.6583C15.3608 16.8002 12 16.75 12 16.75C12 16.75 8.63918 16.8002 5.74658 15.6583C3.64621 14.0947 2.06204 11.8752 1 9Z";
    // SVG 路径 (睁眼)
    const openEyePath = "M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12ZM12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9Z";

    // 验证邮箱格式
    const isValidEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    // 计算表单是否有效
    const isFormValid = computed(() => {
      const baseValid = isValidEmail(email.value) && password.value.length >= 8;
      if (!isLoginMode.value) { // 注册模式下
        return baseValid && privacyAccepted.value; // <--- 必须同时满足基础校验和同意隐私政策
      }
      return baseValid; // 登录模式下，只需基础校验
    });

    // 处理回车键
    const handleEnter = () => {
      if (isFormValid.value) {
        handleAuth();
      }
    };

    // 处理认证 (登录/注册)
    const handleAuth = async () => {
      if (!isFormValid.value) {
        return;
      }
      isSubmitting.value = true;

      let res;
      try {
        if (isLoginMode.value) {
          console.log("尝试登录:", email.value);
          res = await AuthService.signInWithEmailAndPassword(email.value, password.value);
        } else {
          console.log("尝试注册:", email.value);
          res = await AuthService.registerWithEmailAndPassword(email.value, password.value);
        }
      } finally {
        isSubmitting.value = false;
      }

      if (res) {
        document.body.classList.add('light');
        ElNotification({
          title: '成功',
          message: isLoginMode.value ? "登录成功" : "注册成功",
          type: 'success'
        });
        router.push('/home');
      } else {
        let errorMessage = '操作失败，请重试。';
        if (!isLoginMode.value) {
          errorMessage = "注册失败，该邮箱可能已经被注册，请更换邮箱或直接登录。"
        }
        ElNotification({ title: '错误', message: errorMessage, type: 'error' });
      }
    };

    // 使用 Google 登录
    const loginWithGoogle = async () => {
      isSubmitting.value = true;
      const res = await AuthService.signInWithGoogle();
      isSubmitting.value = false;

      if (res) {
        ElNotification({ title: '成功', message: 'Google 登录成功', type: 'success' });
        document.body.classList.add('light');
        router.push('/home');
      } else {
        ElNotification({ title: '错误', message: 'Google 登录失败', type: 'error' });
      }
    };

    onMounted(() => {
      checkIfMobile(); // 组件挂载时检查
      window.addEventListener('resize', checkIfMobile); // 监听窗口大小变化
    });

    onUnmounted(() => {
      window.removeEventListener('resize', checkIfMobile); // 组件卸载时移除监听
    });
    return {
      email,
      password,
      isLoginMode,
      showPassword,
      closedEyePath,
      openEyePath,
      router,
      toggleMode,
      toggleShow,
      handleAuth,
      loginWithGoogle,
      isValidEmail,
      isFormValid,
      handleEnter,
      isSubmitting,
      isMobile,
      privacyAccepted,
      privacyModalVisible, 
      termsModalVisible,   
      showPrivacyModal,   
      showTermsModal,     
    };
  },
};
</script>

<style scoped>
/* 关键动画 */
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

@keyframes subtle-slide {
  0% { transform: translateX(50px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}

.animate-subtle-slide {
  animation: subtle-slide 1.5s ease-out forwards;
}

/* 整体布局 */
.login-wrapper {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #F3FCF9 0%, #C8E7F9 100%);
}

/* 登录区域 */
.login-section {
  flex: 1 0 50%; /* 占据一半宽度，允许收缩 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 3rem 2rem;
  background-color: white;
  border-radius: 1.5rem;
  box-shadow: 0 10px 25px rgba(92, 99, 105, .2);
  margin: 2rem;
    max-width: 500px; /* 添加最大宽度限制 */
  box-sizing: border-box; /* 包含 padding 和 border */
}

.brand-area {
  text-align: center;
  margin-bottom: 2rem;
}

.title {
  font-size: 2.5rem; /* 调整标题大小 */
  font-weight: 800;
  color: #2c3e50;
  letter-spacing: 0.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}


.title-icon {
  margin-right: 0.5rem;
  font-size: 3rem; /* 图标大小 */
}

.subtitle {
  font-size: 1.25rem; /* 副标题大小 */
  font-weight: 600;
  background: var(--text-gradient); /* 1. 应用渐变作为背景 */
  -webkit-background-clip: text;    /* 2. (兼容性) 将背景裁剪到文字形状 */
  background-clip: text;            /* 2. (标准) 将背景裁剪到文字形状 */
  -webkit-text-fill-color: transparent; /* 3. (兼容性) 使文字填充色透明，显示背景 */
  color: transparent;  
  margin-top: 0.5rem;
}

.welcome-text {
  font-size: 1rem;
  font-weight: 500;
  color: #7f8c8d;
  margin-top: 0.5rem;
}
/* 隐私政策样式 */
.privacy-consent {
  display: flex;
  align-items: center; /* 垂直居中对齐复选框和文字 */
  margin-bottom: 1rem; /* 与下方按钮的间距 */
  margin-top: 0.5rem;  /* 与上方输入框的间距 */
}

.privacy-checkbox {
  width: 1rem;       /* 复选框大小 */
  height: 1rem;      /* 复选框大小 */
  margin-right: 0.5rem; /* 复选框与文字的间距 */
  accent-color: #3498db; /* 改变勾选时的颜色以匹配主题色（现代浏览器支持） */
  cursor: pointer;
  appearance: none; /* 移除默认样式以便自定义 */
  border: 1px solid #ced4da; /* 边框 */
  border-radius: 0.2rem; /* 轻微圆角 */
  position: relative; /* 用于定位伪元素 */
  vertical-align: middle; /* 尝试进一步垂直对齐 */
  top: -1px; /* 微调垂直位置 */
}

/* 自定义复选框勾选后的样式 */
.privacy-checkbox:checked {
  background-color: #3498db;
  border-color: #3498db;
}

/* 添加勾号 */
.privacy-checkbox:checked::before {
  content: '✓'; /* Unicode 勾号 */
  font-size: 0.8rem;
  color: white;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: bold;
}


.privacy-label {
  font-size: 0.8rem; /* 标签文字大小 */
  color: #555;       /* 标签文字颜色 */
  line-height: 1.4;
  cursor: pointer;   /* 让文字也可点击 */
}

.privacy-link {
  color: #3498db;    /* 链接颜色 */
  text-decoration: none; /* 去掉下划线 */
  font-weight: 500;
  transition: color 0.2s;
}

.privacy-link:hover {
  color: #2980b9;    /* 悬停时链接颜色变深 */
  text-decoration: underline; /* 悬停时显示下划线 */
}

/* 调整按钮区域的上边距，为隐私政策留出空间 */
.button-section {
  /* margin-top: 1rem; */ /* 可能需要根据实际效果调整或移除原有的 */
}
/* 弹窗内部内容样式 */
.policy-content {
  max-height: 70vh; /* 限制内容最大高度，超出则滚动 */
  overflow-y: auto;  /* 允许垂直滚动 */
  padding: 0 20px;   /* 内容区域左右内边距 */
  line-height: 1.8;
  font-size: 0.9rem;
  color: #333;
}

/* 沿用之前的 policy/agreement 页面样式 (适用于弹窗内部) */
.policy-content h1,  /* 弹窗内可能没有 h1，主要是 h2, h3, p, ul, ol */
.policy-content h2,
.policy-content h3 {
  color: #2c3e50;
  margin-top: 1.5rem;
  margin-bottom: 0.8rem;
}
.policy-content h2 {
    font-size: 1.3rem;
    color: #3498db;
    border-bottom: 1px solid #ecf0f1;
    padding-bottom: 0.3rem;
}
.policy-content h3 {
    font-size: 1.1rem;
}

.policy-content p,
.policy-content ul,
.policy-content ol {
  margin-bottom: 1rem;
}

.policy-content ul,
.policy-content ol {
  padding-left: 1.5rem; /* 列表缩进 */
}

.policy-content li {
  margin-bottom: 0.5rem;
}

.policy-content strong {
  font-weight: bold;
  color: #e74c3c; /* 强调重要内容 */
}

.policy-content .update-date,
.policy-content .effective-date {
  text-align: center;
  font-size: 0.8rem;
  color: #777;
  margin-bottom: 0.5rem;
}
.policy-content .effective-date {
    margin-bottom: 1.5rem;
}

/* 可以为弹窗本身添加一些自定义样式（如果需要） */
/* 注意：修改 Element Plus 组件内部样式可能需要使用深度选择器 :deep() 或移除 scoped */
/* 例如，如果想让标题居中 (但不推荐轻易修改库组件内部) */
/*
:deep(.policy-dialog .el-dialog__title) {
  text-align: center;
}
*/

/* 弹窗页脚样式 (如果需要) */
.dialog-footer {
  display: flex;
  justify-content: flex-end; /* 按钮靠右 */
}
/* 表单容器 */
.form-container {
  width: 100%;
}

/* 输入框组 */
.input-group {
  margin-bottom: 1.25rem; /* 减小间距 */
}

/* 标签 */
.label {
  display: block;
  font-size: 0.875rem; /* 标签字号 */
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 0.375rem; /* 减小间距 */
}

/* 输入框 */
.input {
  width: 100%;
  padding: 0.875rem; /* 调整内边距 */
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
  font-size: 0.875rem; /* 输入框字号 */
  color: #495057;
  background-color: #f8f9fa;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  box-sizing: border-box; /* 包含 padding */
}

.input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.25);
}

/* 密码相关 */
.password-container {
  position: relative;

}
.password-input {
   padding-right: 2.5rem;
}
.eye-icon {
  position: absolute;
  top: 50%;
  right: 0.75rem; /* 图标位置 */
  transform: translateY(-50%);
  cursor: pointer;
  color: #7f8c8d;
  transition: color 0.2s;
}

.eye-icon.active {
  color: #3498db;
}

.input-error {
  color: #e74c3c;
  font-size: 0.75rem; /* 错误提示字号 */
  margin-top: 0.25rem;
  display: block;
}

/* 按钮区域 */
.button-section {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: 1rem; /* 减小间距 */
}

/* 操作按钮 */
.action-button {
  width: 100%;
  padding: 0.875rem; /* 调整内边距 */
  background: linear-gradient(to right, #5398e1, #83d6c2);
  color: white;
  font-size: 1rem; /* 按钮字号 */
  font-weight: 600;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease;
  box-shadow: 0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.action-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(50, 50, 93, 0.15), 0 3px 6px rgba(0, 0, 0, 0.12);
}

.action-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  background: #bdc3c7;
  box-shadow: none;
  transform: none;
}

/* 加载动画 */
.loader {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
}

.loader::after {
  content: "";
  width: 24px; /* 调整大小 */
  height: 24px; /* 调整大小 */
  border: 3px solid #3498db; /* 调整粗细 */
  border-top: 3px solid transparent; /* 调整粗细 */
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 切换按钮 */
.toggle-button {
  background: none;
  border: none;
  color: #3498db;
  font-size: 0.875rem; /* 按钮字号 */
  font-weight: 500;
  cursor: pointer;
  margin-top: 0.625rem; /* 减小间距 */
  transition: color 0.2s;
}

.toggle-button:hover {
  color: #2980b9;
}

/* 社交登录 */
.social-login {
  text-align: center;
  margin-top: 1.5rem; /* 减小间距 */
}

.social-login-text {
  color: #7f8c8d;
  font-size: 0.875rem; /* 文字字号 */
  margin-bottom: 0.75rem; /* 减小间距 */
}

.social-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.25rem; /* 调整内边距 */
  background-color: white;
  color: #34495e;
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem; /* 按钮字号 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: background-color 0.2s, box-shadow 0.2s, transform 0.2s;
}

.social-button:hover {
  background-color: #f7f9fa;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: scale(1.03);
}

.social-icon {
  width: 1.5rem; /* 调整图标大小 */
  height: 1.5rem; /* 调整图标大小 */
  margin-right: 0.625rem; /* 调整间距 */
  vertical-align: middle;
}

.social-button-text {
  vertical-align: middle;
}

/* 介绍区域 */
.intro-section {
  flex: 1 0 50%; /* 占据一半宽度，允许收缩 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  /* border-left: 1px solid #ecf0f1; */
}

.intro-image {
    max-width: 80%;
    max-height: 70%;
    border-radius: 1rem;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    animation: float 5s ease-in-out infinite;
    background:#fff;
    border: solid #d7f3ff 10px;
}
.intro-text{
    text-align: center;
    margin-top: 1rem;
}
.intro-title{
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: .5rem;
    background: var(--text-gradient); /* 1. 应用渐变作为背景 */
  -webkit-background-clip: text;    /* 2. (兼容性) 将背景裁剪到文字形状 */
  background-clip: text;            /* 2. (标准) 将背景裁剪到文字形状 */
  -webkit-text-fill-color: transparent; /* 3. (兼容性) 使文字填充色透明，显示背景 */
  color: transparent;  
  margin-bottom: 20px;
}
.intro-description{
    font-size: .875;
    color:#7f8d8d;
}

/* 响应式设计 */
@media (max-width: 768px) {
   .login-wrapper {
        overflow-y: auto;  /* 添加滚动 */
        -webkit-overflow-scrolling: touch; /* iOS 平滑滚动 */
    }
  .login-section {
    flex: 1 1 100%; /* 移动端占满全宽 */
    margin: 1rem;
    padding: 1.5rem;
    border-radius: 1rem;
     max-width: none; /* 移除最大宽度限制 */
  }

  /* 隐藏介绍区域 */
  .intro-section {
    display: none;
  }
}
</style>
