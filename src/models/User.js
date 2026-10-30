const { randomUUID } = require('crypto');

class User {
  constructor(email, passwordHash) {
    this.id = randomUUID();
    this.email = email;
    this.passwordHash = passwordHash;
    this.createdAt = new Date();
  }
}

module.exports = User;