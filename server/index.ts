import express, { Request, Response } from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { createConnection } from 'typeorm';
import { File } from './entity/File';
import * as docx from 'docx';

// 确保上传目录存在
import fs from 'fs';
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const app = express();
const port = process.env.PORT || 3001;

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// 配置中间件
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// 数据库连接
createConnection().then(() => {
  console.log('数据库连接成功');
}).catch(error => {
  console.error('数据库连接失败:', error);
});

// 文件上传接口
app.post('/api/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }

    const file = new File();
    file.filename = req.file.originalname;
    file.path = req.file.path;
    file.mimetype = req.file.mimetype;
    file.size = req.file.size;
    
    await file.save();

    res.json({
      url: `http://localhost:${port}/${req.file.path}`,
      filename: req.file.originalname,
      path: req.file.path,
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({ message: '文件上传失败' });
  }
});

// 文件列表接口
app.get('/api/files', async (req: Request, res: Response) => {
  try {
    const files = await File.find();
    res.json(files);
  } catch (error) {
    console.error('获取文件列表失败:', error);
    res.status(500).json({ message: '获取文件列表失败' });
  }
});

// 获取模板内容
app.get('/api/templates/:path', async (req: Request, res: Response) => {
  try {
    const templatePath = path.join('uploads', req.params.path);
    const content = await fs.promises.readFile(templatePath, 'utf-8');
    res.json({ content });
  } catch (error) {
    console.error('获取模板内容失败:', error);
    res.status(500).json({ message: '获取模板内容失败' });
  }
});

// 生成文档
app.post('/api/documents/generate', async (req: Request, res: Response) => {
  try {
    const { template, data, format } = req.body;

    let buffer: Buffer;
    switch (format) {
      case 'docx':
        const doc = new docx.Document({
          sections: [{
            properties: {},
            children: [
              new docx.Paragraph({
                children: [new docx.TextRun(data.content)],
              }),
            ],
          }],
        });
        buffer = await docx.Packer.toBuffer(doc);
        break;
      case 'pdf':
        // TODO: 实现PDF生成
        buffer = Buffer.from('');
        break;
      case 'pptx':
        // TODO: 实现PPT生成
        buffer = Buffer.from('');
        break;
      default:
        throw new Error(`不支持的文档格式: ${format}`);
    }

    const file = new File();
    file.filename = `${data.title}.${format}`;
    file.path = `uploads/${Date.now()}-${file.filename}`;
    file.mimetype = `application/${format}`;
    file.size = buffer.length;
    
    await fs.promises.writeFile(file.path, buffer);
    await file.save();

    res.json({
      url: `http://localhost:${port}/${file.path}`,
      filename: file.filename,
      path: file.path,
    });
  } catch (error) {
    console.error('生成文档失败:', error);
    res.status(500).json({ message: '生成文档失败' });
  }
});

// 生成报价
app.post('/api/quotes/generate', async (req: Request, res: Response) => {
  try {
    const { projectName, duration, teamSize, items, marketData } = req.body;

    const calculatePrice = (item: string, duration: number, teamSize: number, marketData: any) => {
      const basePrice = {
        '软件许可': 10000,
        '硬件设备': 50000,
        '实施服务': 20000,
        '运维服务': 15000,
        '培训服务': 5000,
      }[item] || 0;

      const marketPrice = marketData?.[item] || basePrice;
      const adjustedPrice = (basePrice + marketPrice) / 2;
      return adjustedPrice * duration * (teamSize / 5);
    };

    const quote = {
      projectName,
      duration,
      teamSize,
      items: items.map((item: string) => ({
        name: item,
        price: calculatePrice(item, duration, teamSize, marketData),
      })),
      marketReference: marketData,
    };

    res.json(quote);
  } catch (error) {
    console.error('生成报价失败:', error);
    res.status(500).json({ message: '生成报价失败' });
  }
});

app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
}); 