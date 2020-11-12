# Asserting that workflows were started

When testing code that deals with workflows, you may wish to mock out the workflow so that it is not actually executed during a given test.

Similar to how most of Laravel's built-in facades work, Venture also provides a way to record which workflows would have been started. This way, you can easily assert that a workflow was started or not without actually dispatching any jobs.

## Workflow Fake

In your tests, use the `Workflow` facade's `fake` method to prevent workflows from being started.

```php
<?php declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Podcast;
use App\Workflows\AnotherWorkflow;
use Sassnowski\Venture\Facades\Workflow;
use App\Workflows\PublishPodcastWorkflow;

class ExampleTest extends TestCase
{
    /** @test */
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

You can optionally pass a callback as the second parameter to any of the assertion methods. The callback will get passed the started workflow (if there is one) and should return a boolean.

```php
Workflow::assertStarted(
    PublishPodcastWorkflow::class,
    function (PublishPodcastWorkflow $workflow) use ($podcast) {
        // The assertion will fail if this callback returns `false`...
        return $workflow->podcast->is($podcast);
    }
);
```
