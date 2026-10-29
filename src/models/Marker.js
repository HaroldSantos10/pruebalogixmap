class Marker {
  constructor(userId, lat, lng, label = 'Marcador', color = '#3B82F6') {
    this.id = require('uuid').v4();
    this.userId = userId;
    this.lat = lat;
    this.lng = lng;
    this.label = label;
    this.color = color;
    this.updatedAt = new Date();
  }
}

module.exports = Marker;