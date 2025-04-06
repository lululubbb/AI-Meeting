// ExportUtils.js
import html2pdf from 'html2pdf.js';
import { marked } from 'marked';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  Table, 
  TableRow, 
  TableCell, 
  BorderStyle, 
  WidthType, 
  AlignmentType 
} from 'docx';

/**
 * 会议导出工具
 * 提供将会议内容导出为PDF、Word和Markdown的功能
 */
class ExportUtils {
  /**
   * 导出会议为PDF文件
   * @param {string} meetingTitle 会议标题
   * @param {Object} meetingData 会议数据
   */
  static exportToPDF(meetingTitle) {
    // 创建一个隐藏的打印容器
    const printContainer = document.createElement('div');
    printContainer.className = 'print-container';
    
    // 复制当前会议内容
    const contentElement = document.getElementById('content');
    const summaryElement = document.getElementById('summary');
    
    if (!contentElement || !summaryElement) {
      alert('无法找到会议内容元素');
      return;
    }

    // 创建PDF主体
    const pdfContent = document.createElement('div');
    pdfContent.className = 'pdf-content pdf-export-container'; // 添加pdf-export-container类应用优化样式
    
    // 添加页眉
    const header = document.createElement('div');
    header.className = 'pdf-header';
    header.innerHTML = `
      <h1>${meetingTitle || '会议记录'}</h1>
      <p>导出时间: ${new Date().toLocaleString()}</p>
    `;
    pdfContent.appendChild(header);
    
    // 添加内容
    pdfContent.appendChild(contentElement.cloneNode(true));
    pdfContent.appendChild(summaryElement.cloneNode(true));
    
    // 将打印容器添加到文档中
    printContainer.appendChild(pdfContent);
    document.body.appendChild(printContainer);
    
    // 配置html2pdf选项 - 使用横向A4
    const options = {
      margin: [10, 10], // 减少页边距
      filename: `${meetingTitle || '会议记录'}_${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: false
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'landscape' // 设置为横向
      }
    };
    
    // 执行PDF转换
    html2pdf()
      .set(options)
      .from(pdfContent)
      .save()
      .then(() => {
        // 移除临时容器
        document.body.removeChild(printContainer);
      })
      .catch(error => {
        console.error('PDF导出出错:', error);
        alert('PDF导出失败，请重试！');
        document.body.removeChild(printContainer);
      });
  }


  /**
 * 解析Markdown文本为TextRun数组
 * @param {string} text Markdown格式的文本
 * @returns {TextRun[]} TextRun对象数组
 */
static parseMarkdown(text) {
  if (!text) return [new TextRun({ text: "" })];
  
  const runs = [];
  let currentIndex = 0;
  
  // 匹配粗体 **文本**
  const boldRegex = /\*\*(.*?)\*\*/g;
  // 匹配斜体 *文本* 或 _文本_
  const italicRegex = /(\*|_)(.*?)\1/g;
  // 匹配代码块 `文本`
  const codeRegex = /`(.*?)`/g;
  
  // 合并所有匹配结果
  const allMatches = [];
  let match;
  
  // 找出所有粗体匹配
  while ((match = boldRegex.exec(text)) !== null) {
    allMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      innerText: match[1],
      type: 'bold'
    });
  }
  
  // 找出所有斜体匹配
  while ((match = italicRegex.exec(text)) !== null) {
    allMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      innerText: match[2],
      type: 'italic'
    });
  }
  
  // 找出所有代码块匹配
  while ((match = codeRegex.exec(text)) !== null) {
    allMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      innerText: match[1],
      type: 'code'
    });
  }
  
  // 按开始位置排序
  allMatches.sort((a, b) => a.start - b.start);
  
  // 处理重叠的匹配
  for (let i = 0; i < allMatches.length - 1; i++) {
    if (allMatches[i].end > allMatches[i + 1].start) {
      // 如果有重叠，移除后面的匹配
      allMatches.splice(i + 1, 1);
      i--;
    }
  }
  
  // 创建文本运行
  if (allMatches.length === 0) {
    // 如果没有格式标记，直接添加普通文本
    runs.push(new TextRun({ text }));
  } else {
    // 添加第一个格式标记前的文本
    if (allMatches[0].start > 0) {
      runs.push(new TextRun({ 
        text: text.substring(0, allMatches[0].start) 
      }));
    }
    
    // 处理每个格式标记
    for (let i = 0; i < allMatches.length; i++) {
      const match = allMatches[i];
      
      // 添加格式化的文本
      switch (match.type) {
        case 'bold':
          runs.push(new TextRun({ 
            text: match.innerText,
            bold: true
          }));
          break;
        case 'italic':
          runs.push(new TextRun({ 
            text: match.innerText,
            italics: true
          }));
          break;
        case 'code':
          runs.push(new TextRun({ 
            text: match.innerText,
            font: 'Courier New',
            shading: {
              fill: 'F0F0F0'
            }
          }));
          break;
      }
      
      // 添加当前格式标记和下一个格式标记之间的普通文本
      const nextStart = i < allMatches.length - 1 ? allMatches[i + 1].start : text.length;
      if (match.end < nextStart) {
        runs.push(new TextRun({ 
          text: text.substring(match.end, nextStart) 
        }));
      }
    }
  }
  
  return runs;
}
  
// ExportUtils.js - 简化版 exportToWord 函数
/**
 * 导出会议为Word文档
 * @param {string} meetingTitle 会议标题
 * @param {Object} meetingData 会议完整数据
 */
/**
 * 解析Markdown文本为TextRun数组
 * @param {string} text Markdown格式的文本
 * @returns {TextRun[]} TextRun对象数组
 */
static parseMarkdown(text) {
  if (!text) return [new TextRun({ text: "" })];
  
  const runs = [];
  let currentIndex = 0;
  
  // 匹配粗体 **文本**
  const boldRegex = /\*\*(.*?)\*\*/g;
  // 匹配斜体 *文本* 或 _文本_
  const italicRegex = /(\*|_)(.*?)\1/g;
  // 匹配代码块 `文本`
  const codeRegex = /`(.*?)`/g;
  
  // 合并所有匹配结果
  const allMatches = [];
  let match;
  
  // 找出所有粗体匹配
  while ((match = boldRegex.exec(text)) !== null) {
    allMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      innerText: match[1],
      type: 'bold'
    });
  }
  
  // 找出所有斜体匹配
  while ((match = italicRegex.exec(text)) !== null) {
    allMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      innerText: match[2],
      type: 'italic'
    });
  }
  
  // 找出所有代码块匹配
  while ((match = codeRegex.exec(text)) !== null) {
    allMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      innerText: match[1],
      type: 'code'
    });
  }
  
  // 按开始位置排序
  allMatches.sort((a, b) => a.start - b.start);
  
  // 处理重叠的匹配
  for (let i = 0; i < allMatches.length - 1; i++) {
    if (allMatches[i].end > allMatches[i + 1].start) {
      // 如果有重叠，移除后面的匹配
      allMatches.splice(i + 1, 1);
      i--;
    }
  }
  
  // 创建文本运行
  if (allMatches.length === 0) {
    // 如果没有格式标记，直接添加普通文本
    runs.push(new TextRun({ text }));
  } else {
    // 添加第一个格式标记前的文本
    if (allMatches[0].start > 0) {
      runs.push(new TextRun({ 
        text: text.substring(0, allMatches[0].start) 
      }));
    }
    
    // 处理每个格式标记
    for (let i = 0; i < allMatches.length; i++) {
      const match = allMatches[i];
      
      // 添加格式化的文本
      switch (match.type) {
        case 'bold':
          runs.push(new TextRun({ 
            text: match.innerText,
            bold: true
          }));
          break;
        case 'italic':
          runs.push(new TextRun({ 
            text: match.innerText,
            italics: true
          }));
          break;
        case 'code':
          runs.push(new TextRun({ 
            text: match.innerText,
            font: 'Courier New',
            shading: {
              fill: 'F0F0F0'
            }
          }));
          break;
      }
      
      // 添加当前格式标记和下一个格式标记之间的普通文本
      const nextStart = i < allMatches.length - 1 ? allMatches[i + 1].start : text.length;
      if (match.end < nextStart) {
        runs.push(new TextRun({ 
          text: text.substring(match.end, nextStart) 
        }));
      }
    }
  }
  
  return runs;
}

/**
 * 导出会议为Word文档
 * @param {string} meetingTitle 会议标题
 * @param {Object} meetingData 会议完整数据
 */
static async exportToWord(meetingTitle, meetingData) {
  if (!meetingData) {
    alert('没有可导出的会议数据');
    return;
  }
  
  try {
    // 创建文档对象和子元素数组
    const children = [];
    
    // 添加文档标题
    children.push(
      new Paragraph({
        text: meetingTitle || '会议记录',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: {
          after: 200,
        },
      })
    );
    
    // 添加导出时间
    children.push(
      new Paragraph({
        text: `导出时间: ${new Date().toLocaleString()}`,
        alignment: AlignmentType.RIGHT,
        spacing: {
          after: 200,
        },
      })
    );
    
    // 添加分隔线
    children.push(
      new Paragraph({
        text: "",
        border: {
          bottom: {
            color: "4A6BFF",
            space: 1,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
        spacing: {
          after: 300,
        },
      })
    );
    
    // 添加会议总览
    children.push(
      new Paragraph({
        text: "会议总览",
        heading: HeadingLevel.HEADING_2,
        spacing: {
          before: 200,
          after: 100,
        },
      })
    );
    
    // 添加会议时间
    if (meetingData.timeSegments && meetingData.timeSegments.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "会议时间: ",
              bold: true,
            }),
            new TextRun({
              text: `${formatTime(meetingData.timeSegments[0].start)} - ${formatTime(meetingData.timeSegments[meetingData.timeSegments.length - 1].end)}`,
            }),
          ],
          spacing: {
            after: 200,
          },
        })
      );
    }
    
    // 添加分隔线
    children.push(
      new Paragraph({
        text: "",
        border: {
          bottom: {
            color: "E0E0E0",
            space: 1,
            style: BorderStyle.SINGLE,
            size: 3,
          },
        },
        spacing: {
          after: 300,
        },
      })
    );
    
    // 如果有会议整体摘要，先添加它
    if (meetingData.overallSummary) {
      children.push(
        new Paragraph({
          text: "会议整体摘要",
          heading: HeadingLevel.HEADING_2,
          spacing: {
            before: 200,
            after: 100,
          },
        })
      );
      
      children.push(
        new Paragraph({
          children: this.parseMarkdown(meetingData.overallSummary),
          spacing: {
            after: 200,
          },
          shading: {
            fill: "E8EEFF", // 浅蓝色背景
          },
          border: {
            left: {
              color: "4A6BFF",
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6,
            },
          },
          indent: {
            left: 240, // 左缩进
          },
        })
      );
      
      // 添加分隔线
      children.push(
        new Paragraph({
          text: "",
          border: {
            bottom: {
              color: "E0E0E0",
              space: 1,
              style: BorderStyle.SINGLE,
              size: 3,
            },
          },
          spacing: {
            after: 300,
          },
        })
      );
    }
    
    // 添加会议内容记录
    if (meetingData.processedData && meetingData.processedData.length > 0) {
      children.push(
        new Paragraph({
          text: "会议内容记录",
          heading: HeadingLevel.HEADING_2,
          spacing: {
            before: 200,
            after: 100,
          },
        })
      );
      
      meetingData.processedData.forEach((segment, segmentIndex) => {
        // 添加时间段标题
        children.push(
          new Paragraph({
            text: `时间段 ${segmentIndex + 1}`,
            heading: HeadingLevel.HEADING_3,
            spacing: {
              before: 200,
              after: 100,
            },
          })
        );
        
        // 添加每个参与者的发言
        Object.keys(segment).forEach(userId => {
          const user = segment[userId];
          
          // 用户名标题
          children.push(
            new Paragraph({
              text: user.userName,
              heading: HeadingLevel.HEADING_4,
              spacing: {
                before: 150,
                after: 100,
              },
            })
          );
          
          // 原始文本 - 使用Markdown解析
          children.push(
            new Paragraph({
              children: this.parseMarkdown(user.text || "无内容"),
              spacing: {
                after: 100,
              },
              shading: {
                fill: "F5F7FA", // 浅灰色背景
              },
              border: {
                left: {
                  color: "4A6BFF",
                  space: 1,
                  style: BorderStyle.SINGLE,
                  size: 6,
                },
              },
              indent: {
                left: 240, // 左缩进
              },
            })
          );
          
          // 添加优化文本(如果有) - 使用Markdown解析
          if (meetingData.optimizationData && 
              meetingData.optimizationData[segmentIndex] && 
              meetingData.optimizationData[segmentIndex][userId]) {
            
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "优化内容:",
                    bold: true,
                    color: "8A54D8", // 紫色
                  }),
                ],
                spacing: {
                  before: 100,
                  after: 50,
                },
              })
            );
            
            children.push(
              new Paragraph({
                children: this.parseMarkdown(meetingData.optimizationData[segmentIndex][userId] || "无优化内容"),
                spacing: {
                  after: 150,
                },
                shading: {
                  fill: "E8EEFF", // 浅蓝色背景
                },
                border: {
                  left: {
                    color: "8A54D8",
                    space: 1,
                    style: BorderStyle.SINGLE,
                    size: 6,
                  },
                },
                indent: {
                  left: 240, // 左缩进
                },
              })
            );
          }
        });
        
        // 添加摘要和关键词信息 - 使用Markdown解析
        if (meetingData.summaries && meetingData.summaries[segmentIndex]) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "摘要: ",
                  bold: true,
                  color: "4A6BFF", // 蓝色
                }),
                ...this.parseMarkdown(meetingData.summaries[segmentIndex] || "无摘要"),
              ],
              spacing: {
                before: 100,
                after: 50,
              },
              shading: {
                fill: "E8EEFF", // 浅蓝色背景
              },
              border: {
                left: {
                  color: "4A6BFF",
                  space: 1,
                  style: BorderStyle.SINGLE,
                  size: 6,
                },
              },
              indent: {
                left: 240, // 左缩进
              },
            })
          );
        }
        
        if (meetingData.keywords && meetingData.keywords[segmentIndex]) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "关键词: ",
                  bold: true,
                  color: "4A6BFF", // 蓝色
                }),
                new TextRun({
                  text: meetingData.keywords[segmentIndex] || "无关键词",
                }),
              ],
              spacing: {
                before: 50,
                after: 100,
              },
              indent: {
                left: 240, // 左缩进
              },
            })
          );
        }
        
        // 添加分隔线
        children.push(
          new Paragraph({
            text: "",
            border: {
              bottom: {
                color: "E0E0E0",
                space: 1,
                style: BorderStyle.SINGLE,
                size: 3,
              },
            },
            spacing: {
              before: 150,
              after: 150,
            },
          })
        );
      });
    }
    
    // 添加会议待办与拓展(如果有) - 使用Markdown解析
    if (meetingData.todosAndExtensions) {
      children.push(
        new Paragraph({
          text: "会议待办与拓展",
          heading: HeadingLevel.HEADING_2,
          spacing: {
            before: 200,
            after: 100,
          },
        })
      );
      
      // 分割待办事项文本，以便添加格式
      const todoLines = meetingData.todosAndExtensions.split('\n');
      
      todoLines.forEach(line => {
        if (line.trim()) {
          // 处理无序列表项
          if (line.trim().startsWith('- ')) {
            children.push(
              new Paragraph({
                children: this.parseMarkdown(line.trim().substring(2)),
                bullet: {
                  level: 0,
                },
                spacing: {
                  before: 50,
                  after: 50,
                },
              })
            );
          }
          // 处理有序列表项
          else if (/^\d+\./.test(line.trim())) {
            const number = line.trim().match(/^\d+/)[0];
            const text = line.trim().replace(/^\d+\./, '').trim();
            
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${number}. `,
                    bold: true,
                    color: "4A6BFF",
                  }),
                  ...this.parseMarkdown(text),
                ],
                spacing: {
                  before: 50,
                  after: 50,
                },
                indent: {
                  left: 240, // 左缩进
                },
              })
            );
          }
          // 处理普通段落
          else {
            children.push(
              new Paragraph({
                children: this.parseMarkdown(line.trim()),
                spacing: {
                  before: 50,
                  after: 50,
                },
              })
            );
          }
        }
      });
    }
    
    // 创建文档
    const doc = new Document({
      sections: [{
        properties: {},
        children: children
      }]
    });
    
    // 导出文档
    const blob = await Packer.toBlob(doc);
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${meetingTitle || '会议记录'}_${new Date().toISOString().slice(0, 10)}.docx`;
    document.body.appendChild(link);
    link.click();
    
    // 清理
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    }, 100);
    
  } catch (error) {
    console.error('Word导出出错:', error);
    alert('Word导出失败，请重试！');
  }
}
  
  /**
   * 导出会议为Markdown文件
   * @param {string} meetingTitle 会议标题
   * @param {Object} meetingData 会议完整数据
   */
  static exportToMarkdown(meetingTitle, meetingData) {
    if (!meetingData) {
      alert('没有可导出的会议数据');
      return;
    }
    
    try {
      // 构建美化的Markdown内容
      let markdownContent = `# 📝 ${meetingTitle || '会议记录'}\n\n`;
      markdownContent += `> 📅 导出时间: ${new Date().toLocaleString()}\n\n`;
      
      // 添加美化的分隔线
      markdownContent += `---\n\n`;
      
      // 添加会议总览
      markdownContent += `## 🔍 会议总览\n\n`;
      
      if (meetingData.timeSegments && meetingData.timeSegments.length > 0) {
        markdownContent += `⏱️ **会议时间**: ${formatTime(meetingData.timeSegments[0].start)} - ${formatTime(meetingData.timeSegments[meetingData.timeSegments.length - 1].end)}\n\n`;
      }
      
      // 添加美化的分隔线
      markdownContent += `---\n\n`;
      
      // 添加会议内容记录
      markdownContent += `## 📋 会议内容记录\n\n`;
      
      if (meetingData.processedData && meetingData.processedData.length > 0) {
        meetingData.processedData.forEach((segment, segmentIndex) => {
          markdownContent += `### 🕒 时间段 ${segmentIndex + 1}\n\n`;
          
          // 添加每个参与者的发言
          Object.keys(segment).forEach(userId => {
            const user = segment[userId];
            markdownContent += `#### 👤 ${user.userName}\n\n`;
            
            // 使用引用块来美化原始文本
            markdownContent += `> ${user.text.replace(/\n/g, '\n> ')}\n\n`;
            
            // 添加优化文本(如果有)
            if (meetingData.optimizationData && 
                meetingData.optimizationData[segmentIndex] && 
                meetingData.optimizationData[segmentIndex][userId]) {
              markdownContent += `**✨ 优化内容:**\n\n`;
              
              // 使用代码块来美化优化文本
              markdownContent += `\`\`\`\n${meetingData.optimizationData[segmentIndex][userId]}\n\`\`\`\n\n`;
            }
          });
          
          // 使用表格来显示摘要和关键词
          if ((meetingData.summaries && meetingData.summaries[segmentIndex]) || 
              (meetingData.keywords && meetingData.keywords[segmentIndex])) {
            
            markdownContent += `| 📊 类型 | 📝 内容 |\n`;
            markdownContent += `| --- | --- |\n`;
            
            // 添加摘要(如果有)
            if (meetingData.summaries && meetingData.summaries[segmentIndex]) {
              markdownContent += `| **📌 摘要** | ${meetingData.summaries[segmentIndex].replace(/\n/g, '<br>')} |\n`;
            }
            
            // 添加关键词(如果有)
            if (meetingData.keywords && meetingData.keywords[segmentIndex]) {
              const keywordTags = meetingData.keywords[segmentIndex].split('，')
                .map(kw => `\`${kw.trim()}\``)
                .join(' ');
              markdownContent += `| **🔑 关键词** | ${keywordTags} |\n`;
            }
            
            markdownContent += `\n`;
          }
          
          // 添加美化的分隔线
          markdownContent += `---\n\n`;
        });
      }
      
      // 添加会议整理
      markdownContent += `## 📊 会议整理\n\n`;
      
      // 添加整体摘要(如果有)
      if (meetingData.overallSummary) {
        markdownContent += `### 📝 会议整体摘要\n\n`;
        markdownContent += `${meetingData.overallSummary}\n\n`;
        markdownContent += `---\n\n`;
      }
      
      // 添加待办事项(如果有)
      if (meetingData.todosAndExtensions) {
        markdownContent += `### ✅ 会议待办与拓展\n\n`;
        
        // 尝试美化待办事项格式
        const formattedTodos = meetingData.todosAndExtensions
          .replace(/- /g, '- ✓ ')  // 添加勾选符号
          .replace(/(\d+\.) /g, '$1 🔸 ');  // 添加数字列表符号
          
        markdownContent += `${formattedTodos}\n\n`;
      }
      
      // 创建下载
      const blob = new Blob([markdownContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${meetingTitle || '会议记录'}_${new Date().toISOString().slice(0, 10)}.md`;
      document.body.appendChild(link);
      link.click();
      
      // 清理
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);
      
    } catch (error) {
      console.error('Markdown导出出错:', error);
      alert('Markdown导出失败，请重试！');
    }
  }
}

// 辅助函数：格式化时间
function formatTime(timestamp) {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  return date.toLocaleString();
}

export default ExportUtils;