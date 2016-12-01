'use strict';

// 引入模块
var http = require('http');
var fs = require('fs');
var path = require('path');
var cheerio = require('cheerio');

// 爬虫的URL信息
var opt = {
    hostname: 'bj.meituan.com',
    path: '/category/meishi',
    port: 80
};

// 创建http get请求
http.get(opt, function (res) {
    var html = ''; // 保存抓取到的HTML源码
    var foods = [];  // 保存解析HTML后的数据，即我们需要的美食信息

    // 前面说过
    // 这里的 res 是 Class: http.IncomingMessage 的一个实例
    // 而 http.IncomingMessage 实现了 stream.Readable 接口
    // 所以 http.IncomingMessage 也有 stream.Readable 的事件和方法
    // 比如 Event: 'data', Event: 'end', readable.setEncoding() 等

    // 设置编码
    res.setEncoding('utf-8');

    // 抓取页面内容
    res.on('data', function (chunk) {
        html += chunk;
    });

    res.on('end', function () {
        // 使用 cheerio 加载抓取到的HTML代码
        // 然后就可以使用 jQuery 的方法了
        // 比如获取某个class：$('.className')
        // 这样就能获取所有这个class包含的内容
        var $ = cheerio.load(html);

        // 解析页面
        // 每个美食都在 item class 中
        $('.poi-tile-nodeal').each(function () {
            // 获取图片链接
            var picUrl = $('img', this).attr('src');
            var food = {
                title: $('.poi-tile__info a', this).text(), // 获取美食名称
                price: $('.poi-tile__money a .value', this).text(), // 获取美食评分
                link: $('.poi-tile__head', this).attr('href'), // 获取美食详情页链接
                picUrl: picUrl
            };
            // 把所有美食放在一个数组里面
            foods.push(food);
            downloadImg('img/', food.picUrl);
        });

        saveData('./data/food.json', foods);
    });
}).on('error', function (err) {
    console.log(err);
});


/**
 保存数据到本地
 @param {string} path 保存数据的文件
 @param {array} foods 美食信息数组
 **/
function saveData(path, foods) {
    // 调用 fs.writeFile 方法保存数据到本地
    fs.writeFile(path, JSON.stringify(foods, null, 4), function (err) {
        if (err) {
            return console.log(err);
        }
        console.log('Data saved');
    });
}

/**
 下载图片
 @param {string} imgDir 存放图片的文件夹
 @param {string} url 图片的URL地址
 **/
function downloadImg(imgDir, url) {
    http.get(url, function (res) {
        var data = '';

        res.setEncoding('binary');

        res.on('data', function (chunk) {
            data += chunk;
        });

        res.on('end', function () {
            // 调用 fs.writeFile 方法保存图片到本地
            fs.writeFile(imgDir + path.basename(url), data, 'binary', function (err) {
                if (err) {
                    return console.log(err);
                }
                console.log('Image downloaded: ', path.basename(url));
            });
        });
    }).on('error', function (err) {
        console.log(err);
    });
}