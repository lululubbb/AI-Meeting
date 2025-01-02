export const generateSummaryAPI = async (transcriptionText) => {
    const requestData = {
      model: 'lite',
      messages: [
        {
          role: 'system',
          content: '你是一个会议发言记录的阅读者、总结者，请根据用户提供的文本生成简洁的摘要。',
        },
        {
          role: 'user',
          content: transcriptionText,
        },
      ],
      stream: true, // 启用流式输出
    };
  
    const response = await fetch('/api/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer 123456', // 替换为实际的 API 密钥
      },
      body: JSON.stringify(requestData),
    });
  
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  
    return response;
  };
  