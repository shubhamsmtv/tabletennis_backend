/* eslint-env node, mocha */
var expect = require('chai').expect;
var nock = require('nock');

var Payoneer = require('../lib/payoneer');
var InvalidInputError = require('../lib/errors/invalid-input-error');
var PayoneerError = require('../lib/errors/payoneer-error');
var config = require('./config.json');
var responses = require('./fixtures/responses.json');

var payeeId = 1;
var paymentId = 1;
var SANDBOX_URI = 'https://api.sandbox.payoneer.com';
var API_PATH = '/Payouts/HttpApi/API.aspx';

describe('Payoneer Module', function() {
  afterEach(function() {
    nock.cleanAll();
  });

  describe('Configuration', function() {
    it('throws when no config is set', function() {
      expect(function() {
        /* eslint-disable */
        new Payoneer();
        /* eslint-enable */
      }).to.throw(InvalidInputError);
    });

    it('throws when a key is missing', function() {
      expect(function() {
        /* eslint-disable */
        new Payoneer({ username: 'yolo' });
        /* eslint-enable */
      }).to.throw(InvalidInputError);
    });

    it('throws if config keys are provided but empty', function() {
      expect(function() {
        /* eslint-disable */
        new Payoneer({
          username: '',
          password: '',
          partnerId: ''
        });
        /* eslint-enable */
      }).to.throw(InvalidInputError);
    });
  });

  describe('API Functions', function() {
    var payoneer;
    beforeEach(function() {
      payoneer = new Payoneer(config);
    });

    it('Returns error if Payoneer returns error', function(done) {
      nock(SANDBOX_URI)
        .post(API_PATH)
        .query(true)
        .reply(200, responses.error);

      payoneer.getAPIStatus(function(error, data) {
        expect(data).to.not.exist;
        expect(error).to.exist;
        expect(error).to.be.an.instanceOf(PayoneerError);

        done();
      });
    });

    it('GetBalance Function', function(done) {
      nock(SANDBOX_URI)
        .post(API_PATH)
        .query(true)
        .reply(200, responses.balance);

      payoneer.getBalance(function(error, data) {
        expect(error).to.not.exist;
        expect(data).to.have.property('curr');
        expect(data).to.have.property('feesDue');
        expect(data).to.have.property('accountBalance');

        done();
      });
    });

    describe('GetAuthRedirectURL', function(done) {
      it('should return a token', function(done) {
        var options = {
          payeeId: payeeId
        };
        nock(SANDBOX_URI)
          .post(API_PATH)
          .query(true)
          .reply(200, responses.getToken.success);

        payoneer.getAuthRedirectURL(options, function(error, redirectUrl) {
          var url = 'payoneer.com/partners/lp.aspx';
          expect(error).to.not.exist;
          expect(redirectUrl).to.exist;
          expect(typeof redirectUrl).to.be.equal('string');
          expect(redirectUrl).to.have.string(url);
          expect(redirectUrl).to.have.string('token');
          done();
        });
      });

      it('should handle server error 001', function(done) {
        var options = {
          payeeId: payeeId
        };
        nock(SANDBOX_URI)
          .post(API_PATH)
          .query(true)
          .reply(200, responses.getToken.Err001);

        payoneer.getAuthRedirectURL(options, function(error, redirectUrl) {
          expect(redirectUrl).not.to.exist;
          expect(error).to.exist;
          expect(error.name).to.equal('BAD_REQUEST');
          done();
        });
      });

      it('should handle server error 005', function(done) {
        var options = {
          payeeId: payeeId
        };
        nock(SANDBOX_URI)
          .post(API_PATH)
          .query(true)
          .reply(200, responses.getToken.Err005);

        payoneer.getAuthRedirectURL(options, function(error, redirectUrl) {
          expect(redirectUrl).not.to.exist;
          expect(error).to.exist;
          expect(error.name).to.equal('PAYONEER_API_ERROR');
          done();
        });
      });

      it('should handle server error 006', function(done) {
        var options = {
          payeeId: payeeId
        };
        nock(SANDBOX_URI)
          .post(API_PATH)
          .query(true)
          .reply(200, responses.getToken.Err006);

        payoneer.getAuthRedirectURL(options, function(error, redirectUrl) {
          expect(redirectUrl).not.to.exist;
          expect(error).to.exist;
          expect(error.name).to.equal('PAYONEER_API_ERROR');
          done();
        });
      });

      it('should handle server error 008', function(done) {
        var options = {
          payeeId: payeeId
        };
        nock(SANDBOX_URI)
          .post(API_PATH)
          .query(true)
          .reply(200, responses.getToken.Err008);

        payoneer.getAuthRedirectURL(options, function(error, redirectUrl) {
          expect(redirectUrl).not.to.exist;
          expect(error).to.exist;
          expect(error.name).to.equal('PAYONEER_API_ERROR');
          done();
        });
      });
    });

    it('Handles Error 006', function(done) {
      nock(SANDBOX_URI)
        .post(API_PATH)
        .query(true)
        .reply(400, responses.getVersion.Err006);

      nock(SANDBOX_URI)
        .post(API_PATH)
        .query(true)
        .reply(200, responses.echo);

      payoneer.getAPIStatus(function(error, data) {
        expect(error).to.exist;
        expect(error.name).to.equal('PayoneerError');

        done();
      });
    });

    it('GetAPIStatus Function', function(done) {
      nock(SANDBOX_URI)
        .post(API_PATH)
        .query(true)
        .reply(200, responses.getVersion.success);

      nock(SANDBOX_URI)
        .post(API_PATH)
        .query(true)
        .reply(200, responses.echo);

      payoneer.getAPIStatus(function(error, data) {
        expect(error).to.not.exist;
        expect(data).to.have.property('version');
        expect(data).to.have.property('description').and.contains('Ok');

        done();
      });
    });

    describe('Payment Functions', function() {
      describe('RequestPayment Function', function() {
        it('returs error if invalid params', function(done) {
          var options = {
            payeeId: payeeId
          };

          nock(SANDBOX_URI)
            .post(API_PATH)
            .query(true)
            .reply(200, responses.payments.request);

          payoneer.requestPayment(options, function(error, data) {
            expect(error).to.exist;
            expect(error).to.be.instanceOf(InvalidInputError);

            done();
          });
        });

        it('handles error 001', function(done) {
          var options = {
            paymentId: '42',
            payeeId: '1',
            amount: '42',
            programId: '123456',
            description: 'Super payment',
            date: new Date()
          };

          nock(SANDBOX_URI)
            .post(API_PATH)
            .query(true)
            .reply(200, responses.payments.Err001);

          payoneer.requestPayment(options, function(error, data) {
            expect(error).to.exist;
            expect(error.name).to.equal('BAD_REQUEST');

            done();
          });
        });

        it('handles error 002', function(done) {
          var options = {
            paymentId: '42',
            payeeId: '1',
            amount: '42',
            programId: '123456',
            description: 'Super payment',
            date: new Date()
          };

          nock(SANDBOX_URI)
            .post(API_PATH)
            .query(true)
            .reply(200, responses.payments.Err002);

          payoneer.requestPayment(options, function(error, data) {
            expect(error).to.exist;
            expect(error.name).to.equal('PayoneerError');

            done();
          });
        });

        it('handles error 003', function(done) {
          var options = {
            paymentId: '42',
            payeeId: '1',
            amount: '42',
            programId: '123456',
            description: 'Super payment',
            date: new Date()
          };

          nock(SANDBOX_URI)
            .post(API_PATH)
            .query(true)
            .reply(200, responses.payments.Err003);

          payoneer.requestPayment(options, function(error, data) {
            expect(error).to.exist;
            expect(error.name).to.equal('PayoneerError');

            done();
          });
        });

        it('handles error 004', function(done) {
          var options = {
            paymentId: '42',
            payeeId: '1',
            amount: '42',
            programId: '123456',
            description: 'Super payment',
            date: new Date()
          };

          nock(SANDBOX_URI)
            .post(API_PATH)
            .query(true)
            .reply(200, responses.payments.Err004);

          payoneer.requestPayment(options, function(error, data) {
            expect(error).to.exist;
            expect(error.name).to.equal('PayoneerError');

            done();
          });
        });

        it('handles error 006', function(done) {
          var options = {
            paymentId: '42',
            payeeId: '1',
            amount: '42',
            programId: '123456',
            description: 'Super payment',
            date: new Date()
          };

          nock(SANDBOX_URI)
            .post(API_PATH)
            .query(true)
            .reply(200, responses.payments.Err006);

          payoneer.requestPayment(options, function(error, data) {
            expect(error).to.exist;
            expect(error.name).to.equal('PAYONEER_API_ERROR');

            done();
          });
        });

        it('handles error 008', function(done) {
          var options = {
            paymentId: '42',
            payeeId: '1',
            amount: '42',
            programId: '123456',
            description: 'Super payment',
            date: new Date()
          };

          nock(SANDBOX_URI)
            .post(API_PATH)
            .query(true)
            .reply(200, responses.payments.Err008);

          payoneer.requestPayment(options, function(error, data) {
            expect(error).to.exist;
            expect(error.name).to.equal('PAYONEER_API_ERROR');

            done();
          });
        });

        it('handles error 011', function(done) {
          var options = {
            paymentId: '42',
            payeeId: '1',
            amount: '42',
            programId: '123456',
            description: 'Super payment',
            date: new Date()
          };

          nock(SANDBOX_URI)
            .post(API_PATH)
            .query(true)
            .reply(200, responses.payments.Err011);

          payoneer.requestPayment(options, function(error, data) {
            expect(error).to.exist;
            expect(error.name).to.equal('PayoneerError');

            done();
          });
        });

        it('handles error 010', function(done) {
          var options = {
            paymentId: '42',
            payeeId: '1',
            amount: '42',
            programId: '123456',
            description: 'Super payment',
            date: new Date()
          };

          nock(SANDBOX_URI)
            .post(API_PATH)
            .query(true)
            .reply(200, responses.payments.Err010);

          payoneer.requestPayment(options, function(error, data) {
            expect(error).to.exist;
            expect(error.name).to.equal('PayoneerError');

            done();
          });
        });

        it('handles error 030', function(done) {
          var options = {
            paymentId: '42',
            payeeId: '1',
            amount: '42',
            programId: '123456',
            description: 'Super payment',
            date: new Date()
          };

          nock(SANDBOX_URI)
            .post(API_PATH)
            .query(true)
            .reply(200, responses.payments.Err030);

          payoneer.requestPayment(options, function(error, data) {
            expect(error).to.exist;
            expect(error.name).to.equal('PayoneerError');

            done();
          });
        });

        it('handles error 099', function(done) {
          var options = {
            paymentId: '42',
            payeeId: '1',
            amount: '42',
            programId: '123456',
            description: 'Super payment',
            date: new Date()
          };

          nock(SANDBOX_URI)
            .post(API_PATH)
            .query(true)
            .reply(200, responses.payments.Err099);

          payoneer.requestPayment(options, function(error, data) {
            expect(error).to.exist;
            expect(error.name).to.equal('PayoneerError');

            done();
          });
        });

        it('handles error 00001m', function(done) {
          var options = {
            paymentId: '42',
            payeeId: '1',
            amount: '42',
            programId: '123456',
            description: 'Super payment',
            date: new Date()
          };

          nock(SANDBOX_URI)
            .post(API_PATH)
            .query(true)
            .reply(200, responses.payments.Err0001m);

          payoneer.requestPayment(options, function(error, data) {
            expect(error).to.exist;
            expect(error.name).to.equal('PayoneerError');

            done();
          });
        });

        it('handles error 002b', function(done) {
          var options = {
            paymentId: '42',
            payeeId: '1',
            amount: '42',
            programId: '123456',
            description: 'Super payment',
            date: new Date()
          };

          nock(SANDBOX_URI)
            .post(API_PATH)
            .query(true)
            .reply(200, responses.payments.Err002b);

          payoneer.requestPayment(options, function(error, data) {
            expect(error).to.exist;
            expect(error.name).to.equal('PayoneerError');

            done();
          });
        });

        it('handles error 002t', function(done) {
          var options = {
            paymentId: '42',
            payeeId: '1',
            amount: '42',
            programId: '123456',
            description: 'Super payment',
            date: new Date()
          };

          nock(SANDBOX_URI)
            .post(API_PATH)
            .query(true)
            .reply(200, responses.payments.Err002t);

          payoneer.requestPayment(options, function(error, data) {
            expect(error).to.exist;
            expect(error.name).to.equal('PayoneerError');

            done();
          });
        });

        it('handles error 002em', function(done) {
          var options = {
            paymentId: '42',
            payeeId: '1',
            amount: '42',
            programId: '123456',
            description: 'Super payment',
            date: new Date()
          };

          nock(SANDBOX_URI)
            .post(API_PATH)
            .query(true)
            .reply(200, responses.payments.Err002em);

          payoneer.requestPayment(options, function(error, data) {
            expect(error).to.exist;
            expect(error.name).to.equal('PayoneerError');

            done();
          });
        });

        it('handles error 006n', function(done) {
          var options = {
            paymentId: '42',
            payeeId: '1',
            amount: '42',
            programId: '123456',
            description: 'Super payment',
            date: new Date()
          };

          nock(SANDBOX_URI)
            .post(API_PATH)
            .query(true)
            .reply(200, responses.payments.Err006n);

          payoneer.requestPayment(options, function(error, data) {
            expect(error).to.exist;
            expect(error.name).to.equal('PayoneerError');

            done();
          });
        });

        it('handles error 007d', function(done) {
          var options = {
            paymentId: '42',
            payeeId: '1',
            amount: '42',
            programId: '123456',
            description: 'Super payment',
            date: new Date()
          };

          nock(SANDBOX_URI)
            .post(API_PATH)
            .query(true)
            .reply(200, responses.payments.Err007d);

          payoneer.requestPayment(options, function(error, data) {
            expect(error).to.exist;
            expect(error.name).to.equal('PayoneerError');

            done();
          });
        });

        it('handles error 007f', function(done) {
          var options = {
            paymentId: '42',
            payeeId: '1',
            amount: '42',
            programId: '123456',
            description: 'Super payment',
            date: new Date()
          };

          nock(SANDBOX_URI)
            .post(API_PATH)
            .query(true)
            .reply(200, responses.payments.Err007f);

          payoneer.requestPayment(options, function(error, data) {
            expect(error).to.exist;
            expect(error.name).to.equal('PayoneerError');

            done();
          });
        });

        it('handles error 007g', function(done) {
          var options = {
            paymentId: '42',
            payeeId: '1',
            amount: '42',
            programId: '123456',
            description: 'Super payment',
            date: new Date()
          };

          nock(SANDBOX_URI)
            .post(API_PATH)
            .query(true)
            .reply(200, responses.payments.Err007g);

          payoneer.requestPayment(options, function(error, data) {
            expect(error).to.exist;
            expect(error.name).to.equal('PayoneerError');

            done();
          });
        });

        it('handles error 00PE1028', function(done) {
          var options = {
            paymentId: '42',
            payeeId: '1',
            amount: '42',
            programId: '123456',
            description: 'Super payment',
            date: new Date()
          };

          nock(SANDBOX_URI)
            .post(API_PATH)
            .query(true)
            .reply(200, responses.payments.ErrPE1028);

          payoneer.requestPayment(options, function(error, data) {
            expect(error).to.exist;
            expect(error.name).to.equal('PayoneerError');

            done();
          });
        });

        it('handles error 000FFF0', function(done) {
          var options = {
            paymentId: '42',
            payeeId: '1',
            amount: '42',
            programId: '123456',
            description: 'Super payment',
            date: new Date()
          };

          nock(SANDBOX_URI)
            .post(API_PATH)
            .query(true)
            .reply(200, responses.payments.Err000FFF0);

          payoneer.requestPayment(options, function(error, data) {
            expect(error).to.exist;
            expect(error.name).to.equal('PayoneerError');

            done();
          });
        });

        it('handles error A00B556F', function(done) {
          var options = {
            paymentId: '42',
            payeeId: '1',
            amount: '42',
            programId: '123456',
            description: 'Super payment',
            date: new Date()
          };

          nock(SANDBOX_URI)
            .post(API_PATH)
            .query(true)
            .reply(200, responses.payments.ErrA00B556F);

          payoneer.requestPayment(options, function(error, data) {
            expect(error).to.exist;
            expect(error.name).to.equal('PayoneerError');

            done();
          });
        });

        it('handles error 4B501FF5', function(done) {
          var options = {
            paymentId: '42',
            payeeId: '1',
            amount: '42',
            programId: '123456',
            description: 'Super payment',
            date: new Date()
          };

          nock(SANDBOX_URI)
            .post(API_PATH)
            .query(true)
            .reply(200, responses.payments.Err4B501FF5);

          payoneer.requestPayment(options, function(error, data) {
            expect(error).to.exist;
            expect(error.name).to.equal('PayoneerError');

            done();
          });
        });

        it('returns the payment', function(done) {
          var options = {
            paymentId: '42',
            payeeId: '1',
            amount: '42',
            programId: '123456',
            description: 'Super payment',
            date: new Date()
          };

          nock(SANDBOX_URI)
            .post(API_PATH)
            .query(true)
            .reply(200, responses.payments.request);

          payoneer.requestPayment(options, function(error, data) {
            expect(error).to.not.exist;
            expect(data).to.have.property('paymentId');
            expect(data).to.have.property('payoneerId');

            done();
          });
        });
      });

      it.skip('GetPaymentStatus Function', function(done) {
        var options = {
          paymentId: paymentId
        };
        nock(SANDBOX_URI)
          .post(API_PATH)
          .query(true)
          .reply(200, responses.payments.status);

        payoneer.getPaymentStatus(options, function(error, data) {
          expect(error).to.not.exist;
          expect(data).to.have.property('paymentId');
          expect(data).to.have.property('amount');
          expect(data).to.have.property('curr');

          done();
        });
      });

      it('GetUnclaimedPayments Function', function(done) {
        nock(SANDBOX_URI)
          .post(API_PATH)
          .query(true)
          .reply(200, responses.payments.unclaimed);

        payoneer.getUnclaimedPayments(function(error, data) {
          expect(error).to.not.exist;
          expect(data).to.have.property('payment');

          done();
        });
      });

      it('CancelPayment Function', function(done) {
        var options = {
          paymentId: paymentId
        };
        nock(SANDBOX_URI)
          .post(API_PATH)
          .query(true)
          .reply(200, responses.payments.cancel);

        payoneer.cancelPayment(options, function(error, data) {
          expect(error).to.not.exist;
          expect(data).to.have.property('paymentId');
          expect(data).to.have.property('curr');
          expect(data).to.have.property('amount');

          done();
        });
      });
    });

    describe('Payees Functions', function() {
      it('GetPayee Function', function(done) {
        var options = {
          payeeId: payeeId
        };

        nock(SANDBOX_URI)
          .post(API_PATH)
          .query(true)
          .reply(200, responses.payees.getPayee);

        payoneer.getPayee(options, function(error, data) {
          expect(error).to.not.exist;
          expect(data).to.have.deep.property('payee.payeeStatus');
          expect(data).to.have.deep.property('payee.cards');

          done();
        });
      });

      it('GetPayeePayments Function', function(done) {
        var options = {
          payeeId: payeeId
        };

        nock(SANDBOX_URI)
          .post(API_PATH)
          .query(true)
          .reply(200, responses.payees.getPayments);

        payoneer.getPayeePayments(options, function(error, data) {
          expect(error).to.not.exist;
          expect(data).to.have.any.keys('prepaid', 'ach', 'iAch', 'paperCheck', 'payoneerAccount');
          expect(data).to.have.property('prepaid').that.is.an('array');
          expect(data).to.have.deep.property('prepaid.0.payments').that.is.an('array');

          done();
        });
      });

      it('GetPayeesReport Function', function(done) {
        nock(SANDBOX_URI)
          .post(API_PATH)
          .query(true)
          .reply(200, responses.payees.report);

        payoneer.getPayeesReport(function(error, data) {
          expect(error).to.not.exist;
          expect(data).to.have.any.keys('prepaid', 'ach', 'iAch', 'paperCheck', 'payoneerAccount');
          expect(data).to.have.property('prepaid').that.is.an('array');
          expect(data).to.have.deep.property('prepaid.0.payments').that.is.an('array');

          done();
        });
      });

      it('updatePayeeId Function', function(done) {
        var options = {
          oldPayeeId: payeeId,
          newPayeeId: '666'
        };

        nock(SANDBOX_URI)
          .post(API_PATH)
          .query(true)
          .reply(200, responses.payees.updatePayeeId);

        payoneer.updatePayeeId(options, function(error, data) {
          expect(error).to.not.exist;
          expect(data).to.be.an('object');
          expect(data).to.have.property('oldPayee');
          expect(data).to.have.property('newPayee');

          done();
        });
      });
    });
  });
});
