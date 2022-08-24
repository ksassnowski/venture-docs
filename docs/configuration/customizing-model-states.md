# Customizing Model States

Venture allows you to change the state transitioning behavior of your workflows and jobs. This gives you full control over extending Venture in ways that wouldn’t be possible with regular plugins.

::: warning With great power comes great responsibility
This is an escape hatch that most applications won’t ever need. By changing how and when workflows and jobs transition their states, you are now responsible for maintaining sensible and consistent states. Use at your own risk.
:::

## Model states

The `Workflow` and `WorkflowJob` models delegate to a state object to compute their respective states. These state objects are represented by the interfaces `WorkflowState` and `WorkflowJobState`, respectively.

### The `WorkflowState` interface

```php
interface WorkflowState
{
    public function markJobAsFinished(WorkflowableJob $job): void;

    public function markJobAsFailed(WorkflowableJob $job, Throwable $exception): void;

    public function allJobsHaveFinished(): bool;

    public function isFinished(): bool;

    public function markAsFinished(): void;

    public function isCancelled(): bool;

    public function markAsCancelled(): void;

    public function remainingJobs(): int;

    public function hasRan(): bool;
}
```

Below is a list of all methods that need to be implemented along with a description of what they do and Venture’s default behavior.

#### `markJobAsFinished` {#mark-job-as-finished}

This method is called every time a job inside a workflow was processed successfully.

#### Default behavior

- Add the job’s id to the workflow’s `finished_jobs` array 
- Increment the `jobs_processed` field on the workflow
- Mark the job itself as finished by calling the job state’s [`markAsFinished`](#mark-as-finished) method.

#### `markJobAsFailed` {#mark-job-as-failed}

This method is called every time an exception occurred while processing a job.

#### Default behavior

- Increment the workflow’s `jobs_failed` field
- Mark the job itself as failed by calling the job state’s [`markAsFailed`](#mark-as-failed) method with the exception

#### `allJobsHaveFinished` {#all-jobs-have-finished}

This method is used to check if all jobs of the workflow have been processed successfully.

#### Default behavior

- Check that the workflow’s `job_count` field equals the workflow’s `jobs_processed` field

#### `isFinished` {#is-finished}

This method checks if the workflow itself has finished successfully. Note that this is different from [`allJobsHaveFinished`](#all-jobs-have-finished) which only checks that all jobs inside the workflow have finished successfully.

#### Default behavior

- Check if the `finished_at` timestamp of the workflow is not `null`

#### `markAsFinished` {#workflow-mark-as-finished}

This method marks the workflow as finished. After this method was called, [`isFinished`](#is-finished) must return `true`.

#### Default behavior

- Set the `finished_at` timestamp of the workflow to the current time

#### `isCancelled` {#is-cancelled}

This method checks if the workflow has been cancelled.

#### Default behavior

- Check if the `cancelled_at` timestamp of the workflow is not `null`

#### `markAsCancelled`

This method marks the workflow as cancelled. After this method was called, [`isCancelled`](#is-cancelled) must return `true`. This method should be _idempodent_, meaning it should be possible to safely call it multiple times for the same workflow.

#### Default behavior

- Set the `cancelled_at` timestamp of the workflow to the current time if it isn’t set already

#### `remainingJobs` {#remaining-jobs}

This method returns the number of jobs that have not been processed successfully yet.

#### Default behavior

- Return `$workflow->job_count - $workflow->jobs_processed`

#### `hasRan` {#has-ran}

This method checks if all jobs of the workflow have been run, regardless of success or failure of the job.

#### Default behavior

- Return `$workflow->jobs_processed + $workflow->jobs_failed === $workflow->job_count`

### The `WorkflowJobState` interface

```php
interface WorkflowJobState
{
    public function hasFinished(): bool;

    public function markAsFinished(): void;

    public function hasFailed(): bool;

    public function markAsFailed(Throwable $exception): void;

    public function isProcessing(): bool;

    public function markAsProcessing(): void;

    public function isPending(): bool;

    public function isGated(): bool;

    public function markAsGated(): void;

    public function transition(): void;

    public function canRun(): bool;
}
```

Below is a list of all methods that need to be implemented along with a description of what they do and Venture’s default behavior.

#### `hasFinished` {#has-finished}

_todo_

#### `markAsFinished` {#job-mark-as-finished}

_todo_

#### `hasFailed`

_todo_

#### `markAsFailed`

_todo_

#### `isProcessing`

_todo_

#### `markAsProcessing`

_todo_

#### `isPending`

_todo_

#### `isGated`

_todo_

#### `markAsGated`

_todo_

#### `transition`

_todo_

#### `canRun`

_todo_

## Swapping out states

In order to provide your own implementation of these states, you may use the `Venture::useWorkflowState` and `Venture::useWorkflowJobState` methods, respectively. You should call these methods in your application service provider’s `boot` method.

```php
use App\WorkflowState;
use App\WorkflowJobState;
use Sassnowski\Venture\Venture;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Venture::useWorkflowState(WorkflowState::class);
    Venture::useWorkflowJobState(WorkflowJobState::class);
}
```

