// Turn Timer Manager - Handles inactivity tracking and warnings
class TurnTimerManager {
  constructor(io, battleLogService) {
    this.io = io;
    this.battleLogService = battleLogService;
    this.timers = new Map(); // battleId -> timer data
    
    // Configuration
    this.TURN_DURATION = 60; // seconds
    this.WARNING_THRESHOLD = 10; // warn when 10 seconds remain
    this.TICK_INTERVAL = 1000; // check every second
  }

  // Start tracking a battle
  startBattle(battleId, players) {
    const timerData = {
      battleId,
      players: players.map(p => ({
        userId: p.userId,
        username: p.username,
        ready: false,
        timeRemaining: this.TURN_DURATION,
        warned: false
      })),
      turnStartTime: Date.now(),
      interval: null,
      turn: 1,
      onTimeout: null
    };
    
    this.timers.set(battleId, timerData);
    return timerData;
  }

  // Start turn timer
  startTurn(battleId, turn, onTimeout) {
    const timerData = this.timers.get(battleId);
    if (!timerData) return;

    // Clear any existing interval
    this.clearInterval(battleId);

    // Reset player states
    timerData.turn = turn;
    timerData.turnStartTime = Date.now();
    timerData.onTimeout = onTimeout;
    timerData.players.forEach(p => {
      p.ready = false;
      p.timeRemaining = this.TURN_DURATION;
      p.warned = false;
    });

    // Emit turn timer start
    this.io.to(`battle_${battleId}`).emit('battle:timerStart', {
      turn,
      duration: this.TURN_DURATION
    });

    // Start countdown
    timerData.interval = setInterval(() => this.tick(battleId), this.TICK_INTERVAL);
  }

  // Tick - called every second
  async tick(battleId) {
    const timerData = this.timers.get(battleId);
    if (!timerData) return;

    const elapsed = Math.floor((Date.now() - timerData.turnStartTime) / 1000);
    const remaining = Math.max(0, this.TURN_DURATION - elapsed);

    // Update and emit time for each non-ready player
    for (const player of timerData.players) {
      if (player.ready) continue;

      player.timeRemaining = remaining;

      // Emit timer update
      this.io.to(`battle_${battleId}`).emit('battle:timerUpdate', {
        userId: player.userId,
        timeRemaining: remaining,
        turn: timerData.turn
      });

      // Check for warning threshold
      if (remaining <= this.WARNING_THRESHOLD && remaining > 0 && !player.warned) {
        player.warned = true;
        await this.battleLogService.inactivityWarning(
          battleId, 
          timerData.turn, 
          player.username, 
          remaining,
          player.userId
        );
      }

      // Check for timeout
      if (remaining === 0) {
        await this.handleTimeout(battleId, player);
        return; // Stop processing after timeout
      }
    }
  }

  // Handle player timeout
  async handleTimeout(battleId, player) {
    const timerData = this.timers.get(battleId);
    if (!timerData) return;

    // Log timeout
    await this.battleLogService.timeoutOccurred(
      battleId,
      timerData.turn,
      player.username,
      player.userId
    );

    // Clear timer
    this.clearInterval(battleId);

    // Emit timeout event
    this.io.to(`battle_${battleId}`).emit('battle:timeout', {
      userId: player.userId,
      username: player.username,
      turn: timerData.turn
    });

    // Call timeout callback
    if (timerData.onTimeout) {
      timerData.onTimeout(player.userId, player.username);
    }
  }

  // Mark player as ready
  markReady(battleId, userId) {
    const timerData = this.timers.get(battleId);
    if (!timerData) return false;

    const player = timerData.players.find(p => p.userId === userId);
    if (player) {
      player.ready = true;
    }

    // Check if all players ready
    const allReady = timerData.players.every(p => p.ready);
    if (allReady) {
      this.clearInterval(battleId);
    }

    return allReady;
  }

  // Clear interval for a battle
  clearInterval(battleId) {
    const timerData = this.timers.get(battleId);
    if (timerData?.interval) {
      clearInterval(timerData.interval);
      timerData.interval = null;
    }
  }

  // End battle tracking
  endBattle(battleId) {
    this.clearInterval(battleId);
    this.timers.delete(battleId);
  }

  // Get timer state
  getTimerState(battleId) {
    const timerData = this.timers.get(battleId);
    if (!timerData) return null;

    return {
      turn: timerData.turn,
      duration: this.TURN_DURATION,
      players: timerData.players.map(p => ({
        userId: p.userId,
        username: p.username,
        ready: p.ready,
        timeRemaining: p.timeRemaining
      }))
    };
  }

  // Handle player disconnect
  handleDisconnect(battleId, userId) {
    const timerData = this.timers.get(battleId);
    if (!timerData) return;

    // Immediately trigger timeout for disconnected player
    const player = timerData.players.find(p => p.userId === userId);
    if (player && !player.ready) {
      player.timeRemaining = 0;
      this.handleTimeout(battleId, player);
    }
  }
}

module.exports = TurnTimerManager;
