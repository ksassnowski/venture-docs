# Testing workflows

## Rationale

You might wonder why testing workflows definitions is necessary at all. Aren't
they simply configuration? Let's have a look at an abbreviated example from the
docs: publishing a podcast.

```php
class PublishPodcastWorkflow extends AbstractWorkflow
{
    public function __construct(private Podcast $podcast)
    {
    }

    public function definition(): WorkflowDefinition
    {
        return $this->define('Publish Podcast')
            ->addJob(new ReleaseOnTransistorFM($this->podcast))
            ->addJob(new ReleaseOnApplePodcasts($this->podcast));
    }
}
```

This is a pretty straight forward workflow without any branches or conditions.
Not having tests for this is probably fine.

Now imagine that you're writing a podcasting platform that allows users to
configure on which platforms they want to publish their podcasts. Now your
definition might look something like this.

```php
public function definition(): WorkflowDefinition
{
    return $this->define('Publish Podcast')
        ->addJob(new ProcessPodcast($this->podcast))
        ->when(
        	$this->podcast->publish_on_apple_podcasts,
        	function (WorkflowDefinition $definition) {
		        $workflow->addJob(new ReleaseOnApplePodcasts($this->podcast));
            }
    	)
        ->when(
        	$this->podcast->publish_on_transistor_fm,
        	function (WorkflowDefinition $definition) {
                $workflow->addJob(new ReleaseOnTransistorFM($this->podcast));
            }
    	);
}
```

Now, there are 4 paths through this function:

- Publish only on Apple Podcasts
- Publish only on Transistor
- Publish to both Apple Podcasts and Transistor
- Don't publish to either platform

This is something you should probably test.

::: tip Conditional jobs

In case you don’t know how the `when` method works, check out the section about
[adding conditional jobs to workflows](/usage/configuring-workflows#conditional-jobs).

:::

Another example could be to schedule the release of the podcast ahead of time,
but still perform all the processing and optimizing as soon as possible.

```php
public function definition(): WorkflowDefinition
{
    return $this->define('Publish Podcast')
        ->addJob(new ProcessPodcast($this->podcast))
        ->addJob(
        	new OptimizePodcast($this->podcast),
        	[ProcessPodcast::class],
    	)
        ->addJob(
            new ReleaseOnApplePodcasts($this->podcast),
            [OptimizePodcast::class],
        	delay: $this->podcast->release_date,
        )
        ->addJob(
            new ReleaseOnTransistorFM($this->podcast),
            [OptimizePodcast::class],
	        delay: $this->podcast->release_date,
        );
}
```

In this example, you might want to test that `ReleaseOnTransistorFM` and
`ReleaseOnApplePocasts` get scheduled with the correct delay. It gets even more
complicated if you combine these two features.

```php
public function definition(): WorkflowDefinition
{
    return $this->define('Publish Podcast')
        ->addJob(new ProcessPodcast($this->podcast))
        ->addJob(
        	new OptimizePodcast($this->podcast),
        	[ProcessPodcast::class]
    	)
        ->when(
        	$this->podcast->release_on_apple_podcasts,
        	function (WorkflowDefinition $definition) {
                $definition->addJob(
		            new ReleaseOnApplePodcasts($this->podcast),
		            [OptimizePodcast::class],
                    delay: $this->podcast->release_date,
                );
            }
    	)
        ->when(
        	$this->podcast->release_on_transistor,
        	function (WorkflowDefinition $definition) {
                $definition->addJob(
		            new ReleaseOnTransistorFM($this->podcast),
		            [OptimizePodcast::class],
                    delay: $this->podcast->release_date,
		        );
            }
        );
}
```

I think you get the point by now but let's take it one step further to really
drive the point home.

Let's assume that podcast optimization is a paid feature on your platform. As
such, you give users an option to enable or disable it on a per-podcast basis.

This is a really interessting example because the dependency graph of your
workflow actually changes depending on what the user selects. If podcast
optimization is turned off, the `ReleaseOnTransistorFM` and
`ReleaseOnApplePodcast` jobs should _not_ depend on the `OptimizePodcast` job
(otherwise the workflow will throw an exception about an unresolvable
dependency). In this case, they should depend on the `ProcessPodcast` job
instead.

```php
public function definition(): WorkflowDefinition
{
    return $this->define('Publish Podcast')
        ->addJob(new ProcessPodcast($this->podcast))
        // Add the `OptimizePodcast` job only if optimizations
        // are enabled for the podcast.
        ->when(
        	$this->podcast->optimization_enabled,
        	function (WorkflowDefinition $definition) {
                 $workflow->addJob(
                     new OptimizePodcast($this->podcast),
                     [ProcessPodcast::class]
                 );
            },
    	)
        // Add the `ReleaseOnApplePodcast` job only if the job
        // should get released on Apple Podcasts.
        ->when(
	        $this->podcast->release_on_apple_podcasts,
        	function (WorkflowDefinition $definition) {
           		$workflow->addJob(
		            new ReleaseOnApplePodcasts($this->podcast),
        		    // Depend on different jobs, depending on whether
                    // optimizations are enabled or not.
					[
                        ConditionalDependency::whenDefined(
                            OptimizePodcast::class,
                            ProcessPodcast::class
                        )
                    ],
					delay: $this->podcast->release_date,
        		);
            },
    	)
        // Add the `ReleaseOnApplePodcast` job only if the job
        // should get released on Apple Podcasts.
        ->when(
        	$this->podcast->release_on_transistor,
        	function (WorkflowDefinition $definition) {
           		$workflow->addJob(
		            new ReleaseOnTransistorFM($this->podcast),
        		    // Depend on different jobs, depending on whether
                    // optimizations are enabled or not.
					[
                        ConditionalDependency::whenDefined(
                            OptimizePodcast::class,
                            ProcessPodcast::class
                        )
                    ],
					delay: $this->podcast->release_date,
        		);
            },
    	);
}
```

::: tip Depending on conditional jobs

Confused about what the deal is with this `ConditionalDependency::whenDefined()`
business? Check out the section about
[depending on conditional jobs](/usage/configuring-workflows#depending-on-conditional-jobs)
to learn more.

:::

This single workflow can now take on very different shapes depending on its
input. For cases like these, Venture provides you with a few helper methods that
allow you to check your workflow definitions for correctness.

## Testing workflows

Venture provides a `WorkflowTester` class which helps you test your workflows.
The `WorkflowTester` wraps your actual workflow and provides you with various
assertion methods to inspect the workflow.

```php
<?php

use App\Models\Podcast;
use App\Workflows\PublishPodcastWorkflow;
use Sassnowski\Venture\Testing\WorkflowTester;
use Tests\TestCase;

class PublishPodcastWorkflowTest extends TestCase
{
    public function testOptimizePodcastJobGetsAddedIfOptimizationsAreEnabled(): void
    {
        $podcast = new Podcast(['optimizations_enabled' => true]);

        $workflowTester = new WorkflowTester(
            new PublishPodcastWorkflow($podcast)
        );

        $workflowTester->assertJobExistsWithDependencies(
            OptimizePodcast::class,
            [ProcessPodcast::class],
        );
    }
}
```

As a convenience, every workflow exposes a static `test` method which returns a
new `WorkflowTester` instance for the given workflow. Using this method, the
above test can also be written as follows:

```php
public function testOptimizePodcastJobGetsAddedIfOptimizationsAreEnabled(): void
{
    $podcast = new Podcast(['optimizations_enabled' => true]);

    PublishPodcastWorkflow::test($podcast)
        ->assertJobExistsWithDependencies(
            OptimizePodcast::class,
            [ProcessPodcast::class],
        );
}
```

Any parameters passed to the `test` method get passed to the workflow’s
constructor.

## Available assertions

Below is a list of all available assertions to inspect a workflow’s definition.

- [`assertJobExists`](#assert-job-exists)
- [`assertJobMissing`](#assert-job-missing)
- [`assertJobExistsWithDependencies`](#assert-job-exists-with-dependencies)
- [`assertJobExistsOnConnection`](#assert-job-exists-on-connection)
- [`assertJobExistsOnQueue`](#assert-job-exists-on-queue)
- [`assertGatedJobExists`](#assert-gated-job-exists)
- [`assertWorkflowExists`](#assert-workflow-exists)
- [`assertWorkflowMissing`](#assert-workflow-missing)

::: details Using the correct job ID in assertions

Be aware that all assertions check if a workflow contains a job for a given
**ID**. This means that when adding a job with an explicit id, you have to use
the same id in the assertions.

```php
$this->define('Publish Podcast')
    ->addJob(new ProcessPodcast(), id: 'process-podcast');
```

In this example, the id of the job is `process-podcast`, _not_
`ProcessPodcast::class`. To check if the workflow either contains or doesn’t
contain this job, you need to pass `process-podcast` as the job id to the
assertion method.

```php
PublishPodcastWorkflow::test($podcast)
    // This will pass since the workflow does contain
    // a job with it `process-podcast`.
    ->assertJobExists('process-podcast')
    // This will fail since there is no job with the
    // id `ProcessPodcast::class`.
    ->assertJobExists(ProcessPodcast::class);
```

If you don’t provide an explicit ID when adding a job to a workflow, Venture
uses the fully qualified name of the job class by default.

```php
$this->define('Publish Podcast')
    ->addJob(new ProcessPodcast());

PublishPodcastWorkflow::test($podcast)
    // This will pass since there is a job with the
    // id `ProcessPodcast::class`.
    ->assertJobExists(ProcessPodcast::class);
```

:::

### `assertJobExists` {#assert-job-exists}

The `assertJobExists` method asserts that a workflow contains a job with the
provided ID.

```php
$podcast = new Podcast(['optimization_enabled' => true]);

PublishPodcastWorkflow::test($podcast)
    ->assertJobExists(OptimizePodcast::class);
```

The method also takes a closure as an optional second parameter that gets called
with the found job if it exists. If the closure returns true, the assertion
passes. If it returns false, the assertion fails.

```php
$podcast = new Podcast(['optimization_enabled' => true]);

PublishPodcastWorkflow::test($podcast)
    ->assertJobExists(
    	OptimizePodcast::class,
    	function (WorkflowableJob $job) {
            return $job->getQueue() === 'high-priority';
        }
	);
```

::: tip Using the right assertion

`assertJobExists` is the most generic assertion to check if a workflow contains
a certain job. It is useful when you want to check multiple properties of a job
at the same time.

If you only want to check for specific properties of a job—for example its
dependencies—using one of the more specific assertions is going to be more
expressive and yield clearer errors if the assertion fails.

:::

### `assertJobMissing` {#assert-job-missing}

The `assertJobMissing` method asserts that a workflow does not contain a job
with the provided ID.

```php
$podcast = new Podcast(['optimization_enabled' => false]);

PublishPodcastWorkflow::test($podcast)
    ->assertJobMissing(OptimizePodcast::class);
```

Similar to `assertJobExists`, this assertion also accepts a closure as an
optional second parameter. If a closure is provided, the assertion doesn’t
immediately fail if a job for the given id exists in the workflow. Instead, the
closure gets called with the found job. If the closure returns `false`, the
assertion passes. If it returns `true`, the assertion fails.

```php
$podcast = new Podcast(['optimization_enabled' => false]);

PublishPodcastWorkflow::test($podcast)
    ->assertJobMissing(
    	OptimizePodcast::class,
    	function (WorkflowableJob $job) {
            return $job->getQueue() === 'high-priority';
        }
	);
```

The example above would pass even if the workflow contains an `OptimizePodcast`
job, as long as the job’s queue isn’t also set to `high-priority`.

### `assertJobExistsWithDependencies` {#assert-job-exists-with-dependencies}

The `assertJobExistsWithDependencies` asserts that a workflow contains a job
with the provided ID and dependencies.

```php
$podcast = new Podcast([
    'optimization_enabled' => true
    'release_on_apple_podcasts' => true,
]);

PublishPodcastWorkflow::test($podcast)
    ->assertJobExistsWithDependencies(
	    ReleaseOnApplePodcasts::class,
    	[OptimizePodcast::class],
    );
```

`assertJobExistsWithDependencies` checks for an **exact** match of the job’s
dependencies so be sure to provide all dependencies the job should have.

### `assertJobExistsOnConnection` {#assert-job-exists-on-connection}

The `assertJobExistsOnConnection` method asserts that a workflow contains a job
with the provided ID and connection.

```php
$podcast = new Podcast([
    'notify_user' => true,
]);

PublishPodcastWorkflow::test($podcast)
    ->assertJobExistsOnConnection(
	    SendNotificationToUser::class,
    	'sqs',
    );
```

### `assertJobExistsOnQueue` {#assert-job-exists-on-queue}

The `assertJobExistsOnQueue` method asserts that a workflow contains a job with
the provided ID and queue.

```php
$podcast = new Podcast(['optimization_enabled' => true]);

PublishPodcastWorkflow::test($podcast)
    ->assertJobExistsOnQueue(
    	OptimizePodcast::class,
    	'high-priority',
	);
```

### `assertGatedJobExists` {#assert-gated-job-exists}

The `assertJobGatedJobExists` method asserts that a workflow contains a
[gated job](/usage/configuring-workflows#gated-jobs) with the provided ID.

```php
$podcast = new Podcast([
    'release_on_transistor' => true,
    'requires_approval' => true,
]);

PublishPodcastWorkflow::test($podcast)
    ->assertGatedJobExists(PublishToTransitorFM::class);
```

This assertion fails if the workflow contains a non-gated job with the same id.

You may also provide an array of dependencies the job should have as the second
parameter.

```php
$podcast = new Podcast([
    'release_on_transistor' => true,
    'requires_approval' => true,
]);

PublishPodcastWorkflow::test($podcast)
    ->assertGatedJobExists(
    	PublishToTransistorFM::class,
    	[ProcessPodcast::class, OptimizePodcast::class]
	);
```

This checks for an **exact** match of the job’s dependencies so be sure to
provide all dependencies the job should have.

### `assertWorkflowExists` {#assert-workflow-exists}

The `assertWorkflowExists` method asserts that a workflow contains a nested
workflow with the provided ID.

```php
$podcast = new Podcast([
    'encode_flac' => true,
]);

PublishPodcastWorkflow::test($podcast)
    ->assertWorkflowExists(FlacPodcastWorkflow::class);
```

You may also provide an array of dependencies the workflow should have as the
second parameter.

```php
$podcast = new Podcast([
    'encode_flac' => true,
]);

PublishPodcastWorkflow::test($podcast)
    ->assertWorkflowExists(
    	FlacPodcastWorkflow::class,
    	[ProcessPodcast::class],
	);
```

This checks for an **exact** match of the workflow’s dependencies so be sure to
provide all dependencies the workflow should have.

::: warning Note

`assertWorkflowExists` does **not** work recursively, meaning it will always
return `false` when checking for a workflow that is part of another nested
workflow. You shouldn't test the internals of your dependencies. Instead, write
another test for `EncodePodcastWorkflow` and check for the nested workflow
there.

:::

### `assertWorkflowMissing` {#assert-workflow-missing}

The `assertWorkflowMissing` method asserts that a workflow does not contain a
nested workflow with the provided ID.

```php
$podcast = new Podcast([
    'encode_flac' => false,
]);

PublishPodcastWorkflow::test($podcast)
    ->assertWorkflowMissing(FlacPodcastWorkflow::class);
```

## Testing workflow callbacks

Venture comes with test helpers to help you test your workflow’s `then` and
`catch` callbacks. All examples in this section assume the following workflow.

```php
<?php

use Throwable;
use App\Models\Podcast;
use App\Notifications\PodcastFailedToPublish;
use App\Notifications\PodcastWasPublished;
use Sassnowski\Venture\AbstractWorkflow;
use Sassnowski\Venture\Models\Workflow;
use Sassnowski\Venture\WorkflowDefinition;
use Sassnowski\Venture\WorkflowableJob;

class PublishPodcastWorkflow extends AbstractWorkflow
{
    public function __construct(private Podcast $podcast)
    {
    }

    public function definition(): WorkflowDefinition
    {
        return $this->define('Publish Podcast')
            ->addJob(...)
            ->then(function (Workflow $workflow) {
            	$this->podcast->user->notify(
                    new PodcastWasPublished($podcast),
                );
            })
            ->catch(function (Workflow $workflow, WorkflowableJob $failedJob, Throwable $exception) {
                $this->podcast->user->notify(
                    new PodcastFailedToPublish($podcast),
                );
            });
    }
}
```

### Testing the `then` callback

You may test the workflow’s `then` callback by using the `runThenCallback`
method on the `WorkflowTester`

```php
<?php

use App\Models\Podcast;
use App\Notifications\PodcastWasPublished;
use App\Workflows\PublishPodcastWorkflow;
use Illuminate\Support\Facades\Notification;
use Sassnowski\Venture\Models\Workflow;
use Tests\TestCase;

class PublishPodcastWorkflowTest extends TestCase
{
	public function testNotifyUserAfterWorkflowWasPublished()
	{
    	Notification::fake();
	    $podcast = Podcast::factory()->create();

    	PublishPodcastWorkflow::test($podcast)
            ->runThenCallback();

        Notification::assertSentTo(
            [$podcast->user],
            PodcastWasPublished::class,
        )
	}
}
```

If you want to configure the `Workflow` model that gets passed to the `then`
callback, you may optionally pass a callback to the `runThenCallback` method.

```php
PublishPodcastWorkflow::test($podcast)
    ->runThenCallback(function (Workflow $workflow) {
    	$workflow->update(['finished_at' => now()->subDay()]);
    });
```

### Testing the `catch` callback

You may teste the `catch` callback of your workflow by using the
`runCatchCalback` method on the `WorkflowTester`. This method expects both the
failed job as well as the exception that occurred while executing the job as
parameters.

```php
<?php

use App\Exceptions\EncodingException;
use App\Jobs\EncodePodcast;
use App\Models\Podcast;
use App\Notifications\PodcastFailedToPublish;
use App\Workflows\PublishPodcastWorkflow;
use Illuminate\Support\Facades\Notification;
use Sassnowski\Venture\Models\Workflow;
use Tests\TestCase;

class PublishPodcastWorkflowTest extends TestCase
{
	public function testNotifyUserAfterWorkflowWasPublished()
	{
    	Notification::fake();
	    $podcast = Podcast::factory()->create();

    	PublishPodcastWorkflow::test($podcast)
            ->runCatchCallback(
            	new EncodePodcast($podcast),
            	new EncodingException(),
        	);

        Notification::assertSentTo(
            [$podcast->user],
            PodcastFailedToPublish::class,
        )
	}
}
```

If you want to configure the `Workflow` model that gets passed to the `catch`
callback, you may pass an optional callback as the third parameter to the
`runCatchCallback` method.

```php
PublishPodcastWorkflow::test($podcast)
    ->runCatchCallback(
    	new EncodePodcast($podcast),
		new EncodingException(),
        function (Workflow $workflow) {
            $workflow->cancel();
        },
	);
```
