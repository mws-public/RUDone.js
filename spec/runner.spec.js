'use strict';
var Utilities,
    $;

require("./support/jasmine-helper")(jasmine);

describe('Utilities Behaviors', function () {
    beforeAll(function (done) {
        require("./support/jasmine-jsdom-jquery-helper").jQueryOnly(jasmine, function (__$__) {
            $ = __$__;
            expect($).toBeDefined();
            spyOn($, 'ajax');
            spyOn($, 'noop');
            Utilities = require("../public/js/Utilities")($, jasmine.createSpyObj("Mustache", ["render"]));
            done();
        });
    });

    it("Should have Utilities defined", function () {
        expect(Utilities).toBeDefined();
    });

    describe("Long Running Backend Operations with Poll for Completion Status", function () {
        var options,
            submitData = {"test": true};

        const SUBMISSION_SUCCESS = {
            "submitted": true
        }, SUBMISSION_FAILED = {
            "submitted": false
        }, STATUS_COMPLETED = {
            "completed": true
        }, STATUS_IN_PROGRESS = {
            "completed": false
        };

        beforeEach(function () {
            options = {
                submission: {
                    action: "POST",
                    endPoint: "/a/long/running/operation",
                    data: submitData,
                    isSubmitted: function (data) {
                        return data && data.submitted;
                    },
                    submissionFailureAction: $.noop // override in test to simulate failure.
                },
                poll: {
                    action: "POST",
                    endPoint: "status/of/long/running/operation",
                    timeOutInSeconds: 0.01, // 10 millis
                    pollIntervalInSeconds: 0.005, // 5 millis
                    isCompleted: function (data) {
                        return data && data.completed;
                    },
                    completeAction: $.noop, // override in test to simulate failure.
                    timeOutAction: $.noop // override in test to simulate failure.
                }
            }
        });

        afterEach(function() {
            $.ajax.calls.reset();
            $.noop.calls.reset();
        });

        it("Should lead to completion when submission is success and poll returns completed.", function (done) {
            // the long running process is expected to be submitted correctly.
            // submission failure action callback should NOT be invoked.
            // poll needs to be initiated. on the 3rd poll attempt, returns status with completed.
            // completion callback should be invoked.
            // time out should NOT be invoked.

            options.poll.timeOutInSeconds = 0.1; // 100 millis. normal timeout set to 10 millis (2 polls to timeout). we need 3, hence extending.
            options.poll.completeAction = function (data) {
                expect(data).toEqual(STATUS_COMPLETED);
            };


            var responses = [ SUBMISSION_SUCCESS, STATUS_IN_PROGRESS, STATUS_IN_PROGRESS, STATUS_COMPLETED];
            var callCount = 0;
            $.ajax.and.callFake(function fakeAjax() {
                return {
                    done: function (callback) {
                        callback(responses[callCount++]);
                    }
                }
            });
            Utilities.longPollOperation(options).done(function () {
                expect($.ajax).toHaveBeenCalledTimes(4);
                expect(options.submission.submissionFailureAction).not.toHaveBeenCalled();
                expect(options.poll.timeOutAction).not.toHaveBeenCalled();
                done();
            }).fail(function (status) {
                done(new Error("Long Running Operation expected to succeed but was failed"))
            });
        });

        it("Should lead to time out when submission is success and " +
            "poll continuously returns in progress leading to time out", function (done) {
            // the long running process is expected to be submitted correctly.
            // submission failure action callback should NOT be invoked.
            // poll needs to be initiated. in all attempts it returns status in progress (completed: false).
            // completion callback should NOT be invoked.
            // time out should be invoked.

            var count = 0;

            options.poll.completeAction = $.noop;
            options.poll.timeOutAction = function (data) {
                expect(data).toEqual(STATUS_IN_PROGRESS);
            };

            $.ajax.and.callFake(function fakeAjax() {
                return {
                    done: function (callback) {
                        count++;
                        // 1st ajax call for submission we return complete, then continuously return in progress
                        callback(count === 1? SUBMISSION_SUCCESS : STATUS_IN_PROGRESS);
                    }
                }
            });
            Utilities.longPollOperation(options).done(function () {
                done(new Error("Long Running Operation expected to fail with time out, but was done"))
            }).fail(function (status) {
                expect(status).toEqual("TIMED_OUT");
                expect($.ajax).toHaveBeenCalledTimes(count);
                expect(options.submission.submissionFailureAction).not.toHaveBeenCalled();
                expect(options.poll.completeAction).not.toHaveBeenCalled();
                done();
            });
        });

        it("Should lead to submission failed callback when submission fails", function (done) {
            // the long running process is expected to be submitted incorrectly - FAILED.
            // submission failure action callback should be invoked.
            // poll should not be initiated.
            // completion callback should NOT be invoked.
            // time out should NOT be invoked.

            options.poll.completeAction = options.poll.timeOutAction = $.noop;
            options.submission.submissionFailureAction = function (data) {
                expect(data).toEqual(SUBMISSION_FAILED);
            };

            $.ajax.and.callFake(function fakeAjax() {
                return {
                    done: function (callback) {
                        callback(SUBMISSION_FAILED);
                    }
                }
            });
            Utilities.longPollOperation(options).done(function () {
                done(new Error("Long Running Operation expected to fail with submission failure, but was done"))
            }).fail(function (status) {
                expect(status).toEqual("SUBMISSION_FAILED");
                expect($.ajax).toHaveBeenCalledTimes(1); // this also means that poll was not invoked.
                expect(options.poll.timeOutAction).not.toHaveBeenCalled();
                expect(options.poll.completeAction).not.toHaveBeenCalled();
                done();
            });
        });

        it("Should apply default values when submission failure callback is unspecified.", function (done) {
            // the long running process is expected to be submitted incorrectly - FAILED.
            // submission failure action callback should be invoked.

            options.poll.completeAction = options.poll.timeOutAction = $.noop;
            delete options.submission.submissionFailureAction;

            $.ajax.and.callFake(function fakeAjax() {
                return {
                    done: function (callback) {
                        callback(SUBMISSION_FAILED);
                    }
                }
            });
            Utilities.longPollOperation(options).fail(function (status) {
                expect(status).toEqual("SUBMISSION_FAILED");
                expect($.ajax).toHaveBeenCalledTimes(1); // this also means that poll was not invoked.
                expect(options.submission.submissionFailureAction).toBeDefined();
                expect(options.submission.submissionFailureAction).toHaveBeenCalled();
                done();
            });
        });

        it("Should apply default submission check when unspecified.", function (done) {
            // the long running process is expected to be submitted incorrectly - FAILED.
            // submission failure action callback should be invoked.

            options.poll.completeAction = options.poll.timeOutAction = $.noop;
            delete options.submission.isSubmitted;

            $.ajax.and.callFake(function fakeAjax() {
                return {
                    done: function (callback) {
                        callback(SUBMISSION_FAILED); // we do not care about the return in this case.
                    }
                }
            });
            Utilities.longPollOperation(options).fail(function (status) {
                expect(status).toEqual("TIMED_OUT");
                expect(options.submission.isSubmitted).toBeDefined();
                done();
            });
        });

    });
});

