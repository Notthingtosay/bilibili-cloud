const express = require('express');
const axios = require('axios');
const cors = require('cors'); 
const path = require('path');
const zlib = require('zlib'); 

const app = express();

// 🟢【核心修改】🟢
// 让端口动态适应云环境 (Render 会自动设置 process.env.PORT)
// 如果在本地运行，process.env.PORT 为空，就会回退使用 3000
const PORT = process.env.PORT || 3000; 

// 开启 CORS 跨域支持
app.use(cors());

// 托管 public 文件夹下的静态文件 (即你的网页)
app.use(express.static('public'));

// B站 API 请求头伪装 (防止被拦截)
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.bilibili.com/',
    'Origin': 'https://www.bilibili.com'
};

// 接口 1: 获取视频信息 (主要为了拿到 CID)
app.get('/api/view', async (req, res) => {
    const bvid = req.query.bvid;
    if (!bvid) return res.status(400).json({ error: 'Missing bvid' });

    try {
        const response = await axios.get(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, {
            headers: HEADERS
        });
        res.json(response.data);
    } catch (error) {
        console.error('View API Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch video info' });
    }
});

// 接口 2: 获取弹幕 XML
app.get('/api/dm', async (req, res) => {
    const cid = req.query.cid;
    if (!cid) return res.status(400).json({ error: 'Missing cid' });

    try {
        // 请求 B站弹幕文件
        const response = await axios.get(`https://comment.bilibili.com/${cid}.xml`, {
            headers: HEADERS,
            responseType: 'arraybuffer', // 关键：以二进制方式获取，防止乱码
            decompress: true // axios 自动解压 gzip/deflate
        });

        // 转换 Buffer 为字符串
        let xmlText = response.data.toString('utf-8');
        
        // 设置响应头为 XML
        res.set('Content-Type', 'text/xml');
        res.send(xmlText);

    } catch (error) {
        console.error('Danmaku API Error:', error.message);
        res.status(500).send('Failed to fetch danmaku');
    }
});

// 启动服务
// 🟢 修改点：增加 '0.0.0.0' 参数，强制监听所有网卡
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ 服务已启动！`);
    console.log(`👉 监听端口: ${PORT}`); 
    console.log(`👉 本地测试请访问: http://localhost:${PORT}\n`);
});
