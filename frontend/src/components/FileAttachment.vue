<template>
  <div class="file-attachment">
    <!-- 文件图标 -->
    <div :class="['file-icon', fileType.toLowerCase()]">
      <div class="file-icon-inner" :style="{ backgroundColor: fileInnerColor }"></div>
      <span class="file-type">{{ fileType }}</span>
    </div>

    <!-- 文件详情 -->
    <div class="file-details">
      <div class="file-name">{{ fileName }}</div>
      <div v-if="uploader" class="uploader">{{ uploader }}</div>
      <div class="file-info">
        <span class="file-size">{{ fileSizeMB }} MB</span>
        <span
          v-if="isDownloading"
          class="action cancel"
          @click="onCancel"
        >
          取消
        </span>
        <span
          v-else
          class="action download"
          @click="onDownload"
        >
          下载
        </span>
      </div>

      <!-- 进度条 -->
      <div v-if="isDownloading" class="progress-bar">
        <div class="progress" :style="{ width: progress + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "FileAttachment",
  props: {
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true, // 例如 'PDF', 'XLS','DOX'
    },
    fileSizeMB: {
      type: Number,
      required: true,
    },
    uploader: {
      type: String,
      default: "",
    },
    downloadUrl: {
      type: String,
      required: true,
    },
    isDownloading: {
      type: Boolean,
      default: false,
    },
    progress: {
      type: Number,
      default: 45, // 百分比 (0 到 100)
    },
  },
  computed: {
    fileInnerColor() {
      switch (this.fileType.toUpperCase()) {
        case "PDF":
          return "#d13e2a";
        case "XLS":
          return "#258858";
        case "DOC":
          return "#4271c9"
          case "PPTX":
          return "#dc7168"; 
        case "TXT":
          return "#88b8d6";
        case "JPG":
          return "#e09942"; 
        case "PNG":
          return "#c684d2"; 
        case "MD":
          return "#bebebe"
        default:
          return "#999999"; // 默认颜色
      }
    },
  },
  methods: {
    onDownload() {
      this.$emit("download", this.downloadUrl, this.fileName);
    },
    onCancel() {
      this.$emit("cancel");
    },
  },
};
</script>

<style scoped>
.file-attachment {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.file-icon {
  width: 45px;
  height: 50px;
  border-radius: 8px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-left: 6px;
  padding-bottom: 4px;
}

.file-icon-inner {
  width: 15px;
  height: 15px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.file-type {
  color: #ffffff;
  font-size: 12px;
  font-family: "Poppins", sans-serif;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.file-icon.pdf {
  background-color: #f7553f;
}

.file-icon.xls {
  background-color: #34a770;
}
.file-icon.doc {
  background-color: #518af4;
}
.file-icon.pptx {
  background-color: #fd8277; 
}
.file-icon.txt {
  background-color: #9dd9fe; 
}
.file-icon.jpg {
  background-color: #fdb256; 
}
.file-icon.png {
  background-color: #efadfb; 
}
.file-icon.md {
  background-color: #e0e0e0; 
}
.file-icon.unknown {
  background-color: #b0b0b0;
}

.file-details {
  flex: 1;
  margin-left: 20px;
}

.file-name {
  color: #121212;
  font-size: 15px;
  font-family: "Poppins", sans-serif;
  font-weight: 500;

}

.uploader {
  color: #121212;
  font-size: 11px;
  opacity: 0.5;
  margin-top: 5px;
  font-size: 14px;
}

.file-info {
  display: flex;
  align-items: center;
  margin-top: 10px;
}

.file-size {
  color: #121212;
  font-size: 14px;
}

.action {
  margin-left: auto;
  cursor: pointer;
  font-size: 12px;
}

.action.cancel {
  color: #121212;
  opacity: 0.54;
}

.action.download {
  color: #7784ee;
  font-family: "Poppins", sans-serif;
  font-weight: 500;
}

.progress-bar {
  width: 100%;
  height: 5px;
  background-color: #e0e0e0;
  border-radius: 200px;
  margin-top: 10px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background-color: #08a0f7;
  border-radius: 200px;
}
</style>
