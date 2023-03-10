# Faking Workflows

When testing code that deals with workflows, you may wish to mock out the
workflow so that it is not actually executed during a given test.

Similar to how most of Laravel's built-in facades work, Venture also provides a
way to record which workflows would have been started. This way, you can easily
assert that a workflow was started or not without actually dispatching any jobs.

## Recording started workflows

In your tests, you may use the `Workflow` facade’s `fake` method to record which
workflows were started. You can then use the
[available assertions](#available-assertions) on the `Workflow` face to verify
if a workflow was started or not.

```php
<?php

use App\Workflows\AnotherWorkflow;
use App\Workflows\PublishPodcastWorkflow;
use Sassnowski\Venture\Facades\Workflow;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function testPodcastPublishing(): void
    {
        Workflow::fake();

        // Publish podcast...

        // Assert that a specific workflow was started.
        Workflow::assertStarted(PublishPodcastWorkflow::class);

        // Assert that a workflow was not started...
        Workflow::assertNotStarted(AnotherWorkflow::class);
    }
}
```

## Available assertions

Below is the complete list of available assertions on the `Workflow` facade.

- [`assertStarted`](#assert-started)
- [`assertNotStarted`](#assert-not-started)
- [`assertStartedOnConnection`](#assert-started-on-connection)

### `assertStarted` {#assert-started}

The `assertStarted` method asserts that a given workflow was started.

```php
Workflow::assertStarted(PublishPodcastWorkflow::class);
```

This method also takes a closure as an optional second parameter. This closure
gets called for each started workflow that matches the provided workflow class.
If the closure returns true for at least one workflow, the assertion passes.
Otherwise it fails.

```php
Workflow::assertStarted(
    PublishPodcastWorkflow::class,
    function (PublishPodcastWorkflow $workflow) use ($podcast) {
        return $workflow->podcast->is($podcast);
    }
);
```

The closure also gets passed the queue connection the workflow was started on as
the second parameter.

```php
Workflow::fake();

PublishPodcastWorkflow::startOnConnection('sync');

Workflow::assertStarted(
    PublishPodcastWorkflow::class,
    function (PublishPodcastWorkflow $workflow, ?string $connection) {
        return $connection === 'sync';
    }
);
```

### `assertNotStarted` {#assert-not-started}

The `assertNotStarted` method asserts that a given workflow was not started.

```php
Workflow::assertNotStarted(PublishPodcastWorkflow::class);
```

This method also takes a closure as an optional second parameter. If a closure
is provided, the assertion won’t immediately fail if a workflow was started.
Instead, it will call the closure for each started workflow. If the closure
returns `true` for any of the workflow, the assertions fails. Otherwise it
passes.

```php
Workflow::assertNotStarted(
    PublishPodcastWorkflow::class,
    function (PublishPodcastWorkflow $workflow) use ($podcast) {
        return $workflow->podcast->is($podcast);
    }
);
```

The closure also gets passed the queue connection the workflow was started on as
the second parameter.

```php
Workflow::fake();

PublishPodcastWorkflow::startOnConnection('sqs');

Workflow::assertNotStarted(
    PublishPodcastWorkflow::class,
    function (PublishPodcastWorkflow $workflow, ?string $connection) {
        return $connection === 'sync';
    }
);
```

In the example above, the assertion will pass even though a
`PublishPodcastWorkflow` was started because it was not started on the `sync`
connection.

### `assertStartedOnConnection` {#assert-started-on-connection}

The `assertStartedOnConnection` method asserts that a given workflow was started
on a specific queue connection.

```php
Workflow::assertStartedOnConnection(
    PublishPodcastWorkflow::class,
    'sqs',
);
```
