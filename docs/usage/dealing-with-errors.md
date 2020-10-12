# Dealing with errors

[[toc]]

## Failures inside a workflow

To explain how failed jobs affect a workflow let's take a look at the following example:

<div style="text-align: center">
    <img src="/workflow-5.svg" />
</div>

In the workflow above, `JobB` failed to execute successfully. This will prevent all jobs that have either a direct or transitive dependency on it to run. In this case, `JobB` failing will prevent `JobC` from executing, since it has a direct dependency on it.

It will, however, _not_ affect the execution of `JobD` and `JobE` because neither of them have any dependency on `JobB`.

This is a powerful property of workflows as it makes them more robust and less all-or-nothing. Just because you failed to notify your subscribers about a new podcast does not mean that the job to generate a transcription should not be run.

If you do want a workflow to stop executing any further jobs, check the section below about [cancelling a workflow](#cancelling-a-workflow).

## Handling failed steps

Venture tries to provide a familiar API if you're used to Laravel's [queue batching feature](https://laravel.com/docs/8.x/queues#dispatching-batches). As such, you can register a `catch` callback when building your workflow.

```php
Workflow::new('Register Podcast')
    ->addJob(...)
    ->catch(function (Workflow $workflow, $job, Throwable $e) {
        //
    });
```

This callback will be called anytime one of the jobs in the workflow is marked as failed.

::: warning Watch out
When designing your `catch` callback, be aware that it might be called multiple times if multiple jobs fail.
:::

## Cancelling a workflow

You can mark a workflow as cancelled by calling its `cancel` method. This is usually going to happen inside the workflow's `catch` callback, but there's nothing stopping you from fetching a workflow from the database and calling its `cancel` function there. This can be useful if you want to display a _Cancel Workflow_ button in your UI for example.

```php{4}
Workflow::new('Register Podcast')
    ->addJob(...)
    ->catch(function (Workflow $workflow, $job, Throwable $e) {
        $workflow->cancel();
    });
```

A cancelled workflow will not execute any further jobs. It does not affect jobs that have already run or jobs that were already processing when the workflow was cancelled.

::: tip Cancelling an already cancelled job
The `cancel` method of a workflow is [idempotent](https://en.wikipedia.org/wiki/Idempotence), meaning you can safely call it multiple times without updating the timestamp everytime. It will remain the date the workflow was first cancelled.
:::
