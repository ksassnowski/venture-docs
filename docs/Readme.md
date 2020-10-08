# Laravel Workflow

Laravel Workflow is a package to build and manage complex workflows of interdependant jobs using Laravel's queueing system.

```php
Workflow::withInitialJobs([
    new ProcessPodcast($podcast),
    new OptimizePodcast($podcast),
])
  ->addJob(new ReleaseOnTransistorFM($podcast), [
      // These are the jobs dependencies. The job will only
      // run when both of these jobs have finished.
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
  ]);
  ->addJob(new SendTweetAboutNewPodcast($podcast), [
      CreateAudioTranscription::class,
      ReleaseOnTransistorFM::class,
      ReleaseOnApplePodcasts::class,
  ])
  ->start();
```

This would create a workflow that looks like this:

![](/workflow.svg)

The package will take care of running the jobs in the correct order--parallelizing jobs that don't have any interdependencies--and waiting for all dependencies of a job to be resolved before starting it. It also provides a way to inspect a workflow and each of its jobs.
