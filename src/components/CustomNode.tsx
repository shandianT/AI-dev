import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Paper, Typography, Box, Chip, Tooltip } from '@mui/material';
import {
  Description as DescriptionIcon,
  Compare as CompareIcon,
  AttachMoney as AttachMoneyIcon,
  Timeline as TimelineIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Functions as FunctionsIcon,
} from '@mui/icons-material';

export interface NodeData {
  label: string;
  type: string;
  requirements?: string[];
  industry?: string;
  requirementTypes?: string[];
  model?: string;
  prompt?: string;
  solutionParts?: string[];
  templateType?: string;
  templateFile?: File;
  templatePath?: string;
  title?: string;
  sections?: string[];
  format?: string;
  competitors?: string[];
  comparePoints?: string[];
  projectName?: string;
  duration?: number;
  teamSize?: number;
  quoteItems?: string[];
  phases?: { name: string; duration: string }[];
  resources?: string[];
  description?: string;
  qaTypes?: string[];
  count?: number;
}

const getNodeIcon = (type: string) => {
  switch (type) {
    case 'requirement_analysis':
      return <DescriptionIcon />;
    case 'ai_solution':
      return <FunctionsIcon />;
    case 'doc_template':
      return <DescriptionIcon />;
    case 'solution_doc':
      return <DescriptionIcon />;
    case 'competitor_analysis':
      return <CompareIcon />;
    case 'quote_generator':
      return <AttachMoneyIcon />;
    case 'project_plan':
      return <TimelineIcon />;
    case 'qa_generator':
      return <QuestionAnswerIcon />;
    default:
      return null;
  }
};

const getNodeStatus = (data: NodeData): '已配置' | '未配置' => {
  if (!data.type) return '未配置';

  switch (data.type) {
    case 'requirement_analysis':
      return data.requirements?.length ? '已配置' : '未配置';
    case 'ai_solution':
      return data.prompt ? '已配置' : '未配置';
    case 'doc_template':
      return data.templatePath ? '已配置' : '未配置';
    case 'solution_doc':
      return data.title ? '已配置' : '未配置';
    case 'competitor_analysis':
      return data.competitors?.length ? '已配置' : '未配置';
    case 'quote_generator':
      return data.projectName ? '已配置' : '未配置';
    case 'project_plan':
      return data.phases?.length ? '已配置' : '未配置';
    case 'qa_generator':
      return data.description ? '已配置' : '未配置';
    default:
      return '未配置';
  }
};

const CustomNode = ({ data }: NodeProps<NodeData>) => {
  const status = getNodeStatus(data);

  return (
    <Paper
      elevation={3}
      sx={{
        padding: 2,
        minWidth: 200,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Handle type="target" position={Position.Top} />
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Box sx={{ mr: 1 }}>{getNodeIcon(data.type)}</Box>
        <Typography variant="subtitle1">
          {data.label}
        </Typography>
      </Box>
      <Tooltip title="点击节点进行配置">
        <Chip
          label={status}
          size="small"
          color={status === '已配置' ? 'success' : 'warning'}
          sx={{ mt: 1 }}
        />
      </Tooltip>
      <Handle type="source" position={Position.Bottom} />
    </Paper>
  );
};

export default memo(CustomNode); 