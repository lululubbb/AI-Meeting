<template>
  <div class="reserve-container">
    <div id="reservation-form">
      <!-- Close Button -->
      <div v-if="route.name === 'ReserveMeeting'" class="close-btn-wrapper">
        <button @click="goHome" class="close-btn" aria-label="关闭">
          <img src="@/assets/exit.png" alt="退出" />
        </button>
      </div>
      <h1>预约会议</h1>

      <!-- Meeting Name -->
      <div class="input-group">
        <label for="sessionName">会议名称:</label>
        <input
          id="sessionName"
          v-model="config.sessionName"
          placeholder="请输入会议名称"
        />
      </div>

      <!-- User Name -->
      <div class="input-group">
        <label for="userName">用户名:</label>
        <input id="userName" v-model="config.userName" placeholder="请输入用户名"/>
      </div>

      <!-- Meeting Passcode (Optional) -->
      <div class="input-group">
        <label for="sessionPasscode">会议密码 (可选):</label>
        <input
          id="sessionPasscode"
          v-model="config.sessionPasscode"
          placeholder="请输入会议密码"
        />
      </div>

      <!-- Meeting Intro (Optional) -->
      <div class="input-group">
        <label for="sessionIntro">会议简介 (可选):</label>
        <input id="sessionIntro" v-model="config.sessionIntro" placeholder="请输入会议简介" />
      </div>

      <!-- Role Selection -->
      <div class="input-group">
        <label for="role">角色:</label>
        <select id="role" v-model="role">
          <option :value="1">主持人</option>
          <option :value="0">参与者</option>
        </select>
      </div>

      <!-- Meeting Time Selection (Conditional) -->
      <div class="input-group">
        <label for="meetingDateRange">选择会议时间:</label>

        <!-- PC: Element Plus Date Picker -->
        <el-date-picker
          v-if="!isMobile"
          v-model="meetingDateRange"
          type="datetimerange"
          :teleported="true"
          :editable="false"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          align="right"
          style="width: 100%;"
          :picker-options="elPickerOptions"
        />

        <!-- Mobile: Flatpickr Trigger -->
        <div v-else class="flatpickr-trigger" @click="openFlatpickr">
          {{ formattedFlatpickrDisplay || '请选择会议时间' }}
          <span class="arrow">▼</span>
        </div>
        <!-- Flatpickr will attach to a virtual input, no extra element needed here -->
      </div>

      <!-- Buttons -->
      <div class="button-container">
        <CustomButton text="复制会议邀请" @click="copyInvitationToClipboard" />
        <CustomButton :text="'预约会议'" @click="handleReservation" />
      </div>
    </div>
     <!-- Loading Indicator (Optional) -->
    <div v-if="isJoining" class="loading-overlay">
        <span>正在预约...</span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, inject, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import CustomButton from "../components/CustomButton.vue";
import { ElMessage, ElDatePicker } from "element-plus"; // Keep ElDatePicker for PC
import { useRoute, useRouter } from "vue-router";
import FirestoreService from "../services/FirestoreService.js";
import { useStore } from "vuex";

// === Import Flatpickr ===
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css'; // Base CSS
// Optional: Import language pack
// import { Mandarin } from 'flatpickr/dist/l10n/zh.js';
// Optional: Import theme CSS
// import 'flatpickr/dist/themes/material_blue.css';

const route = useRoute();
const router = useRouter();
const store = useStore();

// --- State Management ---
const isMobile = ref(false);
const meetingDateRange = ref([]); // Core state for selected dates [Date, Date] | []

const config = reactive({
  sessionName: "",
  userName: store.state.user?.name || store.state.user?.email || "",
  sessionPasscode: "",
  sessionIntro: "",
});

const role = ref(1); // 1 for host, 0 for participant
const isJoining = ref(false);

// --- Element Plus Options (for PC) ---
const elPickerOptions = {
  disabledDate(time) {
    // Disable dates before yesterday
    return time.getTime() < Date.now() - 86400000;
  },
};

// --- Flatpickr State (for Mobile) ---
const flatpickrInstance = ref(null);
let virtualInput = null; // To hold the temporary input element for flatpickr

// --- User Info ---
const userId = computed(() => store.getters.getUser?.uid);

// --- Computed Display Value for Mobile Trigger ---
const formattedFlatpickrDisplay = computed(() => {
  if (meetingDateRange.value && meetingDateRange.value.length === 2) {
    const [start, end] = meetingDateRange.value;
    if (start instanceof Date && !isNaN(start) && end instanceof Date && !isNaN(end)) {
      try {
        // Format like "YYYY/MM/DD HH:mm"
        const format = (d) =>
          `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ` +
          `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        return `${format(start)} 至 ${format(end)}`;
      } catch (e) {
        console.error("Date formatting error:", e);
        return "时间格式错误";
      }
    }
  }
  return ""; // Return empty string if no valid range is selected
});

// --- Device Detection ---
const checkMobile = () => {
  const mobileCheck = window.innerWidth < 768;
  if(isMobile.value !== mobileCheck) {
      isMobile.value = mobileCheck;
  }
};

// --- Flatpickr Initialization and Management ---
const initializeFlatpickr = () => {
  // Only initialize if on mobile and not already initialized
  if (!isMobile.value || flatpickrInstance.value) return;

  if (!virtualInput) {
      virtualInput = document.createElement('input');
      virtualInput.type = 'hidden'; // Keep it invisible
      document.body.appendChild(virtualInput); // Must be in DOM
  }

  // Get current selected range or null
  const currentSelection = (meetingDateRange.value && meetingDateRange.value.length === 2)
                           ? [...meetingDateRange.value]
                           : null;

  flatpickrInstance.value = flatpickr(virtualInput, {
    mode: "range",
    enableTime: true,
    dateFormat: "Y-m-d H:i", // Format flatpickr uses internally
    minuteIncrement: 1,      // Time selection granularity
    // locale: Mandarin,     // Enable Chinese language
    defaultDate: currentSelection, // Set initial selection
    minDate: new Date().fp_incr(-1), // Allow selection from yesterday onwards
    // allowInput: false,    // Prevent manual input into the (hidden) field
    // clickOpens: false,    // We will open it manually via the trigger div

    // IMPORTANT: Update Vue state when flatpickr closes
    onClose: (selectedDates, dateStr, instance) => {
      if (selectedDates.length === 2) {
        // Check if the value actually changed to prevent infinite loops with watchers
        const currentStartMs = meetingDateRange.value?.[0]?.getTime();
        const currentEndMs = meetingDateRange.value?.[1]?.getTime();
        const newStartMs = selectedDates[0].getTime();
        const newEndMs = selectedDates[1].getTime();

        if (currentStartMs !== newStartMs || currentEndMs !== newEndMs) {
          // CRITICAL: Assign a new array to trigger Vue's reactivity
          meetingDateRange.value = [...selectedDates];
          console.log("Meeting range updated from flatpickr:", meetingDateRange.value);
        }
      } else if (selectedDates.length === 0 && meetingDateRange.value?.length > 0) {
        // If user cleared the selection in flatpickr
        meetingDateRange.value = [];
        console.log("Meeting range cleared from flatpickr");
      }
    },
    // Optional: Do something when flatpickr is ready
    // onReady: (selectedDates, dateStr, instance) => {
    //   console.log('Flatpickr ready');
    // }
  });
  console.log("Flatpickr initialized.");
};

const destroyFlatpickr = () => {
  if (flatpickrInstance.value) {
    flatpickrInstance.value.destroy();
    flatpickrInstance.value = null;
    console.log("Flatpickr destroyed.");
  }
  // Clean up the virtual input
  if (virtualInput && virtualInput.parentNode) {
    virtualInput.parentNode.removeChild(virtualInput);
    virtualInput = null;
  }
};

// Method to open the flatpickr calendar, called by the trigger
const openFlatpickr = () => {
  if (flatpickrInstance.value) {
    flatpickrInstance.value.open();
  } else {
    console.warn("Flatpickr not initialized, attempting to initialize and open.");
    // Try to initialize immediately and open after next tick
    initializeFlatpickr();
    nextTick(() => {
      flatpickrInstance.value?.open();
    });
  }
};

// --- Lifecycle Hooks ---
onMounted(() => {
  checkMobile(); // Initial check
  window.addEventListener('resize', checkMobile);

  // Initialize flatpickr if starting on mobile view
  if (isMobile.value) {
      // Use nextTick to ensure DOM is fully ready? (Usually not needed for body append)
      initializeFlatpickr();
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile);
  // IMPORTANT: Clean up flatpickr instance and virtual input
  destroyFlatpickr();
});

// --- Watchers ---

// Watch for changes in mobile status to initialize/destroy flatpickr
watch(isMobile, (newVal, oldVal) => {
  if (newVal === oldVal) return; // No actual change

  if (newVal) {
    // Changed TO mobile: Initialize flatpickr (use nextTick just in case)
    nextTick(initializeFlatpickr);
  } else {
    // Changed TO desktop: Destroy flatpickr
    destroyFlatpickr();
  }
});

// Watch for external changes to meetingDateRange (e.g., from Element Plus picker)
// and update flatpickr accordingly if it exists.
watch(meetingDateRange, (newRange, oldRange) => {
  // Only update flatpickr if it's initialized (meaning we are on mobile)
  if (flatpickrInstance.value) {
    const currentFpDates = flatpickrInstance.value.selectedDates;
    const newStartMs = newRange?.[0]?.getTime();
    const newEndMs = newRange?.[1]?.getTime();
    const currentFpStartMs = currentFpDates?.[0]?.getTime();
    const currentFpEndMs = currentFpDates?.[1]?.getTime();

    // Check if an update is actually needed to prevent loops
    if (newRange?.length === 2) {
        if (currentFpDates?.length !== 2 || newStartMs !== currentFpStartMs || newEndMs !== currentFpEndMs) {
           console.log("Syncing meetingDateRange TO flatpickr:", newRange);
           flatpickrInstance.value.setDate(newRange, false); // `false` prevents triggering onClose
        }
    } else if (newRange?.length === 0 && currentFpDates?.length > 0) {
         console.log("Clearing flatpickr due to empty meetingDateRange");
         flatpickrInstance.value.clear(false); // `false` prevents triggering onClose
    }
  }
}, { deep: true }); // Deep watch needed for array changes


// --- Injected Services & Actions ---
const emitMeetingScheduled = inject("emitMeetingScheduled", () => { console.warn("emitMeetingScheduled not provided"); });

// --- Form Submission Logic ---
const handleReservation = async () => {
  // Validation
  if (!config.sessionName || !config.userName) { ElMessage.warning("请填写会议名称和用户名"); return; }
  if (!meetingDateRange.value || meetingDateRange.value.length !== 2) { ElMessage.warning("请选择完整的会议起止时间"); return; }

  const [startTime, endTime] = meetingDateRange.value;

  // More robust date validation
  if (!(startTime instanceof Date) || isNaN(startTime) || !(endTime instanceof Date) || isNaN(endTime)) {
    ElMessage.warning("选择的会议时间无效，请重新选择");
    meetingDateRange.value = []; // Clear invalid range
    return;
   }
  if (startTime.getTime() >= endTime.getTime()) { ElMessage.warning("结束时间必须晚于开始时间"); return; }
  if (!userId.value) { ElMessage.warning("用户未登录，无法预约"); return; }

  isJoining.value = true;
  try {
    // Prepare meeting data
    const meetingData = {
      hostName: config.userName,
      sessionName: config.sessionName,
      sessionPasscode: config.sessionPasscode || '', // Ensure empty string if blank
      sessionIntro: config.sessionIntro || '',   // Ensure empty string if blank
      startTime: startTime.toISOString(), // Use ISO format for backend/Firestore
      endTime: endTime.toISOString(),
      createdAt: new Date().toISOString(),
      status: "scheduled",
      userId: userId.value,
    };

    console.log("Submitting Meeting Data:", meetingData);

    const meetingId = await FirestoreService.addToMeetingHistory(userId.value, config.sessionName, meetingData);

    const todo = {
      text: `预约会议: ${config.sessionName}`,
      date: startTime.toISOString().split("T")[0], 
      isCompleted: false,
      meetingId: meetingId 
    };
    await FirestoreService.addTodoItem(userId.value, todo);

    ElMessage.success("已将会议添加至待办事项");
    emitMeetingScheduled({ ...meetingData, meetingId });
    ElMessage.success("预约成功!");
    goHome(); 

  } catch (error) {
    console.error("Reservation failed:", error);
    ElMessage.error(`预约失败: ${error.message || '请稍后重试'}`);
  } finally {
    isJoining.value = false
  }
};

const generateInvitationContent = () => {
    const userDisplay = config.userName || '主持人'; 
    let meetingTime = '(请先选择会议时间)';

    if (meetingDateRange.value && meetingDateRange.value.length === 2) {
      const [start, end] = meetingDateRange.value;
       if (start instanceof Date && !isNaN(start) && end instanceof Date && !isNaN(end)) {
          try {
            const format = (d) =>
              `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ` +
              `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
             meetingTime = `${format(start)} 至 ${format(end)}`;
          } catch (e) { /* Keep default '请选择...' */ }
       }
    }
    let meetingInfo = `用户 ${userDisplay} 向您发来一个会议邀请~\n会议名称: ${config.sessionName || '(未填写)'}\n会议时间: ${meetingTime}\n`;

    // 仅当密码存在时才添加密码行
    if (config.sessionPasscode) {
      meetingInfo += `\n会议密码: ${config.sessionPasscode}`;
    }

    if (config.sessionIntro) {
      meetingInfo += `\n会议简介: ${config.sessionIntro}`;
    }

    meetingInfo += '\n复制该文本打开“慧议”系统点击“加入会议”可直接入会！';
  return meetingInfo;
};

const copyInvitationToClipboard = async () => {
   // Require name and time before copying
   if (!config.sessionName) { ElMessage.warning("请填写会议名称后再复制"); return; }
   if (!meetingDateRange.value || meetingDateRange.value.length !== 2) { ElMessage.warning("请选择会议时间后再复制"); return; }

   const invitationContent = generateInvitationContent();
   try {
     // Use modern Clipboard API
     await navigator.clipboard.writeText(invitationContent);
     ElMessage.success("会议邀请已复制到剪贴板");
   } catch (err) {
     console.error('Clipboard copy failed:', err);
     // Fallback for older browsers/contexts might be needed here if required
     ElMessage.error(`复制失败: ${err.message || '无法访问剪贴板'}`);
   }
};

const goHome = () => {
  router.push("/home"); // Navigate to home route
};

</script>

<style scoped>
/* --- Base Styles --- */
.reserve-container { padding: 20px; width: 100%; max-width: 900px; min-height: 80vh; margin: 50px auto; position: relative; overflow-y: auto; background-color: var(--background-color, #f4f7f6); box-sizing: border-box; }
#reservation-form { background-color: var(--surface-color, #fff); padding: 30px; text-align: center; box-shadow: var(--global-box-shadow, 0 4px 12px rgba(0,0,0,0.1)); width: 100%; border-radius: 15px; box-sizing: border-box; position: relative; }
.close-btn-wrapper { position: absolute; top: 15px; right: 20px; z-index: 10; }
.close-btn { background-color: transparent; border: none; cursor: pointer; transition: transform 0.3s; padding: 8px; }
.close-btn img { width: 30px; height: 30px; display: block; }
.close-btn:hover { transform: rotate(90deg); }
h1 { margin-bottom: 25px; color: var(--text-color, #333); font-size: 1.8rem; }
.input-group { margin-bottom: 20px; text-align: left; }
.input-group label { display: block; margin-bottom: 8px; color: var(--text-color-secondary, #555); font-weight: bold; font-size: 0.95rem; }
.input-group input, .input-group select, :deep(.el-date-editor.el-input__wrapper), .flatpickr-trigger /* Add trigger */ { width: 100% !important; padding: 10px 12px; border: 1px solid #cccccc; border-radius: 6px; font-size: 1rem; transition: border-color 0.3s; box-sizing: border-box; background-color: #fff; min-height: 42px; line-height: normal; color: #303133; }
.input-group input[disabled] { background-color: #f5f7fa; cursor: not-allowed; }
.input-group input:focus, .input-group select:focus, :deep(.el-date-editor.el-input__wrapper.is-focus), .flatpickr-trigger:focus /* Add focus */ { border-color: #409eff; outline: none; }
:deep(.el-date-editor--datetimerange.el-input__wrapper) { display: flex; align-items: center; padding: 0 10px !important; }
:deep(.el-date-editor .el-range-input) { flex: 1; padding: 0 5px; font-size: inherit; width: auto; text-align: center; height: 100%; border: none; background: transparent; color: inherit; }
:deep(.el-date-editor .el-range-separator) { padding: 0 4px; flex-shrink: 0; line-height: 40px; color: #909399; }
.button-container { display: flex; justify-content: center; gap: 15px; margin-top: 30px; flex-wrap: wrap; /* Allow wrapping on small screens */ }
.button-container > * { flex: 1; max-width: 220px; min-width: 150px; /* Prevent buttons becoming too small */ text-align: center; }

/* --- Flatpickr Trigger Styles --- */
.flatpickr-trigger {
  display: flex;             /* Use flex to align text and arrow */
  justify-content: space-between; /* Push arrow to the right */
  align-items: center;       /* Vertically center content */
  cursor: pointer;           /* Indicate it's clickable */
  line-height: 1.5;          /* Match calculated line height */
  color: #606266;            /* Default text color */
}
/* Placeholder text style */
.flatpickr-trigger:empty::before,
.flatpickr-trigger:has(:empty)::before { /* More robust empty check */
  content: '请选择会议时间';
  color: #a8abb2; /* Placeholder color like Element Plus */
  flex-grow: 1; /* Allow placeholder to take space */
}
/* Arrow style */
.flatpickr-trigger .arrow {
  margin-left: 8px;
  color: #999;
  font-size: 0.8em;
  flex-shrink: 0; /* Prevent arrow from shrinking */
}

/* --- Loading Indicator --- */
.loading-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 9999; color: white; font-size: 1.2rem; }

/* --- Mobile Styles --- */
@media (max-width: 767px) {
  .reserve-container { margin: 0; padding: 0; min-height: 100vh; }
  #reservation-form { margin: 10px; padding: 20px 15px; box-shadow: none; border-radius: 10px; height: auto; max-height: none; }
  h1 { font-size: 1.6rem; margin-bottom: 20px; }
  .input-group { margin-bottom: 15px; }
  .input-group label { font-size: 0.9rem; }
  .input-group input, .input-group select, :deep(.el-date-editor.el-input__wrapper), .flatpickr-trigger { min-height: 44px; }
  .button-container { flex-direction: column; align-items: stretch; gap: 12px; margin-top: 25px; width: 100%; }
  .button-container > * { flex: none; width: 100%; max-width: none; min-height: 44px; font-size: 1rem; }
  .close-btn-wrapper { top: 12px; right: 12px; }
  .close-btn img { width: 26px; height: 26px; }
}
@media (max-width: 480px) {
  #reservation-form { margin: 5px; padding: 15px 10px; border-radius: 8px; }
  h1 { font-size: 1.4rem; margin-bottom: 18px; }
  .input-group { margin-bottom: 12px; }
  .input-group label { font-size: 0.85rem; }
  .input-group input, .input-group select, .flatpickr-trigger, :deep(.el-date-editor.el-input__wrapper) /* Ensure consistency */ { font-size: 0.95rem; min-height: 42px; }
  .button-container > * { min-height: 42px; font-size: 0.95rem; }
}

/* --- Global Flatpickr Styles --- */
/* Use :global() because flatpickr appends to body */
:global(.flatpickr-calendar) {
    z-index: 10050 !important; /* High z-index for mobile overlay, ensure higher than any other overlays */
    background-color: white !important; /* Ensure background */
    /* Add any other global overrides needed */
}
/* Adjust width/max-width on small screens */
@media (max-width: 480px) {
  :global(.flatpickr-calendar.open) {
      max-width: 96vw; /* Prevent exceeding screen width */
      left: 2vw !important; /* Center roughly */
      right: 2vw !important;
  }
}
</style>
