# post-long-runner-with-long-poller
POST submission of a long running operation and check status using long poll appoach to completion/failure

1. This this library to POST data into a long running process. 
2. The completion of the long running process is periodically checked using a status call. 
3. Dependant on JQuery. Include on the page after JQuery is loaded.
4. Call `Runner.longPollOperation(options)`

TODO
Document the options
