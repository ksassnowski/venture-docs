# Venture

<div style="text-align: center">
    <img src="/logo.svg" />
</div>

Venture is a package to help you build and manage complex workflows of interdependent jobs using Laravel's queueing system.

```php
Workflow::new('Publish new podcast')
    ->addJob(new ProcessPodcast($podcast))
    ->addJob(new OptimizePodcast($podcast))
    ->addJob(new ReleaseOnTransistorFM($podcast), [
        // These are the job's dependencies. The job will only
        // run when all of its dependencies have finished.
        ProcessPodcast::class,
        OptimizePodcast::class
    ])
    ->addJob(new ReleaseOnApplePodcasts($podcast), [
        ProcessPodcast::class,
        OptimizePodcast::class
    ])
    ->addJob(new CreateAudioTranscription($podcast), [
        ProcessPodcast::class,
    ])
    ->addJob(new TranslateAudioTranscription($podcast), [
        CreateAudioTranscription::class,
    ])
    ->addJob(new NotifySubscribers($podcast), [
        ReleaseOnTransistorFM::class,
        ReleaseOnApplePodcasts::class,
    ])
    ->addJob(new SendTweetAboutNewPodcast($podcast), [
        TranslateAudioTranscription::class,
        ReleaseOnTransistorFM::class,
        ReleaseOnApplePodcasts::class,
    ])
    ->start();
```

This would create a workflow that looks like this:

![](/workflow.svg)

The package will take care of running the jobs in the correct order--parallelizing jobs that don't have any interdependencies--and waiting for all dependencies of a job to be resolved before starting it. It also provides a way to inspect a workflow and each of its jobs.
