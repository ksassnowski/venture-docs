# Testing workflow definitions

## Rationale

You might wonder why testing workflows definitions is necessary at all. Aren't they simply configuration? Let's have a look at an abbreviated example from the docs: publishing a podcast.

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

This is a pretty straight forward workflow without any branches or conditions. Not having tests for this is probably fine.

Now imagine that you're writing a podcasting platform that allows users to configure on which platforms they want to publish their podcasts. Now your definition might look something like this.

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
In case you don’t know how the `when` method works, check out the section about [adding conditional jobs to workflows](/usage/configuring-workflows#conditional-jobs).
:::

Another example could be to schedule the release of the podcast ahead of time, but still perform all the processing and optimizing as soon as possible.

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

In this example, you might want to test that `ReleaseOnTransistorFM` and `ReleaseOnApplePocasts` get scheduled with the correct delay. It gets even more complicated if you combine these two features.

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

I think you get the point by now but let's take it one step further to really drive the point home.

Let's assume that podcast optimization is a paid feature on your platform. As such, you give users an option to enable or disable it on a per-podcast basis.

This is a really interessting example because the dependency graph of your workflow actually changes depending on what the user selects. If podcast optimization is turned off, the `ReleaseOnTransistorFM` and `ReleaseOnApplePodcast` jobs should _not_ depend on the `OptimizePodcast` job (otherwise the workflow will throw an exception about an unresolvable dependency). In this case, they should depend on the `ProcessPodcast` job instead.

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
Confused about what the deal is with this `ConditionalDependency::whenDefined()` business? Check out the section about [depending on conditional jobs](/usage/configuring-workflows#depending-on-conditional-jobs) to learn more.
:::

This single workflow can now take on very different shapes depending on its input. For cases like these, Venture provides you with a few helper methods that allow you to check your workflow definitions for correctness.

## Testing workflows

Venture provides a `WorkflowTester` class which helps you test your workflows. The `WorkflowTester` wraps your actual workflow and provides you with various assertion methods to inspect the workflow.

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

As a convenience, every workflow exposes a static `test` method which returns a new `WorkflowTester` instance for the given workflow. Using this method, the above test can also be written as follows:

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

Any parameters passed to the `test` method get passed to the workflow’s constructor.

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

### `assertJobExists` {#assert-job-exists}

To check that a workflow contains a specific job, you can call the `hasJob` method on your workflow definition. This will return a boolean to indicate if the given job is part of the workflow.

```php
$podcast = new Podcast(['optimization_enabled' => true]);

PublishPodcastWorkflow::test($podcast)
    ->assertJobExists(OptimizePodcast::class);
```

**TODO**

- provide callback -> true
- provide callback -> false

### `assertJobMissing` {#assert-job-missing}

_todo_

### `assertJobExistsWithDependencies` {#assert-job-exists-with-dependencies}

You can also check if a job is part of the workflow and has the correct dependencies. To do this, you can use the `hasJobWithDependencies` method on the definition.

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
);
```

::: warning Note
`assertJobExistsWithDependencies` checks for an **exact** match of the job's dependencies so be sure to provide all dependencies the job should have.
:::

### `assertJobExistsOnConnection` {#assert-job-exists-on-connection}

_todo_

### `assertJobExistsOnQueue` {#assert-job-exists-on-queue}

_todo_

### `assertGatedJobExists` {#assert-gated-job-exists}

_todo_

### `assertWorkflowExists` {#assert-workflow-exists}

To check that a workflow contains a nested workflow, you can use the `hasWorkflow` method on the workflow definition object.

```php
$podcast = new Podcast();

PublishPodcastWorkflow::test($podcast)
    ->assertWorkflowExists(
    	EncodePodcastWorkflow::class,
    	[ProcessPodcast::class],
	);
```

This would check that the workflow definition contains a nested `EncodePodcastWorkflow` that depends on the `ProcessPodcast` job. If you don't care about the dependencies, you can leave out the second paramater (or pass `null`).

```php
// Just want to know that EncodePodcastWorkflow exists.
// We don't care about its dependencies.
$podcast = new Podcast();

PublishPodcastWorkflow::test($podcast)
    ->assertWorkflowExists(EncodePodcastWorkflow::class);
```

::: warning Note
`assertWorkflowExists` does **not** work recursively, meaning it will always return `false` when checking for a workflow that is part of another nested workflow. You shouldn't test the internals of your dependencies. Instead, write another test for `EncodePodcastWorkflow` and check for the nested workflow there.
:::

### `assertWorkflowMissing` {#assert-workflow-missing}

_todo_

## Testing workflow callbacks
