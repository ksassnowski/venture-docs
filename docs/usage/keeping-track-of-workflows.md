# Keeping track of workflows

## Persistance

All workflows and their individual steps get stored inside the database. When you start a workflow, an instance of the workflow will be returned.

```php
$workflow = PublishPodcastWorkflow::start($podcast);
```

::: tip Note
A workflow is just a regular Eloquent model, so you can do all the things with it that you're used to from Eloquent.
:::

By default, these tables are called `workflows` and `workflow_jobs`. This can be changed in the configuration, however.

## Performing an action after the workflow has finished

## Inspecting workflows

A workflow instance exposes several methods to inspect its current state.

```php
// The date the workflow finished...
$workflow->finished_at;

// The date the workflow was cancelled...
$workflow->cancelled_at;

// A collection of WorkflowJob instances that have not been processed yet...
$workflow->pendingJobs();

// A collection of WorkflowJob instances that have failed...
$workflow->failedJobs();

// Indicates if the workflow has finished...
$workflow->isFinished();

// Indicates if the workflow has been cancelled...
$workflow->isCancelled();

// Indicates if the workflow has been executed...
$workflow->hasRan();
```
