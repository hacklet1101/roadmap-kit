#!/usr/bin/env node

/**
 * ROADMAP-KIT SCANNER
 * Reads Git commits and updates roadmap.json automatically
 * Parses tags: [task:id], [status:value], [debt:description]
 */

import { simpleGit } from 'simple-git';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const CONFIG = {
  maxCommits: 50,
  roadmapPath: null, // Will be set based on execution context
};

/**
 * Parse commit message for tags
 * Tags format: [task:id] [status:value] [debt:description]
 */
function parseCommitTags(message) {
  const tags = {
    taskId: null,
    status: null,
    debts: []
  };

  // Extract [task:id]
  const taskMatch = message.match(/\[task:([^\]]+)\]/);
  if (taskMatch) {
    tags.taskId = taskMatch[1];
  }

  // Extract [status:value]
  const statusMatch = message.match(/\[status:([^\]]+)\]/);
  if (statusMatch) {
    const status = statusMatch[1];
    if (['pending', 'in_progress', 'completed'].includes(status)) {
      tags.status = status;
    }
  }

  // Extract all [debt:description]
  const debtMatches = message.matchAll(/\[debt:([^\]]+)\]/g);
  for (const match of debtMatches) {
    tags.debts.push(match[1]);
  }

  return tags;
}

/**
 * Get file statistics from commit
 */
async function getCommitStats(git, commitHash) {
  try {
    const diffSummary = await git.diffSummary([`${commitHash}^`, commitHash]);
    return {
      lines_added: diffSummary.insertions || 0,
      lines_removed: diffSummary.deletions || 0,
      files_created: diffSummary.files.filter(f => f.binary === false && f.deletions === 0).length,
      files_modified: diffSummary.files.filter(f => f.binary === false && f.deletions > 0).length,
      files: diffSummary.files.map(f => f.file)
    };
  } catch (error) {
    // If it's the first commit, there's no parent to diff against
    return {
      lines_added: 0,
      lines_removed: 0,
      files_created: 0,
      files_modified: 0,
      files: []
    };
  }
}

/**
 * Calculate complexity score based on lines changed
 */
function calculateComplexity(linesAdded, linesRemoved) {
  const totalLines = linesAdded + linesRemoved;
  if (totalLines < 50) return 1;
  if (totalLines < 100) return 2;
  if (totalLines < 200) return 3;
  if (totalLines < 500) return 5;
  if (totalLines < 1000) return 7;
  return 10;
}

/**
 * Find task in roadmap by ID
 */
function findTask(roadmap, taskId) {
  for (const feature of roadmap.features) {
    for (const task of feature.tasks) {
      if (task.id === taskId) {
        return { feature, task };
      }
    }
  }
  return null;
}

/**
 * Update task with commit information
 */
function updateTask(task, commit, tags, stats) {
  // Update status
  if (tags.status) {
    task.status = tags.status;

    // Set timestamps
    if (tags.status === 'in_progress' && !task.started_at) {
      task.started_at = commit.date;
    }
    if (tags.status === 'completed' && !task.completed_at) {
      task.completed_at = commit.date;
    }
  }

  // Update git information
  if (!task.git) {
    task.git = {
      branch: null,
      pr_number: null,
      pr_url: null,
      last_commit: null,
      commits: []
    };
  }
  task.git.last_commit = commit.hash;
  if (!task.git.commits.includes(commit.hash)) {
    task.git.commits.push(commit.hash);
  }

  // Update affected files
  if (stats.files && stats.files.length > 0) {
    task.affected_files = task.affected_files || [];
    stats.files.forEach(file => {
      if (!task.affected_files.includes(file)) {
        task.affected_files.push(file);
      }
    });
  }

  // Update metrics
  if (!task.metrics) {
    task.metrics = {
      lines_added: 0,
      lines_removed: 0,
      files_created: 0,
      files_modified: 0,
      complexity_score: 0
    };
  }
  task.metrics.lines_added += stats.lines_added;
  task.metrics.lines_removed += stats.lines_removed;
  task.metrics.files_created += stats.files_created;
  task.metrics.files_modified += stats.files_modified;
  task.metrics.complexity_score = calculateComplexity(
    task.metrics.lines_added,
    task.metrics.lines_removed
  );

  // Add technical debt
  if (tags.debts.length > 0) {
    task.technical_debt = task.technical_debt || [];
    tags.debts.forEach(debtDesc => {
      task.technical_debt.push({
        description: debtDesc,
        severity: 'medium', // Default severity
        estimated_effort: 'TBD'
      });
    });
  }

  return task;
}

/**
 * Calculate feature progress
 */
function calculateFeatureProgress(feature) {
  if (!feature.tasks || feature.tasks.length === 0) return 0;

  const completedTasks = feature.tasks.filter(t => t.status === 'completed').length;
  return Math.round((completedTasks / feature.tasks.length) * 100);
}

/**
 * Calculate total project progress
 */
function calculateTotalProgress(roadmap) {
  if (!roadmap.features || roadmap.features.length === 0) return 0;

  const totalProgress = roadmap.features.reduce((sum, feature) => {
    return sum + (feature.progress || 0);
  }, 0);

  return Math.round(totalProgress / roadmap.features.length);
}

/**
 * Load roadmap.json
 */
function loadRoadmap(roadmapPath) {
  if (!existsSync(roadmapPath)) {
    console.error(chalk.red('✗ roadmap.json not found'));
    console.log(chalk.yellow('  Run "roadmap-kit init" to create one'));
    process.exit(1);
  }

  try {
    const content = readFileSync(roadmapPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(chalk.red('✗ Error reading roadmap.json:'), error.message);
    process.exit(1);
  }
}

/**
 * Save roadmap.json
 */
function saveRoadmap(roadmapPath, roadmap) {
  try {
    writeFileSync(roadmapPath, JSON.stringify(roadmap, null, 2), 'utf-8');
  } catch (error) {
    console.error(chalk.red('✗ Error saving roadmap.json:'), error.message);
    process.exit(1);
  }
}

/**
 * Main scanner function
 */
export async function scanGitHistory(projectRoot = process.cwd()) {
  const roadmapPath = join(projectRoot, 'roadmap.json');
  const spinner = ora('Scanning Git history...').start();

  try {
    // Initialize git
    const git = simpleGit(projectRoot);

    // Check if it's a git repository
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      spinner.fail('Not a Git repository');
      console.log(chalk.yellow('  Initialize Git first: git init'));
      process.exit(1);
    }

    // Load roadmap
    const roadmap = loadRoadmap(roadmapPath);

    // Get last sync date
    const lastSync = roadmap.project_info.last_sync
      ? new Date(roadmap.project_info.last_sync)
      : null;

    // Get commits
    const log = await git.log({ maxCount: CONFIG.maxCommits });

    let updatedTasks = 0;
    let newDebts = 0;
    let processedCommits = 0;

    // Process commits from newest to oldest
    for (const commit of log.all) {
      const commitDate = new Date(commit.date);

      // Skip commits before last sync (if any)
      if (lastSync && commitDate <= lastSync) {
        continue;
      }

      processedCommits++;
      const tags = parseCommitTags(commit.message);

      // If no task tag, skip
      if (!tags.taskId) {
        continue;
      }

      // Find task in roadmap
      const result = findTask(roadmap, tags.taskId);
      if (!result) {
        console.log(chalk.yellow(`\n  ⚠ Task "${tags.taskId}" not found in roadmap`));
        continue;
      }

      // Get commit stats
      const stats = await getCommitStats(git, commit.hash);

      // Update task
      updateTask(result.task, commit, tags, stats);
      updatedTasks++;

      if (tags.debts.length > 0) {
        newDebts += tags.debts.length;
      }

      spinner.text = `Processing commits... (${processedCommits} commits, ${updatedTasks} tasks updated)`;
    }

    // Recalculate progress
    roadmap.features.forEach(feature => {
      feature.progress = calculateFeatureProgress(feature);
    });
    roadmap.project_info.total_progress = calculateTotalProgress(roadmap);
    roadmap.project_info.last_sync = new Date().toISOString();

    // Save updated roadmap
    saveRoadmap(roadmapPath, roadmap);

    spinner.succeed('Roadmap updated successfully');

    // Print summary
    console.log(chalk.cyan('\n📊 Summary:'));
    console.log(chalk.white(`  • Processed commits: ${processedCommits}`));
    console.log(chalk.white(`  • Updated tasks: ${updatedTasks}`));
    console.log(chalk.white(`  • New technical debts: ${newDebts}`));
    console.log(chalk.green(`  • Total progress: ${roadmap.project_info.total_progress}%`));

    if (updatedTasks === 0 && processedCommits > 0) {
      console.log(chalk.yellow('\n💡 Tip: Use commit tags like [task:id] [status:completed] to track tasks'));
    }

  } catch (error) {
    spinner.fail('Error scanning Git history');
    console.error(chalk.red(error.message));
    if (error.stack) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  }
}

// Run scanner if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  scanGitHistory();
}
