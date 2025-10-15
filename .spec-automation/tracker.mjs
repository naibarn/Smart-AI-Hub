import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TRACKER_FILE = path.join(__dirname, 'progress-tracker.json');

// โหลด tracker
function loadTracker() {
  if (!fs.existsSync(TRACKER_FILE)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(TRACKER_FILE, 'utf8'));
}

// บันทึก tracker
function saveTracker(data) {
  fs.writeFileSync(TRACKER_FILE, JSON.stringify(data, null, 2));
}

// หา task ถัดไป
function getNextTask() {
  const tracker = loadTracker();
  if (!tracker) return null;

  for (const phase of tracker.phases) {
    for (const task of phase.tasks) {
      if (task.status === 'pending') {
        return task;
      }
    }
  }
  return null;
}

// เริ่ม task
function startTask(taskId) {
  const tracker = loadTracker();
  let task = null;

  for (const phase of tracker.phases) {
    task = phase.tasks.find((t) => t.id === taskId);
    if (task) break;
  }

  if (task) {
    task.status = 'in-progress';
    task.started_at = new Date().toISOString();
    tracker.current_task = taskId;
    saveTracker(tracker);
    return task;
  }
  return null;
}

// เสร็จสิ้น task
function completeTask(taskId, actualMinutes) {
  const tracker = loadTracker();
  let task = null;

  for (const phase of tracker.phases) {
    task = phase.tasks.find((t) => t.id === taskId);
    if (task) break;
  }

  if (task) {
    task.status = 'completed';
    task.completed_at = new Date().toISOString();
    task.actual_minutes = actualMinutes;

    // Update current_task to next pending task
    const nextTask = getNextTask();
    tracker.current_task = nextTask ? nextTask.id : null;
    tracker.last_checkpoint = new Date().toISOString();

    // Update statistics
    let completedTasks = 0;
    let totalActualMinutes = 0;
    for (const phase of tracker.phases) {
      for (const t of phase.tasks) {
        if (t.status === 'completed') {
          completedTasks++;
          totalActualMinutes += t.actual_minutes || 0;
        }
      }
    }
    tracker.statistics.completed_tasks = completedTasks;
    tracker.statistics.total_actual_minutes = totalActualMinutes;
    tracker.statistics.completion_percentage = (
      (completedTasks / tracker.statistics.total_tasks) *
      100
    ).toFixed(1);

    saveTracker(tracker);
    return task;
  }
  return null;
}

// แสดง progress
function showProgress() {
  const tracker = loadTracker();
  if (!tracker) {
    console.log('No tracker found');
    return;
  }

  let totalTasks = 0;
  let completedTasks = 0;
  let inProgressTasks = 0;
  let totalTime = 0;

  for (const phase of tracker.phases) {
    totalTasks += phase.tasks.length;
    for (const task of phase.tasks) {
      if (task.status === 'completed') {
        completedTasks++;
        totalTime += task.actual_minutes || 0;
      } else if (task.status === 'in-progress') {
        inProgressTasks++;
      }
    }
  }

  const percentage = ((completedTasks / totalTasks) * 100).toFixed(1);

  console.log(`\n📊 PROGRESS: ${completedTasks}/${totalTasks} (${percentage}%)`);
  console.log(`⏱️  TIME SPENT: ${Math.floor(totalTime / 60)}h ${totalTime % 60}m`);
  console.log(`🎯 CURRENT TASK: ${tracker.current_task || 'ALL COMPLETE!'}`);
  console.log(`🔄 IN PROGRESS: ${inProgressTasks} task(s)\n`);
}

// Export functions
export { loadTracker, saveTracker, getNextTask, startTask, completeTask, showProgress };

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  switch (command) {
    case 'next': {
      const nextTask = getNextTask();
      console.log(JSON.stringify(nextTask, null, 2));
      break;
    }
    case 'progress': {
      showProgress();
      break;
    }
    case 'start': {
      const taskId = process.argv[3];
      if (!taskId) {
        console.log('Error: Task ID required');
        process.exit(1);
      }
      const startedTask = startTask(taskId);
      if (startedTask) {
        console.log(`✅ Started ${taskId}: ${startedTask.name}`);
      } else {
        console.log(`❌ Task ${taskId} not found`);
      }
      break;
    }
    case 'complete': {
      const taskToComplete = process.argv[3];
      const minutes = parseInt(process.argv[4] || '0');
      if (!taskToComplete) {
        console.log('Error: Task ID required');
        process.exit(1);
      }
      const completedTask = completeTask(taskToComplete, minutes);
      if (completedTask) {
        console.log(`✅ Completed ${taskToComplete}: ${completedTask.name} (${minutes} min)`);
      } else {
        console.log(`❌ Task ${taskToComplete} not found`);
      }
      break;
    }
    default: {
      console.log(
        'Usage: node tracker.js [next|progress|start <taskId>|complete <taskId> <minutes>]'
      );
    }
  }
}
