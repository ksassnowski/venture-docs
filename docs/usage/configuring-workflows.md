# Defining Workflows

## Creating a workflow definition

Now you're ready to create your first workflow. Workflows are defined as classes that extend from `AbstractWorkflow`. The `AbstractWorkflow` class defines an abstract method `definition` that you will have to implement.

To continue with our example of publishing a podcast, let's create a workflow called `PublishPodcastWorkflow`.

```php
use App\Podcast;
use Sassnowski\Venture\AbstractWorkflow;
use Sassnowski\Venture\WorkflowDefinition;

class PublishPodcastWorkflow extends AbstractWorkflow
{
    public function __construct(private Podcast $podcast)
    {
    }

    public function definition(): WorkflowDefinition
    {
        return $this->define('Publish new podcast')
            ->addJob(new ProcessPodcast($this->podcast))
            ->addJob(new OptimizePodcast($this->podcast));
    }
}
```

The `define` method returns a new `WorkflowDefinition` with the provided name. You can then use the definition object to add jobs to the workflow.

## Adding jobs to a workflow

To add a job to a workflow, you may call the `addJob` method on the definition instance.

```php
$this->define('Publish new podcast')
    ->addJob(new ProcessPodcast($this->podcast));
```

Venture provides a fluent interface to define workflows, so you can simply keep chaining method calls to build up your workflow.

```php
$this->define('Publish new podcast')
    ->addJob(new ProcessPodcast($this->podcast))
    ->addJob(new OptimizePodcast($this->podcast));
```

### Jobs with dependencies

Venture really starts to shine once you start adding jobs that have dependencies.

To define a job's dependencies, you may pass in an array of class names as the second parameter to the `addJob` method.

```php{4-7}
$this->define('Publish new podcast')
    ->addJob(new ProcessPodcast($podcast))
    ->addJob(new OptimizePodcast($podcast))
    ->addJob(new PublishPodcastOnTransistorFM($podcast), [
        ProcessPodcast::class,
        OptimizePodcast::class
    ]);
```

In this example, you're telling Venture that the `PublishPodcastOnTransistorFM` job can only run once both `ProcessPodcast` and `OptimizePodcast` have finished.

The workflow we have configured so far would look like this.

<div style="text-align: center;">
    <img src="/workflow-3.svg" />
</div>

From this point, you can keep adding jobs to the workflow and it will keep track of all dependencies. All you need to do is to define a job's direct dependencies.

```php
$this->define('Publish new podcast')
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


You may be wondering what happens if a workflow contains multiple instances of the same job. Luckily, that’s not a problem. Check out the section on [using multiple instances of the same job](/usage/duplicate-jobs) to learn more.

::: tip Direct and transitive dependencies
If we look at the diagram above, `TranslateAudioTranscription` has a _direct_ dependency on `CreateAudioTranscription`. `CreateAudioTranscription` in turn has a dependency on `ProccessPodcast`. This makes `ProcessPodcast` a _transitive_ dependency of `TranslateAudioTranscription` (think dependency of a dependency).

You don't have to worry about how exactly a job fits into a workflow, however. All you need to know is what other jobs a job _directly depends_ on and Venture will figure out the rest.
:::

### Naming jobs

If you want, you can provide an optional name for a job that will be saved in the database.

```php
$this->define('Publish new podcast')
    ->addJob(new ProcessPodcast($podcast), [], 'Process podcast');
```

If no explicit name is provided, the fully qualified class name (**FQCN**) of the job will be used instead.

You may access a step's name via its `$name` property.

```php
$workflow->jobs[0]->name;
// "Process podcast"
```

::: tip Tip
If you plan on displaying the workflow jobs to your users, you could pass in a translation string as the job name. This way, you would be able to display the localized name of the job in the UI by using Laravel's built-in [localization features](https://laravel.com/docs/8.x/localization).
:::

### Adding closures as jobs

_todo_

### Conditionally adding jobs

_todo_

## Delaying a job

If you don't want to immediately execute a job as soon as it can be run, you can define a delay for it. To do so, you may call the `withDelay` method on the job.

```php{2}
$workflow = $this->define('Publish new podcast')
    ->addJob((new ProcessPodcast($podcast))->delay(now()->addDay()));
```

This Laravel’s built-in delayed dispatching feature. For more information check Laravel's [documentation](https://laravel.com/docs/9.x/queues#delayed-dispatching) on the topic.

## Starting a workflow

Now that you have defined you workflow, you may start it from anywhere within you application by calling its static `start` method.

```php
$workflow = PublishPodcastWorkflow::start($podcast);
```

Any parameter you pass to the `start` method will be passed to the workflow's constructor.

The `start` method returns the `Workflow` Eloquent model for the workflow that you just started. Check out the section on [how to keep track of workflows](/usage/keeping-track-of-workflow) to learn about what you can do with this model.

Venture will now figure out which jobs can be immediately dispatched and process them in parallel. Every time a job finishes, it will check if any of the job's _dependent_ jobs are now ready to be run. If so, it will dispatch them.

### Starting workflows synchronously

_todo_

### Starting workflows on different queue connections

_todo_
