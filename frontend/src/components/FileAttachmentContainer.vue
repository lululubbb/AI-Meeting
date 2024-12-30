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
  data() {
    return {
      files: [
        {
          id: 1,
          fileName: "User-Journey.pdf",
          fileType: "PDF",
          fileSizeMB: 4.5,
          downloadUrl: "/files/User-Journey.pdf",
          uploader: "Angela Hope",
          isDownloading: false,
          progress: 0,
        },
        {
          id: 2,
          fileName: "Data-Structure.xls",
          fileType: "XLS",
          fileSizeMB: 12.4,
          downloadUrl: "/files/Data-Structure.xls",
          uploader: "Michael Lee",
          isDownloading: false,
          progress: 0,
        },
      ],
      cancelTokens: {}, // 存储 Axios 的 CancelToken
    };
  },
  methods: {
    handleCancel(index) {
      const file = this.files[index];
      if (this.cancelTokens[file.id]) {
        this.cancelTokens[file.id].cancel("下载已取消");
        this.$set(this.files[index], "isDownloading", false);
        this.$set(this.files[index], "progress", 0);
        delete this.cancelTokens[file.id];
      }
    },
    async handleDownload(url, name, index) {
      this.$set(this.files[index], "isDownloading", true);
      this.$set(this.files[index], "progress", 0);

      const CancelToken = axios.CancelToken;
      const source = CancelToken.source();
      this.cancelTokens[this.files[index].id] = source;

      try {
        const response = await axios.get(url, {
          responseType: "blob",
          cancelToken: source.token,
          onDownloadProgress: (progressEvent) => {
            const total = progressEvent.total;
            const current = progressEvent.loaded;
            const percentCompleted = Math.floor((current / total) * 100);
            this.$set(this.files[index], "progress", percentCompleted);
          },
        });

        // 创建下载链接
        const blob = new Blob([response.data]);
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = name;
        link.click();

        // 清理
        this.$set(this.files[index], "isDownloading", false);
        this.$set(this.files[index], "progress", 100);
        delete this.cancelTokens[this.files[index].id];
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log("下载取消:", error.message);
        } else {
          console.error("下载错误:", error);
          alert(`下载失败: ${name}`);
        }
        this.$set(this.files[index], "isDownloading", false);
        this.$set(this.files[index], "progress", 0);
        delete this.cancelTokens[this.files[index].id];
      }
    },
  },
};
</script>

<style scoped>
.file-attachment-container {
  width: 100%;
  /* 根据需要调整高度 */
  max-height: 100%;
  overflow-y: auto;
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
