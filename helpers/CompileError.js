function CompileError(message, e) {
  this.message = message
  this.name = 'CompileError'
  this.location = e.location
}

CompileError.prototype.toString = function() {
  return this.name
}

module.exports = CompileError