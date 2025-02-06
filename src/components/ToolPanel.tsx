import React from 'react';
import {
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
} from '@mui/material';
import {
  Description as DocIcon,
  Chat as ChatIcon,
  AutoAwesome as AIIcon,
  PriceCheck as QuoteIcon,
  Compare as CompareIcon,
  Assignment as RequirementIcon,
  Timeline as ProjectIcon,
  Folder as TemplateIcon,
} from '@mui/icons-material';

const tools = [
  {
    id: 'requirement_analysis',
    name: '需求分析',
    description: '分析和提取客户需求要点',
    icon: <RequirementIcon />,
  },
  {
    id: 'ai_solution',
    name: 'AI方案生成',
    description: '调用AI生成解决方案',
    icon: <AIIcon />,
  },
  {
    id: 'doc_template',
    name: '文档模板',
    description: '加载和使用文档模板',
    icon: <TemplateIcon />,
  },
  {
    id: 'solution_doc',
    name: '方案文档',
    description: '生成完整的解决方案文档',
    icon: <DocIcon />,
  },
  {
    id: 'competitor_analysis',
    name: '竞品分析',
    description: '生成竞品对比分析',
    icon: <CompareIcon />,
  },
  {
    id: 'quote_generator',
    name: '报价生成',
    description: '生成项目报价方案',
    icon: <QuoteIcon />,
  },
  {
    id: 'project_plan',
    name: '项目规划',
    description: '生成项目实施计划',
    icon: <ProjectIcon />,
  },
  {
    id: 'qa_generator',
    name: '问答生成',
    description: '生成常见问题解答',
    icon: <ChatIcon />,
  },
];

interface ToolPanelProps {
  onDragStart: (event: React.DragEvent<HTMLLIElement>, nodeType: string) => void;
}

const ToolPanel: React.FC<ToolPanelProps> = ({ onDragStart }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        width: 280,
        height: '100vh',
        overflowY: 'auto',
        borderRight: 1,
        borderColor: 'divider',
        borderRadius: 0,
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          售前工具箱
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          拖拽节点到右侧画布创建工作流
        </Typography>
      </Box>
      <List>
        {tools.map((tool) => (
          <ListItem
            key={tool.id}
            draggable
            onDragStart={(e) => onDragStart(e, tool.id)}
            sx={{
              cursor: 'grab',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <ListItemIcon>{tool.icon}</ListItemIcon>
            <ListItemText
              primary={tool.name}
              secondary={tool.description}
              primaryTypographyProps={{
                variant: 'subtitle1',
                fontWeight: 'medium',
              }}
              secondaryTypographyProps={{
                variant: 'body2',
              }}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default ToolPanel; 