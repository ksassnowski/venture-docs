# Configuring Workflows

Now you're ready to create your first workflow. To start, call the static `new` method on the `Workflow` class and give your workflow a name.

```php
use Sassnowski\Venture;

Workflow::new('Publish new podcast');
```

When you later fetch a workflow from the database, you can retrieve its name via `$workflow->name`.

## Adding jobs to a workflow

In order to add a job to a workflow, you use the `addJob` method on the workflow builder and pass an instance of a job to it.

```php
$podcast = Podcast::find(1);

Workflow::new('Publish new podcast')
    ->addJob(new ProcessPodcast($podcast))
    ->addJob(new OptimizePodcast($podcast));
```

### Jobs with dependencies

Venture really starts to shine once you start adding jobs that have dependencies. To define a job's dependencies, you pass in an array of class names as the second parameter to the `addJob` method.

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

![](/workflow-3.svg)

From this point, you can simply keep adding jobs to the workflow and it will keep track all dependencies. All you need to do is to define a job's immediate dependencies.

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

![](/workflow-4.svg)

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
If you plan on displaying the workflow jobs to your users, you pass in a translation string as the job name. This way you would be able to the localized name of the job in the UI.
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

The workflow will now figure out which jobs can be immediately dispatched–because they don't have any dependencies–and process them in parallel. Every time a job finishes, it will check if any of the job's _dependant_ jobs are now ready to run. If so, it will dispatch them.

:::tip Dependant jobs and dependencies
A _dependant_ job is a job that is waiting for another job to finish. In other words, if `JobB` needs `JobA` to finish before it can run, `JobB` is a dependant on `JobA`.
:::
