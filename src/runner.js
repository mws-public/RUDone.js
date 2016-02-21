(function() {
    'use strict';
    function factory($) {
        var _debug = false; // Do not checkin with true, breaks on the browser
        var debug = function debug() {
            if(_debug) {
                console.log.apply(null, arguments);
            }
        };

        var longPollOperation = function longPollOperation(options) {
            var $q = $.Deferred();

            // smart defaults
            var operation = options.submission;
            operation.isSubmitted = operation.isSubmitted || function () {
                    return true;
                };
            operation.submissionFailureAction = operation.submissionFailureAction || $.noop;

            var submissionParams = {
                type: operation.action,
                url: operation.endPoint,
                data: operation.data
            };
            debug("Long Running Submit Operation parameters: %j", submissionParams);

            var poll = options.poll;
            var pollParams = {
                type: poll.action,
                url: poll.endPoint
            };
            debug("Status Poll Operation parameters: %j", pollParams);

            var startPollOperations = (function startPollOperations() {
                // it is important to have state internal since there could be more than one long poll operation in same time.
                var startDate = new Date(),
                    startTime = startDate.getTime(),
                    autoPollCalls;
                debug("Polling started at time: %s", startDate);

                var pollInvocationDone = function pollInvocationDone(data) {
                    var pollResponseDate = new Date();
                    debug("Poll Invocation have come back with status response at time: %s", pollResponseDate);
                    if (poll.isCompleted(data)) {
                        debug("Long running operation completed, poll response shows running status completed, " +
                            "clearing poll timer and invoking the complete action callback");
                        clearInterval(autoPollCalls);
                        $.when(poll.completeAction(data)).done(function() {
                            options.started = false;
                            debug("Resolving Promise, promised from the long running operation");
                            $q.resolve("COMPLETED", data);
                        });
                    } else {
                        if (pollResponseDate.getTime() - startTime > poll.timeOutInSeconds * 1000) {
                            debug("Long running operation still in progress and TIME OUT reached, " +
                                "Clearing Poll Timer. No further poll invocation. Invoking time out action callback.");
                            clearInterval(autoPollCalls);
                            $.when(poll.timeOutAction(data)).done(function () {
                                options.started = false;
                                debug("Rejecting Promise, promised from the long running operation due to timeout");
                                $q.reject("TIMED_OUT", data);
                            });
                        } else {
                            debug("Long running operation still in progress and time out YET to be reached, " +
                                "existing poll timer will trigger poll again. This instance of poll is done");
                        }
                    }
                };

                var pollInvocation = function pollInvocation() {
                    $.ajax(pollParams).done(pollInvocationDone);
                };
                autoPollCalls = setInterval(pollInvocation, poll.pollIntervalInSeconds * 1000);
            });

            $.ajax(submissionParams).done(function (submissionResponseData) {
                debug("Response from Long Running Submit Operation: %j", submissionResponseData);
                if(operation.isSubmitted(submissionResponseData)) {
                    debug("Long Running Operation submission succcess, starting Poll operations");
                    startPollOperations();
                } else {
                    debug("Long Running Operation submission failed, calling Submission Failure callback");
                    operation.submissionFailureAction(submissionResponseData);
                    options.started = false;
                    debug("Rejecting Promise, promised from the long running operation");
                    $q.reject("SUBMISSION_FAILED", submissionResponseData);
                }
                debug("Long Running Operation Submission.done completed");
            });
            options.started = true;
            return $q;
        };


        return {
            longPollOperation: longPollOperation
        };
    }

    if (typeof module === "object") {
        module.exports = factory;
    } else {
        this.Runner = factory(this.$); // this will be the window.
    }
}).call(this);