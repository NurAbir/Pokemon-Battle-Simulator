// utils/generateId.js

/**
 * Generate a unique ID with a prefix
 * @param {string} prefix - Prefix for the ID (e.g., 'user', 'team', 'battle')
 * @returns {string} Generated ID like 'user_abc123xyz'
 */
function generateId(prefix = 'id') {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${prefix}_${timestamp}${randomStr}`;
}

module.exports = { generateId };