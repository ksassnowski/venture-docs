# Configuring Workflows

[[toc]]

## Create a new workflow builder

Now you're ready to create your first workflow. To start, call the static `new` method on the `Workflow` class and give your workflow a name.

```php
use Sassnowski\Venture;

Workflow::new('Publish new podcast');
```

When you later fetch a workflow from the database, you can retrieve its name via `$workflow->name`.

## Adding jobs to a workflow

In order to add a job to a workflow, use the `addJob` method on the workflow builder and pass an instance of a job to it.

```php
$podcast = Podcast::find(1);

Workflow::new('Publish new podcast')
    ->addJob(new ProcessPodcast($podcast))
    ->addJob(new OptimizePodcast($podcast));
```

### Jobs with dependencies

Venture really starts to shine once you start adding jobs that have dependencies. To define a job's dependencies, pass in an array of class names as the second parameter to the `addJob` method.

```php{4-7}
Workflow::new('Publish new podcast')
    ->addJob(new ProcessPodcast($podcast))
    ->addJob(new OptimizePodcast($podcast))
    ->addJob(new PublishPodcastOnTransistorFM($podcast), [
        ProcessPodcast::class,
        OptimizePodcast::class
    ]);
```

In this example you're telling Venture that the `PublishPodcastOnTransistorFM` job can only run once both `ProcessPodcast` and `OptimizePodcast` have finished.

The workflow we have configured so far would look like this.

<div style="text-align: center;">
    <img src="/workflow-3.svg" />
</div>

From this point, you can keep adding jobs to the workflow and it will keep track of all dependencies. All you need to do is to define a job's direct dependencies.

```php
Workflow::new('Publish new podcast')
    ->addJob(new ProcessPodcast($podcast))
    ->addJob(new OptimizePodcast($podcast))
    ->addJob(new PublishPodcastOnTransistorFM($podcast), [
        ProcessPodcast::class,
        OptimizePodcast::class
    ])
    ->addJob(new PublishPodcastOnApplePodcasts($podcast), [
        ProcessPodcast::class,
        OptimizePodcast::class
    ])
    ->addJob(new CreateAudioTranscription($podcast), [
        ProcessPodcast::class,
    ])
    ->addJob(new TranslateAudioTranscription($podcast), [
        CreateAudioTranscription::class,
    ]);
```

<div style="text-align: center;">
    <img src="/workflow-4.svg" />
</div>

::: tip Direct and transitive dependencies
If we look at the diagram above, `TranslateAudioTranscription` has a _direct_ dependency on `CreateAudioTranscription`. `CreateAudioTranscription` in turn has a dependency on `ProccessPodcast`. This makes `ProcessPodcast` a _transitive_ dependency of `TranslateAudioTranscription` (think dependency of a dependency).

Luckily, you don't have to worry about how exactly a job fits into a workflow. All you need to know is what a jobs _direct_ dependencies are and Venture will figure out the rest.
:::

::: warning Note
Since Venture is still in early development, there are few caveats for defining worklows. For example you can't have multiple instances of the same job within a workflow. Check the [Caveats and limiations](/usage/caveats-and-limitations) page for more information.
:::

### Naming jobs

If you want, you can provide an optional name for a job that will be saved in the database. If not, the class name will be used.

```php
Workflow::start('Publish new podcast')
    ->addJob(new ProcessPodcast($podcast), [], 'Process podcast');
```

::: tip Tip
If you plan on displaying the workflow jobs to your users, you could pass in a translation string as the job name. This way you would be able to display the localized name of the job in the UI by using Laravel's built-in [localization features](https://laravel.com/docs/8.x/localization).
:::

## Delaying a job

If you don't want to immediately execute a job as soon as it can be run, you can define a delay for it. Laravel jobs already ship with this feature, so you could simply call the `delay` method on your job instance like this.

```php{2}
$workflow = Workflow::new('Publish new podcast')
    ->addJob((new ProcessPodcast($podcast))->delay(now()->addDay()));
```

However, this can quickly become quite cluttered and difficult to read. For this reason, Venture allows you to pass in a `$delay` parameter to the `addJob` method.

```php{2}
$workflow = Workflow::new('Publish new podcast')
    ->addJob(new ProcessPodcast($podcast), [], 'Process Podcast', now()->addDay());
```

::: warning NOTE
Your job class needs to be using the `Illuminate\Bus\Queueable` trait to support this. For more information check Laravel's [documentation](https://laravel.com/docs/8.x/queues#delayed-dispatching) on the topic.
:::

## Starting a workflow

To start a workflow, call the `start` method once you have finished configuring it. This will return an instance of a `Workflow` model.

```php{5}
$workflow = Workflow::new('Publish new podcast')
    ->addJob(new ProcessPodcast($podcast))
    ->addJob(new OptimizePodcast($podcast))
    // ...
    ->start();
```

Venture will now figure out which jobs can be immediately dispatched–because they don't have any dependencies–and process them in parallel. Every time a job finishes, it will check if any of the job's _dependant_ jobs are now ready to be run. If so, it will dispatch them.

:::tip Dependant jobs and dependencies
A _dependant_ job is a job that is waiting for another job to finish. In other words, if `JobB` needs `JobA` to finish before it can run, `JobB` is a dependant on `JobA`.
:::
