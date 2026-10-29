class Marker {
  constructor(userId, lat, lng, label = 'Marcador') {
    this.id = require('uuid').v4();
    this.userId = userId;
    this.lat = lat;
    this.lng = lng;
    this.label = label;
    this.updatedAt = new Date();
  }
}

module.exports = Marker;