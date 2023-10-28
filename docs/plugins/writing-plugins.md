# Plugins

The main way to extend Venture is by writing plugins. Venture fires events
during various parts of the lifecycle of a workflow. Plugins provide you with a
convenient way to hook into these events.

## Creating a plugin

A plugin is a class that implements the `Plugin` interface that comes with
Venture. This interface defines a single method `install` that Venture calls
when your application boots.

```php
<?php

use Sassnowski\Venture\Plugin\Plugin;
use Sassnowski\Venture\Plugin\PluginContext;

class MyFirstPlugin implements PluginInterface
{
    public function install(PluginContext $context): void
    {
        // ...
    }
}
```

The `install` method accepts a `PluginContext` as its only argument. The
`PluginContext` is the main API provided to plugins that allows them to hook
into Venture’s various events.

To register an event listener, call the method on the `PluginContext` that
corresponds to the event and pass in a handler.

```php
public function install(PluginContext $context): void
{
    $context->onWorkflowCreating(function (WorkflowCreating $event) {
       // work, work, work...
    });
}
```

::: tip Available events

See the [section below](#available-events) for a complete list of all methods
the `PluginContext` exposes as well as their corresponding events.

:::

You aren’t limited to a single event handler per event. You can call the same
method of the `PluginContext` multiple times to register multiple handlers.

```php
public function install(PluginContext $context): void
{
    $context->onWorkflowCreating(function (WorkflowCreating $event) {
       // work, work, work...
    });

    $context->onWorkflowCreating(function (WorkflowCreating $event) {
       // different work, work, work...
    });
}
```

While the examples above uses a closure as an event handler, you can pass any
parameter that Laravel’s event dispatcher understands.

```php
$context->onWorkflowCreating(MyEventListener::class);
$context->onWorkflowCreating([MyEventListener::class, 'execute']);
$context->onWorkflowCreating('App\Listeners\MyEventListener@execute');
```

When registering a handler using a class string, the handler will be resolved
out of Laravel’s container. This means you can typehint any dependency your
event listener might need in its constructor.

### Plugin dependencies

Plugins themselves also get resolved out of Laravel’s container. This means you
can typehint any dependency the plugin needs in its constructor.

```php
<?php

use App\SomeService;
use Sassnowski\Venture\Plugin\Plugin;
use Sassnowski\Venture\Plugin\PluginContext;

class MyPlugin implements Plugin
{
    public function __construct(private SomeService $service)
    {
    }

    public function install(PluginContext $context): void
    {
        // ...
    }
}
```

### Other setup inside a plugin

A plugin’s `install` method isn’t limited to registering event listeners. For
example, if your plugin also needs to
[change the default models](/configuration/customizing-models) Venture uses, you
can also add this to your plugin’s `install` method.

```php
<?php

use App\Models\MyWorkflowModel;
use App\Models\MyWorkflowJobModel;
use Sassnowski\Venture\Plugin\Plugin;
use Sassnowski\Venture\Plugin\PluginContext;

class MyPlugin implements Plugin
{
    public function install(PluginContext $context): void
    {
        Venture::useWorkflowModel(MyWorkflowModel::class);
        Venture::useWorkflowJobModel(MyWorkflowJobModel::class);

        // Other plugin setup...
    }
}
```

::: danger Plugins get registered during `boot`

Be aware that plugins get installed when the `boot` method of Venture’s service
provider gets called. This means that any setup that needs to happen during the
`register` phase of the application startup–such as registering container
bindings–should not be performed inside a plugin.

:::

## Registering Plugins

Plugins are registered by calling `Venture::registerPlugin` and passing it the
fully qualified name of your plugin class. This should be done inside the
`register` method of your `AppServiceProvider`.

```php
<?php

use App\Plugins\MyPlugin;
use Illuminate\Support\ServiceProvider;
use Sassnowski\Venture;

class AppServiceProvider extends ServiceProvider
{
    public function register()
    {
        Venture::registerPlugin(MyPlugin::class);
    }
}
```

You also pass multiple plugins to the `registerPlugin` call at once.

```php
Venture::registerPlugin(
    MyFirstPlugin::class,
    MySecondPlugin::class,
);
```

## Available Events

Below is a list of all events Venture fires during its life cycle. You can click
on each event to jump to the section explaining when this event gets fired, how
to register a handler for it, and what the event payload is.

- [`JobAdding`](#job-adding)
- [`JobAdded`](#job-added)
- [`JobCreating`](#job-creating)
- [`JobCreated`](#job-created)
- [`JobFailed`](#job-failed)
- [`JobFinished`](#job-finished)
- [`JobProcessing`](#job-processing)
- [`WorkflowAdding`](#workflow-adding)
- [`WorkflowAdded`](#workflow-added)
- [`WorkflowCreating`](#workflow-creating)
- [`WorkflowCreated`](#workflow-created)
- [`WorkflowFinished`](#workflow-finished)
- [`WorkflowStarted`](#workflow-started)

### `JobAdding` {#job-adding}

Corresponds to `PluginContext::onJobAdding`.

- This event fires when a new job is getting added to a workflow’s definition.
  This happens at the beginning of the `WorkflowDefinition::addJob` method.
- When this event gets fired, the job hasn’t yet been added to the dependency
  graph of the workflow, so you can still make changes to it.

#### Payload

```php
final class JobAdding
{
    public function __construct(
        public WorkflowDefinition $definition,
        public WorklfowStepInterface $job,
        public ?string $name,
        public mixed $delay,
        public ?string $id,
    ) {
    }
}
```

| Property      | Type                                                 | Description                                                                                                                                                                                                                                                   |
| ------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$definition` | `WorkflowDefinition`                                 | The `WorkflowDefinition` object to which the job is getting added. You can get the actual workflow class the definition belongs to via the `$definition->workflow()` method.                                                                                  |
| `$job`        | `WorkflowableJob`                                    | The job instance that is being added to the definition.                                                                                                                                                                                                       |
| `$name`       | `string \| null`                                     | The name of the job that was passed to the `addJob` method. You can change the name of the job by setting this property on the event. If `$name` is still `null` after all event listeners have been called, the FQCN of the job class will get used instead. |
| `$delay`      | `DateTimeInterface \| DateInterval \| array \| null` | The delay for the job that was passed to the `addJob` method. You can change the delay of the job by setting this property on the event.                                                                                                                      |
| `$jobID`      | `string \| null`                                     |                                                                                                                                                                                                                                                               |
### `JobAdded` {#job-added}

Corresponds to `PluginContext::onJobAdded`.

- This event fires after a job was added to a workflow. This happens at the end
  of the `WorkflowDefinition::addJob` method.

#### Payload

```php
final class JobAdded
{
    public function __construct(
        public WorkflowDefinition $definition,
        public WorkflowableJob $job,
    ) {
    }
}
```

| Parameter     | Type                 | Description                                                                                                          |
| ------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `$definition` | `WorkflowDefinition` | The definition the job was added to. You can get the actual workflow class via the `$definition->workflow()` method. |
| `$job`        | `WorkflowableJob`    | The job instance that was added.                                                                                     |

### `JobCreating` {#job-creating}

Corresponds to `PluginContext::onJobCreating`.

- This event fires before a `WorkflowJob` gets saved to the database. This
  happens after the `start` method of a workflow was called but before the
  workflow has actually started.
- This event fires for every job that was added to the workflow’s definition.
- This event fires right before [`JobCreated`](#job-created)

#### Payload

```php
final class JobCreating
{
    public function __construct(
        public Workflow $workflow,
        public WorkflowJob $job,
    ) {
    }
}
```

| Parameter   | Type          | Description                                                                                                                            |
| ----------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `$workflow` | `Workflow`    | The workflow Eloquent model that the job is associated with.                                                                           |
| `$job`      | `WorkflowJob` | The Eloquent model of the job that is about to be saved. You can retrieve the related `WorkflowableJob` via the `$job->step()` method. |

### `JobCreated` {#job-created}

Corresponds to `PluginContext::onJobCreated`.

- This event fires after a `WorkflowJob` got saved to the database. This happens
  after the `start` method of a workflow was called but before the workflow has
  actually started.
- This event fires for every job that was added to a workflow’s definition.
- This event fires right after [`JobCreating`](#job-creating).

#### Payload

```php
final class JobCreated
{
    public function __construct(
        public WorkflowJob $job,
    ) {
    }
}
```

| Parameter | Type          | Description                                                                                                                                                                                                 |
| --------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$job`    | `WorkflowJob` | The Eloquent model of the job that is about to be saved. You can retrieve the related `WorkflowableJob` via the `$job->step()` method. You can retrieve the associated workflow model via `$job->workflow`. |

### `JobFailed` {#job-failed}

Corresponds to `PluginContext::onJobFailed`.

- This event fires after an error occured while processing a job.
- This event fires after the `catch` callback of the corresponding workflow was
  called.

#### Payload

```php
final class JobFailed
{
    public function __construct(
        public WorkflowableJob $job,
        public Throwable $exception,
    ) {
    }
}
```

| Parameter    | Type              | Description                                                                 |
| ------------ | ----------------- | --------------------------------------------------------------------------- |
| `$job`       | `WorkflowableJob` | The failed job instance. You can retry a job by calling its `retry` method. |
| `$exception` | `Throwable`       | The exception that occurred while processing the job.                       |

### `JobFinished` {#job-finished}

Corresponds to `PluginContext::onJobFinished`.

- This event fires after a job was processed successfully.

#### Payload

```php
final class JobFinished
{
    public function __construct(
        public WorkflowableJob $job,
    ) {
    }
}
```

| Parameter | Type              | Description       |
| --------- | ----------------- | ----------------- |
| `$job`    | `WorkflowableJob` | The job instance. |

### `JobProcessing` {#job-processing}

Corresponds to `PluginContext::onJobProcessing`.

- This event fires after a job was picked up by a queue worker.
- This event will _not_ fire if the workflow the job belongs to has been
  cancelled in the meantime.

#### Payload

```php
final class JobProcessing
{
    public function __construct(
        public WorkflowableJob $job,
    ) {
    }
}
```

| Parameter | Type              | Description       |
| --------- | ----------------- | ----------------- |
| `$job`    | `WorkflowableJob` | The job instance. |

### `WorkflowAdding` {#workflow-adding}

Corresponds to `PluginContext::onWorkflowAdding`.

- This event fires when a nested workflow is getting added to a workflow. This
  happens at the beginning of the `addWorkflow` method.
- When this event fires, the nested workflow has not been added yet so you can
  still make changes.

#### Payload

```php
final class WorkflowAdding
{
    public function __construct(
        public WorkflowDefinition $parentDefinition,
        public WorkflowDefinition $nestedDefinition,
        public string $workflowID,
    ) {
    }
}
```

| Parameter           | Type                 | Description                                                                                                                                                           |
| ------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$parentDefinition` | `WorkflowDefinition` | The definition of the parent workflow, i.e. the workflow the nested workflow gets added to. You can get the actual workflow via the `$definition->workflow()` method. |
| `$nestedDefinition` | `WorkflowDefinition` | The definition of the workflow that is getting nested into `$parentDefinition`. You can get the actual workflow via the `$definition->workflow()` method.             |
| `$workflowID`       | `string`             | The ID of the workflow that was passed to the `addJob` method.                                                                                                        |

### `WorkflowAdded` {#workflow-added}

Corresponds to `PluginContext::onWorkflowAdded`.

- This event fires after a nested workflow was added to a workflow. This happens
  at the end of the `addWorkflow` method.

#### Payload

```php
final class WorkflowAdding
{
    public function __construct(
        public WorkflowDefinition $parentDefinition,
        public WorkflowDefinition $nestedDefinition,
        public string $workflowID,
    ) {
    }
}
```

| Parameter           | Type                 | Description                                                                                                                                                          |
| ------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$parentDefinition` | `WorkflowDefinition` | The definition of the parent workflow, i.e. the workflow the nested workflow was added to. You can get the actual workflow via the `$definition->workflow()` method. |
| `$nestedDefinition` | `WorkflowDefinition` | The definition of the workflow that was nested into `$parentDefinition`. You can get the actual workflow via the `$definition->workflow()` method.                   |
| `$workflowID`       | `string`             | The ID of the nested workflow.                                                                                                                                       |

### `WorkflowCreating` {#workflow-creating}

Corresponds to `PluginContext::onWorkflowCreating`.

- This event fires before a `Workflow` gets saved to the database. This happens
  after the `start` method of a workflow was called but before the workflow has
  actually started.
- This event fires right before `WorkflowCreated`.
- This event fires before the `beforeCreate` hook of the workflow gets called.
- This event fires before any `JobCreating` events fire.

#### Payload

```php
final class WorkflowCreating
{
    public function __construct(
        public WorkflowDefinition $definition,
        public Workflow $model,
    ) {
    }
}
```

| Parameter     | Type                 | Description                                                                                                                                        |
| ------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$definition` | `WorkflowDefinition` | The definition of the workflow that is about to be saved. You can get the actual workflow class via the `$definition->workflow()` method.          |
| `$workflow`   | `Workflow`           | The workflow Eloquent model that is about to be saved. At this point the model has not been persisted yet, so you can still change its attributes. |

### `WorkflowCreated` {#workflow-created}

Corresponds to `PluginContext::onWorkflowCreated`.

- This event fires after a `Workflow` was saved to the database. This happens
  after the `start` method of a workflow was called but before the workflow has
  actually started.
- This event fires right after `WorkflowCreating`.
- This event fires before any `JobCreating` events fire.

#### Payload

```php
final class WorkflowCreated
{
    public function __construct(
        public WorkflowDefinition $definition,
        public Workflow $model,
    ) {
    }
}
```

| Parameter     | Type                 | Description                                                                                                                                                      |
| ------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$definition` | `WorkflowDefinition` | The definition of the workflow that is about to be saved. You can get the actual workflow class via the `$definition->workflow()` method.                        |
| `$workflow`   | `Workflow`           | The workflow Eloquent model that is about to be saved. At this point, the workflow has been persisted to the database so you can get its ID via `$workflow->id`. |

### `WorkflowFinished` {#workflow-finished}

Corresponds to `PluginContext::onWorkflowFinished`.

- This event fires after a `Workflow` after every job of a workflow has been
  successfully processed.
- This event fires after the `then` callback of the corresponding workflow was
  called.

#### Payload

```php
final class WorkflowFinished
{
    public function __construct(
        public Workflow $workflow,
    ) {
    }
}
```

| Parameter   | Type       | Description                                           |
| ----------- | ---------- | ----------------------------------------------------- |
| `$workflow` | `Workflow` | The workflow Eloquent model of the finished workflow. |

### `WorkflowStarted` {#workflow-started}

Corresponds to `PluginContext::onWorkflowStarted`.

- This event fires after a workflow was started.
- This event fires after the initial jobs of the workflow have been dispatched.
- This event fires after the `WorkflowCreating` and `WorkflowCreated` events.

#### Payload

```php
final class WorkflowStarted
{
    /**
     * @param array<int, WorkflowableJob> $initialJobs
     */
    public function __construct(
        public AbstractWorkflow $workflow,
        public Workflow $model,
        public array $initialJobs,
    ) {
    }
}
```

| Parameter      | Type                          | Description                                                                               |
| -------------- | ----------------------------- | ----------------------------------------------------------------------------------------- |
| `$workflow`    | `AbstractWorkflow`            | The workflow class of the started workflow.                                               |
| `$model`       | `Workflow`                    | The Eloquent model of the started workflow.                                               |
| `$initialJobs` | `array<int, WorkflowableJob>` | The job instances of the initial jobs that were dispatched when the workflow was started. |
