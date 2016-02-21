# Long-Runner-With-Status-Poller 
POST submission of a long running operation (on the backend) and check status using long poll appoach to completion/failure

1. This this library to POST data into a long running process. 
2. The completion of the long running process is periodically checked using a status call. 
3. Dependant on JQuery. Include on the page after JQuery is loaded.
4. Call `Runner.longPollOperation(options)`
5. Returns a JQuery Promise that resolves when Long Running process completes (status returns completed)
6. Returned Promise is rejected in case of 1. a Time out or 2. Long Running process coould not be submitted
7. Uses JQuery.ajax for backend interactions. 

TODO
Document the options

Options Sample 
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