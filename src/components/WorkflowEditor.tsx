import React, { useCallback, DragEvent, useState } from 'react';
import ReactFlow, {
  Node,
  Controls,
  Background,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  NodeTypes,
  Edge,
  XYPosition,
  NodeChange,
  applyNodeChanges,
} from 'reactflow';
import { Box, Button, Snackbar, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SettingsIcon from '@mui/icons-material/Settings';
import 'reactflow/dist/style.css';

import CustomNode from './CustomNode';
import ToolPanel from './ToolPanel';
import NodeConfigPanel from './NodeConfigPanel';
import PreSalesWorkflowEngine from '../services/PreSalesWorkflowEngine';
import { NodeData } from './CustomNode';

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

let id = 0;
const getId = () => `node_${id++}`;

const createNode = (type: string, position: XYPosition): Node<NodeData> => ({
  id: getId(),
  type: 'custom',
  position,
  data: { label: type, type },
});

const WorkflowEditor: React.FC = () => {
  const [nodes, setNodes] = useState<Node<NodeData>[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('openai_api_key') || '');

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    []
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = {
        x: event.clientX - 280,
        y: event.clientY,
      };

      const newNode = createNode(type, position);
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node<NodeData>) => {
    event.stopPropagation();
    setSelectedNode(node);
  }, []);

  const onConfigChange = useCallback((nodeId: string, newData: NodeData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: { ...node.data, ...newData },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const validateWorkflow = () => {
    // 检查是否有节点
    if (nodes.length === 0) {
      throw new Error('工作流中没有节点');
    }

    // 检查节点配置
    for (const node of nodes) {
      const { type } = node.data;
      const config = node.data;
      
      switch (type) {
        case 'requirement_analysis':
          if (!config.requirements?.length) {
            throw new Error('需求分析节点未配置需求描述');
          }
          break;
        case 'ai_solution':
          if (!config.prompt) {
            throw new Error('AI方案生成节点未配置提示词');
          }
          break;
        case 'doc_template':
          if (!config.templatePath) {
            throw new Error('文档模板节点未上传模板');
          }
          break;
        case 'solution_doc':
          if (!config.title || !config.sections?.length) {
            throw new Error('方案文档节点配置不完整');
          }
          break;
        case 'competitor_analysis':
          if (!config.competitors?.length) {
            throw new Error('竞品分析节点未配置竞品');
          }
          break;
        case 'quote_generator':
          if (!config.projectName || !config.quoteItems?.length) {
            throw new Error('报价生成节点配置不完整');
          }
          break;
        case 'project_plan':
          if (!config.phases?.length) {
            throw new Error('项目规划节点未配置项目阶段');
          }
          break;
        case 'qa_generator':
          if (!config.description || !config.qaTypes?.length) {
            throw new Error('问答生成节点配置不完整');
          }
          break;
      }
    }

    // 检查连接
    if (edges.length === 0 && nodes.length > 1) {
      throw new Error('节点之间未建立连接');
    }
  };

  const handleSaveConfig = () => {
    localStorage.setItem('openai_api_key', apiKey);
    setConfigOpen(false);
    setSnackbarMessage('API Key已保存');
    setSnackbarOpen(true);
  };

  const handleRunWorkflow = async () => {
    try {
      setIsRunning(true);
      
      // 验证工作流配置
      validateWorkflow();

      // 检查 API Key
      const savedApiKey = localStorage.getItem('openai_api_key');
      if (!savedApiKey) {
        throw new Error('未配置 OpenAI API Key');
      }

      const engine = new PreSalesWorkflowEngine(nodes, edges, savedApiKey);
      const result = await engine.execute();
      
      setSnackbarMessage('工作流执行成功！');
      setSnackbarOpen(true);
      
      // 处理执行结果
      console.log('工作流执行结果:', result);
      
    } catch (error) {
      console.error('工作流执行失败:', error);
      setSnackbarMessage(error instanceof Error ? error.message : '工作流执行失败，请检查配置和连接');
      setSnackbarOpen(true);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <ToolPanel onDragStart={(event, nodeType) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
      }} />
      <Box sx={{ flexGrow: 1, height: '100%', position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
        <Box sx={{ position: 'absolute', bottom: 20, right: 20, display: 'flex', gap: 1 }}>
          <IconButton
            color="primary"
            onClick={() => setConfigOpen(true)}
            sx={{ bgcolor: 'background.paper' }}
          >
            <SettingsIcon />
          </IconButton>
          <Button
            variant="contained"
            color="primary"
            startIcon={isRunning ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
            onClick={handleRunWorkflow}
            disabled={isRunning}
          >
            {isRunning ? '执行中...' : '运行工作流'}
          </Button>
        </Box>
      </Box>
      <NodeConfigPanel
        selectedNode={selectedNode}
        onConfigChange={onConfigChange}
      />
      <Dialog open={configOpen} onClose={() => setConfigOpen(false)}>
        <DialogTitle>配置</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="OpenAI API Key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            margin="normal"
            helperText="请输入您的OpenAI API Key"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigOpen(false)}>取消</Button>
          <Button onClick={handleSaveConfig} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default WorkflowEditor; 