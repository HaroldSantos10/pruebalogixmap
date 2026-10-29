class User {
  constructor(email, passwordHash) {
    this.id = require('uuid').v4();
    this.email = email;
    this.passwordHash = passwordHash;
    this.createdAt = new Date();
  }
}

module.exports = User;