// routineManager.js - Routine scheduling system

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class RoutineManager {
  constructor() {
    this.routines = [];
    this.activeTimers = new Map();
    this.routinesFile = path.join(app.getPath('userData'), 'routines.json');
    this.loadRoutines();
  }

  // Load routines from file
  loadRoutines() {
    try {
      if (fs.existsSync(this.routinesFile)) {
        const data = fs.readFileSync(this.routinesFile, 'utf-8');
        this.routines = JSON.parse(data);
        this.scheduleAllRoutines();
      } else {
        this.routines = [];
      }
    } catch (error) {
      console.error('Error loading routines:', error);
      this.routines = [];
    }
  }

  // Save routines to file
  saveRoutines() {
    try {
      fs.writeFileSync(this.routinesFile, JSON.stringify(this.routines, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving routines:', error);
    }
  }

  // Add a new routine
  addRoutine(routine) {
    // Validate routine
    if (!this.validateRoutine(routine)) {
      throw new Error('Invalid routine configuration');
    }

    routine.id = Date.now().toString(); // Simple ID generation
    this.routines.push(routine);
    this.saveRoutines();
    this.scheduleRoutine(routine);
    return routine;
  }

  // Remove a routine
  removeRoutine(routineId) {
    const index = this.routines.findIndex(r => r.id === routineId);
    if (index !== -1) {
      const routine = this.routines[index];
      this.unscheduleRoutine(routine);
      this.routines.splice(index, 1);
      this.saveRoutines();
      return true;
    }
    return false;
  }

  // Update a routine
  updateRoutine(routineId, updates) {
    const routine = this.routines.find(r => r.id === routineId);
    if (routine) {
      this.unscheduleRoutine(routine);
      Object.assign(routine, updates);
      if (!this.validateRoutine(routine)) {
        throw new Error('Invalid routine configuration');
      }
      this.saveRoutines();
      this.scheduleRoutine(routine);
      return routine;
    }
    return null;
  }

  // Get all routines
  getRoutines() {
    return [...this.routines];
  }

  // Validate routine structure
  validateRoutine(routine) {
    return (
      routine &&
      typeof routine.name === 'string' &&
      typeof routine.type === 'string' &&
      ['onoff', 'timer'].includes(routine.type) &&
      typeof routine.deviceName === 'string' &&
      typeof routine.time === 'string' &&
      /^([01]\d|2[0-3]):([0-5]\d)$/.test(routine.time) && // HH:MM format
      (routine.days === undefined || Array.isArray(routine.days)) &&
      typeof routine.action === 'boolean' // true = ON, false = OFF
    );
  }

  // Schedule a single routine
  scheduleRoutine(routine) {
    this.unscheduleRoutine(routine); // Clear any existing timer

    const [hours, minutes] = routine.time.split(':').map(Number);
    const now = new Date();
    let targetTime = new Date(now);
    targetTime.setHours(hours, minutes, 0, 0);

    // If the time has already passed today, schedule for tomorrow
    if (targetTime <= now) {
      targetTime.setDate(targetTime.getDate() + 1);
    }

    // Check if routine should run on this day
    if (routine.days && routine.days.length > 0) {
      const dayOfWeek = targetTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
      if (!routine.days.includes(dayOfWeek)) {
        // Find next valid day
        let daysToAdd = 1;
        let checkDate = new Date(targetTime);
        while (daysToAdd <= 7) {
          checkDate.setDate(targetTime.getDate() + daysToAdd);
          const checkDay = checkDate.getDay();
          if (routine.days.includes(checkDay)) {
            targetTime = new Date(checkDate);
            targetTime.setHours(hours, minutes, 0, 0);
            break;
          }
          daysToAdd++;
        }
      }
    }

    const delay = targetTime.getTime() - now.getTime();
    const timer = setTimeout(() => {
      this.executeRoutine(routine);
      // Reschedule for next occurrence
      this.scheduleRoutine(routine);
    }, delay);

    this.activeTimers.set(routine.id, timer);
    console.log(`Scheduled routine "${routine.name}" for ${targetTime.toLocaleString()}`);
  }

  // Unschedule a routine
  unscheduleRoutine(routine) {
    const timer = this.activeTimers.get(routine.id);
    if (timer) {
      clearTimeout(timer);
      this.activeTimers.delete(routine.id);
    }
  }

  // Schedule all routines
  scheduleAllRoutines() {
    this.routines.forEach(routine => {
      this.scheduleRoutine(routine);
    });
  }

  // Execute a routine
  async executeRoutine(routine) {
    console.log(`Executing routine: ${routine.name}`);

    try {
      // Import device network module dynamically to avoid circular dependencies
      const deviceNetwork = require('./deviceNetwork');

      // Find the device (this is a simplified approach - in real app, you'd pass device object)
      // For now, we'll create a mock device object
      const mockDevice = {
        name: routine.deviceName,
        ip: '192.168.1.100', // This should be stored with the routine
        type: 'Light' // This should be stored with the routine
      };

      const success = await deviceNetwork.controlDeviceRelay(mockDevice, routine.action);

      if (success) {
        console.log(`Routine "${routine.name}" executed successfully`);
      } else {
        console.error(`Routine "${routine.name}" failed to execute`);
      }
    } catch (error) {
      console.error(`Error executing routine "${routine.name}":`, error);
    }
  }

  // Get next execution time for a routine
  getNextExecutionTime(routine) {
    const [hours, minutes] = routine.time.split(':').map(Number);
    const now = new Date();
    let targetTime = new Date(now);
    targetTime.setHours(hours, minutes, 0, 0);

    if (targetTime <= now) {
      targetTime.setDate(targetTime.getDate() + 1);
    }

    // Handle day restrictions
    if (routine.days && routine.days.length > 0) {
      const dayOfWeek = targetTime.getDay();
      if (!routine.days.includes(dayOfWeek)) {
        let daysToAdd = 1;
        let checkDate = new Date(targetTime);
        while (daysToAdd <= 7) {
          checkDate.setDate(targetTime.getDate() + daysToAdd);
          const checkDay = checkDate.getDay();
          if (routine.days.includes(checkDay)) {
            targetTime = new Date(checkDate);
            targetTime.setHours(hours, minutes, 0, 0);
            break;
          }
          daysToAdd++;
        }
      }
    }

    return targetTime;
  }

  // Cleanup all timers
  cleanup() {
    for (const timer of this.activeTimers.values()) {
      clearTimeout(timer);
    }
    this.activeTimers.clear();
  }
}

module.exports = RoutineManager;