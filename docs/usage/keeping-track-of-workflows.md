# Keeping track of workflows

Venture allows you to keep track of the state of your workflows after starting them.

## Workflows

When you start a workflow, an instance of the workflow will be returned.

```php
$workflow = PublishPodcastWorkflow::start($podcast);
```

::: tip Note
A workflow is just a regular Eloquent model, so you can do all the things with it that you're used to from Eloquent.
:::

A workflow instance exposes several methods to inspect and manipulate its current state.

```php
// The date the workflow finished...
$workflow->finished_at;

// The date the workflow was cancelled...
$workflow->cancelled_at;

// A collection of WorkflowJob instances that have not been processed yet...
$workflow->pendingJobs();

// A collection of WorkflowJob instances that have failed...
$workflow->failedJobs();

// Indicates if all jobs of the workflow have run successfully
$workflow->allJobsHaveFinished();

// Indicates if the workflow has finished...
$workflow->isFinished();

// Indicates if the workflow has been cancelled...
$workflow->isCancelled();

// Indicates if the workflow has been executed. This returns true if all
// jobs of the workflow have been processed, regardless of whether they
// failed or succeeded.
$workflow->hasRan();

// Marks a workflow as finished. This sets the `finished_at` timestamp
// of the workflow.
$workflow->markAsFinished();

// Cancels the workflow. This sets the `cancelled_at` timestamp of the
// workflow and prevents any new jobs from being processed.
$workflow->cancel();
```

## Workflow jobs

You can access a workflow’s job via its `jobs` relationship.

```php
// Returns a `HasMany<WorkflowJob>` relation
$workflow->jobs();

// Returns a `Collection<int, WorkflowJob>`
$workflow->jobs;
```

A `WorkflowJob` exposes the following methods to inspect and manipulate its state.

```php
// Indicates if the workflow job is pending, i.e. is still waiting
// to get processed
$workflowJob->isPending();

// Indicates if the workflow job has been processed successfully
$workflowJob->isFinished();

// Marks the job as finished. Venture calls this method after a job has been
// processed successfully.
$workflowJob->markAsFinished();

// Indicates if the workflow job has failed. If true, the `exception` field
// of the job will contain the exception that caused the job to fail.
$workflowJob->hasFailed();

// Marks the job as failed. Venture calls this method if an exception occurred
// while processing a job.
$workflowJob->markAsFailed($throwable);

// Indicates if the workflow job is currently being processed by a
// queue worker.
$workflowJob->isProcessing();

// Marks the job as processing. Venture calls this method after the job
// has been picked up by a queue worker.
$workflowJob->markAsProcessing();

// Indicates if a job is ready to be dispatched. By default, this is true if
// all of the job's dependencies have finished and the job is not marked as
// gated.
$workflowJob->canRun();

// Indicates if a job is waiting for manual approval.
$workflowJob->isGated();

// Transitions a job to the next state. Venture calls this method each time
// a job's dependency has finished.
$workflowJob->transition();

// Manually starts a job. Will throw an exception if the job is already
// being processed.
$workflowJob->start();

// Retries the job after it has failed. Will throw an exception if the job
// has not failed.
$workflowJob->retry();
```

