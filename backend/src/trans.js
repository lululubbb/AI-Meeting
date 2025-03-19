// src/trans.js
'use strict';

import alimt20181012 from '@alicloud/alimt20181012';
import * as OpenApi from '@alicloud/openapi-client';
import * as Util from '@alicloud/tea-util';
import { fileURLToPath } from 'url'; // 导入Node.js内置的url模块
import { dirname } from 'path';   // 导入Node.js内置的path模块


const __filename = fileURLToPath(import.meta.url); // 获取当前文件路径
const __dirname = dirname(__filename);          //获取当前目录路径
// import * as Tea from '@alicloud/tea-typescript'; // 通常不需要显式导入

class Client {

  static createClient() {
    let config = new OpenApi.Config({
      accessKeyId: "LTAI5tQhyJpfza5PCkxhtJUX",
      accessKeySecret: "mvFFWIuRWmW7orJI5iyXtMT9YyyuL3",
    });
    config.endpoint = `mt.cn-hangzhou.aliyuncs.com`;
    return new alimt20181012.default(config); // 使用 .default
  }

  static async main(args) {
    let client = Client.createClient();
    let translateGeneralRequest = new alimt20181012.TranslateGeneralRequest({
      formatType: 'text',
      sourceLanguage: 'zh',
      targetLanguage: 'en',
      sourceText: '你好?',
    });
    let runtime = new Util.RuntimeOptions({});
    try {
      let response = await client.translateGeneralWithOptions(translateGeneralRequest, runtime);
      console.log("翻译结果:", response.body.data.translated);
    } catch (error) {
      console.log(error.message);
      console.log(error.data["Recommend"]);
      console.log(error); //直接打印完整的error对象
      // Util.default.assertAsString(error.message); //通常不需要这行，因为error.message已经是字符串。
    }
  }
}

export { Client }; // 使用 export 导出
Client.main(process.argv.slice(2));

