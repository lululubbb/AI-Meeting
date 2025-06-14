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
  color: var(--text-color);
  font-size: 15px;
  font-weight: 500;

}

.uploader {
  color: var(--text-color);
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
  color: var(--text-color);
  font-size: 14px;
}

.action {
  margin-left: auto;
  cursor: pointer;
  font-size: 12px;
}

.action.cancel {
  color: var(--text-color);
  opacity: 0.54;
}

.action.download {
  color: var(--text-color);
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

@media screen and (max-width: 768px) {
  .file-attachment {
    margin-bottom: 15px;
  }

  .file-icon {
    width: 40px;
    height: 45px;
    border-radius: 6px;
    padding-bottom: 3px;
  }

  .file-icon-inner {
    width: 13px;
    height: 13px;
    margin-bottom: 8px;
  }

  .file-type {
    font-size: 11px;
    letter-spacing: 0.3px;
  }

  .file-details {
    margin-left: 15px;
  }

  .file-name {
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 60vw;
  }

  .uploader {
    font-size: 12px;
    margin-top: 3px;
  }

  .file-info {
    margin-top: 8px;
  }

  .file-size {
    font-size: 12px;
  }

  .action {
    font-size: 11px;
  }

  .progress-bar {
    height: 4px;
    margin-top: 8px;
  }
}

@media screen and (max-width: 480px) {
  .file-attachment {
    margin-bottom: 12px;
    padding: 8px;
  }

  .file-icon {
    width: 36px;
    height: 40px;
    padding-bottom: 2px;
  }

  .file-type {
    font-size: 10px;
  }

  .file-details {
    margin-left: 12px;
  }

  .file-name {
    font-size: 13px;
    max-width: 55vw;
  }

  .uploader {
    display: none; /* 隐藏上传者信息 */
  }

  .file-info {
    margin-top: 6px;
  }

  .action {
    padding: 4px 8px;
    border-radius: 4px;
    background: rgba(0,0,0,0.05);
  }

  .progress-bar {
    height: 3px;
  }

  /* 适配长文件名显示 */
  .file-name {
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
}
</style>
