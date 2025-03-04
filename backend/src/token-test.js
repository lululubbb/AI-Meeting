import { RPCClient } from '@alicloud/pop-core';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new RPCClient({
  accessKeyId: process.env.ALIYUN_AK_ID,
  accessKeySecret: process.env.ALIYUN_AK_SECRET,
  endpoint: 'http://nls-meta.cn-shanghai.aliyuncs.com',
  apiVersion: '2019-02-28'
});

async function getToken() {
  try {
    const result = await client.request('CreateToken');
    console.log('[SUCCESS] Token获取成功:');
    console.log(`Token: ${result.Token.Id}`);
    console.log(`过期时间: ${new Date(result.Token.ExpireTime * 1000).toLocaleString()}`);
    return result;
  } catch (error) {
    console.error('[ERROR] 获取Token失败:');
    console.error(`错误代码: ${error.code}`);
    console.error(`错误信息: ${error.message}`);
    if (error.data) {
      console.error(`请求ID: ${error.data.RequestId}`);
    }
    process.exit(1);
  }
}

getToken();
