# What is Venture?

**1. Define your Workflow**

```php
class PublishNewPodcastWorkflow extends AbstractWorkflow
{
    public function __construct(private Podcast $podcast)
    {
    }

    public function definition(): WorkflowDefinition
    {
        $this->define('Publish new podcast')
            ->addJob(new ProcessPodcast($this->podcast))
            ->addJob(new OptimizePodcast($this->podcast))
            ->addJob(new ReleaseOnTransistorFM($this->podcast), [
                // These are the job's dependencies. The job will only
                // run when all of its dependencies have finished.
                ProcessPodcast::class,
                OptimizePodcast::class
            ])
            ->addJob(new ReleaseOnApplePodcasts($this->podcast), [
                ProcessPodcast::class,
                OptimizePodcast::class
            ])
            ->addJob(new CreateAudioTranscription($this->podcast), [
                ProcessPodcast::class,
            ])
            ->addJob(new TranslateAudioTranscription($this->podcast), [
                CreateAudioTranscription::class,
            ])
            ->addJob(new NotifySubscribers($this->podcast), [
                ReleaseOnTransistorFM::class,
                ReleaseOnApplePodcasts::class,
            ])
            ->addJob(new SendTweetAboutNewPodcast($this->podcast), [
                TranslateAudioTranscription::class,
                ReleaseOnTransistorFM::class,
                ReleaseOnApplePodcasts::class,
            ]);
    }
}
```

This would create a workflow that looks like this:

<div style="text-align: center">
    <img src="/workflow.svg" />
</div>

**2. Start the Workflow**

```php
PublishNewPodcastWorkflow::start($podcast);
```

Venture will take care of running the jobs in the correct order, parallelizing jobs that don't have any interdependencies and waiting for all dependencies of a job to be resolved before starting it. It also provides a way to inspect a workflow and each of its jobs.
