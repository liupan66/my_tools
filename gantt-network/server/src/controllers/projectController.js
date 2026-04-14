const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');

const ganttDataPath = path.join(__dirname, '../', config.data.ganttDataPath);

class ProjectController {
  static getGanttData(req, res) {
    try {
      if (fs.existsSync(ganttDataPath)) {
        const data = fs.readFileSync(ganttDataPath, 'utf8');
        const ganttData = JSON.parse(data);
        
        res.json({
          success: true,
          data: ganttData
        });
      } else {
        res.json({
          success: true,
          data: {}
        });
      }
    } catch (error) {
      logger.error('Get gantt data error', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get gantt data'
      });
    }
  }

  static saveGanttData(req, res) {
    try {
      const dataDir = path.dirname(ganttDataPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      fs.writeFileSync(ganttDataPath, JSON.stringify(req.body, null, 2));

      logger.info('Gantt data saved', { userId: req.user.id });

      res.json({
        success: true,
        message: 'Data saved successfully'
      });
    } catch (error) {
      logger.error('Save gantt data error', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save data'
      });
    }
  }

  static getAllProjects(req, res) {
    try {
      if (fs.existsSync(ganttDataPath)) {
        const data = fs.readFileSync(ganttDataPath, 'utf8');
        const ganttData = JSON.parse(data);

        const projects = (ganttData.projectList || []).map(projectName => ({
          name: projectName,
          color: ganttData.projectColorConfig?.[projectName] || '#3498db',
          taskCount: this.countTasksByProject(ganttData, projectName)
        }));

        res.json({
          success: true,
          data: projects
        });
      } else {
        res.json({
          success: true,
          data: []
        });
      }
    } catch (error) {
      logger.error('Get projects error', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get projects'
      });
    }
  }

  static countTasksByProject(ganttData, projectName) {
    let count = 0;
    if (ganttData.executors) {
      ganttData.executors.forEach(executor => {
        if (executor.tasks) {
          executor.tasks.forEach(task => {
            if (task.project === projectName) {
              count++;
            }
          });
        }
      });
    }
    return count;
  }

  static createProject(req, res) {
    try {
      const { name, color } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Project name is required'
        });
      }

      let ganttData = {};
      if (fs.existsSync(ganttDataPath)) {
        const data = fs.readFileSync(ganttDataPath, 'utf8');
        ganttData = JSON.parse(data);
      }

      if (!ganttData.projectList) {
        ganttData.projectList = [];
      }

      if (ganttData.projectList.includes(name)) {
        return res.status(400).json({
          success: false,
          message: 'Project already exists'
        });
      }

      ganttData.projectList.push(name);

      if (!ganttData.projectColorConfig) {
        ganttData.projectColorConfig = {};
      }
      ganttData.projectColorConfig[name] = color || '#3498db';

      fs.writeFileSync(ganttDataPath, JSON.stringify(ganttData, null, 2));

      logger.info('Project created', { userId: req.user.id, projectName: name });

      res.json({
        success: true,
        message: 'Project created successfully',
        data: {
          name,
          color: ganttData.projectColorConfig[name]
        }
      });
    } catch (error) {
      logger.error('Create project error', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create project'
      });
    }
  }

  static updateProject(req, res) {
    try {
      const { oldName } = req.params;
      const { newName, color } = req.body;

      if (!fs.existsSync(ganttDataPath)) {
        return res.status(404).json({
          success: false,
          message: 'Data not found'
        });
      }

      const data = fs.readFileSync(ganttDataPath, 'utf8');
      let ganttData = JSON.parse(data);

      if (!ganttData.projectList || !ganttData.projectList.includes(oldName)) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      if (newName && newName !== oldName) {
        const index = ganttData.projectList.indexOf(oldName);
        ganttData.projectList[index] = newName;

        if (ganttData.projectColorConfig?.[oldName]) {
          ganttData.projectColorConfig[newName] = ganttData.projectColorConfig[oldName];
          delete ganttData.projectColorConfig[oldName];
        }

        if (ganttData.executors) {
          ganttData.executors.forEach(executor => {
            if (executor.tasks) {
              executor.tasks.forEach(task => {
                if (task.project === oldName) {
                  task.project = newName;
                }
              });
            }
          });
        }
      }

      if (color) {
        const projectName = newName || oldName;
        if (!ganttData.projectColorConfig) {
          ganttData.projectColorConfig = {};
        }
        ganttData.projectColorConfig[projectName] = color;
      }

      fs.writeFileSync(ganttDataPath, JSON.stringify(ganttData, null, 2));

      logger.info('Project updated', { userId: req.user.id, oldName, newName });

      res.json({
        success: true,
        message: 'Project updated successfully'
      });
    } catch (error) {
      logger.error('Update project error', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update project'
      });
    }
  }

  static deleteProject(req, res) {
    try {
      const { name } = req.params;

      if (!fs.existsSync(ganttDataPath)) {
        return res.status(404).json({
          success: false,
          message: 'Data not found'
        });
      }

      const data = fs.readFileSync(ganttDataPath, 'utf8');
      let ganttData = JSON.parse(data);

      if (!ganttData.projectList || !ganttData.projectList.includes(name)) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      ganttData.projectList = ganttData.projectList.filter(p => p !== name);

      if (ganttData.projectColorConfig?.[name]) {
        delete ganttData.projectColorConfig[name];
      }

      fs.writeFileSync(ganttDataPath, JSON.stringify(ganttData, null, 2));

      logger.info('Project deleted', { userId: req.user.id, projectName: name });

      res.json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      logger.error('Delete project error', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete project'
      });
    }
  }
}

module.exports = ProjectController;
