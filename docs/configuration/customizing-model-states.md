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

#### `markJobAsFinished`

_todo_

#### `markJobAsFailed`

_todo_

#### `allJobsHaveFinished`

_todo_

#### `isFinished`

_todo_

#### `markAsFinished`

_todo_

#### `isCancelled`

_todo_

#### `markAsCancelled`

_todo_

#### `remainingJobs`

_todo_

#### `hasRan`

_todo_

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

#### `hasFinished`

_todo_

#### `markAsFinished`

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
public function boot(): voidääs
{
    Venture::useWorkflowState(WorkflowState::class);
    Venture::useWorkflowJobState(WorkflowJobState::class);
}
```

