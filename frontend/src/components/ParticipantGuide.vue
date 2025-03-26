<template>
  <div class="guide-page elegant-theme">
    <!-- The SINGLE main container card -->
    <el-card shadow="sm" class="page-content-card">
       <!-- Page Header (moved inside the card for better cohesion) -->
      <div class="page-header">
        <h1>参会指南</h1>
        <p>交通、住宿、签到及联系方式</p>
      </div>

      <div v-if="isLoading" class="loading-state">
        <el-icon class="is-loading" :size="30"><Loading /></el-icon>
        <span>加载指南中...</span>
      </div>

      <el-alert v-else-if="error" :title="'加载参会指南失败: ' + error" type="error" show-icon :closable="false" />

      <el-empty v-else-if="!guideData || Object.keys(guideData).length === 0" description="参会指南信息暂未发布" />

      <!-- Sections directly inside the main card body -->
      <div v-else class="sections-container">

        <!-- Section: Venue -->
        <section v-if="guideData.venue" class="content-section">
          <div class="section-title">
             <el-icon><OfficeBuilding /></el-icon>
             <h2>{{ guideData.venue.title || '大会场馆' }}</h2>
          </div>
          <div v-if="guideData.venue.images && guideData.venue.images.length" class="image-carousel-wrapper">
            <el-carousel indicator-position="outside" height="350px" :autoplay="false" arrow="hover">
              <el-carousel-item v-for="(img, index) in guideData.venue.images" :key="index">
                <el-image :src="img.url" fit="contain" class="carousel-image" lazy>
                   <template #placeholder><div class="image-slot loading"></div></template>
                   <template #error><div class="image-slot error"><el-icon><Picture /></el-icon></div></template>
                </el-image>
              </el-carousel-item>
            </el-carousel>
          </div>
          <div v-if="formattedVenueSchedule && formattedVenueSchedule.length > 0" class="venue-schedule">
            <div v-for="(daySchedule, dayIndex) in formattedVenueSchedule" :key="dayIndex" class="schedule-day">
              <h3 class="schedule-date">{{ daySchedule.date }}</h3>
               <ul class="schedule-event-list">
                   <li v-for="(event, eventIndex) in daySchedule.events" :key="eventIndex" class="schedule-event-item">
                       <span v-html="formatEventLine(event)"></span>
                   </li>
               </ul>
            </div>
          </div>
          <div v-else-if="guideData.venue.text && !(formattedVenueSchedule && formattedVenueSchedule.length)" class="venue-text-content fallback-pre">
              <pre>{{ guideData.venue.text }}</pre>
          </div>
          <el-empty v-else-if="!(guideData.venue.images && guideData.venue.images.length) && !guideData.venue.text" description="场馆日程信息暂缺" :image-size="80"/>
        </section>
        <el-divider v-if="guideData.venue" />

        <!-- Section: Transport -->
        <section v-if="guideData.transport" class="content-section">
          <div class="section-title">
            <el-icon><Guide /></el-icon>
            <h2>{{ guideData.transport.title || '大会交通' }}</h2>
           </div>
           <div v-if="guideData.transport.routes && guideData.transport.routes.length > 0">
             <div v-for="(route, rIndex) in guideData.transport.routes" :key="rIndex" class="route-block">
               <h4 class="route-from">{{ route.from }}</h4>
               <el-descriptions
                  v-if="route.options && route.options.length > 0"
                  :column="1"
                  border
                  size="default"
                  class="transport-options"
                >
                 <el-descriptions-item v-for="(option, oIndex) in route.options" :key="oIndex" :label="option.type || '方式'" label-class-name="transport-option-label">
                   <span class="option-icon">
                     <el-icon v-if="option.type === '地铁'"><Platform /></el-icon>
                     <el-icon v-else-if="option.type === 'TAXI'"><Van /></el-icon>
                     <el-icon v-else><MoreFilled /></el-icon> <!-- Default icon -->
                   </span>
                   {{ option.detail }}
                 </el-descriptions-item>
               </el-descriptions>
             </div>
           </div>
           <el-empty v-else description="交通信息暂缺" :image-size="80"/>
        </section>
        <el-divider v-if="guideData.transport" />

        <!-- Section: Hotel -->
        <section v-if="guideData.hotel" class="content-section">
          <div class="section-title">
            <el-icon><House /></el-icon>
            <h2>{{ guideData.hotel.title || '酒店住宿' }}</h2>
          </div>
          <div v-if="guideData.hotel.images && guideData.hotel.images.length > 0" class="image-carousel-wrapper hotel-images">
             <el-carousel indicator-position="outside" height="350px" :autoplay="false" arrow="hover" >
               <el-carousel-item v-for="(img, index) in guideData.hotel.images" :key="index">
                 <el-image :src="img.url" fit="contain" class="carousel-image" lazy>
                    <template #placeholder><div class="image-slot loading"></div></template>
                    <template #error><div class="image-slot error"><el-icon><Picture /></el-icon></div></template>
                 </el-image>
               </el-carousel-item>
             </el-carousel>
           </div>
           <!-- Add descriptive text if needed -->
           <p v-if="!(guideData.hotel.images && guideData.hotel.images.length > 0)" class="empty-description">
               推荐酒店信息或说明暂未提供。
           </p>
        </section>
        <el-divider v-if="guideData.hotel" />

        <!-- Section: Sign-in -->
        <section v-if="guideData.sign_in" class="content-section">
           <div class="section-title">
                <el-icon><EditPen /></el-icon>
                <h2>签到指引</h2>
             </div>
           <el-descriptions :column="1" border size="default" class="sign-in-details">
              <el-descriptions-item label="签到地点">
                  <el-icon><LocationInformation /></el-icon> {{ guideData.sign_in.location || '待定' }}
              </el-descriptions-item>
               <el-descriptions-item label="签到时间">
                  <div v-if="guideData.sign_in.time && guideData.sign_in.time.length > 0">
                      <div v-for="(t, index) in guideData.sign_in.time" :key="index" class="time-item">
                         <el-icon><Clock /></el-icon> {{ t }}
                     </div>
                  </div>
                   <span v-else><el-icon><Clock /></el-icon> 待定</span>
              </el-descriptions-item>
              <el-descriptions-item label="签到流程">
                 <el-icon><Tickets /></el-icon> {{ guideData.sign_in.process || '待定' }}
              </el-descriptions-item>
               <el-descriptions-item label="注意事项">
                   <div v-if="guideData.sign_in.notice && guideData.sign_in.notice.length > 0" class="notice-wrapper">
                       <el-alert
                           v-for="(item, index) in guideData.sign_in.notice.filter(n => n.type === 'text')"
                           :key="index"
                           :title="item.content"
                           type="info"
                           show-icon
                           :closable="false"
                           class="notice-alert"
                       />
                       <!-- Basic handling for potential table data -->
                       <el-alert
                          v-for="(item, index) in guideData.sign_in.notice.filter(n => n.type === 'table')"
                          :key="'table-'+index"
                          :title="extractTableContent(item.content)"
                          type="warning"
                          show-icon
                           :closable="false"
                           class="notice-alert"
                       />
                    </div>
                   <span v-else>无</span>
               </el-descriptions-item>
           </el-descriptions>
        </section>
        <el-divider v-if="guideData.sign_in" />

        <!-- Section: Contact -->
        <section v-if="guideData.contact" class="content-section">
          <div class="section-title">
             <el-icon><Phone /></el-icon>
             <h2>{{ guideData.contact.title || '联系我们' }}</h2>
          </div>
           <div v-if="guideData.contact.info && guideData.contact.info.length > 0">
               <el-descriptions :column="isMobile ? 1 : 2" border size="default" class="contact-details-desc">
                   <el-descriptions-item v-for="(person, index) in guideData.contact.info" :key="index" label-class-name="contact-label">
                       <template #label>
                          <div class="contact-person-label">
                            <el-icon><UserFilled /></el-icon>
                            <span>{{ person.name }}</span>
                            <el-tag size="small" effect="light" round>{{ person.business || '联系人' }}</el-tag>
                          </div>
                       </template>
                       <div class="contact-person-details">
                            <div v-if="person.details && person.details.length > 0" >
                                <p v-for="(detail, dIndex) in person.details" :key="dIndex" class="detail-line">
                                   <el-icon v-if="detail.includes('@')"><Message /></el-icon>
                                   <el-icon v-else><Iphone /></el-icon>
                                   <span>{{ detail }}</span>
                                </p>
                            </div>
                       </div>
                   </el-descriptions-item>
               </el-descriptions>
           </div>
           <el-empty v-else description="联系方式暂缺" :image-size="80"/>
        </section>

      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import {
  ElCard, ElRow, ElCol, ElImage, ElIcon, ElAlert, ElEmpty, ElCarousel, ElCarouselItem,
  ElDescriptions, ElDescriptionsItem, ElDivider, ElTag
} from 'element-plus';
import {
  Loading, Picture, Guide, OfficeBuilding, House, EditPen, Phone, UserFilled, Message,
  Iphone, LocationInformation, Clock, Tickets, Platform, Van, Lock, MoreFilled
} from '@element-plus/icons-vue'; // Ensure UserFilled is imported

const guideData = ref(null);
const isLoading = ref(true);
const error = ref(null);

const isMobile = computed(() => window.innerWidth < 768);

const extractTableContent = (contentArray) => {
    if (Array.isArray(contentArray) && contentArray[0] && Array.isArray(contentArray[0]) && contentArray[0][0] && contentArray[0][0].content) {
        return contentArray[0][0].content;
    }
    return '表格内容格式有误';
}

const formattedVenueSchedule = computed(() => {
  const text = guideData.value?.venue?.text;
  if (!text) return [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line !== '');
  const schedule = [];
  let currentDay = null;
  for (const line of lines) {
      const dateMatch = line.match(/^(\d{1,2}\s*月\s*\d{1,2}\s*日.*?(?=\s*\dF|\s*$))/);
      if (dateMatch) {
          currentDay = { date: dateMatch[1].trim().replace(/\s+会\s+议/, ''), events: [] }; // Clean up date string slightly
          schedule.push(currentDay);
          const eventInfoOnDateLine = line.substring(dateMatch[0].length).trim();
           if (eventInfoOnDateLine) currentDay.events.push(eventInfoOnDateLine);
      } else if (currentDay) {
          currentDay.events.push(line);
      }
  }
  return schedule;
});

const formatEventLine = (line) => {
    let formattedLine = line;
    // Use callback in replace to handle icon insertion correctly
    formattedLine = formattedLine.replace(/(\d+F)/g, (match) => `<span class="event-floor"><i class="el-icon"><svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M880 184H712v-64c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v64H384v-64c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v64H144c-17.7 0-32 14.3-32 32v704c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V216c0-17.7-14.3-32-32-32zm-40 728H184V256h128v48c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-48h256v48c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-48h128v656z"></path></svg></i>&nbsp;${match}</span>`);
    formattedLine = formattedLine.replace(/\(\s*闭\s*门\s*\)/g, `<span class="event-closed"><i class="el-icon"><svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M832 464h-68V240c0-132.5-107.5-240-240-240S284 107.5 284 240v224h-68c-17.7 0-32 14.3-32 32v384c0 17.7 14.3 32 32 32h688c17.7 0 32-14.3 32-32V496c0-17.7-14.3-32-32-32zm-292-24c61.9 0 112 50.1 112 112v136H424V352c0-61.9 50.1-112 112-112h4z"></path></svg></i>&nbsp;(闭门)</span>`);

   // Attempt to separate location/details - this is heuristic and might need adjustment
   const parts = formattedLine.split(/\s+/); // Split by spaces
   if (parts.length > 1 && parts[0].includes('event-floor')) {
       // If the first part is the floor, treat it as location
       return `${parts[0]} <span class="event-details">${parts.slice(1).join(' ')}</span>`;
   } else if (parts.length > 1 && /\d/.test(parts[0]) && /[A-Za-z]/.test(parts[0])) {
        // Treat things like "101", "102B" etc. as location too (heuristic)
        return `<span class="event-location">${parts[0]}</span> <span class="event-details">${parts.slice(1).join(' ')}</span>`;
    }

    return `<span class="event-details">${formattedLine}</span>`; // Default if no clear separation
}


onMounted(async () => {
  try {
    const response = await fetch('/data/guide.json');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    if (typeof data === 'object' && data !== null) {
       guideData.value = data;
    } else {
       console.warn("Fetched guide data is not an object:", data);
       guideData.value = {};
       throw new Error("参会指南数据格式不正确");
    }
  } catch (e) {
    console.error("无法加载参会指南数据:", e);
    error.value = e.message;
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
/* --- Theme and Global Styles --- */
.guide-page {
  padding: 24px;
  background-color: #f8f9fa; /* Light background for the whole page */
}

/* The single main card */
.page-content-card {
  max-width: 1000px;
  margin: 0 auto;
  border: none; /* Remove default card border */
  border-radius: 12px; /* Soften corners */
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08); /* Softer shadow */
  overflow: hidden; /* Ensure children respect border-radius */
}
/* Adjust card body padding */
.page-content-card :deep(.el-card__body) {
    padding: 30px 35px; /* Generous padding */
}

/* Page Header inside the card */
.page-header {
    margin-bottom: 35px;
    padding-bottom: 15px;
    border-bottom: 1px solid #eef0f3; /* Lighter separator */
}
.page-header h1 {
    font-size: 24px;
    font-weight: 600; /* Slightly less bold */
    color: #2c3e50; /* Darker text color */
    margin: 0 0 6px 0;
}
.page-header p {
    font-size: 15px;
    color: #7f8c8d; /* Softer description color */
    margin: 0;
}

.loading-state { display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 80px 0; color: #909399; font-size: 16px; }
.loading-state .el-icon { margin-bottom: 10px; }


/* Sections Container */
.sections-container {
    display: flex;
    flex-direction: column;
    gap: 30px; /* Default gap, dividers add more visual space */
}

/* Individual Section Styling */
.content-section {
    /* No border, shadow, or background needed here now */
    padding: 0; /* Remove padding */
}

.section-title {
    display: flex;
    align-items: center;
    margin-bottom: 25px;
    color: #34495e; /* Section title color */
}
.section-title .el-icon {
    font-size: 24px;
    margin-right: 12px;
    color: var(--el-color-primary); /* Use primary color for icon */
}
.section-title h2 {
    font-size: 20px;
    font-weight: 600;
    margin: 0;
}

/* Divider Style */
.el-divider {
    margin: 40px 0; /* More vertical space around dividers */
    border-color: #eef0f3; /* Lighter divider */
}
.el-divider :deep(.el-divider__text) {
    background-color: #fff; /* Ensure text background matches card */
}

/* --- Component Specific Refinements --- */

/* Carousel */
.image-carousel-wrapper {
    margin-bottom: 25px;
    border-radius: 8px;
    overflow: hidden; /* Ensures image respects border radius */
    background-color: #f5f7fa; /* Background while loading */
}
.hotel-images { /* Less bottom margin if no text follows */
    margin-bottom: 0;
}
.carousel-image { width: 100%; height: 100%; display: block; }
.image-slot { display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; background: #f5f7fa; color: #bdc3c7; font-size: 14px; }
.image-slot.loading::after{ content: ' 加载中...' }
.image-slot.error .el-icon { font-size: 40px; }
.el-carousel :deep(.el-carousel__arrow) {
    background-color: rgba(44, 62, 80, 0.5); /* Darker, semi-transparent arrows */
    color: #fff;
    font-size: 18px;
    --el-carousel-arrow-size: 40px; /* Adjust arrow circle size */
}
 .el-carousel :deep(.el-carousel__arrow:hover) {
     background-color: rgba(44, 62, 80, 0.7);
 }
 .el-carousel :deep(.el-carousel__indicator .el-carousel__button) {
     background-color: #bdc3c7; /* Grey indicators */
     opacity: 0.8;
 }
 .el-carousel :deep(.el-carousel__indicator.is-active .el-carousel__button) {
     background-color: var(--el-color-primary); /* Active indicator color */
 }

/* Venue Schedule */
.venue-schedule { margin-top: 25px; }
.schedule-day { margin-bottom: 25px; }
.schedule-date {
    font-size: 17px;
    font-weight: 600;
    color: #2980b9; /* Different color for date */
    margin: 0 0 15px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid #ecf0f1; /* Lighter border */
}
.schedule-event-list { list-style: none; padding-left: 5px; margin: 0; }
.schedule-event-item {
    margin-bottom: 12px;
    line-height: 1.8; /* Improved line height */
    color: #34495e;
    font-size: 14px;
    display: flex; /* Use flex for better alignment */
    align-items: baseline; /* Align based on text */
    gap: 8px; /* Space between parts */
}
.schedule-event-item :deep(.event-location),
.schedule-event-item :deep(.event-floor) {
    display: inline-flex;
    align-items: center;
    background-color: #ecf5ff;
    color: #409eff;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap; /* Prevent location wrap */
    flex-shrink: 0; /* Don't shrink location */
}
.schedule-event-item :deep(.event-location .el-icon svg),
.schedule-event-item :deep(.event-floor .el-icon svg) { /* Target nested SVG */
    width: 1em; height: 1em; margin-right: 4px; vertical-align: -0.15em;
}
.schedule-event-item :deep(.event-details) {
    color: #566573; /* Slightly lighter for details */
}
.schedule-event-item :deep(.event-closed) {
    display: inline-flex;
    align-items: center;
    color: #e67e22; /* Orange for warning/closed */
    font-weight: 500;
    font-size: 13px;
    margin-left: 5px; /* Space before closed tag */
}
.schedule-event-item :deep(.event-closed .el-icon svg) {
    width: 1em; height: 1em; margin-right: 4px; vertical-align: -0.15em;
}


/* Transport Options */
.route-block { margin-bottom: 25px; }
.route-from { font-size: 16px; font-weight: 600; margin: 0 0 12px 0; color: #3498db; }
.transport-options { margin-top: 10px; }
.transport-options :deep(.el-descriptions__cell) {
    padding-top: 10px !important;
    padding-bottom: 10px !important;
 }
.transport-options :deep(.el-descriptions__label) {
    font-weight: 500;
    color: #566573;
    width: 70px !important; /* Consistent label width */
}
.transport-options :deep(.el-descriptions--border .el-descriptions__cell) {
    border-color: #ecf0f1; /* Lighter borders */
}
.transport-options .option-icon {
    margin-right: 8px;
    display: inline-flex;
    vertical-align: middle;
    color: #8e9aaf;
    font-size: 16px;
}

/* Sign-in Details */
.sign-in-details { margin-top: 10px; }
.sign-in-details :deep(.el-descriptions__label) {
    font-weight: 500;
    color: #566573;
    width: 100px !important;
}
.sign-in-details :deep(.el-descriptions--border .el-descriptions__cell) {
    border-color: #ecf0f1;
}
.sign-in-details .el-icon { vertical-align: middle; margin-right: 6px; color: #8e9aaf; }
.sign-in-details .time-item:not(:last-child) { margin-bottom: 4px; }
.notice-wrapper { margin-top: 5px; }
.notice-alert {
    margin-top: 10px;
    padding: 10px 15px;
    background-color: #f4f6f9 !important; /* Subtle alert background */
    border-radius: 6px;
}
.notice-alert :deep(.el-alert__title) { font-size: 13px; color: #566573; }
.notice-alert :deep(.el-alert__icon) { color: #8e9aaf; }
.notice-alert[type="warning"] { background-color: #fef5e7 !important; }
.notice-alert[type="warning"] :deep(.el-alert__icon) { color: #f39c12; }


/* Contact Details */
.contact-details-desc { margin-top: 10px; }
.contact-details-desc :deep(.el-descriptions--border .el-descriptions__cell) {
    border-color: #ecf0f1;
}
.contact-details-desc :deep(.contact-label) { /* Applied via label-class-name */
   font-weight: 500 !important; /* Make label stand out a bit */
}

.contact-person-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    color: #34495e;
}
.contact-person-label .el-icon { font-size: 16px; }
.contact-person-label .el-tag { margin-left: auto; } /* Push tag to the right */

.contact-person-details .detail-line {
    display: flex;
    align-items: center;
    margin: 5px 0;
    font-size: 14px;
    color: #606266;
}
.contact-person-details .detail-line .el-icon {
    margin-right: 8px;
    color: #909399;
     font-size: 16px;
}

/* Responsiveness */
@media (max-width: 768px) {
  .guide-page { padding: 15px; }
  .page-content-card :deep(.el-card__body) { padding: 20px 25px; }
  .page-header h1 { font-size: 22px; }
  .page-header p { font-size: 14px; }
  .section-title h2 { font-size: 18px; }
  .section-title .el-icon { font-size: 20px; margin-right: 10px; }
  .el-divider { margin: 30px 0; }
  .image-carousel-wrapper { height: 250px; } /* Adjust carousel height */
  .schedule-date { font-size: 16px; }
  .schedule-event-item { font-size: 13px; gap: 6px; }
  .schedule-event-item :deep(.event-location),
  .schedule-event-item :deep(.event-floor),
  .schedule-event-item :deep(.event-closed) { font-size: 12px; }
  .route-from { font-size: 15px; }
  .transport-options, .sign-in-details, .contact-details-desc { font-size: 13px; }
  .transport-options :deep(.el-descriptions__label) { width: 60px !important; }
  .notice-alert :deep(.el-alert__title) { font-size: 12px; }
}
</style>
