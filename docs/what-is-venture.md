# What is Venture?

Venture is a package that builds on top of Laravel’s queue system. It allows you to build complex workflows from regular Laravel jobs. You can define [dependencies between jobs](/configuring-workflows#jobs-with-dependencies), [conditionally add jobs](/onfiguring-workflows#conditional-jobs) to workflows, add [manual gates](/configuring-workflows#gated-jobs) for jobs and much more.

Venture will take care of running the jobs in the correct order, parallelizing jobs that don't have any interdependencies and waiting for all dependencies of a job to be resolved before starting it.

## Example: Publishing Podcasts

Let’s say that you’re building an application that processes and publishes user-uploaded podcasts. To do so, you application has to perform a number of steps for each uploaded podcast, such as:

- Optimize the uploaded podcast
- Create an audio transcription for the podcast
- Translate the transcription into multiple languages
- Release the podcast on various podcasting platforms
- Notify subscribers that a new podcast was published
- Publish a tweet about the new podcast

Each of these steps can be modelled as regular Laravel job. Things get more complicated once we add dependencies between these jobs, however:

- We can only translate an audio transcription after the transcription has been generated
- We can only publish the podcast after it has been optimized
- We only want to send out notifications after the podcast has actually been published and all transcriptions and translations have been generated
- …you get the point

The full process could look something like this in diagram form:

<div style="text-align: center">
    <img src="/workflow.svg" />
</div>

Venture allows you to take all your individual jobs and build a [workflow](/configuring-workflows) from them. The workflow definition for the diagram above would look like this:

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

Note how we can declaratively define dependencies between our jobs without actually having to change the way we write these jobs.

We can start this workflow for a podcast like this:

```php
$workflow = PublishNewPodcastWorkflow::start($podcast);
```

From this point on, Venture takes care of everything else. It immediately dispatches all jobs that don’t have any dependencies so they can be processed in parallel. Jobs get dispatched automatically once all dependencies have successfully been processed. For example, after both `ReleaseOnApplePodcasts` and `ReleaseOnTransistorFM`  have finished, Venture will automatically dispatch the `NotifySubscribers` job since it depended on both of these jobs.

Not only that, Venture also allows you to [inspect the state](/keeping-track-of-workflows) of started workflows. This allows you to show the state of a workflow to your user, for example.

```php
$workflow->isFinished();

$workflow->getRemainingJobs();
```
