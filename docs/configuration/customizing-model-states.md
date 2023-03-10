# Customizing Model States

Venture allows you to change the state transitioning behavior of your workflows
and jobs. This gives you full control over extending Venture in ways that
wouldn’t be possible with regular plugins.

::: warning With great power comes great responsibility

This is an escape hatch that most applications won’t ever need. By changing how
and when workflows and jobs transition their states, you are now responsible for
maintaining sensible and consistent states. Use at your own risk.

:::

## Model states

The `Workflow` and `WorkflowJob` models delegate to a state object to compute
their respective states. These state objects are represented by the interfaces
`WorkflowState` and `WorkflowJobState`, respectively.

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

Below is a list of all methods that need to be implemented along with a
description of what they do and Venture’s default behavior.

#### `markJobAsFinished` {#mark-job-as-finished}

This method is called every time a job inside a workflow was processed
successfully.

#### Default behavior

- Add the job’s id to the workflow’s `finished_jobs` array
- Increment the `jobs_processed` field on the workflow
- Mark the job itself as finished by calling the job state’s
  [`markAsFinished`](#mark-as-finished) method.

#### `markJobAsFailed` {#mark-job-as-failed}

This method is called every time an exception occurred while processing a job.

#### Default behavior

- Increment the workflow’s `jobs_failed` field
- Mark the job itself as failed by calling the job state’s
  [`markAsFailed`](#mark-as-failed) method with the exception

#### `allJobsHaveFinished` {#all-jobs-have-finished}

This method is used to check if all jobs of the workflow have been processed
successfully.

#### Default behavior

- Check that the workflow’s `job_count` field equals the workflow’s
  `jobs_processed` field

#### `isFinished` {#is-finished}

This method checks if the workflow itself has finished successfully. Note that
this is different from [`allJobsHaveFinished`](#all-jobs-have-finished) which
only checks that all jobs inside the workflow have finished successfully.

#### Default behavior

- Check if the `finished_at` timestamp of the workflow is not `null`

#### `markAsFinished` {#workflow-mark-as-finished}

This method marks the workflow as finished. After this method was called,
[`isFinished`](#is-finished) must return `true`.

#### Default behavior

- Set the `finished_at` timestamp of the workflow to the current time

#### `isCancelled` {#is-cancelled}

This method checks if the workflow has been cancelled.

#### Default behavior

- Check if the `cancelled_at` timestamp of the workflow is not `null`

#### `markAsCancelled`

This method marks the workflow as cancelled. After this method was called,
[`isCancelled`](#is-cancelled) must return `true`. This method should be
_idempodent_, meaning it should be possible to safely call it multiple times for
the same workflow.

#### Default behavior

- Set the `cancelled_at` timestamp of the workflow to the current time if it
  isn’t set already

#### `remainingJobs` {#remaining-jobs}

This method returns the number of jobs that have not been processed successfully
yet.

#### Default behavior

- Return `$workflow->job_count - $workflow->jobs_processed`

#### `hasRan` {#has-ran}

This method checks if all jobs of the workflow have been run, regardless of
success or failure of the job.

#### Default behavior

- Return
  `$workflow->jobs_processed + $workflow->jobs_failed === $workflow->job_count`

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

Below is a list of all methods that need to be implemented along with a
description of what they do and Venture’s default behavior.

#### `hasFinished` {#has-finished}

This method checks if the job has been processed successfully.

#### Default behavior

- Check if the `finished_at` timestamp of the job is not `null`

#### `markAsFinished` {#job-mark-as-finished}

This method is called whenever a job has been processed successfully. After this
method was called, `hasFinished` must return `true` and `hasFailed`,
`isProcessing`, `isPending`, and `isGated` must return `false`.

#### Default behavior

- Set the `finished_at` timestamp of the job to the current time
- Set the `exception` field of the job to `null` in case the job hadfailed
  previously
- Set the `failed_at` field of the job to null in case the job had failed
  previously

#### `hasFailed`

This method checks if the most recent run of the job was unsuccessful.

#### Default behavior

- Check that `hasFinished` is false
- Check if the `failed_at` timestamp of the job is not `null`

#### `markAsFailed`

This method marks the job as failed. After this method was called, `hasFailed`
must return true and `hasFinished`, `isProcessing`, `isPending`, and `isGated`
must return `false`.

#### Default behavior

- Set the `failed_at` timestamp of the job to the current time
- Save the exception to the `exception` field of the job

#### `isProcessing`

This method checks if the job has been picked up by a worker and is currently
being processed. If this method is `true`, all other methods checking the job’s
state must return `false`.

#### Default behavior

- Check that the job has not finished yet by calling `hasFinished`
- Check that the job has not failed yet by calling `hasFailed`
- Check that the `started_at` field of the job is `null`

#### `markAsProcessing`

This method checks marks the job as currently being processed by a worker. After
this method was called, `isProcessing` must return `true` and all other methods
checking the job’s state must return `false`.

#### Default behavior

- Set the `finished_at` field of the job to `null`
- Set the `failed_at` field of the job to `null`
- Set the `exception` field of the job to `null`
- Set the `started_at` timestamp of the job to the current time

#### `isPending`

This method checks if the job has not run yet. Note that this does not mean that
the job can actually run as it might still have unfinished dependencies.

#### Default behavior

- Check that the job is not currently being processed by calling
  [`isProcessing`](#job-is-processing)
- Check that the job has not failed by calling [`hasFailed`](#job-has-failed)
- Check that the job has not been successfully processed yet by calling
  [`hasFinished`](#job-has-finished)

#### `isGated`

This method checks if the job is gated and waiting to be started manually. If
this method returns `true`, all dependencies of the job must have been processed
successfully.

#### Default behavior

- Check that job is a gated job by checking if the `gated` field of the job is
  `true`
- Check that job has not been processed successfully by calling
  [`hasFinished`](#job-has-finished)
- Check that job has not failed by calling [`hasFailed`](#job-has-failed)
- Check that the job is not currently being processed by calling
  [`isProcessing`](#job-is-processing)
- Check that the `gated_at` field of the job is not `null`

#### `markAsGated`

This method marks the job as gated. After this method was called,
[`isGated`](#job-is-gated) must return `true`. This method should throw an
exception if the job is not a gated job.

#### Default behavior

- Throw an exception if the `gated` field of the job is not `true`
- Set the `gated_at` field of the job to the current time

#### `transition`

This method is called on all jobs that are about to be dispatched by the
`JobDispatcher` component. The main purpose is to transition a job to a
different state based on the current state of the workflow _before_ the job gets
dispatched.

Venture uses this to prevent gated jobs from actually being dispatched by
[marking them as gated](#job-mark-as-gated) if their dependencies have been
processed successfully.

#### Default behavior

- Mark the job as gated by calling [`markAsGated`](#job-mark-as-gated) if the
  job is a gated job and all its dependencies have finished

#### `canRun`

This method checks if a job is ready to be dispatched. This method is called by
the `JobDispatcher` to filter out jobs that should not get dispatched. This
method is called after the [`transition`](#job-transition) method of the job has
been called.

#### Default behavior

- Check that the job is currently pending by calling
  [`isPending`](#job-is-pending)
- Check that the job is not gated by calling [`isGated`](#job-is-gated)
- Check that all dependencies of the job have finished by comparing the job’s
  dependencies with the `finished_jobs` field of the associated workflow

## Swapping out states

In order to provide your own implementation of these states, you may use the
`Venture::useWorkflowState` and `Venture::useWorkflowJobState` methods,
respectively. You should call these methods in your application service
provider’s `boot` method.

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

Workflow states get resolved out of Laravel’s container, so it’s possible to
type hint any dependencies you might need in the constructor. All state model’s
**must** take the `Workflow` or `WorkflowJob` as the first constructor
parameter, respectively.

```php
class CustomWorkflowState implements WorkflowState
{
    public function __construct(
        private Workflow $workflow,
        private OtherDependency $someOtherDependency,
    ) {
    }

    /* ... */
}

class CustomWorkflowJobState implements WorkflowJobState
{
    public function __construct(
        private WorkflowJob $job,
        private OtherDependency $someOtherDependency,
    ) {
    }

    /* ... */
}
```

::: danger Parameter names

Note that the first parameters **must** be called `$workflow` and `$job`,
respectively, as they get injected by name.

:::
