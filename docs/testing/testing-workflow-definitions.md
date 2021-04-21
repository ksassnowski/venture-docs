# Testing workflow definitions

[[toc]]

## Rationale

You might wonder why testing workflows definitions is necessary at all. Aren't they simply configuration? Let's have a look at an abbreviated example from the docs: publishing a podcast.

```php
class PublishPodcastWorkflow extends AbstractWorkflow
{
    private Podcast $podcast;

    public function __construct(Podcast $podcast)
    {
        $this->podcast = $podcast;
    }

    public function definition(): WorkflowDefinition
    {
        return Workflow::define('Publish Podcast')
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
    $workflow = Workflow::define('Publish Podcast')
        ->addJob(new ProcessPodcast($this->podcast));

    if ($this->podcast->publish_on_apple_podcasts) {
        $workflow->addJob(new ReleaseOnApplePodcasts($this->podcast));
    }

    if ($this->podcast->publish_on_transistor_fm) {
        $workflow->addJob(new ReleaseOnTransistorFM($this->podcast));
    }

    return $workflow;
}
```

Now, there are 4 paths through this function:

- Publish only on Apple Podcasts
- Publish only on Transistor
- Publish to both Apple Podcasts and Transistor
- Don't publish to either platform

This is something you should probably test.

Another example could be to schedule the release of the podcast ahead of time, but still perform all the processing and optimizing as soon as possible.

```php
public function definition(): WorkflowDefinition
{
    return Workflow::define('Publish Podcast')
        ->addJob(new ProcessPodcast($this->podcast))
        ->addJob(new OptimizePodcast($this->podcast), [ProcessPodcast::class])
        ->addJobWithDelay(
            new ReleaseOnApplePodcasts($this->podcast),
            $podcast->release_date,
            [OptimizePodcast::class]
        )
        ->addJobWithDelay(
            new ReleaseOnTransistorFM($this->podcast),
            $podcast->release_date,
            [OptimizePodcast::class]
        );
}
```

In this example, you might want to test that `ReleaseOnTransistorFM` and `ReleaseOnApplePocasts` get scheduled with the correct delay. It gets even more complicated if you combine these two features.

```php
public function definition(): WorkflowDefinition
{
    $workflow = Workflow::define('Publish Podcast')
        ->addJob(new ProcessPodcast($this->podcast))
        ->addJob(new OptimizePodcast($this->podcast), [ProcessPodcast::class]);

    if ($this->podcast->release_on_apple_podcasts) {
        $workflow->addJobWithDelay(
            new ReleaseOnApplePodcasts($this->podcast),
            $podcast->release_date,
            [OptimizePodcast::class]
        );
    }

    if ($this->podcast->release_on_transistor) {
        $workflow->addJobWithDelay(
            new ReleaseOnTransistorFM($this->podcast),
            $podcast->release_date,
            [OptimizePodcast::class]
        );
    }

    return $workflow;
}
```

I think you get the point by now but let's take it one step further to really drive the point home.

Let's assume that podcast optimization is a paid feature on your platform. As such, you give users an option to enable or disable it on a per-podcast basis.

This is a really interessting example because the dependency graph of your workflow actually changes depending on what the user selects. If podcast optimization is turned off, the `ReleaseOnTransistorFM` and `ReleaseOnApplePodcast` jobs should _not_ depend on the `OptimizePodcast` job (otherwise the workflow will throw an exception about an unresolvable dependency). In this case, they should depend on the `ProcessPodcast` job instead.

```php
public function definition(): WorkflowDefinition
{
    $workflow = Workflow::define('Publish Podcast')
        ->addJob(new ProcessPodcast($this->podcast));

    if ($this->podcast->optimization_enabled) {
        $workflow->addJob(new OptimizePodcast($this->podcast), [
            ProcessPodcast::class,
        ]);
    }

    if ($this->podcast->release_on_apple_podcasts) {
        $workflow->addJobWithDelay(
            new ReleaseOnApplePodcasts($this->podcast),
            $this->podcast->release_date,
            // Depend on different steps based on what was selected...
            $this->podcast->optimization_enabled
                ? [OptimizePodcast::class]
                : [ProcessPodcast::class]
        );
    }

    if ($this->podcast->release_on_transistor) {
      $workflow->addJobWithDelay(
            new ReleaseOnTransitorFM($this->podcast),
            $this->podcast->release_date,
            // Depend on different steps based on what was selected...
            $this->podcast->optimization_enabled
                ? [OptimizePodcast::class]
                : [ProcessPodcast::class]
        );
    }

    return $workflow;
}
```

This single workflow can now take on very different shapes depending on its input. For cases like these, Venture provides you with a few helper methods that allow you to check your workflow definitions for correctness.

## Inspecting Definitions

### Job exists

To check that a workflow contains a specific job, you can call the `hasJob` method on your workflow definition. This will return a boolean to indicate if the given job is part of the workflow.

```php
$podcast = new Podcast(['optimization_enabled' => true]);
$workflowDefinition = (new PublishPodcast($podcast))->definition();

$actual = $workflowDefinition->hasJob(OptimizePodcast::class);

$this->assertTrue($actual);
```

### Job exists with dependencies

You can also check if a job is part of the workflow and has the correct dependencies. To do this, you can use the `hasJobWithDependencies` method on the definition.

```php
$podcast = new Podcast([
    'optimization_enabled' => true
    'release_on_apple_podcasts' => true,
]);
$workflowDefinition = (new PublishPodcast($podcast))->definition();

$hasJob = $workflowDefinition->hasJobWithDependencies(
    ReleaseOnApplePodcasts::class,
    [OptimizePodcast::class]
);

$this->assertTrue($hasJob);
```

::: warning Note
`hasJobWithDependencies` checks for an **exact** match of the job's dependencies so be sure to provide all dependencies the job should have.
:::

### Job exists with delay

To verify that a job will be queued with the correct delay, you can use the `hasJobWithDelay` method on the workflow definition.

```php
Carbon::setTestNow(now());
$podcast = new Podcast([
    'release_date' => now()->addDay(),
    'release_on_apple_podcasts' => true,
]);
$workflowDefinition = (new PublishPodcast($podcast))->definition();

$hasJobWithDelay = $workflowDefinition->hasJobWithDelay(
    ReleaseOnApplePodcasts::class,
    now()->addDay()
);

$this->assertTrue($hasJobWithDelay);
```

### Checking for dependencies and delay

There are two ways to check if a job has both the correct dependencies and the right delay. You can either write two separate assertions using `hasJobWithDependencies` and `hasJobWithDelay`, respectively. Or you can pass all three parameters to the `hasJob` method.

```php
// Two separate assertions
$this->assertTrue($workflowDefinition->hasJobWithDependencies(
    ReleaseOnApplePodcasts::class,
    [OptimizePodcast::class]
));
$this->assertTrue($workflowDefinition->hasJobWithDelay(
    ReleaseOnApplePodcasts::class,
    $delay
));

// One assertion
$this->assertTrue($workflowDefinition->hasJob(
    ReleaseOnApplePodcasts::class,
    [OptimizePodcast::class],
    $delay
));
```

### Workflow exists

To check that a workflow contains a nested workflow, you can use the `hasWorkflow` method on the workflow definition object.

```php
$this->assertTrue($workflowDefinition->hasWorkflow(
    EncodePodcastWorkflow::class,
    [ProcessPodcast::class]
));
```

This would check that the workflow definition contains a nested `EncodePodcastWorkflow` that depends on the `ProcessPodcast` job. If you don't care about the dependencies, you can leave out the second paramater (or pass `null`).

```php
// Just want to know that EncodePodcastWorkflow exists.
// We don't care about its dependencies.
$this->assertTrue($workflowDefinition->hasWorkflow(
    EncodePodcastWorkflow::class,
));
```

::: warning Note
`hasWorkflow` does **not** work recursively, meaning it will always return `false` when checking for a workflow that is part of another nested workflow. You shouldn't test the internals of your dependencies. Instead, write another test for `EncodePodcastWorkflow` and check for the nested workflow there.
:::
