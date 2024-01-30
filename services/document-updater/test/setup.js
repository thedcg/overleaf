const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const sinonChai = require('sinon-chai')
const SandboxedModule = require('sandboxed-module')
const sinon = require('sinon')

// Chai configuration
chai.should()
chai.use(chaiAsPromised)
// Load sinon-chai assertions so expect(stubFn).to.have.been.calledWith('abc')
// has a nicer failure messages
chai.use(sinonChai)

// Global stubs
const sandbox = sinon.createSandbox()
const stubs = {
  logger: {
    debug: sandbox.stub(),
    log: sandbox.stub(),
    warn: sandbox.stub(),
    err: sandbox.stub(),
    error: sandbox.stub(),
  },
}

// SandboxedModule configuration
SandboxedModule.configure({
  requires: {
    '@overleaf/logger': stubs.logger,
  },
  globals: { Buffer, JSON, Math, console, process },
})

// Mocha hooks
exports.mochaHooks = {
  beforeEach() {
    this.logger = stubs.logger
  },

  afterEach() {
    sandbox.reset()
  },
}
