/* eslint-disable
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const sinon = require('sinon')
const assert = require('node:assert')
const path = require('node:path')
const modulePath = path.join(__dirname, '../../../../app/js/LockManager.js')
const projectId = 1234
const docId = 5678
const blockingKey = `Blocking:${docId}`
const SandboxedModule = require('sandboxed-module')

describe('LockManager - checking the lock', function () {
  let Profiler
  const existsStub = sinon.stub()

  const mocks = {
    '@overleaf/redis-wrapper': {
      createClient() {
        return {
          auth() {},
          exists: existsStub,
        }
      },
    },
    '@overleaf/metrics': { inc() {} },
    './Profiler': (Profiler = (function () {
      Profiler = class Profiler {
        static initClass() {
          this.prototype.log = sinon.stub().returns({ end: sinon.stub() })
          this.prototype.end = sinon.stub()
        }
      }
      Profiler.initClass()
      return Profiler
    })()),
  }
  const LockManager = SandboxedModule.require(modulePath, { requires: mocks })

  it('should return true if the key does not exists', function (done) {
    existsStub.yields(null, '0')
    return LockManager.checkLock(docId, (err, free) => {
      if (err) return done(err)
      free.should.equal(true)
      return done()
    })
  })

  return it('should return false if the key does exists', function (done) {
    existsStub.yields(null, '1')
    return LockManager.checkLock(docId, (err, free) => {
      if (err) return done(err)
      free.should.equal(false)
      return done()
    })
  })
})
