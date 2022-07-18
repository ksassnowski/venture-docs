# Defining Workflows

Workflows are the main concept inside Venture. A workflow defines both the jobs that belong to it as well as how these jobs are connected with each other. This allows you to build up complex processes from simple building blocks.

## Creating workflows

Workflows are defined as classes that extend from `AbstractWorkflow`. The `AbstractWorkflow` class defines an abstract method `definition` that you will have to implement.

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
        return $this->define('Publish new podcast');
    }
}
```

The `define` method accepts the name of the workflow and returns an empty `WorkflowDefinition` object. Since a workflow without any jobs isn’t very useful, let’s look at how to add jobs next.

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

In this example, we have added two jobs to the workflow. Since we haven’t defined any dependencies for these jobs, both of them would be started in parallel when you start the workflow.

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


::: details Direct and transitive dependencies
If we look at the diagram above, `TranslateAudioTranscription` has a _direct_ dependency on `CreateAudioTranscription`. `CreateAudioTranscription` in turn has a dependency on `ProccessPodcast`. This makes `ProcessPodcast` a _transitive_ dependency of `TranslateAudioTranscription` (think dependency of a dependency).

You don't have to worry about how exactly a job fits into a workflow, however. All you need to know is what other jobs a job _directly depends_ on and Venture will figure out the rest.
:::

::: tip Multiple instances of the same job
Since you specify the dependencies of a job by using class names, you might be wondering what happens if the workflow contains multiple instances of the same job. To learn how to deal with this situation, check out the section on [using multiple instances of the same job](/usage/duplicate-jobs).
:::

## Naming jobs

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

## Adding closures as jobs

Venture also allows you to add closures to a workflow.

```php
$this->define('My Workflow')
    ->addJob(function () {
      	Log::info('Star Wars is fantasy, change my mind');
    }, id: 'log-truth');
```

When adding a Closure to a workflow, you **must** specify an explicit ID for the job, since there is no class name to fall back on. You can specify the ID of a job by providing the `id` parameter of the `addJob` method.

You may typehint any dependencies that the Closure needs and they will be resolved out of Laravel’s container when the job gets executed.

```php
$this->define('My Workflow')
    ->addJob(function (TruthGenerator $truths) {
      	Log::info($truths->getHotTake());
    }, id: 'log-truth');
```

## Gated jobs

By default, a job will get dispatched automatically as soon as all of its dependencies have successfully run. Sometimes, it might be useful to require that certain jobs need to be started manually, even if their dependencies have finished. Venture supports this by allowing you to add **gated jobs** to a workflow.

To add a gated job, you may use the `addGatedJob` method when defining your workflow.

```php{8-10}
$this->define('Publish Podcast')
    ->addJob(new ProcessPodcast($this->podcast))
    ->addJob(new OptimizePodcast($this->podcast))
    ->addJob(new PublishOnTransistorFM($this->podcast), [
        ProcessPodcast::class,
        OptimizePodcast::class,
    ])
    ->addGatedJob(new NotifySubscribers($this->podcast), [
        PublishOnTransistorFM::class,
    ]);
```

In this example,  `NotifySubscribers`  depends on `PublishOnTransistorFM`. However, it won't get started automatically after `PublishOnTransistorFM` finished. Instead, it will be marked as **gated**.

You can check if a job is gated by calling the `isGated` method on the `WorkflowJob` instance.

```php
// Fetch the job by querying the `jobs` relation on the `Workflow` model.
$job = $workflow
  ->jobs()
  ->where('name', NotifySubscribers::class)
  ->first();

$job->isGated();
// => true
```

Note that `isGated` will return `false` if the job’s dependencies have not been finished yet. In other words, if `isGated` returns `true`, it means that the job is ready to run but needs to be started manually.

To start a gated job, you may call the `start` method on the job.

```php
// $job is the same `WorkflowJob` instance from above
$job->start();
```

After a gated job was started, that branch of the workflow will continue evaluating as normal.

## Delaying a job

If you don't want to immediately execute a job as soon as it can be run, you can define a delay for it. To do so, you may call the `withDelay` method on the job.

```php
$this->define('Publish new podcast')
    ->addJob((new ProcessPodcast($podcast))->delay(now()->addDay()));
```

This Laravel’s built-in delayed dispatching feature. For more information check Laravel's [documentation](https://laravel.com/docs/9.x/queues#delayed-dispatching) on the topic.

## Conditional Jobs

Sometimes, it might be useful to only add a job or nested workflow to a workflow if a certain condition is true. To do so, you may use the `when` method when defining your workflow.

```php{13-18}
class PublishPodcastWorkflow extends AbstractWorkflow
{
  public function __construct(
    private User $user,
    private Podcast $podcast,
  ) {
  }
  
  public function definition(): WorkflowDefinition
  {
    return $this->define('Publish Podcast')
      ->addJob(new ProcessPodcast($this->podcast))
      ->when($this->user->is_pro, function (WorkflowDefinition $definition) {
          $definition->addJob(
              new OptimizePodcast($this->podcast),
              [ProcessPodcast::class],
          );
      });
  }
}
```

If the first parameter passed to the `when` method is truthy, the provided callback gets called with the current `WorkflowDefinition`. You can then add jobs or workflows as normal.

The `when` method also takes an optional, third parameter which gets called with the current `WorkflowDefinition` if the value is falsy.

```php{8-15}
return $this->define('Publish Podcast')
    ->addJob(new ProcessPodcast($this->podcast))
    ->when($this->user->is_pro, function (WorkflowDefinition $definition) {
        $definition->addJob(
            new OptimizePodcast($this->podcast),
            [ProcessPodcast::class],
        );
      }, function (WorkflowDefinition $definition) {
        $definition
            ->addJob(
                new DowngradePodcastQuality($this->podcast),
                [ProcessPodcast::class],
	          )
            ->addJob(new SendUpsellingEmail($this->user));
      });
```

The example above produces two possible workflows. If the user is a pro user, the resulting workflow looks like this:

**insert graph**

If the user isn’t a pro user, the workflow looks like this instead:

**insert graph**

### Depending on conditional jobs

Conditional jobs can change the structure of a workflow. You might be wondering how to deal with a situation where a job should depend on different jobs, depending on whether a certain job was added to the workflow or not.

Let’s look at the example from above. Say we want to add a job called  `PublishOnTransistorFM`. If the user is a pro user, this job should run after `OptimizePodcast` has finshed. If the user isn’t a pro user, it should run after `DowngradePodcastQuality` has finished.

To deal with this, you may use the `ConditionalDependency` class that comes with Venture.

```php{1,21-24}
use Sassnowski\Venture\Graph\ConditionalDependency;

return $this->define('Publish Podcast')
    ->addJob(new ProcessPodcast($this->podcast))
    ->when($this->user->is_pro, function (WorkflowDefinition $definition) {
        $definition->addJob(
            new OptimizePodcast($this->podcast),
            [ProcessPodcast::class],
        );
      }, function (WorkflowDefinition $definition) {
        $definition
            ->addJob(
                new DowngradePodcastQuality($this->podcast),
                [ProcessPodcast::class],
	          )
            ->addJob(new SendUpsellingEmail($this->user));
      })
  		->addJob(
          new PublishOnTransistorFM($this->podcast),
          [
              ConditionalDependency::whenDefined(
                  OptimizePodcast::class, 
                  DowngradePodcastQuality::class
              ),
          ],
      );
```

If the `OptimizePodcast` job exists in the workflow, it would get added as a dependency for the `PublishOnTransistorFM` job. If not, `PublishOnTransistorFM` would depend on `DowngradePodcastQuality` instead.

:::tip Testing workflow definitions
Things are starting to get complicated now! You might also want to check out the section on how to go about [testing your workflow definitions](/testing/testing-workflow-definitions).
:::

Conditional dependencies can be combined with regular dependencies, too.

```php
$this->define('Publish Podcast')
			// ...
    ->addJob(
        new PublishOnTransistorFM($this->podcast),
            [
                SomeOtherJob::class,
                ConditionalDependency::whenDefined(
                    OptimizePodcast::class, 
                    DowngradePodcastQuality::class,
                ),
          ],
      );
```

You can also leave out the second parameter to the `whenDefined` method. In this case, the dependency will be completely removed from the job if no corresponding job exists in the workflow. If that leaves a job without any dependencies, it will be dispatched immediately after the workflow starts.

## Queue connection of jobs

Since workflow jobs are just regular Laravel jobs, you have multiple options of specifying the queue connection for each job.

### Specify a default connection inside the job class

You can set the default connection in the `connection` property of your model:

```php{5}
class OptimizePodcast implements WorkflowStepInterface
{
  use WorkflowStep;
  
  public $connection = 'high-priority';
  
  public function handle(): void
  {
    // ...
  }
}
```

### Setting the connection on a job instance

In case you want to specify the connection for a job at runtime, you can call the `onConnection` method on the job instance. This will override any potential default queue defined by the job class’ `$connection` property.

```php
$this->define('Publish Podcast')
  ->addJob((new OptimizePodcast())->onConnection('high-priority'));
```

### Defining the connection for all jobs of a workflow

Sometimes it might be useful to set the connection for all jobs of a workflow. In these cases you may use the `allOnConnection` method when defining your workflow.

```php{6}
class PublishPodcastWorkflow extends AbstractWorkflow
{
  public function define(): WorkflowDefinition
  {
    return $this->define('Publish Podcast')
      ->allOnConnection('high-priority')
      ->addJob(new ProcessPodcast())
      ->addJob(new OptimizePodcast());
  }
}
```

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
