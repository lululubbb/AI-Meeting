   // backend-express/services/trans.cjs
   'use strict';

   import alimt20181012 from '@alicloud/alimt20181012';
   import * as OpenApi from '@alicloud/openapi-client';
   import * as Util from '@alicloud/tea-util';
   
   //无需再使用动态导入

   class Client {
       static createClient() {
           let config = new OpenApi.Config({
               accessKeyId: "LTAI5tQhyJpfza5PCkxhtJUX",
               accessKeySecret: "mvFFWIuRWmW7orJI5iyXtMT9YyyuL3",
           });
           config.endpoint = `mt.cn-hangzhou.aliyuncs.com`;
           return new alimt20181012.default(config); //  使用 .default
       }
     static async translate(text, sourceLanguage, targetLanguage) {
         let client = Client.createClient();
           let translateGeneralRequest = new alimt20181012.TranslateGeneralRequest({
           formatType: 'text',
           sourceLanguage: sourceLanguage,
           targetLanguage: targetLanguage,
           sourceText: text,
           });
           let runtime = new Util.RuntimeOptions({});

       const response = await client.translateGeneralWithOptions(translateGeneralRequest, runtime);

         return response.body.data.translated;
       }
   }

   export { Client };  //ES module的导出
