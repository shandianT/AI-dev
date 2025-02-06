import React from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Autocomplete,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import { Node } from 'reactflow';
import { NodeData } from './CustomNode';

interface NodeConfigPanelProps {
  selectedNode: Node<NodeData> | null;
  onConfigChange: (nodeId: string, config: NodeData) => void;
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  selectedNode,
  onConfigChange,
}) => {
  if (!selectedNode) {
    return (
      <Paper sx={{ p: 2, width: 300 }}>
        <Typography variant="body1" color="text.secondary">
          请选择一个节点进行配置
        </Typography>
      </Paper>
    );
  }

  const handleConfigChange = (key: keyof NodeData, value: any) => {
    const newConfig = {
      ...selectedNode.data,
      [key]: value,
    };
    onConfigChange(selectedNode.id, newConfig);
  };

  const renderConfigFields = () => {
    switch (selectedNode.data.type) {
      case 'requirement_analysis':
        return (
          <>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="客户需求描述"
              value={selectedNode.data.requirements || ''}
              onChange={(e) => handleConfigChange('requirements', e.target.value.split('\n'))}
              margin="normal"
              helperText="输入客户原始需求描述，每行一个需求"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>行业类型</InputLabel>
              <Select
                value={selectedNode.data.industry || ''}
                onChange={(e) => handleConfigChange('industry', e.target.value)}
              >
                <MenuItem value="finance">金融</MenuItem>
                <MenuItem value="manufacturing">制造业</MenuItem>
                <MenuItem value="retail">零售</MenuItem>
                <MenuItem value="internet">互联网</MenuItem>
                <MenuItem value="government">政府</MenuItem>
              </Select>
            </FormControl>
            <Autocomplete
              multiple
              options={['功能需求', '性能需求', '安全需求', '集成需求', '运维需求']}
              value={selectedNode.data.requirementTypes || []}
              onChange={(e, newValue) => handleConfigChange('requirementTypes', newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="需求类型"
                  margin="normal"
                />
              )}
            />
          </>
        );

      case 'ai_solution':
        return (
          <>
            <FormControl fullWidth margin="normal">
              <InputLabel>AI模型</InputLabel>
              <Select
                value={selectedNode.data.model || 'gpt4'}
                onChange={(e) => handleConfigChange('model', e.target.value)}
              >
                <MenuItem value="gpt4">GPT-4</MenuItem>
                <MenuItem value="gpt35">GPT-3.5</MenuItem>
                <MenuItem value="claude">Claude</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="提示词模板"
              value={selectedNode.data.prompt || ''}
              onChange={(e) => handleConfigChange('prompt', e.target.value)}
              margin="normal"
              helperText="设置AI提示词模板"
            />
            <Autocomplete
              multiple
              options={['技术方案', '架构设计', '部署方案', '集成方案', '扩展建议']}
              value={selectedNode.data.solutionParts || []}
              onChange={(e, newValue) => handleConfigChange('solutionParts', newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="方案组成部分"
                  margin="normal"
                />
              )}
            />
          </>
        );

      case 'doc_template':
        return (
          <>
            <FormControl fullWidth margin="normal">
              <InputLabel>模板类型</InputLabel>
              <Select
                value={selectedNode.data.templateType || ''}
                onChange={(e) => handleConfigChange('templateType', e.target.value)}
              >
                <MenuItem value="technical">技术方案</MenuItem>
                <MenuItem value="proposal">项目建议书</MenuItem>
                <MenuItem value="architecture">架构设计</MenuItem>
                <MenuItem value="implementation">实施方案</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ mt: 2, mb: 2 }}>
              <input
                accept=".docx,.pdf,.pptx"
                style={{ display: 'none' }}
                id="template-file-upload"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleConfigChange('templateFile', file);
                    handleConfigChange('templatePath', file.name);
                  }
                }}
              />
              <label htmlFor="template-file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  startIcon={<DescriptionIcon />}
                >
                  上传模板文件
                </Button>
              </label>
            </Box>
            <TextField
              fullWidth
              label="模板路径"
              value={selectedNode.data.templatePath || ''}
              disabled
              margin="normal"
              helperText="已选择的文档模板文件"
            />
          </>
        );

      case 'solution_doc':
        return (
          <>
            <TextField
              fullWidth
              label="文档标题"
              value={selectedNode.data.title || ''}
              onChange={(e) => handleConfigChange('title', e.target.value)}
              margin="normal"
            />
            <Autocomplete
              multiple
              options={['封面', '目录', '需求分析', '方案概述', '技术架构', '实施计划', '投资收益']}
              value={selectedNode.data.sections || []}
              onChange={(e, newValue) => handleConfigChange('sections', newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="文档章节"
                  margin="normal"
                />
              )}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>输出格式</InputLabel>
              <Select
                value={selectedNode.data.format || 'docx'}
                onChange={(e) => handleConfigChange('format', e.target.value)}
              >
                <MenuItem value="docx">Word文档</MenuItem>
                <MenuItem value="pdf">PDF文档</MenuItem>
                <MenuItem value="pptx">PPT演示文稿</MenuItem>
              </Select>
            </FormControl>
          </>
        );

      case 'competitor_analysis':
        return (
          <>
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={selectedNode.data.competitors || []}
              onChange={(e, newValue) => handleConfigChange('competitors', newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="竞品列表"
                  margin="normal"
                  helperText="输入竞品名称，按回车添加"
                />
              )}
            />
            <Autocomplete
              multiple
              options={['功能特性', '技术架构', '性能指标', '安全性', '可扩展性', '价格']}
              value={selectedNode.data.comparePoints || []}
              onChange={(e, newValue) => handleConfigChange('comparePoints', newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="对比维度"
                  margin="normal"
                />
              )}
            />
          </>
        );

      case 'quote_generator':
        return (
          <>
            <TextField
              fullWidth
              label="项目名称"
              value={selectedNode.data.projectName || ''}
              onChange={(e) => handleConfigChange('projectName', e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              type="number"
              label="项目周期（月）"
              value={selectedNode.data.duration || ''}
              onChange={(e) => handleConfigChange('duration', parseInt(e.target.value))}
              margin="normal"
            />
            <TextField
              fullWidth
              type="number"
              label="团队规模（人）"
              value={selectedNode.data.teamSize || ''}
              onChange={(e) => handleConfigChange('teamSize', parseInt(e.target.value))}
              margin="normal"
            />
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={selectedNode.data.quoteItems || []}
              onChange={(e, newValue) => handleConfigChange('quoteItems', newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="报价项目"
                  margin="normal"
                  helperText="输入报价项目名称，按回车添加"
                />
              )}
            />
          </>
        );

      case 'project_plan':
        return (
          <>
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={selectedNode.data.phases || []}
              onChange={(e, newValue) => handleConfigChange('phases', newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="项目阶段"
                  margin="normal"
                  helperText="输入项目阶段名称，按回车添加"
                />
              )}
            />
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={selectedNode.data.resources || []}
              onChange={(e, newValue) => handleConfigChange('resources', newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="所需资源"
                  margin="normal"
                  helperText="输入所需资源名称，按回车添加"
                />
              )}
            />
          </>
        );

      case 'qa_generator':
        return (
          <>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="问题描述"
              value={selectedNode.data.description || ''}
              onChange={(e) => handleConfigChange('description', e.target.value)}
              margin="normal"
            />
            <Autocomplete
              multiple
              options={['功能问题', '技术问题', '性能问题', '安全问题', '集成问题']}
              value={selectedNode.data.qaTypes || []}
              onChange={(e, newValue) => handleConfigChange('qaTypes', newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="问题类型"
                  margin="normal"
                />
              )}
            />
            <TextField
              fullWidth
              type="number"
              label="生成数量"
              value={selectedNode.data.count || '10'}
              onChange={(e) => handleConfigChange('count', parseInt(e.target.value))}
              margin="normal"
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Paper sx={{ p: 2, width: 300, height: '100vh', overflowY: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        节点配置
      </Typography>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {selectedNode.data.label}
      </Typography>
      {renderConfigFields()}
    </Paper>
  );
};

export default NodeConfigPanel; 