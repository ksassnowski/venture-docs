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

This definition is pretty straight forward, it's straight up configuration. But now imagine your writing a podcasting platform that allows users to configure on which platforms they want to publish their podcasts. Now your definition might look something like this.

```php
public function definition(): WorkflowDefinition
{
    $workflow = Workflow::define('Publish Podcast');

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

Again, this is something that you probably want to test to validate that the jobs get scheduled with the correct delay. It gets even more complicated if you combine these two things.

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

## Inspecting Definitions

### Job exists

### Job exists with dependencies

### Job exists with delay
