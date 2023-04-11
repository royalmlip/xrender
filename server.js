const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
var exec = require("child_process").exec;
const os = require("os");
const { createProxyMiddleware } = require("http-proxy-middleware");
var request = require("request");
var sh = require('shelljs');
var wspath = sh.exec('echo $RANDOM | sha1sum | head -c 6', { silent: true }).stdout;
var fs = require("fs");
var path = require("path");
//const fetch = require("node-fetch");
const render_app_url = "https://" + process.env.RENDER_EXTERNAL_HOSTNAME;

app.get("/", (req, res) => {
  res.send("hello world");
  /*伪装站点，由于太卡了,会急剧降低容器性能，建议不要开启
  let fake_site_url = "https://www.qidian.com/"
  fetch(fake_site_url).then((res) => res.text()).then((html) => res.send(html));
  */
});

app.get("/status", (req, res) => {
  let cmdStr = "ps -ef";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.type("html").send("<pre>命令行执行出错：\n" + err + "</pre>");
    } else {
      res.type("html").send("<pre>命令行执行结果：\n" + stdout + "</pre>");
    }
  });
});

//启动web
app.get("/start", (req, res) => {
  let cmdStr =
    "bash start.sh";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.send("命令行执行错误：" + err);
    } else {
      console.log("Share Link: " + stdout);
      res.send("命令行执行结果：" + "启动成功!");
    }
  });
});

app.get("/info", (req, res) => {
  let cmdStr = "cat /etc/*release | grep -E ^NAME";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.send("命令行执行错误：" + err);
    } else {
      res.send(
        "命令行执行结果：\n" +
          "Linux System:" +
          stdout +
          "\nRAM:" +
          os.totalmem() / 1000 / 1000 +
          "MB"
      );
    }
  });
});

//文件系统只读测试
app.get("/test", (req, res) => {
  fs.writeFile("./test.txt", "这里是新创建的文件内容!", function (err) {
    if (err) res.send("创建文件失败，文件系统权限为只读：" + err);
    else res.send("创建文件成功，文件系统权限为非只读：");
  });
});


//以下是web.js模块的路由重写
app.use(
  '/' + wspath + '*',
  createProxyMiddleware({
    target: "http://127.0.0.1:8080/", // 需要跨域处理的请求地址
    changeOrigin: true, // 默认false，是否需要改变原始主机头为目标URL
    ws: true,
    logLevel: 'error',
    onProxyReq: function onProxyReq(proxyReq, req, res) { },
  })

/* keepalive  begin */
function keepalive() {
  // 1.请求主页，保持唤醒
  exec("curl " + render_app_url, function (err, stdout, stderr) {
  });

  // 2.请求服务器进程状态列表，若web没在运行，则调起
  exec("curl " + render_app_url + "/status", function (err, stdout, stderr) {
    if (!err) {
      if (stdout.indexOf("./web.js -c /tmp/config.yaml") != -1) {
      } else {
        //web未运行，命令行调起
        exec(
          "/bin/bash start.sh"
        );
      }
    } else console.log("保活-请求服务器进程表-命令行执行错误: " + err);
  });
}

//保活频率设置为30秒
setInterval(keepalive, 30 * 1000);
/* keepalive  end */


// 初始化，下载web
function download_web(callback) {
  let cmdStr =
    "/bin/bash start.sh";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      console.log("命令行执行错误：" + err);
    } else {
      console.log("Share Link：" + stdout);
    }
  });
}
download_web((err) => {
  if (err) console.log("初始化-下载web文件失败");
  else console.log("初始化-下载web文件成功");
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
// 初始化，下载web
function download_web(callback) {
  let cmdStr =
    "/bin/bash start.sh";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      console.log("命令行执行错误：" + err);
    } else {
      console.log("Share Link：" + stdout);
    }
  });
}
download_web((err) => {
  if (err) console.log("初始化-下载web文件失败");
  else console.log("初始化-下载web文件成功");
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
