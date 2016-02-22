# Long-Runner-With-Status-Poller 
POST submission of a long running operation (on the backend) and check status using long poll approach to completion/failure

1. This this library to POST data into a long running process. 
2. The completion of the long running process is periodically checked using a status call. 
3. Dependant on JQuery. Include on the page after JQuery is loaded. Will introduce `Runner` into the window scope.
4. `var $qRunner = Runner.longPollOperation(options);`
5. Returns a JQuery Promise that resolves when Long Running process completes (status returns completed)
6. Returned Promise is rejected in case of 1. a Time out or 2. Long Running process could not be submitted
7. Uses JQuery.ajax for backend interactions. 

## TODO
1. Document the options
2. A version on nodejs using request for http calls inplace of JQuery. 

## Options Sample 
```
options = {
    submission: {
        action: "POST",
        endPoint: "/a/long/running/operation",
        data: submitData,
        isSubmitted: function (data) {
            return data && data.submitted;
        },
        submissionFailureAction: $.noop
    },
    poll: {
        action: "GET",
        endPoint: "status/of/long/running/operation",
        timeOutInSeconds: 30,
        pollIntervalInSeconds: 5
        isCompleted: function (data) {
            return data && data.completed;
        },
        completeAction: $.noop
        timeOutAction: $.noop
    }
}
```