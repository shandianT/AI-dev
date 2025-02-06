import * as XLSX from 'xlsx';
import nodemailer from 'nodemailer';
import chokidar from 'chokidar';
import { Node, Edge } from 'reactflow';

interface WorkflowContext {
  data: any;
  variables: Record<string, any>;
}

interface MailOptions {
  from: string;
  to: string;
  subject: string;
  text: string;
  attachments: Array<{
    filename: string;
    content: Buffer;
  }>;
}

class WorkflowEngine {
  private nodes: Node[];
  private edges: Edge[];
  private context: WorkflowContext;

  constructor(nodes: Node[], edges: Edge[]) {
    this.nodes = nodes;
    this.edges = edges;
    this.context = {
      data: null,
      variables: {},
    };
  }

  private async executeNode(node: Node): Promise<void> {
    const { type, ...config } = node.data;

    try {
      switch (type) {
        case 'excel_input':
          await this.handleExcelInput(config);
          break;
        case 'filter':
          await this.handleFilter(config);
          break;
        case 'transform':
          await this.handleTransform(config);
          break;
        case 'email':
          await this.handleEmail(config);
          break;
        case 'save_file':
          await this.handleSaveFile(config);
          break;
        case 'file_watch':
          await this.handleFileWatch(config);
          break;
        case 'timer':
          await this.handleTimer(config);
          break;
      }
    } catch (error) {
      console.error(`Error executing node ${node.id}:`, error);
      throw error;
    }
  }

  private async handleExcelInput(config: any): Promise<void> {
    const { filePath, sheetName, hasHeader } = config;
    const workbook = XLSX.readFile(filePath);
    const sheet = sheetName
      ? workbook.Sheets[sheetName]
      : workbook.Sheets[workbook.SheetNames[0]];
    
    this.context.data = XLSX.utils.sheet_to_json(sheet, {
      header: hasHeader ? undefined : 1,
    });
  }

  private async handleFilter(config: any): Promise<void> {
    const { filterType, condition } = config;
    let filteredData = [...this.context.data];

    switch (filterType) {
      case 'condition':
        // 简单的条件解析器
        const conditions = condition.split('且').map((c: string) => {
          const [field, op, value] = c.trim().split(/\s+/);
          return { field, op, value: value.replace(/['"]/g, '') };
        });

        filteredData = filteredData.filter((row) => {
          return conditions.every((cond: any) => {
            const fieldValue = row[cond.field];
            switch (cond.op) {
              case '>': return fieldValue > cond.value;
              case '<': return fieldValue < cond.value;
              case '=': return fieldValue === cond.value;
              case '>=': return fieldValue >= cond.value;
              case '<=': return fieldValue <= cond.value;
              default: return false;
            }
          });
        });
        break;

      case 'duplicate':
        const seen = new Set();
        filteredData = filteredData.filter((row) => {
          const key = JSON.stringify(row);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        break;

      case 'empty':
        filteredData = filteredData.filter((row) => {
          return Object.values(row).every((value) => value !== null && value !== '');
        });
        break;
    }

    this.context.data = filteredData;
  }

  private async handleTransform(config: any): Promise<void> {
    const { transformType, rules } = config;
    let transformedData = [...this.context.data];
    const rulesObj = JSON.parse(rules);

    switch (transformType) {
      case 'format':
        transformedData = transformedData.map((row) => {
          const newRow = { ...row };
          Object.entries(rulesObj).forEach(([field, format]: [string, any]) => {
            if (row[field]) {
              // 这里可以添加更多格式化规则
              if (format.includes('YYYY')) {
                newRow[field] = new Date(row[field]).toISOString().split('T')[0];
              } else if (format.includes('¥')) {
                newRow[field] = new Intl.NumberFormat('zh-CN', {
                  style: 'currency',
                  currency: 'CNY',
                }).format(row[field]);
              }
            }
          });
          return newRow;
        });
        break;

      case 'calculate':
        // 实现计算逻辑
        break;

      case 'merge':
        // 实现列合并逻辑
        break;

      case 'split':
        // 实现列拆分逻辑
        break;
    }

    this.context.data = transformedData;
  }

  private async handleEmail(config: any): Promise<void> {
    const { to, subject, body, attachExcel } = config;

    const transporter = nodemailer.createTransport({
      // 配置邮件服务器信息
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: {
        user: 'your-email@example.com',
        pass: 'your-password',
      },
    });

    const mailOptions: MailOptions = {
      from: 'your-email@example.com',
      to,
      subject: '数据分析报告',
      text: '请查看附件中的数据分析报告。',
      attachments: []
    };

    if (attachExcel && this.context.data) {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(this.context.data);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      mailOptions.attachments.push({
        filename: '数据.xlsx',
        content: excelBuffer,
      });
    }

    await transporter.sendMail(mailOptions);
  }

  private async handleSaveFile(config: any): Promise<void> {
    const { savePath, format } = config;

    switch (format) {
      case 'xlsx':
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(this.context.data);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        XLSX.writeFile(workbook, savePath);
        break;

      case 'csv':
        const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(this.context.data));
        // 使用 Node.js 的 fs 模块写入文件
        break;

      case 'json':
        // 使用 Node.js 的 fs 模块写入 JSON 文件
        break;
    }
  }

  private async handleFileWatch(config: any): Promise<void> {
    const { watchPath, pattern } = config;
    
    const watcher = chokidar.watch(pattern, {
      cwd: watchPath,
      ignoreInitial: false,
    });

    watcher.on('add', async (path) => {
      console.log(`File ${path} has been added`);
      // 触发工作流
      await this.execute();
    });
  }

  private async handleTimer(config: any): Promise<void> {
    const { triggerType, interval, time } = config;

    switch (triggerType) {
      case 'interval':
        setInterval(() => {
          this.execute();
        }, interval * 60 * 1000);
        break;

      case 'daily':
      case 'weekly':
      case 'monthly':
        // 使用 node-schedule 实现定时任务
        break;
    }
  }

  public async execute(): Promise<void> {
    // 找到入口节点（没有入边的节点）
    const startNodes = this.nodes.filter((node) => {
      return !this.edges.some((edge) => edge.target === node.id);
    });

    // 从每个入口节点开始执行
    for (const startNode of startNodes) {
      await this.executeNode(startNode);

      // 获取后续节点并执行
      let currentNode = startNode;
      while (true) {
        const nextEdge = this.edges.find((edge) => edge.source === currentNode.id);
        if (!nextEdge) break;

        const nextNode = this.nodes.find((node) => node.id === nextEdge.target);
        if (!nextNode) break;

        await this.executeNode(nextNode);
        currentNode = nextNode;
      }
    }
  }
}

export default WorkflowEngine; 