<template>
  <div class="file-attachment-container">
    <div class="header">
      <h2>文件附件</h2>
    </div>
    <div class="attachments">
      <FileAttachment
        v-for="(file, index) in files"
        :key="file.id"
        :fileName="file.fileName"
        :fileType="file.fileType"
        :fileSizeMB="file.fileSizeMB"
        :uploader="file.uploader"
        :downloadUrl="file.downloadUrl"
        :isDownloading="file.isDownloading"
        :progress="file.progress"
        @cancel="() => handleCancel(index)"
        @download="(url, name) => handleDownload(url, name, index)"
      />
    </div>
  </div>
</template>

<script>
import FileAttachment from "./FileAttachment.vue";
import axios from "axios";

export default {
  name: "FileAttachmentContainer",
  components: {
    FileAttachment,
  },
  props: {
    files: {
      type: Array,
      required: true,
    },
  },
  methods: {
// 取消下载的处理逻辑
    handleCancel(index) {
      // 假设 `files` 是一个数组，其中包含文件的信息。
      const file = this.files[index];
      console.log(`取消下载：${file.fileName}`);
      // 可以在这里根据需求清理文件状态
      this.$emit('cancel', index);  // 触发父组件的 `cancel` 事件
    },

    // 处理文件下载
    handleDownload(url, name, index) {
      console.log(`开始下载：${name} from ${url}`);
      this.$emit('download', url, name, index);  // 触发父组件的 `download` 事件
    },
  },
};
</script>

<style scoped>
.file-attachment-container {
  width:90%;
  /* 根据需要调整高度 */
  max-height: 80%;
  overflow-y: auto;
  margin: 5px;
  padding: 10px;
}

.header {
  text-align: center;
  color: #121212;
  font-size: 16px;
  font-family: "Poppins", sans-serif;
  font-weight: 600;
  margin-bottom: 20px;
}

.attachments {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
</style>
