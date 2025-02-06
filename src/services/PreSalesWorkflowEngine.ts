import { Node, Edge } from 'reactflow';
import axios from 'axios';
import * as XLSX from 'xlsx';
import * as docx from 'docx';
import DataCollectorService from './DataCollectorService';
import { NodeData } from '../components/CustomNode';

interface WorkflowContext {
  data: any;
  variables: Record<string, any>;
}

class PreSalesWorkflowEngine {
  private nodes: Node<NodeData>[];
  private edges: Edge[];
  private context: WorkflowContext;
  private apiKey: string;

  constructor(nodes: Node<NodeData>[], edges: Edge[], apiKey: string) {
    this.nodes = nodes;
    this.edges = edges;
    this.context = {
      data: null,
      variables: {},
    };
    this.apiKey = apiKey;
  }

  private async executeNode(node: Node<NodeData>): Promise<void> {
    const { type } = node.data;
    const config = node.data;

    try {
      switch (type) {
        case 'requirement_analysis':
          await this.handleRequirementAnalysis(config);
          break;
        case 'ai_solution':
          await this.handleAISolution(config);
          break;
        case 'doc_template':
          await this.handleDocTemplate(config);
          break;
        case 'solution_doc':
          await this.handleSolutionDoc(config);
          break;
        case 'competitor_analysis':
          await this.handleCompetitorAnalysis(config);
          break;
        case 'quote_generator':
          await this.handleQuoteGenerator(config);
          break;
        case 'project_plan':
          await this.handleProjectPlan(config);
          break;
        case 'qa_generator':
          await this.handleQAGenerator(config);
          break;
      }
    } catch (error) {
      console.error(`Error executing node ${node.id}:`, error);
      throw error;
    }
  }

  private async handleRequirementAnalysis(config: NodeData): Promise<void> {
    const { requirements, industry, requirementTypes } = config;
    
    // 获取行业相关数据
    const industryData = await DataCollectorService.getIndustryData(industry || '');
    const industryStandards = await DataCollectorService.getIndustryStandards(industry || '');
    const marketData = await DataCollectorService.getMarketData(industry || '');
    
    const prompt = `
    作为一名专业的需求分析师，请分析以下需求：
    
    客户需求：${requirements?.join('\n')}
    行业：${industry}
    需求类型：${requirementTypes?.join(', ')}
    
    行业标准：${JSON.stringify(industryStandards)}
    市场趋势：${JSON.stringify(marketData)}
    
    请提供：
    1. 需求要点提取
    2. 业务场景分析
    3. 关键痛点识别
    4. 系统边界定义
    5. 技术建议
    6. 行业最佳实践建议
    7. 市场趋势分析
    `;

    const response = await this.callAI(prompt);
    this.context.data = {
      requirements: requirements,
      analysis: response,
      industry: industry,
      types: requirementTypes,
      industryData,
      industryStandards,
      marketData,
    };
  }

  private async handleAISolution(config: NodeData): Promise<void> {
    const { model, prompt, solutionParts } = config;
    const requirements = this.context.data?.requirements || '';
    const analysis = this.context.data?.analysis || '';
    const industryData = this.context.data?.industryData || {};

    // 获取相关项目案例
    const cases = await DataCollectorService.getProjectCases(this.context.data?.industry);

    const aiPrompt = `
    作为一名解决方案架构师，请根据以下信息生成详细的解决方案：
    
    需求描述：${requirements}
    需求分析：${analysis}
    行业数据：${JSON.stringify(industryData)}
    相关案例：${JSON.stringify(cases)}
    
    请提供以下部分的详细方案：
    ${solutionParts?.join('\n')}
    
    ${prompt}
    
    请确保：
    1. 方案符合行业最佳实践
    2. 借鉴相关案例的成功经验
    3. 考虑行业特定需求
    4. 包含创新点和亮点
    `;

    const response = await this.callAI(aiPrompt);
    this.context.data = {
      ...this.context.data,
      solution: response,
      cases,
    };
  }

  private async handleDocTemplate(config: NodeData): Promise<void> {
    const { templateType, templatePath } = config;
    
    // 获取文档模板
    const templates = await DataCollectorService.getDocTemplates(templateType || '');
    
    // 如果提供了本地模板路径，则通过API获取模板内容
    let template = '';
    if (templatePath) {
      const response = await axios.get(`http://localhost:3001/api/templates/${templatePath}`);
      template = response.data.content;
    } else if (templates && templates.length > 0) {
      // 否则使用在线模板
      template = templates[0].content;
    }

    this.context.data = {
      ...this.context.data,
      template,
      templateType,
      templates,
    };
  }

  private async handleSolutionDoc(config: NodeData): Promise<void> {
    const { title, sections, format } = config;
    const solution = this.context.data?.solution || '';
    const template = this.context.data?.template || '';

    // 通过API生成文档
    const response = await axios.post('http://localhost:3001/api/documents/generate', {
      template,
      data: {
        title,
        sections,
        content: solution,
      },
      format,
    });

    this.context.data = {
      ...this.context.data,
      document: response.data,
    };
  }

  private async handleCompetitorAnalysis(config: NodeData): Promise<void> {
    const { competitors, comparePoints } = config;
    
    // 获取竞品数据
    const competitorData = await Promise.all(
      (competitors || []).map((competitor: string) => DataCollectorService.getCompetitorData(competitor))
    );
    
    const prompt = `
    作为一名市场分析师，请基于以下数据进行分析：
    
    竞争对手数据：${JSON.stringify(competitorData)}
    对比维度：${comparePoints?.join(', ')}
    
    请提供：
    1. 详细的对比分析
    2. 竞争优势分析
    3. 应对策略建议
    4. 市场机会分析
    5. 差异化策略建议
    `;

    const response = await this.callAI(prompt);
    this.context.data = {
      ...this.context.data,
      competitorAnalysis: response,
      competitorData,
    };
  }

  private async handleQuoteGenerator(config: NodeData): Promise<void> {
    const { projectName, duration, teamSize, quoteItems } = config;
    
    // 获取市场价格数据
    const marketData = await DataCollectorService.getMarketData(this.context.data?.industry || '');
    
    // 通过API生成报价
    const response = await axios.post('http://localhost:3001/api/quotes/generate', {
      projectName,
      duration,
      teamSize,
      items: quoteItems,
      marketData: marketData?.pricing,
    });

    this.context.data = {
      ...this.context.data,
      quote: response.data,
    };
  }

  private async handleProjectPlan(config: NodeData): Promise<void> {
    const { phases, duration, resources } = config;
    
    // 获取项目案例数据
    const cases = await DataCollectorService.getProjectCases(this.context.data?.industry || '');
    
    const prompt = `
    作为一名项目经理，请根据以下信息生成项目实施计划：
    
    项目阶段：${phases?.map(p => p.name).join(', ')}
    计划工期：${duration}天
    所需资源：${resources?.join(', ')}
    相关案例：${JSON.stringify(cases)}
    
    请提供：
    1. 详细的项目里程碑
    2. 资源分配计划
    3. 风险管理计划
    4. 质量保证措施
    5. 经验教训借鉴
    6. 关键成功因素
    `;

    const response = await this.callAI(prompt);
    this.context.data = {
      ...this.context.data,
      projectPlan: response,
      cases,
    };
  }

  private async handleQAGenerator(config: NodeData): Promise<void> {
    const { description, qaTypes, count } = config;
    
    // 获取相关数据
    const industryData = this.context.data?.industryData;
    const competitorData = this.context.data?.competitorData;
    
    const prompt = `
    请根据以下信息生成${count}个常见问题和答案：
    
    产品/方案描述：${description}
    问题类型：${qaTypes?.join(', ')}
    行业数据：${JSON.stringify(industryData)}
    竞品数据：${JSON.stringify(competitorData)}
    
    请确保：
    1. 问题覆盖所有指定类型
    2. 答案准确且专业
    3. 包含技术细节和业务价值
    4. 包含竞品对比优势
    5. 突出行业理解
    `;

    const response = await this.callAI(prompt);
    this.context.data = {
      ...this.context.data,
      qa: response,
    };
  }

  private async callAI(prompt: string): Promise<string> {
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的售前解决方案专家，精通技术方案撰写、项目规划和商务沟通。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('AI API调用失败:', error);
      throw error;
    }
  }

  public async execute(): Promise<any> {
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

    return this.context.data;
  }
}

export default PreSalesWorkflowEngine; 